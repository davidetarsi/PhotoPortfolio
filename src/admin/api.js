// Client REST verso /api/admin/*. Il JWT viaggia da solo: Cloudflare Access
// inietta il cookie/header sulla stessa origin, nessuna gestione client.

async function send(path, options) {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res;
}
const putJson = (path, data) =>
  send(path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

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
};
