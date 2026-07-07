import '../styles/album-card.css';

export function createAlbumCard({ slug, title, description, cover }) {
  const a = document.createElement('a');
  a.className = 'album-card';
  a.href = `/album.html?album=${encodeURIComponent(slug)}`;

  const imgHtml = cover
    ? `<img class="album-card__img" src="${cover}" alt="" loading="lazy">`
    : '';

  const descHtml = description
    ? `<p class="album-card__desc"></p>`
    : '';

  a.innerHTML = `
    <div class="album-card__cover">${imgHtml}</div>
    <div class="album-card__info">
      <h3 class="album-card__title"></h3>
      ${descHtml}
    </div>
  `;

  a.querySelector('.album-card__title').textContent = title;
  if (description) a.querySelector('.album-card__desc').textContent = description;

  return a;
}
