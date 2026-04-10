/**
 * Messages Service
 * DM tra utenti (lista conversazioni, messaggi, invio, segna come letto)
 */

import { supabase } from './supabase';

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface ConversationPreview {
  otherUserId: string;
  otherUserName: string | null;
  otherUserAvatar: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export class MessagesService {
  /**
   * Lista conversazioni per l'utente corrente (ultimo messaggio + conteggio non letti)
   */
  static async getConversations(userId: string): Promise<ConversationPreview[]> {
    const { data: sent } = await supabase
      .from('messages')
      .select('recipient_id, content, created_at')
      .eq('sender_id', userId);

    const { data: received } = await supabase
      .from('messages')
      .select('sender_id, content, created_at, is_read')
      .eq('recipient_id', userId);

    const otherIds = new Set<string>();
    (sent || []).forEach((r) => otherIds.add(r.recipient_id));
    (received || []).forEach((r) => otherIds.add(r.sender_id));

    if (otherIds.size === 0) return [];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', Array.from(otherIds));

    const profileMap = new Map(
      (profiles || []).map((p) => [p.id, { name: p.full_name, avatar: p.avatar_url }])
    );

    const all: { otherId: string; content: string; created_at: string; isRead?: boolean }[] = [];
    (sent || []).forEach((r) => all.push({ otherId: r.recipient_id, content: r.content, created_at: r.created_at }));
    (received || []).forEach((r) =>
      all.push({ otherId: r.sender_id, content: r.content, created_at: r.created_at, isRead: r.is_read })
    );
    all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const byOther = new Map<string, ConversationPreview>();
    for (const m of all) {
      if (byOther.has(m.otherId)) continue;
      const profile = profileMap.get(m.otherId);
      const unreadCount = (received || []).filter(
        (r) => r.sender_id === m.otherId && !r.is_read
      ).length;
      byOther.set(m.otherId, {
        otherUserId: m.otherId,
        otherUserName: profile?.name ?? null,
        otherUserAvatar: profile?.avatar ?? null,
        lastMessage: m.content,
        lastMessageAt: m.created_at,
        unreadCount,
      });
    }
    return Array.from(byOther.values());
  }

  /**
   * Messaggi tra due utenti (thread)
   */
  static async getMessages(
    currentUserId: string,
    otherUserId: string
  ): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId})`
      )
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as Message[];
  }

  /**
   * Invia messaggio
   */
  static async sendMessage(
    senderId: string,
    recipientId: string,
    content: string
  ): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as Message;
  }

  /**
   * Segna messaggi come letti (es. quando l'utente apre la conversazione)
   */
  static async markAsRead(
    recipientId: string,
    senderId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('recipient_id', recipientId)
      .eq('sender_id', senderId)
      .eq('is_read', false);

    if (error) throw error;
  }
}
