import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderAdminAlbum } from './album.js';

const MANIFEST = [
  { name: 'a.webp', width: 1, height: 1 },
  { name: 'b.webp', width: 1, height: 1 },
];

function makeCtx(over = {}) {
  return {
    slug: 'sport',
    albums: [{ slug: 'sport', title: 'Sport', description: '', coverName: null }],
    site: { name: 'D', bio: '', hero: null, social: {} },
    r2PublicUrl: 'https://pub.r2.dev',
    api: {
      putManifest: vi.fn(async () => {}), putAlbums: vi.fn(async () => {}),
      deletePhoto: vi.fn(async () => {}), uploadPhoto: vi.fn(async () => {}),
    },
    navigate: vi.fn(),
    deps: {
      attachSortable: vi.fn(),
      fetchManifest: vi.fn(async () => ({ ok: true, data: structuredClone(MANIFEST) })),
      prompt: vi.fn(() => null),
      confirm: vi.fn(() => true),
      runBatch: vi.fn(async () => ({ uploaded: [], failed: [], manifest: MANIFEST })),
      makeProcessFile: vi.fn(async () => async () => ({ blob: 'B', width: 1, height: 1 })),
    },
    ...over,
  };
}
const flush = () => new Promise(r => setTimeout(r, 0));

describe('renderAdminAlbum', () => {
  let container;
  beforeEach(() => { container = document.createElement('div'); document.body.replaceChildren(container); });

  it('carica il manifest e renderizza le foto con URL pubblici', async () => {
    const ctx = makeCtx();
    renderAdminAlbum(container, ctx);
    await flush();
    const imgs = container.querySelectorAll('.admin-photo__img');
    expect(imgs).toHaveLength(2);
    expect(imgs[0].getAttribute('src')).toBe('https://pub.r2.dev/sport/a.webp');
  });

  it('manifest 404 (album nuovo) → griglia vuota, nessun errore', async () => {
    const ctx = makeCtx();
    ctx.deps.fetchManifest = vi.fn(async () => ({ ok: false, error: 'NOT_FOUND' }));
    renderAdminAlbum(container, ctx);
    await flush();
    expect(container.querySelectorAll('.admin-photo')).toHaveLength(0);
    expect(container.querySelector('.admin-dropzone')).not.toBeNull();
  });

  it('riordino → putManifest con ordine nuovo', async () => {
    const ctx = makeCtx();
    renderAdminAlbum(container, ctx);
    await flush();
    const onMove = ctx.deps.attachSortable.mock.calls[0][1];
    onMove(0, 1);
    await vi.waitFor(() => expect(ctx.api.putManifest).toHaveBeenCalled());
    expect(ctx.api.putManifest.mock.calls[0][1].map(e => e.name)).toEqual(['b.webp', 'a.webp']);
  });

  it('"Cover" → putAlbums con coverName aggiornato', async () => {
    const ctx = makeCtx();
    renderAdminAlbum(container, ctx);
    await flush();
    container.querySelectorAll('.admin-photo__cover')[1].click();
    await vi.waitFor(() => expect(ctx.api.putAlbums).toHaveBeenCalled());
    expect(ctx.api.putAlbums.mock.calls[0][0][0].coverName).toBe('b.webp');
  });

  it('elimina foto (confirm) → deletePhoto e rimozione dalla griglia', async () => {
    const ctx = makeCtx();
    renderAdminAlbum(container, ctx);
    await flush();
    container.querySelectorAll('.admin-photo__delete')[0].click();
    await vi.waitFor(() => expect(ctx.api.deletePhoto).toHaveBeenCalledWith('sport', 'a.webp'));
    expect(container.querySelectorAll('.admin-photo')).toHaveLength(1);
  });

  it('selezione file → runBatch cablato su api e manifest corrente', async () => {
    const ctx = makeCtx();
    renderAdminAlbum(container, ctx);
    await flush();
    const input = container.querySelector('.admin-dropzone input[type="file"]');
    Object.defineProperty(input, 'files', { value: [{ name: 'x.jpg', type: 'image/jpeg' }] });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await vi.waitFor(() => expect(ctx.deps.runBatch).toHaveBeenCalled());
    const args = ctx.deps.runBatch.mock.calls[0][0];
    expect(args.existingManifest.map(e => e.name)).toEqual(['a.webp', 'b.webp']);
    await args.uploadPhoto('n.webp', 'BLOB');
    expect(ctx.api.uploadPhoto).toHaveBeenCalledWith('sport', 'n.webp', 'BLOB');
    await args.putManifest([]);
    expect(ctx.api.putManifest).toHaveBeenCalledWith('sport', []);
  });
});
