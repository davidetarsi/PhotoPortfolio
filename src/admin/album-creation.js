import { slugifyTitle, SLUG_RE, RESERVED_SLUGS } from '../shared/content-rules.js';
import { texts } from '../../config/texts.config.js';
import { formatText } from '../utils/formatText.js';

export async function createAlbum(title, ctx) {
  const trimmed = title.trim();
  const slug = slugifyTitle(trimmed);
  if (!trimmed || !SLUG_RE.test(slug)) return { ok: false, error: texts.admin.albums.titleInvalid };
  if (RESERVED_SLUGS.includes(slug)) return { ok: false, error: formatText(texts.admin.albums.titleReserved, { slug }) };
  if (ctx.albums.some(a => a.slug === slug)) return { ok: false, error: formatText(texts.admin.albums.exists, { slug }) };
  const next = [...ctx.albums, { slug, title: trimmed, description: '', coverName: null }];
  await ctx.api.putAlbums(next);
  ctx.albums = next;
  return { ok: true, slug };
}
