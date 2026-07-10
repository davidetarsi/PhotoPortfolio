import { getCached, setCached } from './cache.js'

/**
 * @param {string} albumSlug - Slug dell'album (es. 'sport-album').
 * @param {string} r2PublicUrl - URL pubblico base del bucket R2 (es. 'https://pub-xxx.r2.dev').
 * @returns {Promise<Array<{name: string, gridUrl: string, fullUrl: string, width: number, height: number}>>}
 */
export async function listPhotos(albumSlug, r2PublicUrl) {
  const cacheKey = `r2_${albumSlug}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  const base = r2PublicUrl.replace(/\/$/, '')
  const manifestUrl = `${base}/${albumSlug}/manifest.json`

  let res
  try {
    res = await fetch(manifestUrl)
  } catch (cause) {
    const err = new Error(`Errore di rete: ${cause.message}`)
    err.code = 'NETWORK'
    throw err
  }

  if (res.status === 404) {
    const err = new Error(`Album "${albumSlug}" non trovato su R2 (manifest.json assente)`)
    err.code = 'NOT_FOUND'
    throw err
  }

  if (!res.ok) {
    const err = new Error(`Errore HTTP ${res.status} caricando il manifest`)
    err.code = 'UNKNOWN'
    throw err
  }

  const entries = await res.json()
  const photoBase = `${base}/${albumSlug}`
  // R2 non ha image transforms nativi — grid e lightbox ricevono la stessa immagine full-res.
  const photos = entries.map(({ name, width, height }) => ({
    name,
    width,
    height,
    gridUrl: `${photoBase}/${name}`,
    fullUrl: `${photoBase}/${name}`,
  }))

  setCached(cacheKey, photos)
  return photos
}
