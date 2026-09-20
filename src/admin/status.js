import { texts } from '../../config/texts.config.js';

// Helper di stato condiviso tra home.js e album.js: un badge ("Ultima azione
// eseguita" / "Errore") seguito dal messaggio e da un timestamp, così l'esito
// dell'ultima azione è distinguibile a colpo d'occhio e non solo dal testo.
export function createStatus(el) {
  const badge = el.querySelector('.admin-status__badge');
  const text = el.querySelector('.admin-status__text');
  const time = el.querySelector('.admin-status__time');

  const say = (msg, isError = false) => {
    badge.textContent = isError ? texts.admin.status.error : texts.admin.status.lastAction;
    badge.classList.toggle('admin-status__badge--error', isError);
    text.textContent = msg;
    time.textContent = new Date().toLocaleString('it-IT', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const run = fn => fn().catch(err => say(err.message, true));

  return { say, run };
}
