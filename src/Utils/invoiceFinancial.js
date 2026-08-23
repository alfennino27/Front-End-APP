// Perhitungan finansial invoice — SATU sumber kebenaran untuk frontend.
// Mirror dari KLF-Server-main/utils/crmSync.js (computeInvoiceFinancials).
// Kalau formula di sini berubah, ubah juga di crmSync.js supaya CRM konsisten.

export const HPP_CATEGORIES = [
  'Stainless', 'Besi', 'Kayu', 'Jok', 'Rotan', 'Finishing', 'Marmer', 'Fiber', 'Veneer',
];

/**
 * HPP per unit satu product (Projects).
 * Per kategori: pakai total SPK kalau sudah ada SPK, kalau belum pakai estimasi.
 * @param {object} product - dokumen Projects
 * @param {Array} spkProducts - dokumen SPKproduct (boleh semua, difilter by idProduct di sini)
 */
export const hitungHPPProduct = (product, spkProducts) => {
  return HPP_CATEGORIES.reduce((hpp, cat) => {
    const spkTotal = spkProducts
      .filter((s) => s.idProduct === product.id && s.category === cat)
      .reduce((sum, s) => sum + (Number(s.harga) || 0), 0);
    return hpp + (spkTotal || Number(product[`estimasi${cat}`] || 0));
  }, 0);
};

/** Total HPP semua product (sudah dikali Qty). */
export const hitungTotalHPP = (products, spkProducts) =>
  products.reduce(
    (sum, p) => sum + hitungHPPProduct(p, spkProducts) * (Number(p.Qty) || 0),
    0
  );

/**
 * Hitung nilai order (deal value) & gross profit satu invoice.
 * @param {object} invoice - dokumen Invoice
 * @param {Array} products - dokumen Projects milik invoice ini
 * @param {Array} spkProducts - dokumen SPKproduct terkait
 * @param {Array} pengeluaran - dokumen InvoicePengeluaran milik invoice ini
 */
export const hitungFinansialInvoice = (invoice, products, spkProducts, pengeluaran) => {
  const totalHargaProject = products.reduce(
    (sum, p) => sum + (Number(p.Harga) || 0) * (Number(p.Qty) || 0),
    0
  );
  const totalHPP = hitungTotalHPP(products, spkProducts);
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
