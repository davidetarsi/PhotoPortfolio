// Letture pubbliche dei JSON di contenuto. Sempre no-store: il sito vede
// immediatamente le modifiche fatte dall'admin.
import { jsonResponse } from './http.js';

const MANIFEST_RE = /^\/api\/data\/albums\/([a-z0-9][a-z0-9-]*)\/manifest$/;

function keyFor(pathname) {
  if (pathname === '/api/data/site') return '_site/site.json';
  if (pathname === '/api/data/albums') return '_data/albums.json';
  const m = pathname.match(MANIFEST_RE);
  if (m) return `${m[1]}/manifest.json`;
  return null;
}

export async function handleDataRequest(request, env) {
  if (request.method !== 'GET') return jsonResponse({ error: 'METHOD_NOT_ALLOWED' }, 405);
  const key = keyFor(new URL(request.url).pathname);
  if (!key) return jsonResponse({ error: 'NOT_FOUND' }, 404);
  const obj = await env.BUCKET.get(key);
  if (!obj) return jsonResponse({ error: 'NOT_FOUND' }, 404);
  return new Response(await obj.text(), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
