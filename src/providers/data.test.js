import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchSite, fetchAlbums, fetchManifest, fetchConfig } from './data.js';

const SITE = { name: 'Davide', bio: '', hero: null, social: {} };
const ALBUMS = { albums: [{ slug: 'sport', title: 'Sport', description: '', coverName: null }] };

const mockFetch = impl => vi.stubGlobal('fetch', vi.fn(impl));
const jsonRes = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
afterEach(() => vi.unstubAllGlobals());

describe('fetchSite', () => {
  it('successo → {ok:true, data}; chiama /api/data/site', async () => {
    mockFetch(async () => jsonRes(SITE));
    expect(await fetchSite()).toEqual({ ok: true, data: SITE });
    expect(global.fetch).toHaveBeenCalledWith('/api/data/site');
  });
  it('rete giù → NETWORK; 404 → NOT_FOUND; 500 → UNKNOWN', async () => {
    mockFetch(async () => { throw new TypeError('net'); });
    expect((await fetchSite()).error).toBe('NETWORK');
    mockFetch(async () => jsonRes({ error: 'x' }, 404));
    expect((await fetchSite()).error).toBe('NOT_FOUND');
    mockFetch(async () => jsonRes({ error: 'x' }, 500));
    expect((await fetchSite()).error).toBe('UNKNOWN');
  });
  it('shape invalida o JSON rotto → MALFORMED', async () => {
    mockFetch(async () => jsonRes({ name: '' }));
    expect((await fetchSite()).error).toBe('MALFORMED');
    mockFetch(async () => new Response('{rotto', { status: 200 }));
    expect((await fetchSite()).error).toBe('MALFORMED');
  });
});

describe('fetchAlbums', () => {
  it('estrae direttamente l\'array albums', async () => {
    mockFetch(async () => jsonRes(ALBUMS));
    expect(await fetchAlbums()).toEqual({ ok: true, data: ALBUMS.albums });
  });
  it('shape invalida → MALFORMED', async () => {
    mockFetch(async () => jsonRes({ albums: 'no' }));
    expect((await fetchAlbums()).error).toBe('MALFORMED');
  });
});

describe('fetchManifest', () => {
  it('successo e URL con slug', async () => {
    const entries = [{ name: 'a.webp', width: 1, height: 2 }];
    mockFetch(async () => jsonRes(entries));
    expect(await fetchManifest('sport')).toEqual({ ok: true, data: entries });
    expect(global.fetch).toHaveBeenCalledWith('/api/data/albums/sport/manifest');
  });
  it('404 → NOT_FOUND (album nuovo senza manifest)', async () => {
    mockFetch(async () => jsonRes({ error: 'x' }, 404));
    expect((await fetchManifest('nuovo')).error).toBe('NOT_FOUND');
  });
});

describe('fetchConfig', () => {
  it('successo → {ok:true, data}; chiama /api/data/config', async () => {
    mockFetch(async () => jsonRes({ r2PublicUrl: 'https://pub-x.r2.dev' }));
    expect(await fetchConfig()).toEqual({ ok: true, data: { r2PublicUrl: 'https://pub-x.r2.dev' } });
    expect(global.fetch).toHaveBeenCalledWith('/api/data/config');
  });
  it('r2PublicUrl null o vuoto → MALFORMED (il chiamante userà il fallback di build)', async () => {
    mockFetch(async () => jsonRes({ r2PublicUrl: null }));
    expect((await fetchConfig()).error).toBe('MALFORMED');
    mockFetch(async () => jsonRes({ r2PublicUrl: '' }));
    expect((await fetchConfig()).error).toBe('MALFORMED');
  });
  it('rete giù → NETWORK', async () => {
    mockFetch(async () => { throw new TypeError('net'); });
    expect((await fetchConfig()).error).toBe('NETWORK');
  });
});
