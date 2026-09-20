// Letture runtime dei contenuti. Ogni funzione restituisce un result object,
// mai throw: i chiamanti decidono il fallback (asimmetrico) per ciascun caso.
import { validateSiteShape, validateAlbumsShape, validateManifestShape, validateConfigShape } from '../shared/content-rules.js';

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

export function fetchSite() {
  return fetchValidated('/api/data/site', validateSiteShape);
}

export async function fetchAlbums() {
  const res = await fetchValidated('/api/data/albums', validateAlbumsShape);
  return res.ok ? { ok: true, data: res.data.albums } : res;
}

export function fetchManifest(slug) {
  return fetchValidated(`/api/data/albums/${slug}/manifest`, validateManifestShape);
}

export function fetchConfig() {
  return fetchValidated('/api/data/config', validateConfigShape);
}
