/**
 * Makes Vite's local routing match the production Worker where the cold-start
 * preview depends on it: missing data APIs stay missing and clean album slugs
 * serve album.html instead of the SPA index.
 */
const ALBUM_SLUG_RE = /^\/[a-z0-9][a-z0-9-]*$/;
const RESERVED_PATHS = new Set(['/about', '/admin', '/contatti']);

export function devRouteFallback(request, response, next) {
  const url = new URL(request.url, 'http://localhost');

  if (url.pathname.startsWith('/api/data/')) {
    response.statusCode = 404;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({
      error: 'Runtime data API is unavailable in the Vite development server',
    }));
    return;
  }

  if (ALBUM_SLUG_RE.test(url.pathname) && !RESERVED_PATHS.has(url.pathname)) {
    request.url = `/album.html${url.search}`;
  }
  next();
}
