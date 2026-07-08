const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ESCAPE_MAP[ch]);
}

/**
 * Sostituisce i placeholder {{...}} negli HTML con i valori di site.config.js,
 * così i crawler social (che non eseguono JS) vedono titolo e Open Graph reali.
 * I meta tag il cui content resta vuoto vengono rimossi.
 */
export function injectSiteMeta(html, siteConfig) {
  const values = {
    SITE_NAME: siteConfig.name ?? '',
    SITE_BIO: siteConfig.bio ?? '',
    SITE_LANG: siteConfig.language ?? '',
    SITE_IMAGE: siteConfig.heroImageUrl ?? '',
  };

  const replaced = html.replace(/\{\{(SITE_[A-Z]+)\}\}/g, (match, key) =>
    key in values ? escapeHtml(values[key]) : match,
  );

  return replaced.replace(/[ \t]*<meta[^>]*content=""[^>]*>\n?/g, '');
}
