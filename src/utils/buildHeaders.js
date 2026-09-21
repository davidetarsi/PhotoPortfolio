/**
 * Costruisce il contenuto di _headers dalle origini R2 dichiarate in
 * wrangler.json. Sorgente unica: chi compila wrangler.json a mano
 * seguendo il runbook ottiene la stessa CSP di chi usa Terraform.
 *
 * @param {object} config - oggetto wrangler.json
 * @param {{allowPlaceholders?: boolean}} [options] - allowPlaceholders serve
 *   solo a verificare che il template compili quando wrangler.json ha ancora
 *   i segnaposti. Non usarlo mai per un sito destinato al deploy: produce una
 *   CSP che non autorizza alcuna origine R2, cioe un sito senza foto.
 * @returns {string} contenuto del file _headers
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

  // Turnstile carica uno script e disegna un iframe: senza queste tre
  // direttive il browser lo blocca. Si aggiungono solo se il widget e'
  // configurato: autorizzare un dominio che non si usa allarga la
  // policy senza motivo.
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
