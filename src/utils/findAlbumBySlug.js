/**
 * Finds an album in a list by its slug.
 * @param {Array} albums - Array of album objects with a `slug` property.
 * @param {string} slug - The slug to search for.
 * @returns {object|null} The album object if found, null otherwise.
 */
export function findAlbumBySlug(albums, slug) {
  if (!slug) return null;
  return albums.find(a => a.slug === slug) ?? null;
}
