import { describe, it, expect, vi, afterEach } from 'vitest';
import { adminApi } from './api.js';

afterEach(() => vi.unstubAllGlobals());
const okRes = () => new Response('{"ok":true}', { status: 200 });

describe('adminApi', () => {
  it('putManifest fa PUT JSON sull\'endpoint giusto', async () => {
    const f = vi.fn(async () => okRes());
    vi.stubGlobal('fetch', f);
    await adminApi.putManifest('sport', []);
    expect(f).toHaveBeenCalledWith('/api/admin/albums/sport/manifest', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '[]',
    });
  });
  it('uploadPhoto fa PUT binario con content-type image/webp e nome URL-encoded', async () => {
    const f = vi.fn(async () => okRes());
    vi.stubGlobal('fetch', f);
    const blob = new Blob(['x'], { type: 'image/webp' });
    await adminApi.uploadPhoto('sport', 'foto.webp', blob);
    expect(f).toHaveBeenCalledWith('/api/admin/albums/sport/photos/foto.webp', {
      method: 'PUT', headers: { 'Content-Type': 'image/webp' }, body: blob,
    });
  });
  it('deleteAlbum e deletePhoto usano DELETE; errore HTTP → throw con status', async () => {
    const f = vi.fn(async () => okRes());
    vi.stubGlobal('fetch', f);
    await adminApi.deleteAlbum('sport');
    expect(f).toHaveBeenLastCalledWith('/api/admin/albums/sport', { method: 'DELETE' });
    await adminApi.deletePhoto('sport', 'a.webp');
    expect(f).toHaveBeenLastCalledWith('/api/admin/albums/sport/photos/a.webp', { method: 'DELETE' });
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":"x"}', { status: 401 })));
    await expect(adminApi.putSite({})).rejects.toThrow('401');
  });
});
