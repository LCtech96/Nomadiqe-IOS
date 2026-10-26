-- =============================================================================
-- Creator approval / rejection by admin (bypass RLS on profiles)
-- Admin email must match src/constants/admin.ts (facevoiceai@gmail.com)
-- Run in Supabase SQL Editor after supabase-creator-categories-and-applications.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_nomadiqe_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND lower(trim(email)) = ANY (ARRAY[
      'facevoiceai@gmail.com'
    ]::text[])
  );
$$;

COMMENT ON FUNCTION public.is_nomadiqe_admin() IS 'Allineare le email a src/constants/admin.ts ADMIN_EMAILS';

CREATE OR REPLACE FUNCTION public.set_creator_approval(
  p_profile_id uuid,
  p_status text,
  p_admin_approved_opportunities text[] DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_n int;
BEGIN
  IF NOT public.is_nomadiqe_admin() THEN
    RAISE EXCEPTION 'non autorizzato';
  END IF;

  IF p_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Stato non valido: %', p_status;
  END IF;

  UPDATE public.profiles
  SET
    creator_status = p_status,
    admin_approved_opportunities = CASE
      WHEN p_status = 'approved' THEN coalesce(p_admin_approved_opportunities, '{}')
      ELSE '{}'
    END,
    updated_at = now()
  WHERE id = p_profile_id
    AND role = 'creator'
    AND creator_category IS NOT NULL;

  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n = 0 THEN
    RAISE EXCEPTION 'Profilo creator non trovato o non idoneo all''approvazione';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_creator_approval(uuid, text, text[]) TO authenticated;
