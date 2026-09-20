import { describe, it, expect, beforeEach } from 'vitest';
import { renderFooter } from './Footer.js';

describe('renderFooter', () => {
  let container;
  beforeEach(() => { container = document.createElement('div'); });

  it('renders the copyright text from texts.footer', () => {
    renderFooter(container, { footer: { copyright: '© 2026' } });
    expect(container.querySelector('.site-footer__copyright').textContent).toBe('© 2026');
  });

  it('renders a footer element', () => {
    renderFooter(container, { footer: { copyright: '© 2026' } });
    expect(container.querySelector('footer')).not.toBeNull();
  });

  it('senza social, nessun link viene renderizzato', () => {
    renderFooter(container, { footer: { copyright: '© 2026' } });
    expect(container.querySelector('.site-footer__links')).toBeNull();
  });

  it('con social valorizzati, renderizza un link per ciascuno con href corretto', () => {
    renderFooter(container, { footer: { copyright: '© 2026' } }, { instagram: 'https://instagram.com/x' });
    const links = container.querySelectorAll('.site-footer__link');
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe('https://instagram.com/x');
    expect(links[0].textContent).toBe('Instagram');
  });

  it('ignora chiavi social con valore vuoto o non-stringa', () => {
    renderFooter(container, { footer: { copyright: '© 2026' } }, { instagram: '', twitter: '   ' });
    expect(container.querySelector('.site-footer__links')).toBeNull();
  });
});
