// Isola la dipendenza exifr: se manca l'EXIF o il parsing fallisce (foto da
// screenshot, WhatsApp, download — spesso senza EXIF), non deve mai bloccare
// l'upload — sempre undefined, mai un'eccezione che risale al chiamante.
import { parse } from 'exifr';

export async function extractCapturedAt(file) {
  try {
    const exif = await parse(file, ['DateTimeOriginal']);
    const date = exif?.DateTimeOriginal;
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date.getTime() : undefined;
  } catch {
    return undefined;
  }
}
