import '../styles/main.css';
import { siteConfig } from '../../config/site.config.js';
import { texts } from '../../config/texts.config.js';
import { validateSiteConfig } from '../utils/validateConfig.js';
import { fetchSite, fetchConfig } from '../providers/data.js';
import { resolveSiteContent } from './home-logic.js';
import { renderNav } from '../components/Nav.js';
import { renderFooter } from '../components/Footer.js';
import { createContactForm } from '../components/ContactForm.js';

validateSiteConfig(siteConfig);

document.getElementById('contatti-heading').textContent = texts.contatti.heading;
document.getElementById('contatti-body').textContent = texts.contatti.body;
document.getElementById('contatti-form').appendChild(createContactForm(siteConfig, texts));

const [siteRes, configRes] = await Promise.all([fetchSite(), fetchConfig()]);
const r2PublicUrl = configRes.ok ? configRes.data.r2PublicUrl : siteConfig.r2PublicUrl;
const site = resolveSiteContent(siteRes, { ...siteConfig, r2PublicUrl });
renderNav(document.getElementById('site-nav'), { name: site.name }, texts);
renderFooter(document.getElementById('site-footer'), texts, site.social);
