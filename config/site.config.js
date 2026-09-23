/**
 * Initial seed for site identity: used only on first `npm run migrate`.
 * After that, name, bio, hero, and social are edited from the dashboard
 * and R2 becomes the source of truth.
 */
export const siteConfig = {
  name: 'Davide Tarsi',
  bio: 'Fotografo sportivo e di viaggio.',
  language: 'it',
  heroImage: { album: 'sport', name: '4x5-crop-7302.webp' },
  social: {
    // instagram: 'https://instagram.com/...',
  },
  provider: 'r2',
  // Optional chaining: il file viene importato anche da vite.config.js (Node),
  // dove import.meta.env non esiste.
  r2PublicUrl: import.meta.env?.VITE_R2_PUBLIC_URL,
};
