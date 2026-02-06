/**
 * User Types - Nomadiqe
 * Based on Supabase profiles schema
 */

export type UserRole = 'host' | 'creator' | 'jolly' | 'manager' | null;

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  
  // Location
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  
  // Stats
  points: number;
  followers_count: number;
  following_count: number;
  
  // Status
  onboarding_completed: boolean;
  is_verified: boolean;
  is_active: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  last_seen_at: string | null;
}

export interface SocialAccount {
  id: string;
  user_id: string;
  platform: 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'facebook';
  username: string;
  follower_count: number | null;
  is_verified: boolean;
  profile_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatorNiche {
  id: string;
  user_id: string;
  niche: string;
  created_at: string;
}

export interface CreatorProfile extends UserProfile {
  role: 'creator';
  social_accounts: SocialAccount[];
  niches: CreatorNiche[];
  average_engagement_rate: number | null;
  content_language: string[];
}

export interface HostProfile extends UserProfile {
  role: 'host';
  properties_count: number;
  average_rating: number | null;
  total_reviews: number;
}

export interface JollyProfile extends UserProfile {
  role: 'jolly';
  services_count: number;
  service_categories: string[];
}
