-- ============================================
-- NOMADIQE - Trigger: crea profilo alla registrazione
-- Risolve: "new row violates row-level security policy for table 'profiles'"
-- (dopo signUp la sessione può non essere ancora attiva se è richiesta conferma email)
-- Esegui in Supabase → SQL Editor
-- ============================================

-- Funzione che inserisce una riga in public.profiles quando viene creato un nuovo auth.users.
-- SECURITY DEFINER = esegue con privilegi del owner, quindi bypassa RLS.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    username = COALESCE(EXCLUDED.username, public.profiles.username);
  RETURN NEW;
END;
$$;

-- Trigger su auth.users: dopo ogni INSERT esegue handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
