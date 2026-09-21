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
      messaggio: `--force: sovrascrivo ${elenco}.`,
    };
  }

  return {
    procedi: false,
    messaggio:
      `Su R2 esistono gia': ${elenco}.\n` +
      'migrate serve a inizializzare il sito una volta sola. Se lo rilanci ora ' +
      'riporti nome, bio, hero e album ai valori dei file in config/, ' +
      'cancellando quello che hai fatto dalla dashboard.\n' +
      'Se e\' davvero cio\' che vuoi: npm run migrate -- --force',
  };
}
