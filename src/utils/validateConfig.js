/**
 * Validates site configuration at build time (fallback only).
 * Albums live at runtime on R2 and are validated separately by content-rules.js
 * (client) and the Worker (for writes).
 */
const KNOWN_PROVIDERS = ['r2'];

/**
 * Validates the site configuration object required for the build.
 * @param {object} siteConfig - Site configuration to validate.
 * @throws {Error} If configuration is invalid.
 */
export function validateSiteConfig(siteConfig) {
  if (!siteConfig || typeof siteConfig !== 'object') {
    throw new Error('[validateSiteConfig] siteConfig is invalid');
  }
  if (!siteConfig.name?.trim()) {
    throw new Error('[validateSiteConfig] siteConfig.name is required');
  }
  if (!KNOWN_PROVIDERS.includes(siteConfig.provider)) {
    throw new Error(
      `[validateSiteConfig] siteConfig.provider "${siteConfig.provider}" not recognized. Valid values: ${KNOWN_PROVIDERS.join(', ')}`
    );
  }
  if (siteConfig.provider === 'r2' && !siteConfig.r2PublicUrl?.trim()) {
    throw new Error(
      '[validateSiteConfig] siteConfig.r2PublicUrl is required when provider is "r2". Check VITE_R2_PUBLIC_URL in .env file.'
    );
  }
}
