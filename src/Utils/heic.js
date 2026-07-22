// Konversi file HEIC/HEIF → JPEG di sisi client (browser/HP).
//
// iPhone default motret .heic. Browser selain Safari TIDAK bisa men-decode /
// menampilkan HEIC (canvas & <img> gagal), dan `sharp` di server juga tanpa
// libheif. Jadi kita ubah HEIC → JPEG DULU sebelum file dipakai untuk preview
// atau diupload. Dipakai bareng compressImage (funnel utama) & di handler
// upload yang mengirim file mentah / menampilkan preview langsung.

// Deteksi HEIC/HEIF via mimetype ATAU ekstensi nama (sebagian browser mengisi
// file.type kosong untuk HEIC, jadi cek nama juga).
export function isHeic(file) {
  if (!file) return false;
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  return (
    type === 'image/heic' ||
    type === 'image/heif' ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  );
}

// Ubah satu File. Bukan HEIC → kembalikan apa adanya. Gagal konversi →
// kembalikan file asli (biar jaring pengaman server yang urus).
export async function heicToJpeg(file, quality = 0.85) {
  if (!isHeic(file)) return file;
  try {
    const heic2any = (await import('heic2any')).default;
    const out = await heic2any({ blob: file, toType: 'image/jpeg', quality });
    const blob = Array.isArray(out) ? out[0] : out; // heic2any bisa balikin array
    const baseName = (file.name || 'foto').replace(/\.(heic|heif)$/i, '');
    return new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch (_) {
    return file;
  }
}

// Ubah banyak File sekaligus (berurutan biar HP tidak kehabisan memori).
export async function heicToJpegAll(files) {
  const out = [];
  for (const f of Array.from(files || [])) {
    out.push(await heicToJpeg(f));
  }
  return out;
}
