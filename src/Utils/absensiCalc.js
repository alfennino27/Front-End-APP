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

// Hitung satu baris hari.
// Aturan: total menit kerja seharian (pagi + siang + blok lembur) dikurangi 7 jam = lembur.
// Sisanya dibayar rate siang. Lembur dihitung per menit, tidak dibulatkan.
export const hitungHari = (row, gajiHarian, lemburPerJam) => {
  const rate = hitungRate(gajiHarian, lemburPerJam);

  const menitPagi = durasiBlok(row?.inPagi, row?.outSiang);
  const menitSiang = durasiBlok(row?.inSiang, row?.outSore);
  const menitLemburBlok = durasiBlok(row?.inLembur, row?.outLembur);

  const totalMenit = menitPagi + menitSiang + menitLemburBlok;
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
