import { describe, it, expect } from 'vitest';
import { resolveSiteContent, albumsToCards } from './home-logic.js';

const BUILD = { name: 'Build Name', bio: 'Build bio', heroImageUrl: 'https://pub.r2.dev/sport/hero.webp', social: { x: 'y' }, r2PublicUrl: 'https://pub.r2.dev' };

describe('resolveSiteContent', () => {
  it('site.json ok → usa i dati runtime e costruisce heroUrl dalla referenza', () => {
    const site = { name: 'Runtime', bio: 'B', hero: { album: 'sport', name: 'a.webp' }, social: {} };
    expect(resolveSiteContent({ ok: true, data: site }, BUILD)).toEqual({
      name: 'Runtime', bio: 'B', social: {}, heroUrl: 'https://pub.r2.dev/sport/a.webp',
    });
  });
  it('hero null nel runtime → heroUrl null (scelta esplicita, non fallback)', () => {
    const site = { name: 'R', bio: '', hero: null, social: {} };
    expect(resolveSiteContent({ ok: true, data: site }, BUILD).heroUrl).toBeNull();
  });
  it('site.json KO → fallback silenzioso ai valori di build', () => {
    expect(resolveSiteContent({ ok: false, error: 'NETWORK' }, BUILD)).toEqual({
      name: 'Build Name', bio: 'Build bio', social: { x: 'y' }, heroUrl: 'https://pub.r2.dev/sport/hero.webp',
    });
  });
});

describe('albumsToCards', () => {
  it('mappa coverName → coverUrl; null → null', () => {
    const albums = [
      { slug: 'sport', title: 'Sport', description: 'd', coverName: 'c.webp' },
      { slug: 'x', title: 'X', description: '', coverName: null },
    ];
    expect(albumsToCards(albums, 'https://pub.r2.dev')).toEqual([
      { slug: 'sport', title: 'Sport', description: 'd', coverUrl: 'https://pub.r2.dev/sport/c.webp' },
      { slug: 'x', title: 'X', description: '', coverUrl: null },
    ]);
  });
});
