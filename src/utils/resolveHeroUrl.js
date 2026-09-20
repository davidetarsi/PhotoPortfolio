// Ricostruisce l'URL del riferimento hero dal dominio pubblico R2 corrente.
// Accoppia il riferimento {album, name} con r2PublicUrl per creare l'URL
// finale, sciolto da qualsiasi dominio scolpito nella configurazione.

export function resolveHeroUrl(heroImage, r2PublicUrl) {
  if (!heroImage?.album || !heroImage?.name) {
    return null;
  }
  return `${r2PublicUrl.replace(/\/$/, '')}/${heroImage.album}/${heroImage.name}`;
}
