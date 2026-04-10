/**
 * Invitations Service
 * Invita host / Invita creator: genera link univoci e gestisce invitati
 */

import { supabase } from './supabase';
import type { UserProfile } from '../types';

const INVITE_BASE_URL = 'https://nomadiqe.app/invite';
const ALPHANUM = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += ALPHANUM[Math.floor(Math.random() * ALPHANUM.length)];
  }
  return code;
}

export type InviteRole = 'host' | 'creator';

export interface Invitation {
  id: string;
  inviter_id: string;
  invite_code: string;
  role: InviteRole;
  invited_id: string | null;
  created_at: string;
}

export interface InvitationWithInvited extends Invitation {
  invited?: UserProfile | null;
}

/**
 * Crea un invito (host o creator) e restituisce il link da condividere
 */
export async function createInvite(inviterId: string, role: InviteRole): Promise<string> {
  let code = generateInviteCode();
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    const { data: existing } = await supabase
      .from('invitations')
      .select('id')
      .eq('invite_code', code)
      .maybeSingle();

    if (!existing) break;
    code = generateInviteCode();
    attempts++;
  }

  const { error } = await supabase.from('invitations').insert({
    inviter_id: inviterId,
    invite_code: code,
    role,
  });

  if (error) throw error;
  return `${INVITE_BASE_URL}?code=${code}`;
}

/**
 * Recupera invito per codice (per validare link e pre-impostare ruolo)
 */
export async function getInviteByCode(code: string): Promise<Invitation | null> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('invite_code', code.trim())
    .is('invited_id', null)
    .maybeSingle();

  if (error) throw error;
  return data as Invitation | null;
}

/**
 * Associa l'utente appena registrato all'invito. Restituisce inviterId e role per assegnare punti all'invitante.
 */
export async function claimInvite(
  code: string,
  invitedUserId: string
): Promise<{ inviterId: string; role: InviteRole } | null> {
  const inv = await getInviteByCode(code.trim());
  if (!inv) return null;

  const { error } = await supabase
    .from('invitations')
    .update({ invited_id: invitedUserId })
    .eq('id', inv.id);

  if (error) throw error;
  return { inviterId: inv.inviter_id, role: inv.role };
}

/**
 * Lista host o creator invitati da me (per dashboard)
 */
export async function getInvitedByMe(
  inviterId: string,
  role: InviteRole
): Promise<InvitationWithInvited[]> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('inviter_id', inviterId)
    .eq('role', role)
    .not('invited_id', 'is', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const list = (data as Invitation[]) || [];

  if (list.length === 0) return list as InvitationWithInvited[];

  const ids = list.map((i) => i.invited_id).filter(Boolean) as string[];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', ids);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  return list.map((inv) => ({
    ...inv,
    invited: inv.invited_id ? (profileMap.get(inv.invited_id) as UserProfile) : null,
  })) as InvitationWithInvited[];
}
