import { describe, it, expect } from 'vitest';
import { validateConfig } from './validateConfig.js';

const validSiteConfig = {
  name: 'Fotografo',
  provider: 'googleDrive',
  driveApiKey: 'AIzaSy123',
};

const validAlbums = [
  { slug: 'paesaggi', title: 'Paesaggi', driveFolderId: 'abc123', cover: null },
];

describe('validateConfig', () => {
  it('non lancia con config valida', () => {
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
      { slug: 'test', title: 'Test', driveFolderId: 'abc', cover: null },
      { slug: 'test', title: 'Test 2', driveFolderId: 'def', cover: null },
    ];
    expect(() => validateConfig(validSiteConfig, dupes))
      .toThrow('[validateConfig] slug duplicato: "test"');
  });

  it('lancia se slug non valido (spazi o maiuscole)', () => {
    const badSlug = [{ slug: 'Test Album', title: 'T', driveFolderId: 'abc', cover: null }];
    expect(() => validateConfig(validSiteConfig, badSlug))
      .toThrow('[validateConfig] albums[0].slug "Test Album" non valido');
  });

  it('lancia se albums[0].driveFolderId è vuoto', () => {
    const noFolder = [{ slug: 'test', title: 'Test', driveFolderId: '', cover: null }];
    expect(() => validateConfig(validSiteConfig, noFolder))
      .toThrow('[validateConfig] albums[0].driveFolderId è obbligatorio');
  });
});
