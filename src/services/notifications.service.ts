/**
 * Notifications Service
 * Lettura, creazione e segna come letto per le notifiche in-app
 */

import { supabase } from './supabase';
import { ProfilesService } from './profiles.service';
import { ADMIN_EMAILS } from '../constants/admin';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  related_id: string | null;
  read: boolean;
  created_at: string;
}

export class NotificationsService {
  /**
   * Notifiche per l'utente (più recenti prima)
   */
  static async getNotifications(userId: string, limit = 50): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as Notification[];
  }

  /**
   * Segna una notifica come letta
   */
  static async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  }

  /**
   * Crea una notifica per un utente (es. per admin: bio link in attesa)
   */
  static async create(
    userId: string,
    type: string,
    title: string,
    message: string | null = null,
    relatedId: string | null = null
  ): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({ user_id: userId, type, title, message, related_id: relatedId })
      .select()
      .single();

    if (error) throw error;
    return data as Notification;
  }

  /**
   * Notifica gli admin che un profilo ha salvato una bio con link (in attesa di approvazione)
   */
  static async notifyAdminsBioLinkApproval(profileId: string, profileEmail: string): Promise<void> {
    const adminIds = await ProfilesService.getProfileIdsByEmails(ADMIN_EMAILS);
    const title = 'Bio con link in attesa';
    const message = `${profileEmail} ha inserito un link nella bio. Approva dalla Pagina Admin.`;
    await Promise.all(
      adminIds.map((adminId) =>
        this.create(adminId, 'bio_link_approval', title, message, profileId)
      )
    );
  }

  /**
   * Segna tutte le notifiche dell'utente come lette
   */
  static async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  }
}
