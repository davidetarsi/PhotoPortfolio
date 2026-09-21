// Regole condivise tra Worker (validazione scritture), sito pubblico (validazione
// letture) e dashboard admin (naming/slug). Unica fonte di verità.

export const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
export const RESERVED_SLUGS = ['admin', 'api', 'assets', 'about'];
// I nomi legacy caricati con upload.js contengono maiuscole: il server le accetta.
export const PHOTO_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*\.webp$/;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export function slugifyTitle(title) {
  return String(title)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const fail = error => ({ ok: false, error });
const OK = { ok: true };
const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const isPhotoName = v => typeof v === 'string' && PHOTO_NAME_RE.test(v);

export function validateSiteShape(data) {
  if (!isObj(data)) return fail('site: non è un oggetto');
  if (typeof data.name !== 'string' || !data.name.trim()) return fail('site.name obbligatorio');
  if (typeof data.bio !== 'string') return fail('site.bio deve essere una stringa');
  if (data.hero !== null) {
    if (!isObj(data.hero)) return fail('site.hero deve essere null o oggetto');
    if (typeof data.hero.album !== 'string' || !SLUG_RE.test(data.hero.album)) return fail('site.hero.album invalido');
    if (!isPhotoName(data.hero.name)) return fail('site.hero.name invalido');
  }
  if (!isObj(data.social)) return fail('site.social deve essere un oggetto');
  for (const v of Object.values(data.social)) {
    if (typeof v !== 'string') return fail('site.social: valori stringa');
  }
  return OK;
}

export function validateAlbumsShape(data) {
  if (!isObj(data) || !Array.isArray(data.albums)) return fail('albums: shape invalida');
  const seen = new Set();
  for (const a of data.albums) {
    if (!isObj(a)) return fail('albums: entry non oggetto');
    if (typeof a.slug !== 'string' || !SLUG_RE.test(a.slug)) return fail(`slug invalido: "${a?.slug}"`);
    if (RESERVED_SLUGS.includes(a.slug)) return fail(`slug riservato: "${a.slug}"`);
    if (seen.has(a.slug)) return fail(`slug duplicato: "${a.slug}"`);
    seen.add(a.slug);
    if (typeof a.title !== 'string' || !a.title.trim()) return fail(`title obbligatorio per "${a.slug}"`);
    if (typeof a.description !== 'string') return fail(`description stringa per "${a.slug}"`);
    if (a.coverName !== null && !isPhotoName(a.coverName)) return fail(`coverName invalido per "${a.slug}"`);
  }
  return OK;
}

export function validateManifestShape(data) {
  if (!Array.isArray(data)) return fail('manifest: non è un array');
  const seen = new Set();
  for (const e of data) {
    if (!isObj(e)) return fail('manifest: entry non oggetto');
    if (!isPhotoName(e.name)) return fail(`manifest: name invalido "${e?.name}"`);
    if (seen.has(e.name)) return fail(`manifest: name duplicato "${e.name}"`);
    seen.add(e.name);
    if (!Number.isFinite(e.width) || e.width <= 0) return fail(`manifest: width invalida per "${e.name}"`);
    if (!Number.isFinite(e.height) || e.height <= 0) return fail(`manifest: height invalida per "${e.name}"`);
    if (e.capturedAt !== undefined && !Number.isFinite(e.capturedAt)) return fail(`manifest: capturedAt invalido per "${e.name}"`);
    if (e.uploadedAt !== undefined && !Number.isFinite(e.uploadedAt)) return fail(`manifest: uploadedAt invalido per "${e.name}"`);
  }
  return OK;
}

export function validateConfigShape(data) {
  if (!isObj(data)) return fail('config: non è un oggetto');
  if (typeof data.r2PublicUrl !== 'string' || !data.r2PublicUrl.trim()) {
    return fail('config.r2PublicUrl deve essere una stringa non vuota');
  }
  if (data.turnstileSitekey !== null && data.turnstileSitekey !== undefined) {
    if (typeof data.turnstileSitekey !== 'string') return fail('config.turnstileSitekey deve essere una stringa o null');
  }
  return OK;
}
