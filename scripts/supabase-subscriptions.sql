-- =============================================================================
-- Noma Hub subscriptions: piano utente + trial
-- Esegui in Supabase → SQL Editor (idempotente)
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'pro', 'enterprise'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier
  ON public.profiles (subscription_tier);

COMMENT ON COLUMN public.profiles.subscription_tier IS
  'Piano Noma Hub: free (directory limitata), pro, enterprise.';
COMMENT ON COLUMN public.profiles.trial_ends_at IS
  'Fine del periodo di prova: finché è nel futuro l''utente ha accesso di livello pro.';

-- L'utente non può auto-promuoversi: subscription_tier e trial_ends_at vanno
-- scritti solo da service_role (webhook RevenueCat/Stripe).
CREATE OR REPLACE FUNCTION public.prevent_self_subscription_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  NEW.subscription_tier := OLD.subscription_tier;
  NEW.trial_ends_at := OLD.trial_ends_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_self_subscription_change ON public.profiles;
CREATE TRIGGER trg_prevent_self_subscription_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_subscription_change();

-- Verifica:
-- SELECT id, role, subscription_tier, trial_ends_at FROM public.profiles LIMIT 5;
