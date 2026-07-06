export class DriveError extends Error {
  /**
   * @param {string} message
   * @param {'INVALID_KEY'|'NOT_FOUND'|'NETWORK'|'UNKNOWN'} code
   */
  constructor(message, code) {
    super(message);
    this.name = 'DriveError';
    this.code = code;
  }
}

/**
 * @param {number} status - HTTP status code
 * @param {string} message - messaggio dell'errore dall'API
 * @returns {DriveError}
 */
export function errorFromResponse(status, message) {
  if (status === 403) return new DriveError(
    `API key non valida o Drive API non abilitata: ${message}`,
    'INVALID_KEY',
  );
  if (status === 404) return new DriveError(
    `Cartella non trovata. Verifica l'ID e che la condivisione sia «Chiunque abbia il link».`,
    'NOT_FOUND',
  );
  return new DriveError(message ?? 'Errore sconosciuto', 'UNKNOWN');
}
