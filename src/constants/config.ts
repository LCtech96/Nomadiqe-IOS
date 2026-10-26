/**
 * App Configuration
 * Environment variables and constants
 */

import Constants from 'expo-constants';

function readExpoPublic(key: string): string {
  const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;
  const fromExtra = extra?.[key];
  if (typeof fromExtra === 'string' && fromExtra.trim().length > 0) {
    return fromExtra.trim();
  }
  const fromProcess = process.env[key];
  if (typeof fromProcess === 'string' && fromProcess.trim().length > 0) {
    return fromProcess.trim();
  }
  return '';
}

export const config = {
  // Supabase
  supabase: {
    url: readExpoPublic('EXPO_PUBLIC_SUPABASE_URL'),
    anonKey: readExpoPublic('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  },

  // App
  app: {
    name: 'Nomadiqe',
    version: '1.0.0',
    bundleId: 'com.nomadiqe.ios',
    /** Base URL per esportazione calendario iCal (Airbnb/Booking import). Es: https://xxx.supabase.co/functions/v1/ical-export */
    calendarExportBaseUrl: readExpoPublic('EXPO_PUBLIC_CALENDAR_EXPORT_BASE_URL'),
    /** Schema deep link per condivisione struttura. Es: nomadiqe (→ nomadiqe://property/ID) */
    shareScheme: 'nomadiqe',
  },

  // API
  api: {
    timeout: 30000, // 30 seconds
  },

  // Upload
  upload: {
    maxImageSize: 10 * 1024 * 1024, // 10MB
    maxVideoSize: 100 * 1024 * 1024, // 100MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedVideoTypes: ['video/mp4', 'video/quicktime'],
  },

  // Property media (host)
  propertyMedia: {
    maxPhotosPerProperty: 50,
    maxVideosPerMonthPerProperty: 5,
  },

  // Pagination
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },

  // Map
  map: {
    defaultRegion: {
      latitude: 41.9028, // Rome
      longitude: 12.4964,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    },
  },

  // Social
  social: {
    minUsernameLength: 3,
    maxUsernameLength: 30,
    maxBioLength: 500,
    maxPostLength: 2000,
  },

  // Notifications
  notifications: {
    enabled: true,
  },
} as const;

export default config;
