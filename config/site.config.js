export const siteConfig = {
  name: 'Nome Fotografo',
  bio: 'Una breve descrizione del fotografo.',
  language: 'it',
  heroImageUrl: '',
  social: {
    // instagram: 'https://instagram.com/...',
  },
  provider: 'googleDrive',
  driveApiKey: import.meta.env.VITE_DRIVE_API_KEY,
  web3formsAccessKey: import.meta.env.VITE_WEB3FORMS_ACCESS_KEY ?? '',
};
