/**
 * Decide se `migrate` puo' scrivere su R2. Migrate e' un comando di
 * bootstrap: trasforma il seed di config/ nei JSON runtime una volta sola.
 * Dopo, la verita' e' cio' che la dashboard ha scritto, e rilanciarlo
 * significherebbe riportare indietro nome, bio, hero e album al seed.
 *
 * @param {string[]} chiaviEsistenti - chiavi gia' presenti sul bucket
 * @param {boolean} force - l'utente ha passato --force
 * @returns {{procedi: boolean, messaggio: string}}
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
