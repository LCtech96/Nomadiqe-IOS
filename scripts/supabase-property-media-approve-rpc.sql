-- =============================================================================
-- Approvazione / rifiuto media struttura da admin (bypass RLS su properties)
-- L'app usa email admin in src/constants/admin.ts — mantieni la lista allineata qui.
-- Esegui nel SQL Editor di Supabase dopo supabase-property-media-moderation.sql
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

CREATE OR REPLACE FUNCTION public.approve_property_media(p_media_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.property_media%ROWTYPE;
  v_images text[];
  v_videos jsonb;
  v_now timestamptz := now();
  v_max_photos int := 50;
BEGIN
  IF NOT public.is_nomadiqe_admin() THEN
    RAISE EXCEPTION 'non autorizzato';
  END IF;

  SELECT * INTO v_row
  FROM public.property_media
  WHERE id = p_media_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Media non trovato o già elaborato';
  END IF;

  IF v_row.type = 'image' THEN
    SELECT coalesce(images, '{}') INTO v_images FROM public.properties WHERE id = v_row.property_id;
    IF array_length(v_images, 1) IS NOT NULL AND array_length(v_images, 1) >= v_max_photos THEN
      RAISE EXCEPTION 'La struttura ha già il numero massimo di foto approvate.';
    END IF;
    UPDATE public.properties
    SET images = array_append(v_images, v_row.url),
        updated_at = v_now
    WHERE id = v_row.property_id;
  ELSIF v_row.type = 'video' THEN
    SELECT coalesce(video_uploads, '[]'::jsonb) INTO v_videos FROM public.properties WHERE id = v_row.property_id;
    UPDATE public.properties
    SET video_uploads = v_videos || jsonb_build_array(
      jsonb_build_object(
        'url', v_row.url,
        'uploaded_at', v_row.uploaded_at::text
      )
    ),
    updated_at = v_now
    WHERE id = v_row.property_id;
  ELSE
    RAISE EXCEPTION 'Tipo media non valido';
  END IF;

  UPDATE public.property_media
  SET status = 'approved',
      reviewed_at = v_now,
      reviewed_by = auth.uid()
  WHERE id = p_media_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_property_media(p_media_id uuid)
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

  UPDATE public.property_media
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

GRANT EXECUTE ON FUNCTION public.approve_property_media(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_property_media(uuid) TO authenticated;
