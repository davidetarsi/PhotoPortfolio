import { photoUrl } from '../../providers/r2.js';
import { moveItem } from '../sortable.js';
import { texts } from '../../../config/texts.config.js';
import { formatText } from '../../utils/formatText.js';
import { createStatus } from '../status.js';
import { createAlbum } from '../album-creation.js';
import { topBarHtml } from './top-bar.js';

export function buildPendingSite({ name, bio, instagram }, currentSite) {
  return {
    name: name.trim(),
    bio,
    hero: currentSite.hero,
    social: { ...currentSite.social, instagram: instagram.trim() },
  };
}

export function renderAdminHome(container, ctx) {
  const { site, albums, r2PublicUrl, api, navigate, deps } = ctx;
  const heroSrc = site.hero ? photoUrl(r2PublicUrl, site.hero.album, site.hero.name) : null;

  container.innerHTML = `
    <section class="admin-panel">
      ${topBarHtml({ showBackLink: false })}
      <h2>${texts.admin.site.sectionTitle}</h2>
      <label>${texts.admin.site.nameLabel} <input name="site-name" type="text"></label>
      <label>${texts.admin.site.bioLabel} <textarea name="site-bio" rows="2"></textarea></label>
      <label>${texts.admin.site.instagramLabel} <input name="site-instagram" type="url" placeholder="https://instagram.com/…"></label>
      <div class="admin-hero">
        <span>HeroImage:</span>
        ${heroSrc ? `<img class="admin-hero__thumb" alt="">` : '<em>nessuna</em>'}
        <select name="hero-album"><option value="">${texts.admin.site.heroChooseAlbum}</option></select>
        <div class="admin-hero__picker"></div>
      </div>
    </section>
    <section class="admin-panel">
      <h2>${texts.admin.albums.sectionTitle}</h2>
      <div class="admin-album-list"></div>
      <div class="admin-new-album">
        <input name="new-album-title" type="text" placeholder="Titolo nuovo album">
        <button class="admin-create-album">${texts.admin.albums.create}</button>
      </div>
    </section>
    <div class="admin-actions">
      <button class="admin-preview-btn" type="button">${texts.admin.site.preview}</button>
      <button class="admin-save-site">${texts.admin.site.save}</button>
      <p class="admin-status" role="status">
        <span class="admin-status__badge"></span>
        <span class="admin-status__text"></span>
        <span class="admin-status__time"></span>
      </p>
    </div>
    <div class="admin-preview" hidden></div>
  `;

  const q = sel => container.querySelector(sel);
  const { say, run } = createStatus(q('.admin-status'));

  // --- form sito ---
  q('[name="site-name"]').value = site.name;
  q('[name="site-bio"]').value = site.bio;
  q('[name="site-instagram"]').value = site.social.instagram ?? '';
  if (heroSrc) q('.admin-hero__thumb').setAttribute('src', heroSrc);

  q('.admin-save-site').addEventListener('click', () => run(async () => {
    const updated = buildPendingSite({
      name: q('[name="site-name"]').value,
      bio: q('[name="site-bio"]').value,
      instagram: q('[name="site-instagram"]').value,
    }, site);
    await api.putSite(updated);
    ctx.site = updated;
    say(texts.admin.site.saved);
  }));

  q('.admin-preview-btn').addEventListener('click', () => {
    const pending = buildPendingSite({
      name: q('[name="site-name"]').value,
      bio: q('[name="site-bio"]').value,
      instagram: q('[name="site-instagram"]').value,
    }, site);
    deps.showPreview(q('.admin-preview'), { name: pending.name, bio: pending.bio, heroUrl: heroSrc, social: pending.social, albums, r2PublicUrl }, texts, deps);
  });

  // --- hero picker: scegli album → thumbs → click imposta hero ---
  const heroSelect = q('[name="hero-album"]');
  for (const a of albums) {
    const opt = document.createElement('option');
    opt.value = a.slug;
    opt.textContent = a.title;
    heroSelect.appendChild(opt);
  }
  heroSelect.addEventListener('change', () => run(async () => {
    const picker = q('.admin-hero__picker');
    picker.innerHTML = '';
    if (!heroSelect.value) return;
    const res = await deps.fetchManifest(heroSelect.value);
    if (!res.ok) { say(texts.admin.site.heroReadError, true); return; }
    for (const entry of res.data) {
      const img = document.createElement('img');
      img.className = 'admin-hero__choice';
      img.src = photoUrl(r2PublicUrl, heroSelect.value, entry.name);
      img.addEventListener('click', () => run(async () => {
        const updated = { ...ctx.site, hero: { album: heroSelect.value, name: entry.name } };
        await api.putSite(updated);
        ctx.site = updated;
        renderAdminHome(container, ctx); // re-render con la nuova hero
        // Il re-render sopra ricrea .admin-status da zero: say() del closure
        // precedente scriverebbe su un nodo ormai smontato. Va ri-agganciato
        // al nuovo nodo per far comparire il messaggio.
        createStatus(container.querySelector('.admin-status')).say(texts.admin.site.heroUpdated);
      }));
      picker.appendChild(img);
    }
  }));

  // --- lista album: riordino drag&drop, apri, cancella ---
  const list = q('.admin-album-list');
  for (const a of albums) {
    const row = document.createElement('div');
    row.className = 'admin-album-row';
    row.draggable = true;
    row.innerHTML = `
      <span class="admin-album-row__handle">⋮⋮</span>
      <a class="admin-album-row__title" href="#/album/${a.slug}"></a>
      <button class="admin-delete-album" title="Elimina album">Elimina</button>
    `;
    row.querySelector('.admin-album-row__title').textContent = a.title;
    row.querySelector('.admin-delete-album').addEventListener('click', () => run(async () => {
      const typed = deps.prompt(`Per eliminare scrivi il nome esatto dell'album: "${a.title}"`);
      if (typed !== a.title) { say(texts.admin.albums.deleteNameMismatch, true); return; }
      await api.deleteAlbum(a.slug);
      ctx.albums = ctx.albums.filter(x => x.slug !== a.slug);
      renderAdminHome(container, ctx);
    }));
    list.appendChild(row);
  }
  deps.attachSortable(list, (from, to) => run(async () => {
    const reordered = moveItem(ctx.albums, from, to);
    await api.putAlbums(reordered);
    ctx.albums = reordered;
    renderAdminHome(container, ctx);
  }));

  // --- nuovo album ---
  q('.admin-create-album').addEventListener('click', () => run(async () => {
    const result = await createAlbum(q('[name="new-album-title"]').value, ctx);
    if (!result.ok) { say(result.error, true); return; }
    navigate(`#/album/${result.slug}`);
  }));
}
