import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetchSite: vi.fn(),
  fetchAlbums: vi.fn(),
  fetchManifest: vi.fn(),
  fetchConfig: vi.fn(),
}));

vi.mock('../providers/data.js', () => mocks);
vi.mock('../utils/validateConfig.js', () => ({ validateSiteConfig: vi.fn() }));
vi.mock('../components/Nav.js', () => ({ renderNav: vi.fn() }));
vi.mock('../components/Footer.js', () => ({ renderFooter: vi.fn() }));
vi.mock('../components/PhotoGrid.js', () => ({ renderSkeletons: vi.fn(), renderGrid: vi.fn() }));
vi.mock('../components/Lightbox.js', () => ({ createLightbox: vi.fn() }));

describe('album bootstrap from the build seed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    window.history.replaceState({}, '', '/nome-album');
    document.body.innerHTML = `
      <nav id="site-nav"></nav>
      <h1 id="album-title"></h1>
      <div id="photo-grid"></div>
      <footer id="site-footer"></footer>
    `;
    mocks.fetchSite.mockResolvedValue({
      ok: true,
      data: { name: 'Runtime', bio: '', hero: null, social: {} },
    });
    mocks.fetchAlbums.mockResolvedValue({ ok: false, error: 'NOT_FOUND' });
    mocks.fetchManifest.mockResolvedValue({ ok: false, error: 'NOT_FOUND' });
    mocks.fetchConfig.mockResolvedValue({
      ok: true,
      data: { r2PublicUrl: 'https://pub-test.r2.dev' },
    });
  });

  it('recognizes the seeded album and renders the empty-album state', async () => {
    await import('./album.js');

    expect(document.getElementById('album-title').textContent).toBe('Titolo Album');
    expect(document.querySelector('.photo-grid__error')).not.toBeNull();
    expect(document.querySelector('#photo-grid a[href="/"]')).toBeNull();
  });

  it('shows an explicit no-image state when the manifest exists but the public URL is absent', async () => {
    mocks.fetchConfig.mockResolvedValue({ ok: false, error: 'NOT_FOUND' });
    mocks.fetchManifest.mockResolvedValue({
      ok: true,
      data: [{ name: 'photo.webp', width: 100, height: 100 }],
    });

    await import('./album.js');

    expect(document.querySelector('.photo-grid__error').textContent)
      .toBe('Le immagini non sono disponibili senza un URL pubblico R2.');
    expect(document.querySelector('#photo-grid img')).toBeNull();
  });
});
