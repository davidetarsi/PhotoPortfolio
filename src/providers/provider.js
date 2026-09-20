/**
 * Contratto del provider foto.
 *
 * Ogni provider concreto esporta una funzione `listPhotos`.
 * Il parametro `albumRef` è il riferimento all'album specifico del provider
 * (per R2: lo slug dell'album, es. 'sport').
 * I provider possono richiedere parametri aggiuntivi specifici
 * (es. `r2PublicUrl` per R2).
 *
 * @param {string} albumRef - Riferimento all'album (provider-specific).
 * @param {...*} providerArgs - Argomenti aggiuntivi richiesti dal provider concreto.
 * @returns {Promise<Array<{name: string, gridUrl: string, fullUrl: string}>>}
 * @throws {Error} Se il provider non è raggiungibile o l'album non esiste.
 */
export async function listPhotos(albumRef, ...providerArgs) {
  throw new Error('listPhotos() non implementato — usa un provider concreto (es. r2.js)');
}
