import { describe, it, expect, beforeEach } from 'vitest';
import { renderNav } from './Nav.js';

describe('renderNav', () => {
  let container;
  beforeEach(() => { container = document.createElement('div'); });

  it('renders brand name in original case (uppercase done via CSS)', () => {
    renderNav(container, { name: 'Fotografo Test' }, { nav: { contattiLabel: 'Contatti' } });
    expect(container.querySelector('.site-nav__brand').textContent).toBe('Fotografo Test');
  });

  it('brand links to /', () => {
    renderNav(container, { name: 'F' }, { nav: { contattiLabel: 'C' } });
    expect(container.querySelector('.site-nav__brand').getAttribute('href')).toBe('/');
  });

  it('renders the contatti label text from texts.nav', () => {
    renderNav(container, { name: 'F' }, { nav: { contattiLabel: 'Scrivimi' } });
    const links = [...container.querySelectorAll('.site-nav__links a')];
    expect(links[0].textContent).toBe('Scrivimi');
  });

  it('contatti link points to /contatti.html', () => {
    renderNav(container, { name: 'F' }, { nav: { contattiLabel: 'C' } });
    expect(container.querySelector('.site-nav__links a').getAttribute('href')).toBe('/contatti.html');
  });
});
