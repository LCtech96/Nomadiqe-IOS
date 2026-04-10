# Il sito su Vercel scarica un file invece di aprirsi – come sistemare

Se aprendo **nomadiqe.app** (o il link di Vercel) il browser **scarica un file** invece di mostrare la pagina, Vercel non sta usando la cartella **public** come sito. Segui questi passi.

---

## 1. Impostazioni del progetto su Vercel

1. Vai su **vercel.com** → accedi → apri il progetto **Nomadiqe-IOS** (o come l’hai chiamato).
2. Vai in **Settings** (Impostazioni).
3. Nel menu a sinistra clicca **General** (Generale).
4. Scorri fino a **Build & Development Settings** (Build e sviluppo).
5. Clicca **Override** (o “Modifica”) accanto a queste voci e imposta:

   | Impostazione        | Valore da mettere |
   |---------------------|-------------------|
   | **Root Directory**  | `public`          |
   | **Framework Preset**| `Other`           |
   | **Build Command**   | lascia **vuoto** oppure `echo done` |
   | **Output Directory** | lascia **vuoto** (obbligatorio se Root è `public`) |
   | **Install Command** | lascia com’è (o vuoto) |

6. Salva (**Save**).

**Cosa fa:** con **Root Directory** = `public`, per il deploy Vercel usa solo la cartella **public** del repo. Lì dentro c’è **index.html**, che diventa la pagina principale del sito. Non viene eseguito un build dell’app React Native.

---

## 2. Nuovo deploy

1. Vai nella tab **Deployments** (Deploy).
2. Clicca i **tre puntini** sull’ultimo deploy → **Redeploy** (oppure fai un nuovo deploy da GitHub).
3. Attendi che il deploy finisca.

---

## 3. Controllo

- Apri **https://nomadiqe.app** (o l’URL del progetto su Vercel).
- Dovresti vedere la pagina con il testo “Nomadiqe” e “Se hai cliccato il link di conferma email…” invece che il download di un file.

Se ancora scarica un file, prova ad aprire direttamente **https://nomadiqe.app/index.html**: se quella URL mostra la pagina, il problema è solo la “pagina predefinita” e si risolve con **Root Directory** = `public` e redeploy come sopra.
