// Decisione pura della pagina album a partire dai tre fetch paralleli.
import { findAlbumBySlug } from '../utils/findAlbumBySlug.js';

export function resolveAlbumPage(slug, albumsRes, manifestRes) {
  const album = albumsRes.ok ? findAlbumBySlug(albumsRes.data, slug) : null;

  // albums.json è autorevole: se risponde e lo slug non c'è, l'album non esiste.
  if (albumsRes.ok && !album) return { kind: 'not_found' };

  if (manifestRes.ok) {
    const entries = manifestRes.data;
    const resolved = album ?? { slug, title: slug, description: '', coverName: null };
    return entries.length === 0
      ? { kind: 'empty', album: resolved }
      : { kind: 'photos', album: resolved, entries };
  }

  if (manifestRes.error === 'NOT_FOUND') {
    // Album esistente senza manifest = appena creato, nessuna foto.
    return album ? { kind: 'empty', album } : { kind: 'not_found' };
  }
  return { kind: 'error', code: manifestRes.error === 'NETWORK' ? 'network' : 'unknown' };
}
