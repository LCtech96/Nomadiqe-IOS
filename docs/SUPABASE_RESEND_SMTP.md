# Supabase + Resend: email di conferma non arrivano

Se **nessuna email** arriva e in **Resend → Logs** non compare nulla, Supabase non sta usando il tuo SMTP (Resend). In quel caso Supabase usa il server predefinito, che:

- invia **solo agli indirizzi del team** del progetto (es. legrazierestaurant@gmail.com);
- ha un limite di **2 email/ora**.

Quindi le email a `lucacorrao96@outlook.it` (o altri utenti) **non vengono inviate** e Resend non le vede.

---

## Cosa fare (controlli in ordine)

### 1. Progetto Supabase corretto

Assicurati di essere nel progetto **Nomadiqe IOS** (non un altro progetto Supabase). L’URL sarà tipo:

`supabase.com/dashboard/project/sbmginfbpcogjoxrdphi/...`

### 2. SMTP custom attivo e salvato

1. Vai su **Authentication** → nel menu a sinistra, sotto **NOTIFICATIONS** → **Email**.
2. Apri il tab **SMTP Settings** (non solo "Templates").
3. Controlla:
   - **Enable custom SMTP** = **ON** (toggle verde).
   - **Sender email**: `noreply@nomadiqe.app` (o un indirizzo del tuo dominio verificato su Resend).
   - **Sender name**: es. `Nomadiqe`.
   - **Host**: `smtp.resend.com`
   - **Port**: `465`
   - **Username**: `resend`
   - **Password**: la tua **API Key** di Resend (inizia con `re_...`).  
     Se il campo è già mascherato, **incolla di nuovo** la chiave e salva (a volte il salvataggio non va a buon fine).
4. Clicca **Save changes** e attendi il messaggio di conferma.

### 3. Stesso account Resend

Se su Resend vedi l’organizzazione **legrazierestaurant** ma il dominio che usi è **nomadiqe.app**, l’API key che metti in Supabase deve essere dell’**stesso account Resend** dove hai verificato `nomadiqe.app`. Se usi due account diversi, i log li vedi solo nell’account della chiave usata da Supabase.

### 4. Nuova registrazione di prova

Dopo aver salvato l’SMTP:

1. Fai una **nuova registrazione** con un’email tua (anche una diversa da prima).
2. Controlla **Resend → Logs** (o **Emails**): dovrebbe comparire una richiesta di invio.
3. Controlla la casella (e spam) dell’indirizzo usato per la registrazione.

Se dopo il salvataggio i log Resend restano vuoti, Supabase non sta ancora usando Resend: ripassa il punto 2 e, se serve, contatta il supporto Supabase con progetto e data/ora del test.

---

## Ancora niente email? Controlli mirati

L’app Nomadiqe IOS usa **solo** questo progetto Supabase:

- **URL progetto:** `https://sbmginfbpcogjoxrdphi.supabase.co`

Se in dashboard l’URL è diverso (es. un altro `project/xxxxx`), stai configurando un altro progetto: le registrazioni dall’app non useranno quel SMTP.

### A) Toggle "Enable custom SMTP"

In cima alla pagina **Authentication → Email → SMTP Settings** deve esserci il toggle **"Enable custom SMTP"**. Deve essere **attivo (verde)**. Se è spento, Supabase ignora tutti i campi SMTP e non invia tramite Resend.

### B) Sender email address

Oltre al "Sender name" deve essere compilato il campo **"Sender email address"** (o "Sender email"), es. `noreply@nomadiqe.app`. Se manca, l’invio può fallire.

### C) Porta 587 al posto di 465

Alcune reti bloccano la porta 465. Prova a cambiare **Port number** da `465` a **`587`**, salva e riprova una registrazione.

### D) Nuova API Key Resend

Su Resend → **API Keys** crea una **nuova** chiave, copiala e incollala nel campo **Password** delle SMTP Settings di Supabase, poi **Save changes**. Riprova una registrazione. (Serve a escludere una chiave revocata o sbagliata.)

### E) Log Auth Supabase (fondamentale)

Supabase consiglia di controllare i **Auth logs** per vedere se l’invio fallisce prima di arrivare a Resend:

1. Dashboard Supabase → nel menu a sinistra cerca **Logs** (sotto la sezione principale, non sotto Authentication).
2. Apri **Logs** → **Auth Logs** (oppure vai direttamente a `.../project/sbmginfbpcogjoxrdphi/logs/auth-logs`).
3. Fai **una nuova registrazione** dall’app e subito dopo aggiorna/visualizza gli Auth Logs.
4. Cerca righe con errore (rosso) o messaggi tipo: `send email`, `smtp`, `failed`, `error`, `email not authorized`.

Se vedi **"Email address not authorized"** significa che Supabase sta ancora usando il server predefinito (solo email del team). In quel caso il custom SMTP non è attivo: ricontrolla il toggle "Enable custom SMTP" e salva di nuovo.

Se vedi un errore di **connessione SMTP** o **autenticazione**, il problema è host/porta/username/password (es. API key errata o revocata).

### F) Test invio dalla dashboard Supabase

Per verificare che l’SMTP funzioni senza passare dall’app:

1. **Authentication** → **Users**.
2. Clicca sui tre puntini (⋮) accanto a un utente esistente oppure **Invite user**.
3. Scegli **Invite user by email** (o **Send magic link**) e inserisci un’email tua.
4. Invia e controlla **Resend → Logs**: se compare una richiesta, l’SMTP è attivo e il problema è solo nel flusso di signup; se non compare nulla, l’SMTP non viene usato neanche da qui.

### G) URL Configuration

In **Authentication** → **URL Configuration** verifica che **Site URL** sia impostato (es. `https://nomadiqe.app` o un URL temporaneo). In alcuni casi gli invii email dipendono da questo valore.

---

## Riepilogo credenziali Resend (SMTP)

| Campo Supabase | Valore |
|----------------|--------|
| Sender email | `noreply@nomadiqe.app` |
| Sender name | `Nomadiqe` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | API Key Resend (`re_...`) |
