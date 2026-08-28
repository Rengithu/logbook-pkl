const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size');
const sharp = require('sharp');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

/**
 * Given a stored photo filename, return { buffer, ext, width, height }
 * scaled down (keeping aspect ratio) so the longest side <= maxDim (px).
 */
async function loadScaledImage(filename, maxDim = 260) {
  const fullPath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File foto tidak ditemukan: ${filename}`);
  }
  const buffer = fs.readFileSync(fullPath);
  const dims = sizeOf(buffer);
  let { width, height } = dims;
  if (!width || !height) { width = maxDim; height = maxDim; }
  
  // 1. Calculate DISPLAY dimensions (for Word/PDF layout formatting)
  const displayScale = Math.min(1, maxDim / Math.max(width, height));
  const displayWidth = Math.round(width * displayScale);
  const displayHeight = Math.round(height * displayScale);
  
  // 2. Calculate RENDER dimensions (actual pixels kept in the file)
  // Max 1200px guarantees extreme sharpness when printed on A4,
  // but keeping quality=80 ensures the file size remains very small (under ~150KB per photo)
  const RENDER_MAX = 1200;
  const renderScale = Math.min(1, RENDER_MAX / Math.max(width, height));
  const renderWidth = Math.round(width * renderScale);
  const renderHeight = Math.round(height * renderScale);
  
  const compressedBuffer = await sharp(buffer)
    .rotate() // Auto-orient based on EXIF
    .resize(renderWidth, renderHeight, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();

  return { buffer: compressedBuffer, ext: 'jpeg', width: displayWidth, height: displayHeight };
}

module.exports = { loadScaledImage, UPLOADS_DIR };
