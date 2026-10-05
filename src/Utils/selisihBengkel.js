// Rincian "Selisih bengkel" (Finishing / Jok) di Laba Rugi — dipakai popup
// SelisihBengkelModal. Angka totalnya SAMA PERSIS dengan baris di tabel
// "HPP di Luar Invoice" (Utils/labaRugiReport.js → hitungHppLuarInvoice):
//   Riil        = mutasi jurnal akun bengkel di bulan-bulan periode
//   Sudah di GP = biaya bengkel per produk yang ikut di HPP invoice periode
//                 (hitungBengkelDiGP — estimasi / budget / SPK borong tenaga)
// Selain itu popup menandai jurnal riil yang JUGA dicatat sebagai Pengeluaran
// Lain invoice bertanda "sudah dijurnal" — biaya itu sudah mengurangi GP invoice
// dan dikembalikan lewat baris "Koreksi", jadi bukan kebocoran bengkel.

import { hitungHPPKategori } from './invoiceFinancial';
import { AKUN_BENGKEL } from './labaRugiReport';

const angka = (v) => Number(v || 0);
const bulanDari = (t) => String(t || '').substring(0, 7);
const selisihHari = (a, b) => Math.abs(new Date(a) - new Date(b)) / 864e5;
const TOLERANSI_HARI = 7;

/** Produk ini memang memakai kategori (walau estimasi & SPK-nya kosong)? */
const pakaiKategori = (p, cat, rows) =>
  rows.length > 0 ||
  angka(p[`estimasi${cat}`]) > 0 ||
  !!(p[`Supplier${cat}`] || p[`SPK${cat}`] || p[`CategoryStatus${cat}`]);

/**
 * @param {'Finishing'|'Jok'} kategori
 * @param {string[]} bulanList - "YYYY-MM" periode laporan
 * @param {object} data - { dataInvoice, dataProject, dataSPKProduct, dataSPK,
 *                          dataJurnal, dataAkun, dataInvoicePengeluaran, spkTenagaIds }
 */
export const rincianSelisihBengkel = (kategori, bulanList, data) => {
  const akunList = AKUN_BENGKEL[kategori] || [];
  const setBulan = new Set(bulanList);
  const spkTenagaIds = data.spkTenagaIds || new Set();
  const spkById = new Map((data.dataSPK || []).map((s) => [s.id || s._id, s]));
  const spkByCode = new Map((data.dataSPK || []).map((s) => [String(s.code || '').trim(), s]));
  const namaAkun = (kode) => data.dataAkun.find((a) => a.kodeAkun === kode)?.namaAkun || kode;

  // ---------- Sisi "Sudah di GP": produk dari invoice periode ----------
  const invoices = data.dataInvoice.filter((i) => setBulan.has(bulanDari(i.tanggalMulaiInvoice)));
  const invoiceById = new Map(invoices.map((i) => [i.id, i]));
  const products = data.dataProject.filter((p) => invoiceById.has(p.idInvoice));

  const diGP = [];         // ikut dihitung bengkel sendiri
  const supplierLuar = []; // dikerjakan supplier borong penuh → tidak masuk perbandingan
  const tanpaEstimasi = []; // pakai kategori, bengkel sendiri, tapi nilainya 0 di GP

  products.forEach((p) => {
    const rows = data.dataSPKProduct.filter((s) => s.idProduct === p.id && s.category === kategori);
    if (!pakaiKategori(p, kategori, rows)) return;
    const qty = angka(p.Qty);
    const invoice = invoiceById.get(p.idInvoice);
    const spkTotal = rows.reduce((sum, s) => sum + angka(s.harga), 0);
    const tenaga = rows.some((r) => spkTenagaIds.has(r.idSPK));
    const pengrajin = [...new Set(rows.map((r) => spkById.get(r.idSPK)?.pengrajin).filter(Boolean))].join(', ');

    if (spkTotal > 0 && !tenaga) {
      supplierLuar.push({ invoice, product: p, qty, pengrajin: pengrajin || p[`Supplier${kategori}`] || '-', perUnit: spkTotal, total: spkTotal * qty });
      return;
    }
    const perUnit = hitungHPPKategori(p, data.dataSPKProduct, kategori, spkTenagaIds);
    const sumber = spkTotal > 0
      ? (angka(p[`estimasi${kategori}`]) > 0 ? 'estimasi' : 'nilai SPK')
      : (p[`estimasiSumber${kategori}`] === 'budget' ? 'budget' : 'estimasi');
    const item = {
      invoice, product: p, qty, perUnit, total: perUnit * qty, sumber,
      pengrajin: pengrajin || p[`Supplier${kategori}`] || '',
      spkPerUnit: spkTotal,
    };
    if (perUnit > 0) diGP.push(item);
    else tanpaEstimasi.push(item);
  });

  // ---------- Sisi "Riil": jurnal akun bengkel di periode ----------
  const entries = data.dataJurnal
    .filter((j) => setBulan.has(bulanDari(j.tanggal)) &&
      (akunList.includes(j.kodeAkunDebet) || akunList.includes(j.kodeAkunKredit)))
    .map((j) => {
      const akun = akunList.includes(j.kodeAkunDebet) ? j.kodeAkunDebet : j.kodeAkunKredit;
      const debet = j.kodeAkunDebet === akun ? angka(j.nominalDebet) : 0;
      const kredit = j.kodeAkunKredit === akun ? angka(j.nominalKredit) : 0;
      const spk = j.invoiceSPK ? spkByCode.get(String(j.invoiceSPK).trim()) : null;
      return { jurnal: j, akun, namaAkun: namaAkun(akun), nominal: debet - kredit, spk, tandai: null };
    })
    .sort((a, b) => String(a.jurnal.tanggal).localeCompare(String(b.jurnal.tanggal)));

  // ---------- Tandai jurnal yang juga dicatat di Pengeluaran Lain ----------
  // Hanya Pengeluaran Lain "sudah dijurnal" milik invoice periode (sama dengan
  // baris Koreksi). Tiga cara cocok, dari yang paling pasti:
  //  1. jurnal bayar SPK yang SEMUA produknya milik invoice ber-Pengeluaran Lain
  //     dan estimasi kategori itu kosong (biayanya dilacak lewat Pengeluaran Lain)
  //  2. nominal sama persis, tanggal selisih ≤ 7 hari
  //  3. dua jurnal yang jumlahnya = satu pengeluaran (mis. DP + pelunasan)
  const pengeluaranLain = (data.dataInvoicePengeluaran || [])
    .filter((x) => x.sudahDijurnal && invoiceById.has(x.idInvoice))
    .map((x) => ({ ...x, terpakai: false }));
  const invoiceBerPL = new Set(pengeluaranLain.map((x) => x.idInvoice));
  // Produk yang estimasi kategorinya kosong → biayanya tidak dianggarkan lewat
  // estimasi (paling banter nilai SPK placeholder), jadi dilacak di Pengeluaran Lain.
  const tanpaEstimasiKat = (p) => angka(p[`estimasi${kategori}`]) === 0;

  const tandai = (e, x, cara) => {
    e.tandai = { kodeInvoice: invoiceById.get(x?.idInvoice)?.kodeInvoice || x?.kodeInvoice || '', keterangan: x?.kategoriPengeluaran || '', cara };
  };

  entries.forEach((e) => {
    if (!e.spk) return;
    // Baris SPK tanpa idProduct (mis. "Total borong") diabaikan — yang dinilai
    // hanya baris yang tertaut ke produk.
    const items = data.dataSPKProduct.filter((s) =>
      s.idSPK === (e.spk.id || e.spk._id) && s.category === kategori && s.idProduct);
    if (!items.length) return;
    const produk = items.map((it) => data.dataProject.find((p) => p.id === it.idProduct)).filter(Boolean);
    if (!produk.length) return;
    if (produk.every((p) => invoiceBerPL.has(p.idInvoice) && tanpaEstimasiKat(p))) {
      e.tandai = { kodeInvoice: invoiceById.get(produk[0].idInvoice)?.kodeInvoice || '', keterangan: `SPK ${e.spk.code}`, cara: 'spk' };
    }
  });

  pengeluaranLain.forEach((x) => {
    const n = angka(x.nominalPengeluaran);
    const kandidat = entries
      .filter((e) => !e.tandai && e.nominal === n && selisihHari(e.jurnal.tanggal, x.tanggalPengeluaran) <= TOLERANSI_HARI)
      .sort((a, b) => selisihHari(a.jurnal.tanggal, x.tanggalPengeluaran) - selisihHari(b.jurnal.tanggal, x.tanggalPengeluaran));
    if (kandidat.length) { tandai(kandidat[0], x, 'nominal'); x.terpakai = true; }
  });

  pengeluaranLain.filter((x) => !x.terpakai).forEach((x) => {
    const n = angka(x.nominalPengeluaran);
    const bebas = entries.filter((e) => !e.tandai && e.nominal > 0 && e.nominal < n &&
      selisihHari(e.jurnal.tanggal, x.tanggalPengeluaran) <= TOLERANSI_HARI);
    for (let i = 0; i < bebas.length; i += 1) {
      const pasangan = bebas.find((b, k) => k > i && b.akun === bebas[i].akun && bebas[i].nominal + b.nominal === n);
      if (pasangan) { tandai(bebas[i], x, 'gabungan'); tandai(pasangan, x, 'gabungan'); x.terpakai = true; break; }
    }
  });

  // ---------- Ringkasan ----------
  const totalRiil = entries.reduce((s, e) => s + e.nominal, 0);
  const totalGP = diGP.reduce((s, d) => s + d.total, 0);
  const totalDitandai = entries.filter((e) => e.tandai).reduce((s, e) => s + e.nominal, 0);
  const perAkun = akunList.map((kode) => ({
    kodeAkun: kode,
    namaAkun: namaAkun(kode),
    total: entries.filter((e) => e.akun === kode).reduce((s, e) => s + e.nominal, 0),
    ditandai: entries.filter((e) => e.akun === kode && e.tandai).reduce((s, e) => s + e.nominal, 0),
  }));
  const perSumber = ['estimasi', 'budget', 'nilai SPK'].map((sumber) => ({
    sumber,
    total: diGP.filter((d) => d.sumber === sumber).reduce((s, d) => s + d.total, 0),
    jumlah: diGP.filter((d) => d.sumber === sumber).length,
  })).filter((x) => x.jumlah > 0);
  // Per bulan: dipakai melihat apakah selisihnya menumpuk di bulan tertentu.
  const perBulan = bulanList.map((bulan) => {
    const riil = entries.filter((e) => bulanDari(e.jurnal.tanggal) === bulan).reduce((s, e) => s + e.nominal, 0);
    const ditandai = entries.filter((e) => e.tandai && bulanDari(e.jurnal.tanggal) === bulan).reduce((s, e) => s + e.nominal, 0);
    const gp = diGP.filter((d) => bulanDari(d.invoice.tanggalMulaiInvoice) === bulan).reduce((s, d) => s + d.total, 0);
    return { bulan, riil, ditandai, gp, selisih: riil - gp, selisihBersih: riil - ditandai - gp };
  });

  return {
    kategori,
    akunList,
    entries,
    perAkun,
    diGP,
    perSumber,
    supplierLuar,
    tanpaEstimasi,
    perBulan,
    totalRiil,
    totalGP,
    totalDitandai,
    totalSupplierLuar: supplierLuar.reduce((s, x) => s + x.total, 0),
    selisih: totalRiil - totalGP,
    selisihBersih: totalRiil - totalDitandai - totalGP,
  };
};
