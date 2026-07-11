// Scritture protette. Il JWT è verificato QUI (non nel router del worker):
// ogni handler admin è chiuso by-construction anche se il routing cambiasse.
import { jsonResponse } from './http.js';
import { verifyAccessJwt } from './access-jwt.js';
import {
  SLUG_RE, RESERVED_SLUGS, PHOTO_NAME_RE, MAX_PHOTO_BYTES,
  validateSiteShape, validateAlbumsShape, validateManifestShape,
} from '../shared/content-rules.js';

const MANIFEST_RE = /^\/api\/admin\/albums\/([a-z0-9][a-z0-9-]*)\/manifest$/;
const PHOTO_RE = /^\/api\/admin\/albums\/([a-z0-9][a-z0-9-]*)\/photos\/([^/]+)$/;

async function readJson(request) {
  try { return { ok: true, data: await request.json() }; }
  catch { return { ok: false }; }
}

async function putValidatedJson(request, env, key, validate) {
  const body = await readJson(request);
  if (!body.ok) return jsonResponse({ error: 'JSON malformato' }, 400);
  const check = validate(body.data);
  if (!check.ok) return jsonResponse({ error: check.error }, 400);
  try {
    await env.BUCKET.put(key, JSON.stringify(body.data), { httpMetadata: { contentType: 'application/json' } });
  } catch {
    return jsonResponse({ error: 'STORAGE_ERROR' }, 500);
  }
  return jsonResponse({ ok: true });
}

export async function handleAdminRequest(request, env, deps = {}) {
  const auth = await verifyAccessJwt(request, env, deps);
  if (!auth.ok) return jsonResponse({ error: 'UNAUTHORIZED' }, 401);

  const { pathname } = new URL(request.url);
  const { method } = request;

  if (pathname === '/api/admin/site') {
    if (method !== 'PUT') return jsonResponse({ error: 'METHOD_NOT_ALLOWED' }, 405);
    return putValidatedJson(request, env, '_site/site.json', validateSiteShape);
  }

  if (pathname === '/api/admin/albums') {
    if (method !== 'PUT') return jsonResponse({ error: 'METHOD_NOT_ALLOWED' }, 405);
    return putValidatedJson(request, env, '_data/albums.json', validateAlbumsShape);
  }

  const manifest = pathname.match(MANIFEST_RE);
  if (manifest) {
    if (method !== 'PUT') return jsonResponse({ error: 'METHOD_NOT_ALLOWED' }, 405);
    const slug = manifest[1];
    if (!SLUG_RE.test(slug) || RESERVED_SLUGS.includes(slug)) return jsonResponse({ error: 'NOT_FOUND' }, 404);
    return putValidatedJson(request, env, `${slug}/manifest.json`, validateManifestShape);
  }

  const photo = pathname.match(PHOTO_RE);
  if (photo) {
    const [, slug, rawName] = photo;
    const name = decodeURIComponent(rawName);
    if (!SLUG_RE.test(slug) || !PHOTO_NAME_RE.test(name)) return jsonResponse({ error: 'Nome o slug invalido' }, 400);
    const key = `${slug}/${name}`;

    if (method === 'PUT') {
      if (request.headers.get('Content-Type') !== 'image/webp') return jsonResponse({ error: 'Atteso image/webp' }, 415);
      const bytes = await request.arrayBuffer();
      if (bytes.byteLength > MAX_PHOTO_BYTES) return jsonResponse({ error: 'File oltre 10MB' }, 413);
      if (bytes.byteLength === 0) return jsonResponse({ error: 'Body vuoto' }, 400);
      try {
        await env.BUCKET.put(key, bytes, { httpMetadata: { contentType: 'image/webp' } });
      } catch {
        return jsonResponse({ error: 'STORAGE_ERROR' }, 500);
      }
      return jsonResponse({ ok: true });
    }

    if (method === 'DELETE') {
      try {
        await env.BUCKET.delete(key);
        const manifestObj = await env.BUCKET.get(`${slug}/manifest.json`);
        if (manifestObj) {
          const entries = await manifestObj.json();
          if (Array.isArray(entries)) {
            const filtered = entries.filter(e => e?.name !== name);
            await env.BUCKET.put(`${slug}/manifest.json`, JSON.stringify(filtered), {
              httpMetadata: { contentType: 'application/json' },
            });
          }
        }
      } catch {
        return jsonResponse({ error: 'STORAGE_ERROR' }, 500);
      }
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: 'METHOD_NOT_ALLOWED' }, 405);
  }

  const albumDelete = pathname.match(/^\/api\/admin\/albums\/([a-z0-9][a-z0-9-]*)$/);
  if (albumDelete) {
    if (method !== 'DELETE') return jsonResponse({ error: 'METHOD_NOT_ALLOWED' }, 405);
    const slug = albumDelete[1];

    // Loop paginato: list() max 1000 chiavi/pagina, delete() max 1000 chiavi/chiamata.
    // Prima gli oggetti, POI albums.json: se il loop muore a metà, l'album resta
    // visibile nel pannello e la cancellazione è ri-lanciabile (idempotente).
    try {
      let cursor;
      do {
        const page = await env.BUCKET.list({ prefix: `${slug}/`, cursor, limit: 1000 });
        if (page.objects.length > 0) await env.BUCKET.delete(page.objects.map(o => o.key));
        cursor = page.truncated ? page.cursor : undefined;
      } while (cursor);

      const albumsObj = await env.BUCKET.get('_data/albums.json');
      if (albumsObj) {
        const data = await albumsObj.json();
        if (data && Array.isArray(data.albums)) {
          const filtered = { albums: data.albums.filter(a => a?.slug !== slug) };
          await env.BUCKET.put('_data/albums.json', JSON.stringify(filtered), {
            httpMetadata: { contentType: 'application/json' },
          });
        }
      }
    } catch {
      return jsonResponse({ error: 'STORAGE_ERROR' }, 500);
    }
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: 'NOT_FOUND' }, 404);
}
