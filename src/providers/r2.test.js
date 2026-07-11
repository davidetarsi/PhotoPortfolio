import { describe, it, expect } from 'vitest';
import { photoUrl, photosFromManifest } from './r2.js';

describe('photoUrl', () => {
  it('costruisce l\'URL e tollera lo slash finale nella base', () => {
    expect(photoUrl('https://pub.r2.dev', 'sport', 'a.webp')).toBe('https://pub.r2.dev/sport/a.webp');
    expect(photoUrl('https://pub.r2.dev/', 'sport', 'a.webp')).toBe('https://pub.r2.dev/sport/a.webp');
  });
});

describe('photosFromManifest', () => {
  it('mappa entries in photos con gridUrl/fullUrl', () => {
    const photos = photosFromManifest([{ name: 'a.webp', width: 10, height: 20 }], 'sport', 'https://pub.r2.dev');
    expect(photos).toEqual([{
      name: 'a.webp', width: 10, height: 20,
      gridUrl: 'https://pub.r2.dev/sport/a.webp', fullUrl: 'https://pub.r2.dev/sport/a.webp',
    }]);
  });
  it('array vuoto → array vuoto', () => {
    expect(photosFromManifest([], 'sport', 'https://pub.r2.dev')).toEqual([]);
  });
});
