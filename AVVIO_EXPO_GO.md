# Connessione da iPhone con Expo Go – guida definitiva

## Importante: non usare la Fotocamera del telefono

Il QR che vedi nel terminale contiene un link tipo `exp://192.168.x.x:8081`.  
La **Fotocamera** di iOS **non** apre questi link, quindi vedi "Nessun dato utilizzabile".  
Per collegarti all’app devi usare **solo** l’app **Expo Go** e il suo scanner.

---

## Passi (sempre in questo ordine)

### 1. Sul PC

```powershell
cd "C:\Users\luca\Desktop\repo\Nomadiqe IOS\nomadiqe-ios"
pnpm start --clear
```

Attendi che compaiano il **QR code** e la riga tipo:

```text
› Metro waiting on exp://192.168.1.XX:8081
```

### 2. Sul tuo iPhone

1. Apri l’app **Expo Go** (cercala se non la trovi).
2. Nella **prima schermata** di Expo Go tocca **“Scan QR code”** (o “Scansiona QR code”).
3. Inquadra **solo** il QR code che è **nel terminale** del PC (non uno preso da altro posto).

L’app Nomadiqe si aprirà dentro Expo Go.

### 3. Se lo scan non funziona: inserisci l’URL a mano

1. Nel terminale, sotto il QR, copia l’indirizzo che inizia con `exp://` (es. `exp://192.168.1.50:8081`).
2. Su iPhone, in **Expo Go**, cerca **“Enter URL manually”** / **“Inserisci URL”**.
3. Incolla l’indirizzo e conferma.

### 4. Rete e firewall

- **Stessa Wi‑Fi**: PC e iPhone devono essere sulla **stessa rete** (stesso router).
- **Firewall Windows**: se compare la richiesta di permesso per “Node” o “Metro”, scegli **Rete privata** e **Consenti**.

---

## Riepilogo

| Cosa fare | Cosa non fare |
|-----------|----------------|
| Aprire **Expo Go** e usare **“Scan QR code”** | Usare la **Fotocamera** del telefono |
| Inquadrare il QR **nel terminale** | Inquadrare QR da browser o da altre app |
| PC e iPhone sulla **stessa Wi‑Fi** | Usare dati mobili o Wi‑Fi diverse |

Dopo aver rimosso `expo-dev-client`, il QR nel terminale è pensato per **Expo Go**: basta seguire questi passi e non usare mai la Fotocamera per quel QR.
