import { describe, it, expect } from 'vitest';
import { validateSiteConfig } from './validateConfig.js';

const ok = { name: 'Davide', provider: 'r2', r2PublicUrl: 'https://pub.r2.dev' };

describe('validateSiteConfig', () => {
  it('accetta config valida', () => {
    expect(() => validateSiteConfig(ok)).not.toThrow();
  });
  it('rifiuta name vuoto, provider ignoto, r2PublicUrl mancante', () => {
    expect(() => validateSiteConfig({ ...ok, name: ' ' })).toThrow(/name/);
    expect(() => validateSiteConfig({ ...ok, provider: 'drive' })).toThrow(/provider/);
    expect(() => validateSiteConfig({ ...ok, r2PublicUrl: '' })).toThrow(/r2PublicUrl/);
    expect(() => validateSiteConfig(null)).toThrow(/siteConfig/);
  });
});
