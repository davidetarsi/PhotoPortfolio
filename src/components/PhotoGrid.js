import '../styles/photo-grid.css';

const GAP = 1 // px — distanza uniforme tra le foto

// Aspect ratio hardcodate per gli skeleton — variano intenzionalmente per simulare foto reali
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

export function layoutMasonry(items, containerWidth, numCols = 2) {
  if (containerWidth <= 0 || items.length === 0) return []
  const colWidth = (containerWidth - GAP * (numCols - 1)) / numCols
  const colY = new Array(numCols).fill(0)
  return items.map(item => {
    const col = colY.indexOf(Math.min(...colY))
    const x = col * (colWidth + GAP)
    const y = colY[col]
    const h = (item.height / item.width) * colWidth
    colY[col] += h + GAP
    return { ...item, x, y, w: colWidth, h }
  })
}

function numCols(container) {
  return container.clientWidth < 640 ? 1 : 2
}

function applyPositions(container, placed) {
  if (placed.length === 0) {
    container.style.height = '0px'
    return
  }
  const totalH = Math.max(...placed.map(p => p.y + p.h))
  container.style.height = `${totalH.toFixed(2)}px`
  for (let i = 0; i < placed.length; i++) {
    const el = container.children[i]
    if (!el) break
    const p = placed[i]
    el.style.left   = `${p.x.toFixed(2)}px`
    el.style.top    = `${p.y.toFixed(2)}px`
    el.style.width  = `${p.w.toFixed(2)}px`
    el.style.height = `${p.h.toFixed(2)}px`
  }
}

let _observer = null

function watchResize(container, getItems) {
  if (_observer) _observer.disconnect()
  if (typeof ResizeObserver === 'undefined') return
  _observer = new ResizeObserver(() => {
    container.classList.add('photo-grid--resizing')
    const placed = layoutMasonry(getItems(), container.clientWidth, numCols(container))
    applyPositions(container, placed)
  })
  _observer.observe(container)
}

export function renderSkeletons(container, count = 12) {
  container.classList.remove('photo-grid--resizing')
  container.innerHTML = ''
  const specs = SKELETON_SPECS.slice(0, count)
  for (const _ of specs) {
    const div = document.createElement('div')
    div.className = 'photo-grid__skeleton'
    container.appendChild(div)
  }
  const place = () => {
    const placed = layoutMasonry(specs, container.clientWidth, numCols(container))
    applyPositions(container, placed)
  }
  place()
  watchResize(container, () => specs)
}

export function renderGrid(container, photos, onPhotoClick) {
  if (_observer) { _observer.disconnect(); _observer = null }
  container.classList.remove('photo-grid--resizing')
  container.innerHTML = ''
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]
    const fig = document.createElement('figure')
    fig.className = 'photo-grid__item'

    const img = document.createElement('img')
    img.src = photo.gridUrl
    img.alt = photo.name
    img.loading = 'lazy'
    img.addEventListener('load', () => img.classList.add('photo-grid__img--loaded'))
    img.addEventListener('error', () => { fig.style.visibility = 'hidden' })

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
  }
  const place = () => {
    const placed = layoutMasonry(photos, container.clientWidth, numCols(container))
    applyPositions(container, placed)
  }
  place()
  watchResize(container, () => photos)
}
