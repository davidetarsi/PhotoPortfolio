/**
 * Sostituisce i segnaposto {nome} con i valori dati. Serve a tenere
 * config/texts.config.js come dati puri: chi traduce o riscrive i testi
 * non deve scrivere JavaScript.
 *
 * Una sola passata sulla stringa: i valori sostituiti non vengono
 * riesaminati, quindi un testo che contiene {altro} resta com'e'.
 *
 * @param {string} template
 * @param {Record<string, string|number>} valori
 * @returns {string}
 */
export function formatText(template, valori = {}) {
  return String(template).replace(/\{([a-zA-Z0-9_]+)\}/g, (intero, chiave) =>
    chiave in valori ? String(valori[chiave]) : intero,
  );
}
