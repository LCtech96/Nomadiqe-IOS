-- ============================================
-- NOMADIQE - Moderazione commenti (approvazione admin)
-- I commenti nascono "pending"; l'admin approva/rifiuta. Solo gli approvati sono visibili nel feed.
-- Esegui in Supabase → SQL Editor
-- ============================================

-- 1) Aggiungi colonna approval_status ai commenti
ALTER TABLE public.post_comments
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending'
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- 2) Chi può vedere quali commenti
DROP POLICY IF EXISTS "Comments viewable by everyone" ON public.post_comments;
CREATE POLICY "Comments viewable by everyone"
  ON public.post_comments FOR SELECT
  USING (
    approval_status = 'approved'
    OR auth.uid() = user_id
    OR (SELECT email FROM public.profiles WHERE id = auth.uid()) = 'lucacorrao1996@gmail.com'
  );

-- 3) Inserimento: utenti autenticati possono creare commenti (solo con il proprio user_id)
DROP POLICY IF EXISTS "Users can create comments" ON public.post_comments;
CREATE POLICY "Users can create comments"
  ON public.post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4) Admin può approvare/rifiutare commenti
DROP POLICY IF EXISTS "Admin can update comment approval" ON public.post_comments;
CREATE POLICY "Admin can update comment approval"
  ON public.post_comments FOR UPDATE
  USING (
    (SELECT email FROM public.profiles WHERE id = auth.uid()) = 'lucacorrao1996@gmail.com'
  )
  WITH CHECK (true);

-- I like restano come sono: tutti gli utenti autenticati possono mettere like (policy esistente).
