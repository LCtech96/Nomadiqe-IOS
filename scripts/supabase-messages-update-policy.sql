-- ============================================
-- NOMADIQE - Policy per segnare messaggi come letti
-- Esegui in Supabase → SQL Editor (dopo supabase-schema.sql)
-- ============================================

DROP POLICY IF EXISTS "Recipients can mark messages as read" ON public.messages;
CREATE POLICY "Recipients can mark messages as read"
  ON public.messages FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);
