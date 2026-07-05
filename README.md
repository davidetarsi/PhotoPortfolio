# Photo Portfolio

Sito portfolio fotografico statico multipagina. Le foto sono lette da cartelle Google Drive condivise via Drive API v3 — nessun backend, nessun database.

## Avvio rapido

```bash
node --version   # richiede v20+
npm install
npm run dev      # → http://localhost:5173/
npm run build    # output in dist/
```

## Struttura

```
config/          ← contenuti: identità, album, testi
theme/           ← aspetto: design tokens, tipografia
src/pages/       ← entry point JS per ciascuna pagina
src/providers/   ← layer dati (Google Drive + futuri provider)
src/components/  ← componenti UI riusabili
src/styles/      ← CSS strutturale (consuma solo i token)
public/          ← asset statici (favicon, cover locali)
```

## Personalizzare

| Cosa cambiare | Dove |
|---|---|
| Nome, bio, social | `config/site.config.js` |
| Aggiungere/rimuovere un album | `config/albums.config.js` |
| Testi delle pagine | `config/texts.config.js` |
| Colori e font | `theme/tokens.css` |
| Tipografia dettagliata | `theme/typography.css` |

## Decisioni architetturali

- **Storage**: Google Drive (cartelle "chiunque con il link") — non Google Foto (Library API ristretta da marzo 2025).
- **Bundler**: Vite multipagina — entry point registrati in `vite.config.js → rollupOptions.input`.
- **Framework**: nessuno — vanilla JS/HTML/CSS.
- **Provider**: interfaccia astratta in `src/providers/provider.js`; l'implementazione Drive in `src/providers/googleDrive.js` è sostituibile senza modificare le pagine.
- **Deploy target**: Cloudflare Pages (CDN, build automatica, dominio gratuito).

## Roadmap

Vedi [`roadmap-sito-portfolio.md`](roadmap-sito-portfolio.md) per la visione d'insieme e [`piano-implementazione.md`](piano-implementazione.md) per i task dettagliati.
