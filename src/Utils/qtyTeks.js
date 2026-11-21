// src/Utils/qtyTeks.js
// MIRROR dari KLF-Server-main/utils/qtyTeks.js (ubah keduanya). Cek "Qty: N" di teks keterangan
// category vs qty order — pengrajin membaca TEKS, bukan kolom (kasus Rangka Console 2026-11-21).
const RE_QTY = /\b(?:qty|quantity)\b\s*[:=]?\s*(\d+)\s*([a-zA-Z]+)?|\bjumlah\s*[:=]\s*(\d+)\s*([a-zA-Z]+)?/gi;

// Category yang qty-nya = jumlah komponen per item (6 handle untuk 1 credenza) → tidak dibandingkan.
export const KATEGORI_KOMPONEN = ['Hardware'];

export function bacaQtyTeks(text) {
  const out = [];
  const s = String(text || '');
  let m;
  RE_QTY.lastIndex = 0;
  while ((m = RE_QTY.exec(s))) {
    const n = Number(m[1] || m[3]);
    if (Number.isFinite(n)) out.push({ n, unit: (m[2] || m[4] || 'pcs').toLowerCase(), raw: m[0].trim() });
  }
  return out;
}

/**
 * Cek satu teks keterangan (+ qty kolom SPK opsional) terhadap qty order.
 * @param {object} p { orderQty, category, text, spkQty, label } — label = nama sumber untuk pesan.
 * @returns [{ level:'kritis'|'cek', topic, problem, teks_qty, order_qty }]
 */
export function cekQty({ orderQty, category = '', text = '', spkQty, label } = {}) {
  const issues = [];
  const order = Number(orderQty) || 0;
  if (!order) return issues;
  const sumber = label || `keterangan ${category}`;
  const add = (level, problem, extra = {}) => issues.push({ level, topic: 'jumlah (qty)', problem, order_qty: order, ...extra });

  if (!KATEGORI_KOMPONEN.includes(category)) {
    const found = bacaQtyTeks(text);
    const beda = [...new Set(found.map((f) => f.n))];
    if (beda.length > 1) {
      add('kritis', `Teks ${sumber} menulis jumlah yang berbeda-beda (${found.map((f) => `"${f.raw}"`).join(', ')}). Order customer ${order} pcs — samakan dulu.`);
    } else if (beda.length === 1 && beda[0] !== order) {
      const f = found[0];
      if (f.n < order) {
        add('kritis', `Teks ${sumber} menulis "${f.raw}", padahal order customer ${order} pcs. Pengrajin akan membuat KURANG ${order - f.n} pcs.`, { teks_qty: f.n });
      } else {
        add('cek', `Teks ${sumber} menulis "${f.raw}", padahal order customer ${order} pcs. Pastikan ini memang hitungan komponen (mis. 2 lembar marmer untuk 1 meja), bukan salah ketik.`, { teks_qty: f.n });
      }
    }
  }

  const sq = Number(spkQty);
  if (spkQty !== undefined && spkQty !== null && String(spkQty).trim() !== '' && sq > 0 && sq !== order) {
    add(sq < order ? 'kritis' : 'cek', `Kolom jumlah di SPK ${category} = ${sq}, padahal order customer ${order} pcs.`, { spk_qty: sq });
  }
  return issues;
}

// Semua cek qty untuk satu project + category: teks Description<cat> + tiap SPKproduct category itu
// (keterangan per bagian untuk multi pengrajin). Dedup pesan yang sama.
export function cekQtyProjectCategory(project, category, spkRows = []) {
  const orderQty = project && project.Qty;
  const all = [];
  const desc = project ? project[`Description${category}`] : '';
  if (desc && String(desc).trim()) all.push(...cekQty({ orderQty, category, text: desc }));
  spkRows.filter((r) => r.category === category).forEach((r) => {
    const label = r.bagian ? `keterangan ${category} bagian "${r.bagian}"` : `keterangan ${category}`;
    // Keterangan SPKproduct biasanya salinan Description<cat>; kalau sama persis, jangan lapor dobel.
    const sameText = String(r.keterangan || '').trim() === String(desc || '').trim();
    all.push(...cekQty({ orderQty, category, text: sameText ? '' : r.keterangan, spkQty: r.qty, label }));
  });
  const seen = new Set();
  return all.filter((i) => (seen.has(i.problem) ? false : seen.add(i.problem)));
}

