// Helper di stato condiviso tra home.js e album.js: un badge ("Ultima azione
// eseguita" / "Errore") seguito dal messaggio, così l'esito dell'ultima
// azione è distinguibile a colpo d'occhio e non solo dal testo.
export function createStatus(el) {
  const badge = el.querySelector('.admin-status__badge');
  const text = el.querySelector('.admin-status__text');

  const say = (msg, isError = false) => {
    badge.textContent = isError ? 'Errore' : 'Ultima azione eseguita';
    badge.classList.toggle('admin-status__badge--error', isError);
    text.textContent = msg;
  };

  const run = fn => fn().catch(err => say(err.message, true));

  return { say, run };
}
