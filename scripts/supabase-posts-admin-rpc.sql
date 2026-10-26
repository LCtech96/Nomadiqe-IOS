-- =============================================================================
-- Post & comment moderation: admin RPCs (bypass RLS)
-- Admin email must match src/constants/admin.ts (facevoiceai@gmail.com)
-- Run in Supabase SQL Editor after supabase-posts-admin-kolbed.sql and
-- supabase-comments-moderation.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_nomadiqe_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND lower(trim(email)) = ANY (ARRAY[
      'facevoiceai@gmail.com'
    ]::text[])
  );
$$;

COMMENT ON FUNCTION public.is_nomadiqe_admin() IS 'Allineare le email a src/constants/admin.ts ADMIN_EMAILS';

-- Pending posts for admin (includes author profile)
CREATE OR REPLACE FUNCTION public.get_pending_posts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_nomadiqe_admin() THEN
    RAISE EXCEPTION 'non autorizzato';
  END IF;

  RETURN COALESCE(
    (
      SELECT jsonb_agg(
        to_jsonb(p) || jsonb_build_object(
          'author', jsonb_build_object(
            'id', pr.id,
            'full_name', pr.full_name,
            'username', pr.username,
            'avatar_url', pr.avatar_url,
            'role', pr.role,
            'is_verified', pr.is_verified
          )
        )
        ORDER BY p.created_at DESC
      )
      FROM public.posts p
      JOIN public.profiles pr ON pr.id = p.author_id
      WHERE p.approval_status = 'pending'
    ),
    '[]'::jsonb
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.set_post_approval(
  p_post_id uuid,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_n int;
BEGIN
  IF NOT public.is_nomadiqe_admin() THEN
    RAISE EXCEPTION 'non autorizzato';
  END IF;

  IF p_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Stato non valido: %', p_status;
  END IF;

  UPDATE public.posts
  SET approval_status = p_status,
      updated_at = now()
  WHERE id = p_post_id
    AND approval_status = 'pending';

  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n = 0 THEN
    RAISE EXCEPTION 'Post non trovato o già elaborato';
  END IF;
END;
$$;

-- Pending comments for admin (includes user profile)
CREATE OR REPLACE FUNCTION public.get_pending_post_comments()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_nomadiqe_admin() THEN
    RAISE EXCEPTION 'non autorizzato';
  END IF;

  RETURN COALESCE(
    (
      SELECT jsonb_agg(
        to_jsonb(c) || jsonb_build_object(
          'user', jsonb_build_object(
            'id', pr.id,
            'full_name', pr.full_name,
            'username', pr.username,
            'avatar_url', pr.avatar_url
          )
        )
        ORDER BY c.created_at DESC
      )
      FROM public.post_comments c
      JOIN public.profiles pr ON pr.id = c.user_id
      WHERE c.approval_status = 'pending'
    ),
    '[]'::jsonb
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.set_post_comment_approval(
  p_comment_id uuid,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_id uuid;
  v_n int;
BEGIN
  IF NOT public.is_nomadiqe_admin() THEN
    RAISE EXCEPTION 'non autorizzato';
  END IF;

  IF p_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Stato non valido: %', p_status;
  END IF;

  SELECT post_id INTO v_post_id
  FROM public.post_comments
  WHERE id = p_comment_id AND approval_status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Commento non trovato o già elaborato';
  END IF;

  UPDATE public.post_comments
  SET approval_status = p_status,
      updated_at = now()
  WHERE id = p_comment_id;

  IF p_status = 'approved' AND v_post_id IS NOT NULL THEN
    PERFORM public.increment_post_comments(v_post_id);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pending_posts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_post_approval(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_post_comments() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_post_comment_approval(uuid, text) TO authenticated;

-- Align RLS policies with is_nomadiqe_admin() (backup for direct queries)
DROP POLICY IF EXISTS "Approved posts viewable by everyone" ON public.posts;
CREATE POLICY "Approved posts viewable by everyone"
  ON public.posts FOR SELECT
  USING (
    (approval_status = 'approved' AND visibility = 'public')
    OR (auth.uid() = author_id)
    OR public.is_nomadiqe_admin()
  );

DROP POLICY IF EXISTS "Admin can update approval status" ON public.posts;
CREATE POLICY "Admin can update approval status"
  ON public.posts FOR UPDATE
  USING (public.is_nomadiqe_admin())
  WITH CHECK (true);

DROP POLICY IF EXISTS "Comments viewable by everyone" ON public.post_comments;
CREATE POLICY "Comments viewable by everyone"
  ON public.post_comments FOR SELECT
  USING (
    approval_status = 'approved'
    OR auth.uid() = user_id
    OR public.is_nomadiqe_admin()
  );

DROP POLICY IF EXISTS "Admin can update comment approval" ON public.post_comments;
CREATE POLICY "Admin can update comment approval"
  ON public.post_comments FOR UPDATE
  USING (public.is_nomadiqe_admin())
  WITH CHECK (true);
