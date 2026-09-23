/**
 * Replaces placeholders `{name}` in text with provided values.
 * Allows config/texts.config.js to remain pure data: translators and content editors
 * should not need to write JavaScript.
 *
 * Single-pass substitution: replaced values are not re-examined, so a text containing
 * `{other}` stays as-is if no matching key is provided. This prevents accidental
 * recursive substitution or injection through values.
 *
 * @param {string} template - Text with `{placeholder}` markers.
 * @param {Record<string, string|number>} valori - Values to substitute.
 * @returns {string} Text with placeholders replaced.
 */
export function formatText(template, valori = {}) {
  return String(template).replace(/\{([a-zA-Z0-9_]+)\}/g, (intero, chiave) =>
    chiave in valori ? String(valori[chiave]) : intero,
  );
}
