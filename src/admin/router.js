import { SLUG_RE } from '../shared/content-rules.js';

/**
 * Parses the admin panel URL hash to determine the current view.
 * @param {string} hash - The URL hash fragment.
 * @returns {{view: string, slug?: string}} Object with view name and optional slug for album view.
 */
export function parseAdminHash(hash) {
  const m = String(hash).match(/^#\/album\/([^/]+)$/);
  if (m && SLUG_RE.test(m[1])) return { view: 'album', slug: m[1] };
  if (String(hash).match(/^#\/messages$/)) return { view: 'messages' };
  return { view: 'home' };
}
