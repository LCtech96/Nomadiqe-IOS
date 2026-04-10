/**
 * Support Service
 * Richieste assistenza: creazione ticket, messaggi, notifiche admin/utente
 */

import { supabase } from './supabase';
import { NotificationsService } from './notifications.service';
import { ProfilesService } from './profiles.service';
import { ADMIN_EMAILS } from '../constants/admin';

const BUCKET_SUPPORT = 'support';

export type SupportTicketStatus = 'open' | 'replied' | 'closed';

export interface SupportTicket {
  id: string;
  user_id: string;
  device: string | null;
  request_type: string;
  status: SupportTicketStatus;
  user_last_read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportTicketAttachment {
  id: string;
  support_ticket_id: string;
  file_url: string;
  created_at: string;
}

export interface SupportTicketMessage {
  id: string;
  support_ticket_id: string;
  sender_id: string;
  sender_type: 'user' | 'admin';
  body: string;
  created_at: string;
}

export interface SupportTicketWithDetails extends SupportTicket {
  attachments: SupportTicketAttachment[];
  messages: SupportTicketMessage[];
}

export class SupportService {
  /**
   * Crea un nuovo ticket con messaggio iniziale e allegati (max 5)
   */
  static async createTicket(
    userId: string,
    data: {
      device: string;
      requestType: string;
      message: string;
      imageUris: string[];
    }
  ): Promise<SupportTicket> {
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: userId,
        device: data.device || null,
        request_type: data.requestType,
        status: 'open',
      })
      .select()
      .single();

    if (ticketError) throw ticketError;

    await supabase.from('support_ticket_messages').insert({
      support_ticket_id: ticket.id,
      sender_id: userId,
      sender_type: 'user',
      body: data.message,
    });

    if (data.imageUris.length > 0) {
      await supabase.from('support_ticket_attachments').insert(
        data.imageUris.slice(0, 5).map((file_url) => ({
          support_ticket_id: ticket.id,
          file_url,
        }))
      );
    }

    const adminIds = await ProfilesService.getProfileIdsByEmails(ADMIN_EMAILS);
    const title = 'Nuova richiesta assistenza';
    const message = `Dispositivo: ${data.device || '-'} | Tipo: ${data.requestType}`;
    await Promise.all(
      adminIds.map((adminId) =>
        NotificationsService.create(
          adminId,
          'support_new',
          title,
          message,
          ticket.id
        )
      )
    );

    return ticket as SupportTicket;
  }

  /**
   * Ticket dell'utente (il più recente per la conversazione)
   */
  static async getMyTickets(userId: string): Promise<SupportTicket[]> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as SupportTicket[];
  }

  /**
   * Dettaglio ticket con messaggi e allegati
   */
  static async getTicketWithDetails(ticketId: string): Promise<SupportTicketWithDetails | null> {
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) return null;

    const [attachmentsRes, messagesRes] = await Promise.all([
      supabase
        .from('support_ticket_attachments')
        .select('*')
        .eq('support_ticket_id', ticketId)
        .order('created_at'),
      supabase
        .from('support_ticket_messages')
        .select('*')
        .eq('support_ticket_id', ticketId)
        .order('created_at'),
    ]);

    return {
      ...(ticket as SupportTicket),
      attachments: (attachmentsRes.data || []) as SupportTicketAttachment[],
      messages: (messagesRes.data || []) as SupportTicketMessage[],
    };
  }

  /**
   * Aggiorna user_last_read_at (utente ha aperto la conversazione)
   */
  static async markTicketAsReadByUser(ticketId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('support_tickets')
      .update({
        user_last_read_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Conta notifiche di tipo support_reply non lette per l'utente (badge)
   */
  static async getUnreadSupportCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', 'support_reply')
      .eq('read', false);

    if (error) return 0;
    return count ?? 0;
  }

  /**
   * Segna come lette le notifiche support_reply per un ticket (quando l'utente apre la conversazione)
   */
  static async markSupportNotificationsReadForTicket(
    userId: string,
    ticketId: string
  ): Promise<void> {
    const { data: notifs } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'support_reply')
      .eq('related_id', ticketId)
      .eq('read', false);

    if (notifs?.length) {
      await Promise.all(notifs.map((n) => NotificationsService.markAsRead(n.id)));
    }
  }

  /**
   * Aggiungi messaggio utente
   */
  static async addUserMessage(
    ticketId: string,
    userId: string,
    body: string
  ): Promise<SupportTicketMessage> {
    const { data, error } = await supabase
      .from('support_ticket_messages')
      .insert({
        support_ticket_id: ticketId,
        sender_id: userId,
        sender_type: 'user',
        body,
      })
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('support_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    return data as SupportTicketMessage;
  }

  /**
   * Admin risponde: aggiunge messaggio e notifica l'utente
   */
  static async addAdminReply(
    ticketId: string,
    adminId: string,
    body: string
  ): Promise<SupportTicketMessage> {
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('user_id')
      .eq('id', ticketId)
      .single();

    if (!ticket?.user_id) throw new Error('Ticket non trovato');

    const { data: msg, error } = await supabase
      .from('support_ticket_messages')
      .insert({
        support_ticket_id: ticketId,
        sender_id: adminId,
        sender_type: 'admin',
        body,
      })
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('support_tickets')
      .update({
        status: 'replied',
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    await NotificationsService.create(
      ticket.user_id,
      'support_reply',
      'L\'assistenza ha risposto',
      body.length > 80 ? body.slice(0, 80) + '...' : body,
      ticketId
    );

    return msg as SupportTicketMessage;
  }

  /**
   * Lista ticket per admin (tutti)
   */
  static async getAllTicketsForAdmin(): Promise<SupportTicket[]> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as SupportTicket[];
  }

  /**
   * Upload immagine per support (screenshot)
   */
  static async uploadSupportImage(
    userId: string,
    imageUri: string,
    base64?: string | null
  ): Promise<string> {
    const path = `${userId}/${Date.now()}.jpg`;
    let body: Blob | ArrayBuffer;
    if (base64) {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      body = bytes.buffer;
    } else {
      const response = await fetch(imageUri);
      body = await response.blob();
    }
    const { data, error } = await supabase.storage
      .from(BUCKET_SUPPORT)
      .upload(path, body, { contentType: 'image/jpeg', upsert: false });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from(BUCKET_SUPPORT).getPublicUrl(data.path);
    return urlData?.publicUrl ?? '';
  }
}
