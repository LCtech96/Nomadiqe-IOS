# Redirect conferma email → app Nomadiqe

Dopo aver cliccato "Confirm your mail" nell’email, Supabase reindirizza a **Site URL** (es. `https://nomadiqe.app/`) con i token nell’hash: `#access_token=...&refresh_token=...`.

## Cosa fa l’app

- L’app ascolta il deep link **`nomadiqe://auth/callback#...`**.
- Quando riceve questo URL (all’avvio o da notifica), estrae `access_token` e `refresh_token`, chiama `supabase.auth.setSession()` e l’utente risulta loggato.

## Cosa serve sul sito nomadiqe.app

Per non mostrare una pagina vuota e far aprire l’app quando l’utente clicca il link di conferma:

1. **Pubblica la root del sito** usando i file in `public/`:
   - **`index.html`** deve essere servito alla root `https://nomadiqe.app/`.
   - Contiene uno script che, se nell’URL c’è `#access_token=...`, reindirizza a `nomadiqe://auth/callback#...` così il dispositivo apre l’app (se installata).

2. **Se il tuo hosting usa una sola pagina** (es. Vercel/Netlify con SPA):
   - Configura il server in modo che **tutte** le richieste alla root (o a `/`) restituiscano un HTML che includa lo stesso script di redirect (come in `public/index.html`), così anche `https://nomadiqe.app/#access_token=...` funziona.

3. **Redirect URL in Supabase**  
   In **Authentication → URL Configuration** devono essere presenti:
   - **Site URL:** `https://nomadiqe.app/`
   - **Redirect URLs:** `https://nomadiqe.app/**` e `nomadiqe://**`

## Flusso completo

1. Utente si registra → riceve email "Confirm your mail".
2. Clicca il link → arriva su `https://nomadiqe.app/#access_token=...&refresh_token=...`.
3. `index.html` fa `window.location.replace('nomadiqe://auth/callback' + hash)`.
4. Il dispositivo apre l’app Nomadiqe con quell’URL.
5. L’app (AuthContext) legge i token, chiama `setSession`, e l’utente è loggato.

## Nota sul “codice di verifica”

Supabase non invia un codice a 6 cifre da inserire nell’app: la **verifica è il click sul link**. Una volta che il link viene aperto e l’app riceve i token tramite deep link, l’account è confermato e la sessione viene impostata; non serve un altro passo “inserisci codice”.
