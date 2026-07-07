import '../styles/main.css';
import { siteConfig } from '../../config/site.config.js';
import { albums } from '../../config/albums.config.js';
import { texts } from '../../config/texts.config.js';
import { validateConfig } from '../utils/validateConfig.js';
import { renderNav } from '../components/Nav.js';
import { renderFooter } from '../components/Footer.js';
import { createAlbumCard } from '../components/AlbumCard.js';

validateConfig(siteConfig, albums);

renderNav(document.getElementById('site-nav'), siteConfig, texts);
renderFooter(document.getElementById('site-footer'), texts);
document.getElementById('albums-heading').textContent = texts.landing.albumsSectionHeading;

const cardsEl = document.getElementById('album-cards');
albums.forEach(album => cardsEl.appendChild(createAlbumCard(album)));
