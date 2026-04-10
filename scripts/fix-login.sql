-- ============================================
-- NOMADIQE - Fix login: conferma email + imposta password
-- Esegui in Supabase: SQL Editor (usa ruolo con accesso allo schema auth).
-- Se dà "permission denied" su auth.users, usa la Dashboard (vedi sotto).
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Conferma email (così Supabase non blocca il login)
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE email = 'lucacorrao1996@gmail.com';

-- 2) Imposta la password (hash bcrypt)
UPDATE auth.users
SET encrypted_password = crypt('As67kocd22!', gen_salt('bf')),
    updated_at = now()
WHERE email = 'lucacorrao1996@gmail.com';

-- 3) Fix "Database error querying schema": i token non devono essere NULL (auth li legge come stringa)
UPDATE auth.users
SET confirmation_token = COALESCE(confirmation_token, ''),
    email_change = COALESCE(email_change, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    recovery_token = COALESCE(recovery_token, ''),
    updated_at = now()
WHERE email = 'lucacorrao1996@gmail.com';

-- Verifica: deve restituire 1 riga
SELECT id, email, email_confirmed_at IS NOT NULL AS email_ok, created_at
FROM auth.users
WHERE email = 'lucacorrao1996@gmail.com';
