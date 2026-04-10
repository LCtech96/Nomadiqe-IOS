-- NOMADIQE - Content creator: categorie, preferenze strutture, link social, richiesta admin
-- Esegui dopo profiles e properties esistenti.

-- 1) Profili: campi creator (categoria, preferenze strutture, link social, stato richiesta, opportunità approvate)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS creator_category TEXT;
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS creator_structure_preferences TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS creator_status TEXT DEFAULT 'pending';
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_approved_opportunities TEXT[] DEFAULT '{}';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_creator_category_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_creator_category_check
  CHECK (creator_category IS NULL OR creator_category IN ('micro_influencer', 'influencer', 'ugc_creator'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_creator_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_creator_status_check
  CHECK (creator_status IS NULL OR creator_status IN ('pending', 'approved', 'rejected'));

COMMENT ON COLUMN public.profiles.creator_category IS 'micro_influencer | influencer | ugc_creator';
COMMENT ON COLUMN public.profiles.creator_structure_preferences IS 'Tipi strutture con cui il creator vuole collaborare: basic, basic_paid, medium, medium_fees, luxury, luxury_paid';
COMMENT ON COLUMN public.profiles.social_links IS 'Link social: instagram, tiktok, facebook, x, youtube, pinterest, linkedin';
COMMENT ON COLUMN public.profiles.creator_status IS 'pending = in attesa approvazione admin, approved = può vedere host in KOL&BED, rejected';
COMMENT ON COLUMN public.profiles.admin_approved_opportunities IS 'Opportunità approvate dall''admin: quali tipi di strutture (offer_type) il creator può vedere in KOL&BED';

-- 2) Properties: tipo offerta per filtrare visibilità ai creator (basic, basic_paid, medium, medium_fees, luxury, luxury_paid)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS offer_type TEXT DEFAULT 'basic';

ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_offer_type_check;
ALTER TABLE public.properties ADD CONSTRAINT properties_offer_type_check
  CHECK (offer_type IS NULL OR offer_type IN ('basic', 'basic_paid', 'medium', 'medium_fees', 'luxury', 'luxury_paid'));

COMMENT ON COLUMN public.properties.offer_type IS 'Tier struttura per KOL&BED: basic, basic_paid, medium, medium_fees, luxury, luxury_paid';
