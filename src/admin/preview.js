// Overlay di anteprima per il form Sito. Riusa renderHero/renderFooter/
// createAlbumCard/PhotoGrid/Lightbox/resolveAlbumPage — le stesse funzioni
// del sito pubblico — così l'anteprima non è mai una reimplementazione
// parallela che può disallinearsi. L'header (titolo + Chiudi) resta fisso:
// solo .admin-preview__content cambia tra vista landing e vista album.
import '../styles/main.css'; // .container, .section-heading (layout condiviso con index.html/album.html)
import { renderHero } from '../components/Hero.js';
import { renderFooter } from '../components/Footer.js';
import { createAlbumCard } from '../components/AlbumCard.js';
import { renderSkeletons, renderGrid } from '../components/PhotoGrid.js';
import { createLightbox } from '../components/Lightbox.js';
import { albumsToCards } from '../pages/home-logic.js';
import { resolveAlbumPage } from '../pages/album-logic.js';
import { photosFromManifest } from '../providers/r2.js';

let _keyboardBound = false;
// Incrementato ad ogni cambio vista: una fetch manifest in volo che risolve
// dopo che l'utente è tornato alla landing (o ha aperto un altro album, o ha
// chiuso la preview) confronta il proprio token e si arrende invece di
// scrivere su una vista non più attiva.
let _renderToken = 0;
// Ultima lightbox creata entrando in una vista album: createLightbox non ha
// modo di essere "sostituita" da sé — va smontata esplicitamente prima di
// aprirne un'altra, altrimenti si accumulano nodi in document.body ad ogni
// album visitato nella stessa sessione di anteprima.
let _activeLightbox = null;

function teardownLightbox() {
  if (!_activeLightbox) return;
  _activeLightbox.destroy();
  _activeLightbox = null;
}

function currentPreviewEl() {
  return document.querySelector('.admin-preview');
}

// Interroga i focusabili ogni volta (non li memorizza): cambiano tra vista
// landing (album-card, link social) e vista album (back, foto della griglia).
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
    // Nel mezzo Tab si muove normalmente, senza preventDefault.
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

export function showPreview(container, data, texts, deps) {
  ensureKeyboardHandling();
  container.innerHTML = `
    <div class="admin-preview__header">
      <h2>Anteprima</h2>
      <button class="admin-preview__close" type="button">Chiudi</button>
    </div>
    <div class="admin-preview__content"></div>
  `;
  container.querySelector('.admin-preview__close').addEventListener('click', () => hidePreview(container));
  renderLandingView(container, data, texts, deps);
  container.hidden = false;
  container.querySelector('.admin-preview__close').focus();
}

function renderLandingView(container, data, texts, deps) {
  _renderToken++;
  teardownLightbox();
  const { name, bio, heroUrl, social, albums = [], r2PublicUrl } = data;
  const content = container.querySelector('.admin-preview__content');
  content.innerHTML = `
    <div class="admin-preview__hero"></div>
    <div class="container">
      <h2 class="section-heading"></h2>
      <div class="admin-preview__albums album-cards"></div>
    </div>
    <div class="admin-preview__footer"></div>
  `;
  renderHero(content.querySelector('.admin-preview__hero'), { name, bio, heroUrl }, texts);
  content.querySelector('.section-heading').textContent = texts.landing.albumsSectionHeading;
  const cardsEl = content.querySelector('.admin-preview__albums');
  albumsToCards(albums, r2PublicUrl).forEach(card => {
    const cardEl = createAlbumCard(card);
    cardEl.addEventListener('click', e => {
      e.preventDefault(); // dentro l'anteprima non si naviga davvero: si cambia solo il contenuto
      renderAlbumView(container, card.slug, data, texts, deps);
    });
    cardsEl.appendChild(cardEl);
  });
  renderFooter(content.querySelector('.admin-preview__footer'), texts, social);
}

async function renderAlbumView(container, slug, data, texts, deps) {
  const token = ++_renderToken;
  teardownLightbox();
  const { albums = [], r2PublicUrl, social } = data;
  const content = container.querySelector('.admin-preview__content');
  content.innerHTML = `
    <p><button type="button" class="admin-back admin-preview__back">← Tutti gli album</button></p>
    <div class="container">
      <h2 class="section-heading"></h2>
      <div class="admin-preview__photo-grid photo-grid"></div>
    </div>
    <div class="admin-preview__footer"></div>
  `;
  content.querySelector('.admin-preview__back').addEventListener('click', () => renderLandingView(container, data, texts, deps));
  renderFooter(content.querySelector('.admin-preview__footer'), texts, social);

  const gridEl = content.querySelector('.admin-preview__photo-grid');
  renderSkeletons(gridEl, 12);

  const manifestRes = await deps.fetchManifest(slug);
  if (token !== _renderToken) return; // la vista è cambiata mentre la fetch era in volo

  const page = resolveAlbumPage(slug, { ok: true, data: albums }, manifestRes);
  const titleEl = content.querySelector('.section-heading');

  if (page.kind === 'not_found') {
    titleEl.textContent = '';
    gridEl.innerHTML = `<p class="photo-grid__error">${texts.album.notFound}</p>`;
  } else {
    titleEl.textContent = page.album.title;
    if (page.kind === 'empty') {
      gridEl.innerHTML = `<p class="photo-grid__error">${texts.album.empty}</p>`;
    } else if (page.kind === 'error') {
      gridEl.innerHTML = `<p class="photo-grid__error">${page.code === 'network' ? texts.album.error.network : texts.album.error.unknown}</p>`;
    } else {
      const photos = photosFromManifest(page.entries, slug, r2PublicUrl);
      const lb = createLightbox(photos);
      _activeLightbox = lb;
      renderGrid(gridEl, photos, (i, triggerEl) => lb.open(i, triggerEl));
    }
  }
}

export function hidePreview(container) {
  _renderToken++;
  teardownLightbox();
  container.hidden = true;
  container.innerHTML = '';
}
