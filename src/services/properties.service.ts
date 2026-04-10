/**
 * Properties Service
 * Host: strutture, foto, disponibilità e prezzi per data
 */

import { supabase } from './supabase';
import { config } from '../constants/config';
import { ensureJpegUriForUpload } from '../utils/imageUpload';
import type { Property } from '../types/property';

export type AvailabilityStatus = 'available' | 'occupied' | 'closed' | 'collab_available';

const MAX_PHOTOS = config.propertyMedia.maxPhotosPerProperty;
const MAX_VIDEOS_PER_MONTH = config.propertyMedia.maxVideosPerMonthPerProperty;

export interface PropertyAvailabilityRow {
  id: string;
  property_id: string;
  date: string;
  status: AvailabilityStatus;
  price_override: number | null;
  created_at: string;
  updated_at: string;
}

/** Media struttura in attesa di approvazione admin (foto e video) */
export interface PropertyMediaRow {
  id: string;
  property_id: string;
  type: 'image' | 'video';
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
}

const BUCKET_PROPERTIES = 'properties';

export class PropertiesService {
  /**
   * Crea una struttura (draft) per l'host
   */
  static async createProperty(
    hostId: string,
    title: string = 'La mia struttura',
    structureType?: string | null
  ) {
    const { data, error } = await supabase
      .from('properties')
      .insert({
        owner_id: hostId,
        host_id: hostId,
        title,
        description: '',
        type: 'other',
        status: 'draft',
        structure_type: structureType ?? null,
        address: 'Da compilare',
        city: 'Da compilare',
        country: 'IT',
        latitude: 0,
        longitude: 0,
        base_price_per_night: 0,
        images: [],
        is_active: false,
      })
      .select()
      .single();
    if (error) throw error;
    return data as Property;
  }

  /**
   * Aggiorna campi della struttura (onboarding e altri)
   */
  static async updateProperty(
    propertyId: string,
    updates: Partial<{
      title: string;
      description: string;
      type: string;
      structure_type: string | null;
      address: string;
      city: string;
      country: string;
      bedrooms: number;
      bathrooms: number;
      beds: number;
      max_guests: number;
      amenities: string[];
      images: string[];
      video_uploads: { url: string; uploaded_at: string }[];
      base_price_per_night: number;
      cleaning_fee: number | null;
      instant_book: boolean;
      collaboration_booking_mode: 'approve_first_5' | 'instant' | null;
      first_guest_type: 'any_creator' | 'verified_creator' | null;
      weekend_supplement_percent: number | null;
      kolbed_program: 'kolbed_100' | 'gigo_50' | 'paid_collab' | null;
      paid_collab_min_budget: number | null;
      paid_collab_max_budget: number | null;
      status: string;
      airbnb_ical_import_url: string | null;
      booking_ical_import_url: string | null;
      discount_5_nights_percent: number | null;
      discount_14_nights_percent: number | null;
      offer_type: 'basic' | 'basic_paid' | 'medium' | 'medium_fees' | 'luxury' | 'luxury_paid' | null;
    }>
  ) {
    const { data, error } = await supabase
      .from('properties')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', propertyId)
      .select()
      .single();
    if (error) throw error;
    return data as Property;
  }

  /**
   * Elimina la struttura (solo se l'utente è owner o host della struttura; RLS verifica).
   */
  static async deleteProperty(propertyId: string): Promise<void> {
    const { error } = await supabase.from('properties').delete().eq('id', propertyId);
    if (error) throw error;
  }

  /**
   * Singola struttura per id (per vista condivisione / dettaglio)
   */
  static async getProperty(propertyId: string): Promise<Property | null> {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();
    if (error || !data) return null;
    return data as Property;
  }

  /**
   * Strutture dell'host (owner_id o host_id = userId)
   */
  static async getPropertiesByHost(hostId: string) {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .or(`owner_id.eq.${hostId},host_id.eq.${hostId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Property[];
  }

  /**
   * Strutture attive dell'host (per calendario in richiesta collaborazione creator→host).
   */
  static async getActivePropertiesForHost(hostId: string): Promise<Property[]> {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .or(`owner_id.eq.${hostId},host_id.eq.${hostId}`)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Property[];
  }

  /**
   * Strutture visibili ai content creator (KOL&BED e Esplora).
   * Solo proprietà attive con almeno un'immagine.
   * Se offerTypes è fornito (creator approvato), filtra per offer_type in quella lista.
   */
  static async getPropertiesForCreators(offerTypes?: string[]): Promise<Property[]> {
    let query = supabase
      .from('properties')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (offerTypes != null && offerTypes.length > 0) {
      query = query.in('offer_type', offerTypes);
    }

    const { data, error } = await query;
    if (error) throw error;
    const list = (data || []) as Property[];
    return list.filter((p) => Array.isArray(p.images) && p.images.length > 0);
  }

  /**
   * Aggiorna le foto della struttura (array di URL pubblici). Max 50 foto.
   */
  static async updatePropertyImages(propertyId: string, images: string[]) {
    if (images.length > MAX_PHOTOS) {
      throw new Error(`Puoi caricare al massimo ${MAX_PHOTOS} foto per struttura.`);
    }
    const { data, error } = await supabase
      .from('properties')
      .update({ images, updated_at: new Date().toISOString() })
      .eq('id', propertyId)
      .select()
      .single();

    if (error) throw error;
    return data as Property;
  }

  /**
   * Limite foto per struttura (50)
   */
  static get maxPhotosPerProperty() {
    return MAX_PHOTOS;
  }

  /**
   * Limite video per struttura al mese (5)
   */
  static get maxVideosPerMonthPerProperty() {
    return MAX_VIDEOS_PER_MONTH;
  }

  /**
   * Conta i video caricati per questa struttura nel mese corrente
   */
  static getVideoUploadsCountThisMonth(property: Property): number {
    const entries = property.video_uploads ?? [];
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return entries.filter((e) => {
      const d = new Date(e.uploaded_at);
      return d.getFullYear() === y && d.getMonth() === m;
    }).length;
  }

  /**
   * Upload video per struttura (storage) → inserito in property_media in attesa di approvazione admin.
   * Max 5 al mese (approvati + pending) per struttura.
   */
  static async uploadPropertyVideo(
    propertyId: string,
    userId: string,
    videoUri: string
  ): Promise<string> {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const startMonth = new Date(y, m, 1).toISOString();
    const endMonth = new Date(y, m + 1, 0, 23, 59, 59).toISOString();

    const [property, pendingVideos] = await Promise.all([
      supabase.from('properties').select('video_uploads').eq('id', propertyId).single(),
      supabase
        .from('property_media')
        .select('id')
        .eq('property_id', propertyId)
        .eq('type', 'video')
        .eq('status', 'pending')
        .gte('uploaded_at', startMonth)
        .lte('uploaded_at', endMonth),
    ]);

    const entries: { url: string; uploaded_at: string }[] =
      (property.data?.video_uploads as { url: string; uploaded_at: string }[] | null) ?? [];
    const approvedThisMonth = entries.filter((e) => {
      const d = new Date(e.uploaded_at);
      return d.getFullYear() === y && d.getMonth() === m;
    }).length;
    const pendingThisMonth = pendingVideos.data?.length ?? 0;
    if (approvedThisMonth + pendingThisMonth >= MAX_VIDEOS_PER_MONTH) {
      throw new Error(
        `Hai già caricato ${MAX_VIDEOS_PER_MONTH} video questo mese per questa struttura. Potrai caricarne altri il mese prossimo.`
      );
    }

    const ext = videoUri.split('.').pop()?.toLowerCase() || 'mp4';
    const path = `${userId}/${propertyId}/videos/${Date.now()}.${ext}`;
    const response = await fetch(videoUri);
    const body = await response.blob();
    const contentType = ext === 'mov' ? 'video/quicktime' : 'video/mp4';

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_PROPERTIES)
      .upload(path, body, { contentType, upsert: false });

    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from(BUCKET_PROPERTIES).getPublicUrl(uploadData.path);
    const publicUrl = urlData?.publicUrl ?? '';

    const { error: insertError } = await supabase.from('property_media').insert({
      property_id: propertyId,
      type: 'video',
      url: publicUrl,
      status: 'pending',
      uploaded_at: now.toISOString(),
    });
    if (insertError) throw insertError;
    return publicUrl;
  }

  /**
   * Upload immagine per struttura (storage) → inserita in property_media in attesa di approvazione admin.
   * Max 50 foto (approvate + pending) per struttura.
   */
  static async uploadPropertyImage(
    propertyId: string,
    userId: string,
    imageUri: string,
    base64?: string | null
  ): Promise<string> {
    const [property, pending] = await Promise.all([
      supabase.from('properties').select('images').eq('id', propertyId).single(),
      supabase.from('property_media').select('id').eq('property_id', propertyId).eq('type', 'image').eq('status', 'pending'),
    ]);
    const approvedCount = (property.data?.images as string[] | null)?.length ?? 0;
    const pendingCount = pending.data?.length ?? 0;
    if (approvedCount + pendingCount >= MAX_PHOTOS) {
      throw new Error(`Puoi caricare al massimo ${MAX_PHOTOS} foto per struttura. In attesa di approvazione: ${pendingCount}.`);
    }
    const path = `${userId}/${propertyId}/${Date.now()}.jpg`;
    let body: Blob | ArrayBuffer;
    if (base64) {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      body = bytes.buffer;
    } else {
      let uriToFetch = imageUri;
      try {
        uriToFetch = await ensureJpegUriForUpload(imageUri);
      } catch {
        // fallback: prova upload diretto (es. già JPEG)
        uriToFetch = imageUri;
      }
      const response = await fetch(uriToFetch);
      body = await response.blob();
    }
    const { data, error } = await supabase.storage
      .from(BUCKET_PROPERTIES)
      .upload(path, body, { contentType: 'image/jpeg', upsert: false });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from(BUCKET_PROPERTIES).getPublicUrl(data.path);
    const publicUrl = urlData?.publicUrl ?? '';
    const { error: insertError } = await supabase.from('property_media').insert({
      property_id: propertyId,
      type: 'image',
      url: publicUrl,
      status: 'pending',
      uploaded_at: new Date().toISOString(),
    });
    if (insertError) throw insertError;
    return publicUrl;
  }

  /**
   * Rimuove un'immagine approvata dalla struttura (la toglie da property.images).
   */
  static async removePropertyImage(propertyId: string, imageUrl: string): Promise<void> {
    const { data: prop, error: fetchErr } = await supabase
      .from('properties')
      .select('images')
      .eq('id', propertyId)
      .single();
    if (fetchErr || !prop) throw fetchErr || new Error('Struttura non trovata');
    const images = (prop.images as string[] | null) ?? [];
    const next = images.filter((url) => url !== imageUrl);
    if (next.length === images.length) return;
    const { error: updateErr } = await supabase
      .from('properties')
      .update({ images: next, updated_at: new Date().toISOString() })
      .eq('id', propertyId);
    if (updateErr) throw updateErr;
  }

  /**
   * Imposta un'immagine come copertina (la sposta in prima posizione in property.images).
   */
  static async setPropertyCoverImage(propertyId: string, imageUrl: string): Promise<void> {
    const { data: prop, error: fetchErr } = await supabase
      .from('properties')
      .select('images')
      .eq('id', propertyId)
      .single();
    if (fetchErr || !prop) throw fetchErr || new Error('Struttura non trovata');
    const images = (prop.images as string[] | null) ?? [];
    const idx = images.indexOf(imageUrl);
    if (idx <= 0) return;
    const next = [imageUrl, ...images.filter((_, i) => i !== idx)];
    const { error: updateErr } = await supabase
      .from('properties')
      .update({ images: next, updated_at: new Date().toISOString() })
      .eq('id', propertyId);
    if (updateErr) throw updateErr;
  }

  /**
   * Elimina un media in attesa (solo per l'host della struttura; RLS verifica ownership).
   */
  static async deletePendingPropertyMedia(mediaId: string): Promise<void> {
    const { error } = await supabase.from('property_media').delete().eq('id', mediaId);
    if (error) throw error;
  }

  /**
   * Media in attesa di approvazione per una struttura (solo per l'host della struttura)
   */
  static async getPendingPropertyMedia(propertyId: string): Promise<PropertyMediaRow[]> {
    const { data, error } = await supabase
      .from('property_media')
      .select('*')
      .eq('property_id', propertyId)
      .eq('status', 'pending')
      .order('uploaded_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as PropertyMediaRow[];
  }

  /**
   * Tutti i media in attesa (per admin)
   */
  static async getPendingPropertyMediaForAdmin(): Promise<PropertyMediaRow[]> {
    const { data, error } = await supabase.rpc('get_pending_property_media');
    if (error) throw error;
    return (data ?? []) as PropertyMediaRow[];
  }

  /**
   * Titoli strutture per una lista di id (per admin)
   */
  static async getPropertyTitles(propertyIds: string[]): Promise<Record<string, string>> {
    if (propertyIds.length === 0) return {};
    const { data, error } = await supabase
      .from('properties')
      .select('id, title')
      .in('id', propertyIds);
    if (error) throw error;
    const map: Record<string, string> = {};
    (data ?? []).forEach((p: { id: string; title: string }) => {
      map[p.id] = p.title ?? 'Struttura';
    });
    return map;
  }

  /**
   * Approva un media (RPC SECURITY DEFINER: aggiorna properties + property_media; RLS blocca update diretti dall'admin).
   */
  static async approvePropertyMedia(mediaId: string, _reviewedBy?: string): Promise<void> {
    const { error } = await supabase.rpc('approve_property_media', { p_media_id: mediaId });
    if (error) throw error;
  }

  /**
   * Rifiuta un media (RPC admin)
   */
  static async rejectPropertyMedia(mediaId: string, _reviewedBy?: string): Promise<void> {
    const { error } = await supabase.rpc('reject_property_media', { p_media_id: mediaId });
    if (error) throw error;
  }

  /**
   * Disponibilità per un periodo
   */
  static async getAvailability(
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<PropertyAvailabilityRow[]> {
    const { data, error } = await supabase
      .from('property_availability')
      .select('*')
      .eq('property_id', propertyId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');

    if (error) throw error;
    return (data || []) as PropertyAvailabilityRow[];
  }

  /**
   * Imposta disponibilità e/o prezzo per una o più date
   */
  static async setAvailability(
    propertyId: string,
    dates: string[],
    status: AvailabilityStatus,
    priceOverride: number | null
  ) {
    const rows = dates.map((date) => ({
      property_id: propertyId,
      date,
      status,
      price_override: priceOverride,
      updated_at: new Date().toISOString(),
    }));
    const { data, error } = await supabase
      .from('property_availability')
      .upsert(rows, {
        onConflict: 'property_id,date',
        ignoreDuplicates: false,
      })
      .select();

    if (error) throw error;
    return data as PropertyAvailabilityRow[];
  }

  /**
   * Aggiorna gli URL iCal per sincronizzazione con Airbnb e Booking.com
   */
  static async updatePropertyCalendarSync(
    propertyId: string,
    sync: { airbnb_ical_import_url?: string | null; booking_ical_import_url?: string | null }
  ) {
    return this.updateProperty(propertyId, sync);
  }

  /**
   * Avvia la sincronizzazione calendari esterni (Airbnb/Booking) per una struttura.
   * Chiama l'Edge Function che scarica gli iCal e aggiorna property_availability.
   */
  static async triggerCalendarSync(propertyId: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('sync-property-calendar', {
        body: { property_id: propertyId },
      });
      if (error) return { ok: false, error: error.message };
      if (data?.error) return { ok: false, error: data.error };
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sincronizzazione non disponibile';
      return { ok: false, error: msg };
    }
  }
}
