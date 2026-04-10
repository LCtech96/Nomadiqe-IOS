-- ============================================
-- NOMADIQE - Seed utenti (auth + profile)
-- Esegui in Supabase: SQL Editor → incolla e Run
-- ATTENZIONE: contiene password in chiaro; non committare o condividere.
-- ============================================

-- --------------------------------------------
-- 1) UTENTE GIÀ IN AUTH (es. creato da Dashboard)?
--    Esegui questo: crea/aggiorna solo public.profiles
-- --------------------------------------------
INSERT INTO public.profiles (id, email, full_name, onboarding_completed)
SELECT id, email, 'Luca Corrao', false
FROM auth.users
WHERE email = 'lucacorrao1996@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  updated_at = now();

-- --------------------------------------------
-- 2) NUOVO UTENTE (auth.users vuoto per questa email)
--    Esegui solo se il blocco sopra non inserisce nulla
--    e vuoi creare utente + identity + profile da zero.
-- --------------------------------------------
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;
--
-- WITH uid AS (SELECT gen_random_uuid() AS id),
-- ins_user AS (
--   INSERT INTO auth.users (
--     instance_id, id, aud, role, email, encrypted_password,
--     email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
--   )
--   SELECT
--     '00000000-0000-0000-0000-000000000000',
--     uid.id, 'authenticated', 'authenticated',
--     'lucacorrao1996@gmail.com',
--     crypt('As67kocd22!', gen_salt('bf')),
--     now(),
--     '{"provider":"email","providers":["email"]}'::jsonb,
--     '{}'::jsonb, now(), now()
--   FROM uid
--   RETURNING id
-- ),
-- ins_identities AS (
--   INSERT INTO auth.identities (
--     id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
--   )
--   SELECT gen_random_uuid(), ins_user.id, ins_user.id,
--     jsonb_build_object('sub', ins_user.id::text, 'email', 'lucacorrao1996@gmail.com'),
--     'email', now(), now(), now()
--   FROM ins_user
--   RETURNING user_id
-- )
-- INSERT INTO public.profiles (id, email, full_name, onboarding_completed)
-- SELECT ins_identities.user_id, 'lucacorrao1996@gmail.com', 'Luca Corrao', false
-- FROM ins_identities;

-- ============================================
-- ALTERNATIVA: se Supabase non permette INSERT su auth.users
-- Crea prima l'utente da Dashboard (Authentication → Users → Add user)
-- con email lucacorrao1996@gmail.com e password As67kocd22!
-- Poi prendi l'UUID dell'utente e esegui solo questo (sostituisci USER_ID):
--
-- INSERT INTO public.profiles (id, email, full_name, onboarding_completed)
-- VALUES (
--   'USER_ID'::uuid,
--   'lucacorrao1996@gmail.com',
--   'Luca Corrao',
--   false
-- )
-- ON CONFLICT (id) DO UPDATE SET
--   email = EXCLUDED.email,
--   full_name = EXCLUDED.full_name,
--   updated_at = now();
