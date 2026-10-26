/**
 * Creator review gate — show blocking UI while admin approves the application.
 */

import { isAdminEmail } from '../constants/admin';
import type { UserProfile } from '../types';

export function isCreatorAwaitingApproval(profile: UserProfile | null | undefined): boolean {
  if (!profile || profile.role !== 'creator') return false;
  if (isAdminEmail(profile.email)) return false;

  const onboardingDone =
    profile.onboarding_completed === true ||
    String(profile.onboarding_completed).toLowerCase() === 'true';

  if (!onboardingDone) return false;

  const status = profile.creator_status ?? null;
  return status === 'pending' || status === null;
}
