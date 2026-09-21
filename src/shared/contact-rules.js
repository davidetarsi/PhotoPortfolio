/**
 * Contact form validation rules, shared between Worker and client.
 * The `/api/contact` route is the only unauthenticated write in the system:
 * length limits prevent oversized bodies from reaching R2.
 */

export const LIMITS = { name: 100, email: 254, subject: 200, message: 5000 };

// Email validation is intentionally permissive: validating an email to spec
// is impossible in regex, and rejecting valid addresses is worse than accepting
// a fake one that won't receive a reply anyway. The real check happens when
// the email server accepts the SMTP handshake.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fail = error => ({ ok: false, error });
const OK = { ok: true };

function stringaValida(v, max) {
  return typeof v === 'string' && v.trim().length > 0 && v.length <= max;
}

/**
 * Validates the shape and content of contact form data.
 * @param {unknown} data - The form submission to validate.
 * @returns {{ok: true} | {ok: false, error: string}} Validation result with error message if invalid.
 */
export function validateContactShape(data) {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return fail('contact: invalid shape');
  }

  for (const campo of ['name', 'message']) {
    if (!stringaValida(data[campo], LIMITS[campo])) return fail(`${campo} is missing or too long`);
  }

  if (!stringaValida(data.email, LIMITS.email) || !EMAIL_RE.test(data.email)) {
    return fail('email is missing or invalid');
  }

  if (data.subject !== undefined && !stringaValida(data.subject, LIMITS.subject)) {
    return fail('subject is invalid');
  }

  return OK;
}
