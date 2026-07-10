import { describe, it, expect, beforeEach } from 'vitest';
import { renderSkeletons, renderGrid, layoutMasonry } from './PhotoGrid.js';

const photos = [
  { name: '01.jpg', gridUrl: 'https://example.com/g1.jpg', fullUrl: 'https://example.com/f1.jpg', width: 800, height: 600 },
  { name: '02.jpg', gridUrl: 'https://example.com/g2.jpg', fullUrl: 'https://example.com/f2.jpg', width: 600, height: 800 },
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

  it('renderizza esattamente count skeleton (fino a max 12)', () => {
    renderSkeletons(container, 6);
    expect(container.querySelectorAll('.photo-grid__skeleton').length).toBe(6);
    renderSkeletons(container, 20);
    expect(container.querySelectorAll('.photo-grid__skeleton').length).toBe(12);
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

describe('layoutMasonry', () => {
  // Container di 101px → colWidth = (101 - 1) / 2 = 50px, gap = 1px, col1.x = 51px
  const W = 101;

  it('restituisce [] se containerWidth <= 0', () => {
    expect(layoutMasonry([{ width: 4, height: 3 }], 0)).toEqual([]);
    expect(layoutMasonry([{ width: 4, height: 3 }], -10)).toEqual([]);
  });

  it('restituisce [] se items è vuoto', () => {
    expect(layoutMasonry([], W)).toEqual([]);
  });

  it('il primo item va sempre a colonna 0 (x=0)', () => {
    const [p] = layoutMasonry([{ width: 4, height: 3 }], W);
    expect(p.x).toBe(0);
    expect(p.y).toBe(0);
  });

  it('il secondo item va a colonna 1 (x = colWidth + gap)', () => {
    const [, p1] = layoutMasonry([
      { width: 4, height: 3 },
      { width: 4, height: 3 },
    ], W);
    expect(p1.x).toBeCloseTo(51, 5); // 50 + 1
    expect(p1.y).toBe(0);
  });

  it('il terzo item va alla colonna più corta (greedy)', () => {
    // item0: portrait 1:2 → h = 100px → colonna 0, colY[0] = 101
    // item1: portrait 1:2 → h = 100px → colonna 1, colY[1] = 101
    // item2: → entrambe uguali → va a colonna 0 (indexOf restituisce prima occorrenza del min)
    const items = [
      { width: 1, height: 2 }, // h = 2/1 * 50 = 100
      { width: 1, height: 2 }, // h = 100
      { width: 4, height: 3 }, // h = 3/4 * 50 = 37.5
    ];
    const placed = layoutMasonry(items, W);
    expect(placed[2].x).toBe(0); // colonna 0
    expect(placed[2].y).toBeCloseTo(101, 5); // 100 + 1
  });

  it('calcola h correttamente dall\'aspect ratio', () => {
    // colWidth = 50, item portrait 2:3 → h = (3/2) * 50 = 75
    const [p] = layoutMasonry([{ width: 2, height: 3 }], W);
    expect(p.h).toBeCloseTo(75, 5);
    expect(p.w).toBeCloseTo(50, 5);
  });

  it('numCols=1 impila tutti in una colonna', () => {
    const items = [
      { width: 4, height: 3 },
      { width: 4, height: 3 },
    ];
    const placed = layoutMasonry(items, W, 1);
    expect(placed[0].x).toBe(0);
    expect(placed[1].x).toBe(0);
    // w = containerWidth intero
    expect(placed[0].w).toBeCloseTo(W, 5);
    // il secondo item è sotto il primo
    expect(placed[1].y).toBeGreaterThan(placed[0].h);
  });

  it('propaga le proprietà originali dell\'item nel risultato', () => {
    const item = { name: 'foto.webp', gridUrl: 'http://x/foto.webp', fullUrl: 'http://x/foto.webp', width: 4, height: 3 };
    const [p] = layoutMasonry([item], W);
    expect(p.name).toBe('foto.webp');
    expect(p.gridUrl).toBe('http://x/foto.webp');
  });
});
