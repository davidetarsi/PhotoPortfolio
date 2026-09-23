// Initial albums seed: used by the public fallback while R2 has no albums.json
// and on first `npm run migrate`. After that, the source of truth is the
// manifest on R2, managed by the dashboard.
// Re-running `migrate` after using the dashboard will overwrite its work.
export const albums = [
  {
    slug: 'sport',
    title: 'Sport',
    description: 'Foto sport',
    coverName: '4x5-crop-IMG_8689-.webp',
  },
  {
    slug: 'around-the-world',
    title: 'Around the world',
    description: 'Foto viaggio',
    coverName: '4x5-2637.webp',
  },
];
