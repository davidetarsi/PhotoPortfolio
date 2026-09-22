import { describe, it, expect } from 'vitest';
import { validateSiteConfig } from './validateConfig.js';

const ok = { name: 'Davide', provider: 'r2', r2PublicUrl: 'https://pub.r2.dev' };

describe('validateSiteConfig', () => {
  it('accetta config valida', () => {
    expect(() => validateSiteConfig(ok)).not.toThrow();
  });
  it('accetta URL R2 di build omesso perché la configurazione runtime lo possiede', () => {
    expect(() => validateSiteConfig({ ...ok, r2PublicUrl: undefined })).not.toThrow();
    expect(() => validateSiteConfig({ ...ok, r2PublicUrl: '' })).not.toThrow();
  });
  it('rifiuta name vuoto, provider ignoto e config invalida', () => {
    expect(() => validateSiteConfig({ ...ok, name: ' ' })).toThrow(/name/);
    expect(() => validateSiteConfig({ ...ok, provider: 'drive' })).toThrow(/provider/);
    expect(() => validateSiteConfig(null)).toThrow(/siteConfig/);
  });
});
