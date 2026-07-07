import { DriveError, errorFromResponse } from './errors.js';
import { getCached, setCached } from './cache.js';

const BASE_URL = 'https://www.googleapis.com/drive/v3/files';
const PAGE_SIZE = 100;

/**
 * @param {string} folderId - ID della cartella Google Drive condivisa.
 * @param {string} apiKey - Google Drive API key.
 * @returns {Promise<Array<{name: string, gridUrl: string, fullUrl: string}>>}
 * @throws {DriveError}
 */
export async function listPhotos(folderId, apiKey) {
  const cached = getCached(folderId);
  if (cached) return cached;

  const photos = await _fetchAll(folderId, apiKey);
  setCached(folderId, photos);
  return photos;
}

async function _fetchAll(folderId, apiKey) {
  const items = [];
  let pageToken = '';

  do {
    const q = encodeURIComponent(
      `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`
    );
    const fields = encodeURIComponent('nextPageToken, files(id, name, thumbnailLink)');
    let url =
      `${BASE_URL}?q=${q}&key=${encodeURIComponent(apiKey)}` +
      `&fields=${fields}&orderBy=name&pageSize=${PAGE_SIZE}`;
    if (pageToken) url += `&pageToken=${pageToken}`;

    let res;
    try {
      res = await fetch(url);
    } catch (cause) {
      throw new DriveError(`Errore di rete: ${cause.message}`, 'NETWORK');
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body.error?.message ?? res.statusText;
      throw errorFromResponse(res.status, msg);
    }

    const data = await res.json();
    for (const f of (data.files ?? [])) {
      if (!f.thumbnailLink) continue;
      const base = f.thumbnailLink.replace(/=s\d+.*$/, '');
      items.push({ name: f.name, gridUrl: `${base}=s400`, fullUrl: `${base}=s1900` });
    }
    pageToken = data.nextPageToken ?? '';
  } while (pageToken);

  return items;
}
