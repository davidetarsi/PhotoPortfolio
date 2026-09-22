import '../styles/main.css';
import { siteConfig } from '../../config/site.config.js';
import { albums as buildAlbums } from '../../config/albums.config.js';
import { texts } from '../../config/texts.config.js';
import { validateSiteConfig } from '../utils/validateConfig.js';
import { fetchSite, fetchAlbums, fetchManifest, fetchConfig } from '../providers/data.js';
import { photosFromManifest } from '../providers/r2.js';
import { resolveSiteContent, resolveAlbums } from './home-logic.js';
import { resolveAlbumPage } from './album-logic.js';
import { renderNav } from '../components/Nav.js';
import { renderFooter } from '../components/Footer.js';
import { renderSkeletons, renderGrid } from '../components/PhotoGrid.js';
import { createLightbox } from '../components/Lightbox.js';

validateSiteConfig(siteConfig);

const gridEl = document.getElementById('photo-grid');
renderSkeletons(gridEl, 12);

const slug = window.location.pathname.replace(/^\/|\/$/g, '');

// Slug is known from the URL: no waterfall, all fetches in parallel.
const [siteRes, albumsRes, manifestRes, configRes] = await Promise.all([
  fetchSite(),
  fetchAlbums(),
  fetchManifest(slug),
  fetchConfig(),
]);
const r2PublicUrl = configRes.ok ? configRes.data.r2PublicUrl : siteConfig.r2PublicUrl;
const hasPublicUrl = typeof r2PublicUrl === 'string' && r2PublicUrl.trim().length > 0;

const site = resolveSiteContent(siteRes, { ...siteConfig, r2PublicUrl });
renderNav(document.getElementById('site-nav'), { name: site.name }, texts);
renderFooter(document.getElementById('site-footer'), texts, site.social);

const resolvedAlbums = resolveAlbums(albumsRes, buildAlbums);
const albumsForPage = resolvedAlbums === null
  ? albumsRes
  : { ok: true, data: resolvedAlbums };
const page = resolveAlbumPage(slug, albumsForPage, manifestRes);

function showMessage(text, withHomeLink = false) {
  const p = document.createElement('p');
  p.className = 'photo-grid__error';
  p.textContent = text;
  gridEl.replaceChildren(p);
  if (withHomeLink) {
    const link = document.createElement('a');
    link.href = '/';
    link.textContent = texts.album.notFoundLink;
    gridEl.appendChild(link);
  }
}

if (page.kind === 'not_found') {
  document.getElementById('album-title').textContent = '';
  showMessage(texts.album.notFound, true);
} else if (page.kind === 'error') {
  showMessage(page.code === 'network' ? texts.album.error.network : texts.album.error.unknown);
} else {
  document.title = `${page.album.title} — ${site.name}`;
  document.getElementById('album-title').textContent = page.album.title;
  if (page.kind === 'empty') {
    showMessage(texts.album.empty);
  } else if (!hasPublicUrl) {
    showMessage(texts.album.error.noImage);
  } else {
    const photos = photosFromManifest(page.entries, slug, r2PublicUrl);
    const lb = createLightbox(photos);
    renderGrid(gridEl, photos, (i, triggerEl) => lb.open(i, triggerEl));
  }
}
