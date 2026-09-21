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

document.getElementById('about-heading').textContent = texts.about.heading;
document.getElementById('about-body').textContent = texts.about.body;

const [siteRes, configRes] = await Promise.all([fetchSite(), fetchConfig()]);
const r2PublicUrl = configRes.ok ? configRes.data.r2PublicUrl : siteConfig.r2PublicUrl;

// The sitekey arrives at runtime, just like r2PublicUrl: this is how values
// produced by Terraform and written to wrangler.json reach the browser.
// The build value serves as fallback if config fetch fails.
// The form is built HERE, not earlier: if created above, it would receive
// only the build value, and the chain terraform → wrangler.json → form
// would break silently without warning.
const turnstileSitekey = configRes.ok ? configRes.data.turnstileSitekey : siteConfig.turnstileSitekey;
document.getElementById('about-form')
  .appendChild(createContactForm({ ...siteConfig, turnstileSitekey }, texts));
const site = resolveSiteContent(siteRes, { ...siteConfig, r2PublicUrl });
renderNav(document.getElementById('site-nav'), { name: site.name }, texts);
renderFooter(document.getElementById('site-footer'), texts, site.social);
