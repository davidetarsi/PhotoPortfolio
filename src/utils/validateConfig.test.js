import { describe, it, expect } from 'vitest';
import { validateConfig } from './validateConfig.js';

const validSiteConfig = {
  name: 'Fotografo',
  provider: 'googleDrive',
  driveApiKey: 'AIzaSy123',
};

const validAlbums = [
  { slug: 'paesaggi', title: 'Paesaggi' },
];

describe('validateConfig', () => {
  it('non lancia con config valida (googleDrive)', () => {
    expect(() => validateConfig(validSiteConfig, validAlbums)).not.toThrow();
  });

  it('lancia se siteConfig.name è vuoto', () => {
    expect(() => validateConfig({ ...validSiteConfig, name: '' }, validAlbums))
      .toThrow('[validateConfig] siteConfig.name è obbligatorio');
  });

  it('lancia se provider non riconosciuto', () => {
    expect(() => validateConfig({ ...validSiteConfig, provider: 'unknown' }, validAlbums))
      .toThrow('[validateConfig] siteConfig.provider "unknown" non riconosciuto');
  });

  it('lancia se driveApiKey mancante con provider googleDrive', () => {
    expect(() => validateConfig({ ...validSiteConfig, driveApiKey: '' }, validAlbums))
      .toThrow('[validateConfig] siteConfig.driveApiKey è obbligatorio');
  });

  it('lancia se albums è array vuoto', () => {
    expect(() => validateConfig(validSiteConfig, []))
      .toThrow('[validateConfig] albums deve essere un array non vuoto');
  });

  it('lancia su slug duplicati', () => {
    const dupes = [
      { slug: 'test', title: 'Test' },
      { slug: 'test', title: 'Test 2' },
    ];
    expect(() => validateConfig(validSiteConfig, dupes))
      .toThrow('[validateConfig] slug duplicato: "test"');
  });

  it('lancia se slug non valido (spazi o maiuscole)', () => {
    const badSlug = [{ slug: 'Test Album', title: 'T' }];
    expect(() => validateConfig(validSiteConfig, badSlug))
      .toThrow('[validateConfig] albums[0].slug "Test Album" non valido');
  });

  it('lancia con messaggio prefissato se siteConfig è null', () => {
    expect(() => validateConfig(null, validAlbums))
      .toThrow('[validateConfig] siteConfig non valido');
  });

  it('lancia errore se provider è "r2" e r2PublicUrl manca', () => {
    expect(() => validateConfig(
      { name: 'Test', provider: 'r2', r2PublicUrl: '' },
      [{ slug: 'album-1', title: 'A' }]
    )).toThrow('r2PublicUrl è obbligatorio');
  });

  it('non lancia errore per configurazione r2 valida', () => {
    expect(() => validateConfig(
      { name: 'Test', provider: 'r2', r2PublicUrl: 'https://pub-abc.r2.dev' },
      [{ slug: 'album-1', title: 'A' }]
    )).not.toThrow();
  });
});
