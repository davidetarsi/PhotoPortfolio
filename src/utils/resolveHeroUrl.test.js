import { describe, it, expect } from 'vitest';
import { resolveHeroUrl } from './resolveHeroUrl.js';

describe('resolveHeroUrl', () => {
  it('costruisce un URL dal riferimento hero e dal dominio pubblico', () => {
    const heroImage = { album: 'natura', name: 'montagna.webp' };
    const r2PublicUrl = 'https://img.example.com';
    const url = resolveHeroUrl(heroImage, r2PublicUrl);
    expect(url).toBe('https://img.example.com/natura/montagna.webp');
  });

  it('toglie il trailing slash dal dominio prima di costruire l\'URL', () => {
    const heroImage = { album: 'street', name: 'strada.webp' };
    const r2PublicUrl = 'https://img.example.com/';
    const url = resolveHeroUrl(heroImage, r2PublicUrl);
    expect(url).toBe('https://img.example.com/street/strada.webp');
  });

  it('ritorna null se heroImage è null', () => {
    const url = resolveHeroUrl(null, 'https://img.example.com');
    expect(url).toBeNull();
  });

  it('ritorna null se heroImage è undefined', () => {
    const url = resolveHeroUrl(undefined, 'https://img.example.com');
    expect(url).toBeNull();
  });

  it('ritorna null se heroImage non ha album o name', () => {
    expect(resolveHeroUrl({ album: 'natura' }, 'https://img.example.com')).toBeNull();
    expect(resolveHeroUrl({ name: 'foto.webp' }, 'https://img.example.com')).toBeNull();
    expect(resolveHeroUrl({}, 'https://img.example.com')).toBeNull();
  });

  it.each([undefined, null, ''])('ritorna null se manca il dominio pubblico (%s)', r2PublicUrl => {
    expect(resolveHeroUrl({ album: 'natura', name: 'foto.webp' }, r2PublicUrl)).toBeNull();
  });
});
