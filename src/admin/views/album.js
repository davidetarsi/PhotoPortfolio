import { photoUrl } from '../../providers/r2.js';
import { moveItem } from '../sortable.js';
import { createStatus } from '../status.js';

export function renderAdminAlbum(container, ctx) {
  const { slug, r2PublicUrl, api, deps } = ctx;
  const album = ctx.albums.find(a => a.slug === slug);
  container.innerHTML = `
    <p><a class="admin-back" href="#/">← Tutti gli album</a></p>
    <section class="admin-panel">
      <h2></h2>
      <div class="admin-photo-grid"></div>
      <div class="admin-dropzone">
        <p>Trascina qui le foto o</p>
        <input type="file" multiple accept="image/jpeg,image/png,image/webp">
      </div>
      <ul class="admin-progress"></ul>
      <p class="admin-status" role="status">
        <span class="admin-status__badge"></span>
        <span class="admin-status__text"></span>
      </p>
    </section>
  `;
  container.querySelector('h2').textContent = album?.title ?? slug;

  const q = sel => container.querySelector(sel);
  const { say, run } = createStatus(q('.admin-status'));

  let manifest = [];

  function renderPhotos() {
    const grid = q('.admin-photo-grid');
    grid.innerHTML = '';
    const currentCoverName = ctx.albums.find(a => a.slug === slug)?.coverName ?? null;
    manifest.forEach(entry => {
      const isCover = entry.name === currentCoverName;
      const cell = document.createElement('figure');
      cell.className = 'admin-photo';
      cell.draggable = true;
      cell.innerHTML = `
        <img class="admin-photo__img" alt="" loading="lazy">
        <div class="admin-photo__actions">
          <button class="admin-photo__cover${isCover ? ' admin-photo__cover--selected' : ''}" title="Usa come cover">Cover</button>
          <button class="admin-photo__delete" title="Elimina">✕</button>
        </div>
      `;
      cell.querySelector('.admin-photo__img').setAttribute('src', photoUrl(r2PublicUrl, slug, entry.name));
      cell.querySelector('.admin-photo__cover').addEventListener('click', () => run(async () => {
        const updated = ctx.albums.map(a => (a.slug === slug ? { ...a, coverName: entry.name } : a));
        await api.putAlbums(updated);
        ctx.albums = updated;
        renderPhotos();
        say(`Cover: ${entry.name}`);
      }));
      cell.querySelector('.admin-photo__delete').addEventListener('click', () => run(async () => {
        if (!deps.confirm(`Eliminare ${entry.name}?`)) return;
        await api.deletePhoto(slug, entry.name);
        manifest = manifest.filter(e => e.name !== entry.name);
        renderPhotos();
      }));
      grid.appendChild(cell);
    });
  }

  async function startUpload(files) {
    if (files.length === 0) return;
    const progress = q('.admin-progress');
    progress.innerHTML = '';
    const rows = new Map();
    const processFile = await deps.makeProcessFile();
    await run(async () => {
      const result = await deps.runBatch({
        files: [...files],
        existingManifest: manifest,
        processFile,
        uploadPhoto: (name, blob) => api.uploadPhoto(slug, name, blob),
        putManifest: entries => api.putManifest(slug, entries),
        onProgress: (name, phase) => {
          if (!rows.has(name)) {
            const li = document.createElement('li');
            rows.set(name, li);
            progress.appendChild(li);
          }
          rows.get(name).textContent = `${name} — ${phase}`;
        },
      });
      manifest = result.manifest;
      renderPhotos();
      say(result.failed.length === 0
        ? `Caricate ${result.uploaded.length} foto.`
        : `Caricate ${result.uploaded.length}, fallite ${result.failed.length}: riprova trascinandole di nuovo.`,
      result.failed.length > 0);
    });
  }

  // Attaccato una sola volta: il nodo .admin-photo-grid è creato una volta
  // sola dal template sopra, renderPhotos() ne pulisce solo i figli. Farlo
  // dentro renderPhotos() accumulerebbe listener ad ogni render (ogni drag
  // ne farebbe scattare N, ognuno con la propria putManifest + re-render).
  deps.attachSortable(q('.admin-photo-grid'), (from, to) => run(async () => {
    const reordered = moveItem(manifest, from, to);
    await api.putManifest(slug, reordered);
    manifest = reordered;
    renderPhotos();
  }));

  const dropzone = q('.admin-dropzone');
  const fileInput = dropzone.querySelector('input[type="file"]');
  fileInput.addEventListener('change', () => startUpload(fileInput.files));
  dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('admin-dropzone--over'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('admin-dropzone--over'));
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('admin-dropzone--over');
    startUpload(e.dataTransfer?.files ?? []);
  });

  // Bootstrap: manifest 404 = album appena creato, griglia vuota.
  run(async () => {
    const res = await deps.fetchManifest(slug);
    if (res.ok) manifest = res.data;
    else if (res.error !== 'NOT_FOUND') { say('Impossibile caricare il manifest.', true); return; }
    renderPhotos();
  });
}
