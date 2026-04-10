/**
 * Affiliate / Referral link: creator (approvato dall'host) richiede link,
 * host approva con propria %, tracciamento aperture e notifiche a entrambi.
 */

import { supabase } from './supabase';
import { CollaborationService } from './collaboration.service';
import { NotificationsService } from './notifications.service';
import { ProfilesService } from './profiles.service';

export interface AffiliateLinkRequest {
  id: string;
  host_id: string;
  creator_id: string;
  creator_requested_percent: number;
  host_offered_percent: number | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface AffiliateLink {
  id: string;
  host_id: string;
  creator_id: string;
  token: string;
  creator_percentage_offered: number;
  created_at: string;
}

export interface AffiliateLinkRequestWithCreator extends AffiliateLinkRequest {
  creator?: { id: string; full_name: string | null; username: string | null; avatar_url: string | null } | null;
}

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function generateToken(length = 12): string {
  let result = '';
  const randomValues = new Uint8Array(length);
  if (typeof global !== 'undefined' && global.crypto?.getRandomValues) {
    global.crypto.getRandomValues(randomValues);
  } else {
    for (let i = 0; i < length; i++) randomValues[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < length; i++) result += ALPHABET[randomValues[i] % ALPHABET.length];
  return result;
}

export class AffiliateService {
  /**
   * Il creator può richiedere un link solo se l'host lo ha già approvato (swipe destra = richiesta collaborazione).
   */
  static async canCreatorRequestLink(creatorId: string, hostId: string): Promise<boolean> {
    return CollaborationService.hasRequestedCollaboration(hostId, creatorId);
  }

  /**
   * Crea richiesta di link (creator → host) con % desiderata dal creator. Notifica l'host.
   */
  static async createLinkRequest(
    creatorId: string,
    hostId: string,
    creatorRequestedPercent: number
  ): Promise<AffiliateLinkRequest> {
    const percent = Math.max(0, Math.min(100, Number(creatorRequestedPercent)));
    const { data, error } = await supabase
      .from('affiliate_link_requests')
      .insert({
        host_id: hostId,
        creator_id: creatorId,
        creator_requested_percent: percent,
        status: 'pending',
      })
      .select()
      .single();
    if (error) throw error;

    const creatorProfile = await ProfilesService.getProfilesByIds([creatorId]).then((list) => list[0]);
    const creatorName = creatorProfile?.full_name || creatorProfile?.username || 'Un creator';
    await NotificationsService.create(
      hostId,
      'affiliate_link_request',
      'Richiesta link affiliato',
      `${creatorName} chiede di generare un link per le prenotazioni e indica una percentuale desiderata del ${percent}%. Inserisci la % che intendi offrire e approva.`,
      data.id
    );
    return data as AffiliateLinkRequest;
  }

  /**
   * Richieste in attesa per l'host (con dati creator).
   */
  static async getPendingLinkRequestsForHost(hostId: string): Promise<AffiliateLinkRequestWithCreator[]> {
    const { data: requests, error } = await supabase
      .from('affiliate_link_requests')
      .select('*')
      .eq('host_id', hostId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const list = (requests || []) as AffiliateLinkRequest[];
    if (list.length === 0) return [];
    const creatorIds = [...new Set(list.map((r) => r.creator_id))];
    const profiles = await ProfilesService.getProfilesByIds(creatorIds);
    const map = new Map(profiles.map((p) => [p.id, p]));
    return list.map((r) => ({
      ...r,
      creator: map.get(r.creator_id) ?? null,
    })) as AffiliateLinkRequestWithCreator[];
  }

  static async getLinkRequestById(requestId: string): Promise<AffiliateLinkRequestWithCreator | null> {
    const { data: req, error } = await supabase
      .from('affiliate_link_requests')
      .select('*')
      .eq('id', requestId)
      .single();
    if (error || !req) return null;
    const profiles = await ProfilesService.getProfilesByIds([(req as AffiliateLinkRequest).creator_id]);
    return {
      ...(req as AffiliateLinkRequest),
      creator: profiles[0] ?? null,
    } as AffiliateLinkRequestWithCreator;
  }

  /**
   * Host risponde: imposta % offerta e approva o rifiuta. Se approva, crea il link e notifica il creator.
   */
  static async hostRespondToLinkRequest(
    requestId: string,
    hostId: string,
    hostOfferedPercent: number,
    approved: boolean
  ): Promise<{ request: AffiliateLinkRequest; link?: AffiliateLink }> {
    const percent = Math.max(0, Math.min(100, Number(hostOfferedPercent)));
    const { data: request, error: updateError } = await supabase
      .from('affiliate_link_requests')
      .update({
        host_offered_percent: percent,
        status: approved ? 'approved' : 'rejected',
      })
      .eq('id', requestId)
      .eq('host_id', hostId)
      .select()
      .single();
    if (updateError || !request) throw updateError || new Error('Request not found');
    const req = request as AffiliateLinkRequest;

    if (!approved) {
      return { request: req };
    }

    let token = generateToken(12);
    let attempts = 0;
    while (attempts < 5) {
      const { data: link, error: insertError } = await supabase
        .from('affiliate_links')
        .insert({
          host_id: hostId,
          creator_id: req.creator_id,
          token,
          creator_percentage_offered: percent,
        })
        .select()
        .single();
      if (!insertError && link) {
        const hostProfile = await ProfilesService.getProfilesByIds([hostId]).then((list) => list[0]);
        const hostName = hostProfile?.full_name || hostProfile?.username || 'Un host';
        await NotificationsService.create(
          req.creator_id,
          'affiliate_link_created',
          'Link affiliato creato',
          `${hostName} ha creato il tuo link con una percentuale offerta del ${percent}%. Puoi condividere il link per portare prenotazioni.`,
          link.id
        );
        return { request: req, link: link as AffiliateLink };
      }
      if (insertError?.code === '23505') {
        token = generateToken(12);
        attempts++;
        continue;
      }
      throw insertError;
    }
    throw new Error('Impossibile generare token univoco');
  }

  /**
   * Link esistente tra host e creator (se approvato).
   */
  static async getLinkByHostAndCreator(hostId: string, creatorId: string): Promise<AffiliateLink | null> {
    const { data, error } = await supabase
      .from('affiliate_links')
      .select('*')
      .eq('host_id', hostId)
      .eq('creator_id', creatorId)
      .maybeSingle();
    if (error) throw error;
    return data as AffiliateLink | null;
  }

  /**
   * Cerca link per token (per registrare apertura).
   */
  static async getLinkByToken(token: string): Promise<AffiliateLink | null> {
    const { data, error } = await supabase
      .from('affiliate_links')
      .select('*')
      .eq('token', token)
      .maybeSingle();
    if (error) throw error;
    return data as AffiliateLink | null;
  }

  /**
   * Registra apertura del link: insert in affiliate_link_opens e notifica host + creator.
   */
  static async recordLinkOpen(linkId: string): Promise<void> {
    const { data: link, error: linkError } = await supabase
      .from('affiliate_links')
      .select('host_id, creator_id')
      .eq('id', linkId)
      .single();
    if (linkError || !link) throw linkError || new Error('Link not found');

    const { error: insertError } = await supabase.from('affiliate_link_opens').insert({ link_id: linkId });
    if (insertError) throw insertError;

    const message = 'Il tuo link affiliato è stato aperto.';
    await NotificationsService.create(link.host_id, 'affiliate_link_opened', 'Link aperto', message, linkId);
    await NotificationsService.create(link.creator_id, 'affiliate_link_opened', 'Link aperto', message, linkId);
  }

  /**
   * Registra che una prenotazione è stata effettuata tramite link (notifica host e creator).
   * Aggiorna l'ultima apertura non ancora associata a una prenotazione.
   */
  static async recordBookingViaLink(linkId: string): Promise<void> {
    const { data: link, error: linkError } = await supabase
      .from('affiliate_links')
      .select('host_id, creator_id')
      .eq('id', linkId)
      .single();
    if (linkError || !link) throw linkError || new Error('Link not found');

    const { data: lastOpen } = await supabase
      .from('affiliate_link_opens')
      .select('id')
      .eq('link_id', linkId)
      .eq('booking_made', false)
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastOpen?.id) {
      await supabase
        .from('affiliate_link_opens')
        .update({ booking_made: true, booking_at: new Date().toISOString() })
        .eq('id', lastOpen.id);
    }

    const message = 'Una prenotazione è stata effettuata grazie al link affiliato.';
    await NotificationsService.create(link.host_id, 'affiliate_booking_made', 'Prenotazione da link', message, linkId);
    await NotificationsService.create(link.creator_id, 'affiliate_booking_made', 'Prenotazione da link', message, linkId);
  }

  /**
   * Richiesta già inviata (pending) dal creator a questo host.
   */
  static async getPendingRequestFromCreatorToHost(creatorId: string, hostId: string): Promise<AffiliateLinkRequest | null> {
    const { data, error } = await supabase
      .from('affiliate_link_requests')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('host_id', hostId)
      .eq('status', 'pending')
      .maybeSingle();
    if (error) throw error;
    return data as AffiliateLinkRequest | null;
  }

  /**
   * URL completo del link (per condivisione). Usa config shareScheme e base URL se definita.
   */
  static getLinkUrl(token: string, baseUrl?: string): string {
    if (baseUrl) return `${baseUrl.replace(/\/$/, '')}/r/${token}`;
    const scheme = 'nomadiqe';
    return `${scheme}://r/${token}`;
  }
}
