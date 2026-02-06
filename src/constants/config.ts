/**
 * App Configuration
 * Environment variables and constants
 */

export const config = {
  // Supabase
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  },

  // App
  app: {
    name: 'Nomadiqe',
    version: '1.0.0',
    bundleId: 'com.nomadiqe.ios',
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
