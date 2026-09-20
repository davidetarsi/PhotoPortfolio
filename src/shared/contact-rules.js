// Regole del messaggio di contatto, condivise fra Worker e client.
// La rotta /api/contact e' l'unica scrittura non autenticata del sistema:
// i limiti di lunghezza servono a impedire che un corpo enorme arrivi a R2.

export const LIMITS = { name: 100, email: 254, subject: 200, message: 5000 };

// Volutamente permissiva: convalidare un'email secondo lo standard e'
// impossibile in una regex, e rifiutare indirizzi validi e' peggio che
// accettarne uno finto, che tanto non ricevera' mai la risposta.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fail = error => ({ ok: false, error });
const OK = { ok: true };

function stringaValida(v, max) {
  return typeof v === 'string' && v.trim().length > 0 && v.length <= max;
}

/**
 * @param {unknown} data
 * @returns {{ok: true} | {ok: false, error: string}}
 */
export function validateContactShape(data) {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return fail('contact: shape invalida');
  }

  for (const campo of ['name', 'message']) {
    if (!stringaValida(data[campo], LIMITS[campo])) return fail(`${campo} mancante o troppo lungo`);
  }

  if (!stringaValida(data.email, LIMITS.email) || !EMAIL_RE.test(data.email)) {
    return fail('email mancante o non valida');
  }

  if (data.subject !== undefined && !stringaValida(data.subject, LIMITS.subject)) {
    return fail('subject non valido');
  }

  return OK;
}
