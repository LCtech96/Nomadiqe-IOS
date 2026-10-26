-- Host onboarding: approval status, payment model, and extended application data.
-- Run in Supabase SQL Editor.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS host_status TEXT
    CHECK (host_status IS NULL OR host_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_own_website BOOLEAN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payment_model TEXT
    CHECK (payment_model IS NULL OR payment_model IN ('personal_checkout', 'nomadiqe_5_percent'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS host_tier_justification TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reference_niches TEXT[];

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS collab_months TEXT[];

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS promotion_platforms TEXT[];

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sponsor_personal_website BOOLEAN DEFAULT FALSE;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS kolbed_plans TEXT[];

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS host_onboarding_data JSONB;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS region TEXT;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS street_address TEXT;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS tier_deliverables JSONB;

COMMENT ON COLUMN public.profiles.host_status IS
  'pending = awaiting admin review after onboarding; approved = full host features; rejected';

CREATE INDEX IF NOT EXISTS idx_profiles_host_status
  ON public.profiles (host_status)
  WHERE role = 'host' AND host_status IS NOT NULL;

-- Admin RPC: approve or reject host applications
CREATE OR REPLACE FUNCTION public.set_host_approval(
  p_profile_id UUID,
  p_status TEXT,
  p_activate_properties BOOLEAN DEFAULT TRUE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid host status: %', p_status;
  END IF;

  UPDATE public.profiles
  SET
    host_status = p_status,
    is_verified = CASE WHEN p_status = 'approved' THEN TRUE ELSE is_verified END,
    updated_at = NOW()
  WHERE id = p_profile_id AND role = 'host';

  IF p_status = 'approved' AND p_activate_properties THEN
    UPDATE public.properties
    SET status = 'active', is_active = TRUE, updated_at = NOW()
    WHERE host_id = p_profile_id AND status = 'draft';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_host_approval(UUID, TEXT, BOOLEAN) TO authenticated;

-- Grandfather existing hosts who completed onboarding before host_status existed.
UPDATE public.profiles
SET host_status = 'approved', updated_at = NOW()
WHERE role = 'host'
  AND onboarding_completed = TRUE
  AND host_status IS NULL;
