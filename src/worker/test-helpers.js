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
      const all = [...store.keys()].filter(k => k.startsWith(prefix)).sort();
      const start = cursor ? Number(cursor) : 0;
      const page = all.slice(start, start + limit);
      const truncated = start + limit < all.length;
      return { objects: page.map(key => ({ key })), truncated, ...(truncated ? { cursor: String(start + limit) } : {}) };
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
