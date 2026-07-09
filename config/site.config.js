export const siteConfig = {
  name: 'Davide Tarsi',
  bio: 'Fotografo sportivo e di viaggio.',
  language: 'it',
  heroImageUrl: 'https://drive.google.com/file/d/1Ydo2WFwk0ncwo5-vkCYcZqFw6i3Ep61K',
  social: {
    // instagram: 'https://instagram.com/...',
  },
  provider: 'googleDrive',
  // Optional chaining: il file viene importato anche da vite.config.js (Node),
  // dove import.meta.env non esiste.
  driveApiKey: import.meta.env?.VITE_DRIVE_API_KEY,
  web3formsAccessKey: import.meta.env?.VITE_WEB3FORMS_ACCESS_KEY ?? '',
};
