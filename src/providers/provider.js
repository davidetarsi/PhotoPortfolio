/**
 * Contratto del provider foto.
 *
 * Ogni provider concreto (es. googleDrive.js) deve esportare
 * una funzione `listPhotos` con questa stessa firma.
 *
 * @param {string} albumRef - Riferimento all'album (per Drive: folderId).
 * @returns {Promise<Array<{name: string, gridUrl: string, fullUrl: string}>>}
 *   Array di foto con nome file, URL thumbnail per griglia e URL ad alta risoluzione.
 * @throws {Error} Se il provider non è raggiungibile o l'album non esiste.
 */
export async function listPhotos(albumRef) {
  throw new Error('listPhotos() non implementato — usa un provider concreto (es. googleDrive.js)');
}
