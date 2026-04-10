-- ============================================
-- NOMADIQE - Dettagli richiesta collaborazione + notifica al creator
-- Esegui dopo supabase-host-creator-moderation.sql e supabase-notifications.sql
-- ============================================

-- 1) Colonne aggiuntive su host_creator_collaboration_requests (form host)
ALTER TABLE public.host_creator_collaboration_requests
  ADD COLUMN IF NOT EXISTS preferred_dates_from DATE;
ALTER TABLE public.host_creator_collaboration_requests
  ADD COLUMN IF NOT EXISTS preferred_dates_to DATE;
ALTER TABLE public.host_creator_collaboration_requests
  ADD COLUMN IF NOT EXISTS accessory_services TEXT[] DEFAULT '{}';
ALTER TABLE public.host_creator_collaboration_requests
  ADD COLUMN IF NOT EXISTS paid_collaboration BOOLEAN DEFAULT FALSE;
ALTER TABLE public.host_creator_collaboration_requests
  ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.host_creator_collaboration_requests
  ADD COLUMN IF NOT EXISTS kolbed_partial_type TEXT;
ALTER TABLE public.host_creator_collaboration_requests
  ADD COLUMN IF NOT EXISTS content_quantity_desired TEXT;
ALTER TABLE public.host_creator_collaboration_requests
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.host_creator_collaboration_requests
  DROP CONSTRAINT IF EXISTS host_creator_collab_kolbed_type_check;
ALTER TABLE public.host_creator_collaboration_requests
  ADD CONSTRAINT host_creator_collab_kolbed_type_check
  CHECK (kolbed_partial_type IS NULL OR kolbed_partial_type IN ('cleaning_only', '50_discount', 'full'));

COMMENT ON COLUMN public.host_creator_collaboration_requests.preferred_dates_from IS 'Data inizio periodo desiderato per collaborazione';
COMMENT ON COLUMN public.host_creator_collaboration_requests.preferred_dates_to IS 'Data fine periodo';
COMMENT ON COLUMN public.host_creator_collaboration_requests.accessory_services IS 'Servizi/esperienze: transfer, boat_tour, horse_ride, etc.';
COMMENT ON COLUMN public.host_creator_collaboration_requests.paid_collaboration IS 'Se host è disposto a pagare il creator';
COMMENT ON COLUMN public.host_creator_collaboration_requests.description IS 'Descrizione richiesta, max 500 caratteri, no link/nomi esterni';
COMMENT ON COLUMN public.host_creator_collaboration_requests.kolbed_partial_type IS 'cleaning_only | 50_discount | full';
COMMENT ON COLUMN public.host_creator_collaboration_requests.content_quantity_desired IS 'Quantità contenuti desiderati (es. 2 reel, 1 story)';

-- Policy: host può aggiornare le proprie richieste (per compilare il form)
DROP POLICY IF EXISTS "Hosts can update own collaboration requests" ON public.host_creator_collaboration_requests;
CREATE POLICY "Hosts can update own collaboration requests"
  ON public.host_creator_collaboration_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

-- 2) Trigger: alla INSERT su host_creator_collaboration_requests, crea notifica per il creator
CREATE OR REPLACE FUNCTION public.notify_creator_on_collaboration_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  host_name TEXT;
  host_msg TEXT;
BEGIN
  SELECT COALESCE(full_name, username, email) INTO host_name
  FROM public.profiles WHERE id = NEW.host_id;
  host_msg := host_name || ' ha richiesto una collaborazione con te.';
  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  VALUES (NEW.creator_id, 'collaboration_request', 'Nuova richiesta di collaborazione', host_msg, NEW.host_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_collaboration_request_notify_creator ON public.host_creator_collaboration_requests;
CREATE TRIGGER on_collaboration_request_notify_creator
  AFTER INSERT ON public.host_creator_collaboration_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_creator_on_collaboration_request();
