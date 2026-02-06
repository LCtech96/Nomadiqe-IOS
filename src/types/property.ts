/**
 * Property Types - Nomadiqe
 * Based on Supabase properties schema
 */

export type PropertyType = 
  | 'apartment'
  | 'house'
  | 'villa'
  | 'room'
  | 'studio'
  | 'loft'
  | 'cottage'
  | 'bungalow'
  | 'other';

export type PropertyStatus = 'draft' | 'active' | 'inactive' | 'archived';

export interface Property {
  id: string;
  owner_id: string;
  host_id: string;
  
  // Basic info
  title: string;
  description: string;
  type: PropertyType;
  status: PropertyStatus;
  
  // Location
  address: string;
  city: string;
  state: string | null;
  country: string;
  postal_code: string | null;
  latitude: number;
  longitude: number;
  
  // Capacity
  bedrooms: number;
  bathrooms: number;
  beds: number;
  max_guests: number;
  
  // Pricing
  base_price_per_night: number;
  currency: string;
  cleaning_fee: number | null;
  
  // Media
  images: string[];
  video_url: string | null;
  virtual_tour_url: string | null;
  
  // Amenities
  amenities: string[];
  
  // Rules
  house_rules: string[];
  check_in_time: string | null;
  check_out_time: string | null;
  minimum_stay: number;
  maximum_stay: number | null;
  
  // Status
  is_active: boolean;
  is_featured: boolean;
  instant_book: boolean;
  
  // Stats
  views_count: number;
  favorites_count: number;
  bookings_count: number;
  average_rating: number | null;
  reviews_count: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface PropertyTranslation {
  id: string;
  property_id: string;
  language: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyAvailability {
  id: string;
  property_id: string;
  date: string;
  is_available: boolean;
  min_stay: number | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyDailyPricing {
  id: string;
  property_id: string;
  date: string;
  price_per_night: number;
  created_at: string;
  updated_at: string;
}
