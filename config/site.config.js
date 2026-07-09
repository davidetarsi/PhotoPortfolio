export const siteConfig = {
  name: 'Davide Tarsi',
  bio: 'Fotografo sportivo e di viaggio.',
  language: 'it',
  heroImageUrl: '',
  social: {
    // instagram: 'https://instagram.com/...',
  },
  provider: 'r2',
  // Optional chaining: il file viene importato anche da vite.config.js (Node),
  // dove import.meta.env non esiste.
  r2PublicUrl: import.meta.env?.VITE_R2_PUBLIC_URL,
  web3formsAccessKey: import.meta.env?.VITE_WEB3FORMS_ACCESS_KEY ?? '',
};
