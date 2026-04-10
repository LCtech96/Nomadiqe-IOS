# Errore "Root Directory public does not exist" – come risolvere

Vercel non trova la cartella **public** perché sul repository GitHub (LCtech96/Nomadiqe-IOS) non è ancora stata caricata.

## Cosa fare

Devi **inviare (push)** la cartella **public** e il file **vercel.json** su GitHub.

### Passi (dal computer, nella cartella del progetto)

1. Apri il **terminale** (in Cursor: Terminal → New Terminal, oppure PowerShell / CMD nella cartella del progetto).

2. Controlla che ci siano i file da caricare:
   ```
   git status
   ```
   Dovresti vedere `public/` e `vercel.json` (o "Untracked files").

3. Aggiungi i file:
   ```
   git add public vercel.json
   ```

4. Crea un commit:
   ```
   git commit -m "Aggiunta cartella public e vercel.json per Vercel"
   ```

5. Invia su GitHub:
   ```
   git push origin main
   ```
   (Se il branch si chiama diversamente, usa quel nome al posto di `main`.)

6. Su **Vercel**: vai in **Deployments** e clicca **Redeploy** sull’ultimo deploy (oppure aspetta il deploy automatico dopo il push).

Dopo il push, la cartella **public** sarà su GitHub e Vercel la troverà. L’impostazione **Root Directory** = `public` funzionerà e il build andrà a buon fine.
