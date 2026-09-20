import { describe, it, expect, vi } from 'vitest';
import { handleContactRequest } from './contact-routes.js';
import { makeFakeBucket } from './test-helpers.js';

const NOW = 1_800_000_000_000;
const VALIDO = { name: 'Mario', email: 'm@e.it', message: 'Ciao' };

const makeDeps = (over = {}) => ({
  now: () => NOW,
  rand: () => 'aaaaaa',
  notify: vi.fn(async () => {}),
  verify: async () => true,
  ...over,
});

const makeEnv = (over = {}) => ({ BUCKET: makeFakeBucket(), ...over });

const post = (env, body, deps = makeDeps()) =>
  handleContactRequest(
    new Request('https://x.dev/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
    env, deps,
  );

describe('handleContactRequest', () => {
  it('salva il messaggio su R2 e risponde 200', async () => {
    const env = makeEnv();
    const res = await post(env, VALIDO);
    expect(res.status).toBe(200);
    const chiavi = [...env.BUCKET.store.keys()];
    expect(chiavi).toHaveLength(1);
    expect(chiavi[0]).toBe('_messages/2027-01-15T08-00-00-000Z-aaaaaa.json');
    expect(JSON.parse(env.BUCKET.store.get(chiavi[0]).text).name).toBe('Mario');
  });

  it('rifiuta i metodi diversi da POST', async () => {
    const res = await handleContactRequest(
      new Request('https://x.dev/api/contact', { method: 'GET' }), makeEnv(), makeDeps());
    expect(res.status).toBe(405);
  });

  it('rifiuta un corpo non valido senza toccare R2', async () => {
    const env = makeEnv();
    const res = await post(env, { name: 'Mario' });
    expect(res.status).toBe(400);
    expect(env.BUCKET.store.size).toBe(0);
  });

  it('rifiuta JSON malformato senza esplodere', async () => {
    const env = makeEnv();
    const res = await post(env, '{non json');
    expect(res.status).toBe(400);
    expect(env.BUCKET.store.size).toBe(0);
  });

  it('scarta in silenzio se l honeypot e compilato', async () => {
    // Risponde 200 di proposito: un bot che riceve 400 riprova, uno che
    // riceve 200 crede di aver funzionato e se ne va.
    const env = makeEnv();
    const res = await post(env, { ...VALIDO, botcheck: 'sono un bot' });
    expect(res.status).toBe(200);
    expect(env.BUCKET.store.size).toBe(0);
  });

  it('blocca se Turnstile non passa, senza toccare R2', async () => {
    const env = makeEnv();
    const res = await post(env, VALIDO, makeDeps({ verify: async () => false }));
    expect(res.status).toBe(403);
    expect(env.BUCKET.store.size).toBe(0);
  });

  it('notifica dopo aver salvato', async () => {
    const env = makeEnv();
    const deps = makeDeps();
    await post(env, VALIDO, deps);
    expect(deps.notify).toHaveBeenCalledOnce();
  });

  it('se la notifica fallisce il messaggio resta salvato e la risposta e 200', async () => {
    // Un visitatore non deve vedere "invio fallito" perche' il telefono
    // del proprietario era irraggiungibile (spec §4).
    const env = makeEnv();
    const deps = makeDeps({ notify: async () => { throw new Error('webhook giu'); } });
    const res = await post(env, VALIDO, deps);
    expect(res.status).toBe(200);
    expect(env.BUCKET.store.size).toBe(1);
  });

  it('rifiuta un corpo enorme senza leggerlo tutto', async () => {
    const env = makeEnv();
    const res = await post(env, { ...VALIDO, message: 'x'.repeat(100_000) });
    expect(res.status).toBe(400);
    expect(env.BUCKET.store.size).toBe(0);
  });

  it('non salva i campi estranei arrivati dal client', async () => {
    const env = makeEnv();
    await post(env, { ...VALIDO, receivedAt: 1, ip: '1.2.3.4' });
    const salvato = JSON.parse([...env.BUCKET.store.values()][0].text);
    expect(salvato.receivedAt).toBe(NOW);
    expect('ip' in salvato).toBe(false);
  });
});
