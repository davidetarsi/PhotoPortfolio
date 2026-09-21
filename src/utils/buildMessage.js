/**
 * Builds the message object to be saved on R2.
 * Copies only the expected fields: data from a public route must not land in storage
 * by accident. IP and user agent are never recorded — they are personal data not needed
 * to reply to a message (see spec §3).
 *
 * @param {{name: string, email: string, message: string, subject?: string}} input - Submitted form data.
 * @param {number} now - Current Unix timestamp in milliseconds.
 * @returns {object} The message object ready to save.
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
 * Generates the R2 object key for a message.
 * The date-sortable prefix makes the dashboard list a simple prefix query without needing
 * to maintain an index; the random suffix avoids collisions within the same second.
 *
 * @param {number} now - Current Unix timestamp in milliseconds.
 * @param {string} rand - Random suffix for collision prevention.
 * @returns {string} The R2 object key.
 */
export function messageKey(now, rand) {
  // ISO colons aren't forbidden in R2, but they make keys awkward in URLs and shell.
  // They are replaced with hyphens for usability.
  const stamp = new Date(now).toISOString().replace(/[:.]/g, '-');
  return `_messages/${stamp}-${rand}.json`;
}
