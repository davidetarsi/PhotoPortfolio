// Overlay di anteprima per il form Sito. Riusa renderHero/renderFooter — le
// stesse funzioni del sito pubblico — così l'anteprima non è mai una
// reimplementazione parallela che può disallinearsi.
import { renderHero } from '../components/Hero.js';
import { renderFooter } from '../components/Footer.js';

// Il listener va agganciato una sola volta PER SEMPRE (non per container: il
// container viene ricreato ad ogni render di home.js). Cerca il contenitore
// vivo al momento del keydown invece di chiuderci sopra un riferimento che
// potrebbe diventare stantio — evita l'accumulo di listener già corretto
// una volta in album.js/attachSortable.
let _keyboardBound = false;

function currentPreviewEl() {
  return document.querySelector('.admin-preview');
}

// Interroga i focusabili ogni volta (non li memorizza): il footer può avere
// zero o più link social a seconda del pending state corrente.
function focusableElements(el) {
  return [...el.querySelectorAll('button, a[href]')];
}

function ensureKeyboardHandling() {
  if (_keyboardBound) return;
  _keyboardBound = true;
  document.addEventListener('keydown', e => {
    const el = currentPreviewEl();
    if (!el || el.hidden) return;
    if (e.key === 'Escape') {
      hidePreview(el);
      return;
    }
    if (e.key !== 'Tab') return;
    // Anello tra primo e ultimo focusabile — interviene solo ai bordi.
    // Nel mezzo (es. dal tasto Chiudi a un link social) Tab si muove
    // normalmente, senza preventDefault: i link nel footer restano
    // raggiungibili da tastiera, non solo il tasto Chiudi.
    const focusable = focusableElements(el);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

export function showPreview(container, { name, bio, heroUrl, social }, texts) {
  ensureKeyboardHandling();
  container.innerHTML = `
    <div class="admin-preview__header">
      <h2>Anteprima</h2>
      <button class="admin-preview__close" type="button">Chiudi</button>
    </div>
    <div class="admin-preview__content">
      <div class="admin-preview__hero"></div>
      <div class="admin-preview__footer"></div>
    </div>
  `;
  renderHero(container.querySelector('.admin-preview__hero'), { name, bio, heroUrl }, texts);
  renderFooter(container.querySelector('.admin-preview__footer'), texts, social);

  const closeBtn = container.querySelector('.admin-preview__close');
  closeBtn.addEventListener('click', () => hidePreview(container));

  container.hidden = false;
  closeBtn.focus();
}

export function hidePreview(container) {
  container.hidden = true;
  container.innerHTML = '';
}
