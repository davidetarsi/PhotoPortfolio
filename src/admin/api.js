// REST client for /api/admin/*. The JWT travels on its own: Cloudflare Access
// injects the cookie/header on the same origin, no client-side handling needed.

async function send(path, options) {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res;
}
const putJson = (path, data) =>
  send(path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

/**
 * Admin API client interface for managing portfolio content.
 * Provides methods for updating site settings, albums, photos, messages, and manifests.
 * @type {Object}
 * @property {Function} putSite - Update site configuration.
 * @property {Function} putAlbums - Update album list.
 * @property {Function} putManifest - Update photo manifest for an album.
 * @property {Function} uploadPhoto - Upload a photo to an album.
 * @property {Function} deletePhoto - Delete a photo from an album.
 * @property {Function} deleteAlbum - Delete an entire album.
 * @property {Function} listMessages - Retrieve contact form messages.
 * @property {Function} deleteMessage - Delete a contact form message.
 */
export const adminApi = {
  putSite: site => putJson('/api/admin/site', site),
  putAlbums: albums => putJson('/api/admin/albums', { albums }),
  putManifest: (slug, entries) => putJson(`/api/admin/albums/${slug}/manifest`, entries),
  uploadPhoto: (slug, name, blob) =>
    send(`/api/admin/albums/${slug}/photos/${encodeURIComponent(name)}`, {
      method: 'PUT', headers: { 'Content-Type': 'image/webp' }, body: blob,
    }),
  deletePhoto: (slug, name) =>
    send(`/api/admin/albums/${slug}/photos/${encodeURIComponent(name)}`, { method: 'DELETE' }),
  deleteAlbum: slug => send(`/api/admin/albums/${slug}`, { method: 'DELETE' }),
  listMessages: async () => {
    const res = await send('/api/admin/messages', { method: 'GET' });
    return { ok: true, data: await res.json() };
  },
  deleteMessage: id => send(`/api/admin/messages/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
