-- ============================================
-- NOMADIQE - Collaborazione: chi ha avviato (host/creator) + status (accept/reject)
-- L'host guadagna punti quando accetta una richiesta inviata da un creator (swipe).
-- Esegui dopo supabase-collaboration-request-details-and-notification.sql e supabase-bio-links-and-points.sql
-- ============================================

-- 1) Colonne su host_creator_collaboration_requests
ALTER TABLE public.host_creator_collaboration_requests
  ADD COLUMN IF NOT EXISTS initiated_by TEXT NOT NULL DEFAULT 'host'
  CHECK (initiated_by IN ('host', 'creator'));

ALTER TABLE public.host_creator_collaboration_requests
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'accepted', 'rejected'));

COMMENT ON COLUMN public.host_creator_collaboration_requests.initiated_by IS 'Chi ha inviato la richiesta: host (swipe su creator) o creator (swipe su host)';
COMMENT ON COLUMN public.host_creator_collaboration_requests.status IS 'pending = in attesa; accepted/rejected = risposta dell''altro (host accetta/rifiuta richiesta creator, o viceversa)';

-- 2) Policy: creator può inserire richiesta verso host (stessa riga host_id, creator_id, initiated_by=creator)
DROP POLICY IF EXISTS "Hosts can create collaboration requests" ON public.host_creator_collaboration_requests;
DROP POLICY IF EXISTS "Host or creator can create collaboration request" ON public.host_creator_collaboration_requests;
CREATE POLICY "Host or creator can create collaboration request"
  ON public.host_creator_collaboration_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_id OR auth.uid() = creator_id);

-- 3) Policy: creator può aggiornare le richieste dove è creator_id (accept/reject richiesta host)
-- L'host può già aggiornare le proprie (policy "Hosts can update own collaboration requests" in collaboration-request-details)
DROP POLICY IF EXISTS "Creators can update own collaboration requests" ON public.host_creator_collaboration_requests;
CREATE POLICY "Creators can update own collaboration requests"
  ON public.host_creator_collaboration_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- 4) point_events: aggiungere azione host_accept_collaboration
ALTER TABLE public.point_events
  DROP CONSTRAINT IF EXISTS point_events_action_type_check;

ALTER TABLE public.point_events
  ADD CONSTRAINT point_events_action_type_check
  CHECK (action_type IN (
    'like', 'comment', 'create_post', 'invite_host', 'invite_creator',
    'host_accept_collaboration'
  ));

COMMENT ON TABLE public.point_events IS 'Eventi punti: host_accept_collaboration = host accetta richiesta collaborazione da creator (guadagna punti per livello/commissioni)';

-- 5) Trigger notifica: se host ha inviato → notifica creator; se creator ha inviato → notifica host
CREATE OR REPLACE FUNCTION public.notify_creator_or_host_on_collaboration_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name TEXT;
  recipient_id UUID;
  msg_title TEXT;
  msg_body TEXT;
BEGIN
  IF NEW.initiated_by = 'host' THEN
    SELECT COALESCE(full_name, username, email) INTO sender_name FROM public.profiles WHERE id = NEW.host_id;
    recipient_id := NEW.creator_id;
    msg_title := 'Nuova richiesta di collaborazione';
    msg_body := sender_name || ' ha richiesto una collaborazione con te.';
  ELSE
    SELECT COALESCE(full_name, username, email) INTO sender_name FROM public.profiles WHERE id = NEW.creator_id;
    recipient_id := NEW.host_id;
    msg_title := 'Richiesta di collaborazione da un creator';
    msg_body := sender_name || ' vorrebbe collaborare con te. Accetta per guadagnare punti.';
  END IF;
  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  VALUES (recipient_id, 'collaboration_request', msg_title, msg_body,
    CASE WHEN NEW.initiated_by = 'host' THEN NEW.host_id ELSE NEW.creator_id END);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_collaboration_request_notify_creator ON public.host_creator_collaboration_requests;
DROP TRIGGER IF EXISTS on_collaboration_request_notify_recipient ON public.host_creator_collaboration_requests;
CREATE TRIGGER on_collaboration_request_notify_recipient
  AFTER INSERT ON public.host_creator_collaboration_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_creator_or_host_on_collaboration_request();
