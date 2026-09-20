// Mapper puro manifest → photos. Il fetch vive in data.js; le immagini
// restano su URL pubblico R2 (cache lunga, immutabili per nome).

export function photoUrl(r2PublicUrl, slug, name) {
  return `${r2PublicUrl.replace(/\/$/, '')}/${slug}/${name}`;
}

export function photosFromManifest(entries, slug, r2PublicUrl) {
  return entries.map(({ name, width, height }) => ({
    name,
    width,
    height,
    gridUrl: photoUrl(r2PublicUrl, slug, name),
    fullUrl: photoUrl(r2PublicUrl, slug, name),
  }));
}
