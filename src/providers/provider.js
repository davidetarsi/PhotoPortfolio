/**
 * Photo provider contract interface.
 *
 * Each concrete provider exports a `listPhotos` function.
 * The `albumRef` parameter is the provider-specific album reference
 * (for R2: the album slug, e.g. 'sport').
 * Providers may require additional provider-specific parameters
 * (e.g. `r2PublicUrl` for R2).
 *
 * @param {string} albumRef - Album reference (provider-specific).
 * @param {...*} providerArgs - Additional arguments required by the concrete provider.
 * @returns {Promise<Array<{name: string, gridUrl: string, fullUrl: string}>>}
 * @throws {Error} If the provider is unreachable or the album doesn't exist.
 */
export async function listPhotos(albumRef, ...providerArgs) {
  throw new Error('listPhotos() non implementato — usa un provider concreto (es. r2.js)');
}
