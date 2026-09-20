export const siteConfig = {
  name: 'Davide Tarsi',
  bio: 'Fotografo sportivo e di viaggio.',
  language: 'it',
  heroImageUrl: 'https://pub-f795b3dcc64b49348b6805cd460aa1e7.r2.dev/sport/4x5-crop-7302.webp',
  social: {
    // instagram: 'https://instagram.com/...',
  },
  provider: 'r2',
  // Optional chaining: il file viene importato anche da vite.config.js (Node),
  // dove import.meta.env non esiste.
  r2PublicUrl: import.meta.env?.VITE_R2_PUBLIC_URL,
  web3formsAccessKey: import.meta.env?.VITE_WEB3FORMS_ACCESS_KEY ?? '',
};
