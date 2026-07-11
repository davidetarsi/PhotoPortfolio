import '../styles/main.css';
import { siteConfig } from '../../config/site.config.js';
import { texts } from '../../config/texts.config.js';
import { validateSiteConfig } from '../utils/validateConfig.js';
import { fetchSite } from '../providers/data.js';
import { resolveSiteContent } from './home-logic.js';
import { renderNav } from '../components/Nav.js';
import { renderFooter } from '../components/Footer.js';
import { createContactForm } from '../components/ContactForm.js';

validateSiteConfig(siteConfig);

renderFooter(document.getElementById('site-footer'), texts);
document.getElementById('contatti-heading').textContent = texts.contatti.heading;
document.getElementById('contatti-body').textContent = texts.contatti.body;
document.getElementById('contatti-form').appendChild(createContactForm(siteConfig, texts));

const site = resolveSiteContent(await fetchSite(), siteConfig);
renderNav(document.getElementById('site-nav'), { name: site.name }, texts);
