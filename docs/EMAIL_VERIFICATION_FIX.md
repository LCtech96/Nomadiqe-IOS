# Email di conferma non arrivano dopo la registrazione

Se dopo la registrazione **non ricevi l'email di verifica**, Supabase sta usando il server email predefinito, che:

- invia **solo agli indirizzi del team** del progetto Supabase (limite 2 email/ora);
- **non invia** a indirizzi esterni (es. Gmail, Outlook).

## Soluzione: attivare SMTP custom (Resend)

1. **Vai in Supabase** → tuo progetto → **Authentication** → menu sinistro **Email** (sotto NOTIFICATIONS).
2. Apri il tab **SMTP Settings**.
3. Attiva **Enable custom SMTP** (toggle ON).
4. Compila con le credenziali Resend (vedi **SUPABASE_RESEND_SMTP.md** per i dettagli):
   - Sender email: `noreply@nomadiqe.app` (o un indirizzo del dominio verificato su Resend)
   - Host: `smtp.resend.com`
   - Port: `465` (o `587` se 465 non funziona)
   - Username: `resend`
   - Password: **API Key** di Resend (inizia con `re_...`)
5. Clicca **Save changes**.

Dopo il salvataggio, le nuove registrazioni riceveranno l'email. Controlla anche la cartella **spam**.

## In app: "Invia di nuovo l'email"

Se l'email non è arrivata, dalla schermata **Verifica email** (dopo la registrazione) puoi usare il pulsante **"Invia di nuovo l'email"** per ricevere un nuovo link. Funziona solo se l'SMTP custom è attivo in Supabase.

## Riepilogo

| Problema | Cosa fare |
|---------|-----------|
| Nessuna email dopo la registrazione | Configura SMTP custom in Supabase (vedi sopra e SUPABASE_RESEND_SMTP.md) |
| Email in spam | Controlla la cartella spam; aggiungi noreply@nomadiqe.app ai contatti |
| Link nell'email non apre l'app | Clicca il link (anche da browser), poi apri l'app e fai **Accedi** (vedi CONFERMA_EMAIL_SEMPLICE.md) |
