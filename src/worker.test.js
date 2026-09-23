// Il router principale non aveva test: le singole rotte sì, ma non la
// decisione di quale gestore le riceve. È lì che vive l'ordine dei rami,
// e un ramo nel posto sbagliato non fallisce — serve la pagina sbagliata.
import { describe, it, expect } from 'vitest';
import worker from './worker.js';
import { makeFakeAssets, makeFakeBucket } from './worker/test-helpers.js';

const env = () => ({ ASSETS: makeFakeAssets(), BUCKET: makeFakeBucket() });
const get = path => worker.fetch(new Request(`https://x.dev${path}`), env());

describe('routing', () => {
  it('/contatti reindirizza a /about, in modo permanente', async () => {
    // Il sito è già online e quel link può essere stato condiviso: il
    // rename non deve trasformarlo in un 404.
    const res = await get('/contatti');
    expect(res.status).toBe(301);
    expect(res.headers.get('Location')).toBe('https://x.dev/about');
  });

  it('reindirizza anche /contatti con la barra finale', async () => {
    const res = await get('/contatti/');
    expect(res.status).toBe(301);
    expect(res.headers.get('Location')).toBe('https://x.dev/about');
  });

  it('/about serve la sua pagina, non un redirect', async () => {
    const res = await get('/about');
    expect(res.status).toBe(200);
  });

  it('uno slug album resta uno slug album', async () => {
    const res = await get('/sport');
    expect(res.status).toBe(200);
  });

  it('le API non cadono nella regex degli album', async () => {
    // /api/contact accetta solo POST: se il router lo mandasse alla
    // regex degli album risponderebbe 200 con una pagina HTML.
    const res = await get('/api/contact');
    expect(res.status).toBe(405);
  });
});
