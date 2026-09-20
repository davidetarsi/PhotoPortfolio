# Photo Portfolio — Boilerplate

Sito portfolio fotografico multipagina servito da un Worker Cloudflare. Le foto stanno su un bucket R2 e si caricano da una dashboard protetta da Cloudflare Access. Personalizza `config/` e `theme/`, poi deploya su Cloudflare Workers.

## Come partire, e come restare aggiornati

**Fai un fork**, non usare "Use this template". Il fork conserva la storia git, e solo così potrai ricevere le migliorie future con un merge. "Use this template" crea un repo senza antenati comuni: comodo il primo giorno, definitivo per sempre.

Dopo il fork:

```bash
git clone git@github.com:TUO-UTENTE/TUO-REPO.git
cd TUO-REPO
git remote add upstream git@github.com:davidetarsi/PhotoPortfolioTemplate.git
cp wrangler.example.json wrangler.json   # poi compila i tuoi valori
npm install
```

Per ricevere gli aggiornamenti, quando vuoi:

```bash
git fetch upstream
git merge upstream/main
```

I conflitti, se ci sono, cadranno su `config/` e `theme/` — cioè su ciò che hai personalizzato tu. Tieni le tue modifiche dentro quelle cartelle e gli aggiornamenti resteranno indolori. `wrangler.json` non è versionato proprio per questo motivo.

> Preferisci un repo privato e slegato dal fork? Allora `git clone` di questo repo, poi ripunta `origin` sul tuo e aggiungi `upstream` come sopra: il risultato per gli aggiornamenti è identico.

## Infrastruttura

L'infrastruttura Cloudflare — bucket R2, domini pubblici, applicazioni Access — è descritta in [`infra/`](infra/) con Terraform. Da lì si genera `wrangler.json`:

```bash
export CLOUDFLARE_API_TOKEN=...        # mai scriverlo in un file
cd infra && cp terraform.tfvars.example terraform.tfvars   # poi compila
terraform init && terraform apply
terraform -chdir=. output -json > outputs.json
npm run infra:sync
```

Preferisci configurare a mano dalla dashboard? Va bene: segui il [runbook](docs/runbook-cloudflare.md), che porta allo stesso risultato. In entrambi i casi la CSP si genera da `wrangler.json` durante la build.

---

> ⚠️ **Le istruzioni di setup qui sotto sono superate.** Descrivono l'architettura Google Drive, sostituita da R2 + Worker + dashboard admin. Vanno riscritte insieme a `CUSTOMIZING.md`: non seguirle alla lettera per ora.

## Quick start

```bash
node --version   # richiede v20+
npm install
cp .env.example .env  # compila VITE_DRIVE_API_KEY e VITE_WEB3FORMS_ACCESS_KEY
npm run dev      # → http://localhost:5173/
npm run build    # output in dist/
npm test         # 86 test
```

## Setup checklist — per ogni nuovo portfolio

1. **Crea la cartella Google Drive** — condividi con "chiunque con il link può visualizzare"
2. **Google Cloud Console** → abilita Drive API v3 → crea API key → imposta restrizione HTTP referrer con tre voci:
   - `http://localhost:5173/*` (sviluppo locale)
   - `https://nome-progetto.tuo-subdominio.workers.dev/*` (produzione — il dominio esatto lo vedi dopo il primo deploy)
   - `https://*.tuo-subdominio.workers.dev/*` (preview deployments)
3. **Web3Forms** → crea account su web3forms.com → copia l'access key → in Dashboard → Access Keys aggiungi in "Allowed Domains": `localhost` (sviluppo locale) e il dominio Cloudflare (es. `nome-progetto.tuo-subdominio.workers.dev`)
4. **Variabili d'ambiente locali** → `cp .env.example .env` → compila `VITE_DRIVE_API_KEY` e `VITE_WEB3FORMS_ACCESS_KEY`
5. **Identità** → `config/site.config.js` → compila `name`, `bio`, `heroImageUrl`, `social`
6. **Album** → `config/albums.config.js` → per ogni album: `driveFolderId` (ID cartella Drive), `cover` (URL copertina), `slug`, `title`, `description`
7. *(Opzionale)* **Testi UI** → `config/texts.config.js` → subtitle landing, testi form, messaggi errore
8. *(Opzionale)* **Tema visivo** → `theme/tokens.css` per colori e variabili font → `theme/typography.css` per scala tipografica → aggiorna i `<link>` Google Fonts in `index.html`, `album.html`, `contatti.html` se cambi font
9. **Deploy Cloudflare Workers** → Workers & Pages → Create → Import a repository → seleziona il repo GitHub → imposta:
   - Build command: `npm test && npm run build`
   - Deploy command: `npx wrangler deploy` (la directory `dist` è già configurata in `wrangler.jsonc`)
   - Build variables: `VITE_DRIVE_API_KEY`, `VITE_WEB3FORMS_ACCESS_KEY`, `NODE_VERSION=22`
   - Dopo il primo deploy, aggiorna le whitelist GCP e Web3Forms (punti 2 e 3) con il dominio `workers.dev` assegnato

## Mappa dei file

| Cosa cambiare | File |
|---|---|
| Nome, bio, hero image, social | `config/site.config.js` |
| Aggiungere/rimuovere un album | `config/albums.config.js` |
| Testi UI (form, messaggi errore) | `config/texts.config.js` |
| Colori, spaziature, variabili font | `theme/tokens.css` |
| Scala tipografica e font Google | `theme/typography.css` + `<link>` nei tre HTML |

## Struttura progetto

```
config/          ← contenuti: identità, album, testi
theme/           ← aspetto: design tokens, tipografia
src/pages/       ← entry point JS per ciascuna pagina
src/providers/   ← layer dati (Google Drive + futuri provider)
src/components/  ← componenti UI riusabili
src/styles/      ← CSS strutturale (consuma solo i token)
public/          ← asset statici (favicon, _headers CF)
scripts/         ← strumenti di sviluppo (compress.js)
```

## Architettura

- **Storage:** Google Drive (non Google Foto — Library API ristretta da marzo 2025)
- **Bundler:** Vite 8.x multipagina — entry point in `vite.config.js → rollupOptions.input`
- **Meta tag / Open Graph:** iniettati a build time da `site.config.js` (plugin `site-meta` in `vite.config.js`) — i crawler social non eseguono JS, quindi i tag devono stare nell'HTML statico; i link ai singoli album condividono l'anteprima generica del sito
- **Framework:** nessuno — vanilla JS/HTML/CSS
- **Provider:** interfaccia astratta in `src/providers/provider.js`; `googleDrive.js` è sostituibile senza modificare le pagine
- **Deploy:** Cloudflare Workers (static assets, config in `wrangler.jsonc`) — CDN, build automatica su ogni push via Workers Builds, dominio gratuito `*.workers.dev`
- **Compressione foto:** `npm run compress -- --input <percorso>` (Sharp, WebP 1900px q85)

## GitHub Template

Per usare questo repo come template: GitHub → Settings → spunta "Template repository". Per ogni nuovo portfolio: "Use this template" → nuovo repo privato.
