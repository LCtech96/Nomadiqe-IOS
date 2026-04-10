-- Aggiunge supporto per più video per struttura con data di upload (limite 5/mese lato app).
-- Esegui nello SQL Editor del progetto Supabase.

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS video_uploads jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.properties.video_uploads IS 'Array di { url: string, uploaded_at: string } per limite 5 video/mese';
