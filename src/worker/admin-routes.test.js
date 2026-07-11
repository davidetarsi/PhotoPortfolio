// src/worker/admin-routes.test.js
// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import worker from '../worker.js';
import { handleAdminRequest } from './admin-routes.js';
import { _resetJwksCache } from './access-jwt.js';
import { makeFakeBucket, makeFakeAssets, makeJwtTestKit } from './test-helpers.js';

const ENV_VARS = { ACCESS_TEAM_DOMAIN: 'team.cloudflareaccess.com', ACCESS_AUD: 'aud-123' };
const NOW = 1_800_000_000_000;
const SITE = { name: 'Davide', bio: '', hero: null, social: {} };
const ALBUMS = { albums: [{ slug: 'sport', title: 'Sport', description: '', coverName: null }] };

let kit, deps, token;
beforeEach(async () => {
  _resetJwksCache();
  kit = await makeJwtTestKit();
  deps = { fetchJwks: kit.fetchJwks, now: () => NOW };
  token = await kit.signToken({
    aud: ['aud-123'], iss: 'https://team.cloudflareaccess.com',
    exp: Math.floor(NOW / 1000) + 3600, iat: Math.floor(NOW / 1000),
  });
});

const makeEnv = (initial = {}) => ({ ...ENV_VARS, ASSETS: makeFakeAssets(), BUCKET: makeFakeBucket(initial) });
const call = (env, method, path, body, headers = {}) =>
  handleAdminRequest(new Request(`https://x.dev${path}`, {
    method,
    headers: { 'Cf-Access-Jwt-Assertion': token, 'Content-Type': 'application/json', ...headers },
    ...(body !== undefined ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
  }), env, deps);

describe('auth gate', () => {
  it('401 senza token; 401 con token invalido', async () => {
    const env = makeEnv();
    const noTok = await handleAdminRequest(new Request('https://x.dev/api/admin/site', { method: 'PUT', body: '{}' }), env, deps);
    expect(noTok.status).toBe(401);
    const bad = await handleAdminRequest(new Request('https://x.dev/api/admin/site', {
      method: 'PUT', body: '{}', headers: { 'Cf-Access-Jwt-Assertion': 'x.y.z' },
    }), env, deps);
    expect(bad.status).toBe(401);
  });

  it('il worker instrada /api/admin/* verso il gate (401 senza token)', async () => {
    const res = await worker.fetch(new Request('https://x.dev/api/admin/site', { method: 'PUT', body: '{}' }), makeEnv());
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/admin/site', () => {
  it('salva site.json valido', async () => {
    const env = makeEnv();
    const res = await call(env, 'PUT', '/api/admin/site', SITE);
    expect(res.status).toBe(200);
    expect(JSON.parse(env.BUCKET.store.get('_site/site.json').text)).toEqual(SITE);
  });
  it('400 su shape invalida e su JSON malformato', async () => {
    const env = makeEnv();
    expect((await call(env, 'PUT', '/api/admin/site', { name: '' })).status).toBe(400);
    expect((await call(env, 'PUT', '/api/admin/site', '{non-json')).status).toBe(400);
    expect(env.BUCKET.store.has('_site/site.json')).toBe(false);
  });
  it('errore di scrittura R2 → 500 con JSON pulito, non un unhandled rejection', async () => {
    const env = makeEnv();
    env.BUCKET.put = async () => { throw new Error('R2 down'); };
    const res = await call(env, 'PUT', '/api/admin/site', SITE);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'STORAGE_ERROR' });
  });
});

describe('PUT /api/admin/albums', () => {
  it('salva albums.json valido; 400 su slug riservato', async () => {
    const env = makeEnv();
    expect((await call(env, 'PUT', '/api/admin/albums', ALBUMS)).status).toBe(200);
    expect(JSON.parse(env.BUCKET.store.get('_data/albums.json').text)).toEqual(ALBUMS);
    const bad = { albums: [{ slug: 'admin', title: 'X', description: '', coverName: null }] };
    expect((await call(env, 'PUT', '/api/admin/albums', bad)).status).toBe(400);
  });
});

describe('PUT /api/admin/albums/:slug/manifest', () => {
  it('salva manifest valido; 400 su entry invalida; 404 su slug malformato', async () => {
    const env = makeEnv();
    const manifest = [{ name: 'a.webp', width: 10, height: 20 }];
    expect((await call(env, 'PUT', '/api/admin/albums/sport/manifest', manifest)).status).toBe(200);
    expect(JSON.parse(env.BUCKET.store.get('sport/manifest.json').text)).toEqual(manifest);
    expect((await call(env, 'PUT', '/api/admin/albums/sport/manifest', [{ name: 'a.jpg', width: 1, height: 1 }])).status).toBe(400);
    expect((await call(env, 'PUT', '/api/admin/albums/NO SLUG/manifest', manifest)).status).toBe(404);
  });
  it('404 su slug riservato (es. "admin") anche se passa SLUG_RE', async () => {
    const env = makeEnv();
    const manifest = [{ name: 'a.webp', width: 10, height: 20 }];
    expect((await call(env, 'PUT', '/api/admin/albums/admin/manifest', manifest)).status).toBe(404);
  });
});

describe('rotte sconosciute', () => {
  it('404 su path ignoto; 405 su metodo sbagliato', async () => {
    const env = makeEnv();
    expect((await call(env, 'PUT', '/api/admin/boh', {})).status).toBe(404);
    expect((await call(env, 'GET', '/api/admin/site')).status).toBe(405);
  });
});
