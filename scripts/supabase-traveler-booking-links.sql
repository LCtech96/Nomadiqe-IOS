-- Link per viaggiatori: host genera URL con token per prenotazione / anteprima struttura
CREATE TABLE IF NOT EXISTS public.traveler_booking_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  date_from DATE,
  date_to DATE,
  max_guests INTEGER NOT NULL DEFAULT 4,
  traveler_notes_hint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_traveler_booking_links_host ON public.traveler_booking_links(host_id);
CREATE INDEX IF NOT EXISTS idx_traveler_booking_links_token ON public.traveler_booking_links(token);

ALTER TABLE public.traveler_booking_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hosts manage own traveler links" ON public.traveler_booking_links;
CREATE POLICY "Hosts manage own traveler links"
  ON public.traveler_booking_links FOR ALL
  TO authenticated
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

COMMENT ON TABLE public.traveler_booking_links IS 'Link condivisibili da host a viaggiatori (date, struttura, ospiti)';
