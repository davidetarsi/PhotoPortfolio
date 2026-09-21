/**
 * Pure mapper from manifest to photo objects for rendering.
 * Fetching lives in data.js; images stay on public R2 URLs (long cache, immutable by name).
 */

/**
 * Constructs the public URL for a photo on R2.
 * @param {string} r2PublicUrl - Public R2 bucket URL.
 * @param {string} slug - Album slug.
 * @param {string} name - Photo filename.
 * @returns {string} Full photo URL.
 */
export function photoUrl(r2PublicUrl, slug, name) {
  return `${r2PublicUrl.replace(/\/$/, '')}/${slug}/${name}`;
}

/**
 * Transforms a photo manifest into objects ready to render in the grid.
 * @param {Array} entries - Manifest entries with name, width, height.
 * @param {string} slug - Album slug.
 * @param {string} r2PublicUrl - Public R2 bucket URL.
 * @returns {Array} Photo objects with gridUrl, fullUrl, dimensions, and name.
 */
export function photosFromManifest(entries, slug, r2PublicUrl) {
  return entries.map(({ name, width, height }) => ({
    name,
    width,
    height,
    gridUrl: photoUrl(r2PublicUrl, slug, name),
    fullUrl: photoUrl(r2PublicUrl, slug, name),
  }));
}
