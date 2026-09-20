// Logica pura del bootstrap home: testabile senza DOM né rete.
import { photoUrl } from '../providers/r2.js';
import { resolveHeroUrl } from '../utils/resolveHeroUrl.js';

export function resolveSiteContent(siteRes, buildConfig) {
  if (siteRes.ok) {
    const s = siteRes.data;
    return {
      name: s.name,
      bio: s.bio,
      social: s.social,
      heroUrl: s.hero ? photoUrl(buildConfig.r2PublicUrl, s.hero.album, s.hero.name) : null,
    };
  }
  // Fallback asimmetrico: il sito degrada in silenzio ai valori di build.
  return {
    name: buildConfig.name,
    bio: buildConfig.bio,
    social: buildConfig.social ?? {},
    heroUrl: resolveHeroUrl(buildConfig.heroImage, buildConfig.r2PublicUrl),
  };
}

export function albumsToCards(albums, r2PublicUrl) {
  return albums.map(a => ({
    slug: a.slug,
    title: a.title,
    description: a.description,
    coverUrl: a.coverName ? photoUrl(r2PublicUrl, a.slug, a.coverName) : null,
  }));
}
