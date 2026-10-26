/**
 * User Types - Nomadiqe
 * Based on Supabase profiles schema
 */

export type UserRole = 'host' | 'creator' | 'jolly' | 'manager' | null;

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  bio_links_approved?: boolean | null;
  role: UserRole;
  jolly_subcategory: string | null; // cleaner | property_manager | fornitore | restaurant | excursions | home_products (legacy DB may still store boat_excursions — treat as excursions in app)

  // Location
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  
  // Stats
  points: number;
  followers_count: number;
  following_count: number;
  
  // Creator application (role=creator)
  creator_category?: 'micro_influencer' | 'influencer' | 'ugc_creator' | null;
  creator_structure_preferences?: string[] | null;
  social_links?: Record<string, string | null> | null;
  creator_status?: 'pending' | 'approved' | 'rejected' | null;
  admin_approved_opportunities?: string[] | null;
  /** ISO date for age (KOL&BED card) */
  date_of_birth?: string | null;
  /** Languages spoken (locale codes); first = mother tongue (KOL&BED) */
  content_language?: string[] | null;
  /** Creator cover/gallery images (first = cover). Fallback: [avatar_url] */
  profile_cover_images?: string[] | null;

  // Host tier & paid collab
  /** Tier dell'host per il matching creator: basic | medium | luxury */
  host_tier?: 'basic' | 'medium' | 'luxury' | null;
  /** L'host accetta collaborazioni a pagamento (cross-tier con compensazione) */
  accepts_paid_collaborations?: boolean | null;
  host_status?: 'pending' | 'approved' | 'rejected' | null;
  has_own_website?: boolean | null;
  payment_model?: 'personal_checkout' | 'nomadiqe_5_percent' | null;
  host_tier_justification?: string | null;
  reference_niches?: string[] | null;
  collab_months?: string[] | null;
  promotion_platforms?: string[] | null;
  sponsor_personal_website?: boolean | null;
  kolbed_plans?: string[] | null;
  host_onboarding_data?: Record<string, unknown> | null;

  // Noma Hub subscription
  subscription_tier?: SubscriptionTier | null;
  /** End of the free trial; while in the future the user gets pro-level access */
  trial_ends_at?: string | null;

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
  /** Niches for display (e.g. from creator_niches table or denormalized) */
  niches_display?: string[];
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
