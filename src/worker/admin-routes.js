// Scritture protette. Il JWT è verificato QUI (non nel router del worker):
// ogni handler admin è chiuso by-construction anche se il routing cambiasse.
import { jsonResponse } from './http.js';
import { verifyAccessJwt } from './access-jwt.js';
import {
  SLUG_RE, validateSiteShape, validateAlbumsShape, validateManifestShape,
} from '../shared/content-rules.js';

const MANIFEST_RE = /^\/api\/admin\/albums\/([a-z0-9][a-z0-9-]*)\/manifest$/;

async function readJson(request) {
  try { return { ok: true, data: await request.json() }; }
  catch { return { ok: false }; }
}

async function putValidatedJson(request, env, key, validate) {
  const body = await readJson(request);
  if (!body.ok) return jsonResponse({ error: 'JSON malformato' }, 400);
  const check = validate(body.data);
  if (!check.ok) return jsonResponse({ error: check.error }, 400);
  await env.BUCKET.put(key, JSON.stringify(body.data), { httpMetadata: { contentType: 'application/json' } });
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
    if (!SLUG_RE.test(slug)) return jsonResponse({ error: 'NOT_FOUND' }, 404);
    return putValidatedJson(request, env, `${slug}/manifest.json`, validateManifestShape);
  }

  return jsonResponse({ error: 'NOT_FOUND' }, 404);
}
