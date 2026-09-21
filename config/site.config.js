/**
 * Initial seed for site identity: used only on first `npm run migrate`.
 * After that, name, bio, hero, and social are edited from the dashboard
 * and R2 becomes the source of truth.
 */
export const siteConfig = {
  name: 'Nome Fotografo',
  bio: 'Una breve descrizione del fotografo.',
  language: 'it',
  heroImage: null,  // after upload: { album: 'album-name', name: 'photo.webp' }
  social: {
    // instagram: 'https://instagram.com/...',
  },
  provider: 'r2',
  // Optional chaining: this file is imported by vite.config.js (Node environment)
  // where import.meta.env does not exist. Optional chaining prevents the error.
  r2PublicUrl: import.meta.env?.VITE_R2_PUBLIC_URL,
  turnstileSitekey: import.meta.env?.VITE_TURNSTILE_SITEKEY ?? '',
};
