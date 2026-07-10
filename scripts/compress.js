import sharp from 'sharp';
import { readdir, rm, mkdir, writeFile } from 'fs/promises';
import { join, extname, basename } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const SUPPORTED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.heic', '.tif', '.tiff', '.webp']);
const MAX_DIMENSION = 1900;
const WEBP_QUALITY = 85;
const CONCURRENCY = 4;

/**
 * @param {string[]} argv - Array di argomenti CLI (es. process.argv.slice(2)).
 * @returns {{ input: string | null, help: boolean }}
 */
export function parseArgs(argv) {
  const result = { input: null, help: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--help') result.help = true;
    if (argv[i] === '--input' && argv[i + 1]) result.input = argv[++i];
  }
  return result;
}

/**
 * @param {string} filename - Nome del file con estensione.
 * @returns {boolean}
 */
export function isSupportedFile(filename) {
  return SUPPORTED_EXTS.has(extname(filename).toLowerCase());
}

/**
 * @param {string} inPath - Percorso assoluto del file sorgente.
 * @param {string} outPath - Percorso assoluto del file di output (.webp).
 * @returns {Promise<{width: number, height: number, format: string, ...}>}
 */
export async function processImage(inPath, outPath) {
  return sharp(inPath)
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: 'inside',
      kernel: 'lanczos3',
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toFile(outPath);
}

/**
 * @param {string} originaliDir - Percorso assoluto della cartella sorgente.
 * @param {string} optimizedDir - Percorso assoluto della cartella di output.
 * @returns {Promise<{ ok: number, errors: number, elapsed: number, manifest: Array<{name: string, width: number, height: number}> }>}
 */
export async function processDir(originaliDir, optimizedDir) {
  const files = (await readdir(originaliDir)).filter(isSupportedFile);

  await rm(optimizedDir, { recursive: true, force: true });
  await mkdir(optimizedDir, { recursive: true });

  let totalErrors = 0;
  const start = Date.now();
  const produced = [];

  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const chunk = files.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      chunk.map(async (file, j) => {
        const idx = i + j + 1;
        const outName = basename(file, extname(file)) + '.webp';
        process.stdout.write(`⚙  [${idx}/${files.length}] ${file} → ${outName}\n`);
        try {
          const info = await processImage(join(originaliDir, file), join(optimizedDir, outName));
          return { name: outName, width: info.width, height: info.height };
        } catch (err) {
          process.stderr.write(`  ✗ Errore su ${file}: ${err.message}\n`);
          return null;
        }
      })
    );
    for (const result of results) {
      if (result) produced.push(result);
      else totalErrors++;
    }
  }

  const manifest = produced.sort((a, b) => a.name.localeCompare(b.name));
  await writeFile(join(optimizedDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  return { ok: manifest.length, errors: totalErrors, elapsed: Date.now() - start, manifest };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    process.stdout.write(`
Uso: npm run compress -- --input <percorso>

  --input <percorso>   Cartella root contenente originali/
  --help               Mostra questo messaggio
\n`);
    process.exit(0);
  }

  if (!args.input) {
    process.stderr.write('Errore: --input è obbligatorio.\n');
    process.exit(1);
  }

  const inputRoot = args.input;
  const originaliDir = join(inputRoot, 'originali');
  const optimizedDir = join(inputRoot, 'optimized');

  if (!existsSync(inputRoot)) {
    process.stderr.write(`Errore: la cartella "${inputRoot}" non esiste.\n`);
    process.exit(1);
  }

  if (!existsSync(originaliDir)) {
    process.stderr.write(`Errore: la cartella "originali/" non esiste in "${inputRoot}".\n`);
    process.exit(1);
  }

  const allFiles = (await readdir(originaliDir)).filter(isSupportedFile);
  process.stdout.write(`📁 Input:  ${originaliDir}  (${allFiles.length} foto)\n`);
  process.stdout.write('🗑  Svuoto optimized/...\n');

  const { ok, errors, elapsed } = await processDir(originaliDir, optimizedDir);

  const secs = (elapsed / 1000).toFixed(1);
  process.stdout.write(
    `✅ Completato: ${ok} foto ottimizzate${errors > 0 ? `, ${errors} errori` : ''} in ${secs}s\n`
  );
  process.stdout.write(`📋 manifest.json generato (${ok} file con dimensioni)\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
