import '../styles/main.css';
import { siteConfig } from '../../config/site.config.js';
import { albums } from '../../config/albums.config.js';
import { texts } from '../../config/texts.config.js';
import { validateConfig } from '../utils/validateConfig.js';
import { renderNav } from '../components/Nav.js';
import { renderFooter } from '../components/Footer.js';

validateConfig(siteConfig, albums);

renderNav(document.getElementById('site-nav'), siteConfig, texts);
renderFooter(document.getElementById('site-footer'), texts);
document.getElementById('contatti-heading').textContent = texts.contatti.heading;
document.getElementById('contatti-body').textContent = texts.contatti.body;
