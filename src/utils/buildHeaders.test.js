import { describe, it, expect } from 'vitest';
import { buildHeaders } from './buildHeaders.js';

const CONFIG = {
  vars: { R2_PUBLIC_URL: 'https://pub-aaa.r2.dev' },
  env: { staging: { vars: { R2_PUBLIC_URL: 'https://pub-bbb.r2.dev' } } },
};

describe('buildHeaders', () => {
  it('autorizza entrambe le origini R2 in img-src e connect-src', () => {
    const h = buildHeaders(CONFIG);
    expect(h).toContain('https://pub-aaa.r2.dev');
    expect(h).toContain('https://pub-bbb.r2.dev');
    const csp = h.split('\n').find(r => r.includes('Content-Security-Policy'));
    expect(csp).toMatch(/img-src[^;]*pub-aaa/);
    expect(csp).toMatch(/connect-src[^;]*pub-bbb/);
  });

  it('non ripete l origine quando prod e staging coincidono', () => {
    const h = buildHeaders({
      vars: { R2_PUBLIC_URL: 'https://pub-aaa.r2.dev' },
      env: { staging: { vars: { R2_PUBLIC_URL: 'https://pub-aaa.r2.dev' } } },
    });
    const csp = h.split('\n').find(r => r.includes('Content-Security-Policy'));
    expect(csp.match(/pub-aaa\.r2\.dev/g)).toHaveLength(2); // una in img-src, una in connect-src
  });

  it('mantiene l endpoint del form e le direttive di irrigidimento', () => {
    const h = buildHeaders(CONFIG);
    expect(h).toContain('https://api.web3forms.com');
    expect(h).toContain("frame-ancestors 'none'");
    expect(h).toContain('X-Content-Type-Options: nosniff');
    expect(h).toContain('Strict-Transport-Security');
  });

  it('funziona anche senza blocco staging', () => {
    const h = buildHeaders({ vars: { R2_PUBLIC_URL: 'https://pub-aaa.r2.dev' } });
    expect(h).toContain('https://pub-aaa.r2.dev');
  });

  it('fallisce con messaggio parlante se manca R2_PUBLIC_URL', () => {
    expect(() => buildHeaders({ vars: {} })).toThrow(/R2_PUBLIC_URL/);
  });

  it('rifiuta un segnaposto non sostituito', () => {
    expect(() => buildHeaders({ vars: { R2_PUBLIC_URL: 'https://pub-xxxxxxxx.r2.dev' } }))
      .toThrow(/segnaposto/);
  });
});
