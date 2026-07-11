import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderAdminHome } from './home.js';

const SITE = { name: 'Davide', bio: 'Bio', hero: null, social: { instagram: '' } };
const ALBUMS = [
  { slug: 'sport', title: 'Sport', description: '', coverName: null },
  { slug: 'viaggi', title: 'Viaggi', description: '', coverName: null },
];

function makeCtx(over = {}) {
  return {
    site: structuredClone(SITE),
    albums: structuredClone(ALBUMS),
    r2PublicUrl: 'https://pub.r2.dev',
    api: {
      putSite: vi.fn(async () => {}), putAlbums: vi.fn(async () => {}),
      deleteAlbum: vi.fn(async () => {}),
    },
    navigate: vi.fn(),
    deps: {
      attachSortable: vi.fn(), // cattura onMove
      fetchManifest: vi.fn(async () => ({ ok: true, data: [] })),
      prompt: vi.fn(() => null),
    },
    ...over,
  };
}

describe('renderAdminHome', () => {
  let container;
  beforeEach(() => { container = document.createElement('div'); document.body.replaceChildren(container); });

  it('renderizza form sito e lista album', () => {
    renderAdminHome(container, makeCtx());
    expect(container.querySelector('[name="site-name"]').value).toBe('Davide');
    expect(container.querySelectorAll('.admin-album-row')).toHaveLength(2);
  });

  it('salva il sito con i valori del form', async () => {
    const ctx = makeCtx();
    renderAdminHome(container, ctx);
    container.querySelector('[name="site-name"]').value = 'Nuovo Nome';
    container.querySelector('.admin-save-site').click();
    await vi.waitFor(() => expect(ctx.api.putSite).toHaveBeenCalled());
    expect(ctx.api.putSite.mock.calls[0][0].name).toBe('Nuovo Nome');
    expect(ctx.api.putSite.mock.calls[0][0].hero).toBeNull(); // hero preservato
  });

  it('crea un album: slugify, putAlbums e navigate', async () => {
    const ctx = makeCtx();
    renderAdminHome(container, ctx);
    container.querySelector('[name="new-album-title"]').value = 'Street Photo';
    container.querySelector('.admin-create-album').click();
    await vi.waitFor(() => expect(ctx.api.putAlbums).toHaveBeenCalled());
    const sent = ctx.api.putAlbums.mock.calls[0][0];
    expect(sent[2]).toEqual({ slug: 'street-photo', title: 'Street Photo', description: '', coverName: null });
    expect(ctx.navigate).toHaveBeenCalledWith('#/album/street-photo');
  });

  it('rifiuta slug riservato o duplicato senza chiamare l\'API', async () => {
    const ctx = makeCtx();
    renderAdminHome(container, ctx);
    container.querySelector('[name="new-album-title"]').value = 'Admin';
    container.querySelector('.admin-create-album').click();
    await Promise.resolve();
    expect(ctx.api.putAlbums).not.toHaveBeenCalled();
    expect(container.querySelector('.admin-status').textContent).not.toBe('');
    container.querySelector('[name="new-album-title"]').value = 'Sport';
    container.querySelector('.admin-create-album').click();
    await Promise.resolve();
    expect(ctx.api.putAlbums).not.toHaveBeenCalled();
  });

  it('riordino via sortable → putAlbums con l\'ordine nuovo', async () => {
    const ctx = makeCtx();
    renderAdminHome(container, ctx);
    const onMove = ctx.deps.attachSortable.mock.calls[0][1];
    onMove(0, 1);
    await vi.waitFor(() => expect(ctx.api.putAlbums).toHaveBeenCalled());
    expect(ctx.api.putAlbums.mock.calls[0][0].map(a => a.slug)).toEqual(['viaggi', 'sport']);
  });

  it('cancellazione: richiede il nome esatto via prompt', async () => {
    const ctx = makeCtx();
    ctx.deps.prompt = vi.fn(() => 'Sport'); // nome giusto
    renderAdminHome(container, ctx);
    container.querySelectorAll('.admin-delete-album')[0].click();
    await vi.waitFor(() => expect(ctx.api.deleteAlbum).toHaveBeenCalledWith('sport'));
    // nome sbagliato → nessuna chiamata
    const ctx2 = makeCtx();
    ctx2.deps.prompt = vi.fn(() => 'sbagliato');
    renderAdminHome(container, ctx2);
    container.querySelectorAll('.admin-delete-album')[0].click();
    await Promise.resolve();
    expect(ctx2.api.deleteAlbum).not.toHaveBeenCalled();
  });
});
