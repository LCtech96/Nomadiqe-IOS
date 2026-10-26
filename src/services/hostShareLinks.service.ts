/**
 * Host referral (commission) and personal share links — table host_share_links
 */

import { supabase } from './supabase';

const PUBLIC_REFERRAL_BASE = 'https://www.nomadiqe.com/r';
const SLUG_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export type HostShareLinkType = 'commission' | 'personal';

export interface HostShareLink {
  id: string;
  host_id: string;
  link_type: HostShareLinkType;
  slug: string;
  property_id: string | null;
  creator_id: string | null;
  creator_name: string | null;
  creator_email: string | null;
  commission_percent: number | null;
  internal_label: string | null;
  guest_message: string | null;
  click_count: number;
  booking_count: number;
  is_hidden: boolean;
  created_at: string;
}

export interface CreateCommissionLinkInput {
  hostId: string;
  propertyId: string | null;
  creatorId?: string | null;
  creatorName?: string | null;
  creatorEmail?: string | null;
  commissionPercent: number;
  internalLabel?: string | null;
  guestMessage?: string | null;
}

export interface CreatePersonalLinkInput {
  hostId: string;
  propertyId: string | null;
  internalLabel?: string | null;
  guestMessage?: string | null;
}

function randomSlug(len = 8): string {
  let s = '';
  for (let i = 0; i < len; i++) {
    s += SLUG_CHARS[Math.floor(Math.random() * SLUG_CHARS.length)];
  }
  return s;
}

export function shareUrlForSlug(slug: string): string {
  return `${PUBLIC_REFERRAL_BASE}/${slug}`;
}

export class HostShareLinksService {
  static async listByHost(hostId: string): Promise<HostShareLink[]> {
    const { data, error } = await supabase
      .from('host_share_links')
      .select('*')
      .eq('host_id', hostId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as HostShareLink[];
  }

  static async createCommissionLink(input: CreateCommissionLinkInput): Promise<HostShareLink> {
    const row = await HostShareLinksService.insertWithUniqueSlug({
      host_id: input.hostId,
      link_type: 'commission',
      property_id: input.propertyId,
      creator_id: input.creatorId ?? null,
      creator_name: input.creatorName?.trim() || null,
      creator_email: input.creatorEmail?.trim() || null,
      commission_percent: input.commissionPercent,
      internal_label: input.internalLabel?.trim() || null,
      guest_message: input.guestMessage?.slice(0, 280) || null,
    });
    return row;
  }

  static async createPersonalLink(input: CreatePersonalLinkInput): Promise<HostShareLink> {
    const row = await HostShareLinksService.insertWithUniqueSlug({
      host_id: input.hostId,
      link_type: 'personal',
      property_id: input.propertyId,
      creator_id: null,
      creator_name: null,
      creator_email: null,
      commission_percent: null,
      internal_label: input.internalLabel?.trim() || null,
      guest_message: input.guestMessage?.slice(0, 280) || null,
    });
    return row;
  }

  static async setHidden(hostId: string, linkId: string, isHidden: boolean): Promise<void> {
    const { error } = await supabase
      .from('host_share_links')
      .update({ is_hidden: isHidden })
      .eq('id', linkId)
      .eq('host_id', hostId);
    if (error) throw error;
  }

  static async deleteLink(hostId: string, linkId: string): Promise<void> {
    const { error } = await supabase
      .from('host_share_links')
      .delete()
      .eq('id', linkId)
      .eq('host_id', hostId);
    if (error) throw error;
  }

  private static async insertWithUniqueSlug(
    payload: Record<string, unknown>
  ): Promise<HostShareLink> {
    for (let attempt = 0; attempt < 6; attempt++) {
      const slug = randomSlug();
      const { data, error } = await supabase
        .from('host_share_links')
        .insert({ ...payload, slug })
        .select('*')
        .single();
      if (!error && data) return data as HostShareLink;
      if (error?.code === '23505') continue;
      throw error ?? new Error('createHostShareLink failed');
    }
    throw new Error('Unable to generate a unique link slug');
  }
}
