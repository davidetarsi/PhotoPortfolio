/**
 * Costruisce l'oggetto salvato su R2. Copia solo i campi previsti: cio'
 * che arriva da una rotta pubblica non finisce nello storage per inerzia.
 * Non si registrano IP ne' user agent — sono dati personali che non
 * servono a rispondere a un messaggio (spec §3).
 *
 * @param {{name: string, email: string, message: string, subject?: string}} input
 * @param {number} now - epoch ms
 * @returns {object}
 */
export function buildMessage(input, now) {
  const m = {
    name: input.name.trim(),
    email: input.email.trim(),
    message: input.message.trim(),
    receivedAt: now,
  };
  const subject = input.subject?.trim();
  if (subject) m.subject = subject;
  return m;
}

/**
 * Chiave R2 del messaggio. Il prefisso ordinabile per data rende
 * l'elenco della dashboard una `list` con prefix, senza indice da
 * mantenere; il suffisso casuale evita collisioni nello stesso secondo.
 *
 * @param {number} now - epoch ms
 * @param {string} rand - suffisso casuale
 * @returns {string}
 */
export function messageKey(now, rand) {
  // I due punti dell'ISO non sono vietati in R2, ma rendono scomode le
  // chiavi in URL e shell: si sostituiscono con trattini.
  const stamp = new Date(now).toISOString().replace(/[:.]/g, '-');
  return `_messages/${stamp}-${rand}.json`;
}
