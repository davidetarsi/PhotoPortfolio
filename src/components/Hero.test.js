import { describe, it, expect, beforeEach } from 'vitest';
import { renderHero } from './Hero.js';

const siteConfig = { name: 'Mario Rossi', heroImageUrl: '' };
const texts = { landing: { heroSubtitle: 'Portfolio fotografico.' } };

describe('renderHero', () => {
  let container;
  beforeEach(() => { container = document.createElement('section'); });

  it('renders background image with setAttribute when heroImageUrl is set', () => {
    renderHero(container, { ...siteConfig, heroImageUrl: 'https://example.com/photo.jpg' }, texts);
    const img = container.querySelector('.hero__bg');
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe('https://example.com/photo.jpg');
  });

  it('renders no image element when heroImageUrl is empty', () => {
    renderHero(container, { ...siteConfig, heroImageUrl: '' }, texts);
    expect(container.querySelector('.hero__bg')).toBeNull();
  });

  it('renders name and subtitle from config', () => {
    renderHero(container, siteConfig, texts);
    expect(container.querySelector('.hero__title').textContent).toBe('Mario Rossi');
    expect(container.querySelector('.hero__subtitle').textContent).toBe('Portfolio fotografico.');
  });
});
