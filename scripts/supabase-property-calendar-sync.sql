-- ============================================
-- NOMADIQE - Sync calendario con Airbnb e Booking.com
-- Aggiunge alle strutture gli URL iCal per importare le prenotazioni
-- e la data ultima sincronizzazione.
-- Esegui in Supabase → SQL Editor
-- ============================================

-- Colonne su properties per collegare i calendari esterni (iCal import)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS airbnb_ical_import_url TEXT,
  ADD COLUMN IF NOT EXISTS booking_ical_import_url TEXT,
  ADD COLUMN IF NOT EXISTS calendar_sync_last_at TIMESTAMPTZ;

COMMENT ON COLUMN public.properties.airbnb_ical_import_url IS 'URL iCal fornito da Airbnb per importare le prenotazioni nel calendario Nomadiqe';
COMMENT ON COLUMN public.properties.booking_ical_import_url IS 'URL iCal fornito da Booking.com per importare le prenotazioni nel calendario Nomadiqe';
COMMENT ON COLUMN public.properties.calendar_sync_last_at IS 'Ultima esecuzione della sincronizzazione calendari esterni (Airbnb/Booking)';
