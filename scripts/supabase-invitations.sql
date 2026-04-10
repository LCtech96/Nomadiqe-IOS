-- ============================================
-- NOMADIQE - Invitations (invita host / invita creator)
-- Esegui in Supabase → SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inviter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('host', 'creator')),
  invited_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS invitations_invite_code_idx ON public.invitations(invite_code);
CREATE INDEX IF NOT EXISTS invitations_inviter_id_idx ON public.invitations(inviter_id);
CREATE INDEX IF NOT EXISTS invitations_invited_id_idx ON public.invitations(invited_id);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Inviter can insert own invitations
DROP POLICY IF EXISTS "Users can create own invitations" ON public.invitations;
CREATE POLICY "Users can create own invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

-- Inviter can read own invitations (to see who they invited)
DROP POLICY IF EXISTS "Users can read own invitations" ON public.invitations;
CREATE POLICY "Users can read own invitations"
  ON public.invitations FOR SELECT
  USING (auth.uid() = inviter_id);

-- Anyone can read by invite_code (for validating link when new user signs up; anon needs to resolve code)
DROP POLICY IF EXISTS "Anyone can read invitation by code" ON public.invitations;
CREATE POLICY "Anyone can read invitation by code"
  ON public.invitations FOR SELECT
  USING (true);

-- Inviter can update own rows; anyone can update a row with invited_id IS NULL (new user claims invite by setting invited_id = self)
DROP POLICY IF EXISTS "Allow update invited_id by code" ON public.invitations;
CREATE POLICY "Allow update invited_id by code"
  ON public.invitations FOR UPDATE
  USING (auth.uid() = inviter_id OR invited_id IS NULL)
  WITH CHECK (true);
