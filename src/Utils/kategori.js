// Nama tampilan category proses. Key data tetap (field Projects/SPKproduct pakai key ini);
// yang berubah hanya label di layar & cetakan.
// Sejak 2026-10-19: Stainless digabung ke Besi, Kaca digabung ke Marmer.
const LABEL_KATEGORI = { Marmer: 'Marmer & Kaca' };

export const labelKategori = (cat) => LABEL_KATEGORI[cat] || cat;
