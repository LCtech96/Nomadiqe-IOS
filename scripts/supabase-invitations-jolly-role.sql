-- ============================================
-- NOMADIQE - Allow jolly role in invitations
-- Esegui in Supabase → SQL Editor
-- ============================================

ALTER TABLE public.invitations
  DROP CONSTRAINT IF EXISTS invitations_role_check;

ALTER TABLE public.invitations
  ADD CONSTRAINT invitations_role_check
  CHECK (role IN ('host', 'creator', 'jolly'));
