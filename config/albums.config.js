// Seed iniziale degli album: serve solo al primo `npm run migrate`. Da quel
// momento la fonte di verità è il manifest su R2, gestito dalla dashboard.
// Rilanciare `migrate` dopo aver usato la dashboard ne sovrascrive il lavoro.
export const albums = [
  {
    slug: 'nome-album',
    title: 'Titolo Album',
    description: 'Descrizione breve dell\'album.',
    coverUrl: '',  // dopo l'upload: 'https://pub-xxxxxxxx.r2.dev/nome-album/nome-copertina.webp'
  },
];
