import { describe, it, expect, beforeEach } from 'vitest';
import { renderSkeletons, renderGrid, aspectRatio } from './PhotoGrid.js';

const photos = [
  { name: '01.jpg', gridUrl: 'https://example.com/g1.jpg', fullUrl: 'https://example.com/f1.jpg', width: 800, height: 600 },
  { name: '02.jpg', gridUrl: 'https://example.com/g2.jpg', fullUrl: 'https://example.com/f2.jpg', width: 600, height: 800 },
];

describe('aspectRatio', () => {
  it('formatta width/height validi come stringa CSS', () => {
    expect(aspectRatio(800, 600)).toBe('800 / 600');
  });

  it('fallback a 1/1 con dimensioni non valide', () => {
    expect(aspectRatio(undefined, undefined)).toBe('1 / 1');
    expect(aspectRatio(NaN, 600)).toBe('1 / 1');
    expect(aspectRatio(0, 600)).toBe('1 / 1');
    expect(aspectRatio(-4, 3)).toBe('1 / 1');
  });
});

describe('renderSkeletons', () => {
  let container;
  beforeEach(() => { container = document.createElement('div'); });

  it('renders the requested number of skeletons', () => {
    renderSkeletons(container, 5);
    expect(container.querySelectorAll('.photo-grid__skeleton').length).toBe(5);
  });

  it('clears previous content before rendering', () => {
    container.innerHTML = '<p>old</p>';
    renderSkeletons(container, 3);
    expect(container.querySelector('p')).toBeNull();
  });

  it('renderizza esattamente count skeleton (fino a max 12)', () => {
    renderSkeletons(container, 6);
    expect(container.querySelectorAll('.photo-grid__skeleton').length).toBe(6);
    renderSkeletons(container, 20);
    expect(container.querySelectorAll('.photo-grid__skeleton').length).toBe(12);
  });

  it('imposta aspect-ratio inline su ogni skeleton', () => {
    renderSkeletons(container, 3);
    [...container.querySelectorAll('.photo-grid__skeleton')].forEach(div =>
      expect(div.style.aspectRatio).not.toBe('')
    );
  });
});

describe('renderGrid', () => {
  let container;
  beforeEach(() => { container = document.createElement('div'); });

  it('renders one figure per photo', () => {
    renderGrid(container, photos, () => {});
    expect(container.querySelectorAll('.photo-grid__item').length).toBe(2);
  });

  it('sets img src to gridUrl', () => {
    renderGrid(container, photos, () => {});
    const imgs = container.querySelectorAll('img');
    expect(imgs[0].src).toBe('https://example.com/g1.jpg');
    expect(imgs[1].src).toBe('https://example.com/g2.jpg');
  });

  it('sets loading="lazy" on all images', () => {
    renderGrid(container, photos, () => {});
    [...container.querySelectorAll('img')].forEach(img =>
      expect(img.loading).toBe('lazy')
    );
  });

  it('imposta aspect-ratio inline da width/height della foto', () => {
    renderGrid(container, photos, () => {});
    const imgs = container.querySelectorAll('img');
    expect(imgs[0].style.aspectRatio).toBe('800 / 600');
    expect(imgs[1].style.aspectRatio).toBe('600 / 800');
  });

  it('calls onPhotoClick with the correct index on figure click', () => {
    const clicks = [];
    renderGrid(container, photos, i => clicks.push(i));
    container.querySelectorAll('.photo-grid__item')[1].click();
    expect(clicks).toEqual([1]);
  });

  it('clears previous content before rendering', () => {
    container.innerHTML = '<p>old</p>';
    renderGrid(container, photos, () => {});
    expect(container.querySelector('p')).toBeNull();
  });
});
