# Questo progetto è un progetto Expo

Nel progetto trovi:

- **`app.json`** – configurazione Expo (nome app, SDK, iOS/Android)
- **Cartella `.expo`** – cache e dati usati da Expo in sviluppo
- **`package.json`** – dipendenze che includono `expo`, `expo-status-bar`, ecc.

Per sviluppare in locale **non** serve avere build o “activity” su expo.dev.  
Expo Go si connette al server Metro sul tuo PC e carica l’app da lì.

Quando vorrai creare un’app da installare (es. per TestFlight/App Store), potrai usare **EAS Build** da expo.dev; fino ad allora “No development builds” sulla dashboard è normale.
