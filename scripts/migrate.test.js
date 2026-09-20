// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { parseHeroRef, albumsToRuntime, siteToRuntime } from './migrate.js';

describe('parseHeroRef', () => {
  it('estrae album e nome dagli URL R2', () => {
    expect(parseHeroRef('https://pub-x.r2.dev/sport/4x5-crop-7302.webp'))
      .toEqual({ album: 'sport', name: '4x5-crop-7302.webp' });
  });
  it('URL senza due segmenti o vuoto → null', () => {
    expect(parseHeroRef('https://pub-x.r2.dev/solo.webp')).toBeNull();
    expect(parseHeroRef('')).toBeNull();
    expect(parseHeroRef(undefined)).toBeNull();
  });
});

describe('albumsToRuntime', () => {
  it('converte coverUrl assoluto in coverName relativo', () => {
    const legacy = [{ slug: 'sport', title: 'Sport', description: 'd', coverUrl: 'https://pub-x.r2.dev/sport/c.webp' }];
    expect(albumsToRuntime(legacy)).toEqual({
      albums: [{ slug: 'sport', title: 'Sport', description: 'd', coverName: 'c.webp' }],
    });
  });
  it('coverUrl assente → coverName null; description assente → stringa vuota', () => {
    expect(albumsToRuntime([{ slug: 'x', title: 'X' }]))
      .toEqual({ albums: [{ slug: 'x', title: 'X', description: '', coverName: null }] });
  });
});

describe('siteToRuntime', () => {
  it('costruisce site.json con hero referenziale e social puliti', () => {
    const cfg = {
      name: 'Davide', bio: 'Bio',
      heroImageUrl: 'https://pub-x.r2.dev/sport/hero.webp',
      social: { instagram: 'https://instagram.com/x', vuoto: undefined },
    };
    expect(siteToRuntime(cfg)).toEqual({
      name: 'Davide', bio: 'Bio',
      hero: { album: 'sport', name: 'hero.webp' },
      social: { instagram: 'https://instagram.com/x' },
    });
  });
});
