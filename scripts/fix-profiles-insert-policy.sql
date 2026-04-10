-- ============================================
-- NOMADIQE - Fix registrazione: INSERT su profiles
-- Errore: "new row violates row-level security policy for table profiles"
-- Esegui in Supabase → SQL Editor
-- ============================================

-- Ricrea la policy che permette all'utente appena registrato di inserire il proprio profilo
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Verifica: le policy su profiles devono includere INSERT per authenticated
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';
