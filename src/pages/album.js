import '../styles/main.css';
import { siteConfig } from '../../config/site.config.js';
import { albums } from '../../config/albums.config.js';
import { texts } from '../../config/texts.config.js';
import { validateConfig } from '../utils/validateConfig.js';
import { listPhotos } from '../providers/googleDrive.js';
import { renderNav } from '../components/Nav.js';
import { renderFooter } from '../components/Footer.js';
import { renderSkeletons, renderGrid } from '../components/PhotoGrid.js';
import { createLightbox } from '../components/Lightbox.js';

validateConfig(siteConfig, albums);

const album = albums[0];
const gridEl = document.getElementById('photo-grid');

renderNav(document.getElementById('site-nav'), siteConfig, texts);
renderFooter(document.getElementById('site-footer'), texts);
document.getElementById('album-title').textContent = album.title;
renderSkeletons(gridEl, 12);

listPhotos(album.driveFolderId, siteConfig.driveApiKey)
  .then(photos => {
    const lb = createLightbox(photos);
    renderGrid(gridEl, photos, (i, triggerEl) => lb.open(i, triggerEl));
  })
  .catch(err => {
    const code = err.code;
    const msg = code === 'INVALID_KEY' ? texts.album.error.forbidden
      : code === 'NOT_FOUND' ? texts.album.error.notFound
      : code === 'NETWORK' ? texts.album.error.network
      : texts.album.error.unknown;
    const p = document.createElement('p');
    p.className = 'photo-grid__error';
    p.textContent = msg;
    gridEl.replaceChildren(p);
  });
