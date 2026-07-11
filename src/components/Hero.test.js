import { describe, it, expect, beforeEach } from 'vitest';
import { renderHero } from './Hero.js';

const texts = { landing: { heroSubtitle: 'Sottotitolo.' } };

describe('renderHero', () => {
  let container;
  beforeEach(() => { container = document.createElement('div'); });

  it('renderizza titolo, sottotitolo e immagine quando heroUrl è presente', () => {
    renderHero(container, { name: 'Davide', heroUrl: 'https://x/img.webp' }, texts);
    expect(container.querySelector('.hero__title').textContent).toBe('Davide');
    expect(container.querySelector('.hero__subtitle').textContent).toBe('Sottotitolo.');
    expect(container.querySelector('.hero__bg').getAttribute('src')).toBe('https://x/img.webp');
  });

  it('senza heroUrl non renderizza il tag img', () => {
    renderHero(container, { name: 'Davide', heroUrl: null }, texts);
    expect(container.querySelector('.hero__bg')).toBeNull();
    expect(container.querySelector('.hero__title').textContent).toBe('Davide');
  });
});
