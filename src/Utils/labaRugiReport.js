// Penyusun data laporan Laba Rugi (Penjualan / Cash / Profit) untuk SATU bulan.
// Dipakai bareng oleh tampilan tabel (via komponen) dan export PDF, supaya
// angka di layar dan di PDF selalu sama. Semua fungsi murni: kasih data mentah
// yang sudah di-fetch + bulan "YYYY-MM", balikannya siap dirender.

import { hitungFinansialInvoice } from './invoiceFinancial';

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
      operasional.section,
    ],
    ringkasan: [
      { label: 'Keuntungan Penjualan', nilai: rupiah(totalGrossProfit - operasional.total) },
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
      operasional.section,
    ],
    ringkasan: [
      { label: 'Keuntungan Penjualan', nilai: rupiah(totalGrossProfit - operasional.total) },
    ],
  };
};
