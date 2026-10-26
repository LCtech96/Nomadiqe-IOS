-- =============================================================================
-- Jolly service media: admin moderation + sync to profile / restaurant info
-- Run in Supabase SQL Editor after jolly_services + jolly_service_media tables exist.
-- Admin email must match src/constants/admin.ts (facevoiceai@gmail.com)
-- =============================================================================

-- Hosts and jolly owners can read approved media (KOL&BED); jolly reads own rows
DROP POLICY IF EXISTS "jolly_service_media_select_approved_or_own" ON public.jolly_service_media;
CREATE POLICY "jolly_service_media_select_approved_or_own"
  ON public.jolly_service_media FOR SELECT
  TO authenticated
  USING (status = 'approved' OR jolly_id = auth.uid());

-- Pending list for admin (joins service + profile)
CREATE OR REPLACE FUNCTION public.get_pending_jolly_service_media()
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
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.created_at DESC)
      FROM (
        SELECT
          m.*,
          s.title AS service_title,
          p.full_name AS jolly_full_name,
          p.email AS jolly_email
        FROM public.jolly_service_media m
        JOIN public.jolly_services s ON s.id = m.service_id
        JOIN public.profiles p ON p.id = m.jolly_id
        WHERE m.status = 'pending'
        ORDER BY m.created_at DESC
      ) t
    ),
    '[]'::jsonb
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_jolly_service_media(p_media_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.jolly_service_media%ROWTYPE;
  v_images text[];
  v_url text;
  v_now timestamptz := now();
BEGIN
  IF NOT public.is_nomadiqe_admin() THEN
    RAISE EXCEPTION 'non autorizzato';
  END IF;

  SELECT * INTO v_row
  FROM public.jolly_service_media
  WHERE id = p_media_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Media non trovato o già elaborato';
  END IF;

  v_url := v_row.public_url;
  IF v_url IS NULL OR trim(v_url) = '' THEN
    RAISE EXCEPTION 'URL pubblico mancante per questo media';
  END IF;

  UPDATE public.jolly_service_media
  SET status = 'approved',
      reviewed_at = v_now,
      reviewed_by = auth.uid()
  WHERE id = p_media_id;

  IF v_row.media_kind = 'restaurant_menu' THEN
    INSERT INTO public.jolly_restaurant_info (user_id, menu_url, updated_at)
    VALUES (v_row.jolly_id, v_url, v_now)
    ON CONFLICT (user_id) DO UPDATE
      SET menu_url = EXCLUDED.menu_url,
          updated_at = v_now;
  ELSIF v_row.is_cover
    OR v_row.media_kind IN ('vehicle_photo', 'boat_photo', 'quad_photo', 'service_cover')
  THEN
    SELECT coalesce(profile_cover_images, '{}') INTO v_images
    FROM public.profiles
    WHERE id = v_row.jolly_id;

    IF NOT (v_url = ANY (v_images)) THEN
      UPDATE public.profiles
      SET profile_cover_images = array_append(v_images, v_url),
          updated_at = v_now
      WHERE id = v_row.jolly_id;
    END IF;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_jolly_service_media(p_media_id uuid)
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

  UPDATE public.jolly_service_media
  SET status = 'rejected',
      reviewed_at = now(),
      reviewed_by = auth.uid()
  WHERE id = p_media_id AND status = 'pending';

  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n = 0 THEN
    RAISE EXCEPTION 'Media non trovato o già elaborato';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pending_jolly_service_media() TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_jolly_service_media(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_jolly_service_media(uuid) TO authenticated;

-- Storage: Jolly reads own folder; admin can read all (preview in moderation UI)
DROP POLICY IF EXISTS "jolly service media storage select own" ON storage.objects;
CREATE POLICY "jolly service media storage select own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'jolly-service-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "jolly service media storage admin select" ON storage.objects;
CREATE POLICY "jolly service media storage admin select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'jolly-service-media'
    AND public.is_nomadiqe_admin()
  );
