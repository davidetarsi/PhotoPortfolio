export const siteConfig = {
  name: 'Nome Fotografo',
  bio: 'Una breve descrizione del fotografo.',
  language: 'it',
  heroImageUrl: '',
  social: {
    // instagram: 'https://instagram.com/...',
  },
  provider: 'googleDrive',
  // Optional chaining: il file viene importato anche da vite.config.js (Node),
  // dove import.meta.env non esiste.
  driveApiKey: import.meta.env?.VITE_DRIVE_API_KEY,
  web3formsAccessKey: import.meta.env?.VITE_WEB3FORMS_ACCESS_KEY ?? '',
};
