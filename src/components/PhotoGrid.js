import '../styles/photo-grid.css'

const MAX_SKELETONS = 12

// Aspect ratio hardcodate per gli skeleton — variano per simulare un muro di foto reale.
const SKELETON_SPECS = [
  { width: 4, height: 5 },
  { width: 3, height: 2 },
  { width: 4, height: 5 },
  { width: 16, height: 9 },
  { width: 2, height: 3 },
  { width: 3, height: 2 },
  { width: 4, height: 5 },
  { width: 3, height: 4 },
  { width: 3, height: 2 },
  { width: 16, height: 9 },
  { width: 2, height: 3 },
  { width: 4, height: 3 },
]

/**
 * Restituisce un valore CSS `aspect-ratio` sicuro; fallback a 1/1 se le dimensioni
 * non sono numeri finiti positivi (manifest vecchio/malformato).
 * @returns {string}
 */
export function aspectRatio(width, height) {
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
    ? `${width} / ${height}`
    : '1 / 1'
}

/**
 * Riempie il container con placeholder shimmer. Il layout (1 o 2 colonne) è gestito
 * interamente dal CSS multi-column — qui creiamo solo i box con l'aspect-ratio giusto.
 */
export function renderSkeletons(container, count = MAX_SKELETONS) {
  container.innerHTML = ''
  const specs = SKELETON_SPECS.slice(0, Math.min(count, MAX_SKELETONS))
  for (const spec of specs) {
    const div = document.createElement('div')
    div.className = 'photo-grid__skeleton'
    div.style.aspectRatio = aspectRatio(spec.width, spec.height)
    container.appendChild(div)
  }
}

/**
 * Renderizza le foto nel container. Nessun calcolo di posizione: il CSS multi-column
 * distribuisce gli item in 1 colonna (mobile) o 2 (desktop) e gestisce il resize.
 * L'aspect-ratio inline riserva lo spazio prima del caricamento (no layout shift).
 */
export function renderGrid(container, photos, onPhotoClick) {
  container.innerHTML = ''
  photos.forEach((photo, i) => {
    const fig = document.createElement('figure')
    fig.className = 'photo-grid__item'

    const img = document.createElement('img')
    img.src = photo.gridUrl
    img.alt = photo.name
    img.loading = 'lazy'
    img.style.aspectRatio = aspectRatio(photo.width, photo.height)
    img.addEventListener('load', () => img.classList.add('photo-grid__img--loaded'))
    img.addEventListener('error', () => { fig.style.display = 'none' })

    const cap = document.createElement('figcaption')
    cap.className = 'photo-grid__caption'
    cap.textContent = photo.name

    fig.tabIndex = 0
    fig.append(img, cap)
    fig.addEventListener('click', () => onPhotoClick(i, fig))
    fig.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPhotoClick(i, fig) }
    })
    container.appendChild(fig)
  })
}
