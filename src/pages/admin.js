import '../styles/admin.css';
import { siteConfig } from '../../config/site.config.js';
import { validateSiteConfig } from '../utils/validateConfig.js';
import { fetchSite, fetchAlbums, fetchManifest } from '../providers/data.js';
import { adminApi } from '../admin/api.js';
import { parseAdminHash } from '../admin/router.js';
import { attachSortable } from '../admin/sortable.js';
import { renderAdminHome } from '../admin/views/home.js';
import { renderAdminAlbum } from '../admin/views/album.js';
import { runBatch } from '../admin/upload-manager.js';
import { processFile } from '../admin/pipeline.js';
import { makeProcessDeps } from '../admin/encoder.js';

validateSiteConfig(siteConfig);
const root = document.getElementById('admin-root');
root.innerHTML = '<p class="admin-status">Caricamento…</p>';

const [siteRes, albumsRes] = await Promise.all([fetchSite(), fetchAlbums()]);

// Primo avvio: _site/site.json può non esistere ancora → base editabile dai default build.
const ctx = {
  site: siteRes.ok
    ? siteRes.data
    : { name: siteConfig.name, bio: siteConfig.bio ?? '', hero: null, social: {} },
  albums: albumsRes.ok ? albumsRes.data : [],
  r2PublicUrl: siteConfig.r2PublicUrl,
  api: adminApi,
  navigate: hash => { window.location.hash = hash; },
  deps: {
    attachSortable,
    fetchManifest,
    prompt: window.prompt.bind(window),
    confirm: window.confirm.bind(window),
    runBatch,
    makeProcessFile: async () => {
      const deps = await makeProcessDeps();
      return file => processFile(file, deps);
    },
  },
};

function renderRoute() {
  const route = parseAdminHash(window.location.hash);
  if (route.view === 'album') renderAdminAlbum(root, Object.assign(ctx, { slug: route.slug }));
  else renderAdminHome(root, ctx);
}
window.addEventListener('hashchange', renderRoute);
if (!albumsRes.ok) {
  root.innerHTML = '<p class="admin-status">Impossibile caricare gli album (rete o dati mancanti). Ricarica la pagina.</p>';
} else {
  renderRoute();
}
