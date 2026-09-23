/**
 * Public read endpoints for content JSON (site, albums, manifests, config).
 * Always Cache-Control: no-store so the site immediately sees admin changes.
 */
import { jsonResponse } from './http.js';

const MANIFEST_RE = /^\/api\/data\/albums\/([a-z0-9][a-z0-9-]*)\/manifest$/;

/**
 * Maps a data request pathname to the R2 object key.
 * @param {string} pathname - The request path.
 * @returns {string|null} The R2 key, or null if path doesn't match a known endpoint.
 */
function keyFor(pathname) {
  if (pathname === '/api/data/site') return '_site/site.json';
  if (pathname === '/api/data/albums') return '_data/albums.json';
  const m = pathname.match(MANIFEST_RE);
  if (m) return `${m[1]}/manifest.json`;
  return null;
}

/**
 * Handles public data requests (site, albums, manifests, config).
 * All responses have Cache-Control: no-store for immediate consistency with admin changes.
 * @param {Request} request - The incoming HTTP request.
 * @param {object} env - Cloudflare Worker environment with BUCKET and R2_PUBLIC_URL.
 * @returns {Promise<Response>} JSON response or 404 if not found.
 */
export async function handleDataRequest(request, env) {
  if (request.method !== 'GET') return jsonResponse({ error: 'METHOD_NOT_ALLOWED' }, 405);
  const pathname = new URL(request.url).pathname;

  if (pathname === '/api/data/config') {
    return jsonResponse({
      r2PublicUrl: env.R2_PUBLIC_URL ?? null,
      turnstileSitekey: env.TURNSTILE_SITEKEY ?? null,
    });
  }

  const key = keyFor(pathname);
  if (!key) return jsonResponse({ error: 'NOT_FOUND' }, 404);
  const obj = await env.BUCKET.get(key);
  if (!obj) return jsonResponse({ error: 'NOT_FOUND' }, 404);
  return new Response(await obj.text(), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
