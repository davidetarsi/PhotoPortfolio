# Guida alla personalizzazione

Questo boilerplate è progettato per essere riutilizzato su contesti diversi: portfolio fotografici, siti per strutture ricettive, gallerie d'artista. Qui trovi le istruzioni per ogni tipo di modifica.

---

## Identità (`config/site.config.js`)

| Campo | Descrizione | Esempio |
|---|---|---|
| `name` | Nome visualizzato in nav, footer, `<title>` e anteprime social | `'Mario Rossi Fotografia'` |
| `bio` | Testo nella sezione hero, meta description e anteprime social | `'Fotografo di matrimoni a Milano.'` |
| `heroImageUrl` | Immagine hero e immagine delle anteprime social — usa il formato Drive diretto | `'https://lh3.googleusercontent.com/d/FILE_ID'` |
| `social.instagram` | Link Instagram (rimuovere il commento per attivarlo) | `'https://instagram.com/mariorossi'` |
| `language` | Lingua del sito (usata per `<html lang="">`) | `'it'` |

`driveApiKey` e `web3formsAccessKey` vengono letti da `.env` — non modificarli qui.

### Anteprime social (Open Graph)

Titolo, descrizione e immagine delle anteprime (WhatsApp, Instagram DM, LinkedIn, iMessage…) vengono iniettati nell'HTML **a build time** dai valori qui sopra: non serve toccare i file HTML. Due limiti da conoscere:

- `heroImageUrl` deve essere un URL assoluto (`https://…`), altrimenti i crawler social ignorano l'immagine. Se è vuoto, l'anteprima esce senza immagine.
- Qualsiasi link del sito venga condiviso — inclusi i link ai singoli album — mostra sempre l'anteprima generica del sito. I crawler social non eseguono JavaScript, quindi non possono conoscere il contenuto dell'album dietro `album.html?album=<slug>`. È un limite dell'hosting statico puro, accettato per scelta.

---

## Album (`config/albums.config.js`)

Ogni elemento dell'array `albums` corrisponde a una voce nella landing e a una pagina album accessibile via `album.html?album=<slug>`.

| Campo | Descrizione | Esempio |
|---|---|---|
| `slug` | Identificatore URL — solo lettere minuscole e trattini | `'matrimoni-2024'` |
| `title` | Titolo della card e della pagina album | `'Matrimoni 2024'` |
| `description` | Testo sotto il titolo nella card | `'Reportage emozionali.'` |
| `driveFolderId` | ID cartella Google Drive — dalla URL `drive.google.com/drive/folders/<ID>` | `'1AbCdEfGhIjKlMnOpQrStUv'` |
| `cover` | URL immagine di copertina — usa il formato Drive diretto | `'https://lh3.googleusercontent.com/d/FILE_ID'` |

Per **aggiungere** un album: aggiungere un oggetto all'array `albums`.
Per **rimuovere** un album: eliminare l'oggetto dall'array.
Per **riordinare** gli album: riordinare gli oggetti nell'array.

> **Il concetto "album" si adatta al dominio.** La struttura è la stessa — una cartella Drive con una copertina — ma il significato dipende dal contesto:
> - Fotografo: `{ slug: 'matrimoni', title: 'Matrimoni', ... }`
> - Casa vacanze a Roma: `{ slug: 'camere', title: 'Le nostre camere', ... }`, `{ slug: 'salone', title: 'Spazi comuni', ... }`, `{ slug: 'esterni', title: 'Esterni e terrazza', ... }`
> - Artista visivo: `{ slug: 'acquerelli-2024', title: 'Acquerelli 2024', ... }`
>
> Il frontend non sa nulla del dominio — mostra titolo, descrizione e foto. Solo `config/albums.config.js` cambia.

---

## Testi UI (`config/texts.config.js`)

| Campo | Descrizione |
|---|---|
| `landing.heroSubtitle` | Sottotitolo sotto il nome nella landing |
| `landing.albumsSectionHeading` | Titolo della sezione album nella landing |
| `contatti.heading` | Titolo della pagina contatti |
| `contatti.body` | Testo descrittivo sopra il form |
| `contatti.form.namePlaceholder` | Placeholder campo nome |
| `contatti.form.emailPlaceholder` | Placeholder campo email |
| `contatti.form.messagePlaceholder` | Placeholder campo messaggio |
| `contatti.form.submitLabel` | Testo del bottone di invio |
| `contatti.form.successMessage` | Messaggio mostrato dopo invio riuscito |
| `contatti.form.errorMessage` | Messaggio mostrato in caso di errore |
| `nav.homeLabel` | Etichetta link home in navigazione |
| `nav.contattiLabel` | Etichetta link contatti in navigazione |
| `footer.copyright` | Testo copyright nel footer (anno calcolato automaticamente) |

Testi aggiuntivi della pagina album (opzionali):

| Campo | Descrizione |
|---|---|
| `album.loading` | Testo mostrato mentre le foto si caricano |
| `album.empty` | Testo mostrato se la cartella Drive è vuota |
| `album.notFound` | Testo mostrato se lo slug non corrisponde a nessun album |
| `album.notFoundLink` | Testo del link "torna alla home" nella pagina not found |

I messaggi di errore Drive (`album.error.*`) sono tecnici — modificarli solo se vuoi testi personalizzati per cartella non pubblica, errori di rete, ecc.

---

## Colori e spaziature (`theme/tokens.css`)

Tutti i valori CSS sono custom properties — cambiarli qui si propaga automaticamente a tutto il sito.

| Token | Descrizione |
|---|---|
| `--color-bg` | Sfondo principale |
| `--color-text` | Testo principale |
| `--color-accent` | Colore accento (link, bordi attivi) |
| `--color-muted` | Testo secondario / sottotitoli |
| `--color-surface` | Sfondo card e superfici rialzate |
| `--font-body` | Nome font per il body (deve corrispondere a quello caricato) |
| `--font-heading` | Nome font per i titoli |
| `--font-mono` | Nome font monospazio |
| `--space-xs/sm/md/lg/xl` | Scala spaziature (0.25 / 0.5 / 1 / 2 / 4 rem) |

---

## Font (`theme/typography.css` + HTML)

Cambiare font richiede **tre passi** — dimenticarne uno causa font fallback silenzioso:

1. In `theme/tokens.css`: aggiorna `--font-body` e/o `--font-heading` con il nome del nuovo font
2. In **tutti e tre** gli HTML (`index.html`, `album.html`, `contatti.html`): sostituisci il tag `<link>` Google Fonts con l'URL del nuovo font
3. In `theme/typography.css`: aggiorna i `font-weight` se il nuovo font ha pesi diversi

Font attuale (tema Cinematic): **Fraunces** (heading) + **Sora** (body, weight 300) + **IBM Plex Mono** (mono).

---

## Compressione foto

Prima di caricare le foto su Google Drive, usa lo script di compressione locale per ridurre il peso e convertire in WebP:

```bash
# Struttura attesa:
# /percorso/cartella/originali/   ← foto originali (JPEG, PNG, HEIC, TIFF, WebP)
# /percorso/cartella/optimized/   ← generato dallo script → da caricare su Drive

npm run compress -- --input /percorso/cartella
```

Lo script genera WebP a 1900px (lato lungo) con qualità 85. La cartella `optimized/` viene svuotata e rigenerata ad ogni run. Caricare su Drive solo `optimized/`.

---

## Deploy su Cloudflare Workers

### Primo deploy

1. GitHub → nuovo repo privato da questo template
2. Cloudflare dashboard → Workers & Pages → Create → **Import a repository**
3. Seleziona il repo, imposta:
   - Build command: `npm test && npm run build`
   - Deploy command: `npx wrangler deploy` (la directory `dist` è già configurata in `wrangler.jsonc`)
4. Build variables:
   - `VITE_DRIVE_API_KEY` = la tua API key Google Drive
   - `VITE_WEB3FORMS_ACCESS_KEY` = la tua access key Web3Forms
   - `NODE_VERSION` = `22`
5. Deploy — il sito esce su `https://<nome-progetto>.<tuo-subdominio>.workers.dev`; ogni push su main rideploya in automatico (se i test falliscono, il deploy si blocca)

### Whitelist domini (obbligatorio)

**Google Cloud Console** → APIs & Services → Credentials → la tua API key → HTTP referrers:
- `http://localhost:5173/*`
- `https://<nome-progetto>.<tuo-subdominio>.workers.dev/*`
- `https://*.<tuo-subdominio>.workers.dev/*` (preview deployments)

**Web3Forms** → Dashboard → Access Keys → Allowed Domains:
- `localhost`
- `<nome-progetto>.<tuo-subdominio>.workers.dev`

Senza queste whitelist: 403 in locale e form non funzionante in produzione.
