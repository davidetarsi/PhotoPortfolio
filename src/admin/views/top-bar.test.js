import { describe, it, expect, vi, beforeEach } from 'vitest';
import { topBarHtml, attachTopBar } from './top-bar.js';

function makeCtx(albums = []) {
  return {
    albums,
    api: { putAlbums: vi.fn(async () => {}) },
    navigate: vi.fn(),
    deps: {
      prompt: vi.fn(() => 'Nuovo album'),
      alert: vi.fn(),
    },
  };
}

describe('topBarHtml', () => {
  it('showBackLink:true include il link "Tutti gli album"', () => {
    const container = document.createElement('div');
    container.innerHTML = topBarHtml({ showBackLink: true });
    expect(container.querySelector('.admin-back')).not.toBeNull();
  });

  it('showBackLink:false non include il link', () => {
    const container = document.createElement('div');
    container.innerHTML = topBarHtml({ showBackLink: false });
    expect(container.querySelector('.admin-back')).toBeNull();
  });

  it('include sempre il bottone "+ Nuovo album"', () => {
    const container = document.createElement('div');
    container.innerHTML = topBarHtml({ showBackLink: false });
    expect(container.querySelector('.admin-topbar__new-album')).not.toBeNull();
  });
});

describe('attachTopBar', () => {
  let container;
  beforeEach(() => {
    container = document.createElement('div');
    container.innerHTML = topBarHtml({ showBackLink: false });
    document.body.replaceChildren(container);
  });

  it('click su "+ Nuovo album": prompt valido → createAlbum + navigate allo slug', async () => {
    const ctx = makeCtx([]);
    attachTopBar(container, ctx);
    container.querySelector('.admin-topbar__new-album').click();
    await new Promise(r => setTimeout(r, 0));
    expect(ctx.api.putAlbums).toHaveBeenCalledWith([
      { slug: 'nuovo-album', title: 'Nuovo album', description: '', coverName: null },
    ]);
    expect(ctx.navigate).toHaveBeenCalledWith('#/album/nuovo-album');
  });

  it('prompt annullato (null): nessuna chiamata API, nessuna navigazione', async () => {
    const ctx = makeCtx([]);
    ctx.deps.prompt = vi.fn(() => null);
    attachTopBar(container, ctx);
    container.querySelector('.admin-topbar__new-album').click();
    await new Promise(r => setTimeout(r, 0));
    expect(ctx.api.putAlbums).not.toHaveBeenCalled();
    expect(ctx.navigate).not.toHaveBeenCalled();
  });

  it('titolo non valido: deps.alert riceve il messaggio di errore, nessuna navigazione', async () => {
    const ctx = makeCtx([{ slug: 'sport', title: 'Sport', description: '', coverName: null }]);
    ctx.deps.prompt = vi.fn(() => 'Sport');
    attachTopBar(container, ctx);
    container.querySelector('.admin-topbar__new-album').click();
    await new Promise(r => setTimeout(r, 0));
    expect(ctx.deps.alert).toHaveBeenCalledWith('Esiste già un album "sport".');
    expect(ctx.navigate).not.toHaveBeenCalled();
  });

  it('API rifiuta (errore rete): deps.alert riceve messaggio di fallback, nessuna navigazione', async () => {
    const ctx = makeCtx([]);
    ctx.api.putAlbums = vi.fn(async () => { throw new Error('Network error'); });
    attachTopBar(container, ctx);
    container.querySelector('.admin-topbar__new-album').click();
    await new Promise(r => setTimeout(r, 0));
    expect(ctx.deps.alert).toHaveBeenCalledWith('Impossibile creare l\'album. Riprova.');
    expect(ctx.navigate).not.toHaveBeenCalled();
  });
});
