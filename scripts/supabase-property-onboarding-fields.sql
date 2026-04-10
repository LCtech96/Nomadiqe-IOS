-- Campi per onboarding nuova struttura host (tipo struttura, collaborazioni, prezzo, programma KOL&BED)
-- Una colonna per ALTER per evitare errori di sintassi con CHECK e IF NOT EXISTS

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS structure_type TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS collaboration_booking_mode TEXT;
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_collaboration_booking_mode_check;
ALTER TABLE public.properties ADD CONSTRAINT properties_collaboration_booking_mode_check
  CHECK (collaboration_booking_mode IS NULL OR collaboration_booking_mode IN ('approve_first_5', 'instant'));

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS first_guest_type TEXT;
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_first_guest_type_check;
ALTER TABLE public.properties ADD CONSTRAINT properties_first_guest_type_check
  CHECK (first_guest_type IS NULL OR first_guest_type IN ('any_creator', 'verified_creator'));

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS weekend_supplement_percent INTEGER DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS kolbed_program TEXT;
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_kolbed_program_check;
ALTER TABLE public.properties ADD CONSTRAINT properties_kolbed_program_check
  CHECK (kolbed_program IS NULL OR kolbed_program IN ('kolbed_100', 'gigo_50', 'paid_collab'));

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS paid_collab_min_budget DECIMAL(10, 2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS paid_collab_max_budget DECIMAL(10, 2);

COMMENT ON COLUMN public.properties.structure_type IS 'Tipo struttura esteso (casa, appartamento, fienile, bnb, barca, ...)';
COMMENT ON COLUMN public.properties.collaboration_booking_mode IS 'approve_first_5 = approva prime 5 collaborazioni, instant = prenotazione immediata';
COMMENT ON COLUMN public.properties.first_guest_type IS 'any_creator | verified_creator per prima collaborazione';
COMMENT ON COLUMN public.properties.kolbed_program IS 'kolbed_100 | gigo_50 | paid_collab';
