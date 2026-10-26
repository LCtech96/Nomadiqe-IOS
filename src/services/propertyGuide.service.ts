/**
 * Property Guide Service — host-editable guest info per property
 */

import { config } from '../constants/config';
import { supabase } from './supabase';
import type { PropertyGuide, PropertyGuideFields } from '../types/propertyGuide';

const ALPHANUM = 'abcdefghijklmnopqrstuvwxyz0123456789';

function randomToken(len = 24): string {
  let s = '';
  for (let i = 0; i < len; i++) {
    s += ALPHANUM[Math.floor(Math.random() * ALPHANUM.length)];
  }
  return s;
}

const EMPTY_GUIDE_FIELDS: PropertyGuideFields = {
  check_in_out: '',
  how_to_get_there: '',
  wifi: '',
  transportation: '',
  good_to_know: '',
  what_to_do: '',
  restaurants: '',
  bars: '',
  property_rules: '',
  emergency_numbers: '',
};

export function buildPropertyGuideShareUrl(propertyId: string, token: string): string {
  const scheme = config.app.shareScheme || 'nomadiqe';
  return `${scheme}://property-guide/${propertyId}?t=${token}`;
}

export class PropertyGuideService {
  static async getGuide(propertyId: string): Promise<PropertyGuide | null> {
    const { data, error } = await supabase
      .from('property_guides')
      .select('*')
      .eq('property_id', propertyId)
      .maybeSingle();
    if (error) throw error;
    return data as PropertyGuide | null;
  }

  static async getOrCreateGuide(propertyId: string, hostId: string): Promise<PropertyGuide> {
    const existing = await this.getGuide(propertyId);
    if (existing) return existing;

    const { data, error } = await supabase
      .from('property_guides')
      .insert({
        property_id: propertyId,
        host_id: hostId,
        ...EMPTY_GUIDE_FIELDS,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as PropertyGuide;
  }

  static async updateGuide(
    propertyId: string,
    hostId: string,
    fields: Partial<PropertyGuideFields>
  ): Promise<PropertyGuide> {
    await this.getOrCreateGuide(propertyId, hostId);
    const { data, error } = await supabase
      .from('property_guides')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('property_id', propertyId)
      .eq('host_id', hostId)
      .select('*')
      .single();
    if (error) throw error;
    return data as PropertyGuide;
  }

  static async isPropertyHost(userId: string, propertyId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('properties')
      .select('owner_id, host_id')
      .eq('id', propertyId)
      .maybeSingle();
    if (error || !data) return false;
    return data.owner_id === userId || data.host_id === userId;
  }

  static async hasGrantedAccess(creatorId: string, propertyId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('property_guide_access')
      .select('id')
      .eq('creator_id', creatorId)
      .eq('property_id', propertyId)
      .maybeSingle();
    if (error) return false;
    return Boolean(data);
  }

  static async grantAccess(
    creatorId: string,
    propertyId: string,
    via: 'share_link' | 'collaboration' = 'share_link'
  ): Promise<void> {
    const { error } = await supabase
      .from('property_guide_access')
      .upsert(
        { creator_id: creatorId, property_id: propertyId, granted_via: via },
        { onConflict: 'property_id,creator_id' }
      );
    if (error) throw error;
  }

  static async hasCreatorBookingAtProperty(creatorId: string, propertyId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('host_creator_collaboration_requests')
      .select('id, request_extras, status')
      .eq('creator_id', creatorId)
      .in('status', ['accepted', 'completed']);
    if (error) return false;
    return (data ?? []).some((row) => {
      const extras = row.request_extras as { property_id?: string } | null;
      return extras?.property_id === propertyId;
    });
  }

  static async validateShareToken(propertyId: string, token: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('property_guide_share_links')
      .select('id')
      .eq('property_id', propertyId)
      .eq('token', token)
      .maybeSingle();
    if (error) return false;
    return Boolean(data);
  }

  static async createShareLink(
    propertyId: string,
    hostId: string
  ): Promise<{ shareUrl: string; token: string }> {
    let token = randomToken();
    for (let attempt = 0; attempt < 4; attempt++) {
      const { data, error } = await supabase
        .from('property_guide_share_links')
        .insert({ property_id: propertyId, host_id: hostId, token })
        .select('token')
        .single();
      if (!error && data) {
        return { shareUrl: buildPropertyGuideShareUrl(propertyId, data.token), token: data.token };
      }
      if (error?.code === '23505') {
        token = randomToken();
        continue;
      }
      throw error ?? new Error('createShareLink failed');
    }
    throw new Error('Impossibile generare un token univoco');
  }

  static async getExistingShareLink(
    propertyId: string,
    hostId: string
  ): Promise<{ shareUrl: string; token: string } | null> {
    const { data, error } = await supabase
      .from('property_guide_share_links')
      .select('token')
      .eq('property_id', propertyId)
      .eq('host_id', hostId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return { shareUrl: buildPropertyGuideShareUrl(propertyId, data.token), token: data.token };
  }

  static async canCreatorViewGuide(
    creatorId: string,
    propertyId: string,
    token?: string
  ): Promise<boolean> {
    if (token) {
      const valid = await this.validateShareToken(propertyId, token);
      if (valid) {
        await this.grantAccess(creatorId, propertyId, 'share_link');
        return true;
      }
    }

    if (await this.hasGrantedAccess(creatorId, propertyId)) return true;

    const hasBooking = await this.hasCreatorBookingAtProperty(creatorId, propertyId);
    if (hasBooking) {
      await this.grantAccess(creatorId, propertyId, 'collaboration');
      return true;
    }

    return false;
  }
}
