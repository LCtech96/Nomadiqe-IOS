-- ============================================
-- NOMADIQE - Link affiliato Creator/Host
-- Solo i creator approvati dall'host (swipe destra) possono richiedere un link.
-- Tracciamento: host_id, creator_id, aperture link, notifiche a entrambi.
-- Esegui dopo supabase-notifications.sql e supabase-collaboration-request-details-and-notification.sql
-- ============================================

-- 1) Richieste di link (creator → host): % desiderata dal creator, % offerta dall'host, stato
CREATE TABLE IF NOT EXISTS public.affiliate_link_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_requested_percent NUMERIC(5,2) NOT NULL CHECK (creator_requested_percent >= 0 AND creator_requested_percent <= 100),
  host_offered_percent NUMERIC(5,2) CHECK (host_offered_percent IS NULL OR (host_offered_percent >= 0 AND host_offered_percent <= 100)),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(host_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_affiliate_link_requests_host ON public.affiliate_link_requests(host_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_link_requests_creator ON public.affiliate_link_requests(creator_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_link_requests_status ON public.affiliate_link_requests(host_id, status);

COMMENT ON TABLE public.affiliate_link_requests IS 'Richieste creator per generare link affiliato; host approva con propria %';

-- 2) Link creati: traccia host, creator, token univoco, % offerta dall'host
CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  creator_percentage_offered NUMERIC(5,2) NOT NULL CHECK (creator_percentage_offered >= 0 AND creator_percentage_offered <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(host_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_affiliate_links_host ON public.affiliate_links(host_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_creator ON public.affiliate_links(creator_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_links_token ON public.affiliate_links(token);

COMMENT ON TABLE public.affiliate_links IS 'Link affiliato: creato dall''host per un creator; traccia host_id e creator_id';

-- 3) Aperture link (qualcuno apre il link → notifica a host e creator)
CREATE TABLE IF NOT EXISTS public.affiliate_link_opens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id UUID NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  booking_made BOOLEAN DEFAULT FALSE,
  booking_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_affiliate_link_opens_link ON public.affiliate_link_opens(link_id);

COMMENT ON TABLE public.affiliate_link_opens IS 'Ogni apertura del link; booking_made quando si registra una prenotazione tramite link';

-- 4) RLS
ALTER TABLE public.affiliate_link_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_link_opens ENABLE ROW LEVEL SECURITY;

-- Richieste: host vede le proprie, creator vede le proprie
DROP POLICY IF EXISTS "Host can view own link requests" ON public.affiliate_link_requests;
CREATE POLICY "Host can view own link requests"
  ON public.affiliate_link_requests FOR SELECT
  USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Creator can view own link requests" ON public.affiliate_link_requests;
CREATE POLICY "Creator can view own link requests"
  ON public.affiliate_link_requests FOR SELECT
  USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creator can insert link request" ON public.affiliate_link_requests;
CREATE POLICY "Creator can insert link request"
  ON public.affiliate_link_requests FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Host can update own link requests" ON public.affiliate_link_requests;
CREATE POLICY "Host can update own link requests"
  ON public.affiliate_link_requests FOR UPDATE
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

-- Link: host e creator vedono i propri
DROP POLICY IF EXISTS "Host can view own links" ON public.affiliate_links;
CREATE POLICY "Host can view own links"
  ON public.affiliate_links FOR SELECT
  USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Creator can view own links" ON public.affiliate_links;
CREATE POLICY "Creator can view own links"
  ON public.affiliate_links FOR SELECT
  USING (auth.uid() = creator_id);

-- Inserimento link: solo da backend/trigger dopo approvazione, o da host via app
DROP POLICY IF EXISTS "Host can insert affiliate link" ON public.affiliate_links;
CREATE POLICY "Host can insert affiliate link"
  ON public.affiliate_links FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- Lettura link per token (per registrare apertura): chiunque autenticato può leggere per token (usiamo service o policy per SELECT by token)
DROP POLICY IF EXISTS "Authenticated can read link by token" ON public.affiliate_links;
CREATE POLICY "Authenticated can read link by token"
  ON public.affiliate_links FOR SELECT
  TO authenticated
  USING (true);

-- Aperture: solo insert da app/service; host e creator leggono le aperture dei propri link
DROP POLICY IF EXISTS "Authenticated can insert link open" ON public.affiliate_link_opens;
CREATE POLICY "Authenticated can insert link open"
  ON public.affiliate_link_opens FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read opens for own links" ON public.affiliate_link_opens;
CREATE POLICY "Users can read opens for own links"
  ON public.affiliate_link_opens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliate_links l
      WHERE l.id = link_id AND (l.host_id = auth.uid() OR l.creator_id = auth.uid())
    )
  );

-- 5) Trigger updated_at su affiliate_link_requests
CREATE OR REPLACE FUNCTION public.set_affiliate_link_requests_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS affiliate_link_requests_updated_at ON public.affiliate_link_requests;
CREATE TRIGGER affiliate_link_requests_updated_at
  BEFORE UPDATE ON public.affiliate_link_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_affiliate_link_requests_updated_at();

-- 6) Generazione token univoco (helper: l'app può generare nanoid/uuid; in DB nessun trigger)
-- Le notifiche (affiliate_link_request, affiliate_link_created, affiliate_link_opened) vengono create dall'app dopo INSERT/UPDATE.
