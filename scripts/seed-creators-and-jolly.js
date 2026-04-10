/**
 * NOMADIQE - Seed 15 Creator + 36 Jolly (51 utenti)
 * Almeno 3 utenti per ogni ruolo e sottocategoria Jolly, con immagine profilo.
 *
 * Uso:
 *   Imposta in .env (o nella shell):
 *   - SUPABASE_URL (es. https://xxx.supabase.co)
 *   - SUPABASE_SERVICE_ROLE_KEY (da Dashboard → Settings → API → service_role)
 *
 *   node scripts/seed-creators-and-jolly.js
 *
 * Password comune per tutti: Test123!
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carica .env dalla root del progetto
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  });
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Imposta SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY in .env');
  console.error('Service role: Supabase Dashboard → Settings → API → service_role (secret)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = 'Test123!';

const CREATORS = [
  { email: 'creator1@nomadiqe.seed', full_name: 'Sofia Martini', username: 'sofiacreator', profile_cover_images: ['https://picsum.photos/seed/cr1a/400/600', 'https://picsum.photos/seed/cr1b/400/600', 'https://picsum.photos/seed/cr1c/400/600'], date_of_birth: '1995-03-12', content_language: ['it', 'en'], bio: 'Content creator • Travel & lifestyle • Collaborazioni strutture', creator_category: 'micro_influencer', admin_approved_opportunities: ['basic', 'medium', 'luxury'], creator_structure_preferences: ['basic', 'medium'], followers_count: 12500, social_links: { instagram: 'https://instagram.com/sofiacreator', tiktok: 'https://tiktok.com/@sofiacreator' }, niches: ['travel', 'lifestyle'] },
  { email: 'creator2@nomadiqe.seed', full_name: 'Marco Rossi', username: 'marcotravel', profile_cover_images: ['https://picsum.photos/seed/cr2a/400/600', 'https://picsum.photos/seed/cr2b/400/600'], date_of_birth: '1992-07-08', content_language: ['it', 'en', 'es'], bio: 'Travel creator • Avventure on the road', creator_category: 'influencer', admin_approved_opportunities: ['basic', 'basic_paid', 'medium', 'luxury'], creator_structure_preferences: ['medium', 'luxury'], followers_count: 89000, social_links: { instagram: 'https://instagram.com/marcotravel', youtube: 'https://youtube.com/@marcotravel' }, niches: ['travel', 'adventure', 'vlog'] },
  { email: 'creator3@nomadiqe.seed', full_name: 'Elena Bianchi', username: 'elenalifestyle', profile_cover_images: ['https://picsum.photos/seed/cr3a/400/600', 'https://picsum.photos/seed/cr3b/400/600', 'https://picsum.photos/seed/cr3c/400/600', 'https://picsum.photos/seed/cr3d/400/600'], date_of_birth: '1998-11-22', content_language: ['it', 'en', 'fr'], bio: 'Lifestyle & wellness • Borghi e natura', creator_category: 'ugc_creator', admin_approved_opportunities: ['basic', 'medium'], creator_structure_preferences: ['basic', 'medium', 'medium_fees'], followers_count: 22000, social_links: { instagram: 'https://instagram.com/elenalifestyle', tiktok: 'https://tiktok.com/@elenalifestyle' }, niches: ['lifestyle', 'wellness', 'nature'] },
  { email: 'creator4@nomadiqe.seed', full_name: 'Luca Ferrara', username: 'lucaferrara', profile_cover_images: ['https://picsum.photos/seed/cr4a/400/600', 'https://picsum.photos/seed/cr4b/400/600'], date_of_birth: '1990-01-15', content_language: ['it'], bio: 'Food & hospitality • Recensioni e collaborazioni', creator_category: 'micro_influencer', admin_approved_opportunities: ['medium', 'luxury', 'luxury_paid'], creator_structure_preferences: ['luxury'], followers_count: 45000, social_links: { instagram: 'https://instagram.com/lucaferrara' }, niches: ['food', 'hospitality', 'review'] },
  { email: 'creator5@nomadiqe.seed', full_name: 'Giulia Neri', username: 'giulianeri', profile_cover_images: ['https://picsum.photos/seed/cr5a/400/600', 'https://picsum.photos/seed/cr5b/400/600', 'https://picsum.photos/seed/cr5c/400/600'], date_of_birth: '1996-05-30', content_language: ['it', 'en', 'de'], bio: 'Fashion & travel • Content per brand e strutture', creator_category: 'influencer', admin_approved_opportunities: ['basic_paid', 'medium', 'luxury'], creator_structure_preferences: ['medium', 'luxury'], followers_count: 156000, social_links: { instagram: 'https://instagram.com/giulianeri', tiktok: 'https://tiktok.com/@giulianeri', youtube: 'https://youtube.com/@giulianeri' }, niches: ['fashion', 'travel', 'lifestyle'] },
  { email: 'creator6@nomadiqe.seed', full_name: 'Andrea Colombo', username: 'andreacolombo', profile_cover_images: ['https://picsum.photos/seed/cr6a/400/600', 'https://picsum.photos/seed/cr6b/400/600'], date_of_birth: '1993-09-04', content_language: ['it', 'en'], bio: 'UGC Creator • Video e reel per hospitality', creator_category: 'ugc_creator', admin_approved_opportunities: ['basic', 'medium', 'medium_fees'], creator_structure_preferences: ['basic', 'medium'], followers_count: 8200, social_links: { tiktok: 'https://tiktok.com/@andreacolombo', instagram: 'https://instagram.com/andreacolombo' }, niches: ['ugc', 'hospitality', 'video'] },
  { email: 'creator7@nomadiqe.seed', full_name: 'Chiara Vitali', username: 'chiaravitali', profile_cover_images: ['https://picsum.photos/seed/cr7a/400/600', 'https://picsum.photos/seed/cr7b/400/600', 'https://picsum.photos/seed/cr7c/400/600'], date_of_birth: '1997-12-18', content_language: ['it', 'en', 'fr', 'es'], bio: 'Travel & outdoor • Trekking e glamping', creator_category: 'micro_influencer', admin_approved_opportunities: ['basic', 'basic_paid', 'medium', 'luxury'], creator_structure_preferences: ['medium', 'luxury'], followers_count: 31000, social_links: { instagram: 'https://instagram.com/chiaravitali', youtube: 'https://youtube.com/@chiaravitali' }, niches: ['travel', 'outdoor', 'trekking'] },
  { email: 'creator8@nomadiqe.seed', full_name: 'Matteo Galli', username: 'matteogalli', profile_cover_images: ['https://picsum.photos/seed/cr8a/400/600', 'https://picsum.photos/seed/cr8b/400/600'], date_of_birth: '1991-06-25', content_language: ['it', 'en'], bio: 'Luxury travel • Hotel e dimore storiche', creator_category: 'influencer', admin_approved_opportunities: ['luxury', 'luxury_paid'], creator_structure_preferences: ['luxury', 'luxury_paid'], followers_count: 78000, social_links: { instagram: 'https://instagram.com/matteogalli', x: 'https://x.com/matteogalli' }, niches: ['luxury', 'hotel', 'travel'] },
  { email: 'creator9@nomadiqe.seed', full_name: 'Francesca Conti', username: 'francescaconti', profile_cover_images: ['https://picsum.photos/seed/cr9a/400/600', 'https://picsum.photos/seed/cr9b/400/600', 'https://picsum.photos/seed/cr9c/400/600', 'https://picsum.photos/seed/cr9d/400/600', 'https://picsum.photos/seed/cr9e/400/600'], date_of_birth: '1994-02-10', content_language: ['it', 'en', 'zh'], bio: 'Design & architettura • Case e B&B di charme', creator_category: 'ugc_creator', admin_approved_opportunities: ['basic', 'medium', 'luxury'], creator_structure_preferences: ['medium', 'luxury'], followers_count: 18900, social_links: { instagram: 'https://instagram.com/francescaconti', pinterest: 'https://pinterest.com/francescaconti' }, niches: ['design', 'architecture', 'bnb'] },
  { email: 'creator10@nomadiqe.seed', full_name: 'Davide Moretti', username: 'davidemoretti', profile_cover_images: ['https://picsum.photos/seed/cr10a/400/600', 'https://picsum.photos/seed/cr10b/400/600', 'https://picsum.photos/seed/cr10c/400/600'], date_of_birth: '1989-08-03', content_language: ['it', 'en', 'de', 'fr'], bio: 'Adventure & sport • Montagna e mare', creator_category: 'influencer', admin_approved_opportunities: ['basic', 'medium', 'medium_fees', 'luxury'], creator_structure_preferences: ['basic', 'medium', 'luxury'], followers_count: 92000, social_links: { instagram: 'https://instagram.com/davidemoretti', tiktok: 'https://tiktok.com/@davidemoretti', youtube: 'https://youtube.com/@davidemoretti' }, niches: ['adventure', 'sport', 'mountain', 'sea'] },
  { email: 'creator11@nomadiqe.seed', full_name: 'Valentina Costa', username: 'valentinacosta', profile_cover_images: ['https://picsum.photos/seed/cr11a/400/600', 'https://picsum.photos/seed/cr11b/400/600'], date_of_birth: '1995-04-20', content_language: ['it', 'en'], bio: 'Fotografia e travel • Collaborazioni B&B', creator_category: 'micro_influencer', admin_approved_opportunities: ['basic', 'medium'], creator_structure_preferences: ['basic', 'medium'], followers_count: 18500, social_links: { instagram: 'https://instagram.com/valentinacosta' }, niches: ['photography', 'travel', 'bnb'] },
  { email: 'creator12@nomadiqe.seed', full_name: 'Federico Belli', username: 'federicobelli', profile_cover_images: ['https://picsum.photos/seed/cr12a/400/600', 'https://picsum.photos/seed/cr12b/400/600', 'https://picsum.photos/seed/cr12c/400/600'], date_of_birth: '1991-10-12', content_language: ['it', 'en', 'de'], bio: 'Adventure creator • Outdoor e glamping', creator_category: 'influencer', admin_approved_opportunities: ['basic', 'medium', 'luxury'], creator_structure_preferences: ['medium', 'luxury'], followers_count: 52000, social_links: { instagram: 'https://instagram.com/federicobelli', tiktok: 'https://tiktok.com/@federicobelli' }, niches: ['adventure', 'outdoor', 'glamping'] },
  { email: 'creator13@nomadiqe.seed', full_name: 'Alessia Romano', username: 'alessiaromano', profile_cover_images: ['https://picsum.photos/seed/cr13a/400/600', 'https://picsum.photos/seed/cr13b/400/600'], date_of_birth: '1997-07-05', content_language: ['it', 'en', 'fr'], bio: 'Lifestyle & food • Storie e reel per strutture', creator_category: 'ugc_creator', admin_approved_opportunities: ['basic', 'medium'], creator_structure_preferences: ['basic', 'medium_fees'], followers_count: 11200, social_links: { tiktok: 'https://tiktok.com/@alessiaromano', instagram: 'https://instagram.com/alessiaromano' }, niches: ['lifestyle', 'food', 'ugc'] },
  { email: 'creator14@nomadiqe.seed', full_name: 'Simone Greco', username: 'simonegreco', profile_cover_images: ['https://picsum.photos/seed/cr14a/400/600', 'https://picsum.photos/seed/cr14b/400/600', 'https://picsum.photos/seed/cr14c/400/600'], date_of_birth: '1988-12-28', content_language: ['it', 'en'], bio: 'Travel & vlog • Collaborazioni hotel e agriturismi', creator_category: 'influencer', admin_approved_opportunities: ['basic', 'medium', 'luxury', 'luxury_paid'], creator_structure_preferences: ['medium', 'luxury'], followers_count: 67000, social_links: { youtube: 'https://youtube.com/@simonegreco', instagram: 'https://instagram.com/simonegreco' }, niches: ['travel', 'vlog', 'hospitality'] },
  { email: 'creator15@nomadiqe.seed', full_name: 'Beatrice Leone', username: 'beatriceleone', profile_cover_images: ['https://picsum.photos/seed/cr15a/400/600', 'https://picsum.photos/seed/cr15b/400/600'], date_of_birth: '1994-06-14', content_language: ['it', 'en', 'es'], bio: 'Fashion & travel • Content per brand hospitality', creator_category: 'micro_influencer', admin_approved_opportunities: ['basic', 'basic_paid', 'medium'], creator_structure_preferences: ['basic', 'medium'], followers_count: 24800, social_links: { instagram: 'https://instagram.com/beatriceleone', pinterest: 'https://pinterest.com/beatriceleone' }, niches: ['fashion', 'travel', 'lifestyle'] },
];

const JOLLY = [
  { email: 'jolly1@nomadiqe.seed', full_name: 'Anna Pulizie', username: 'annapulizie', jolly_subcategory: 'cleaner', bio: 'Pulizie professionali per appartamenti e B&B. Servizio post-checkout e preparazione per nuovi ospiti. Zone: Milano e hinterland.' },
  { email: 'jolly2@nomadiqe.seed', full_name: 'Roberto Clean', username: 'robertoclean', jolly_subcategory: 'cleaner', bio: 'Pulizie strutture turistiche e case vacanza. Lavoro in coppia per tempi rapidi. Costa Romagnola e entroterra.' },
  { email: 'jolly3@nomadiqe.seed', full_name: 'Laura Property', username: 'lauraproperty', jolly_subcategory: 'property_manager', bio: 'Property manager per seconde case e affitti turistici. Gestione chiavi, check-in/out, manutenzioni e rapporti con gli ospiti.' },
  { email: 'jolly4@nomadiqe.seed', full_name: 'Stefano Gestione', username: 'stefanogestione', jolly_subcategory: 'property_manager', bio: 'Gestione completa proprietà in affitto. Amministrazione, pulizie coordinate, accoglienza ospiti. Zona Firenze e Chianti.' },
  { email: 'jolly5@nomadiqe.seed', full_name: 'Maria Assistenza', username: 'mariaassistenza', jolly_subcategory: 'assistenza', bio: 'Assistenza clienti e supporto per strutture ricettive. Prenotazioni, informazioni, gestione reclami. Disponibile 7/7.' },
  { email: 'jolly6@nomadiqe.seed', full_name: 'Paolo Support', username: 'paolosupport', jolly_subcategory: 'assistenza', bio: 'Supporto operativo per host: prenotazioni, comunicazione con ospiti, coordinamento check-in. Lavoro da remoto.' },
  { email: 'jolly7@nomadiqe.seed', full_name: 'Giuseppe Shuttle', username: 'giuseppeshuttle', jolly_subcategory: 'autista', bio: 'Servizio navetta e transfer aeroporto/stazione – struttura. Auto e minivan. Disponibile 24h. Roma e Fiumicino.' },
  { email: 'jolly8@nomadiqe.seed', full_name: 'Marco Driver', username: 'marcodriver', jolly_subcategory: 'autista', bio: 'Transfer e shuttle per ospiti. Servizio NCC. Zone: Napoli, Costiera Amalfitana, aeroporto Capodichino.' },
  { email: 'jolly9@nomadiqe.seed', full_name: 'Sara Fornitore', username: 'sarafornitore', jolly_subcategory: 'fornitore', bio: 'Forniture per strutture: biancheria, amenities, prodotti per pulizie. Consegna a domicilio. Nord Italia.' },
  { email: 'jolly10@nomadiqe.seed', full_name: 'Antonio Supply', username: 'antoniosupply', jolly_subcategory: 'fornitore', bio: 'Fornitore per B&B e case vacanza: lenzuola, asciugamani, set cortesia. Servizio rapido. Sicilia orientale.' },
  { email: 'jolly11@nomadiqe.seed', full_name: 'Claudia Pulizie', username: 'claudiapulizie', jolly_subcategory: 'cleaner', bio: 'Pulizie deep per appartamenti e ville. Servizio pre/post soggiorno. Liguria e Riviera.' },
  { email: 'jolly12@nomadiqe.seed', full_name: 'Filippo Manager', username: 'filippomanager', jolly_subcategory: 'property_manager', bio: 'Property manager per affitti brevi. Gestione centralizzata, pricing, pulizie. Bologna e provincia.' },
  { email: 'jolly13@nomadiqe.seed', full_name: 'Valeria Assist', username: 'valeriaassist', jolly_subcategory: 'assistenza', bio: 'Assistenza e booking per strutture. Supporto multilingue. Disponibilità estesa.' },
  { email: 'jolly14@nomadiqe.seed', full_name: 'Lorenzo Transfer', username: 'lorenzotransfer', jolly_subcategory: 'autista', bio: 'Transfer aeroportuali e tour. Minivan 8 posti. Venezia, Treviso, Marco Polo.' },
  { email: 'jolly15@nomadiqe.seed', full_name: 'Elena Fornitrice', username: 'elenafornitrice', jolly_subcategory: 'fornitore', bio: 'Forniture per strutture: cortesia, biancheria, arredamento. Consegna Centro Italia.' },
  // restaurant (3)
  { email: 'jolly16@nomadiqe.seed', full_name: 'Marco Chef', username: 'marcachef', jolly_subcategory: 'restaurant', bio: 'Ristorante e catering per strutture. Menu per ospiti e eventi. Toscana.' },
  { email: 'jolly17@nomadiqe.seed', full_name: 'Sara Tavola', username: 'saratavola', jolly_subcategory: 'restaurant', bio: 'Servizio catering e colazioni per B&B. Cucina locale e gluten-free. Umbria.' },
  { email: 'jolly18@nomadiqe.seed', full_name: 'Luigi Cucina', username: 'luigicucina', jolly_subcategory: 'restaurant', bio: 'Pranzi e cene per gruppi. Menu personalizzati. Sicilia.' },
  // photographer (3)
  { email: 'jolly19@nomadiqe.seed', full_name: 'Alessandro Foto', username: 'alessandrofoto', jolly_subcategory: 'photographer', bio: 'Fotografo per strutture: interno, esterno, drone. Portfolio hospitality.' },
  { email: 'jolly20@nomadiqe.seed', full_name: 'Martina Shots', username: 'martinashots', jolly_subcategory: 'photographer', bio: 'Servizi fotografici per B&B e agriturismi. Ritocchi e catalogo.' },
  { email: 'jolly21@nomadiqe.seed', full_name: 'Fabio Immagini', username: 'fabioimmagini', jolly_subcategory: 'photographer', bio: 'Fotografia e video per strutture ricettive. Lago di Garda e dintorni.' },
  // social_media_manager (3)
  { email: 'jolly22@nomadiqe.seed', full_name: 'Laura Social', username: 'laurasocial', jolly_subcategory: 'social_media_manager', bio: 'Gestione social per strutture. Instagram, Facebook, booking. Contenuti e sponsorizzate.' },
  { email: 'jolly23@nomadiqe.seed', full_name: 'Tommaso Digital', username: 'tommasodigital', jolly_subcategory: 'social_media_manager', bio: 'SMM e advertising per hospitality. Ottimizzazione conversioni e visibilità.' },
  { email: 'jolly24@nomadiqe.seed', full_name: 'Giada Web', username: 'giadaweb', jolly_subcategory: 'social_media_manager', bio: 'Social media e content per hotel e B&B. Strategie e community management.' },
  // pharmacy (3)
  { email: 'jolly25@nomadiqe.seed', full_name: 'Farmacia Centro', username: 'farmaciacentro', jolly_subcategory: 'pharmacy', bio: 'Consegna farmaci e prodotti sanitari per ospiti. Servizio 24h. Milano.' },
  { email: 'jolly26@nomadiqe.seed', full_name: 'Parafarmacia Mare', username: 'parafarmaciamare', jolly_subcategory: 'pharmacy', bio: 'Fornitura prodotti per strutture: cortesia, pronto soccorso. Riviera.' },
  { email: 'jolly27@nomadiqe.seed', full_name: 'Farma Tour', username: 'farmatour', jolly_subcategory: 'pharmacy', bio: 'Servizio consegna farmaci e medicinali per turisti e strutture. Roma.' },
  // excursions (3)
  { email: 'jolly28@nomadiqe.seed', full_name: 'Guida Trekking', username: 'guidatrekking', jolly_subcategory: 'excursions', bio: 'Escursioni guidate e trekking per ospiti. Montagna e collina. Nord Italia.' },
  { email: 'jolly29@nomadiqe.seed', full_name: 'Tour Natura', username: 'tournatura', jolly_subcategory: 'excursions', bio: 'Tour ed esperienze nella natura. Wine tour, cicloturismo. Toscana e Chianti.' },
  { email: 'jolly30@nomadiqe.seed', full_name: 'Sicilia Explore', username: 'siciliaexplore', jolly_subcategory: 'excursions', bio: 'Escursioni culturali e naturalistiche. Etna, borghi, mare. Sicilia.' },
  // boat_excursions (3)
  { email: 'jolly31@nomadiqe.seed', full_name: 'Nautica Costa', username: 'nauticacosta', jolly_subcategory: 'boat_excursions', bio: 'Gite in barca e tour costieri. Snorkeling, grotte. Amalfi e Positano.' },
  { email: 'jolly32@nomadiqe.seed', full_name: 'Vela Lago', username: 'velalago', jolly_subcategory: 'boat_excursions', bio: 'Escursioni in barca sul lago. Vela e motoscafo. Garda e Como.' },
  { email: 'jolly33@nomadiqe.seed', full_name: 'Sail Sardegna', username: 'sailsardegna', jolly_subcategory: 'boat_excursions', bio: 'Crociere e gite in barca. Costa Smeralda e arcipelaghi. Sardegna.' },
  // home_products (3)
  { email: 'jolly34@nomadiqe.seed', full_name: 'Casa & Design', username: 'casadesign', jolly_subcategory: 'home_products', bio: 'Arredamento e complementi per strutture. Stile moderno e design.' },
  { email: 'jolly35@nomadiqe.seed', full_name: 'Prodotti Casa', username: 'prodoticasa', jolly_subcategory: 'home_products', bio: 'Forniture per case vacanza: biancheria, cucina, bagno. Catalogo ampio.' },
  { email: 'jolly36@nomadiqe.seed', full_name: 'Living Strutture', username: 'livingstrutture', jolly_subcategory: 'home_products', bio: 'Arredi e accessori per B&B e appartamenti. Consulenza e consegna.' },
];

function avatarUrl(seed) {
  return `https://picsum.photos/seed/${seed}/400/400`;
}

async function ensureUser(email) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) {
    if (error.message && (error.message.includes('already') || error.message.includes('registered'))) {
      return { skipped: true };
    }
    throw error;
  }
  return { user: data.user };
}

async function main() {
  const allEmails = [...CREATORS.map((c) => c.email), ...JOLLY.map((j) => j.email)];

  console.log('Creazione utenti in Auth...');
  for (const email of allEmails) {
    try {
      const r = await ensureUser(email);
      console.log(r.skipped ? `  ${email} (già esistente)` : `  ${email} creato`);
    } catch (e) {
      console.error(`  ${email} ERRORE:`, e.message);
    }
  }

  // Breve attesa per il trigger che crea il profilo
  await new Promise((r) => setTimeout(r, 500));

  console.log('\nAggiornamento profili Creator...');
  for (let i = 0; i < CREATORS.length; i++) {
    const c = CREATORS[i];
    const seed = `cr${i + 1}`;
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: c.full_name,
        username: c.username,
        role: 'creator',
        avatar_url: avatarUrl(seed),
        profile_cover_images: c.profile_cover_images,
        date_of_birth: c.date_of_birth,
        content_language: c.content_language,
        bio: c.bio,
        creator_category: c.creator_category,
        creator_status: 'approved',
        admin_approved_opportunities: c.admin_approved_opportunities,
        creator_structure_preferences: c.creator_structure_preferences,
        followers_count: c.followers_count,
        social_links: c.social_links,
        onboarding_completed: true,
      })
      .eq('email', c.email);

    if (error) {
      console.error(`  ${c.email}:`, error.message);
      continue;
    }
    console.log(`  ${c.email} ok`);

    const { data: profile } = await supabase.from('profiles').select('id').eq('email', c.email).single();
    if (profile && c.niches && c.niches.length) {
      await supabase.from('creator_niches').delete().eq('user_id', profile.id);
      for (const niche of c.niches) {
        await supabase.from('creator_niches').insert({ user_id: profile.id, niche });
      }
    }
  }

  console.log('\nAggiornamento profili Jolly...');
  for (let i = 0; i < JOLLY.length; i++) {
    const j = JOLLY[i];
    const seed = `jl${i + 1}`;
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: j.full_name,
        username: j.username,
        role: 'jolly',
        jolly_subcategory: j.jolly_subcategory,
        avatar_url: avatarUrl(seed),
        bio: j.bio,
        onboarding_completed: true,
      })
      .eq('email', j.email);

    if (error) console.error(`  ${j.email}:`, error.message);
    else console.log(`  ${j.email} ok`);
  }

  console.log('\nFatto. Verifica in Supabase:');
  console.log("  SELECT email, full_name, role, creator_category, jolly_subcategory FROM profiles WHERE email LIKE '%@nomadiqe.seed' ORDER BY role, email;");
  console.log('\nPassword per tutti: ' + PASSWORD);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
