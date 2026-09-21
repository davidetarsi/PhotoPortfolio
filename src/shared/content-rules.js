/**
 * Validation rules shared across Worker (write validation), public site (read validation),
 * and admin dashboard (naming and slug generation). Single source of truth.
 */

export const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
export const RESERVED_SLUGS = ['admin', 'api', 'assets', 'about'];
// Legacy photo names uploaded by upload.js contain uppercase letters; the server accepts them.
export const PHOTO_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*\.webp$/;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

/**
 * Converts a title into a URL-safe slug.
 * @param {string} title - The title to slugify.
 * @returns {string} The slugified version: lowercase, hyphen-separated, no special chars.
 */
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

/**
 * Validates the structure of site metadata (name, bio, hero image, social links).
 * @param {unknown} data - The site configuration object to validate.
 * @returns {{ok: true} | {ok: false, error: string}} Validation result.
 */
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

/**
 * Validates the structure of the albums collection.
 * Ensures slugs are unique, reserved names are not used, and all required fields are present.
 * @param {unknown} data - The albums configuration object to validate.
 * @returns {{ok: true} | {ok: false, error: string}} Validation result.
 */
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

/**
 * Validates the structure of the photo manifest (list of uploaded photos with metadata).
 * Ensures names are unique and dimensions are valid.
 * @param {unknown} data - The manifest array to validate.
 * @returns {{ok: true} | {ok: false, error: string}} Validation result.
 */
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

/**
 * Validates the structure of the runtime configuration (R2 URL and Turnstile sitekey).
 * @param {unknown} data - The configuration object to validate.
 * @returns {{ok: true} | {ok: false, error: string}} Validation result.
 */
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
