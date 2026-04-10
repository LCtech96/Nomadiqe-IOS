# Nomadiqe.app su Vercel – link conferma email

Repo GitHub: **https://github.com/LCtech96/Nomadiqe-IOS**

---

## Cosa cliccare su Vercel al primo deploy

Quando Vercel chiede **"Framework Preset"** o **"Application Preset"** (il menu con React, Next.js, Astro, ecc.):

- **Non** scegliere React, Create React App, Next.js, ecc.
- Scegli **"Other"**.

Il progetto è un’app **React Native (Expo)** per mobile; su Vercel stai pubblicando solo la **pagina di redirect** (cartella `public`), non l’app. Con **"Other"** Vercel userà il file **vercel.json** del repo, che indica di usare la cartella **public** come sito. Con "React" o "Next" Vercel tenterebbe un build sbagliato.

Dopo aver scelto **Other**, clicca **Deploy**.

---

Se **nomadiqe.app** è hostato su **Vercel**, hai due possibilità.

---

## Caso 1: nomadiqe.app è questo stesso progetto (repo Nomadiqe IOS)

Se su Vercel hai collegato il dominio **nomadiqe.app** a **questo** repository:

1. Nel progetto è già presente **vercel.json** che dice a Vercel di usare la cartella **public** per il sito.
2. Fai **commit** di **vercel.json** e della cartella **public** (con **index.html** dentro), poi **push** su GitHub (o dove è collegato Vercel).
3. Vercel farà un nuovo deploy: la pagina principale di nomadiqe.app sarà **public/index.html**, che reindirige all’app quando nell’URL c’è il link di conferma (con `#access_token=...`).

Non serve fare altro: dopo il deploy, chi clicca “Conferma la tua email” arriverà su nomadiqe.app e, se ha l’app installata, verrà reindirizzato all’app.

**Nota:** Se oggi nomadiqe.app mostra già un altro sito (es. una landing o l’app web Expo), con questo **vercel.json** il sito diventerà solo questa pagina di redirect. Se vuoi tenere l’altro sito e aggiungere il redirect, usa il **Caso 2** (aggiungi lo script nella pagina che usi già).

---

## Caso 2: nomadiqe.app è un altro progetto Vercel (sito separato)

Se nomadiqe.app è un **altro** progetto su Vercel (per esempio un sito landing o altro):

1. Apri **quel** progetto (non Nomadiqe IOS).
2. Assicurati che la **pagina principale** (quella che si apre andando su `https://nomadiqe.app`) contenga questo script dentro `<head>`:

```html
<script>
  (function() {
    var hash = window.location.hash;
    if (hash && hash.indexOf('access_token=') !== -1) {
      window.location.replace('nomadiqe://auth/callback' + hash);
    }
  })();
</script>
```

3. Salva, fai deploy su Vercel.

Così anche dal tuo altro sito, quando qualcuno arriva con il link di conferma (URL con `#access_token=...`), viene reindirizzato all’app Nomadiqe.

---

## Verifica

Dopo il deploy, da telefono:

1. Apri un link tipo:  
   `https://nomadiqe.app/#access_token=test&refresh_token=test`  
   (va bene anche un link di conferma vero).
2. Se tutto è a posto, la pagina reindirizza e il telefono chiede di aprire l’app Nomadiqe (o l’app si apre da sola se già installata).

Se nomadiqe.app è questo repo, basta che **vercel.json** e **public/index.html** siano in repo e che Vercel faccia un nuovo deploy dopo il push.
