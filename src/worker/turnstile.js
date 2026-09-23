const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Verifies a Turnstile token with Cloudflare.
 *
 * Without a secret, verification is disabled and always succeeds. Turnstile is optional,
 * and users who don't use it should have a working form, not one that rejects everything.
 * With secret configured, any uncertainty blocks the submission: network errors to Cloudflare
 * are not a reason to accept an unverified submission.
 *
 * @param {string} token - The cf-turnstile-response field value from the form.
 * @param {string} secret - TURNSTILE_SECRET; empty string means disabled.
 * @param {typeof fetch} fetchImpl - Fetch implementation for testing.
 * @returns {Promise<boolean>} True if verification passed, false if failed or not configured.
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
