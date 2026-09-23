import '../styles/photo-grid.css'

const MAX_SKELETONS = 12

// Hardcoded aspect ratios for skeleton placeholders — varied to simulate a real photo wall.
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
 * Returns a safe CSS `aspect-ratio` value.
 * Falls back to 1/1 if dimensions aren't positive finite numbers
 * (e.g., old or malformed manifest).
 * @param {number} width - Image width.
 * @param {number} height - Image height.
 * @returns {string} CSS aspect-ratio value.
 */
export function aspectRatio(width, height) {
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
    ? `${width} / ${height}`
    : '1 / 1'
}

/**
 * Renders shimmer placeholder boxes for skeleton loading.
 * Layout (1 or 2 columns) is entirely CSS multi-column; we only create boxes
 * with the correct aspect ratios.
 * @param {HTMLElement} container - Element to render into.
 * @param {number} count - Number of skeletons to show (max MAX_SKELETONS).
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
 * Renders photos in a CSS multi-column grid.
 * No position calculations: CSS multi-column handles 1 column (mobile) or 2 (desktop)
 * and responds to resize. Inline aspect-ratio reserves space before load (no layout shift).
 * @param {HTMLElement} container - Element to render into.
 * @param {Array} photos - Array of photo objects with gridUrl, name, width, height.
 * @param {Function} onPhotoClick - Callback(index, figElement) on photo click or Enter/Space.
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
