import { describe, it, expect } from 'vitest';
import { injectSiteMeta } from './injectSiteMeta.js';

const config = {
  name: 'Nome Fotografo',
  bio: 'Una breve descrizione.',
  language: 'it',
  heroImageUrl: 'https://example.com/hero.jpg',
};

describe('injectSiteMeta', () => {
  it('sostituisce tutte le occorrenze di {{SITE_NAME}}', () => {
    const html = '<title>{{SITE_NAME}}</title><meta property="og:title" content="{{SITE_NAME}}" />';
    const result = injectSiteMeta(html, config);
    expect(result).toBe('<title>Nome Fotografo</title><meta property="og:title" content="Nome Fotografo" />');
  });

  it('sostituisce {{SITE_BIO}}, {{SITE_LANG}} e {{SITE_IMAGE}}', () => {
    const html = '<html lang="{{SITE_LANG}}"><meta name="description" content="{{SITE_BIO}}" /><meta property="og:image" content="{{SITE_IMAGE}}" />';
    const result = injectSiteMeta(html, config);
    expect(result).toContain('lang="it"');
    expect(result).toContain('content="Una breve descrizione."');
    expect(result).toContain('content="https://example.com/hero.jpg"');
  });

  it('esegue escape dei caratteri HTML nei valori', () => {
    const html = '<title>{{SITE_NAME}}</title>';
    const result = injectSiteMeta(html, { ...config, name: 'Foto & "Video" <Studio>' });
    expect(result).toBe('<title>Foto &amp; &quot;Video&quot; &lt;Studio&gt;</title>');
  });

  it('rimuove i meta tag con content vuoto dopo la sostituzione', () => {
    const html = [
      '<meta property="og:title" content="{{SITE_NAME}}" />',
      '<meta property="og:image" content="{{SITE_IMAGE}}" />',
      '<meta name="description" content="{{SITE_BIO}}" />',
    ].join('\n');
    const result = injectSiteMeta(html, { ...config, heroImageUrl: '' });
    expect(result).toContain('og:title');
    expect(result).not.toContain('og:image');
    expect(result).toContain('description');
  });

  it('mantiene i meta tag quando il valore è presente', () => {
    const html = '<meta property="og:image" content="{{SITE_IMAGE}}" />';
    const result = injectSiteMeta(html, config);
    expect(result).toContain('content="https://example.com/hero.jpg"');
  });

  it('tratta i valori mancanti nel config come stringa vuota', () => {
    const html = '<meta name="description" content="{{SITE_BIO}}" />';
    const result = injectSiteMeta(html, { name: 'X' });
    expect(result).not.toContain('description');
    expect(result).not.toContain('{{SITE_BIO}}');
  });
});
