-- =========================================================
-- NOMADIQE - Post in moderazione + Admin + visibilità KOL&BED
-- Esegui dopo supabase-schema.sql
-- =========================================================

-- 1) I nuovi post nascono "pending" (approvazione admin)
ALTER TABLE public.posts
  ALTER COLUMN approval_status SET DEFAULT 'pending';

-- 2) Chi può vedere quali post
DROP POLICY IF EXISTS "Approved posts viewable by everyone" ON public.posts;
CREATE POLICY "Approved posts viewable by everyone"
  ON public.posts FOR SELECT
  USING (
    (approval_status = 'approved' AND visibility = 'public')
    OR (auth.uid() = author_id)
    OR (
      (SELECT email FROM public.profiles WHERE id = auth.uid()) = 'lucacorrao1996@gmail.com'
    )
  );

-- 3) Autori possono aggiornare i propri post
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- 4) Admin può approvare/rifiutare (aggiornare approval_status)
DROP POLICY IF EXISTS "Admin can update approval status" ON public.posts;
CREATE POLICY "Admin can update approval status"
  ON public.posts FOR UPDATE
  USING (
    (SELECT email FROM public.profiles WHERE id = auth.uid()) = 'lucacorrao1996@gmail.com'
  )
  WITH CHECK (true);

-- 5) Bucket storage per foto post
-- In Supabase: Dashboard → Storage → New bucket → nome "posts", Public = ON.
-- Poi in Storage → posts → Policies: aggiungi "Allow authenticated upload"
--   INSERT con WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');
--   SELECT con USING (true) per lettura pubblica.
