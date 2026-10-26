import { supabase } from './supabase';
import { ensureJpegUriForUpload } from '../utils/imageUpload';

export type LocalJollyServiceType =
  | 'restaurant'
  | 'photography'
  | 'video'
  | 'social_media'
  | 'maintenance'
  | 'concierge'
  | 'translation'
  | 'cleaning'
  | 'property_management'
  | 'supplier'
  | 'excursions'
  | 'home_products'
  | 'shuttle_service'
  | 'pharmacist';

export type LocalJollyAvailability = 'flexible' | 'seasonal' | 'full_time';

export interface LocalJollyService {
  id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;

  service_type: LocalJollyServiceType;
  availability: LocalJollyAvailability;
  title: string;
  description: string | null;
  price_per_hour: number | null;
  price_per_service: number | null;
  cities: string[];
  countries: string[];
  skills: string[];

  /**
   * Extra per-service fields (varies by service type).
   * Stored in jolly_services.data so service-specific forms can evolve.
   */
  extras?: Record<string, unknown>;
}

export type JollyServiceMediaKind =
  | 'service_cover'
  | 'restaurant_menu'
  | 'vehicle_photo'
  | 'boat_photo'
  | 'quad_photo';

export interface JollyServiceMediaRow {
  id: string;
  service_id: string;
  jolly_id: string;
  media_kind: JollyServiceMediaKind;
  file_type: 'image' | 'pdf';
  storage_path: string;
  public_url: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  sort_order: number;
  is_cover: boolean;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
}

/** Pending media row enriched for admin moderation UI */
export interface JollyServiceMediaAdminRow extends JollyServiceMediaRow {
  service_title?: string | null;
  jolly_full_name?: string | null;
  jolly_email?: string | null;
}

const COVER_MEDIA_KINDS: JollyServiceMediaKind[] = [
  'service_cover',
  'vehicle_photo',
  'boat_photo',
  'quad_photo',
];

const BUCKET_JOLLY_SERVICE_MEDIA = 'jolly-service-media';

type JollyServiceRow = {
  id: string;
  jolly_id: string;
  service_type: LocalJollyServiceType | 'boat_excursions';
  title: string;
  description: string | null;
  is_active: boolean;
  data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
};

function safeParseNumber(raw: string): number | null {
  const cleaned = raw.trim().replace(',', '.');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function serviceFromRow(row: JollyServiceRow): LocalJollyService {
  const data = row.data ?? {};
  const serviceType = row.service_type === 'boat_excursions' ? 'excursions' : row.service_type;
  const extras = (data.extras && typeof data.extras === 'object' ? data.extras : {}) as Record<string, unknown>;
  return {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
    is_active: row.is_active,
    service_type: serviceType as LocalJollyServiceType,
    availability: (data.availability as LocalJollyAvailability | undefined) ?? 'flexible',
    title: row.title,
    description: row.description,
    price_per_hour: typeof data.price_per_hour === 'number' ? data.price_per_hour : null,
    price_per_service: typeof data.price_per_service === 'number' ? data.price_per_service : null,
    cities: Array.isArray(data.cities) ? (data.cities as string[]) : [],
    countries: Array.isArray(data.countries) ? (data.countries as string[]) : [],
    skills: Array.isArray(data.skills) ? (data.skills as string[]) : [],
    extras: row.service_type === 'boat_excursions'
      ? { ...extras, migrated_from_boat_excursions: true }
      : extras,
  };
}

export class JollyLocalServicesService {
  static async list(userId: string): Promise<LocalJollyService[]> {
    const { data, error } = await supabase
      .from('jolly_services')
      .select('*')
      .eq('jolly_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return ((data ?? []) as JollyServiceRow[]).map(serviceFromRow);
  }

  static async saveAll(userId: string, services: LocalJollyService[]): Promise<void> {
    for (const service of services) {
      const { error } = await supabase
        .from('jolly_services')
        .upsert({
          id: service.id,
          jolly_id: userId,
          service_type: service.service_type,
          title: service.title,
          description: service.description,
          is_active: service.is_active,
          data: {
            availability: service.availability,
            price_per_hour: service.price_per_hour,
            price_per_service: service.price_per_service,
            cities: service.cities,
            countries: service.countries,
            skills: service.skills,
            extras: service.extras ?? {},
          },
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
    }
  }

  static async create(
    userId: string,
    input: Omit<LocalJollyService, 'id' | 'created_at' | 'updated_at'>
  ): Promise<LocalJollyService> {
    const payload = {
      jolly_id: userId,
      service_type: input.service_type,
      title: input.title,
      description: input.description,
      is_active: input.is_active,
      data: {
        availability: input.availability,
        price_per_hour: input.price_per_hour,
        price_per_service: input.price_per_service,
        cities: input.cities,
        countries: input.countries,
        skills: input.skills,
        extras: input.extras ?? {},
      },
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('jolly_services')
      .insert(payload)
      .select('*')
      .single();
    if (error) throw error;
    return serviceFromRow(data as JollyServiceRow);
  }

  static async setActive(userId: string, serviceId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('jolly_services')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', serviceId)
      .eq('jolly_id', userId);
    if (error) throw error;
  }

  static async delete(userId: string, serviceId: string): Promise<void> {
    const { error } = await supabase
      .from('jolly_services')
      .delete()
      .eq('id', serviceId)
      .eq('jolly_id', userId);
    if (error) throw error;
  }

  static async uploadServiceImage(
    userId: string,
    serviceId: string,
    mediaKind: Exclude<JollyServiceMediaKind, 'restaurant_menu'>,
    imageUri: string
  ): Promise<JollyServiceMediaRow> {
    let uploadUri = imageUri;
    try {
      uploadUri = await ensureJpegUriForUpload(imageUri);
    } catch {
      uploadUri = imageUri;
    }
    const response = await fetch(uploadUri);
    const body = await response.blob();
    const path = `${userId}/${serviceId}/${mediaKind}-${Date.now()}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_JOLLY_SERVICE_MEDIA)
      .upload(path, body, { contentType: 'image/jpeg', upsert: false });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from(BUCKET_JOLLY_SERVICE_MEDIA)
      .getPublicUrl(uploadData.path);

    const { data, error } = await supabase
      .from('jolly_service_media')
      .insert({
        service_id: serviceId,
        jolly_id: userId,
        media_kind: mediaKind,
        file_type: 'image',
        storage_path: uploadData.path,
        public_url: urlData?.publicUrl ?? null,
        mime_type: 'image/jpeg',
        size_bytes: typeof body.size === 'number' ? body.size : null,
        sort_order: 0,
        is_cover: ['vehicle_photo', 'boat_photo', 'quad_photo', 'service_cover'].includes(mediaKind),
        status: 'pending',
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as JollyServiceMediaRow;
  }

  static async uploadRestaurantMenuImage(
    userId: string,
    serviceId: string,
    imageUri: string
  ): Promise<JollyServiceMediaRow> {
    let uploadUri = imageUri;
    try {
      uploadUri = await ensureJpegUriForUpload(imageUri);
    } catch {
      uploadUri = imageUri;
    }
    const response = await fetch(uploadUri);
    const body = await response.blob();
    const path = `${userId}/${serviceId}/restaurant-menu-${Date.now()}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_JOLLY_SERVICE_MEDIA)
      .upload(path, body, { contentType: 'image/jpeg', upsert: false });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from(BUCKET_JOLLY_SERVICE_MEDIA)
      .getPublicUrl(uploadData.path);

    const { data, error } = await supabase
      .from('jolly_service_media')
      .insert({
        service_id: serviceId,
        jolly_id: userId,
        media_kind: 'restaurant_menu',
        file_type: 'image',
        storage_path: uploadData.path,
        public_url: urlData?.publicUrl ?? null,
        mime_type: 'image/jpeg',
        size_bytes: typeof body.size === 'number' ? body.size : null,
        sort_order: 0,
        is_cover: false,
        status: 'pending',
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as JollyServiceMediaRow;
  }

  static async getMediaForService(serviceId: string, approvedOnly = false): Promise<JollyServiceMediaRow[]> {
    let query = supabase
      .from('jolly_service_media')
      .select('*')
      .eq('service_id', serviceId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (approvedOnly) query = query.eq('status', 'approved');
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as JollyServiceMediaRow[];
  }

  /**
   * Approved cover image URLs for a Jolly (KOL&BED carousel).
   */
  static async getApprovedCoverUrlsForJolly(jollyId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('jolly_service_media')
      .select('public_url, media_kind, is_cover')
      .eq('jolly_id', jollyId)
      .eq('status', 'approved')
      .not('public_url', 'is', null);
    if (error) throw error;
    const rows = (data ?? []) as Pick<JollyServiceMediaRow, 'public_url' | 'media_kind' | 'is_cover'>[];
    return rows
      .filter(
        (r) =>
          r.public_url &&
          (r.is_cover || COVER_MEDIA_KINDS.includes(r.media_kind))
      )
      .map((r) => r.public_url as string);
  }

  /**
   * Resolves preview URLs for admin moderation (signed URLs work on private buckets).
   */
  static async resolveMediaPreviewUrls(
    rows: Pick<JollyServiceMediaRow, 'id' | 'public_url' | 'storage_path'>[]
  ): Promise<Record<string, string>> {
    const out: Record<string, string> = {};
    await Promise.all(
      rows.map(async (row) => {
        if (row.storage_path?.trim()) {
          const { data, error } = await supabase.storage
            .from(BUCKET_JOLLY_SERVICE_MEDIA)
            .createSignedUrl(row.storage_path, 60 * 60);
          if (!error && data?.signedUrl) {
            out[row.id] =data.signedUrl;
            return;
          }
        }
        if (row.public_url?.trim()) {
          out[row.id] = row.public_url.trim();
        }
      })
    );
    return out;
  }

  /** All pending Jolly service media (admin RPC). */
  static async getPendingJollyServiceMediaForAdmin(): Promise<JollyServiceMediaAdminRow[]> {
    const { data, error } = await supabase.rpc('get_pending_jolly_service_media');
    if (error) throw error;
    if (!data) return [];
    const list = Array.isArray(data) ? data : [];
    return list as JollyServiceMediaAdminRow[];
  }

  static async approveJollyServiceMedia(mediaId: string): Promise<void> {
    const { error } = await supabase.rpc('approve_jolly_service_media', { p_media_id: mediaId });
    if (error) throw error;
  }

  static async rejectJollyServiceMedia(mediaId: string): Promise<void> {
    const { error } = await supabase.rpc('reject_jolly_service_media', { p_media_id: mediaId });
    if (error) throw error;
  }

  static parseNumber = safeParseNumber;
}

