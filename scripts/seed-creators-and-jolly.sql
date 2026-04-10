-- ============================================
-- NOMADIQE - Seed 15 Creator + 15 Jolly (30 utenti)
-- Esegui TUTTO in Supabase → SQL Editor (un solo Run).
-- Crea 30 utenti finti in Auth + profili completi. Password: Test123!
-- Per swipe consecutivi su molti utenti in KOL&BED.
--
-- Se "permission denied" su auth.users: usa node scripts/seed-creators-and-jolly.js
-- con SUPABASE_SERVICE_ROLE_KEY in .env.
-- ============================================

-- 1) Estensione per hash password
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2) Inserimento 30 utenti in auth.users + auth.identities (il trigger crea il profilo)
-- Idempotente: salta le email già presenti (nessun errore duplicate key).
DO $$
DECLARE
  emails text[] := ARRAY[
    'creator1@nomadiqe.seed', 'creator2@nomadiqe.seed', 'creator3@nomadiqe.seed', 'creator4@nomadiqe.seed', 'creator5@nomadiqe.seed',
    'creator6@nomadiqe.seed', 'creator7@nomadiqe.seed', 'creator8@nomadiqe.seed', 'creator9@nomadiqe.seed', 'creator10@nomadiqe.seed',
    'creator11@nomadiqe.seed', 'creator12@nomadiqe.seed', 'creator13@nomadiqe.seed', 'creator14@nomadiqe.seed', 'creator15@nomadiqe.seed',
    'jolly1@nomadiqe.seed', 'jolly2@nomadiqe.seed', 'jolly3@nomadiqe.seed', 'jolly4@nomadiqe.seed', 'jolly5@nomadiqe.seed',
    'jolly6@nomadiqe.seed', 'jolly7@nomadiqe.seed', 'jolly8@nomadiqe.seed', 'jolly9@nomadiqe.seed', 'jolly10@nomadiqe.seed',
    'jolly11@nomadiqe.seed', 'jolly12@nomadiqe.seed', 'jolly13@nomadiqe.seed', 'jolly14@nomadiqe.seed', 'jolly15@nomadiqe.seed'
  ];
  u_id uuid;
  e text;
BEGIN
  FOREACH e IN ARRAY emails
  LOOP
    SELECT id INTO u_id FROM auth.users WHERE email = e LIMIT 1;
    IF u_id IS NULL THEN
      u_id := gen_random_uuid();
      INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES (
        '00000000-0000-0000-0000-000000000000',
        u_id,
        'authenticated',
        'authenticated',
        e,
        crypt('Test123!', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{}'::jsonb,
        now(),
        now()
      );
      INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      VALUES (gen_random_uuid(), u_id, u_id::text, jsonb_build_object('sub', u_id::text, 'email', e), 'email', now(), now(), now());
    END IF;
  END LOOP;
END $$;

-- 3) Colonne opzionali per KOL&BED (età, lingue, galleria copertina)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS content_language TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_cover_images TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio_links_approved BOOLEAN DEFAULT true;

-- ============================================
-- 15 CREATOR (avatar + più immagini, età, lingue, nicchie, follower)
-- ============================================

UPDATE public.profiles SET
  full_name = 'Sofia Martini',
  username = 'sofiacreator',
  role = 'creator',
  avatar_url = 'https://picsum.photos/seed/cr1/400/400',
  profile_cover_images = ARRAY[
    'https://picsum.photos/seed/cr1a/400/600',
    'https://picsum.photos/seed/cr1b/400/600',
    'https://picsum.photos/seed/cr1c/400/600'
  ],
  date_of_birth = '1995-03-12',
  content_language = ARRAY['it', 'en'],
  bio = 'Content creator • Travel & lifestyle • Collaborazioni strutture',
  creator_category = 'micro_influencer',
  creator_status = 'approved',
  admin_approved_opportunities = ARRAY['basic', 'medium', 'luxury'],
  creator_structure_preferences = ARRAY['basic', 'medium'],
  followers_count = 12500,
  social_links = '{"instagram": "https://instagram.com/sofiacreator", "tiktok": "https://tiktok.com/@sofiacreator"}'::jsonb,
  onboarding_completed = true
WHERE email = 'creator1@nomadiqe.seed';

UPDATE public.profiles SET
  full_name = 'Marco Rossi',
  username = 'marcotravel',
  role = 'creator',
  avatar_url = 'https://picsum.photos/seed/cr2/400/400',
  profile_cover_images = ARRAY[
    'https://picsum.photos/seed/cr2a/400/600',
    'https://picsum.photos/seed/cr2b/400/600'
  ],
  date_of_birth = '1992-07-08',
  content_language = ARRAY['it', 'en', 'es'],
  bio = 'Travel creator • Avventure on the road',
  creator_category = 'influencer',
  creator_status = 'approved',
  admin_approved_opportunities = ARRAY['basic', 'basic_paid', 'medium', 'luxury'],
  creator_structure_preferences = ARRAY['medium', 'luxury'],
  followers_count = 89000,
  social_links = '{"instagram": "https://instagram.com/marcotravel", "youtube": "https://youtube.com/@marcotravel"}'::jsonb,
  onboarding_completed = true
WHERE email = 'creator2@nomadiqe.seed';

UPDATE public.profiles SET
  full_name = 'Elena Bianchi',
  username = 'elenalifestyle',
  role = 'creator',
  avatar_url = 'https://picsum.photos/seed/cr3/400/400',
  profile_cover_images = ARRAY[
    'https://picsum.photos/seed/cr3a/400/600',
    'https://picsum.photos/seed/cr3b/400/600',
    'https://picsum.photos/seed/cr3c/400/600',
    'https://picsum.photos/seed/cr3d/400/600'
  ],
  date_of_birth = '1998-11-22',
  content_language = ARRAY['it', 'en', 'fr'],
  bio = 'Lifestyle & wellness • Borghi e natura',
  creator_category = 'ugc_creator',
  creator_status = 'approved',
  admin_approved_opportunities = ARRAY['basic', 'medium'],
  creator_structure_preferences = ARRAY['basic', 'medium', 'medium_fees'],
  followers_count = 22000,
  social_links = '{"instagram": "https://instagram.com/elenalifestyle", "tiktok": "https://tiktok.com/@elenalifestyle"}'::jsonb,
  onboarding_completed = true
WHERE email = 'creator3@nomadiqe.seed';

UPDATE public.profiles SET
  full_name = 'Luca Ferrara',
  username = 'lucaferrara',
  role = 'creator',
  avatar_url = 'https://picsum.photos/seed/cr4/400/400',
  profile_cover_images = ARRAY[
    'https://picsum.photos/seed/cr4a/400/600',
    'https://picsum.photos/seed/cr4b/400/600'
  ],
  date_of_birth = '1990-01-15',
  content_language = ARRAY['it'],
  bio = 'Food & hospitality • Recensioni e collaborazioni',
  creator_category = 'micro_influencer',
  creator_status = 'approved',
  admin_approved_opportunities = ARRAY['medium', 'luxury', 'luxury_paid'],
  creator_structure_preferences = ARRAY['luxury'],
  followers_count = 45000,
  social_links = '{"instagram": "https://instagram.com/lucaferrara"}'::jsonb,
  onboarding_completed = true
WHERE email = 'creator4@nomadiqe.seed';

UPDATE public.profiles SET
  full_name = 'Giulia Neri',
  username = 'giulianeri',
  role = 'creator',
  avatar_url = 'https://picsum.photos/seed/cr5/400/400',
  profile_cover_images = ARRAY[
    'https://picsum.photos/seed/cr5a/400/600',
    'https://picsum.photos/seed/cr5b/400/600',
    'https://picsum.photos/seed/cr5c/400/600'
  ],
  date_of_birth = '1996-05-30',
  content_language = ARRAY['it', 'en', 'de'],
  bio = 'Fashion & travel • Content per brand e strutture',
  creator_category = 'influencer',
  creator_status = 'approved',
  admin_approved_opportunities = ARRAY['basic_paid', 'medium', 'luxury'],
  creator_structure_preferences = ARRAY['medium', 'luxury'],
  followers_count = 156000,
  social_links = '{"instagram": "https://instagram.com/giulianeri", "tiktok": "https://tiktok.com/@giulianeri", "youtube": "https://youtube.com/@giulianeri"}'::jsonb,
  onboarding_completed = true
WHERE email = 'creator5@nomadiqe.seed';

UPDATE public.profiles SET
  full_name = 'Andrea Colombo',
  username = 'andreacolombo',
  role = 'creator',
  avatar_url = 'https://picsum.photos/seed/cr6/400/400',
  profile_cover_images = ARRAY[
    'https://picsum.photos/seed/cr6a/400/600',
    'https://picsum.photos/seed/cr6b/400/600'
  ],
  date_of_birth = '1993-09-04',
  content_language = ARRAY['it', 'en'],
  bio = 'UGC Creator • Video e reel per hospitality',
  creator_category = 'ugc_creator',
  creator_status = 'approved',
  admin_approved_opportunities = ARRAY['basic', 'medium', 'medium_fees'],
  creator_structure_preferences = ARRAY['basic', 'medium'],
  followers_count = 8200,
  social_links = '{"tiktok": "https://tiktok.com/@andreacolombo", "instagram": "https://instagram.com/andreacolombo"}'::jsonb,
  onboarding_completed = true
WHERE email = 'creator6@nomadiqe.seed';

UPDATE public.profiles SET
  full_name = 'Chiara Vitali',
  username = 'chiaravitali',
  role = 'creator',
  avatar_url = 'https://picsum.photos/seed/cr7/400/400',
  profile_cover_images = ARRAY[
    'https://picsum.photos/seed/cr7a/400/600',
    'https://picsum.photos/seed/cr7b/400/600',
    'https://picsum.photos/seed/cr7c/400/600'
  ],
  date_of_birth = '1997-12-18',
  content_language = ARRAY['it', 'en', 'fr', 'es'],
  bio = 'Travel & outdoor • Trekking e glamping',
  creator_category = 'micro_influencer',
  creator_status = 'approved',
  admin_approved_opportunities = ARRAY['basic', 'basic_paid', 'medium', 'luxury'],
  creator_structure_preferences = ARRAY['medium', 'luxury'],
  followers_count = 31000,
  social_links = '{"instagram": "https://instagram.com/chiaravitali", "youtube": "https://youtube.com/@chiaravitali"}'::jsonb,
  onboarding_completed = true
WHERE email = 'creator7@nomadiqe.seed';

UPDATE public.profiles SET
  full_name = 'Matteo Galli',
  username = 'matteogalli',
  role = 'creator',
  avatar_url = 'https://picsum.photos/seed/cr8/400/400',
  profile_cover_images = ARRAY[
    'https://picsum.photos/seed/cr8a/400/600',
    'https://picsum.photos/seed/cr8b/400/600'
  ],
  date_of_birth = '1991-06-25',
  content_language = ARRAY['it', 'en'],
  bio = 'Luxury travel • Hotel e dimore storiche',
  creator_category = 'influencer',
  creator_status = 'approved',
  admin_approved_opportunities = ARRAY['luxury', 'luxury_paid'],
  creator_structure_preferences = ARRAY['luxury', 'luxury_paid'],
  followers_count = 78000,
  social_links = '{"instagram": "https://instagram.com/matteogalli", "x": "https://x.com/matteogalli"}'::jsonb,
  onboarding_completed = true
WHERE email = 'creator8@nomadiqe.seed';

UPDATE public.profiles SET
  full_name = 'Francesca Conti',
  username = 'francescaconti',
  role = 'creator',
  avatar_url = 'https://picsum.photos/seed/cr9/400/400',
  profile_cover_images = ARRAY[
    'https://picsum.photos/seed/cr9a/400/600',
    'https://picsum.photos/seed/cr9b/400/600',
    'https://picsum.photos/seed/cr9c/400/600',
    'https://picsum.photos/seed/cr9d/400/600',
    'https://picsum.photos/seed/cr9e/400/600'
  ],
  date_of_birth = '1994-02-10',
  content_language = ARRAY['it', 'en', 'zh'],
  bio = 'Design & architettura • Case e B&B di charme',
  creator_category = 'ugc_creator',
  creator_status = 'approved',
  admin_approved_opportunities = ARRAY['basic', 'medium', 'luxury'],
  creator_structure_preferences = ARRAY['medium', 'luxury'],
  followers_count = 18900,
  social_links = '{"instagram": "https://instagram.com/francescaconti", "pinterest": "https://pinterest.com/francescaconti"}'::jsonb,
  onboarding_completed = true
WHERE email = 'creator9@nomadiqe.seed';

UPDATE public.profiles SET
  full_name = 'Davide Moretti',
  username = 'davidemoretti',
  role = 'creator',
  avatar_url = 'https://picsum.photos/seed/cr10/400/400',
  profile_cover_images = ARRAY[
    'https://picsum.photos/seed/cr10a/400/600',
    'https://picsum.photos/seed/cr10b/400/600',
    'https://picsum.photos/seed/cr10c/400/600'
  ],
  date_of_birth = '1989-08-03',
  content_language = ARRAY['it', 'en', 'de', 'fr'],
  bio = 'Adventure & sport • Montagna e mare',
  creator_category = 'influencer',
  creator_status = 'approved',
  admin_approved_opportunities = ARRAY['basic', 'medium', 'medium_fees', 'luxury'],
  creator_structure_preferences = ARRAY['basic', 'medium', 'luxury'],
  followers_count = 92000,
  social_links = '{"instagram": "https://instagram.com/davidemoretti", "tiktok": "https://tiktok.com/@davidemoretti", "youtube": "https://youtube.com/@davidemoretti"}'::jsonb,
  onboarding_completed = true
WHERE email = 'creator10@nomadiqe.seed';

-- 5 Creator aggiuntivi (11-15) per swipe consecutivi
UPDATE public.profiles SET
  full_name = 'Valentina Costa',
  username = 'valentinacosta',
  role = 'creator',
  avatar_url = 'https://picsum.photos/seed/cr11/400/400',
  profile_cover_images = ARRAY['https://picsum.photos/seed/cr11a/400/600', 'https://picsum.photos/seed/cr11b/400/600'],
  date_of_birth = '1995-04-20',
  content_language = ARRAY['it', 'en'],
  bio = 'Fotografia e travel • Collaborazioni B&B',
  creator_category = 'micro_influencer',
  creator_status = 'approved',
  admin_approved_opportunities = ARRAY['basic', 'medium'],
  creator_structure_preferences = ARRAY['basic', 'medium'],
  followers_count = 18500,
  social_links = '{"instagram": "https://instagram.com/valentinacosta"}'::jsonb,
  onboarding_completed = true
WHERE email = 'creator11@nomadiqe.seed';

UPDATE public.profiles SET
  full_name = 'Federico Belli',
  username = 'federicobelli',
  role = 'creator',
  avatar_url = 'https://picsum.photos/seed/cr12/400/400',
  profile_cover_images = ARRAY['https://picsum.photos/seed/cr12a/400/600', 'https://picsum.photos/seed/cr12b/400/600', 'https://picsum.photos/seed/cr12c/400/600'],
  date_of_birth = '1991-10-12',
  content_language = ARRAY['it', 'en', 'de'],
  bio = 'Adventure creator • Outdoor e glamping',
  creator_category = 'influencer',
  creator_status = 'approved',
  admin_approved_opportunities = ARRAY['basic', 'medium', 'luxury'],
  creator_structure_preferences = ARRAY['medium', 'luxury'],
  followers_count = 52000,
  social_links = '{"instagram": "https://instagram.com/federicobelli", "tiktok": "https://tiktok.com/@federicobelli"}'::jsonb,
  onboarding_completed = true
WHERE email = 'creator12@nomadiqe.seed';

UPDATE public.profiles SET
  full_name = 'Alessia Romano',
  username = 'alessiaromano',
  role = 'creator',
  avatar_url = 'https://picsum.photos/seed/cr13/400/400',
  profile_cover_images = ARRAY['https://picsum.photos/seed/cr13a/400/600', 'https://picsum.photos/seed/cr13b/400/600'],
  date_of_birth = '1997-07-05',
  content_language = ARRAY['it', 'en', 'fr'],
  bio = 'Lifestyle & food • Storie e reel per strutture',
  creator_category = 'ugc_creator',
  creator_status = 'approved',
  admin_approved_opportunities = ARRAY['basic', 'medium'],
  creator_structure_preferences = ARRAY['basic', 'medium_fees'],
  followers_count = 11200,
  social_links = '{"tiktok": "https://tiktok.com/@alessiaromano", "instagram": "https://instagram.com/alessiaromano"}'::jsonb,
  onboarding_completed = true
WHERE email = 'creator13@nomadiqe.seed';

UPDATE public.profiles SET
  full_name = 'Simone Greco',
  username = 'simonegreco',
  role = 'creator',
  avatar_url = 'https://picsum.photos/seed/cr14/400/400',
  profile_cover_images = ARRAY['https://picsum.photos/seed/cr14a/400/600', 'https://picsum.photos/seed/cr14b/400/600', 'https://picsum.photos/seed/cr14c/400/600'],
  date_of_birth = '1988-12-28',
  content_language = ARRAY['it', 'en'],
  bio = 'Travel & vlog • Collaborazioni hotel e agriturismi',
  creator_category = 'influencer',
  creator_status = 'approved',
  admin_approved_opportunities = ARRAY['basic', 'medium', 'luxury', 'luxury_paid'],
  creator_structure_preferences = ARRAY['medium', 'luxury'],
  followers_count = 67000,
  social_links = '{"youtube": "https://youtube.com/@simonegreco", "instagram": "https://instagram.com/simonegreco"}'::jsonb,
  onboarding_completed = true
WHERE email = 'creator14@nomadiqe.seed';

UPDATE public.profiles SET
  full_name = 'Beatrice Leone',
  username = 'beatriceleone',
  role = 'creator',
  avatar_url = 'https://picsum.photos/seed/cr15/400/400',
  profile_cover_images = ARRAY['https://picsum.photos/seed/cr15a/400/600', 'https://picsum.photos/seed/cr15b/400/600'],
  date_of_birth = '1994-06-14',
  content_language = ARRAY['it', 'en', 'es'],
  bio = 'Fashion & travel • Content per brand hospitality',
  creator_category = 'micro_influencer',
  creator_status = 'approved',
  admin_approved_opportunities = ARRAY['basic', 'basic_paid', 'medium'],
  creator_structure_preferences = ARRAY['basic', 'medium'],
  followers_count = 24800,
  social_links = '{"instagram": "https://instagram.com/beatriceleone", "pinterest": "https://pinterest.com/beatriceleone"}'::jsonb,
  onboarding_completed = true
WHERE email = 'creator15@nomadiqe.seed';

-- Nicchie per i 15 creator (creator_niches). Rimuovi eventuali nicchie già presenti per questi utenti (script ri-eseguibile).
DELETE FROM public.creator_niches
WHERE user_id IN (SELECT id FROM public.profiles WHERE email LIKE '%@nomadiqe.seed' AND role = 'creator');

INSERT INTO public.creator_niches (user_id, niche)
SELECT p.id, n FROM public.profiles p, unnest(ARRAY['travel', 'lifestyle']) n WHERE p.email = 'creator1@nomadiqe.seed';
INSERT INTO public.creator_niches (user_id, niche)
SELECT p.id, n FROM public.profiles p, unnest(ARRAY['travel', 'adventure', 'vlog']) n WHERE p.email = 'creator2@nomadiqe.seed';
INSERT INTO public.creator_niches (user_id, niche)
SELECT p.id, n FROM public.profiles p, unnest(ARRAY['lifestyle', 'wellness', 'nature']) n WHERE p.email = 'creator3@nomadiqe.seed';
INSERT INTO public.creator_niches (user_id, niche)
SELECT p.id, n FROM public.profiles p, unnest(ARRAY['food', 'hospitality', 'review']) n WHERE p.email = 'creator4@nomadiqe.seed';
INSERT INTO public.creator_niches (user_id, niche)
SELECT p.id, n FROM public.profiles p, unnest(ARRAY['fashion', 'travel', 'lifestyle']) n WHERE p.email = 'creator5@nomadiqe.seed';
INSERT INTO public.creator_niches (user_id, niche)
SELECT p.id, n FROM public.profiles p, unnest(ARRAY['ugc', 'hospitality', 'video']) n WHERE p.email = 'creator6@nomadiqe.seed';
INSERT INTO public.creator_niches (user_id, niche)
SELECT p.id, n FROM public.profiles p, unnest(ARRAY['travel', 'outdoor', 'trekking']) n WHERE p.email = 'creator7@nomadiqe.seed';
INSERT INTO public.creator_niches (user_id, niche)
SELECT p.id, n FROM public.profiles p, unnest(ARRAY['luxury', 'hotel', 'travel']) n WHERE p.email = 'creator8@nomadiqe.seed';
INSERT INTO public.creator_niches (user_id, niche)
SELECT p.id, n FROM public.profiles p, unnest(ARRAY['design', 'architecture', 'bnb']) n WHERE p.email = 'creator9@nomadiqe.seed';
INSERT INTO public.creator_niches (user_id, niche)
SELECT p.id, n FROM public.profiles p, unnest(ARRAY['adventure', 'sport', 'mountain', 'sea']) n WHERE p.email = 'creator10@nomadiqe.seed';
INSERT INTO public.creator_niches (user_id, niche)
SELECT p.id, n FROM public.profiles p, unnest(ARRAY['photography', 'travel', 'bnb']) n WHERE p.email = 'creator11@nomadiqe.seed';
INSERT INTO public.creator_niches (user_id, niche)
SELECT p.id, n FROM public.profiles p, unnest(ARRAY['adventure', 'outdoor', 'glamping']) n WHERE p.email = 'creator12@nomadiqe.seed';
INSERT INTO public.creator_niches (user_id, niche)
SELECT p.id, n FROM public.profiles p, unnest(ARRAY['lifestyle', 'food', 'ugc']) n WHERE p.email = 'creator13@nomadiqe.seed';
INSERT INTO public.creator_niches (user_id, niche)
SELECT p.id, n FROM public.profiles p, unnest(ARRAY['travel', 'vlog', 'hospitality']) n WHERE p.email = 'creator14@nomadiqe.seed';
INSERT INTO public.creator_niches (user_id, niche)
SELECT p.id, n FROM public.profiles p, unnest(ARRAY['fashion', 'travel', 'lifestyle']) n WHERE p.email = 'creator15@nomadiqe.seed';

-- ============================================
-- 15 JOLLY (avatar, jolly_subcategory, bio per servizio)
-- cleaner, property_manager, assistenza, autista, fornitore (2+1 ciascuno), + 5 vari
-- ============================================

UPDATE public.profiles SET
  full_name = 'Anna Pulizie',
  username = 'annapulizie',
  role = 'jolly',
  jolly_subcategory = 'cleaner',
  avatar_url = 'https://picsum.photos/seed/jl1/400/400',
  bio = 'Pulizie professionali per appartamenti e B&B. Servizio post-checkout e preparazione per nuovi ospiti. Zone: Milano e hinterland.',
  onboarding_completed = true
WHERE email = 'jolly1@nomadiqe.seed';

UPDATE public.profiles SET
  full_name = 'Roberto Clean',
  username = 'robertoclean',
  role = 'jolly',
  jolly_subcategory = 'cleaner',
  avatar_url = 'https://picsum.photos/seed/jl2/400/400',
  bio = 'Pulizie strutture turistiche e case vacanza. Lavoro in coppia per tempi rapidi. Costa Romagnola e entroterra.',
  onboarding_completed = true
WHERE email = 'jolly2@nomadiqe.seed';

UPDATE public.profiles SET
  full_name = 'Laura Property',
  username = 'lauraproperty',
  role = 'jolly',
  jolly_subcategory = 'property_manager',
  avatar_url = 'https://picsum.photos/seed/jl3/400/400',
  bio = 'Property manager per seconde case e affitti turistici. Gestione chiavi, check-in/out, manutenzioni e rapporti con gli ospiti.',
  onboarding_completed = true
WHERE email = 'jolly3@nomadiqe.seed';

UPDATE public.profiles SET
  full_name = 'Stefano Gestione',
  username = 'stefanogestione',
  role = 'jolly',
  jolly_subcategory = 'property_manager',
  avatar_url = 'https://picsum.photos/seed/jl4/400/400',
  bio = 'Gestione completa proprietà in affitto. Amministrazione, pulizie coordinate, accoglienza ospiti. Zona Firenze e Chianti.',
  onboarding_completed = true
WHERE email = 'jolly4@nomadiqe.seed';

UPDATE public.profiles SET
  full_name = 'Maria Assistenza',
  username = 'mariaassistenza',
  role = 'jolly',
  jolly_subcategory = 'assistenza',
  avatar_url = 'https://picsum.photos/seed/jl5/400/400',
  bio = 'Assistenza clienti e supporto per strutture ricettive. Prenotazioni, informazioni, gestione reclami. Disponibile 7/7.',
  onboarding_completed = true
WHERE email = 'jolly5@nomadiqe.seed';

UPDATE public.profiles SET
  full_name = 'Paolo Support',
  username = 'paolosupport',
  role = 'jolly',
  jolly_subcategory = 'assistenza',
  avatar_url = 'https://picsum.photos/seed/jl6/400/400',
  bio = 'Supporto operativo per host: prenotazioni, comunicazione con ospiti, coordinamento check-in. Lavoro da remoto.',
  onboarding_completed = true
WHERE email = 'jolly6@nomadiqe.seed';

UPDATE public.profiles SET
  full_name = 'Giuseppe Shuttle',
  username = 'giuseppeshuttle',
  role = 'jolly',
  jolly_subcategory = 'autista',
  avatar_url = 'https://picsum.photos/seed/jl7/400/400',
  bio = 'Servizio navetta e transfer aeroporto/stazione – struttura. Auto e minivan. Disponibile 24h. Roma e Fiumicino.',
  onboarding_completed = true
WHERE email = 'jolly7@nomadiqe.seed';

UPDATE public.profiles SET
  full_name = 'Marco Driver',
  username = 'marcodriver',
  role = 'jolly',
  jolly_subcategory = 'autista',
  avatar_url = 'https://picsum.photos/seed/jl8/400/400',
  bio = 'Transfer e shuttle per ospiti. Servizio NCC. Zone: Napoli, Costiera Amalfitana, aeroporto Capodichino.',
  onboarding_completed = true
WHERE email = 'jolly8@nomadiqe.seed';

UPDATE public.profiles SET
  full_name = 'Sara Fornitore',
  username = 'sarafornitore',
  role = 'jolly',
  jolly_subcategory = 'fornitore',
  avatar_url = 'https://picsum.photos/seed/jl9/400/400',
  bio = 'Forniture per strutture: biancheria, amenities, prodotti per pulizie. Consegna a domicilio. Nord Italia.',
  onboarding_completed = true
WHERE email = 'jolly9@nomadiqe.seed';

UPDATE public.profiles SET
  full_name = 'Antonio Supply',
  username = 'antoniosupply',
  role = 'jolly',
  jolly_subcategory = 'fornitore',
  avatar_url = 'https://picsum.photos/seed/jl10/400/400',
  bio = 'Fornitore per B&B e case vacanza: lenzuola, asciugamani, set cortesia. Servizio rapido. Sicilia orientale.',
  onboarding_completed = true
WHERE email = 'jolly10@nomadiqe.seed';

-- 5 Jolly aggiuntivi (11-15)
UPDATE public.profiles SET
  full_name = 'Claudia Pulizie',
  username = 'claudiapulizie',
  role = 'jolly',
  jolly_subcategory = 'cleaner',
  avatar_url = 'https://picsum.photos/seed/jl11/400/400',
  bio = 'Pulizie deep per appartamenti e ville. Servizio pre/post soggiorno. Liguria e Riviera.',
  onboarding_completed = true
WHERE email = 'jolly11@nomadiqe.seed';

UPDATE public.profiles SET
  full_name = 'Filippo Manager',
  username = 'filippomanager',
  role = 'jolly',
  jolly_subcategory = 'property_manager',
  avatar_url = 'https://picsum.photos/seed/jl12/400/400',
  bio = 'Property manager per affitti brevi. Gestione centralizzata, pricing, pulizie. Bologna e provincia.',
  onboarding_completed = true
WHERE email = 'jolly12@nomadiqe.seed';

UPDATE public.profiles SET
  full_name = 'Valeria Assist',
  username = 'valeriaassist',
  role = 'jolly',
  jolly_subcategory = 'assistenza',
  avatar_url = 'https://picsum.photos/seed/jl13/400/400',
  bio = 'Assistenza e booking per strutture. Supporto multilingue. Disponibilità estesa.',
  onboarding_completed = true
WHERE email = 'jolly13@nomadiqe.seed';

UPDATE public.profiles SET
  full_name = 'Lorenzo Transfer',
  username = 'lorenzotransfer',
  role = 'jolly',
  jolly_subcategory = 'autista',
  avatar_url = 'https://picsum.photos/seed/jl14/400/400',
  bio = 'Transfer aeroportuali e tour. Minivan 8 posti. Venezia, Treviso, Marco Polo.',
  onboarding_completed = true
WHERE email = 'jolly14@nomadiqe.seed';

UPDATE public.profiles SET
  full_name = 'Elena Fornitrice',
  username = 'elenafornitrice',
  role = 'jolly',
  jolly_subcategory = 'fornitore',
  avatar_url = 'https://picsum.photos/seed/jl15/400/400',
  bio = 'Forniture per strutture: cortesia, biancheria, arredamento. Consegna Centro Italia.',
  onboarding_completed = true
WHERE email = 'jolly15@nomadiqe.seed';

-- ============================================
-- Fine seed. Verifica con:
-- SELECT email, full_name, role, creator_category, jolly_subcategory FROM public.profiles WHERE email LIKE '%@nomadiqe.seed' ORDER BY role, email;
-- ============================================
