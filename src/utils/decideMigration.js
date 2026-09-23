/**
 * Determines whether the `migrate` command is safe to run.
 * `migrate` is a one-time bootstrap command: it transforms the seed in config/ into
 * runtime JSON files on R2. After that, the dashboard is the source of truth.
 * Re-running it would reset name, bio, hero, and albums back to the seed values.
 *
 * @param {string[]} chiaviEsistenti - Object keys already present on the bucket.
 * @param {boolean} force - Whether the user passed `--force`.
 * @returns {{procedi: boolean, messaggio: string}} Decision and user-facing message.
 */
export function decideMigration(chiaviEsistenti, force) {
  if (chiaviEsistenti.length === 0) {
    return { procedi: true, messaggio: '' };
  }

  const elenco = chiaviEsistenti.join(', ');

  if (force) {
    return {
      procedi: true,
      messaggio: `--force: overwriting ${elenco}.`,
    };
  }

  return {
    procedi: false,
    messaggio:
      `Already on R2: ${elenco}.\n` +
      'migrate initializes the site once. Running it now resets name, bio, hero and albums to the values in `config/`, ' +
      'discarding what you did from the dashboard.\n' +
      'If that is really what you want: npm run migrate -- --force',
  };
}
