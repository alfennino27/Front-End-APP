// Utils/neraca.js
// Mesin hitung Neraca (Balance Sheet) — murni dari Akun + Jurnal, tanpa isian manual.
//
// PRINSIP (sesuai kaidah akuntansi):
//   - Neraca = POSISI per akhir bulan, bukan mutasi satu bulan.
//     Saldo akun = saldo awal pembukaan (SALDO_AWAL_BULAN) + SELURUH jurnal s/d akhir bulan.
//     Tidak lagi bergantung pada `saldoAwalDebit/Kredit[bulan]` hasil tombol "tutup buku"
//     (isian itu berhenti di 2026-06, sebagian diedit manual, dan salah tanda untuk akun kredit).
//   - Akun Laba Rugi (4xxx–6xxx, HPP, Operasional) tidak tampil per akun di neraca,
//     tapi diringkas jadi Laba Ditahan (tahun-tahun sebelumnya) + Laba Tahun Berjalan.
//   - Wajib seimbang: Aset = Kewajiban + Ekuitas. Selisih ditampilkan beserta penyebab
//     yang diketahui (jurnal satu sisi akunnya kosong / kode akun tidak terdaftar).
//
// Konvensi tanda internal: saldo = debit − kredit. Untuk tampilan, Kewajiban & Ekuitas
// dibalik (kredit positif) supaya terbaca normal.

/** Bulan saldo pembukaan yang dipakai sebagai titik awal (neraca pembukaan seimbang D = K). */
export const SALDO_AWAL_BULAN = '2025-01';

export const POS = {
  ASET_LANCAR: 'asetLancar',
  ASET_TETAP: 'asetTetap',
  KEWAJIBAN_LANCAR: 'kewajibanLancar',
  KEWAJIBAN_PANJANG: 'kewajibanPanjang',
  EKUITAS: 'ekuitas',
  LABA_RUGI: 'labaRugi',
};

const num = (v) => Number(v) || 0;

/** 'YYYY-MM-DD' dari string tanggal apa pun ('' kalau tidak valid). Tidak pernah throw. */
export const tglValid = (v) => {
  const m = String(v || '').match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
};

/** Kode akun jurnal yang sudah dibersihkan; '' untuk kosong / "undefined" / "null". */
const kodeBersih = (v) => {
  const k = v == null ? '' : String(v).trim();
  return k === 'undefined' || k === 'null' ? '' : k;
};

/**
 * Pos neraca satu akun.
 * `jenisAkun` dipakai hanya untuk pengecualian yang jelas (kode akunnya tidak sesuai
 * kelompok); selebihnya ditentukan kode akun, sebab isian jenisAkun banyak yang
 * kosong / "-" (mis. Modal usaha, Akumulasi Penyusutan) dan dipakai laporan lain
 * (Cash Flow, Laba Rugi) dengan arti berbeda — jadi tidak kita ubah.
 */
export function posNeraca(akun) {
  const kode = String(akun.kodeAkun || '');
  const jenis = akun.jenisAkun;
  if (jenis === 'HPP' || jenis === 'Operasional') return POS.LABA_RUGI; // mis. 1135 Depresiasi, 1138 Komisi Pakde
  if (jenis === 'Hutang Lancar') return POS.KEWAJIBAN_LANCAR; // mis. 1152 Hutang Kartu Kredit
  if (jenis === 'Hutang Jangka Panjang') return POS.KEWAJIBAN_PANJANG; // mis. 2112 Hutang Mobil
  if (kode.startsWith('12')) return POS.ASET_TETAP; // termasuk Akumulasi Penyusutan (kontra aset)
  if (kode.startsWith('1')) return POS.ASET_LANCAR;
  if (kode.startsWith('22')) return POS.KEWAJIBAN_PANJANG;
  if (kode.startsWith('2')) return POS.KEWAJIBAN_LANCAR;
  if (kode.startsWith('3')) return POS.EKUITAS;
  return POS.LABA_RUGI;
}

const saldoPembukaan = (akun) =>
  num(akun.saldoAwalDebit?.[SALDO_AWAL_BULAN]) - num(akun.saldoAwalKredit?.[SALDO_AWAL_BULAN]);

/**
 * Hitung neraca per akhir `bulan` (YYYY-MM).
 * @returns {{
 *   bulan, akun: Array<{kodeAkun,namaAkun,pos,saldo}>, total: Object,
 *   labaDitahan, labaBerjalan, selisih,
 *   masalah: { tanpaTanggal: [], akunKosong: {jumlah, nominal}, akunTakDikenal: {kode: nominal} }
 * }}
 */
export function hitungNeraca(dataAkun, dataJurnal, bulan) {
  const akhir = `${bulan}-31`; // perbandingan string 'YYYY-MM-DD'
  const awalTahun = `${bulan.slice(0, 4)}-01-01`;

  const akunMap = new Map();
  dataAkun.forEach((a) => {
    if (!a.kodeAkun) return;
    akunMap.set(String(a.kodeAkun), { ...a, pos: posNeraca(a), saldo: saldoPembukaan(a) });
  });

  let labaRugiSebelumTahun = 0; // saldo (D−K) akun L/R sebelum tahun berjalan
  let labaRugiTahunIni = 0; // mutasi (D−K) akun L/R dalam tahun berjalan
  akunMap.forEach((a) => {
    if (a.pos === POS.LABA_RUGI) labaRugiSebelumTahun += a.saldo; // saldo pembukaan L/R (kalau ada) = laba ditahan
  });

  const tanpaTanggal = [];
  const akunKosong = { jumlah: 0, nominal: 0 }; // efek (D−K) sisi yang akunnya kosong
  const akunTakDikenal = {}; // kode → efek (D−K)

  const catat = (kode, nilai, tgl) => {
    const k = kodeBersih(kode);
    if (!k) { akunKosong.nominal += nilai; return; }
    const a = akunMap.get(k);
    if (!a) { akunTakDikenal[k] = (akunTakDikenal[k] || 0) + nilai; return; }
    if (a.pos === POS.LABA_RUGI) {
      if (tgl < awalTahun) labaRugiSebelumTahun += nilai;
      else labaRugiTahunIni += nilai;
      return;
    }
    a.saldo += nilai;
  };

  dataJurnal.forEach((j) => {
    const tgl = tglValid(j.tanggal);
    if (!tgl) { tanpaTanggal.push(j); return; }
    if (tgl < `${SALDO_AWAL_BULAN}-01` || tgl > akhir) return;
    const debet = num(j.nominalDebet);
    const kredit = num(j.nominalKredit);
    if (!kodeBersih(j.kodeAkunDebet) || !kodeBersih(j.kodeAkunKredit)) akunKosong.jumlah += 1;
    catat(j.kodeAkunDebet, debet, tgl);
    catat(j.kodeAkunKredit, -kredit, tgl);
  });

  const akun = [...akunMap.values()]
    .filter((a) => a.pos !== POS.LABA_RUGI)
    .sort((a, b) => String(a.kodeAkun).localeCompare(String(b.kodeAkun)));

  const jumlah = (pos) => akun.filter((a) => a.pos === pos).reduce((s, a) => s + a.saldo, 0);
  // Aset: debit positif. Kewajiban/Ekuitas: kredit positif (dibalik).
  const total = {
    asetLancar: jumlah(POS.ASET_LANCAR),
    asetTetap: jumlah(POS.ASET_TETAP),
    kewajibanLancar: -jumlah(POS.KEWAJIBAN_LANCAR),
    kewajibanPanjang: -jumlah(POS.KEWAJIBAN_PANJANG),
    modal: -jumlah(POS.EKUITAS),
  };
  const labaDitahan = -labaRugiSebelumTahun;
  const labaBerjalan = -labaRugiTahunIni;
  total.aset = total.asetLancar + total.asetTetap;
  total.kewajiban = total.kewajibanLancar + total.kewajibanPanjang;
  total.ekuitas = total.modal + labaDitahan + labaBerjalan;
  total.pasiva = total.kewajiban + total.ekuitas;

  const selisih = total.aset - total.pasiva;

  return {
    bulan,
    akun,
    total,
    labaDitahan,
    labaBerjalan,
    selisih,
    masalah: { tanpaTanggal, akunKosong, akunTakDikenal },
  };
}

/** Saldo normal akun menurut posnya: aset = debit, kewajiban/ekuitas = kredit. */
export const saldoTampil = (a) => (a.pos === POS.ASET_LANCAR || a.pos === POS.ASET_TETAP ? a.saldo : -a.saldo);

/**
 * Saldo tidak normal (mis. Bank minus, Hutang bersaldo debit). Akumulasi penyusutan
 * memang kontra-aset (normalnya kredit), jadi tidak ditandai.
 */
export const saldoTidakNormal = (a) => {
  if (Math.abs(a.saldo) < 1) return false;
  if (/akum/i.test(a.namaAkun || '')) return a.saldo > 0;
  if (a.pos === POS.EKUITAS && /prive/i.test(a.namaAkun || '')) return false; // prive normalnya debit
  return saldoTampil(a) < 0;
};

/**
 * Rincian Piutang Lain / Hutang Lain yang MASIH TERBUKA per akhir `bulan`.
 * Hanya informasi pendukung — nilainya sudah termasuk di saldo akun (1131/1132/2110),
 * jadi TIDAK dijumlahkan lagi ke neraca.
 */
export function rincianTerbuka(headers, items, payments, idField, bulan) {
  const akhir = `${bulan}-31`;
  return headers
    .map((h) => {
      const tgl = tglValid(h.tanggal);
      const total = items.filter((i) => i[idField] === h.id).reduce((s, i) => s + num(i.nominal), 0);
      const bayarList = payments.filter((p) => p[idField] === h.id);
      const dibayar = bayarList.filter((p) => { const t = tglValid(p.tanggal); return t && t <= akhir; })
        .reduce((s, p) => s + num(p.jumlah), 0);
      const bayarTanpaTanggal = bayarList.filter((p) => !tglValid(p.tanggal)).length;
      return { id: h.id, nama: h.nama, tanggal: tgl, total, dibayar, sisa: total - dibayar, bayarTanpaTanggal };
    })
    .filter((r) => r.tanggal && r.tanggal <= akhir && Math.abs(r.sisa) >= 1)
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
}

/**
 * Neraca Saldo (trial balance) per bulan — pengganti "tutup buku".
 * Tiap akun: saldo awal (posisi sebelum tanggal 1 bulan itu), mutasi debit/kredit bulan itu,
 * saldo akhir. Akun neraca = kumulatif sejak saldo pembukaan; akun Laba Rugi = sejak 1 Januari
 * tahun berjalan (laba tahun-tahun sebelumnya dipindah ke baris "Laba ditahan").
 * Total debit = total kredit SELALU (tiap sisi jurnal tercatat di satu baris); jurnal yang
 * akunnya kosong / tidak terdaftar dikumpulkan di baris khusus supaya kelihatan.
 * Konvensi angka: saldo = debit − kredit.
 */
export function hitungNeracaSaldo(dataAkun, dataJurnal, bulan) {
  const awalBulan = `${bulan}-01`;
  const akhir = `${bulan}-31`;
  const awalTahun = `${bulan.slice(0, 4)}-01-01`;

  const baris = new Map();
  dataAkun.forEach((a) => {
    if (!a.kodeAkun) return;
    const pos = posNeraca(a);
    baris.set(String(a.kodeAkun), {
      kodeAkun: String(a.kodeAkun), namaAkun: a.namaAkun, jenisAkun: a.jenisAkun, pos,
      awal: pos === POS.LABA_RUGI ? 0 : saldoPembukaan(a), debit: 0, kredit: 0,
    });
  });
  let labaDitahan = 0; // D−K akun L/R sebelum tahun berjalan (termasuk saldo pembukaan L/R)
  dataAkun.forEach((a) => { if (a.kodeAkun && posNeraca(a) === POS.LABA_RUGI) labaDitahan += saldoPembukaan(a); });
  const suspense = { kodeAkun: '—', namaAkun: 'Jurnal akun kosong / tidak terdaftar (lihat Temuan Koreksi)', jenisAkun: '', pos: 'suspense', awal: 0, debit: 0, kredit: 0 };

  const catat = (kode, d, k, tgl) => {
    const k0 = kodeBersih(kode);
    const b = (k0 && baris.get(k0)) || suspense;
    if (b.pos === POS.LABA_RUGI && tgl < awalTahun) { labaDitahan += d - k; return; }
    if (tgl < awalBulan) b.awal += d - k;
    else { b.debit += d; b.kredit += k; }
  };
  dataJurnal.forEach((j) => {
    const tgl = tglValid(j.tanggal);
    if (!tgl || tgl < `${SALDO_AWAL_BULAN}-01` || tgl > akhir) return;
    catat(j.kodeAkunDebet, num(j.nominalDebet), 0, tgl);
    catat(j.kodeAkunKredit, 0, num(j.nominalKredit), tgl);
  });

  const rows = [...baris.values()].sort((a, b) => a.kodeAkun.localeCompare(b.kodeAkun));
  rows.push({ kodeAkun: '—', namaAkun: `Laba ditahan (s/d Des ${Number(bulan.slice(0, 4)) - 1})`, jenisAkun: 'Ekuitas', pos: 'labaDitahan', awal: labaDitahan, debit: 0, kredit: 0 });
  if (Math.abs(suspense.awal) >= 1 || suspense.debit || suspense.kredit) rows.push(suspense);
  rows.forEach((r) => { r.akhir = r.awal + r.debit - r.kredit; });

  const total = rows.reduce((t, r) => {
    t.debit += r.debit; t.kredit += r.kredit;
    if (r.akhir > 0) t.akhirDebit += r.akhir; else t.akhirKredit -= r.akhir;
    return t;
  }, { debit: 0, kredit: 0, akhirDebit: 0, akhirKredit: 0 });
  return { rows, total, suspense };
}

/**
 * Saldo satu akun per akhir `bulan` dan sebelum awal `bulan` — pengganti
 * `saldoAwalDebit/Kredit[bulan]` untuk halaman Buku Besar, Rincian Akun, Cash Flow.
 * @returns {{ awal:number, akhir:number }} dalam konvensi debit − kredit
 */
export function saldoAkunBulan(akun, dataJurnal, bulan) {
  const kode = String(akun.kodeAkun);
  const awalBulan = `${bulan}-01`;
  const akhir = `${bulan}-31`;
  const lr = posNeraca(akun) === POS.LABA_RUGI;
  const mulai = lr ? `${bulan.slice(0, 4)}-01-01` : `${SALDO_AWAL_BULAN}-01`;
  let awal = lr ? 0 : saldoPembukaan(akun);
  let mutasi = 0;
  dataJurnal.forEach((j) => {
    const tgl = tglValid(j.tanggal);
    if (!tgl || tgl < mulai || tgl > akhir) return;
    let v = 0;
    if (kodeBersih(j.kodeAkunDebet) === kode) v += num(j.nominalDebet);
    if (kodeBersih(j.kodeAkunKredit) === kode) v -= num(j.nominalKredit);
    if (!v) return;
    if (tgl < awalBulan) awal += v; else mutasi += v;
  });
  return { awal, akhir: awal + mutasi };
}
