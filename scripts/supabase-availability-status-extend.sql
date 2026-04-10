-- Estende gli stati di property_availability: closed (chiusa), collab_available (disponibile per collaborazioni)
-- Esegui in Supabase → SQL Editor se la tabella è stata creata dalla versione vecchia di
-- supabase-avatars-and-host-calendar.sql (solo available/occupied).
-- Nota: lo script principale ora include già questa migrazione; questo file resta per progetti esistenti.

ALTER TABLE public.property_availability
  DROP CONSTRAINT IF EXISTS property_availability_status_check;

ALTER TABLE public.property_availability
  ADD CONSTRAINT property_availability_status_check
  CHECK (status IN ('available', 'occupied', 'closed', 'collab_available'));

COMMENT ON COLUMN public.property_availability.status IS 'available=libera, occupied=prenotata, closed=chiusa host, collab_available=disponibile per creator/influencer';
