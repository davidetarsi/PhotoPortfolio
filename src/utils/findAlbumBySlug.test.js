import { describe, it, expect } from 'vitest';
import { findAlbumBySlug } from './findAlbumBySlug.js';

const albums = [
  { slug: 'natura', title: 'Natura', driveFolderId: 'abc' },
  { slug: 'street', title: 'Street', driveFolderId: 'def' },
];

describe('findAlbumBySlug', () => {
  it('returns matching album when slug exists', () => {
    expect(findAlbumBySlug(albums, 'natura')).toEqual(albums[0]);
  });

  it('returns null when slug does not exist', () => {
    expect(findAlbumBySlug(albums, 'ritratti')).toBeNull();
  });

  it('returns null when slug is null', () => {
    expect(findAlbumBySlug(albums, null)).toBeNull();
  });

  it('returns null when albums is an empty array', () => {
    expect(findAlbumBySlug([], 'natura')).toBeNull();
  });
});
