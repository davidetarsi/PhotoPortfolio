import { photoUrl } from '../providers/r2.js';

/**
 * Resolves a hero image reference to its public R2 URL.
 * Pairs the reference `{album, name}` with the current R2 public URL to create
 * the final URL, independent of any custom domain configured elsewhere.
 *
 * @param {object|null} heroImage - Object with `album` and `name` properties, or null.
 * @param {string|undefined|null} r2PublicUrl - Optional public R2 bucket URL.
 * @returns {string|null} The full public URL of the hero image, or null if reference is incomplete.
 */
export function resolveHeroUrl(heroImage, r2PublicUrl) {
  if (!heroImage?.album || !heroImage?.name) {
    return null;
  }
  return photoUrl(r2PublicUrl, heroImage.album, heroImage.name);
}
