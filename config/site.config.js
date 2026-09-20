// Seed iniziale dell'identità del sito: serve solo al primo `npm run migrate`.
// Da quel momento nome, bio, hero e social si modificano dalla dashboard e la
// fonte di verità è R2.
export const siteConfig = {
  name: 'Nome Fotografo',
  bio: 'Una breve descrizione del fotografo.',
  language: 'it',
  heroImage: null,  // dopo l'upload: { album: 'nome-album', name: 'nome-foto.webp' }
  social: {
    // instagram: 'https://instagram.com/...',
  },
  provider: 'r2',
  // Optional chaining: il file viene importato anche da vite.config.js (Node),
  // dove import.meta.env non esiste.
  r2PublicUrl: import.meta.env?.VITE_R2_PUBLIC_URL,
  web3formsAccessKey: import.meta.env?.VITE_WEB3FORMS_ACCESS_KEY ?? '',
};
