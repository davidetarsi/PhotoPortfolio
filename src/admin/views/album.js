import { photoUrl } from '../../providers/r2.js';
import { moveItem } from '../sortable.js';
import { createStatus } from '../status.js';

export function buildPendingAlbum({ description, coverName }, currentAlbum) {
  return { ...currentAlbum, description, coverName };
}

export function renderAdminAlbum(container, ctx) {
  const { slug, r2PublicUrl, api, deps } = ctx;
  const album = ctx.albums.find(a => a.slug === slug);
  container.innerHTML = `
    <p><a class="admin-back" href="#/">← Tutti gli album</a></p>
    <section class="admin-panel">
      <h2></h2>
      <label>Sottotitolo <input name="album-description" type="text"></label>
      <div class="admin-album-toolbar">
        <button class="admin-sort-date" type="button">Ordina per data</button>
      </div>
      <div class="admin-photo-grid"></div>
      <div class="admin-dropzone">
        <label class="admin-dropzone__label">
          Trascina qui le foto o <span class="admin-dropzone__browse">scegli i file da caricare</span>
          <input class="admin-dropzone__input" type="file" multiple accept="image/jpeg,image/png,image/webp">
        </label>
      </div>
      <ul class="admin-progress"></ul>
      <button class="admin-save-album">Salva</button>
      <p class="admin-status" role="status">
        <span class="admin-status__badge"></span>
        <span class="admin-status__text"></span>
      </p>
    </section>
  `;
  container.querySelector('h2').textContent = album?.title ?? slug;

  const q = sel => container.querySelector(sel);
  const { say, run } = createStatus(q('.admin-status'));

  const fallbackAlbum = { slug, title: slug, description: '', coverName: null };
  const pending = { description: album?.description ?? '', coverName: album?.coverName ?? null };
  let detachGuard = null;
  function markDirty() {
    if (!detachGuard) detachGuard = deps.attachBeforeUnloadGuard();
  }
  function clearDirty() {
    if (detachGuard) { detachGuard(); detachGuard = null; }
  }
  // Se si esce dall'album sporco con un hashchange che non passa dal click
  // handler del back-link (Back/Forward del browser, o un navigate()
  // programmatico), il router in admin.js sovrascrive root.innerHTML e
  // scarta questa closure senza mai chiamare clearDirty(): il listener
  // beforeunload agganciato da markDirty() resterebbe attaccato a window
  // per il resto della sessione SPA (si accumula ad ogni album sporco
  // abbandonato così), causando poi un prompt "Leave site?" fantasma su un
  // refresh/chiusura futura senza modifiche pending. { once: true } fa sì
  // che questo listener stesso non si accumuli mai.
  window.addEventListener('hashchange', clearDirty, { once: true });
  q('[name="album-description"]').value = pending.description;
  q('[name="album-description"]').addEventListener('input', () => {
    pending.description = q('[name="album-description"]').value;
    markDirty();
  });

  let manifest = [];

  function renderPhotos() {
    const grid = q('.admin-photo-grid');
    grid.innerHTML = '';
    manifest.forEach(entry => {
      const isCover = entry.name === pending.coverName;
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
      cell.querySelector('.admin-photo__cover').addEventListener('click', () => {
        pending.coverName = entry.name;
        markDirty();
        renderPhotos();
        say(`Cover selezionata: ${entry.name} (premi Salva per confermare).`);
      });
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

  q('.admin-sort-date').addEventListener('click', () => run(async () => {
    const sortKey = p => p.capturedAt ?? p.uploadedAt ?? 0;
    const sorted = [...manifest].sort((a, b) => sortKey(a) - sortKey(b));
    await api.putManifest(slug, sorted);
    manifest = sorted;
    renderPhotos();
    say('Foto ordinate per data.');
  }));

  q('.admin-save-album').addEventListener('click', () => run(async () => {
    const updatedAlbum = buildPendingAlbum(pending, album ?? fallbackAlbum);
    const updatedAlbums = ctx.albums.map(a => (a.slug === slug ? updatedAlbum : a));
    await api.putAlbums(updatedAlbums);
    ctx.albums = updatedAlbums;
    clearDirty();
    say('Album salvato.');
  }));

  // detachGuard è non-null solo quando c'è una modifica pending: usato
  // direttamente come proxy di "dirty" invece di un booleano separato da
  // tenere sincronizzato.
  q('.admin-back').addEventListener('click', e => {
    if (!detachGuard) return; // niente pending, naviga libero
    if (!deps.confirm('Ci sono modifiche non salvate. Uscire comunque?')) {
      e.preventDefault();
    } else {
      clearDirty();
    }
  });

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
