# Davide Tarsi — PhotoPortfolio

Questo repository alimenta il sito personale di Davide Tarsi.

Il progetto ha due aree distinte:

- **Software** — l'area professionale pianificata per progetti, competenze e codice.
- **Photography** — un portfolio autonomo per fotografia sportiva, di viaggio e altri
  lavori fotografici.

## Fotografia e repository upstream

L'area Photography deriva da [PhotoPortfolioTemplate](https://github.com/davidetarsi/PhotoPortfolioTemplate)
e viene sincronizzata periodicamente. Il template contiene l'implementazione generica
della galleria, del dashboard e del deploy; questo repository mantiene invece il
contenuto e le decisioni specifiche del sito personale.

Le istruzioni generiche di installazione e personalizzazione sono mantenute nel
[repository upstream](https://github.com/davidetarsi/PhotoPortfolioTemplate), in
particolare nel suo `README.md`, `CUSTOMIZING.md` e nella documentazione del runbook.
Qui non vengono ripetuti valori specifici di deploy né segreti.

## Sviluppo locale

Richiede Node.js 20 o superiore. I comandi principali sono:

```bash
npm ci
npm run dev
npm test
npm run build
```

La configurazione Cloudflare, gli identificativi degli ambienti e i secret restano
fuori da questo README e vanno gestiti secondo la procedura di sincronizzazione.

## Documentazione del sito personale

- [Procedura e registro di sincronizzazione upstream](docs/upstream-sync.md)
- [Architettura Software + Photography](docs/superpowers/specs/2026-09-21-software-photography-portfolio-architecture-design.md)
- [Punti di estensione del template](docs/superpowers/plans/2026-09-21-template-extension-points.md)
- [Portfolio personale Software/Photography](docs/superpowers/plans/2026-09-21-personal-software-portfolio.md)
