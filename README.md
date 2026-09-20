# Photo Portfolio — Boilerplate

Sito portfolio fotografico multipagina servito da un Worker Cloudflare. Le foto stanno su un bucket R2 e si caricano da una dashboard protetta da Cloudflare Access. Personalizza `config/` e `theme/`, poi deploya su Cloudflare Workers.

## Come partire, e come restare aggiornati

**Fai un fork**, non usare "Use this template". Il fork conserva la storia git, e solo così potrai ricevere le migliorie future con un merge. "Use this template" crea un repo senza antenati comuni: comodo il primo giorno, definitivo per sempre.

Dopo il fork:

```bash
git clone git@github.com:TUO-UTENTE/TUO-REPO.git
cd TUO-REPO
git remote add upstream git@github.com:davidetarsi/PhotoPortfolioTemplate.git
npm install
# poi apri wrangler.json e sostituisci i segnaposti coi tuoi valori, e committalo:
# il deploy di Cloudflare legge quel file dal repository, quindi deve starci dentro.
```

Per ricevere gli aggiornamenti, quando vuoi:

```bash
git fetch upstream
git merge upstream/main
```

I conflitti, se ci sono, cadranno su `config/` e `theme/` — cioè su ciò che hai personalizzato tu. Tieni le tue modifiche dentro quelle cartelle e gli aggiornamenti resteranno indolori. `wrangler.json` non è versionato proprio per questo motivo.

> Preferisci un repo privato e slegato dal fork? Allora `git clone` di questo repo, poi ripunta `origin` sul tuo e aggiungi `upstream` come sopra: il risultato per gli aggiornamenti è identico.

## Quick start

```bash
node --version   # richiede v20+
npm install
cp .env.example .env
# Compila .env: VITE_R2_PUBLIC_URL, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, VITE_WEB3FORMS_ACCESS_KEY
npm run dev      # → http://localhost:5173/
ALLOW_PLACEHOLDER_CSP=1 npm run build  # test con valori segnaposto
npm test         # 288 test
```

Per il primo deploy su Cloudflare, compila `wrangler.json` con i tuoi valori veri (non segnaposti).

## Setup di un nuovo portfolio

### 1. Infrastruttura Cloudflare

Crea il bucket R2 e le applicazioni Access. Due percorsi equivalenti:

- **Automatico con Terraform** (consigliato): segui `infra/` e il runbook sezione 3 — crea tutto in un comando.
- **Manuale dalla dashboard**: segui il [runbook](docs/runbook-cloudflare.md) sezione 5 — ricorda che `staging_hostname` non si conosce prima del primo deploy (vedi runbook sezione 4).

In entrambi i casi, la CSP si genera automaticamente da `wrangler.json` durante la build.

### 2. Configurazione di `wrangler.json`

Copila i segnaposti:

```json
{
  "name": "il-tuo-portfolio",
  "main": "src/worker.js",
  "r2_buckets": [
    { "binding": "BUCKET", "bucket_name": "il-tuo-bucket" }
  ],
  "vars": {
    "ACCESS_TEAM_DOMAIN": "il-tuo-team.cloudflareaccess.com",
    "ACCESS_AUD": "aud-della-tua-Access-app",
    "R2_PUBLIC_URL": "https://pub-xxxxxxxx.r2.dev"
  }
}
```

A mano o con `npm run infra:sync` se usi Terraform.

### 3. Variabili d'ambiente locali

Compila `.env` con le credenziali R2 (per `npm run migrate` e `npm run upload`):

```bash
VITE_R2_PUBLIC_URL="https://pub-xxxxxxxx.r2.dev"  # copia da wrangler.json vars.R2_PUBLIC_URL
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="il-tuo-bucket"
VITE_WEB3FORMS_ACCESS_KEY="..."  # da web3forms.com
```

Queste credenziali non vanno in git — `.env` è ignorato, mentre le variabili Cloudflare vanno in `wrangler.json` che è versionato.

### 4. Seed iniziale

Compila i file di configurazione che formano il seed del sito:

- **`config/site.config.js`**: nome, bio, social, hero
- **`config/albums.config.js`**: album coi slugg e nomi delle copertine
- **`config/texts.config.js`** (opzionale): testi UI
- **`config/admin.config.js`** (opzionale): stile della dashboard
- **`theme/tokens.css`**: colori e variabili font
- **`theme/typography.css`**: scale tipografiche e link Google Fonts

Poi:

```bash
npm run migrate
```

`migrate` è un comando di bootstrap una volta sola: trasforma il seed nei JSON su R2. **Rilanciarlo dopo aver usato la dashboard riporta tutto al seed, cancellando il lavoro fatto da lì.** La guardia in Task 1 ti avverte e richiede `--force` se insisti.

### 5. Git integration

Collega il repository a Cloudflare Workers & Pages (vedi [runbook](docs/runbook-cloudflare.md) sezione 6):

- Build command: `npm test && npm run build`
- Build output directory: `dist`
- Production branch: `main`
- Staging branch: `staging` (opzionale ma consigliato)

Cloudflare crea due Worker che si deployano automaticamente a ogni push.

## Come si usa il sito una volta online

La dashboard `/admin` è il posto dove personalizzare il sito mentre è live:

- **Sezione Sito**: modifica nome, bio, hero, link social
- **Sezione Album**: aggiungi album, modificane il titolo e descrizione
- **Vista album**: carica foto, riordinale, eliminale

I file in `config/` sono solo il seed iniziale — dopo `migrate`, la verità è R2. Modifiche dalla dashboard sono subito online, senza deploy.

## Personalizzazione

Leggi [`CUSTOMIZING.md`](CUSTOMIZING.md) per sapere:

- Dove toccare per ogni tipo di modifica (tabella interattiva)
- La distinzione tra contenuto (R2 + dashboard) e aspetto/interfaccia (file)
- Cosa non toccare per evitare conflitti ai futuri merge dal template

## Struttura del progetto

```
config/          ← seed iniziale: identità, album, testi, stile admin
theme/           ← aspetto: design tokens CSS, tipografia, Google Fonts
src/pages/       ← entry point JS per ciascuna pagina
src/components/  ← componenti UI riusabili
src/styles/      ← CSS strutturale (importa solo i token)
src/utils/       ← funzioni pure e utilità
src/worker.js    ← Cloudflare Worker
infra/           ← configurazione Terraform (opzionale)
scripts/         ← strumenti: migrate, upload, compress
docs/            ← documentazione: runbook, specifiche
public/          ← asset statici (favicon, _headers)
```

## Architettura

- **Hosting:** Cloudflare Workers (static assets + API per `/admin`)
- **Storage foto:** Cloudflare R2 (bucket pubblico via r2.dev o dominio custom)
- **Autenticazione admin:** Cloudflare Access (Zero Trust) con JWT
- **Bundler:** Vite 8.x multipagina — entry point in `vite.config.js`
- **CSP (Content Security Policy):** generata da `wrangler.json` durante la build
- **Meta tag OpenGraph:** iniettati a build time da `site.config.js`
- **Framework:** vanilla JS/HTML/CSS (nessun runtime framework)
- **Compressione foto:** `npm run compress -- --input <percorso>` (Sharp, WebP 1900px q85)
