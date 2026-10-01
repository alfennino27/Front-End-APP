// Penyusun data laporan Laba Rugi (Penjualan / Cash / Profit) untuk SATU bulan.
// Dipakai bareng oleh tampilan tabel (via komponen) dan export PDF, supaya
// angka di layar dan di PDF selalu sama. Semua fungsi murni: kasih data mentah
// yang sudah di-fetch + bulan "YYYY-MM", balikannya siap dirender.

import { hitungFinansialInvoice, hitungBengkelDiGP } from './invoiceFinancial';

const rupiah = (n) => `Rp. ${Number(n || 0).toLocaleString('id-ID')}`;

/** Persentase gross profit terhadap nilai penjualan. Nol penjualan -> "-". */
export const persenGrossProfit = (grossProfit, penjualan) => {
  const dasar = Number(penjualan || 0);
  if (!dasar) return '-';
  return `${((Number(grossProfit || 0) / dasar) * 100).toFixed(1).replace('.', ',')} %`;
};

const tanggalPanjang = (val) => {
  if (!val) return '-';
  const d = new Date(val);
  if (isNaN(d)) return '-';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

/** Nama bulan enak dibaca dari "YYYY-MM". */
export const labelBulan = (bulan) => {
  if (!bulan) return '-';
  const [y, m] = bulan.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  if (isNaN(d)) return bulan;
  return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
};

/**
 * Saldo akhir satu akun di bulan tertentu (saldo awal bulan itu + mutasi jurnal).
 * Logikanya mirror persis tabel di halaman Laba Rugi.
 */
const saldoAkhirAkun = (akun, dataJurnal, bulan) => {
  const saldoAwal =
    Number(akun.saldoAwalDebit?.[bulan] || 0) || Number(akun.saldoAwalKredit?.[bulan] || 0);

  return dataJurnal
    .filter((jurnal) => {
      const cocok =
        jurnal.kodeAkunDebet === akun.kodeAkun || jurnal.kodeAkunKredit === akun.kodeAkun;
      if (!cocok) return false;
      if (!bulan) return true;
      return (jurnal.tanggal || '').substring(0, 7) === bulan;
    })
    .reduce((saldo, jurnal) => {
      const debet = jurnal.kodeAkunKredit === akun.kodeAkun ? 0 : Number(jurnal.nominalDebet || 0);
      const kredit = jurnal.kodeAkunDebet === akun.kodeAkun ? 0 : Number(jurnal.nominalKredit || 0);
      return saldo + debet - kredit;
    }, saldoAwal);
};

/** Baris-baris tabel pengeluaran per jenis akun ("Operasional" / "HPP"). */
export const barisPengeluaran = (dataAkun, dataJurnal, jenisAkun, bulan) => {
  const akunTerpakai = dataAkun.filter((a) => a.jenisAkun === jenisAkun);
  const baris = akunTerpakai.map((a, i) => {
    const nominal = saldoAkhirAkun(a, dataJurnal, bulan);
    return { cells: [String(i + 1), a.kodeAkun, a.namaAkun, rupiah(nominal)], nominal };
  });
  const total = baris.reduce((sum, b) => sum + b.nominal, 0);
  return { baris, total };
};

const sectionPengeluaran = (judul, dataAkun, dataJurnal, jenisAkun, bulan) => {
  const { baris, total } = barisPengeluaran(dataAkun, dataJurnal, jenisAkun, bulan);
  return {
    section: {
      judul,
      kolom: ['No', 'Kode Akun', 'Nama Akun', 'Nominal'],
      align: ['center', 'left', 'left', 'right'],
      baris: baris.map((b) => b.cells),
      total: { label: 'Total :', labelSpan: 3, nilai: [rupiah(total)] },
    },
    total,
  };
};

// --- HPP di luar invoice (metode biaya standar, sejak 2026-10-01) ---
// GP invoice memakai estimasi bengkel (Finishing/Jok; kosong → budget Cek Finishing & Jok). Biaya riilnya ada di
// jurnal akun HPP berikut, jadi Laba Rugi mengurangkan SELISIH-nya saja (real − estimasi)
// plus HPP jurnal lain yang tidak pernah masuk invoice. Mirror config/varianceEstimasi.js.
export const AKUN_BENGKEL = { Finishing: ['6165', '6190'], Jok: ['6181', '6182'] };
export const AKUN_HPP_LAIN = ['6119', '6185', '6150', '6173']; // ongkir, packing, hardware, servis barang

/** Mutasi debet − kredit satu akun di bulan itu (tanpa saldo awal — akun laba rugi). */
const mutasiAkun = (kodeAkun, dataJurnal, bulan) =>
  dataJurnal.reduce((total, j) => {
    if ((j.tanggal || '').substring(0, 7) !== bulan) return total;
    const debet = j.kodeAkunDebet === kodeAkun ? Number(j.nominalDebet || 0) : 0;
    const kredit = j.kodeAkunKredit === kodeAkun ? Number(j.nominalKredit || 0) : 0;
    return total + debet - kredit;
  }, 0);

/**
 * Hitung HPP di luar invoice untuk satu bulan.
 * @param {Array} invoices - invoice yang GP-nya dipakai laporan ini
 * @returns {{ bengkel: Array, lain: Array, total: number }}
 */
export const hitungHppLuarInvoice = (invoices, data, bulan) => {
  const idInvoice = new Set(invoices.map((i) => i.id));
  const products = data.dataProject.filter((p) => idInvoice.has(p.idInvoice));
  const idProducts = new Set(products.map((p) => p.id));
  const spkProducts = data.dataSPKProduct.filter((s) => idProducts.has(s.idProduct));
  const diGP = hitungBengkelDiGP(products, spkProducts, data.spkTenagaIds);

  const bengkel = Object.entries(AKUN_BENGKEL).map(([kategori, akun]) => {
    const real = akun.reduce((sum, k) => sum + mutasiAkun(k, data.dataJurnal, bulan), 0);
    return { kategori, akun, real, budget: diGP[kategori], selisih: real - diGP[kategori] };
  });
  const lain = AKUN_HPP_LAIN.map((kodeAkun) => {
    const akun = data.dataAkun.find((a) => a.kodeAkun === kodeAkun);
    return { kodeAkun, namaAkun: akun?.namaAkun || kodeAkun, nominal: mutasiAkun(kodeAkun, data.dataJurnal, bulan) };
  });
  // Pengeluaran Lain bertanda "sudah dijurnal": tetap mengurangi GP invoice (supaya
  // profit riil invoice terlihat), tapi uangnya sudah ada di jurnal → dikoreksi di sini.
  const sudahDijurnal = (data.dataInvoicePengeluaran || [])
    .filter((x) => x.sudahDijurnal && idInvoice.has(x.idInvoice))
    .reduce((s, x) => s + Number(x.nominalPengeluaran || 0), 0);
  const total = bengkel.reduce((s, b) => s + b.selisih, 0) + lain.reduce((s, l) => s + l.nominal, 0) - sudahDijurnal;
  return { bengkel, lain, sudahDijurnal, total };
};

const sectionHppLuarInvoice = (hpp) => ({
  judul: 'HPP di Luar Invoice',
  kolom: ['Pos', 'Akun', 'Riil', 'Sudah di GP', 'Dikurangkan'],
  align: ['left', 'left', 'right', 'right', 'right'],
  baris: [
    ...hpp.bengkel.map((b) => [
      `Selisih bengkel ${b.kategori}`, b.akun.join(', '), rupiah(b.real), rupiah(b.budget), rupiah(b.selisih),
    ]),
    ...hpp.lain.map((l) => [l.namaAkun, l.kodeAkun, rupiah(l.nominal), '-', rupiah(l.nominal)]),
    ...(hpp.sudahDijurnal
      ? [['Koreksi: Pengeluaran Lain sudah dijurnal', '-', '-', rupiah(hpp.sudahDijurnal), rupiah(-hpp.sudahDijurnal)]]
      : []),
  ],
  total: { label: 'Total :', labelSpan: 4, nilai: [rupiah(hpp.total)] },
});

/** Gross profit & nilai penjualan satu invoice, ambil data terkaitnya dulu. */
const finansialInvoice = (invoice, data) => {
  const projects = data.dataProject.filter((p) => p.idInvoice === invoice.id);
  const idProjects = projects.map((p) => p.id);
  const spkProducts = data.dataSPKProduct.filter((s) => idProjects.includes(s.idProduct));
  const pengeluaran = data.dataInvoicePengeluaran.filter((x) => x.idInvoice === invoice.id);
  return hitungFinansialInvoice(invoice, projects, spkProducts, pengeluaran, data.spkTenagaIds);
};

/** Tanggal pelunasan terakhir (abaikan pembayaran berstatus Hold). */
const tanggalPelunasanTerakhir = (payments) =>
  payments.reduce((latest, p) => {
    if (p.status === 'Hold') return latest;
    const tgl = p.status === 'Withdraw' ? p.tanggalWD : p.tanggal;
    if (!tgl) return latest;
    return !latest || new Date(tgl) > new Date(latest) ? tgl : latest;
  }, '');

/** Laporan Laba Rugi Penjualan — dasar bulan = tanggal mulai invoice. */
export const buatLaporanPenjualan = (bulan, data) => {
  const invoices = data.dataInvoice.filter(
    (i) => (i.tanggalMulaiInvoice || '').substring(0, 7) === bulan
  );

  let totalPenjualan = 0;
  let totalGrossProfit = 0;
  const barisPenjualan = invoices.map((item, i) => {
    const f = finansialInvoice(item, data);
    totalPenjualan += f.totalPenjualan;
    totalGrossProfit += f.totalGrossProfit;
    return [
      String(i + 1),
      tanggalPanjang(item.tanggalMulaiInvoice),
      item.kodeInvoice,
      rupiah(f.totalPenjualan),
      rupiah(f.totalGrossProfit),
      persenGrossProfit(f.totalGrossProfit, f.totalPenjualan),
    ];
  });

  const hppLuar = hitungHppLuarInvoice(invoices, data, bulan);
  const operasional = sectionPengeluaran(
    'Pengeluaran (Operasional)', data.dataAkun, data.dataJurnal, 'Operasional', bulan
  );

  return {
    judul: 'Laba Rugi Penjualan',
    bulan,
    sections: [
      {
        judul: 'Penjualan',
        kolom: ['No', 'Tanggal', 'Kode Invoice', 'Nominal', 'Gross Profit', '% Gross Profit'],
        align: ['center', 'left', 'left', 'right', 'right', 'right'],
        baris: barisPenjualan,
        total: {
          label: 'Total :',
          labelSpan: 3,
          nilai: [
            rupiah(totalPenjualan),
            rupiah(totalGrossProfit),
            persenGrossProfit(totalGrossProfit, totalPenjualan),
          ],
        },
      },
      sectionHppLuarInvoice(hppLuar),
      operasional.section,
    ],
    ringkasan: [
      { label: 'Keuntungan Penjualan', nilai: rupiah(totalGrossProfit - hppLuar.total - operasional.total) },
    ],
  };
};

/** Laporan Laba Rugi Cash — dasar bulan = tanggal pembayaran masuk. */
export const buatLaporanCash = (bulan, data) => {
  const invoiceMap = Object.fromEntries(data.dataInvoice.map((i) => [i.id, i]));

  const payments = data.dataInvoicePayment.filter((p) => {
    if (p.status === 'Hold') return false;
    const tgl = p.status === 'Withdraw' ? p.tanggalWD : p.tanggal;
    return (tgl || '').substring(0, 7) === bulan;
  });

  let totalPayment = 0;
  const barisPayment = payments.map((p, i) => {
    const tgl = p.status === 'Withdraw' ? p.tanggalWD : p.tanggal;
    const invoice = invoiceMap[p.idInvoice];
    totalPayment += Number(p.jumlah || 0);
    return [
      String(i + 1),
      tanggalPanjang(tgl),
      invoice ? invoice.kodeInvoice : 'Invoice tidak ditemukan',
      rupiah(p.jumlah),
    ];
  });

  const hpp = sectionPengeluaran(
    'Pengeluaran (HPP)', data.dataAkun, data.dataJurnal, 'HPP', bulan
  );
  const operasional = sectionPengeluaran(
    'Pengeluaran (Operasional)', data.dataAkun, data.dataJurnal, 'Operasional', bulan
  );

  return {
    judul: 'Laba Rugi Cash',
    bulan,
    sections: [
      {
        judul: 'Payment Penjualan',
        kolom: ['No', 'Tanggal', 'Kode Invoice', 'Nominal'],
        align: ['center', 'left', 'left', 'right'],
        baris: barisPayment,
        total: { label: 'Total :', labelSpan: 3, nilai: [rupiah(totalPayment)] },
      },
      hpp.section,
      operasional.section,
    ],
    ringkasan: [
      { label: 'Laba Rugi Cash', nilai: rupiah(totalPayment - hpp.total - operasional.total) },
    ],
  };
};

/** Laporan Laba Rugi Profit — invoice yang LUNAS, dasar bulan = tanggal pelunasan. */
export const buatLaporanProfit = (bulan, data) => {
  const invoices = data.dataInvoice
    .map((item) => {
      const payments = data.dataInvoicePayment.filter((p) => p.idInvoice === item.id);
      const totalPayment = payments.reduce((sum, p) => sum + Number(p.jumlah || 0), 0);
      const latestPaymentDate = tanggalPelunasanTerakhir(payments);

      const totalHargaProject = data.dataProject
        .filter((p) => p.idInvoice === item.id)
        .reduce((sum, p) => sum + Number(p.Harga || 0) * Number(p.Qty || 0), 0);
      const nilaiInvoice =
        totalHargaProject + Number(item.ongkirCustInvoice || 0) - Number(item.discountInvoice || 0);

      return { ...item, latestPaymentDate, lunas: totalPayment >= nilaiInvoice };
    })
    .filter((item) => item.lunas && (item.latestPaymentDate || '').substring(0, 7) === bulan);

  let totalPenjualan = 0;
  let totalGrossProfit = 0;
  const barisPenjualan = invoices.map((item, i) => {
    const f = finansialInvoice(item, data);
    totalPenjualan += f.totalPenjualan;
    totalGrossProfit += f.totalGrossProfit;
    return [
      String(i + 1),
      tanggalPanjang(item.tanggalMulaiInvoice),
      tanggalPanjang(item.latestPaymentDate),
      item.kodeInvoice,
      rupiah(f.totalPenjualan),
      rupiah(f.totalGrossProfit),
    ];
  });

  const hppLuar = hitungHppLuarInvoice(invoices, data, bulan);
  const operasional = sectionPengeluaran(
    'Pengeluaran (Operasional)', data.dataAkun, data.dataJurnal, 'Operasional', bulan
  );

  return {
    judul: 'Laba Rugi Profit',
    bulan,
    sections: [
      {
        judul: 'Penjualan (Lunas)',
        kolom: ['No', 'Tanggal Invoice', 'Tanggal Pelunasan', 'Kode Invoice', 'Nominal', 'Gross Profit'],
        align: ['center', 'left', 'left', 'left', 'right', 'right'],
        baris: barisPenjualan,
        total: {
          label: 'Total :',
          labelSpan: 4,
          nilai: [rupiah(totalPenjualan), rupiah(totalGrossProfit)],
        },
      },
      sectionHppLuarInvoice(hppLuar),
      operasional.section,
    ],
    ringkasan: [
      { label: 'Keuntungan Penjualan', nilai: rupiah(totalGrossProfit - hppLuar.total - operasional.total) },
    ],
  };
};
