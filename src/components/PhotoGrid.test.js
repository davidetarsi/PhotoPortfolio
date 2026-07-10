import { describe, it, expect, beforeEach } from 'vitest';
import { renderSkeletons, renderGrid } from './PhotoGrid.js';

const photos = [
  { name: '01.jpg', gridUrl: 'https://example.com/g1.jpg', fullUrl: 'https://example.com/f1.jpg' },
  { name: '02.jpg', gridUrl: 'https://example.com/g2.jpg', fullUrl: 'https://example.com/f2.jpg' },
];

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

  it('non imposta inline height sugli skeleton (gestita dal CSS)', () => {
    renderSkeletons(container, 3);
    [...container.querySelectorAll('.photo-grid__skeleton')].forEach(el => {
      expect(el.style.height).toBe('');
    });
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
