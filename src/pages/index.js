import '../styles/main.css';
import { siteConfig } from '../../config/site.config.js';
import { albums as buildAlbums } from '../../config/albums.config.js';
import { texts } from '../../config/texts.config.js';
import { validateSiteConfig } from '../utils/validateConfig.js';
import { fetchSite, fetchAlbums, fetchConfig } from '../providers/data.js';
import { resolveSiteContent, resolveAlbums, albumsToCards } from './home-logic.js';
import { renderNav } from '../components/Nav.js';
import { renderFooter } from '../components/Footer.js';
import { renderHero } from '../components/Hero.js';
import { createAlbumCard } from '../components/AlbumCard.js';

validateSiteConfig(siteConfig);

document.getElementById('albums-heading').textContent = texts.landing.albumsSectionHeading;

// Skeleton cards while data is being fetched.
const cardsEl = document.getElementById('album-cards');
cardsEl.innerHTML = '<div class="album-card__skeleton"></div><div class="album-card__skeleton"></div>';

const [siteRes, albumsRes, configRes] = await Promise.all([fetchSite(), fetchAlbums(), fetchConfig()]);
const r2PublicUrl = configRes.ok ? configRes.data.r2PublicUrl : siteConfig.r2PublicUrl;

const site = resolveSiteContent(siteRes, { ...siteConfig, r2PublicUrl });
renderNav(document.getElementById('site-nav'), { name: site.name }, texts);
renderHero(document.getElementById('hero'), site, texts);
renderFooter(document.getElementById('site-footer'), texts, site.social);

cardsEl.innerHTML = '';
const resolvedAlbums = resolveAlbums(albumsRes, buildAlbums);
if (resolvedAlbums === null) {
  const p = document.createElement('p');
  p.className = 'page-error';
  p.textContent = albumsRes.error === 'NETWORK' ? texts.album.error.network : texts.album.error.unknown;
  cardsEl.appendChild(p);
} else {
  albumsToCards(resolvedAlbums, r2PublicUrl)
    .forEach(card => cardsEl.appendChild(createAlbumCard(card)));
}
