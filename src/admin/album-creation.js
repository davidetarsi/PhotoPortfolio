import { slugifyTitle, SLUG_RE, RESERVED_SLUGS } from '../shared/content-rules.js';

export async function createAlbum(title, ctx) {
  const trimmed = title.trim();
  const slug = slugifyTitle(trimmed);
  if (!trimmed || !SLUG_RE.test(slug)) return { ok: false, error: 'Titolo non valido.' };
  if (RESERVED_SLUGS.includes(slug)) return { ok: false, error: `"${slug}" è un nome riservato.` };
  if (ctx.albums.some(a => a.slug === slug)) return { ok: false, error: `Esiste già un album "${slug}".` };
  const next = [...ctx.albums, { slug, title: trimmed, description: '', coverName: null }];
  await ctx.api.putAlbums(next);
  ctx.albums = next;
  return { ok: true, slug };
}
