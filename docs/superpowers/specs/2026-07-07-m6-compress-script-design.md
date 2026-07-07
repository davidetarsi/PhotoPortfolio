# M6 — Script di compressione locale Design Spec

**Date:** 2026-07-07
**Milestone:** M6

---

## Goal

Uno script Node.js eseguibile localmente che legge le foto originali da una cartella del filesystem, genera versioni compresse in WebP ottimizzate per il web (thumbnail per la griglia, preview per il lightbox), e le salva in due sottocartelle affiancate agli originali.

---

## Scope

M6 aggiunge solo uno strumento di sviluppo (`scripts/compress.js`). Nessuna modifica al frontend, nessuna modifica al provider Drive, nessuna modifica al sito. Il sito continua a funzionare esattamente come ora.

Il flusso del fotografo:

```
1. Aggiunge/rimuove foto in  <root>/originali/
2. Esegue:  npm run compress -- --input <root>
3. Lo script rigenera       <root>/thumbnails/  e  <root>/previews/
4. Carica le tre cartelle su Google Drive
```

---

## Struttura cartelle

```
<root>/               ← percorso passato con --input
  originali/          ← foto originali del fotografo (non modificate)
  thumbnails/         ← generato dallo script (griglia)
  previews/           ← generato dallo script (lightbox)
```

Lo script svuota completamente `thumbnails/` e `previews/` ad ogni esecuzione e le ricrea da `originali/`. La cancellazione di una foto da `originali/` si riflette automaticamente al prossimo run.

---

## Configurazione output

| | Lato lungo max | Qualità WebP | Note |
|--|---------------|--------------|------|
| **thumbnail** | 600px | 72 | Griglia: copre 3x retina mobile (~200px CSS × 3) |
| **preview** | 1400px | 80 | Lightbox: copre iPhone 15 Pro Max (1290px fisici) e iPad |

- **Algoritmo resize:** Lanczos3 (kernel più nitido per downscaling di fotografie)
- **Formato output:** WebP (25-35% più leggero di JPEG a parità qualità visiva)
- **Metadata:** rimossi (privacy GPS + riduzione peso)
- **Struttura nome file:** `originale.jpg` → `originale.webp` (estensione sostituita)

---

## Formati input supportati

JPEG (`.jpg`, `.jpeg`), PNG (`.png`), HEIC (`.heic`), TIFF (`.tif`, `.tiff`), WebP (`.webp`)

**Non supportati:** RAW (CR2, NEF, ARW, ecc.) — il fotografo esporta in JPEG da Lightroom prima di usare lo script.

---

## Interfaccia CLI

```bash
npm run compress -- --input /Volumes/SSD/Portfolio
```

Flag supportati:

| Flag | Obbligatorio | Default | Descrizione |
|------|-------------|---------|-------------|
| `--input` | sì | — | Percorso root contenente `originali/` |
| `--help` | no | — | Mostra usage e termina |

Lo script valida che `--input` esista e che `originali/` sia presente al suo interno. Se mancano, stampa un errore leggibile e termina con exit code 1.

---

## Output CLI durante l'esecuzione

```
📁 Input:  /Volumes/SSD/Portfolio/originali  (12 foto)
🗑  Svuoto thumbnails/ e previews/...
⚙  [1/12] alba_01.jpg → alba_01.webp
⚙  [2/12] tramonto_02.heic → tramonto_02.webp
...
✅ Completato: 12 thumbnail, 12 preview generate in 4.2s
```

Errori per singolo file vengono loggati ma non interrompono l'elaborazione degli altri.

---

## Dipendenze

- **`sharp`** aggiunto a `devDependencies` — libreria Node.js per image processing, zero dipendenze runtime per il sito.

---

## File coinvolti

| Azione | File |
|--------|------|
| Crea | `scripts/compress.js` |
| Modifica | `package.json` (devDependency sharp + script compress) |

Nessun altro file del progetto viene modificato.

---

## Fuori scope

- Modifiche al provider Drive o al frontend
- Watch mode (ricompressione automatica al salvataggio)
- Supporto RAW
- Upload automatico su Drive
