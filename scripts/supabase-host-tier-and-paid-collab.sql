-- =============================================================================
-- Migration: tabella profiles (se manca) + host_tier + accepts_paid_collaborations
-- =============================================================================
--
-- Puoi eseguire SOLO questo file anche su un progetto Supabase vuoto:
--   1. Crea public.profiles se non esiste (stesso nucleo di supabase-schema.sql)
--   2. Abilita RLS e policy base
--   3. Aggiunge le colonne host_tier e accepts_paid_collaborations
--
-- Se hai già eseguito supabase-schema.sql, questo script è idempotente:
--   le CREATE usano IF NOT EXISTS, le colonne ADD COLUMN IF NOT EXISTS.
--
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Tabella profiles (solo se non esiste ancora)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,

  role TEXT CHECK (role IN ('host', 'creator', 'jolly', 'manager')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  points INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

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

CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

-- ---------------------------------------------------------------------------
-- Nuove colonne (sempre, anche su DB già creati con schema vecchio)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS host_tier TEXT
    CHECK (host_tier IS NULL OR host_tier IN ('basic', 'medium', 'luxury'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS accepts_paid_collaborations BOOLEAN
    DEFAULT FALSE;

-- Indice parziale per KOL&BED
CREATE INDEX IF NOT EXISTS idx_profiles_host_tier
  ON public.profiles (host_tier)
  WHERE role = 'host';

COMMENT ON COLUMN public.profiles.host_tier IS
  'Livello struttura host: basic (UGC), medium (micro), luxury (macro).';
COMMENT ON COLUMN public.profiles.accepts_paid_collaborations IS
  'TRUE se l''host accetta collaborazioni a pagamento cross-tier.';

-- Verifica:
-- SELECT id, role, host_tier, accepts_paid_collaborations FROM public.profiles LIMIT 5;
