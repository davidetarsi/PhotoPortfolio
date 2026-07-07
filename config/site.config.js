export const siteConfig = {
  name: 'Nome Fotografo',
  bio: 'Una breve descrizione del fotografo.',
  language: 'it',
  heroImageUrl: 'https://drive.google.com/file/d/1E6EnyGyFXP3EH2cOsSYVwPSzgJ6UzWn-/view?usp=share_link',
  social: {
    // instagram: 'https://instagram.com/...',
  },
  provider: 'googleDrive',
  driveApiKey: import.meta.env.VITE_DRIVE_API_KEY,
  web3formsAccessKey: import.meta.env.VITE_WEB3FORMS_ACCESS_KEY ?? '',
};
