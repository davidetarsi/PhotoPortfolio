// Orchestrazione del batch: nomi assegnati upfront, pool a concorrenza fissa,
// manifest scritto UNA volta a fine batch, guardia beforeunload nel mezzo.
import { normalizeFilename, assignUniqueName } from './naming.js';

export function attachBeforeUnloadGuard(win = window) {
  const handler = e => { e.preventDefault(); e.returnValue = ''; };
  win.addEventListener('beforeunload', handler);
  return () => win.removeEventListener('beforeunload', handler);
}

export async function runBatch({
  files,
  existingManifest,
  processFile,
  uploadPhoto,     // async (name, blob) => void
  putManifest,     // async (entries) => void
  onProgress = () => {},
  attachGuard = attachBeforeUnloadGuard,
  concurrency = 3,
}) {
  // 1. Nomi decisi PRIMA di qualsiasi upload: dedup su manifest ∪ batch.
  const taken = new Set(existingManifest.map(e => e.name));
  const jobs = files.map(f => {
    const name = assignUniqueName(normalizeFilename(f.name), taken);
    taken.add(name);
    return { file: f, name };
  });

  const uploaded = [];
  const failed = [];
  const detach = attachGuard();
  try {
    // 2. Pool a concorrenza fissa.
    let next = 0;
    async function workerLoop() {
      while (next < jobs.length) {
        const job = jobs[next++];
        try {
          onProgress(job.name, 'processing');
          const { blob, width, height } = await processFile(job.file);
          onProgress(job.name, 'uploading');
          await uploadPhoto(job.name, blob);
          uploaded.push({ job, entry: { name: job.name, width, height } });
          onProgress(job.name, 'done');
        } catch (error) {
          failed.push({ name: job.name, file: job.file, error });
          onProgress(job.name, 'failed');
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, workerLoop));

    // 3. Manifest: ordine di selezione dei file, solo riuscite, UNA scrittura.
    const jobIndex = new Map(jobs.map((j, i) => [j, i]));
    uploaded.sort((a, b) => jobIndex.get(a.job) - jobIndex.get(b.job));
    const entries = uploaded.map(u => u.entry);
    const manifest = [...existingManifest, ...entries];
    await putManifest(manifest);
    return { uploaded: entries, failed, manifest };
  } finally {
    detach();
  }
}
