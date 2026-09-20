// src/admin/pipeline.js
// Sostituto client-side di compress.js: stesse regole (1900px, q85, mai
// ingrandire, as-is per webp già ottimizzati). Decode/encode iniettati:
// la logica è testabile senza canvas.

export const MAX_DIMENSION = 1900;
export const WEBP_QUALITY = 0.85;

export function targetDimensions(width, height, max = MAX_DIMENSION) {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export function shouldUploadAsIs(fileType, width, height) {
  return fileType === 'image/webp' && width <= MAX_DIMENSION && height <= MAX_DIMENSION;
}

export async function processFile(file, { decode, encode, extractCapturedAt }) {
  const uploadedAt = Date.now();
  const capturedAt = await extractCapturedAt(file);
  const { bitmap, width, height } = await decode(file);
  if (shouldUploadAsIs(file.type, width, height)) {
    return { blob: file, width, height, capturedAt, uploadedAt };
  }
  const target = targetDimensions(width, height);
  const blob = await encode(bitmap, target.width, target.height, WEBP_QUALITY);
  return { blob, width: target.width, height: target.height, capturedAt, uploadedAt };
}
