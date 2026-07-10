// src/worker/data-routes.test.js
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import worker from '../worker.js';
import { makeFakeBucket, makeFakeAssets } from './test-helpers.js';

const SITE = { name: 'Davide', bio: '', hero: null, social: {} };
const ALBUMS = { albums: [{ slug: 'sport', title: 'Sport', description: '', coverName: null }] };
const MANIFEST = [{ name: 'a.webp', width: 10, height: 20 }];

function makeEnv() {
  return {
    ASSETS: makeFakeAssets(),
    BUCKET: makeFakeBucket({ '_site/site.json': SITE, '_data/albums.json': ALBUMS, 'sport/manifest.json': MANIFEST }),
  };
}
const get = (env, path) => worker.fetch(new Request(`https://x.dev${path}`), env);

describe('GET /api/data/*', () => {
  it('serve site.json con no-store', async () => {
    const res = await get(makeEnv(), '/api/data/site');
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(await res.json()).toEqual(SITE);
  });

  it('serve albums.json e manifest per slug', async () => {
    const env = makeEnv();
    expect(await (await get(env, '/api/data/albums')).json()).toEqual(ALBUMS);
    expect(await (await get(env, '/api/data/albums/sport/manifest')).json()).toEqual(MANIFEST);
  });

  it('404 su chiave assente e su path sconosciuto; 405 su metodo non-GET', async () => {
    const env = makeEnv();
    expect((await get(env, '/api/data/albums/mancante/manifest')).status).toBe(404);
    expect((await get(env, '/api/data/boh')).status).toBe(404);
    const res = await worker.fetch(new Request('https://x.dev/api/data/site', { method: 'POST' }), env);
    expect(res.status).toBe(405);
  });

  it('slug con caratteri invalidi nella rotta manifest → 404', async () => {
    expect((await get(makeEnv(), '/api/data/albums/../manifest')).status).toBe(404);
  });
});

describe('routing worker', () => {
  it('/admin serve admin.html (prima della regex album)', async () => {
    const env = makeEnv();
    const res = await get(env, '/admin');
    expect(await res.text()).toBe('ASSET:/admin.html');
  });

  it('slug album continua a servire album.html; statiche invariate', async () => {
    const env = makeEnv();
    expect(await (await get(env, '/sport')).text()).toBe('ASSET:/album.html');
    expect(await (await get(env, '/contatti')).text()).toBe('ASSET:/contatti.html');
    expect(await (await get(env, '/')).text()).toBe('ASSET:/');
  });
});
