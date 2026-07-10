const TTL_MS = 600_000;
const PREFIX = 'cache_';

/**
 * @param {string} folderId
 * @returns {Array<{name: string, gridUrl: string, fullUrl: string}> | null}
 */
export function getCached(folderId) {
  try {
    const raw = sessionStorage.getItem(PREFIX + folderId);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts >= TTL_MS) {
      sessionStorage.removeItem(PREFIX + folderId);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * @param {string} folderId
 * @param {Array<{name: string, gridUrl: string, fullUrl: string}>} data
 */
export function setCached(folderId, data) {
  try {
    sessionStorage.setItem(PREFIX + folderId, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // sessionStorage piena o non disponibile — fallisce silenziosamente
  }
}
