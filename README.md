# Photo Portfolio — Boilerplate

Sito portfolio fotografico statico multipagina. Le foto vengono lette da cartelle Google Drive condivise via Drive API v3 — nessun backend, nessun database. Personalizza `config/` e `theme/`, poi deploya su Cloudflare Pages.

## Quick start

```bash
node --version   # richiede v20+
npm install
npm run dev      # → http://localhost:5173/
npm run build    # output in dist/
npm test         # 86 test
```

## Setup checklist — per ogni nuovo portfolio

1. **Crea la cartella Google Drive** — condividi con "chiunque con il link può visualizzare"
2. **Google Cloud Console** → abilita Drive API v3 → crea API key → imposta restrizione HTTP referrer con tre voci:
   - `http://localhost:5173/*` (sviluppo locale)
   - `https://nome.pages.dev/*` (produzione — sostituisci `nome` con il nome del tuo progetto CF)
   - `https://*.nome.pages.dev/*` (preview deployments)
3. **Web3Forms** → crea account su web3forms.com → copia l'access key → in Dashboard → Access Keys aggiungi in "Allowed Domains": `localhost` (sviluppo locale) e il dominio Cloudflare Pages (es. `nome.pages.dev`)
4. **Variabili d'ambiente locali** → `cp .env.example .env` → compila `VITE_DRIVE_API_KEY` e `VITE_WEB3FORMS_ACCESS_KEY`
5. **Identità** → `config/site.config.js` → compila `name`, `bio`, `heroImageUrl`, `social`
6. **Album** → `config/albums.config.js` → per ogni album: `driveFolderId` (ID cartella Drive), `cover` (URL copertina), `slug`, `title`, `description`
7. *(Opzionale)* **Testi UI** → `config/texts.config.js` → subtitle landing, testi form, messaggi errore
8. *(Opzionale)* **Tema visivo** → `theme/tokens.css` per colori e variabili font → `theme/typography.css` per scala tipografica → aggiorna i `<link>` Google Fonts in `index.html`, `album.html`, `contatti.html` se cambi font
9. **Deploy Cloudflare Pages** → nuovo progetto → collega il repo GitHub → imposta:
   - Build command: `npm test && npm run build`
   - Build output directory: `dist`
   - Env vars (produzione **e** preview): `VITE_DRIVE_API_KEY`, `VITE_WEB3FORMS_ACCESS_KEY`, `NODE_VERSION=22`
   - Verifica che `localhost` e `*.pages.dev` siano già presenti nelle whitelist GCP e Web3Forms configurate ai punti 2 e 3

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
- **Framework:** nessuno — vanilla JS/HTML/CSS
- **Provider:** interfaccia astratta in `src/providers/provider.js`; `googleDrive.js` è sostituibile senza modificare le pagine
- **Deploy:** Cloudflare Pages — CDN, build automatica, dominio gratuito `*.pages.dev`
- **Compressione foto:** `npm run compress -- --input <percorso>` (Sharp, WebP 1900px q85)

## GitHub Template

Per usare questo repo come template: GitHub → Settings → spunta "Template repository". Per ogni nuovo portfolio: "Use this template" → nuovo repo privato.
