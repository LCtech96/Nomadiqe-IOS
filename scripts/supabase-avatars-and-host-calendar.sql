-- ============================================
-- NOMADIQE - Avatar pubblico + Calendario host (disponibilità e prezzo per data)
-- Esegui in Supabase → SQL Editor
-- ============================================

-- 1) Bucket per avatar profilo (crea da Dashboard → Storage → New bucket "avatars", Public)
--    Oppure via API. Se il bucket esiste già, le policy sotto abilitano l'upload.
--    Policy: authenticated può upload in avatars/{user_id}/*, public read.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Policy: chi è autenticato può caricare solo nella propria cartella (avatars)
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: lettura pubblica per avatar
DROP POLICY IF EXISTS "Avatar are public" ON storage.objects;
CREATE POLICY "Avatar are public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Bucket per foto e video strutture (opzionale: crea da Dashboard se non esiste)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'properties',
  'properties',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users can upload property images" ON storage.objects;
CREATE POLICY "Users can upload property images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'properties'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Property images are public" ON storage.objects;
CREATE POLICY "Property images are public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'properties');

-- 2) Calendario disponibilità host: per ogni data si può impostare libera/occupata e prezzo
CREATE TABLE IF NOT EXISTS public.property_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'closed', 'collab_available')),
  price_override DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, date)
);

-- Installazioni già create con solo available/occupied: allarga il CHECK (idempotente)
ALTER TABLE public.property_availability
  DROP CONSTRAINT IF EXISTS property_availability_status_check;
ALTER TABLE public.property_availability
  ADD CONSTRAINT property_availability_status_check
  CHECK (status IN ('available', 'occupied', 'closed', 'collab_available'));

CREATE INDEX IF NOT EXISTS idx_property_availability_property ON public.property_availability(property_id);
CREATE INDEX IF NOT EXISTS idx_property_availability_date ON public.property_availability(date);

ALTER TABLE public.property_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Host can manage own property availability" ON public.property_availability;
CREATE POLICY "Host can manage own property availability"
  ON public.property_availability FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_availability.property_id
      AND (p.owner_id = auth.uid() OR p.host_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_availability.property_id
      AND (p.owner_id = auth.uid() OR p.host_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Anyone can read availability for active properties" ON public.property_availability;
CREATE POLICY "Anyone can read availability for active properties"
  ON public.property_availability FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_availability.property_id AND p.is_active = true
    )
  );

COMMENT ON TABLE public.property_availability IS 'Per ogni data: struttura libera/occupata e prezzo opzionale per l''host';
