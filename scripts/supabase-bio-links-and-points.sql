-- ============================================
-- NOMADIQE - Bio link approval + Points tracking
-- Esegui in Supabase → SQL Editor
-- ============================================

-- 1) Bio: link visibili solo se approvati dall'admin
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio_links_approved BOOLEAN DEFAULT FALSE;

-- 2) Punti: tracciamento azioni giornaliere per rispettare i cap
CREATE TABLE IF NOT EXISTS public.point_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('like', 'comment', 'create_post', 'invite_host', 'invite_creator')),
  points INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici su colonne (senza espressione date, per evitare errore IMMUTABLE)
CREATE INDEX IF NOT EXISTS idx_point_events_user_created ON public.point_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_events_user_type_created ON public.point_events(user_id, action_type, created_at DESC);

ALTER TABLE public.point_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own point events" ON public.point_events;
CREATE POLICY "Users can view own point events"
  ON public.point_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own point events" ON public.point_events;
CREATE POLICY "Users can insert own point events"
  ON public.point_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Notifiche: consentire lettura per admin (user_id = admin) già coperta da "view own"

COMMENT ON COLUMN public.profiles.bio_links_approved IS 'Se true, i link nella bio sono mostrati cliccabili; altrimenti solo testo fino ad approvazione admin';
