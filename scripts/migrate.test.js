// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { albumsToRuntime, siteToRuntime } from './migrate.js';

describe('albumsToRuntime', () => {
  it('legge coverName direttamente', () => {
    const legacy = [{ slug: 'sport', title: 'Sport', description: 'd', coverName: 'c.webp' }];
    expect(albumsToRuntime(legacy)).toEqual({
      albums: [{ slug: 'sport', title: 'Sport', description: 'd', coverName: 'c.webp' }],
    });
  });
  it('coverName assente → coverName null; description assente → stringa vuota', () => {
    expect(albumsToRuntime([{ slug: 'x', title: 'X' }]))
      .toEqual({ albums: [{ slug: 'x', title: 'X', description: '', coverName: null }] });
  });
  it('coverName assente diventa null', () => {
    const out = albumsToRuntime([{ slug: 'a', title: 'A', description: '' }]);
    expect(out.albums[0].coverName).toBeNull();
  });
});

describe('siteToRuntime', () => {
  it('costruisce site.json con hero referenziale e social puliti', () => {
    const cfg = {
      name: 'Davide', bio: 'Bio',
      heroImage: { album: 'sport', name: 'hero.webp' },
      social: { instagram: 'https://instagram.com/x', vuoto: undefined },
    };
    expect(siteToRuntime(cfg)).toEqual({
      name: 'Davide', bio: 'Bio',
      hero: { album: 'sport', name: 'hero.webp' },
      social: { instagram: 'https://instagram.com/x' },
    });
  });
});
