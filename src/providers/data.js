/**
 * Runtime content reads: site, albums, manifests, and config.
 * Every function returns a result object, never throws. Callers decide asymmetric
 * fallback behavior for each case (e.g., use build config if fetch fails).
 */
import { validateSiteShape, validateAlbumsShape, validateManifestShape, validateConfigShape } from '../shared/content-rules.js';

/**
 * Fetches and validates JSON from a URL.
 * @param {string} url - Endpoint URL.
 * @param {Function} validate - Validation function returning {ok: boolean, error?: string}.
 * @returns {Promise<{ok: true, data: any} | {ok: false, error: string}>} Result object.
 */
async function fetchValidated(url, validate) {
  let res;
  try {
    res = await fetch(url);
  } catch {
    return { ok: false, error: 'NETWORK' };
  }
  if (res.status === 404) return { ok: false, error: 'NOT_FOUND' };
  if (!res.ok) return { ok: false, error: 'UNKNOWN' };
  let data;
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: 'MALFORMED' };
  }
  if (!validate(data).ok) return { ok: false, error: 'MALFORMED' };
  return { ok: true, data };
}

/**
 * Fetches site metadata (name, bio, hero, social).
 * @returns {Promise<{ok: true, data: object} | {ok: false, error: string}>} Site data or error.
 */
export function fetchSite() {
  return fetchValidated('/api/data/site', validateSiteShape);
}

/**
 * Fetches the albums collection.
 * @returns {Promise<{ok: true, data: Array} | {ok: false, error: string}>} Albums array or error.
 */
export async function fetchAlbums() {
  const res = await fetchValidated('/api/data/albums', validateAlbumsShape);
  return res.ok ? { ok: true, data: res.data.albums } : res;
}

/**
 * Fetches the photo manifest for an album.
 * @param {string} slug - Album slug.
 * @returns {Promise<{ok: true, data: Array} | {ok: false, error: string}>} Photo array or error.
 */
export function fetchManifest(slug) {
  return fetchValidated(`/api/data/albums/${slug}/manifest`, validateManifestShape);
}

/**
 * Fetches runtime configuration (R2 URL, Turnstile sitekey).
 * @returns {Promise<{ok: true, data: object} | {ok: false, error: string}>} Config or error.
 */
export function fetchConfig() {
  return fetchValidated('/api/data/config', validateConfigShape);
}
