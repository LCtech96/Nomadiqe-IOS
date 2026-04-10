# Primo avvio – React Native / Expo vs Vercel

Se vieni da Vercel (siti o API), con un’app React Native le cose sono un po’ diverse. Questa guida ti porta da zero a “l’app parla con Supabase” senza errori di rete.

---

## Differenza principale: dove gira l’app

| Vercel (sito/API) | React Native / Expo (questa app) |
|-------------------|----------------------------------|
| Il codice gira **sul server** (o nel browser). | Il codice gira **sul telefono** (o nel simulatore). |
| Le env le legge il **build** (Vercel le inietta). | Le env le legge **Expo/Metro** quando avvii l’app; vanno in un file **`.env`** nella cartella del progetto. |
| La “rete” è il server che chiama le API. | La “rete” è il **telefono** che chiama Supabase (e deve avere URL e chiave giusti). |

Se **URL o chiave Supabase mancano o sono sbagliati**, l’app prova a chiamare un indirizzo invalido (o un placeholder) e ottieni **"TypeError: Network request failed"**. Quindi il primo passo è sempre: **configurare le variabili d’ambiente**.

---

## Passo 1: Variabili d’ambiente (obbligatorie)

Senza queste, **nessuna** richiesta a Supabase funziona (login, reset password, ecc.).

### 1.1 Dove trovare URL e chiave

1. Apri **[Supabase](https://supabase.com)** → il tuo progetto Nomadiqe.
2. Menu a sinistra: **Project Settings** (icona ingranaggio).
3. Voce **API**.
4. Copia:
   - **Project URL** (es. `https://xxxxxxxx.supabase.co`) → sarà `EXPO_PUBLIC_SUPABASE_URL`
   - **Project API keys** → **anon** **public** (la chiave lunga che inizia con `eyJ...`) → sarà `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### 1.2 Creare il file `.env`

1. Apri la cartella del progetto in VS Code/Cursor (quella dove vedi `package.json`, `App.tsx`, ecc.).
2. Crea un file nuovo chiamato **esattamente** `.env` (con il punto all’inizio).
3. Incolla queste due righe (sostituisci con i **tuoi** valori copiati da Supabase):

```env
EXPO_PUBLIC_SUPABASE_URL=https://TUO_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. Salva il file.  
   Il file `.env` è già in `.gitignore`: non verrà committato su Git (è giusto così).

### 1.3 Riavviare l’app

Expo legge le variabili quando parte. Dopo aver creato o modificato `.env`:

1. Ferma il server (nel terminale dove gira `pnpm start` o `pnpm start:lan`: `Ctrl+C`).
2. Riavvia con cache pulita:

```powershell
pnpm start --clear
```

3. Riapri l’app su iPhone (di nuovo tramite QR code o “Enter URL manually”).

Dopo questo, le chiamate a Supabase (login, reset password, ecc.) dovrebbero andare al **tuo** progetto e non più dare “Network request failed” per URL/chiave mancanti.

---

## Passo 2: Reset password e email (Resend)

Quando tocchi “Reimposta password” nell’app succede questo:

1. L’**app** chiama **Supabase** (`resetPasswordForEmail`) → questa è la richiesta di rete che prima falliva.
2. **Supabase** deve inviare una **email** con il link per reimpostare la password. Per farlo usa un servizio di invio email (SMTP). Qui entra **Resend** (o un altro provider).

Quindi:

- **“Network request failed”** = di solito l’app non riesce proprio a parlare con Supabase (passo 1: `.env`).
- **“Email non arrivata” / “qualcosa non va con l’email”** = una volta che l’app parla con Supabase, puoi configurare **Resend** (o SMTP) nel **Dashboard di Supabase**, non nell’app.

### Dove si configura l’invio email (Resend)

1. Supabase → **Project Settings** → **Auth**.
2. Sezione **SMTP Settings** (o **Email provider**).
3. Lì potrai inserire le credenziali Resend (o di un altro provider) così Supabase invierà le email di reset password, conferma, ecc.

Per **sbloccare il login** senza aspettare le email puoi usare lo script **`scripts/fix-login.sql`** (conferma email + imposta password) come già spiegato, oppure creare/impostare l’utente dalla Dashboard Supabase.

---

## Riepilogo ordine operazioni

1. **Crea `.env`** con `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` (valori dal Dashboard Supabase).
2. **Riavvia** con `pnpm start --clear` e riapri l’app.
3. Riprova **login** o **reimposta password**: l’errore “Network request failed” dovrebbe sparire.
4. (Opzionale) Configura **Resend** in Supabase → Auth → SMTP per le email di reset/conferma.

Se dopo il passo 2 hai ancora un errore, scrivi il messaggio esatto che vedi (o un altro screenshot) e si può andare nel dettaglio.
