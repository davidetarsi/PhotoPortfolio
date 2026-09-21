const MAX_NOME = 80;

/**
 * Generates the text of the notification sent when a contact form is submitted.
 * Contains only who wrote and where to read the full message.
 *
 * IMPORTANT: The message text and sender email are NEVER included here. A notification
 * can land on a public channel (e.g., an ntfy topic is readable by anyone who guesses
 * the name), and once data leaves here it cannot be recovered. This is by design.
 *
 * @param {{name: string}} message - The contact message metadata.
 * @param {string} adminUrl - The admin dashboard URL where the full message is read.
 * @returns {string} The notification text.
 */
export function notifyBody(message, adminUrl) {
  const nome = String(message.name).slice(0, MAX_NOME);
  return `New message from ${nome}. Read it at ${adminUrl}`;
}
