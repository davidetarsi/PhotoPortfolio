const KNOWN_PROVIDERS = ['googleDrive'];

export function validateConfig(siteConfig, albums) {
  if (!siteConfig.name?.trim()) {
    throw new Error('[validateConfig] siteConfig.name è obbligatorio');
  }
  if (!KNOWN_PROVIDERS.includes(siteConfig.provider)) {
    throw new Error(
      `[validateConfig] siteConfig.provider "${siteConfig.provider}" non riconosciuto. Valori validi: ${KNOWN_PROVIDERS.join(', ')}`
    );
  }
  if (siteConfig.provider === 'googleDrive' && !siteConfig.driveApiKey?.trim()) {
    throw new Error(
      '[validateConfig] siteConfig.driveApiKey è obbligatorio quando provider è "googleDrive". Controlla il file .env.'
    );
  }
  if (!Array.isArray(albums) || albums.length === 0) {
    throw new Error('[validateConfig] albums deve essere un array non vuoto');
  }

  const slugs = new Set();
  for (let i = 0; i < albums.length; i++) {
    const a = albums[i];
    if (!a.slug?.trim()) {
      throw new Error(`[validateConfig] albums[${i}].slug è obbligatorio`);
    }
    if (!/^[a-z0-9-]+$/.test(a.slug)) {
      throw new Error(
        `[validateConfig] albums[${i}].slug "${a.slug}" non valido: solo lettere minuscole, numeri e trattini`
      );
    }
    if (slugs.has(a.slug)) {
      throw new Error(`[validateConfig] slug duplicato: "${a.slug}"`);
    }
    slugs.add(a.slug);
    if (!a.driveFolderId?.trim()) {
      throw new Error(`[validateConfig] albums[${i}].driveFolderId è obbligatorio`);
    }
    if (!a.title?.trim()) {
      throw new Error(`[validateConfig] albums[${i}].title è obbligatorio`);
    }
  }
}
