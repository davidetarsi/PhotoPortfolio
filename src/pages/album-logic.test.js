import { describe, it, expect } from 'vitest';
import { resolveAlbumPage } from './album-logic.js';

const sport = { slug: 'sport', title: 'Sport', description: '', coverName: null };
const albumsOk = { ok: true, data: [sport] };
const entries = [{ name: 'a.webp', width: 1, height: 2 }];

describe('resolveAlbumPage', () => {
  it('caso valido → photos con album risolto', () => {
    expect(resolveAlbumPage('sport', albumsOk, { ok: true, data: entries }))
      .toEqual({ kind: 'photos', album: sport, entries });
  });
  it('manifest vuoto o assente ma album esistente → empty (album appena creato)', () => {
    expect(resolveAlbumPage('sport', albumsOk, { ok: true, data: [] }).kind).toBe('empty');
    expect(resolveAlbumPage('sport', albumsOk, { ok: false, error: 'NOT_FOUND' }).kind).toBe('empty');
  });
  it('slug non in albums.json → not_found (anche se il manifest esistesse)', () => {
    expect(resolveAlbumPage('fantasma', albumsOk, { ok: true, data: entries }).kind).toBe('not_found');
    expect(resolveAlbumPage('fantasma', albumsOk, { ok: false, error: 'NOT_FOUND' }).kind).toBe('not_found');
  });
  it('albums KO + manifest NOT_FOUND → not_found; albums KO + manifest ok → photos con title=slug', () => {
    const albumsKo = { ok: false, error: 'NETWORK' };
    expect(resolveAlbumPage('sport', albumsKo, { ok: false, error: 'NOT_FOUND' }).kind).toBe('not_found');
    const r = resolveAlbumPage('sport', albumsKo, { ok: true, data: entries });
    expect(r.kind).toBe('photos');
    expect(r.album.title).toBe('sport');
  });
  it('manifest NETWORK → error network; manifest MALFORMED/UNKNOWN → error unknown', () => {
    expect(resolveAlbumPage('sport', albumsOk, { ok: false, error: 'NETWORK' }))
      .toEqual({ kind: 'error', code: 'network' });
    expect(resolveAlbumPage('sport', albumsOk, { ok: false, error: 'MALFORMED' }))
      .toEqual({ kind: 'error', code: 'unknown' });
    expect(resolveAlbumPage('sport', albumsOk, { ok: false, error: 'UNKNOWN' }))
      .toEqual({ kind: 'error', code: 'unknown' });
  });
});
