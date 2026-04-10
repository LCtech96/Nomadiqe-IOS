/**
 * Points Service
 * Assegnazione punti con cap giornalieri per azione
 */

import { supabase } from './supabase';

export type PointActionType = 'like' | 'comment' | 'create_post' | 'invite_host' | 'invite_creator' | 'host_accept_collaboration';

const POINT_CONFIG: Record<PointActionType, { points: number; maxPerDay: number }> = {
  like: { points: 1, maxPerDay: 5 },
  comment: { points: 2, maxPerDay: 5 },
  create_post: { points: 15, maxPerDay: 1 },
  invite_host: { points: 500, maxPerDay: 3 },
  invite_creator: { points: 500, maxPerDay: 3 },
  host_accept_collaboration: { points: 50, maxPerDay: 20 },
};

function todayStart(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function tomorrowStart(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Conta quante volte oggi l'utente ha già eseguito questa azione (per il cap)
 */
export async function getTodayActionCount(
  userId: string,
  actionType: PointActionType
): Promise<number> {
  const from = todayStart();
  const to = tomorrowStart();

  const { count, error } = await supabase
    .from('point_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action_type', actionType)
    .gte('created_at', from)
    .lt('created_at', to);

  if (error) throw error;
  return count ?? 0;
}

/**
 * Assegna punti per un'azione se sotto il cap giornaliero. Restituisce i punti assegnati (0 se cap raggiunto).
 */
export async function awardPoints(
  userId: string,
  actionType: PointActionType
): Promise<number> {
  const config = POINT_CONFIG[actionType];
  if (!config) return 0;

  const currentCount = await getTodayActionCount(userId, actionType);
  if (currentCount >= config.maxPerDay) return 0;

  const toAward = config.points;

  const { error: insertError } = await supabase.from('point_events').insert({
    user_id: userId,
    action_type: actionType,
    points: toAward,
  });

  if (insertError) throw insertError;

  await addPointsToProfile(userId, toAward);
  return toAward;
}

/**
 * Incrementa i punti nel profilo (chiamato dopo insert in point_events)
 */
export async function addPointsToProfile(userId: string, points: number): Promise<void> {
  const { data, error: fetchErr } = await supabase
    .from('profiles')
    .select('points')
    .eq('id', userId)
    .single();

  if (fetchErr) throw fetchErr;
  const current = (data?.points ?? 0) as number;

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ points: current + points })
    .eq('id', userId);

  if (updateErr) throw updateErr;
}
