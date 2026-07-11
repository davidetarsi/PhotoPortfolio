import '../styles/main.css';
import { siteConfig } from '../../config/site.config.js';
import { texts } from '../../config/texts.config.js';
import { validateSiteConfig } from '../utils/validateConfig.js';
import { fetchSite, fetchAlbums } from '../providers/data.js';
import { resolveSiteContent, albumsToCards } from './home-logic.js';
import { renderNav } from '../components/Nav.js';
import { renderFooter } from '../components/Footer.js';
import { renderHero } from '../components/Hero.js';
import { createAlbumCard } from '../components/AlbumCard.js';

validateSiteConfig(siteConfig);

document.getElementById('albums-heading').textContent = texts.landing.albumsSectionHeading;

// Skeleton sulle card mentre i dati arrivano.
const cardsEl = document.getElementById('album-cards');
cardsEl.innerHTML = '<div class="album-card__skeleton"></div><div class="album-card__skeleton"></div>';

const [siteRes, albumsRes] = await Promise.all([fetchSite(), fetchAlbums()]);

const site = resolveSiteContent(siteRes, siteConfig);
renderNav(document.getElementById('site-nav'), { name: site.name }, texts);
renderHero(document.getElementById('hero'), site, texts);
renderFooter(document.getElementById('site-footer'), texts, site.social);

cardsEl.innerHTML = '';
if (!albumsRes.ok) {
  const p = document.createElement('p');
  p.className = 'page-error';
  p.textContent = albumsRes.error === 'NETWORK' ? texts.album.error.network : texts.album.error.unknown;
  cardsEl.appendChild(p);
} else {
  albumsToCards(albumsRes.data, siteConfig.r2PublicUrl)
    .forEach(card => cardsEl.appendChild(createAlbumCard(card)));
}
