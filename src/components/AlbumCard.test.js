import { describe, it, expect } from 'vitest';
import { createAlbumCard } from './AlbumCard.js';

const album = {
  slug: 'paesaggi',
  title: 'Paesaggi',
  description: 'Montagne e mari.',
  coverUrl: 'https://example.com/cover.jpg',
};

describe('createAlbumCard', () => {
  it('returns an anchor element', () => {
    const el = createAlbumCard(album);
    expect(el.tagName).toBe('A');
  });

  it('genera un link con href /<slug>', () => {
    const card = createAlbumCard({ slug: 'sport', title: 'Sport', coverUrl: '' });
    expect(card.getAttribute('href')).toBe('/sport');
  });

  it('renders the album title', () => {
    const el = createAlbumCard(album);
    expect(el.querySelector('.album-card__title').textContent).toBe('Paesaggi');
  });

  it('renders cover image when provided', () => {
    const el = createAlbumCard(album);
    expect(el.querySelector('.album-card__img').getAttribute('src'))
      .toBe('https://example.com/cover.jpg');
  });

  it('renders description when provided', () => {
    const el = createAlbumCard(album);
    expect(el.querySelector('.album-card__desc').textContent).toBe('Montagne e mari.');
  });

  it('renders no img element when coverUrl is null', () => {
    const el = createAlbumCard({ ...album, coverUrl: null });
    expect(el.querySelector('.album-card__img')).toBeNull();
  });
});
