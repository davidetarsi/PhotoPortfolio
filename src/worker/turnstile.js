const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Verifica il token Turnstile presso Cloudflare.
 *
 * Senza secret la verifica e' disattivata e passa: Turnstile e'
 * opzionale, e chi sceglie di non usarlo deve avere un form che
 * funziona, non uno che rifiuta tutti. Con il secret configurato,
 * invece, qualunque incertezza blocca — un errore di rete verso
 * Cloudflare non e' un buon motivo per accettare un invio non
 * verificato.
 *
 * @param {string} token - dal campo cf-turnstile-response
 * @param {string} secret - TURNSTILE_SECRET, vuoto = disattivato
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<boolean>}
 */
export async function verifyTurnstile(token, secret, fetchImpl = fetch) {
  if (!secret) return true;
  if (!token) return false;

  try {
    const res = await fetchImpl(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
    });
    const data = await res.json();
    return data?.success === true;
  } catch {
    return false;
  }
}
