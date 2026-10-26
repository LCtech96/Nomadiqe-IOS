/**
 * Local persistence for creator dashboard analytics screenshot uploads (per metric).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const CREATOR_ANALYTICS_UPLOAD_KEYS = [
  'last_90_days',
  'last_month',
  'last_week',
  'pie_chart_views',
  'accounts_reached',
  'content_reels',
  'content_posts',
  'content_stories',
  'profile_activity',
  'profile_visits',
  'external_link_taps',
  'audience_demographics_30d',
  'audience_demographics_7d',
] as const;

export type CreatorAnalyticsUploadKey = (typeof CREATOR_ANALYTICS_UPLOAD_KEYS)[number];

export type CreatorAnalyticsUploads = Record<CreatorAnalyticsUploadKey, string | null>;

const EMPTY_UPLOADS: CreatorAnalyticsUploads = Object.fromEntries(
  CREATOR_ANALYTICS_UPLOAD_KEYS.map((key) => [key, null])
) as CreatorAnalyticsUploads;

const storageKey = (userId: string) => `@nomadiqe/creator-dashboard/analytics/${userId}`;

export class CreatorDashboardAnalyticsService {
  static async load(userId: string): Promise<CreatorAnalyticsUploads> {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) return { ...EMPTY_UPLOADS };
    try {
      const parsed = JSON.parse(raw) as Partial<CreatorAnalyticsUploads>;
      return { ...EMPTY_UPLOADS, ...parsed };
    } catch {
      return { ...EMPTY_UPLOADS };
    }
  }

  static async setUpload(
    userId: string,
    key: CreatorAnalyticsUploadKey,
    uri: string | null
  ): Promise<CreatorAnalyticsUploads> {
    const current = await this.load(userId);
    const next = { ...current, [key]: uri };
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(next));
    return next;
  }
}
