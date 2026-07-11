// One-shot: trasforma le config build-time nei JSON runtime e li carica su R2.
// Uso: npm run migrate            → carica _site/site.json e _data/albums.json
//      npm run migrate -- --dry-run → stampa i JSON senza caricare nulla
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { fileURLToPath } from 'url';
import { siteConfig } from '../config/site.config.js';
import { albums } from '../config/albums.config.js';

export function parseHeroRef(url) {
  if (!url) return null;
  try {
    const segments = new URL(url).pathname.split('/').filter(Boolean);
    if (segments.length < 2) return null;
    return { album: segments[segments.length - 2], name: segments[segments.length - 1] };
  } catch {
    return null;
  }
}

export function albumsToRuntime(legacyAlbums) {
  return {
    albums: legacyAlbums.map(a => ({
      slug: a.slug,
      title: a.title,
      description: a.description ?? '',
      coverName: a.coverUrl ? a.coverUrl.split('/').filter(Boolean).at(-1) : null,
    })),
  };
}

export function siteToRuntime(cfg) {
  const social = {};
  for (const [k, v] of Object.entries(cfg.social ?? {})) {
    if (typeof v === 'string') social[k] = v;
  }
  return {
    name: cfg.name,
    bio: cfg.bio ?? '',
    hero: parseHeroRef(cfg.heroImageUrl),
    social,
  };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const siteJson = JSON.stringify(siteToRuntime(siteConfig), null, 2);
  const albumsJson = JSON.stringify(albumsToRuntime(albums), null, 2);

  process.stdout.write(`_site/site.json:\n${siteJson}\n\n_data/albums.json:\n${albumsJson}\n\n`);
  if (dryRun) {
    process.stdout.write('Dry-run: nessun upload.\n');
    return;
  }

  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    process.stderr.write('Env R2 mancanti (servono R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME nel .env).\n');
    process.exit(1);
  }
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
  for (const [key, body] of [['_site/site.json', siteJson], ['_data/albums.json', albumsJson]]) {
    await s3.send(new PutObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key, Body: body, ContentType: 'application/json' }));
    process.stdout.write(`✓ caricato ${key}\n`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
