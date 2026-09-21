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

const [siteRes, configRes] = await Promise.all([fetchSite(), fetchConfig()]);
const r2PublicUrl = configRes.ok ? configRes.data.r2PublicUrl : siteConfig.r2PublicUrl;

// La sitekey arriva a runtime, come r2PublicUrl: e' cosi' che il valore
// prodotto da Terraform e scritto in wrangler.json raggiunge il browser.
// Il valore di build resta come ripiego se la fetch della config fallisce.
// Il form si costruisce qui e non prima: creato sopra, avrebbe ricevuto
// solo il valore di build, e la catena terraform → wrangler.json → form
// si sarebbe interrotta senza che nulla lo segnalasse.
const turnstileSitekey = configRes.ok ? configRes.data.turnstileSitekey : siteConfig.turnstileSitekey;
document.getElementById('contatti-form')
  .appendChild(createContactForm({ ...siteConfig, turnstileSitekey }, texts));
const site = resolveSiteContent(siteRes, { ...siteConfig, r2PublicUrl });
renderNav(document.getElementById('site-nav'), { name: site.name }, texts);
renderFooter(document.getElementById('site-footer'), texts, site.social);
