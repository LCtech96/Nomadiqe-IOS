/**
 * Host review gate — show blocking UI while admin approves the application.
 */

import { isAdminEmail } from '../constants/admin';
import type { UserProfile } from '../types';

export function isHostAwaitingApproval(profile: UserProfile | null | undefined): boolean {
  if (!profile || profile.role !== 'host') return false;
  if (isAdminEmail(profile.email)) return false;

  const onboardingDone =
    profile.onboarding_completed === true ||
    String(profile.onboarding_completed).toLowerCase() === 'true';

  if (!onboardingDone) return false;

  const status = profile.host_status ?? null;
  // Only hosts who explicitly submitted and await review are gated.
  // Legacy hosts (onboarding done before host_status existed) have null and stay approved.
  return status === 'pending';
}
