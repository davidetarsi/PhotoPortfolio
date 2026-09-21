<div align="center">

# 📷 Photo Portfolio

**Un portfolio fotografico che si aggiorna da solo: carichi le foto da una dashboard, e sono online.**

Niente database. Nessun server da mantenere. Zero euro al mese.

[![Licenza: MIT](https://img.shields.io/badge/Licenza-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-20%2B-brightgreen.svg)](https://nodejs.org)
[![Gira su](https://img.shields.io/badge/gira%20su-Cloudflare%20Workers-f38020.svg)](https://workers.cloudflare.com/)
[![Costo mensile](https://img.shields.io/badge/costo%20mensile-%E2%82%AC0-success.svg)](#-cosa-serve)

[🇬🇧 English](README.md) · **🇮🇹 Italiano**

🔗 **Demo dal vivo:** *(in arrivo)*

</div>

<!-- TODO: sostituire con uno screenshot reale della home, es. docs/screenshot-home.png
     Un portfolio fotografico si giudica guardandolo: questa immagine vale piu'
     di tutto il testo che segue.
![Il sito](docs/screenshot-home.png)
-->

---

## 🗂️ Indice

- [🤔 Perché esiste](#-perché-esiste)
- [✨ Cosa fa](#-cosa-fa)
- [📸 Screenshot](#-screenshot)
- [🧰 Cosa serve](#-cosa-serve)
- [🚀 Come partire, e come restare aggiornati](#-come-partire-e-come-restare-aggiornati)
- [⚡ Avvio rapido](#-avvio-rapido)
- [⚙️ Allestire un nuovo portfolio](#-allestire-un-nuovo-portfolio)
- [🖼️ Come si usa il sito una volta online](#-come-si-usa-il-sito-una-volta-online)
- [🎨 Personalizzazione](#-personalizzazione)
- [🏗️ Struttura del progetto](#-struttura-del-progetto)
- [🧱 Architettura](#-architettura)
- [🤝 Contribuire](#-contribuire)
- [⭐ Se ti è stato utile](#-se-ti-è-stato-utile)
- [🔮 Sviluppi futuri](#-sviluppi-futuri)
- [⚖️ Licenza](#-licenza)

> 📘 Le guide tecniche — [`CUSTOMIZING.md`](CUSTOMIZING.md) e il [runbook](docs/runbook-cloudflare.md) — sono **solo in inglese**. Tenerle in due lingue significherebbe aggiornarle due volte, e prima o poi lasciarne indietro una.

---

## 🤔 Perché esiste

I portfolio per fotografi finiscono quasi sempre in uno di due posti: un abbonamento mensile a una piattaforma che decide come deve apparire il tuo lavoro, oppure un sito statico che ti obbliga a ricompilare e ridistribuire ogni volta che aggiungi una foto.

Questo template sta nel mezzo. Il sito è statico e velocissimo, ma le foto vivono su un bucket **Cloudflare R2** e si caricano da una **dashboard protetta da login**: le aggiungi, le riordini, scegli la copertina, e il sito cambia subito — senza toccare il codice, senza fare un deploy.

È pensato per **fotografi che sanno programmare**, o per chi allestisce il sito a un amico che fotografa: il primo setup chiede di saper usare git e la console di Cloudflare, tutto il resto no.

## ✨ Cosa fa

- **Pagine** — home con gli album, pagina album con griglia e lightbox, contatti con form funzionante.
- **Dashboard `/admin`** — carica foto (compresse nel browser prima dell'invio), riordina per trascinamento o per data, scegli la copertina, crea ed elimina album, modifica nome, bio e social.
- **Accesso protetto** da Cloudflare Access — si entra con un codice via email, e nessuna password vive nel codice.
- **Tre aspetti già pronti** per le card degli album, si cambiano con una riga.
- **Tutto personalizzabile dai file di configurazione** — colori, font, spaziature e testi, compresi quelli della dashboard.
- **Infrastruttura descritta in Terraform**, oppure creabile a mano seguendo il runbook.
- **Intestazioni di sicurezza generate automaticamente**, allineate al tuo dominio senza che tu le scriva.

## 📸 Screenshot

*(in arrivo — home, vista album e dashboard di caricamento)*

## 🧰 Cosa serve

| | |
|---|---|
| ☁️ **Account Cloudflare** | il piano gratuito basta |
| 🟢 **Node.js 20+** | |
| 🌐 **Un dominio** | facoltativo — altrimenti funziona su un sottodominio `workers.dev` gratuito |

Costo ricorrente: **zero**, salvo il dominio se scegli di averne uno.

## 🚀 Come partire, e come restare aggiornati

**Fai un fork**, non usare "Use this template". Il fork conserva la storia git, e solo così potrai ricevere le migliorie future con un merge. "Use this template" crea un repo senza antenati comuni: comodo il primo giorno, definitivo per sempre.

Dopo il fork:

```bash
git clone git@github.com:TUO-UTENTE/TUO-REPO.git
cd TUO-REPO
git remote add upstream git@github.com:davidetarsi/PhotoPortfolioTemplate.git
npm install
# poi apri wrangler.json, sostituisci i segnaposto coi tuoi valori, e committalo:
# il deploy di Cloudflare legge quel file dal repository, quindi deve starci dentro.
```

Per ricevere gli aggiornamenti, quando vuoi:

```bash
git fetch upstream
git merge upstream/main
```

I conflitti, se ci sono, cadranno su `config/`, `theme/` e `wrangler.json` — cioè su ciò che hai personalizzato tu. Tieni le tue modifiche dentro quei file e gli aggiornamenti resteranno indolori.

`wrangler.json` in particolare andrà in conflitto quasi sempre, perché il template lo distribuisce coi segnaposto e tu ci hai messo i tuoi valori: risolvi tenendo la tua versione, con `git checkout --ours wrangler.json`.

> 💡 Preferisci un repo privato e slegato dal fork? Allora `git clone` di questo repo, poi ripunta `origin` sul tuo e aggiungi `upstream` come sopra: il risultato per gli aggiornamenti è identico.

## ⚡ Avvio rapido

```bash
node --version   # richiede v20+
npm install
cp .env.example .env
# Compila .env: VITE_R2_PUBLIC_URL, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
npm run dev      # → http://localhost:5173/
ALLOW_PLACEHOLDER_CSP=1 npm run build  # prova di build con i valori segnaposto
npm test         # la suite completa
```

Per il primo deploy su Cloudflare, compila `wrangler.json` con i tuoi valori veri (non i segnaposto).

## ⚙️ Allestire un nuovo portfolio

### 1. Infrastruttura Cloudflare

Crea il bucket R2 e le applicazioni Access. Due percorsi equivalenti:

- **Automatico, con Terraform** (consigliato): segui `infra/` e la sezione 3 del runbook — crea tutto in un comando.
- **Manuale, dalla dashboard**: segui il [runbook](docs/runbook-cloudflare.md) sezione 5 — ricorda che `staging_hostname` non si conosce prima del primo deploy (vedi runbook sezione 4).

In entrambi i casi, la CSP si genera automaticamente da `wrangler.json` durante la build.

### 2. Configurazione di `wrangler.json`

Compila i segnaposto:

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

A mano, o con `npm run infra:sync` se usi Terraform.

### 3. Variabili d'ambiente locali

Compila `.env` con le credenziali R2 (servono a `npm run migrate` e `npm run upload`):

```bash
VITE_R2_PUBLIC_URL="https://pub-xxxxxxxx.r2.dev"  # copia da wrangler.json vars.R2_PUBLIC_URL
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="il-tuo-bucket"
```

Queste credenziali non vanno in git — `.env` è ignorato, mentre le variabili Cloudflare stanno in `wrangler.json`, che è versionato.

### 4. Seed iniziale

Compila i file di configurazione che formano il seed del sito:

- **`config/site.config.js`** — nome, bio, social, hero
- **`config/albums.config.js`** — album, con slug, titolo, descrizione e nome del file di copertina
- **`config/texts.config.js`** *(facoltativo)* — testi dell'interfaccia
- **`config/admin.config.js`** *(facoltativo)* — stile della dashboard
- **`theme/tokens.css`** — colori e variabili dei font
- **`theme/typography.css`** — scala tipografica e link Google Fonts

Poi:

```bash
npm run migrate
```

> ⚠️ `migrate` è un comando di bootstrap, una volta sola: trasforma il seed nei JSON su R2. **Rilanciarlo dopo aver usato la dashboard riporta tutto al seed, cancellando il lavoro fatto da lì.** Il comando se ne accorge, si ferma spiegando cosa perderesti, e richiede `--force` se insisti.

### 5. Git integration

Collega il repository a Cloudflare Workers & Pages (vedi [runbook](docs/runbook-cloudflare.md) sezione 6):

- Build command: `npm test && npm run build`
- Build output directory: `dist`
- Branch di produzione: `main`
- Branch di staging: `staging` *(facoltativo ma consigliato)*

Cloudflare crea due Worker che si deployano da soli a ogni push.

## 🖼️ Come si usa il sito una volta online

La dashboard `/admin` è il posto dove dai forma al sito mentre è in funzione:

- **Sezione Sito** — modifica nome, bio, hero, link social
- **Sezione Album** — aggiungi album, modificane titolo e descrizione
- **Vista album** — carica foto, riordinale, eliminale

I file in `config/` sono solo il seed iniziale — dopo `migrate`, la verità è R2. Le modifiche fatte dalla dashboard sono online subito, senza deploy.

## 🎨 Personalizzazione

Leggi [`CUSTOMIZING.md`](CUSTOMIZING.md) *(in inglese)* per sapere:

- Dove mettere le mani per ogni tipo di modifica
- La distinzione tra contenuto (R2 + dashboard) e aspetto/testi (file)
- Cosa non toccare, per evitare conflitti ai futuri merge dal template

## 🏗️ Struttura del progetto

```
config/          ← seed iniziale: identità, album, testi, stile admin
theme/           ← aspetto: design token CSS, tipografia, Google Fonts
src/pages/       ← entry point JS per ciascuna pagina
src/components/  ← componenti UI riusabili
src/styles/      ← CSS strutturale (importa solo i token)
src/utils/       ← funzioni pure e utilità
src/worker.js    ← Cloudflare Worker
infra/           ← configurazione Terraform (facoltativa)
scripts/         ← strumenti: migrate, upload, compress
docs/            ← documentazione: runbook, specifiche
public/          ← asset statici (favicon). `_headers` non sta qui: si genera in dist/
```

## 🧱 Architettura

| Strato | Tecnologia |
|---|---|
| **Hosting** | Cloudflare Workers (asset statici + API per `/admin`) |
| **Storage foto** | Cloudflare R2 (bucket pubblico via r2.dev o dominio custom) |
| **Autenticazione admin** | Cloudflare Access (Zero Trust) con JWT |
| **Bundler** | Vite 8.x multipagina — entry point in `vite.config.js` |
| **Intestazioni di sicurezza** | generate da `wrangler.json` a build time |
| **Meta tag OpenGraph** | iniettati a build time da `site.config.js` |
| **Framework** | vanilla JS/HTML/CSS — nessun framework a runtime |
| **Compressione foto** | `npm run compress -- --input <percorso>` (Sharp, WebP 1900px q85) |

## 🤝 Contribuire

Segnalazioni e pull request sono benvenute. Se hai costruito qualcosa con questo template, aprire una issue solo per dirlo è davvero utile: mi dice quali parti la gente usa per davvero.

Se correggi qualcosa in `src/`, valuta di riportarlo a monte — così chi forkerà dopo di te se lo ritrova già fatto, e tu non dovrai riapplicarlo a ogni merge.

**Come contribuire:** Vedi [`CONTRIBUTING.md`](CONTRIBUTING.md) per le convenzioni su commenti nel codice, messaggi di commit e il flusso di contribuzione.

## ⭐ Se ti è stato utile

Questo template è gratis, e resta gratis. Non c'è nulla da pagare e nulla da sbloccare.

Quello che serve davvero, e non ti costa niente:

- **Metti una stella al repository** — è l'unico segnale che mi dice che qualcuno l'ha trovato utile.
- **Apri una segnalazione quando qualcosa si rompe.** Soprattutto durante il setup: se ti sei bloccato in un punto, ci si bloccherà anche il prossimo, e preferisco correggere le istruzioni piuttosto che lasciarlo succedere due volte.
- **Raccontami cosa ci hai costruito.** Una issue, un link, due righe. Sapere quali parti la gente usa davvero è ciò che decide cosa migliorare dopo.

Se hai corretto qualcosa nel tuo fork, valuta di aprire una pull request: chi arriva dopo se la ritrova già fatta, e tu smetti di riapplicarla a ogni aggiornamento.

## 🔮 Sviluppi futuri

Dove andrà probabilmente. Sono intenzioni, non promesse:

- **Anteprima prima di pubblicare.** Oggi caricare, riordinare ed eliminare foto ha effetto immediato. L'idea è farle restare in bozza, guardabili prima che vadano online — come già funziona per nome e bio.
- **Anteprime social per singolo album.** Oggi ogni link condiviso mostra la stessa immagine di anteprima del sito, perché l'hosting statico non sa generarne una per album. Si può risolvere, ma serve che sia il Worker a comporre i meta tag.
- **Un tema chiaro già pronto.** Ora che ogni colore vive in `theme/tokens.css`, aggiungere una seconda palette è soprattutto questione di scegliere buoni valori.
- **Altre varianti di card**, se le tre incluse non coprono quello che serve.

Hai un'idea diversa? Apri una segnalazione — questo elenco lo decide chi lo usa.

## ⚖️ Licenza

[MIT](LICENSE) — usalo, modificalo, ridistribuiscilo, anche per lavoro. L'unica cosa da conservare è la nota di copyright.

Non sei tenuto a pubblicare il codice del tuo sito, e non lo sarai mai. È una scelta deliberata: un portfolio personale è tuo.
