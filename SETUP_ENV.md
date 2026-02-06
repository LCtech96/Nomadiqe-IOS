# Setup variabili ambiente – Supabase

## Cosa mettere nell’app (solo pubblico)

Crea un file **`.env`** nella root del progetto (`nomadiqe-ios`) con **solo** queste due righe:

```
EXPO_PUBLIC_SUPABASE_URL=https://sbmginfbpcogjoxrdphi.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_2Qc6GRxrznSLoOdoETw4Dg_HJsemxDU
```

- **Nell’app** vanno solo URL e chiave **anon** (publishable).  
- **Non** mettere mai nell’app: connection string PostgreSQL, `sb_secret_*`, chiavi lunghe tipo `wMAoA...`, o password DB.

## Come creare `.env`

1. Nella cartella `nomadiqe-ios` crea un file chiamato `.env`.
2. Incolla le due righe sopra (senza spazi strani).
3. Salva. Il file è già in `.gitignore`, non verrà committato.

Se Supabase ti dà una **anon key** che inizia con `eyJ...` (JWT), usa quella al posto di `sb_publishable_...` in `EXPO_PUBLIC_SUPABASE_ANON_KEY`. La trovi in: Supabase → Project Settings → API → Project API keys → **anon public**.

## Cosa tenere segreto (mai nel repo / nell’app)

- `postgresql://postgres....` (connection string)
- `sb_secret_*`
- Qualsiasi chiave lunga (es. encryption key)
- Password del database

Usali solo in backend, EAS Secrets, o strumenti tipo Supabase Dashboard, mai nel codice o in un file committato.

## Dopo aver creato `.env`

Riavvia il server:

```powershell
pnpm start --clear
```

Poi connetti da iPhone con Expo Go (Scan QR code dall’app Expo Go).
