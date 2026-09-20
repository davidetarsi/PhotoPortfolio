# Guida alla personalizzazione

Questo template gestisce tre ambiti diversi di personalizzazione: **contenuto**, **aspetto** e **infrastruttura**. Qui trovi dove modificare ogni cosa.

---

## La distinzione che spiega tutto

### Contenuto — Vive su R2, si cambia dalla dashboard

Nome del fotografo, bio, hero image, album, foto: tutto questo **a runtime** la verità è su R2 e si modifica dalla **dashboard admin** `/admin`. I file in `config/site.config.js` e `config/albums.config.js` sono solo il **seed iniziale**, usati una volta da `npm run migrate` per popolare R2 al primo giro.

**Attenzione:** rilanciare `npm run migrate` dopo aver usato la dashboard riporta nome, bio, hero e album ai valori del seed, **cancellando il lavoro fatto dalla dashboard**. Il comando ora si rifiuta di farlo senza `--force`, ma è importante capire perché.

### Aspetto e testi d'interfaccia — Vivono nei file

Colori, font, spaziature, testi UI (form, messaggi errore): questi cambiano nei file `theme/` e `config/texts.config.js`. Valgono sia per il sito che per la dashboard, che importa gli stessi token. Ogni modifica ai file richiede un rebuild e un deploy.

### Infrastruttura — Configurazione Cloudflare

Bucket, domini, applicazioni Access: questa configurazione vive in `infra/variables.tf` (se usi Terraform) e `wrangler.json`. Non ha a che fare con il contenuto o l'aspetto — una volta configurata, non la tocchi quasi mai.

---

## Voglio cambiare X, tocco Y

| Voglio cambiare | Dove | Note |
|---|---|---|
| **Nome, bio, link social** | Dashboard `/admin` sezione "Sito" — oppure `config/site.config.js` prima di `npm run migrate` | La dashboard è il posto normale dopo il primo setup. `config/` è solo il seed. |
| **Foto hero della home** | Dashboard sezione "Sito", selettore hero | Sempre senza rilanciare migrate |
| **Aggiungere un album** | Dashboard `/admin`, oppure `config/albums.config.js` + `npm run migrate` | Come per il nome: dashboard dopo il primo setup, `config/` solo per il seed. |
| **Riordinare album** | Dashboard (trascinamento), oppure `config/albums.config.js` + `npm run migrate` | |
| **Aggiungere/eliminare foto in un album** | Dashboard `/admin`, vista album | Sempre tramite dashboard |
| **Colori del sito** | `theme/tokens.css`, variabili `--color-*` | Richiede `npm test && npm run build` e deploy |
| **Font** | `theme/tokens.css` (`--font-body`, `--font-heading`) + `theme/typography.css` + `<link>` Google Fonts negli HTML | Tre file, tre passi — ometterne uno causa un fallback silenzioso. Vedi sezione Font qui sotto. |
| **Spaziature, raggi bordi** | `theme/tokens.css`, variabili `--space-*` e `--radius-*` | Richiede rebuild e deploy |
| **Testi UI** (form, messaggi errore, nav) | `config/texts.config.js` | Richiede rebuild e deploy. I testi con valori variabili usano segnaposto `{nome}`: si traducono senza scrivere JavaScript |
| **Testi della dashboard admin** | `config/texts.config.js`, sezione `admin` | Stesso meccanismo: la dashboard è traducibile quanto il sito |
| **Lingua delle date** | `config/site.config.js`, campo `language` | Usato per formattare le date nella dashboard |
| **Aspetto delle card degli album** | `theme/card.css`: attiva una delle tre `@import` | `cinematic` (default), `editoriale`, `minimal`. Vedi la sezione qui sotto |
| **Sfondo dashboard admin** | `config/admin.config.js`, campo `backgroundImageUrl` | URL di una foto già caricata su R2 |
| **Chi può accedere a `/admin`** | `infra/variables.tf`, campo `admin_emails` (Terraform) oppure dashboard Access per path `/admin` e `/api/admin` (manuale) | Richiede Terraform apply oppure modifica manuale in Access. Vedi [runbook](docs/runbook-cloudflare.md). |
| **Dominio delle foto** | `infra/variables.tf`, `custom_photo_domain` (Terraform), oppure dashboard R2 (manuale) | Vedi [runbook sezione 8](docs/runbook-cloudflare.md#8-dominio-custom-per-le-foto). Da fare una sola volta prima di andare in produzione. |
| **Intestazioni di sicurezza / CSP** | — Non si tocca — | Si genera da `wrangler.json` durante la build. Vedi il plugin CSP in `vite.config.js`. |

---

## Le tre varianti di card

Le card degli album hanno tre aspetti già pronti, derivati dai mockup in `mockups/`:

- **`cinematic`** (default, da `mockup-1-cinematic.html`) — card 4:5, immagine a pieno riquadro, titolo e descrizione sopra un gradiente in basso, zoom lieve allo hover, angoli arrotondati.
- **`editoriale`** (da `mockup-3-editoriale.html`) — impianto da rivista: immagine e testo affiancati, titolo in maiuscolo, filetto di separazione fra un album e l'altro, nessun arrotondamento. Sotto i 600px passa a colonna singola.
- **`minimal`** (da `mockup-4-minimal.html`) — nessun riquadro e nessuno sfondo: l'immagine conserva le sue proporzioni naturali e il testo sta sotto, centrato, con molta aria.

Si sceglie in `theme/card.css`, lasciando attiva una sola riga `@import` e commentando le altre. Il dev server ricarica da solo.

Le tre differiscono **solo per CSS**, sullo stesso HTML: `AlbumCard.js` non contiene alcuna condizione. Sono tre file indipendenti in `src/styles/card-variants/` — se una non ti convince, modificala o cancellala senza toccare nient'altro.

## Font: tre passi per non sbagliare

Cambiare font richiede **tre modifiche coordinate** — dimenticarne una causa font fallback silenzioso:

1. **`theme/tokens.css`:** aggiorna `--font-body` e/o `--font-heading` con il nome del nuovo font

```css
/* Prima */
--font-body: 'Sora', sans-serif;
--font-heading: 'Fraunces', serif;

/* Dopo: per esempio, Poppins per body, Playfair Display per heading */
--font-body: 'Poppins', sans-serif;
--font-heading: 'Playfair Display', serif;
```

2. **In tutti e quattro gli HTML** (`index.html`, `album.html`, `contatti.html`, `admin.html`): sostituisci il tag `<link>` Google Fonts.
   Dimenticare `admin.html` e' l'errore piu' facile: il sito cambia font e la dashboard resta indietro.

```html
<!-- Prima -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@300&family=Fraunces:wght@400&family=IBM+Plex+Mono:wght@400&display=swap">

<!-- Dopo: includi solo i font che usi, con i pesi che usi -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400&family=Playfair+Display:wght@600&family=IBM+Plex+Mono:wght@400&display=swap">
```

3. **`theme/typography.css`:** se il nuovo font ha pesi diversi, aggiorna gli `font-weight` nelle regole CSS

```css
/* Se il nuovo font ha pesi non standard */
body {
  font-family: var(--font-body);
  font-weight: 400;  /* Cambia qui se necessario */
}

h1, h2, h3 {
  font-family: var(--font-heading);
  font-weight: 600;  /* Cambia qui se il font non ha 400 di default */
}
```

---

## Cosa non va toccato per personalizzare

### Comportamento (`src/`)

I file in `src/` sono il comportamento dell'applicazione: se li modifichi, avrai conflitti ai futuri merge dal template. Tieni le personalizzazioni in `config/` e `theme/`, che sono i soli punti di estensione designati.

Eccezione: se vuoi correggere un bug o aggiungere una feature al template stesso, fallo pure in `src/`, ma contribuiscilo di nuovo al repository da cui hai forkato — così il prossimo fork della tua copia lo avrà già.

### `wrangler.json`

Il template lo distribuisce coi segnaposto; tu ci metti i tuoi valori, **e lo committi**. Non è una svista: il deploy di Cloudflare legge la configurazione del Worker dal repository, quindi un `wrangler.json` che resta sul tuo computer significa un deploy che fallisce.

I valori che contiene non sono segreti — nomi di bucket, team domain, AUD e URL pubblico del bucket sono tutti già visibili dall'esterno. Le vere credenziali stanno in `.env`, che non è versionato.

Due conseguenze pratiche: andrà in conflitto a ogni `git merge upstream/main` (risolvi con `git checkout --ours wrangler.json`), e `npm run infra:sync` lo riscrive daccapo dagli output di Terraform, quindi eventuali modifiche a mano vanno rifatte o riportate nel `.tf`.

---

## Dopo ogni modifica ai file

Ogni volta che modifichi `config/` o `theme/`:

```bash
npm test && npm run build
git add config/ theme/
git commit -m "personalizzazione: descrivi cosa hai cambiato"
git push
```

Il deploy parte in automatico via Cloudflare Git integration. Le modifiche sono online in pochi minuti, senza intervento manuale.

Le modifiche fatte dalla dashboard (`/admin`) sono già online e non richiedono alcun deploy — sono solo dati su R2.

---

## Asset statici

### Favicon

Modifica il file in `public/favicon.svg` e rideploya.

### Compressione foto

Prima di caricare foto sulla dashboard, comprimile localmente per ridurre il peso e convertirle in WebP:

```bash
npm run compress -- --input "/percorso/cartella"
```

Struttura attesa:

```
/percorso/cartella/
  originali/        ← foto originali (JPEG, PNG, HEIC, TIFF, WebP)
  optimized/        ← generato dallo script → da caricare via dashboard
```

Lo script genera WebP a 1900px (lato lungo) con qualità 85. La cartella `optimized/` viene svuotata e rigenerata a ogni run.

---

## Anteprime social (Open Graph)

Titolo, descrizione e immagine delle anteprime (WhatsApp, Instagram DM, LinkedIn, iMessage…) vengono iniettati nell'HTML **a build time** da `site.config.js`, con l'URL dell'immagine costruito dal dominio delle foto dichiarato in `wrangler.json`: non serve toccare i file HTML.

Due limiti da conoscere:

- Qualsiasi link del sito venga condiviso — inclusi i link ai singoli album — mostra sempre l'anteprima generica del sito (titolo e hero image di `site.config.js`). I crawler social non eseguono JavaScript, quindi non possono conoscere il contenuto dell'album. È un limite dell'hosting statico puro, accettato per scelta.
- Se `heroImage` è vuoto, l'anteprima esce senza immagine.

---

## Riferimento veloce `config/`

### `site.config.js` (seed della home)

| Campo | Descrizione | Esempio |
|---|---|---|
| `name` | Nome fotografo | `'Mario Rossi Fotografia'` |
| `bio` | Testo hero e meta description | `'Fotografo di matrimoni a Milano.'` |
| `heroImage` | Foto hero — referenziale (album + nome file, non URL) | `{ album: 'matrimoni', name: 'hero.webp' }` |
| `social` | Link social | `{ instagram: 'https://instagram.com/...' }` |

### `albums.config.js` (seed degli album)

| Campo | Descrizione | Esempio |
|---|---|---|
| `slug` | Identificatore URL | `'matrimoni-2024'` |
| `title` | Titolo card e pagina | `'Matrimoni 2024'` |
| `description` | Testo sotto titolo | `'Reportage emozionali.'` |
| `coverName` | Nome file copertina — il nome del file dentro l'album, non un URL | `'copertina.webp'` |

### `texts.config.js` (testi UI)

Modifica i messaggi di caricamento, errore, form, nav, footer. Tutti i testi della pagina album (loading, error, not found) sono qui — non in HTML.

### `admin.config.js` (stile dashboard)

| Campo | Descrizione |
|---|---|
| `backgroundImageUrl` | URL di una foto già su R2, usata come sfondo della dashboard. Vuoto = nessuno sfondo |

---

## Infrastruttura — Una sola volta

Se usi **Terraform**: modifica `infra/variables.tf` e rilancia `terraform apply`. Vedi il [runbook sezione 3](docs/runbook-cloudflare.md#3-percorso-terraform).

Se usi il **percorso manuale**: segui il [runbook sezione 5](docs/runbook-cloudflare.md#5-percorso-manuale--creare-le-risorse-da-cloudflare-dashboard) per creare bucket R2, domini gestiti e applicazioni Access dalla dashboard Cloudflare.

In entrambi i casi, la CSP si genera automaticamente da `wrangler.json` durante la build.
