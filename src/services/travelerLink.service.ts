/**
 * Link condivisibili con viaggiatori (struttura, date, ospiti) — tabella traveler_booking_links
 */

import { supabase } from './supabase';

const PUBLIC_BOOKING_BASE = 'https://nomadiqe.app/book';

const ALPHANUM = 'abcdefghijklmnopqrstuvwxyz0123456789';

function randomToken(len = 24): string {
  let s = '';
  for (let i = 0; i < len; i++) {
    s += ALPHANUM[Math.floor(Math.random() * ALPHANUM.length)];
  }
  return s;
}

export interface CreateTravelerLinkInput {
  hostId: string;
  propertyId: string;
  dateFrom?: string | null;
  dateTo?: string | null;
  maxGuests?: number;
  travelerNotesHint?: string | null;
}

export async function createTravelerBookingLink(input: CreateTravelerLinkInput): Promise<{ shareUrl: string; token: string }> {
  let token = randomToken();
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data, error } = await supabase
      .from('traveler_booking_links')
      .insert({
        host_id: input.hostId,
        property_id: input.propertyId,
        token,
        date_from: input.dateFrom || null,
        date_to: input.dateTo || null,
        max_guests: input.maxGuests ?? 4,
        traveler_notes_hint: input.travelerNotesHint?.slice(0, 500) || null,
      })
      .select('token')
      .single();

    if (!error && data) {
      return { shareUrl: `${PUBLIC_BOOKING_BASE}?t=${data.token}`, token: data.token };
    }
    if (error?.code === '23505') {
      token = randomToken();
      continue;
    }
    throw error ?? new Error('createTravelerBookingLink failed');
  }
  throw new Error('Impossibile generare un token univoco');
}
