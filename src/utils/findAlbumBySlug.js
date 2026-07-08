export function findAlbumBySlug(albums, slug) {
  if (!slug) return null;
  return albums.find(a => a.slug === slug) ?? null;
}
