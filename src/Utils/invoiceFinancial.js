// Perhitungan finansial invoice — SATU sumber kebenaran untuk frontend.
// Mirror dari KLF-Server-main/utils/crmSync.js (computeInvoiceFinancials).
// Kalau formula di sini berubah, ubah juga di crmSync.js supaya CRM konsisten.

export const HPP_CATEGORIES = [
  'Stainless', 'Besi', 'Kayu', 'Jok', 'Rotan', 'Finishing', 'Marmer', 'Fiber', 'Veneer',
];

/**
 * HPP per unit satu product untuk SATU kategori.
 *
 * Aturannya:
 *  - belum ada SPK                     -> pakai estimasi
 *  - ada SPK dari pengrajin borong penuh -> pakai nilai SPK (sudah termasuk bahan)
 *  - ada SPK dari pengrajin borong TENAGA -> pakai estimasi, karena nilai SPK-nya
 *    cuma ongkos tukang sementara bahannya ditanggung KLF. Kalau estimasi kosong,
 *    terpaksa jatuh balik ke nilai SPK (HPP jadi terlalu kecil — isi estimasinya).
 *
 * @param {object} product - dokumen Projects
 * @param {Array} spkProducts - dokumen SPKproduct (boleh semua, difilter di sini)
 * @param {string} cat - nama kategori
 * @param {Set} [spkTenagaIds] - kumpulan idSPK milik pengrajin borong tenaga
 */
export const hitungHPPKategori = (product, spkProducts, cat, spkTenagaIds) => {
  const rows = spkProducts.filter((s) => s.idProduct === product.id && s.category === cat);
  const spkTotal = rows.reduce((sum, s) => sum + (Number(s.harga) || 0), 0);
  const estimasi = Number(product[`estimasi${cat}`] || 0);

  if (spkTotal <= 0) return estimasi;

  const dariTenaga = spkTenagaIds && rows.some((r) => spkTenagaIds.has(r.idSPK));
  return dariTenaga && estimasi > 0 ? estimasi : spkTotal;
};

/**
 * HPP per unit satu product (Projects), semua kategori dijumlah.
 * @param {Set} [spkTenagaIds] - kumpulan idSPK milik pengrajin borong tenaga
 */
export const hitungHPPProduct = (product, spkProducts, spkTenagaIds) =>
  HPP_CATEGORIES.reduce(
    (hpp, cat) => hpp + hitungHPPKategori(product, spkProducts, cat, spkTenagaIds),
    0
  );

/** Total HPP semua product (sudah dikali Qty). */
export const hitungTotalHPP = (products, spkProducts, spkTenagaIds) =>
  products.reduce(
    (sum, p) => sum + hitungHPPProduct(p, spkProducts, spkTenagaIds) * (Number(p.Qty) || 0),
    0
  );

/**
 * Ambil kumpulan idSPK milik pengrajin borong tenaga dari backend.
 * Dipakai sebagai argumen spkTenagaIds. Gagal fetch -> Set kosong, artinya
 * perhitungan jatuh ke perilaku lama (pakai nilai SPK) — aman, tidak error.
 */
export const ambilSpkTenagaIds = async (baseUrl) => {
  try {
    const res = await fetch(`${baseUrl}/spk/tenaga/get`);
    if (!res.ok) throw new Error('gagal');
    const data = await res.json();
    return new Set(data.idSPK || []);
  } catch (err) {
    console.error('Gagal mengambil daftar SPK borong tenaga:', err);
    return new Set();
  }
};

/**
 * Hitung nilai order (deal value) & gross profit satu invoice.
 * @param {object} invoice - dokumen Invoice
 * @param {Array} products - dokumen Projects milik invoice ini
 * @param {Array} spkProducts - dokumen SPKproduct terkait
 * @param {Array} pengeluaran - dokumen InvoicePengeluaran milik invoice ini
 * @param {Set} [spkTenagaIds] - kumpulan idSPK milik pengrajin borong tenaga
 */
export const hitungFinansialInvoice = (invoice, products, spkProducts, pengeluaran, spkTenagaIds) => {
  const totalHargaProject = products.reduce(
    (sum, p) => sum + (Number(p.Harga) || 0) * (Number(p.Qty) || 0),
    0
  );
  const totalHPP = hitungTotalHPP(products, spkProducts, spkTenagaIds);
  const pengeluaranLain = pengeluaran.reduce(
    (sum, x) => sum + (Number(x.nominalPengeluaran) || 0),
    0
  );

  const ongkirCust = Number(invoice.ongkirCustInvoice) || 0;
  const ongkirPacking = Number(invoice.ongkirPackingInvoice) || 0;
  const admin = Number(invoice.adminInvoice) || 0;
  const discount = Number(invoice.discountInvoice) || 0;

  const totalPenjualan = totalHargaProject + ongkirCust - discount;
  const totalGrossProfit =
    totalHargaProject - totalHPP - pengeluaranLain + ongkirCust - ongkirPacking - admin - discount;

  return { totalPenjualan, totalGrossProfit, totalHPP, pengeluaranLain };
};
