const MAX_NOME = 80;

/**
 * Testo della notifica. Contiene chi ha scritto e dove andare a leggere,
 * MAI il messaggio ne' l'email di chi scrive: la notifica puo' finire su
 * un canale pubblico — un topic ntfy e' leggibile da chiunque ne indovini
 * il nome — e quello che esce di qui non si riprende piu'.
 *
 * @param {{name: string}} message
 * @param {string} adminUrl
 * @returns {string}
 */
export function notifyBody(message, adminUrl) {
  const nome = String(message.name).slice(0, MAX_NOME);
  return `Nuovo messaggio da ${nome}. Leggilo su ${adminUrl}`;
}
