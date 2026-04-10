-- =========================================================
-- Nomadiqe: Jolly settori (ristorante + info) e rating host (thumbs up/down)
-- Per Jolly ristorante: menu, posizione, orari. Per pulizie/servizi: rating solo da host con collaborazione.
-- Eseguire dopo supabase-host-creator-moderation.sql
-- =========================================================

-- 1) Estendi jolly_subcategory: aggiungi 'restaurant' (ristorante)
-- I valori esistenti restano: cleaner, property_manager, assistenza, autista, fornitore, restaurant
COMMENT ON COLUMN public.profiles.jolly_subcategory IS 'cleaner | property_manager | assistenza | autista | fornitore | restaurant';

-- 2) Tabella info ristorante (solo per jolly_subcategory = 'restaurant')
CREATE TABLE IF NOT EXISTS public.jolly_restaurant_info (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  menu_url TEXT,
  menu_text TEXT,
  address TEXT,
  place_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  opening_hours JSONB,
  opening_days TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.jolly_restaurant_info IS 'Dati ristorante per Jolly con jolly_subcategory = restaurant';
COMMENT ON COLUMN public.jolly_restaurant_info.menu_url IS 'URL al menu (PDF o link esterno)';
COMMENT ON COLUMN public.jolly_restaurant_info.place_url IS 'Link Google Maps o simile';
COMMENT ON COLUMN public.jolly_restaurant_info.opening_hours IS 'Es. {"open":"09:00","close":"23:00"} o array per giorni';
COMMENT ON COLUMN public.jolly_restaurant_info.opening_days IS 'Giorni apertura: lun,mar,mer,gio,ven,sab,dom';

ALTER TABLE public.jolly_restaurant_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Jolly can manage own restaurant info" ON public.jolly_restaurant_info;
CREATE POLICY "Jolly can manage own restaurant info"
  ON public.jolly_restaurant_info FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read restaurant info" ON public.jolly_restaurant_info;
CREATE POLICY "Anyone can read restaurant info"
  ON public.jolly_restaurant_info FOR SELECT TO authenticated
  USING (true);

-- 3) Rating thumbs up/down: solo host che hanno già collaborato con quel jolly
CREATE TABLE IF NOT EXISTS public.jolly_host_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  jolly_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(host_id, jolly_id)
);

CREATE INDEX IF NOT EXISTS idx_jolly_ratings_jolly ON public.jolly_host_ratings(jolly_id);
CREATE INDEX IF NOT EXISTS idx_jolly_ratings_host ON public.jolly_host_ratings(host_id);

COMMENT ON TABLE public.jolly_host_ratings IS 'Voto thumbs up/down: solo host che hanno collaborazione con il jolly (host_creator_collaboration_requests). Il jolly non può modificare.';

ALTER TABLE public.jolly_host_ratings ENABLE ROW LEVEL SECURITY;

-- SELECT: tutti possono vedere i voti (per mostrare conteggi sulla card)
DROP POLICY IF EXISTS "Anyone can read jolly ratings" ON public.jolly_host_ratings;
CREATE POLICY "Anyone can read jolly ratings"
  ON public.jolly_host_ratings FOR SELECT TO authenticated
  USING (true);

-- INSERT: solo host, e solo se esiste una richiesta di collaborazione host->jolly (creator_id = jolly)
DROP POLICY IF EXISTS "Host can insert rating if collaborated" ON public.jolly_host_ratings;
CREATE POLICY "Host can insert rating if collaborated"
  ON public.jolly_host_ratings FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = host_id
    AND EXISTS (
      SELECT 1 FROM public.host_creator_collaboration_requests h
      WHERE h.host_id = auth.uid() AND h.creator_id = jolly_id
    )
  );

-- UPDATE: solo l'host proprietario del voto (per cambiare up<->down)
DROP POLICY IF EXISTS "Host can update own rating" ON public.jolly_host_ratings;
CREATE POLICY "Host can update own rating"
  ON public.jolly_host_ratings FOR UPDATE TO authenticated
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

-- Il jolly non ha policy di UPDATE/DELETE su jolly_host_ratings: non può modificare i voti su sé stesso

GRANT SELECT, INSERT, UPDATE ON public.jolly_restaurant_info TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.jolly_host_ratings TO authenticated;
