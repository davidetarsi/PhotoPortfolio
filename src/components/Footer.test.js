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
});
