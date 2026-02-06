# Struttura del progetto Nomadiqe

## Cartella dentro la cartella

Il progetto è organizzato così:

```
Nomadiqe IOS/          ← cartella principale (questa)
└── nomadiqe-ios/      ← progetto Expo (qui dentro c’è tutto)
    ├── package.json
    ├── app.json
    ├── App.tsx
    ├── src/
    ├── scripts/
    └── ...
```

**Tutti i comandi vanno eseguiti dalla cartella `nomadiqe-ios`**, non dalla cartella principale.

- **Controlla dove sei:** guarda il prompt del terminale.
  - Se vedi `...\Nomadiqe IOS\nomadiqe-ios>` → sei già nella cartella giusta: **non** fare `cd nomadiqe-ios`. Esegui direttamente `pnpm start:lan` (o `pnpm start`).
  - Se vedi `...\Nomadiqe IOS>` (senza `\nomadiqe-ios` alla fine) → entra nel progetto con `cd nomadiqe-ios`, poi `pnpm start:lan`.
- **Riassunto:** esegui `cd nomadiqe-ios` **solo se** il prompt non contiene già `nomadiqe-ios`. Altrimenti va in errore (cartella inesistente `nomadiqe-ios\nomadiqe-ios`).
- **Aprire il progetto in Cursor/VS Code:** apri la cartella `nomadiqe-ios` come workspace (File → Apri cartella → `nomadiqe-ios`), così il terminale parte già nella cartella giusta.

## Expo: progetto locale vs expo.dev

- **Sul tuo PC** il progetto è un progetto Expo: ci sono `app.json`, la cartella `.expo`, e il pacchetto `expo` in `package.json`. Va bene così.
- **Su expo.dev** (sito web) il progetto “Nomadiqe IOS” può mostrare “No builds”, “No activity”: è normale finché usi solo **Expo Go** in sviluppo. I build su Expo si usano quando vuoi creare app da installare (es. con EAS Build). Per sviluppare con Expo Go non serve avere build su expo.dev.

## Firewall (PowerShell)

Esegui **un solo** comando (incollalo una volta sola, senza raddoppiarlo):

```powershell
& "C:\Users\luca\Desktop\repo\Nomadiqe IOS\nomadiqe-ios\scripts\open-firewall.ps1"
```

Prima di questo, in PowerShell **come Amministratore** esegui una sola volta:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

(se chiede conferma, scrivi `S` e Invio)
