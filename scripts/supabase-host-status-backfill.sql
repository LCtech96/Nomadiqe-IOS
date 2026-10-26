-- Backfill host_status for hosts who registered before the approval flow existed.
-- Run once in Supabase SQL Editor (safe to re-run).

UPDATE public.profiles
SET host_status = 'approved', updated_at = NOW()
WHERE role = 'host'
  AND onboarding_completed = TRUE
  AND host_status IS NULL;
