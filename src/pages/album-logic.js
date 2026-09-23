/**
 * Pure logic for album page state from three parallel fetches.
 * Decides which UI state to render: photos, empty, not found, or error.
 */
import { findAlbumBySlug } from '../utils/findAlbumBySlug.js';

/**
 * Resolves the state of an album page.
 * @param {string} slug - Album slug from URL.
 * @param {{ok: boolean, data?: object, error?: string}} albumsRes - Result of fetchAlbums().
 * @param {{ok: boolean, data?: Array, error?: string}} manifestRes - Result of fetchManifest().
 * @returns {object} Page state with kind and album/entries/code as appropriate.
 */
export function resolveAlbumPage(slug, albumsRes, manifestRes) {
  const album = albumsRes.ok ? findAlbumBySlug(albumsRes.data, slug) : null;

  // albums.json is authoritative: if it responds and slug isn't found, album doesn't exist.
  if (albumsRes.ok && !album) return { kind: 'not_found' };

  if (manifestRes.ok) {
    const entries = manifestRes.data;
    const resolved = album ?? { slug, title: slug, description: '', coverName: null };
    return entries.length === 0
      ? { kind: 'empty', album: resolved }
      : { kind: 'photos', album: resolved, entries };
  }

  if (manifestRes.error === 'NOT_FOUND') {
    // Existing album without manifest = just created, no photos yet.
    return album ? { kind: 'empty', album } : { kind: 'not_found' };
  }
  return { kind: 'error', code: manifestRes.error === 'NETWORK' ? 'network' : 'unknown' };
}
