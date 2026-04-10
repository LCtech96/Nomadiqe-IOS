-- ============================================
-- NOMADIQE - Modifica struttura (sconti) + eliminazione da parte dell'host
-- Esegui in Supabase → SQL Editor
-- ============================================

-- Sconto per prenotazioni superiori a 5 notti (5, 10 o % personalizzato)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS discount_5_nights_percent DECIMAL(5, 2);

-- Sconto per prenotazioni superiori a 2 settimane (% personalizzato)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS discount_14_nights_percent DECIMAL(5, 2);

COMMENT ON COLUMN public.properties.discount_5_nights_percent IS 'Sconto % per soggiorni > 5 notti (es. 5, 10 o valore personalizzato)';
COMMENT ON COLUMN public.properties.discount_14_nights_percent IS 'Sconto % per soggiorni > 14 notti (personalizzato)';

-- L'host può eliminare le proprie strutture (solo owner/host)
DROP POLICY IF EXISTS "Host can delete own property" ON public.properties;
CREATE POLICY "Host can delete own property"
  ON public.properties FOR DELETE
  TO authenticated
  USING (
    owner_id = auth.uid() OR host_id = auth.uid()
  );
