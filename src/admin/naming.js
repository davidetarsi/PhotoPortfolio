// Normalizzazione nomi upload. I nomi legacy su R2 (con maiuscole) restano
// validi lato server; i NUOVI upload sono sempre normalizzati così.

export function normalizeFilename(original) {
  const stem = String(original).replace(/\.[^.]*$/, '');
  const clean = stem
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^[._-]+|[._-]+$/g, '');
  return `${clean || 'foto'}.webp`;
}

export function assignUniqueName(base, taken) {
  if (!taken.has(base)) return base;
  const stem = base.slice(0, -'.webp'.length);
  for (let i = 2; ; i++) {
    const candidate = `${stem}-${i}.webp`;
    if (!taken.has(candidate)) return candidate;
  }
}
