/**
 * Collaboration requests: host ↔ creator/jolly (KOL&BED)
 * Host o creator possono avviare la richiesta (swipe). L'host guadagna punti accettando richieste da creator.
 */

import { supabase } from './supabase';
import { awardPoints } from './points.service';
import type { UserProfile } from '../types';

export type InitiatedBy = 'host' | 'creator';
export type CollaborationStatus = 'pending' | 'accepted' | 'rejected';

export interface CollaborationRequest {
  id: string;
  host_id: string;
  creator_id: string;
  initiated_by?: InitiatedBy | null;
  status?: CollaborationStatus | null;
  created_at: string;
  preferred_dates_from?: string | null;
  preferred_dates_to?: string | null;
  accessory_services?: string[] | null;
  paid_collaboration?: boolean | null;
  description?: string | null;
  kolbed_partial_type?: string | null;
  content_quantity_desired?: string | null;
  updated_at?: string | null;
  request_extras?: CollaborationRequestExtras | Record<string, unknown> | null;
}

export interface CollaborationRequestWithCreator extends CollaborationRequest {
  creator?: UserProfile | null;
}

export type KolbedPartialType = 'cleaning_only' | '50_discount' | 'full' | 'half_coverage';

/** Extra inviati alla creazione della richiesta (JSON su DB: request_extras) */
export interface CollaborationRequestExtras {
  cover_flights?: boolean;
  selected_jolly_ids?: string[];
  notes?: string;
  /** Struttura per cui si chiede la collaborazione (creator → host) */
  property_id?: string;
  /** Date ISO yyyy-MM-dd selezionate nel calendario */
  requested_dates?: string[];
}

export interface CollaborationRequestDetails {
  preferred_dates_from?: string | null;
  preferred_dates_to?: string | null;
  accessory_services?: string[];
  paid_collaboration?: boolean;
  description?: string | null;
  kolbed_partial_type?: KolbedPartialType | null;
  content_quantity_desired?: string | null;
}

function extrasPayload(extras?: CollaborationRequestExtras): Record<string, unknown> | undefined {
  if (!extras) return undefined;
  const out: Record<string, unknown> = {};
  if (extras.cover_flights !== undefined) out.cover_flights = extras.cover_flights;
  if (extras.selected_jolly_ids?.length) out.selected_jolly_ids = extras.selected_jolly_ids;
  if (extras.notes) out.notes = extras.notes;
  if (extras.property_id) out.property_id = extras.property_id;
  if (extras.requested_dates?.length) out.requested_dates = extras.requested_dates;
  return Object.keys(out).length ? out : undefined;
}

async function insertCollaborationRequest(payload: Record<string, unknown>): Promise<CollaborationRequest> {
  let { data, error } = await supabase
    .from('host_creator_collaboration_requests')
    .insert(payload)
    .select()
    .single();
  if (error && payload.request_extras && (String(error.message).includes('request_extras') || error.code === 'PGRST204')) {
    const retry = { ...payload };
    delete retry.request_extras;
    ({ data, error } = await supabase.from('host_creator_collaboration_requests').insert(retry).select().single());
  }
  if (error) throw error;
  return data as CollaborationRequest;
}

export class CollaborationService {
  /**
   * Jolly con cui l'host ha già una collaborazione accettata.
   */
  static async getAcceptedJollyProfilesForHost(hostId: string): Promise<UserProfile[]> {
    const { data: rows, error } = await supabase
      .from('host_creator_collaboration_requests')
      .select('creator_id')
      .eq('host_id', hostId)
      .eq('status', 'accepted');
    if (error) throw error;
    const ids = [...new Set((rows || []).map((r: { creator_id: string }) => r.creator_id))];
    if (ids.length === 0) return [];
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('*')
      .in('id', ids)
      .eq('role', 'jolly');
    if (pErr) throw pErr;
    return (profiles || []) as UserProfile[];
  }

  /**
   * Host richiede collaborazione a un creator/jolly (swipe destra).
   * Inserisce con initiated_by='host'. Il trigger DB notifica il creator.
   */
  static async requestCollaboration(hostId: string, creatorId: string): Promise<CollaborationRequest> {
    return CollaborationService.requestCollaborationWithExtras(hostId, creatorId, undefined);
  }

  static async requestCollaborationWithExtras(
    hostId: string,
    creatorId: string,
    extras?: CollaborationRequestExtras
  ): Promise<CollaborationRequest> {
    const payload: Record<string, unknown> = {
      host_id: hostId,
      creator_id: creatorId,
      initiated_by: 'host',
      status: 'pending',
    };
    const ex = extrasPayload(extras);
    if (ex) payload.request_extras = ex;
    return insertCollaborationRequest(payload);
  }

  /**
   * Creator richiede collaborazione a un host (swipe destra). L'host potrà accettare e guadagnare punti.
   */
  static async creatorRequestCollaboration(creatorId: string, hostId: string): Promise<CollaborationRequest> {
    return CollaborationService.creatorRequestCollaborationWithExtras(creatorId, hostId, undefined);
  }

  static async creatorRequestCollaborationWithExtras(
    creatorId: string,
    hostId: string,
    extras?: CollaborationRequestExtras
  ): Promise<CollaborationRequest> {
    const payload: Record<string, unknown> = {
      host_id: hostId,
      creator_id: creatorId,
      initiated_by: 'creator',
      status: 'pending',
    };
    const dates = extras?.requested_dates?.length
      ? [...extras.requested_dates].sort()
      : [];
    if (dates.length > 0) {
      payload.preferred_dates_from = dates[0];
      payload.preferred_dates_to = dates[dates.length - 1];
    }
    const ex = extrasPayload(extras);
    if (ex) payload.request_extras = ex;
    return insertCollaborationRequest(payload);
  }

  /**
   * Richieste in entrata per l'host (inviate da creator), in attesa di accettazione.
   */
  static async getPendingRequestsToHost(hostId: string): Promise<CollaborationRequestWithCreator[]> {
    const { data: requests, error } = await supabase
      .from('host_creator_collaboration_requests')
      .select('*')
      .eq('host_id', hostId)
      .eq('initiated_by', 'creator')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const list = (requests || []) as CollaborationRequest[];
    if (list.length === 0) return [];
    const creatorIds = [...new Set(list.map((r) => r.creator_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', creatorIds);
    const profileMap = new Map<string, UserProfile>();
    (profiles || []).forEach((p) => profileMap.set(p.id, p as UserProfile));
    return list.map((r) => ({
      ...r,
      creator: profileMap.get(r.creator_id) ?? null,
    }));
  }

  /**
   * Host accetta una richiesta inviata da un creator → aggiorna status e assegna punti all'host.
   */
  static async hostAcceptCollaborationRequest(requestId: string, hostId: string): Promise<void> {
    const { data: req, error: fetchErr } = await supabase
      .from('host_creator_collaboration_requests')
      .select('id, initiated_by, status')
      .eq('id', requestId)
      .eq('host_id', hostId)
      .single();
    if (fetchErr || !req) throw fetchErr || new Error('Request not found');
    if ((req as CollaborationRequest).initiated_by !== 'creator' || (req as CollaborationRequest).status !== 'pending') {
      throw new Error('Solo le richieste inviate da creator in attesa possono essere accettate');
    }
    const { error: updateErr } = await supabase
      .from('host_creator_collaboration_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .eq('host_id', hostId);
    if (updateErr) throw updateErr;
    await awardPoints(hostId, 'host_accept_collaboration');
  }

  /**
   * Host rifiuta una richiesta inviata da un creator.
   */
  static async hostRejectCollaborationRequest(requestId: string, hostId: string): Promise<void> {
    const { error } = await supabase
      .from('host_creator_collaboration_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId)
      .eq('host_id', hostId)
      .eq('initiated_by', 'creator')
      .eq('status', 'pending');
    if (error) throw error;
  }

  /**
   * Host: controfferta gialla — accetta con copertura parziale costi o sconto (kolbed_partial_type).
   */
  static async hostCounterOfferCollaboration(
    requestId: string,
    hostId: string,
    partialType: 'half_coverage' | '50_discount'
  ): Promise<void> {
    const { data: req, error: fetchErr } = await supabase
      .from('host_creator_collaboration_requests')
      .select('id, initiated_by, status')
      .eq('id', requestId)
      .eq('host_id', hostId)
      .single();
    if (fetchErr || !req) throw fetchErr || new Error('Request not found');
    const r = req as CollaborationRequest;
    if (r.initiated_by !== 'creator' || r.status !== 'pending') {
      throw new Error('Richiesta non valida');
    }
    const { error: updateErr } = await supabase
      .from('host_creator_collaboration_requests')
      .update({
        status: 'accepted',
        kolbed_partial_type: partialType,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('host_id', hostId);
    if (updateErr) throw updateErr;
    await awardPoints(hostId, 'host_accept_collaboration');
  }

  /**
   * Verifica se l'host ha già inviato richiesta a questo creator.
   */
  static async hasRequestedCollaboration(hostId: string, creatorId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('host_creator_collaboration_requests')
      .select('id')
      .eq('host_id', hostId)
      .eq('creator_id', creatorId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  }

  /**
   * Lista richieste inviate dall'host (per Dashboard).
   */
  static async getRequestsByHost(hostId: string): Promise<CollaborationRequestWithCreator[]> {
    const { data: requests, error } = await supabase
      .from('host_creator_collaboration_requests')
      .select('*')
      .eq('host_id', hostId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const list = (requests || []) as CollaborationRequest[];
    if (list.length === 0) return [];
    const creatorIds = [...new Set(list.map((r) => r.creator_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', creatorIds);
    const profileMap = new Map<string, UserProfile>();
    (profiles || []).forEach((p) => profileMap.set(p.id, p as UserProfile));
    return list.map((r) => ({
      ...r,
      creator: profileMap.get(r.creator_id) ?? null,
    }));
  }

  /**
   * Singola richiesta per id (per dettaglio e form).
   */
  static async getRequestById(requestId: string): Promise<CollaborationRequestWithCreator | null> {
    const { data: req, error } = await supabase
      .from('host_creator_collaboration_requests')
      .select('*')
      .eq('id', requestId)
      .single();
    if (error || !req) return null;
    const { data: creator } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', (req as CollaborationRequest).creator_id)
      .single();
    return {
      ...(req as CollaborationRequest),
      creator: creator as UserProfile | null,
    };
  }

  /**
   * Aggiorna i dettagli della richiesta (form host: date, servizi, descrizione, ecc.).
   */
  static async updateRequestDetails(
    requestId: string,
    hostId: string,
    details: CollaborationRequestDetails
  ): Promise<void> {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (details.preferred_dates_from !== undefined) payload.preferred_dates_from = details.preferred_dates_from || null;
    if (details.preferred_dates_to !== undefined) payload.preferred_dates_to = details.preferred_dates_to || null;
    if (details.accessory_services !== undefined) payload.accessory_services = details.accessory_services || [];
    if (details.paid_collaboration !== undefined) payload.paid_collaboration = details.paid_collaboration;
    if (details.description !== undefined) payload.description = details.description?.slice(0, 500) || null;
    if (details.kolbed_partial_type !== undefined) payload.kolbed_partial_type = details.kolbed_partial_type || null;
    if (details.content_quantity_desired !== undefined) payload.content_quantity_desired = details.content_quantity_desired || null;

    const { error } = await supabase
      .from('host_creator_collaboration_requests')
      .update(payload)
      .eq('id', requestId)
      .eq('host_id', hostId);
    if (error) throw error;
  }
}
