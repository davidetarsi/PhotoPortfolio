// Client-side replacement for compress.js: same rules (1900px, q85, never
// enlarge, as-is for already optimized webp). Decode/encode injected: logic
// is testable without canvas.

/** @type {number} Maximum dimension for resized images in pixels */
export const MAX_DIMENSION = 1900;
/** @type {number} WebP quality factor for encoding (0-1 scale) */
export const WEBP_QUALITY = 0.85;

/**
 * Calculates target dimensions for scaling while maintaining aspect ratio.
 * Never enlarges; returns as-is if already smaller than max.
 * @param {number} width - Original width in pixels.
 * @param {number} height - Original height in pixels.
 * @param {number} [max] - Maximum dimension (default: MAX_DIMENSION).
 * @returns {{width: number, height: number}} Scaled dimensions.
 */
export function targetDimensions(width, height, max = MAX_DIMENSION) {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * Determines if a file should be uploaded as-is without reprocessing.
 * @param {string} fileType - The MIME type of the file.
 * @param {number} width - Image width in pixels.
 * @param {number} height - Image height in pixels.
 * @returns {boolean} True if file is already optimized WebP and smaller than MAX_DIMENSION.
 */
export function shouldUploadAsIs(fileType, width, height) {
  return fileType === 'image/webp' && width <= MAX_DIMENSION && height <= MAX_DIMENSION;
}

/**
 * Processes an image file for upload, optionally resizing and re-encoding.
 * Extracts EXIF metadata and either uploads as-is or creates a WebP version.
 * @param {File} file - The image file to process.
 * @param {Object} deps - Processing dependencies.
 * @param {Function} deps.decode - Image decoder function.
 * @param {Function} deps.encode - WebP encoder function.
 * @param {Function} deps.extractCapturedAt - EXIF date extractor.
 * @returns {Promise<{blob: Blob, width: number, height: number, capturedAt?: number, uploadedAt: number}>} Processed image data.
 */
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
