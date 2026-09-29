# Registro sincronizzazione upstream

Registro della prima sincronizzazione completata il 23 settembre 2026. Il registro
riporta solo identificativi Git e risultati di verifica; non contiene credenziali,
identificativi Access completi, nomi bucket o URL.

| Data | Template importato | Merge downstream | Staging + produzione | Verifica | Migrazioni e decisioni rilevanti |
|---|---|---|---|---|---|
| 2026-09-23 | `b171728198973c0c0678cafc51684ea747c7b2ce` | `79271528af6ed4aac8f264b44e147b282a51ba2f` | `439725711ba25f6ab4afd0abd9a5e8324c326535` | Superata: test, build, CSP generata, smoke read-only staging e produzione | `/about`; form contatti nel Worker; CSP generata; config fallback preservata; staging opt-in preservato |
| 2026-09-30 | `e1e0fd42894dc4c16e97015d15eea87e22d39401` | `407de71269fb3d3cf1be472c89c5cf5a5837bfc9` | Staging + produzione: non eseguite | Superata: 75 file di test, 578 passati e 1 skipped; build Vite completata; bridge React verificato | F1/F2a/F3; contatti solo in About (nessuna pagina Contacts né redirect legacy `/contatti`); configurazione personale preservata |
