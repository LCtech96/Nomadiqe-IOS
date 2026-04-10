-- Moderazione foto e video strutture: visibili in app solo dopo approvazione admin.
-- Esegui nello SQL Editor del progetto Supabase.

-- Tabella media in attesa di approvazione
CREATE TABLE IF NOT EXISTS public.property_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('image', 'video')),
  url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_media_property_id ON public.property_media(property_id);
CREATE INDEX IF NOT EXISTS idx_property_media_status ON public.property_media(status);
CREATE INDEX IF NOT EXISTS idx_property_media_uploaded_at ON public.property_media(uploaded_at);

COMMENT ON TABLE public.property_media IS 'Foto e video strutture: pending fino ad approvazione admin, poi spostati in properties.images / properties.video_uploads';

-- RLS
ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;

-- Host può inserire solo per le proprie strutture
DROP POLICY IF EXISTS "property_media_insert_owner" ON public.property_media;
CREATE POLICY "property_media_insert_owner"
  ON public.property_media FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND (p.owner_id = auth.uid() OR p.host_id = auth.uid())
    )
  );

-- Lettura: host vede solo i propri (per la sua struttura)
DROP POLICY IF EXISTS "property_media_select_owner" ON public.property_media;
CREATE POLICY "property_media_select_owner"
  ON public.property_media FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND (p.owner_id = auth.uid() OR p.host_id = auth.uid())
    )
  );

-- Funzione per admin: elenco di tutti i media in attesa (chiamabile da app solo da utenti admin)
CREATE OR REPLACE FUNCTION public.get_pending_property_media()
RETURNS SETOF public.property_media
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.property_media WHERE status = 'pending' ORDER BY uploaded_at DESC;
$$;

-- Consenti a authenticated di chiamare la funzione (l'app mostra il pannello solo agli admin)
GRANT EXECUTE ON FUNCTION public.get_pending_property_media() TO authenticated;

-- Update (approva/rifiuta): consentito ad authenticated; l'app mostra il pannello solo agli admin.
-- Per restrizione solo admin in DB si può usare una funzione SECURITY DEFINER che verifica un ruolo.
DROP POLICY IF EXISTS "property_media_update_authenticated" ON public.property_media;
CREATE POLICY "property_media_update_authenticated"
  ON public.property_media FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Host può eliminare i propri media (es. rimuovere una foto in attesa di approvazione)
DROP POLICY IF EXISTS "property_media_delete_owner" ON public.property_media;
CREATE POLICY "property_media_delete_owner"
  ON public.property_media FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_media.property_id AND (p.owner_id = auth.uid() OR p.host_id = auth.uid())
    )
  );
