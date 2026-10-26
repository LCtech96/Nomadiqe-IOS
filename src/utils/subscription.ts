/**
 * Noma Hub subscription gating — effective tier and directory visibility limits.
 */

import { isAdminEmail } from '../constants/admin';
import type { SubscriptionTier, UserProfile } from '../types/user';

/** How many profiles/structures a free user sees in Noma Hub. */
export const FREE_TIER_VISIBLE_LIMIT = 5;

export function isTrialActive(profile: UserProfile | null | undefined): boolean {
  if (!profile?.trial_ends_at) return false;
  const endsAt = Date.parse(profile.trial_ends_at);
  return Number.isFinite(endsAt) && endsAt > Date.now();
}

/** Tier actually applied: an active trial grants pro access regardless of the stored tier. */
export function getEffectiveTier(profile: UserProfile | null | undefined): SubscriptionTier {
  if (!profile) return 'free';
  if (isAdminEmail(profile.email)) return 'enterprise';
  if (isTrialActive(profile)) return 'pro';
  return profile.subscription_tier ?? 'free';
}

export function hasFullDirectoryAccess(profile: UserProfile | null | undefined): boolean {
  return getEffectiveTier(profile) !== 'free';
}

/** Null when the user sees everything, otherwise the max number of items to render. */
export function getDirectoryLimit(profile: UserProfile | null | undefined): number | null {
  return hasFullDirectoryAccess(profile) ? null : FREE_TIER_VISIBLE_LIMIT;
}

export function applyDirectoryLimit<T>(items: T[], profile: UserProfile | null | undefined): T[] {
  const limit = getDirectoryLimit(profile);
  return limit == null ? items : items.slice(0, limit);
}
