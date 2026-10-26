/**
 * Creator dashboard helpers — social account counts, invite progress, collaboration buckets.
 */

import type { SocialPlatform } from '../constants/creator';
import { CREATOR_SOCIAL_PLATFORMS } from '../constants/creator';
import type { CollaborationRequest } from '../services/collaboration.service';
import type { UserProfile } from '../types';

export type CreatorCollabBucket = 'pending' | 'active' | 'completed';

export function countLinkedSocialAccounts(
  socialLinks: Record<string, string | null> | null | undefined
): number {
  const count = CREATOR_SOCIAL_PLATFORMS.filter(({ key }) => {
    const value = socialLinks?.[key];
    return typeof value === 'string' && value.trim().length > 0;
  }).length;
  return Math.max(1, count);
}

export function listLinkedSocialAccounts(
  socialLinks: Record<string, string | null> | null | undefined
): { platform: SocialPlatform; url: string }[] {
  return CREATOR_SOCIAL_PLATFORMS.filter(({ key }) => {
    const value = socialLinks?.[key];
    return typeof value === 'string' && value.trim().length > 0;
  }).map(({ key }) => ({
    platform: key,
    url: (socialLinks?.[key] as string).trim(),
  }));
}

export function socialDisplayHandle(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('@')) return trimmed.toUpperCase();
  try {
    const normalized = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    const path = new URL(normalized).pathname;
    const segments = path.split('/').filter(Boolean);
    const handle = (segments[segments.length - 1] ?? trimmed).replace(/^@/, '');
    return `@${handle}`.toUpperCase();
  } catch {
    return `@${trimmed.replace(/^@/, '')}`.toUpperCase();
  }
}

/** 4-step invite funnel: waitlist join → waitlist approval → onboarding → admin approval */
export function getInviteProgressPercent(invited: UserProfile | null | undefined): number {
  if (!invited) return 0;
  let progress = 25;
  if (invited.role) progress = 50;
  if (invited.onboarding_completed) progress = 75;
  if (invited.role === 'creator' && invited.creator_status === 'approved') progress = 100;
  else if (invited.role === 'host' && invited.onboarding_completed) progress = 100;
  else if (invited.role === 'jolly' && invited.onboarding_completed) progress = 100;
  return progress;
}

function collabBucket(status: string | null | undefined): CreatorCollabBucket | null {
  if (status === 'pending') return 'pending';
  if (status === 'accepted') return 'active';
  if (status === 'completed') return 'completed';
  return null;
}

export function summarizeCreatorCollaborations(requests: CollaborationRequest[]) {
  const buckets: Record<CreatorCollabBucket, CollaborationRequest[]> = {
    pending: [],
    active: [],
    completed: [],
  };

  for (const req of requests) {
    const bucket = collabBucket(req.status);
    if (bucket) buckets[bucket].push(req);
  }

  const total =
    buckets.pending.length + buckets.active.length + buckets.completed.length;

  return {
    pending: buckets.pending.length,
    active: buckets.active.length,
    completed: buckets.completed.length,
    total,
    activeCount: buckets.active.length,
    byBucket: buckets,
  };
}
