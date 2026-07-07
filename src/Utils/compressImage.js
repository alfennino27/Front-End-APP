// Kompresi gambar di sisi client (HP/browser) SEBELUM upload.
//
// Tujuan: tim lapangan foto kondisi barang di sinyal jelek. Kalau file mentah
// kamera (4-12MB) dikirim apa adanya, upload lambat & sering putus. Di sini
// gambar di-resize + encode webp dulu, jadi yang lewat jaringan ~200-400KB
// tapi tetap tajam. Server (compressImage.js) otomatis skip file .webp,
// jadi tidak dobel proses.

const DEFAULTS = {
  maxDimension: 1600, // sisi terpanjang (px)
  quality: 0.72,      // kualitas webp/jpeg (0-1)
  mimeType: 'image/webp',
};

// Muat File gambar → ImageBitmap (hormati orientasi EXIF), fallback <img>.
async function loadBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch (_) {
      // sebagian browser belum dukung opsi imageOrientation → coba tanpa opsi
      try {
        return await createImageBitmap(file);
      } catch (_) {
        /* jatuh ke jalur <img> di bawah */
      }
    }
  }

  return await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

/**
 * Kompres satu File gambar. Mengembalikan File baru (.webp) yang lebih kecil.
 * Kalau file bukan gambar, sudah kecil, atau kompresi gagal → kembalikan file asli.
 */
export async function compressImageFile(file, options = {}) {
  const opts = { ...DEFAULTS, ...options };

  if (!file || !file.type || !file.type.startsWith('image/')) return file;
  // GIF (animasi) & SVG jangan diutak-atik lewat canvas.
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;

  let bitmap;
  try {
    bitmap = await loadBitmap(file);
  } catch (_) {
    return file; // gagal decode → kirim apa adanya, biar server yang urus
  }

  const srcW = bitmap.width;
  const srcH = bitmap.height;
  if (!srcW || !srcH) return file;

  const scale = Math.min(1, opts.maxDimension / Math.max(srcW, srcH));
  const targetW = Math.round(srcW * scale);
  const targetH = Math.round(srcH * scale);

  try {
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    if (bitmap.close) bitmap.close();

    let blob = await canvasToBlob(canvas, opts.mimeType, opts.quality);
    // Fallback kalau browser tak bisa encode webp di canvas.
    if (!blob && opts.mimeType !== 'image/jpeg') {
      blob = await canvasToBlob(canvas, 'image/jpeg', opts.quality);
    }
    if (!blob) return file;

    // Kalau hasil malah lebih besar (gambar kecil / sudah teroptimasi), pakai asli.
    if (blob.size >= file.size) return file;

    const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
    const baseName = (file.name || 'foto').replace(/\.[^.]+$/, '');
    const newName = `${baseName}-${Date.now()}.${ext}`;
    return new File([blob], newName, { type: blob.type, lastModified: Date.now() });
  } catch (_) {
    return file;
  }
}

// Kompres banyak file sekaligus (berurutan biar HP tidak kehabisan memori).
export async function compressImageFiles(files, options = {}) {
  const out = [];
  for (const f of Array.from(files || [])) {
    out.push(await compressImageFile(f, options));
  }
  return out;
}
