# Conferma email – guida semplice

## Chiariamo

- **Expo Go** = app sul telefono per provare Nomadiqe. **Non** è un sito internet.
- **nomadiqe.app** = indirizzo di un sito. Quando l’utente clicca “Conferma la tua email” nell’email, il telefono apre il **browser** (Chrome, Safari) e va su nomadiqe.app.  
  Quello che si vede lì dipende da **dove è hostato** il sito nomadiqe.app (Vercel, Netlify, altro), non da Expo Go.

---

## Cosa puoi fare (due strade)

### Opzione A – Non fare nulla (la più semplice)

Anche se la pagina che si apre (nomadiqe.app) è vuota:

1. L’utente **clicca** il link nell’email (“Confirm your mail”).
2. Si apre il browser su nomadiqe.app (anche a schermo bianco).
3. **Solo il fatto di aver cliccato** conferma l’account su Supabase.
4. L’utente **apre l’app Nomadiqe** (da Expo Go o dall’icona).
5. Va su **Accedi** e inserisce **email e password**.
6. Il login funziona perché l’account è già confermato.

Quindi: **non devi fare nulla** con Expo Go o con un sito. L’utente dopo aver cliccato il link deve solo aprire l’app e fare login.

---

### Opzione B – Far aprire l’app quando si clicca il link

Se vuoi che, cliccando il link nell’email, si apra **direttamente l’app** (senza dover fare login a mano):

- Serve una **pagina web** pubblicata su **nomadiqe.app** (il file `public/index.html` del progetto).
- Per pubblicarla ti serve un **hosting** (un posto dove mettere il sito), per esempio:
  - **Vercel** o **Netlify** (gratis): crei un account, colleghi il dominio nomadiqe.app e carichi la cartella `public` (o solo il file `index.html` come pagina principale).

Se non hai mai usato Vercel/Netlify, l’**Opzione A** è sufficiente: gli utenti cliccano il link (anche su pagina bianca), poi aprono l’app e fanno login.
