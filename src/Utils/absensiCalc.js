// Perhitungan gaji karyawan HARIAN.
// SUMBER KEBENARAN rumus absensi — backend hanya menyimpan hasilnya (routes/absensi/absensi.js).
// Kalau rumus di sini diubah, data lama perlu disimpan ulang agar rekap ikut terupdate.

// Batas jam kerja normal per hari. Lebih dari ini dihitung lembur.
export const JAM_NORMAL = 7;
export const MENIT_NORMAL = JAM_NORMAL * 60; // 420

export const HARI_LABEL = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];

// 'HH:MM' → menit sejak tengah malam. Null kalau kosong/tidak valid.
export const toMenit = (jam) => {
  if (!jam || typeof jam !== 'string') return null;
  const [h, m] = jam.split(':');
  const hh = Number(h);
  const mm = Number(m);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
};

// Durasi satu blok kerja (mis. in pagi → out siang) dalam menit.
// Blok yang melewati tengah malam (mis. lembur 21:00 → 01:00) ditambah 24 jam.
const durasiBlok = (mulai, selesai) => {
  const a = toMenit(mulai);
  const b = toMenit(selesai);
  if (a === null || b === null) return 0;
  const selisih = b >= a ? b - a : b + 1440 - a;
  return selisih;
};

// Rate per karyawan. Gaji harian dibagi 7 jam → per jam, lalu dibagi 60 → per menit.
export const hitungRate = (gajiHarian, lemburPerJam) => {
  const perJamSiang = (Number(gajiHarian) || 0) / JAM_NORMAL;
  return {
    perJamSiang,
    perMenitSiang: perJamSiang / 60,
    perJamLembur: Number(lemburPerJam) || 0,
    perMenitLembur: (Number(lemburPerJam) || 0) / 60,
  };
};

// Menit kerja mentah satu baris hari dari jam masuk/keluar (dipakai harian & Pakde).
// Blok normalnya dua: pagi (inPagi→outSiang) + siang (inSiang→outSore), dipisah
// jam istirahat. TAPI ada hari karyawan tidak istirahat sehingga out siang & in
// siang tidak diisi — dulu kedua blok jadi 0 dan hari itu tidak terbayar. Kalau
// keduanya kosong, hitung langsung satu blok utuh inPagi→outSore (mis. 08:00–
// 16:00 = 8 jam → 1 jam lembur). Kalau salah satu terisi (setengah hari), tetap
// dua blok. Blok lembur (inLembur→outLembur) selalu ditambahkan terpisah.
export const hitungMenitKerja = (row) => {
  const outSiangKosong = toMenit(row?.outSiang) === null;
  const inSiangKosong = toMenit(row?.inSiang) === null;

  let menitPagi;
  let menitSiang;
  if (outSiangKosong && inSiangKosong) {
    menitPagi = durasiBlok(row?.inPagi, row?.outSore);
    menitSiang = 0;
  } else {
    menitPagi = durasiBlok(row?.inPagi, row?.outSiang);
    menitSiang = durasiBlok(row?.inSiang, row?.outSore);
  }
  const menitLemburBlok = durasiBlok(row?.inLembur, row?.outLembur);
  return { menitPagi, menitSiang, menitLemburBlok, total: menitPagi + menitSiang + menitLemburBlok };
};

// Hitung satu baris hari (HARIAN).
// Aturan: total menit kerja seharian (pagi + siang + blok lembur) dikurangi 7 jam
// = lembur. Sisanya dibayar rate siang. Lembur per menit, tidak dibulatkan.
export const hitungHari = (row, gajiHarian, lemburPerJam) => {
  const rate = hitungRate(gajiHarian, lemburPerJam);

  const totalMenit = hitungMenitKerja(row).total;
  const menitNormal = Math.min(totalMenit, MENIT_NORMAL);
  const menitLembur = Math.max(0, totalMenit - MENIT_NORMAL);

  // Pecah jam/menit hanya untuk tampilan kolom (mirip layout spreadsheet lama)
  const jamNormalUtuh = Math.floor(menitNormal / 60);
  const sisaMenitNormal = menitNormal % 60;
  const upahJamNormal = jamNormalUtuh * rate.perJamSiang;
  const upahMenitNormal = sisaMenitNormal * rate.perMenitSiang;

  const upahNormal = upahJamNormal + upahMenitNormal;
  const upahLembur = menitLembur * rate.perMenitLembur;

  return {
    totalMenit,
    menitNormal,
    menitLembur,
    jamNormalUtuh,
    sisaMenitNormal,
    upahJamNormal,
    upahMenitNormal,
    upahNormal,
    upahLembur,
    jumlah: upahNormal + upahLembur,
  };
};

// Rekap satu periode (7 hari).
export const hitungPeriode = (hariList, gajiHarian, lemburPerJam, potongBon = 0) => {
  const detail = (hariList || []).map((row) => hitungHari(row, gajiHarian, lemburPerJam));

  const sum = (key) => detail.reduce((acc, d) => acc + d[key], 0);
  const totalPendapatan = sum('jumlah');
  const bon = Number(potongBon) || 0;

  return {
    detail,
    totalMenitKerja: sum('totalMenit'),
    totalMenitNormal: sum('menitNormal'),
    totalMenitLembur: sum('menitLembur'),
    totalUpahJamNormal: sum('upahJamNormal'),
    totalUpahMenitNormal: sum('upahMenitNormal'),
    totalUpahNormal: sum('upahNormal'),
    totalUpahLembur: sum('upahLembur'),
    hariMasuk: detail.filter((d) => d.totalMenit > 0).length,
    totalPendapatan,
    potongBon: bon,
    totalAkhir: totalPendapatan - bon,
  };
};

// ─── Helper periode mingguan (Minggu s/d Sabtu) ───────────────────────────────

const pad = (n) => String(n).padStart(2, '0');
export const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Minggu (hari ke-0) dari minggu yang memuat tanggal tsb.
export const awalMinggu = (tanggal) => {
  const d = new Date(tanggal);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return toDateStr(d);
};

export const akhirMinggu = (periodeStart) => {
  const d = new Date(periodeStart);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + 6);
  return toDateStr(d);
};

// Bikin 7 baris kosong Minggu–Sabtu untuk periode tertentu.
export const buatBarisPeriode = (periodeStart) => {
  const base = new Date(periodeStart);
  base.setHours(12, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return {
      tanggal: toDateStr(d),
      hari: HARI_LABEL[d.getDay()],
      inPagi: '', outSiang: '', inSiang: '', outSore: '', inLembur: '', outLembur: '',
    };
  });
};

// Gabung baris tersimpan dengan kerangka periode, supaya tanggal selalu lengkap 7 hari.
export const gabungBaris = (periodeStart, tersimpan) => {
  const kerangka = buatBarisPeriode(periodeStart);
  if (!Array.isArray(tersimpan) || !tersimpan.length) return kerangka;
  return kerangka.map((row) => {
    const found = tersimpan.find((t) => t.tanggal === row.tanggal);
    return found ? { ...row, ...found } : row;
  });
};

// ─── Formatter ────────────────────────────────────────────────────────────────

// Menit → "6.21" (6 jam 21 menit), mengikuti gaya spreadsheet lama.
export const fmtJam = (menit) => {
  if (!menit) return '0.00';
  return `${Math.floor(menit / 60)}.${pad(menit % 60)}`;
};

export const fmtRp = (n) => Math.round(Number(n) || 0).toLocaleString('id-ID');

export const fmtTanggalPeriode = (start, end) => {
  if (!start) return '-';
  const a = new Date(start);
  const b = new Date(end || akhirMinggu(start));
  const bln = (d) => d.toLocaleDateString('id-ID', { month: 'long' });
  const th = String(b.getFullYear()).slice(2);
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()} - ${b.getDate()} ${bln(b)} ${th}`
    : `${a.getDate()} ${bln(a)} - ${b.getDate()} ${bln(b)} ${th}`;
};

// ════════════════════════════════════════════════════════════════════════════
// KARYAWAN BULANAN MINGGUAN (tipe 'bulanan_mingguan', mis. Pakde)
// ─────────────────────────────────────────────────────────────────────────────
// Dibayar per minggu (nilai tetap), tapi jam kerja diabsen seperti harian.
// Beda dari harian:
//   • Hari libur kantor → tetap dihitung 7 jam kerja (dibayar), tidak nol.
//   • MINGGU otomatis libur & TIDAK dihitung (bukan jam kerja, bukan potongan).
//   • Lembur dihitung PER MINGGU: target 42 jam (6 hari × 7). Lebih dari 42 →
//     lembur (tarif per jam ditentukan sendiri, dihitung per menit). Kurang dari
//     42 → potongan = sisa jam × (gaji per minggu ÷ 42), per menit.
// ════════════════════════════════════════════════════════════════════════════

export const JAM_NORMAL_MINGGU = 42;
export const MENIT_NORMAL_MINGGU = JAM_NORMAL_MINGGU * 60; // 2520

export const hitungRatePakde = (gajiPerMinggu, lemburPerJam) => {
  const perJamNormal = (Number(gajiPerMinggu) || 0) / JAM_NORMAL_MINGGU;
  return {
    perJamNormal,
    perMenitNormal: perJamNormal / 60,
    perJamLembur: Number(lemburPerJam) || 0,
    perMenitLembur: (Number(lemburPerJam) || 0) / 60,
  };
};

// Menit efektif satu hari untuk Pakde. Mengembalikan juga jenis baris untuk UI.
export const menitEfektifPakde = (row) => {
  const worked = hitungMenitKerja(row).total;
  if (row?.hari === 'MINGGU') return { creditedMenit: 0, jenis: 'minggu', workedMenit: worked };
  if (row?.libur) return { creditedMenit: Math.max(MENIT_NORMAL, worked), jenis: 'libur', workedMenit: worked };
  return { creditedMenit: worked, jenis: 'kerja', workedMenit: worked };
};

export const hitungPeriodePakde = (hariList, gajiPerMinggu, lemburPerJam, potongBon = 0) => {
  const rate = hitungRatePakde(gajiPerMinggu, lemburPerJam);
  const detail = (hariList || []).map((row) => {
    const e = menitEfektifPakde(row);
    return { ...e, isMinggu: e.jenis === 'minggu', libur: e.jenis === 'libur' };
  });
  // MINGGU dikecualikan total dari akumulasi.
  const totalMenit = detail.reduce((a, d) => a + (d.jenis === 'minggu' ? 0 : d.creditedMenit), 0);

  const lebih = totalMenit >= MENIT_NORMAL_MINGGU;
  const menitNormal = lebih ? MENIT_NORMAL_MINGGU : totalMenit;
  const menitLembur = lebih ? totalMenit - MENIT_NORMAL_MINGGU : 0;
  const menitKurang = lebih ? 0 : MENIT_NORMAL_MINGGU - totalMenit;

  const basePay = Number(gajiPerMinggu) || 0;
  const upahLembur = menitLembur * rate.perMenitLembur;
  const potonganJam = menitKurang * rate.perMenitNormal;
  const bon = Number(potongBon) || 0;
  const totalPendapatan = basePay + upahLembur;

  return {
    detail,
    totalMenit,
    menitNormal,
    menitLembur,
    menitKurang,
    basePay,
    upahLembur,
    potonganJam,
    potongBon: bon,
    hariMasuk: detail.filter((d) => d.jenis !== 'minggu' && d.creditedMenit > 0).length,
    totalPendapatan,
    totalAkhir: totalPendapatan - potonganJam - bon,
  };
};

// ════════════════════════════════════════════════════════════════════════════
// KARYAWAN BULANAN BIASA (tipe 'bulanan', mis. Azwad)
// ─────────────────────────────────────────────────────────────────────────────
// Gaji pokok tetap per BULAN. Tiap hari cukup input total jam lembur + jenis
// absen/cuti (tidak perlu jam masuk/keluar — jam normal dianggap penuh).
//   Pendapatan = gaji pokok + (total menit lembur × tarif lembur per menit) + lain-lain
//   Potongan   = potong bon + potong absen + potong jam kerja (manual)
//   Potong absen = Σ bobot hari × (potong absen per hari)
// ════════════════════════════════════════════════════════════════════════════

// 'H.MM' (jam.menit, gaya slip: 04.42 = 4 jam 42 menit) → menit. Juga terima
// 'H:MM' dan angka jam saja. Kosong/invalid → 0.
export const parseJamMenit = (str) => {
  if (str === null || str === undefined) return 0;
  const s = String(str).trim();
  if (!s) return 0;
  const [h, m = '0'] = s.split(/[.:]/);
  const jam = Number(h) || 0;
  const menit = Number(String(m).slice(0, 2)) || 0;
  return jam * 60 + Math.min(Math.max(menit, 0), 59);
};

// Jenis absen/cuti. `potong` = bobot hari yang dipotong (0 = dibayar).
export const LEAVE_TYPES = [
  { code: '', label: 'Masuk', potong: 0 },
  { code: 'S', label: 'S — Sakit (surat)', potong: 0 },
  { code: 'K', label: 'K — Kuliah', potong: 0 },
  { code: 'SH', label: 'SH — Setengah Hari', potong: 0.5 },
  { code: 'AL', label: 'AL — Acara Lain', potong: 1 },
  { code: 'A', label: 'A — Alpha', potong: 1 },
];

export const bobotPotong = (code) => {
  const t = LEAVE_TYPES.find((x) => x.code === (code || ''));
  return t ? t.potong : 0;
};

export const hitungPeriodeBulanan = (hariList, gajiBulanan, lemburPerJam, potongAbsenPerHari, opts = {}) => {
  const { potongBon = 0, lainLain = 0, potongJamKerja = 0 } = opts;
  const rows = hariList || [];

  const totalLemburMenit = rows.reduce((a, r) => a + (Number(r?.lemburMenit) || 0), 0);
  const perMenitLembur = (Number(lemburPerJam) || 0) / 60;
  const upahLembur = totalLemburMenit * perMenitLembur;

  const totalHariPotong = rows.reduce((a, r) => a + bobotPotong(r?.absen), 0);
  const potongAbsen = totalHariPotong * (Number(potongAbsenPerHari) || 0);

  const pokok = Number(gajiBulanan) || 0;
  const lain = Number(lainLain) || 0;
  const bon = Number(potongBon) || 0;
  const potJam = Number(potongJamKerja) || 0;

  const totalPendapatan = pokok + upahLembur + lain;
  const totalPotongan = bon + potongAbsen + potJam;

  return {
    totalLemburMenit,
    upahLembur,
    perJamLembur: Number(lemburPerJam) || 0,
    totalHariPotong,
    potongAbsen,
    pokok,
    lainLain: lain,
    potongBon: bon,
    potongJamKerja: potJam,
    totalPendapatan,
    totalPotongan,
    totalAkhir: totalPendapatan - totalPotongan,
    hariMasuk: rows.filter((r) => bobotPotong(r?.absen) === 0).length,
  };
};

// ─── Helper periode BULANAN (untuk tipe 'bulanan') ────────────────────────────

export const awalBulan = (tanggal) => {
  const d = new Date(tanggal);
  d.setHours(12, 0, 0, 0);
  d.setDate(1);
  return toDateStr(d);
};

export const akhirBulan = (periodeStart) => {
  const d = new Date(periodeStart);
  d.setHours(12, 0, 0, 0);
  d.setMonth(d.getMonth() + 1, 0); // hari ke-0 bulan berikutnya = hari terakhir bulan ini
  return toDateStr(d);
};

export const buatBarisBulan = (periodeStart) => {
  const base = new Date(periodeStart);
  base.setHours(12, 0, 0, 0);
  base.setDate(1);
  const akhir = new Date(base);
  akhir.setMonth(akhir.getMonth() + 1, 0);
  const jumlahHari = akhir.getDate();
  return Array.from({ length: jumlahHari }, (_, i) => {
    const d = new Date(base);
    d.setDate(1 + i);
    return {
      tanggal: toDateStr(d),
      hari: HARI_LABEL[d.getDay()],
      lembur: '',      // string 'H.MM' yang diketik user
      lemburMenit: 0,  // hasil parse, dipakai perhitungan
      absen: '',
    };
  });
};

export const gabungBarisBulan = (periodeStart, tersimpan) => {
  const kerangka = buatBarisBulan(periodeStart);
  if (!Array.isArray(tersimpan) || !tersimpan.length) return kerangka;
  return kerangka.map((row) => {
    const found = tersimpan.find((t) => t.tanggal === row.tanggal);
    return found ? { ...row, ...found } : row;
  });
};

export const fmtBulan = (periodeStart) => {
  if (!periodeStart) return '-';
  const d = new Date(periodeStart);
  return `${d.toLocaleDateString('id-ID', { month: 'long' }).toUpperCase()} ${d.getFullYear()}`;
};
