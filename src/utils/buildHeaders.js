/**
 * Builds the `_headers` file content from R2 origins declared in wrangler.json.
 * Single source of truth: manual wrangler.json compilation following the runbook
 * produces the same CSP as using Terraform.
 *
 * @param {object} config - The wrangler.json configuration object.
 * @param {{allowPlaceholders?: boolean}} [options] - If allowPlaceholders is true,
 *   allows placeholder values in R2 origins. Use only for build verification:
 *   it produces a CSP that authorizes no R2 origin, making the site load no photos.
 *   Never use for a production deploy.
 * @returns {string} The complete `_headers` file content.
 */
export function buildHeaders(config, options = {}) {
  const prod = config?.vars?.R2_PUBLIC_URL;
  const staging = config?.env?.staging?.vars?.R2_PUBLIC_URL;

  if (!prod) {
    throw new Error('wrangler.json: vars.R2_PUBLIC_URL mancante, impossibile generare la CSP.');
  }

  const origini = [...new Set([prod, staging].filter(Boolean))];

  const segnaposto = origini.filter(o => /pub-(x+|y+)\.r2\.dev/.test(o));
  if (segnaposto.length > 0 && !options.allowPlaceholders) {
    throw new Error(
      `wrangler.json contiene ancora un segnaposto (${segnaposto.join(', ')}). ` +
      'Compila i valori reali, o generalo con `npm run infra:sync`.',
    );
  }

  const lista = origini.join(' ');

  // Turnstile loads a script and renders an iframe: the browser blocks both without
  // the matching CSP directives. We add them only if the widget is configured:
  // authorizing a domain we don't use unnecessarily widens the policy.
  const turnstile = config?.vars?.TURNSTILE_SITEKEY ? 'https://challenges.cloudflare.com' : '';
  const conTurnstile = direttiva => (turnstile ? `${direttiva} ${turnstile}` : direttiva);

  const csp = [
    "default-src 'self'",
    conTurnstile("script-src 'self'"),
    "style-src 'self' https://fonts.googleapis.com",
    'font-src https://fonts.gstatic.com',
    `img-src 'self' data: ${lista}`,
    conTurnstile(`connect-src 'self' ${lista}`),
    "form-action 'self'",
    ...(turnstile ? [`frame-src ${turnstile}`] : []),
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    'upgrade-insecure-requests',
  ].join('; ');

  return [
    '/*',
    `  Content-Security-Policy: ${csp}`,
    '  Strict-Transport-Security: max-age=31536000; includeSubDomains',
    '  X-Frame-Options: DENY',
    '  X-XSS-Protection: 0',
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    '  Permissions-Policy: geolocation=(), microphone=(), camera=()',
    '',
  ].join('\n');
}
