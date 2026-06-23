// Definisi template layout halaman gambar SPK.
// Dipakai bersama oleh SPKLayoutModal (pemilihan) & CetakSPK (render PDF) agar konsisten.
//
// areas: array string baris untuk CSS grid-template-areas. Huruf a..d = urutan slot.
// 3-2top → baris bawah ('c c') membentang penuh (gambar ke-3 di tengah/lebar).
export const SPK_TEMPLATES = {
  'full':   { slots: 1, cols: '1fr',     rows: '1fr',         areas: ['a'],            label: '1 Penuh' },
  '2-lr':   { slots: 2, cols: '1fr 1fr', rows: '1fr',         areas: ['a b'],          label: '2 Kiri-Kanan' },
  '2-tb':   { slots: 2, cols: '1fr',     rows: '1fr 1fr',     areas: ['a', 'b'],       label: '2 Atas-Bawah' },
  '3-2top': { slots: 3, cols: '1fr 1fr', rows: '1fr 1fr',     areas: ['a b', 'c c'],   label: '3 (2 atas)' },
  '3-1top': { slots: 3, cols: '1fr 1fr', rows: '1fr 1fr',     areas: ['a a', 'b c'],   label: '3 (1 atas)' },
  '4-grid': { slots: 4, cols: '1fr 1fr', rows: '1fr 1fr',     areas: ['a b', 'c d'],   label: '4 (2×2)' },
};

export const TEMPLATE_ORDER = ['full', '2-lr', '2-tb', '3-2top', '3-1top', '4-grid'];
export const SLOT_LETTERS = ['a', 'b', 'c', 'd'];

// Nilai untuk style.gridTemplateAreas.
export const gridAreasValue = (areas) => areas.map((r) => `"${r}"`).join(' ');

// Template default berdasarkan jumlah gambar yang akan diisi di sebuah halaman.
export const defaultTemplateFor = (count) => {
  if (count <= 1) return 'full';
  if (count === 2) return '2-lr';
  if (count === 3) return '3-2top';
  return '4-grid';
};

// Bagi daftar gambar menjadi halaman (maks 4/halaman) dengan template default + slot terisi berurutan.
export const buildInitialPages = (imgs) => {
  const pages = [];
  for (let i = 0; i < imgs.length; i += 4) {
    const chunk = imgs.slice(i, i + 4);
    const key = defaultTemplateFor(chunk.length);
    const slots = Array.from({ length: SPK_TEMPLATES[key].slots }, (_, j) => chunk[j] ?? null);
    pages.push({ template: key, slots });
  }
  if (!pages.length) pages.push({ template: 'full', slots: [null] });
  return pages;
};
