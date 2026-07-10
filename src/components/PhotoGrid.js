import '../styles/photo-grid.css';

export function renderSkeletons(container, count = 9) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const div = document.createElement('div');
    div.className = 'photo-grid__skeleton';
    container.appendChild(div);
  }
}

export function renderGrid(container, photos, onPhotoClick) {
  container.innerHTML = '';
  photos.forEach((photo, i) => {
    const fig = document.createElement('figure');
    fig.className = 'photo-grid__item';

    const img = document.createElement('img');
    img.src = photo.gridUrl;
    img.alt = photo.name;
    img.loading = 'lazy';
    img.addEventListener('load', () => img.classList.add('photo-grid__img--loaded'));
    img.addEventListener('error', () => fig.remove());

    const cap = document.createElement('figcaption');
    cap.className = 'photo-grid__caption';
    cap.textContent = photo.name;

    fig.tabIndex = 0;
    fig.append(img, cap);
    fig.addEventListener('click', () => onPhotoClick(i, fig));
    fig.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPhotoClick(i, fig); }
    });
    container.appendChild(fig);
  });
}
