-- Creator Explore: list all non-archived properties (bypasses RLS for is_active = false drafts)
-- Run in Supabase SQL Editor after supabase-schema.sql
--
-- Properties do NOT require admin approval to appear in Explore.
-- Only uploaded photos/videos need admin approval (property_media → properties.images on approve).
-- Host listings become visible once is_active = true (set when onboarding completes).

-- Activate any existing properties that were never flipped on during onboarding
UPDATE public.properties
SET is_active = true,
    status = 'active',
    updated_at = NOW()
WHERE is_active = false
  AND COALESCE(status, 'draft') NOT IN ('archived');

CREATE OR REPLACE FUNCTION public.get_properties_for_explore()
RETURNS SETOF public.properties
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.properties
  WHERE COALESCE(status, 'active') NOT IN ('archived')
  ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_property_for_explore(p_property_id uuid)
RETURNS public.properties
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.properties
  WHERE id = p_property_id
    AND COALESCE(status, 'active') NOT IN ('archived')
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_properties_for_explore() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_property_for_explore(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_properties_for_explore IS
  'All non-archived properties for Creator Explore tab (no admin approval required on the property itself)';
COMMENT ON FUNCTION public.get_property_for_explore IS
  'Single property detail for Creator Explore (bypasses is_active RLS)';
