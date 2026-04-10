-- Richieste collaborazione: note strutturate (biglietti, jolly selezionati, testo libero)
-- Esegui dopo supabase-collaboration-initiated-by-and-points.sql

ALTER TABLE public.host_creator_collaboration_requests
  ADD COLUMN IF NOT EXISTS request_extras JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.host_creator_collaboration_requests.request_extras IS
  'Opzionale: { cover_flights?: bool, selected_jolly_ids?: uuid[], notes?: string }';
