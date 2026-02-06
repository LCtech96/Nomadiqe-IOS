# Connessione iPhone ↔ PC (Expo Go)

Se vedi **"Could not connect to development server"** o **"Connection lost"**, segui questi passi.

**Importante:** i comandi sotto vanno eseguiti dalla cartella **`nomadiqe-ios`**. Controlla il prompt: se vedi già `...\nomadiqe-ios>` non fare `cd nomadiqe-ios` (andresti in errore). Se sei in `...\Nomadiqe IOS>` (senza nomadiqe-ios), allora fai `cd nomadiqe-ios` prima di `pnpm start:lan`.

## 1. Avvia il server con lo script LAN

Nel terminale (nella cartella del progetto):

```powershell
pnpm start:lan
```

Lo script rileva l’IP della tua rete (es. 172.20.10.2) e avvia Expo con quell’IP. In console vedrai qualcosa tipo:

```
[LAN] Host: 172.20.10.2
[LAN] Sul telefono in Expo Go: "Enter URL manually" -> exp://172.20.10.2:8081
```

## 2. Sul telefono: inserisci l’URL a mano

- Apri **Expo Go** sull’iPhone.
- **Non** usare la fotocamera per il QR.
- Tocca **"Enter URL manually"** (in basso).
- Inserisci l’URL che vedi in console, es.: `exp://172.20.10.2:8081`
- Tocca **Connect**.

## 3. Se ancora non si connette: apri la porta nel Firewall

**Opzione A – Script PowerShell (come Amministratore):**

1. Tasto destro su **Windows PowerShell** → **Esegui come amministratore**.
2. **Primo comando** (solo questo, una volta): conferma con `S` se richiesto.
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   ```
3. **Secondo comando**: incolla **solo questa riga**, **una sola volta** (se incolli due volte va in errore).
   ```powershell
   & "C:\Users\luca\Desktop\repo\Nomadiqe IOS\nomadiqe-ios\scripts\open-firewall.ps1"
   ```
   Modifica il percorso se il progetto è in un’altra cartella.

**Opzione B – Manuale:**

1. Apri **Windows Security** → **Firewall and network protection** → **Advanced settings**.
2. **Inbound Rules** → **New Rule**.
3. **Port** → Next → **TCP**, **Specific local ports**: `8081` → Next.
4. **Allow the connection** → Next.
5. Seleziona **Domain**, **Private**, **Public** → Next.
6. Nome: `Expo Metro 8081` → Finish.

Poi riprova **pnpm start:lan** e di nuovo **Enter URL manually** in Expo Go con l’IP mostrato in console.

## 4. Stessa rete

- PC e iPhone devono essere sulla **stessa rete Wi‑Fi** (o iPhone in hotspot e PC connesso a quell’hotspot).
- Se usi l’hotspot dell’iPhone, l’IP del PC sarà tipo **172.20.10.2**; usa quello nell’URL.

## 5. DevTools “disconnected”

Se sul PC appare **"DevTools is disconnected"**, di solito è perché l’app sul telefono si è chiusa o la connessione è caduta. Puoi ignorare il messaggio e continuare a usare l’app; per il debug riapri il progetto in Expo Go (stesso URL) e, se serve, tocca **Reload** nell’app.
