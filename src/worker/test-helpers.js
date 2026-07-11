// src/worker/test-helpers.js
// Fake dei binding Cloudflare per i test (ambiente node).

export function makeFakeBucket(initial = {}) {
  const store = new Map(); // key → { text, contentType }
  for (const [k, v] of Object.entries(initial)) {
    store.set(k, { text: typeof v === 'string' ? v : JSON.stringify(v), contentType: 'application/json' });
  }
  const toText = async value => {
    if (typeof value === 'string') return value;
    if (value instanceof ArrayBuffer) return new TextDecoder().decode(value);
    if (ArrayBuffer.isView(value)) return new TextDecoder().decode(value);
    // ReadableStream (request.body) → consuma
    return await new Response(value).text();
  };
  return {
    store,
    async get(key) {
      const rec = store.get(key);
      if (!rec) return null;
      return { text: async () => rec.text, json: async () => JSON.parse(rec.text) };
    },
    async put(key, value, opts = {}) {
      store.set(key, { text: await toText(value), contentType: opts.httpMetadata?.contentType });
    },
    async delete(keys) {
      for (const k of Array.isArray(keys) ? keys : [keys]) store.delete(k);
    },
    async list({ prefix = '', cursor, limit = 1000 } = {}) {
      // Cursor = ultima chiave della pagina precedente (come R2/S3 reali), non un offset
      // numerico: deve restare valido anche se il chiamante cancella le chiavi già viste
      // tra una list() e la successiva (è esattamente il pattern list→delete→list di
      // admin-routes.js per la cancellazione album paginata).
      const all = [...store.keys()].filter(k => k.startsWith(prefix)).sort();
      const startIdx = cursor ? all.findIndex(k => k > cursor) : 0;
      const from = startIdx === -1 ? all.length : startIdx;
      const page = all.slice(from, from + limit);
      const truncated = from + page.length < all.length;
      return { objects: page.map(key => ({ key })), truncated, ...(truncated ? { cursor: page[page.length - 1] } : {}) };
    },
  };
}

export function makeFakeAssets() {
  const calls = [];
  return {
    calls,
    async fetch(urlOrRequest) {
      // urlOrRequest può essere string | URL | Request: il binding reale
      // (Fetcher.fetch) accetta tutti e tre. URL non ha `.url` (solo `.href`).
      const href = typeof urlOrRequest === 'string' ? urlOrRequest : (urlOrRequest.url ?? urlOrRequest.href);
      const u = new URL(href);
      calls.push(u.pathname);
      return new Response(`ASSET:${u.pathname}`, { status: 200 });
    },
  };
}

const te = new TextEncoder();
const bytesToB64url = bytes =>
  btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** Genera una coppia RSA reale e firma JWT validi per i test. */
export async function makeJwtTestKit({ kid = 'test-key-1' } = {}) {
  const { publicKey, privateKey } = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  );
  const jwk = { ...(await crypto.subtle.exportKey('jwk', publicKey)), kid, alg: 'RS256', use: 'sig' };
  async function signToken(payload, { kidOverride = kid } = {}) {
    const h = bytesToB64url(te.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: kidOverride })));
    const p = bytesToB64url(te.encode(JSON.stringify(payload)));
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, te.encode(`${h}.${p}`));
    return `${h}.${p}.${bytesToB64url(sig)}`;
  }
  return { jwk, signToken, fetchJwks: async () => ({ keys: [jwk] }) };
}
