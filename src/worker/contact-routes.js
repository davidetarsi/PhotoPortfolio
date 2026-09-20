// L'unica scrittura non autenticata del sistema. Ogni controllo qui
// dentro esiste perche' chiunque puo' chiamare questa rotta.
import { jsonResponse } from './http.js';
import { validateContactShape } from '../shared/contact-rules.js';
import { buildMessage, messageKey } from '../utils/buildMessage.js';
import { notifyBody } from '../utils/notifyBody.js';
import { verifyTurnstile } from './turnstile.js';

const MAX_BODY = 16 * 1024;
const NOTIFY_TIMEOUT_MS = 3000;

function randSuffix() {
  return Math.random().toString(36).slice(2, 8).padEnd(6, '0');
}

async function inviaNotifica(env, messaggio) {
  const url = env.CONTACT_NOTIFY_URL;
  if (!url) return;
  const adminUrl = `${env.SITE_URL ?? ''}/admin`;
  await fetch(url, {
    method: 'POST',
    body: notifyBody(messaggio, adminUrl),
    signal: AbortSignal.timeout(NOTIFY_TIMEOUT_MS),
  });
}

/**
 * @param {Request} request
 * @param {object} env
 * @param {{now?: () => number, rand?: () => string, notify?: Function, verify?: Function}} deps
 */
export async function handleContactRequest(request, env, deps = {}) {
  if (request.method !== 'POST') return jsonResponse({ error: 'METHOD_NOT_ALLOWED' }, 405);

  const now = deps.now ?? Date.now;
  const rand = deps.rand ?? randSuffix;
  const notify = deps.notify ?? inviaNotifica;
  const verify = deps.verify ?? ((token) => verifyTurnstile(token, env.TURNSTILE_SECRET ?? ''));

  const raw = await request.text();
  if (raw.length > MAX_BODY) return jsonResponse({ error: 'TOO_LARGE' }, 400);

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return jsonResponse({ error: 'INVALID_JSON' }, 400);
  }

  // Honeypot: risponde 200 di proposito. Un bot che riceve un errore
  // riprova cambiando qualcosa; uno che riceve successo se ne va.
  if (data?.botcheck) return jsonResponse({ ok: true });

  if (!(await verify(data?.['cf-turnstile-response'] ?? ''))) {
    return jsonResponse({ error: 'CHALLENGE_FAILED' }, 403);
  }

  const esito = validateContactShape(data);
  if (!esito.ok) return jsonResponse({ error: 'INVALID', detail: esito.error }, 400);

  const messaggio = buildMessage(data, now());
  await env.BUCKET.put(messageKey(now(), rand()), JSON.stringify(messaggio), {
    httpMetadata: { contentType: 'application/json' },
  });

  // Il messaggio e' gia' al sicuro: se la notifica fallisce, il
  // visitatore non deve saperlo ne' subirne le conseguenze.
  try {
    await notify(env, messaggio);
  } catch (err) {
    console.error('notifica fallita:', err?.message);
  }

  return jsonResponse({ ok: true });
}
