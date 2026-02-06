# Nomadiqe iOS - Setup Guide

Guida dettagliata per configurare e avviare l'app Nomadiqe iOS.

## 1. Prerequisiti

### Software Richiesto

- **Node.js**: v18 o superiore
- **pnpm**: v8 o superiore (package manager)
- **Expo CLI**: Per sviluppo React Native
- **Xcode**: (Solo macOS) Per iOS Simulator e build
- **iOS Device o Simulator**: Per testare l'app

### Account Necessari

- **Supabase**: Per database e autenticazione
  - Crea un account su [supabase.com](https://supabase.com)
  - Crea un nuovo progetto
- **Expo**: Per build e deployment
  - Crea un account su [expo.dev](https://expo.dev)

## 2. Installazione

### Clona il Repository

```bash
cd nomadiqe-ios
```

### Installa pnpm (se non installato)

```bash
npm install -g pnpm
```

### Installa Dipendenze

```bash
pnpm install
```

## 3. Configurazione Supabase

### 3.1 Setup Database

1. Vai al tuo progetto Supabase
2. Copia lo schema SQL dalla web app Nomadiqe
3. Esegui lo schema nel SQL Editor di Supabase

Le tabelle principali necessarie:
- `profiles` - Profili utente
- `posts` - Post social
- `post_likes` - Like ai post
- `post_comments` - Commenti
- `properties` - Proprietà host
- `bookings` - Prenotazioni
- `social_accounts` - Account social creator
- `messages` - Messaggi

### 3.2 RLS (Row Level Security)

Assicurati che le policy RLS siano configurate per:
- Permettere agli utenti di leggere profili pubblici
- Permettere agli utenti di modificare solo il proprio profilo
- Gestire permessi per post, proprietà, booking, ecc.

### 3.3 Ottieni Credenziali

1. Vai su Settings → API nel progetto Supabase
2. Copia:
   - **Project URL**: `https://xxx.supabase.co`
   - **Anon/Public Key**: `eyJhbGc...`

## 4. Configurazione Ambiente

### Crea File .env

```bash
cp .env.example .env
```

### Modifica .env

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

## 5. Avvio App

### Development Mode

```bash
# Avvia Metro bundler
pnpm start

# In un nuovo terminale, avvia iOS simulator (macOS only)
pnpm run ios

# Oppure scansiona QR code con Expo Go su dispositivo iOS
```

### Build per Test

```bash
# Install EAS CLI
npm install -g eas-cli

# Login a Expo
eas login

# Configure
eas build:configure

# Build development
eas build --profile development --platform ios
```

## 6. Configurazione iOS Specifica

### Info.plist Permissions

Le seguenti permission sono già configurate in `app.json`:

- **NSCameraUsageDescription**: Per upload foto/video
- **NSPhotoLibraryUsageDescription**: Per accesso galleria
- **NSLocationWhenInUseUsageDescription**: Per mostrare proprietà vicine

### Bundle Identifier

In `app.json`, aggiorna:

```json
{
  "ios": {
    "bundleIdentifier": "com.tuaazienda.nomadiqe"
  }
}
```

## 7. Testing

### Test su iOS Simulator

```bash
pnpm run ios
```

### Test su Device Fisico

1. Installa Expo Go dall'App Store
2. Esegui `pnpm start`
3. Scansiona QR code con Camera
4. Apri con Expo Go

## 8. Features da Testare

- [ ] Login/Signup con email
- [ ] Onboarding e selezione ruolo
- [ ] Navigazione tra tab
- [ ] Feed post (scroll, like, commenti)
- [ ] Mappa esplorazione
- [ ] Profilo utente
- [ ] Dark mode
- [ ] Cambio lingua
- [ ] Haptic feedback

## 9. Troubleshooting

### Metro Bundler non si avvia

```bash
pnpm start --clear
```

### Errori di dipendenze

```bash
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### iOS build fallisce

```bash
cd ios
pod install
cd ..
pnpm run ios
```

### Supabase non si connette

- Verifica le credenziali in `.env`
- Controlla che il progetto Supabase sia attivo
- Verifica le RLS policy

### Errori TypeScript

```bash
pnpm run type-check
```

## 10. Deployment Production

### Prepare for Production

1. Aggiorna versione in `app.json`
2. Verifica tutti i permessi iOS
3. Prepara icone e splash screen

### Build Production

```bash
# Build per App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

## 11. Environment Variables Production

Per production, aggiungi variabili in Expo:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value https://xxx.supabase.co
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value eyJhbGc...
```

## 12. Monitoring e Analytics

### Sentry (Opzionale)

```bash
pnpm add @sentry/react-native
```

### Configure Sentry

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'your-dsn',
  environment: __DEV__ ? 'development' : 'production',
});
```

## Support

Per problemi o domande:
- Consulta la documentazione Expo: [docs.expo.dev](https://docs.expo.dev)
- Consulta la documentazione Supabase: [supabase.com/docs](https://supabase.com/docs)
- Apri un issue nel repository

## Checklist Finale

Prima del rilascio:

- [ ] Tutte le variabili ambiente configurate
- [ ] Database Supabase popolato
- [ ] RLS policy configurate
- [ ] Permessi iOS verificati
- [ ] Testing completo su device fisico
- [ ] Dark mode testato
- [ ] Tutte le lingue verificate
- [ ] Performance ottimizzate
- [ ] Build production testato
- [ ] App Store metadata preparati
