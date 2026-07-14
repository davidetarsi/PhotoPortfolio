import { createAlbum } from '../album-creation.js';

export function topBarHtml({ showBackLink }) {
  return `
    <header class="admin-topbar">
      <div class="admin-topbar__left">
        <span class="admin-topbar__icon">📷</span>
        ${showBackLink ? '<a class="admin-back" href="#/">← Tutti gli album</a>' : ''}
      </div>
      <button class="admin-topbar__new-album" type="button">+ Nuovo album</button>
    </header>
  `;
}

export function attachTopBar(container, ctx) {
  container.querySelector('.admin-topbar__new-album').addEventListener('click', async () => {
    const title = ctx.deps.prompt('Titolo del nuovo album:');
    if (title === null) return;
    const result = await createAlbum(title, ctx);
    if (!result.ok) { ctx.deps.alert(result.error); return; }
    ctx.navigate(`#/album/${result.slug}`);
  });
}
