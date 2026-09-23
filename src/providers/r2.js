/**
 * Pure mapper from manifest to photo objects for rendering.
 * Fetching lives in data.js; images stay on public R2 URLs (long cache, immutable by name).
 */

/**
 * Constructs the public URL for a photo on R2.
 * @param {string|undefined|null} r2PublicUrl - Optional public R2 bucket URL.
 * @param {string} slug - Album slug.
 * @param {string} name - Photo filename.
 * @returns {string|null} Full photo URL, or null when the public URL is unavailable.
 */
export function photoUrl(r2PublicUrl, slug, name) {
  if (typeof r2PublicUrl !== 'string' || !r2PublicUrl.trim()) return null;
  return `${r2PublicUrl.replace(/\/$/, '')}/${slug}/${name}`;
}

/**
 * Transforms a photo manifest into objects ready to render in the grid.
 * @param {Array} entries - Manifest entries with name, width, height.
 * @param {string} slug - Album slug.
 * @param {string|undefined|null} r2PublicUrl - Optional public R2 bucket URL.
 * @returns {Array} Photo objects with gridUrl, fullUrl, dimensions, and name;
 * empty when the public URL is unavailable.
 */
export function photosFromManifest(entries, slug, r2PublicUrl) {
  if (typeof r2PublicUrl !== 'string' || !r2PublicUrl.trim()) return [];
  return entries.map(({ name, width, height }) => ({
    name,
    width,
    height,
    gridUrl: photoUrl(r2PublicUrl, slug, name),
    fullUrl: photoUrl(r2PublicUrl, slug, name),
  }));
}
