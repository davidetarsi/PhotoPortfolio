import { SLUG_RE } from '../shared/content-rules.js';

export function parseAdminHash(hash) {
  const m = String(hash).match(/^#\/album\/([^/]+)$/);
  if (m && SLUG_RE.test(m[1])) return { view: 'album', slug: m[1] };
  if (String(hash).match(/^#\/messages$/)) return { view: 'messages' };
  return { view: 'home' };
}
