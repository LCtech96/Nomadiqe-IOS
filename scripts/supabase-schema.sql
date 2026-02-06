-- ============================================
-- NOMADIQE DATABASE SCHEMA
-- Complete SQL for Supabase PostgreSQL
-- Idempotent: safe to run multiple times (drops policies/triggers before recreate)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE (extends auth.users)
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,

  -- Role and status
  role TEXT CHECK (role IN ('host', 'creator', 'jolly', 'manager')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Location
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Stats
  points INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles (drop first so script is idempotent)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Index for username lookup
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

-- ============================================
-- 2. SOCIAL ACCOUNTS (for creators)
-- ============================================

CREATE TABLE IF NOT EXISTS public.social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'twitter', 'facebook')),
  username TEXT NOT NULL,
  follower_count INTEGER,
  is_verified BOOLEAN DEFAULT FALSE,
  profile_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, platform)
);

ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Social accounts viewable by everyone" ON public.social_accounts;
CREATE POLICY "Social accounts viewable by everyone"
  ON public.social_accounts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can manage own social accounts" ON public.social_accounts;
CREATE POLICY "Users can manage own social accounts"
  ON public.social_accounts FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 3. CREATOR NICHES
-- ============================================

CREATE TABLE IF NOT EXISTS public.creator_niches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  niche TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.creator_niches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Niches viewable by everyone" ON public.creator_niches;
CREATE POLICY "Niches viewable by everyone"
  ON public.creator_niches FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can manage own niches" ON public.creator_niches;
CREATE POLICY "Users can manage own niches"
  ON public.creator_niches FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 4. PROPERTIES
-- ============================================

CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Basic info
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('apartment', 'house', 'villa', 'room', 'studio', 'loft', 'cottage', 'bungalow', 'other')),
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'inactive', 'archived')),

  -- Location
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL,
  postal_code TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,

  -- Capacity
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  beds INTEGER DEFAULT 1,
  max_guests INTEGER DEFAULT 2,

  -- Pricing
  base_price_per_night DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  cleaning_fee DECIMAL(10, 2),

  -- Media
  images TEXT[] DEFAULT '{}',
  video_url TEXT,
  virtual_tour_url TEXT,

  -- Amenities
  amenities TEXT[] DEFAULT '{}',

  -- Rules
  house_rules TEXT[] DEFAULT '{}',
  check_in_time TEXT,
  check_out_time TEXT,
  minimum_stay INTEGER DEFAULT 1,
  maximum_stay INTEGER,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  instant_book BOOLEAN DEFAULT FALSE,

  -- Stats
  views_count INTEGER DEFAULT 0,
  favorites_count INTEGER DEFAULT 0,
  bookings_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2),
  reviews_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active properties viewable by everyone" ON public.properties;
CREATE POLICY "Active properties viewable by everyone"
  ON public.properties FOR SELECT
  USING (is_active = true OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can manage own properties" ON public.properties;
CREATE POLICY "Owners can manage own properties"
  ON public.properties FOR ALL
  USING (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS properties_location_idx ON public.properties(latitude, longitude);
CREATE INDEX IF NOT EXISTS properties_owner_idx ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS properties_city_idx ON public.properties(city);

-- ============================================
-- 5. PROPERTY TRANSLATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.property_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('it', 'en', 'ru', 'fr', 'de')),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(property_id, language)
);

ALTER TABLE public.property_translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Translations viewable by everyone" ON public.property_translations;
CREATE POLICY "Translations viewable by everyone"
  ON public.property_translations FOR SELECT
  USING (true);

-- ============================================
-- 6. POSTS (Social Feed)
-- ============================================

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Content
  content TEXT NOT NULL,
  media JSONB DEFAULT '[]',
  type TEXT DEFAULT 'standard' CHECK (type IN ('standard', 'showcase', 'collaboration')),

  -- Links
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  collaboration_id UUID,

  -- Engagement
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  reposts_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,

  -- Status
  approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  is_pinned BOOLEAN DEFAULT FALSE,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Approved posts viewable by everyone" ON public.posts;
CREATE POLICY "Approved posts viewable by everyone"
  ON public.posts FOR SELECT
  USING (approval_status = 'approved' AND visibility = 'public');

DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
CREATE POLICY "Users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = author_id);

CREATE INDEX IF NOT EXISTS posts_author_idx ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts(created_at DESC);

-- ============================================
-- 7. POST LIKES
-- ============================================

CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Likes viewable by everyone" ON public.post_likes;
CREATE POLICY "Likes viewable by everyone"
  ON public.post_likes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can like posts" ON public.post_likes;
CREATE POLICY "Users can like posts"
  ON public.post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike posts" ON public.post_likes;
CREATE POLICY "Users can unlike posts"
  ON public.post_likes FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS post_likes_post_idx ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS post_likes_user_idx ON public.post_likes(user_id);

-- ============================================
-- 8. POST COMMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,

  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments viewable by everyone" ON public.post_comments;
CREATE POLICY "Comments viewable by everyone"
  ON public.post_comments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create comments" ON public.post_comments;
CREATE POLICY "Users can create comments"
  ON public.post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON public.post_comments;
CREATE POLICY "Users can update own comments"
  ON public.post_comments FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.post_comments;
CREATE POLICY "Users can delete own comments"
  ON public.post_comments FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS post_comments_post_idx ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS post_comments_user_idx ON public.post_comments(user_id);

-- ============================================
-- 9. FOLLOWS
-- ============================================

CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Follows viewable by everyone" ON public.follows;
CREATE POLICY "Follows viewable by everyone"
  ON public.follows FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
CREATE POLICY "Users can follow others"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;
CREATE POLICY "Users can unfollow"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

CREATE INDEX IF NOT EXISTS follows_follower_idx ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_idx ON public.follows(following_id);

-- ============================================
-- 10. MESSAGES
-- ============================================

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE INDEX IF NOT EXISTS messages_sender_idx ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_recipient_idx ON public.messages(recipient_id);

-- ============================================
-- 11. BOOKINGS
-- ============================================

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  guest_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL,

  total_price DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = guest_id OR auth.uid() = host_id);

DROP POLICY IF EXISTS "Guests can create bookings" ON public.bookings;
CREATE POLICY "Guests can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = guest_id);

-- ============================================
-- 12. MANAGER SERVICES (Jolly)
-- ============================================

CREATE TABLE IF NOT EXISTS public.manager_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price DECIMAL(10, 2),
  currency TEXT DEFAULT 'EUR',

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.manager_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Services viewable by everyone" ON public.manager_services;
CREATE POLICY "Services viewable by everyone"
  ON public.manager_services FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Providers can manage own services" ON public.manager_services;
CREATE POLICY "Providers can manage own services"
  ON public.manager_services FOR ALL
  USING (auth.uid() = provider_id);

-- ============================================
-- FUNCTIONS FOR COUNTERS
-- ============================================

-- Increment post likes
CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.posts
  SET likes_count = likes_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement post likes
CREATE OR REPLACE FUNCTION decrement_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.posts
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment post comments
CREATE OR REPLACE FUNCTION increment_post_comments(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.posts
  SET comments_count = comments_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at (drop first so script is idempotent)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
