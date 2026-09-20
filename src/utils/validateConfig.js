// Valida SOLO la config di build (fallback): gli album vivono a runtime su R2
// e sono validati da content-rules.js (client) e dal Worker (scritture).
const KNOWN_PROVIDERS = ['r2'];

export function validateSiteConfig(siteConfig) {
  if (!siteConfig || typeof siteConfig !== 'object') {
    throw new Error('[validateSiteConfig] siteConfig non valido');
  }
  if (!siteConfig.name?.trim()) {
    throw new Error('[validateSiteConfig] siteConfig.name è obbligatorio');
  }
  if (!KNOWN_PROVIDERS.includes(siteConfig.provider)) {
    throw new Error(
      `[validateSiteConfig] siteConfig.provider "${siteConfig.provider}" non riconosciuto. Valori validi: ${KNOWN_PROVIDERS.join(', ')}`
    );
  }
  if (siteConfig.provider === 'r2' && !siteConfig.r2PublicUrl?.trim()) {
    throw new Error(
      '[validateSiteConfig] siteConfig.r2PublicUrl è obbligatorio quando provider è "r2". Controlla VITE_R2_PUBLIC_URL nel file .env.'
    );
  }
}
