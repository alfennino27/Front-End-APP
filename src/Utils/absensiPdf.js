// Rekap absensi → halaman siap cetak (Save as PDF). Tiap tipe karyawan punya
// tabel & blok rekap sendiri, mengikuti tampilan layarnya masing-masing:
//   • harian            → tabel jam masuk/keluar + upah per hari
//   • bulanan_mingguan  → tabel jam + kolom LIBUR, rekap mingguan target 42 jam
//   • bulanan           → tabel lembur + absen/cuti, slip pendapatan vs potongan
// Rumus TIDAK dihitung ulang di sini — semua angka datang dari absensiCalc.js
// (lewat objek `rekap`) supaya tidak ada rumus kembar.

import { escapeHtml, bukaJendelaCetak } from './printHtml';
import {
  fmtJam, fmtRp, fmtTanggalPeriode, fmtBulan, akhirMinggu,
  JAM_NORMAL, JAM_NORMAL_MINGGU, LEAVE_TYPES,
} from './absensiCalc';

const TIPE_LABEL = {
  harian: 'HARIAN',
  bulanan_mingguan: 'BULANAN / MINGGU',
  bulanan: 'BULANAN',
};

const tglPendek = (t) =>
  new Date(t).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });

const kerangka = (judulFile, isi) => `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(judulFile)}</title>
  <style>
    @page { size: A4; margin: 12mm 10mm; }
    * { box-sizing: border-box; }
    :root { color-scheme: light; }
    html, body { background: #fff; }
    body {
      font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .kop { border-bottom: 2px solid #0000ff; padding-bottom: 8px; margin-bottom: 12px; }
    .kop .perusahaan { font-size: 11px; margin: 0 0 2px; font-weight: bold; }
    .kop h1 { font-size: 16px; margin: 0 0 2px; color: #0000ff; }
    .kop .periode { font-size: 11px; margin: 0; }
    .identitas { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
    .identitas .nama { font-size: 15px; font-weight: bold; margin: 0; }
    .identitas .meta { font-size: 10px; color: #555; margin: 2px 0 0; }
    .badge {
      display: inline-block; border: 1px solid #0000ff; color: #0000ff;
      border-radius: 10px; padding: 0 6px; font-size: 9px; font-weight: bold;
    }
    table.rate { border-collapse: collapse; min-width: 240px; }
    table.rate td { border: none; font-size: 10px; padding: 2px 0; }
    table.rate td.l { color: #555; font-weight: bold; padding-right: 14px; }
    table.rate td.v { text-align: right; font-weight: bold; }
    table.data { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 12px; }
    table.data th, table.data td { border: 1px solid #c2c2c2; padding: 4px 5px; text-align: center; }
    table.data th { background: #0000ff; color: #fff; font-size: 9px; }
    table.data td.kiri, table.data th.kiri { text-align: left; }
    table.data td.kanan { text-align: right; }
    tr.minggu td { background: #ffe0e0; color: #c62828; }
    tr.libur td { background: #e0ecff; }
    tr.total td { background: #e7e7e8; font-weight: bold; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
    .kotak {
      border: 1px solid #0000ff; border-radius: 6px; padding: 8px 10px;
      font-size: 11px; page-break-inside: avoid; margin-bottom: 10px;
    }
    .kotak .judul { font-weight: bold; font-size: 10px; text-transform: uppercase; margin-bottom: 4px; }
    .baris { display: flex; justify-content: space-between; gap: 12px; padding: 2px 0; }
    .baris.tebal { font-weight: bold; border-top: 1px solid #999; margin-top: 4px; padding-top: 4px; }
    .dua-kolom { display: flex; gap: 10px; }
    .dua-kolom > div { flex: 1; }
    .catatan { font-size: 10px; border: 1px solid #ccc; border-radius: 6px; padding: 6px 8px; margin-bottom: 10px; }
    .ttd { display: flex; justify-content: space-between; margin-top: 24px; font-size: 10px; text-align: center; }
    .ttd div { width: 40%; }
    .ttd .garis { margin-top: 42px; border-top: 1px solid #333; padding-top: 3px; }
    .footer { margin-top: 10px; font-size: 9px; color: #666; }
  </style>
</head>
<body>${isi}</body>
</html>`;

const kop = (judul, periodeTeks) => `
  <div class="kop">
    <p class="perusahaan">KARYA LOGAM FURNITURE</p>
    <h1>${escapeHtml(judul)}</h1>
    <p class="periode">Periode : ${escapeHtml(periodeTeks)}</p>
  </div>`;

const identitas = (karyawan, rateRows) => `
  <div class="identitas">
    <div>
      <p class="nama">${escapeHtml(karyawan?.nama || '-')}</p>
      <p class="meta">
        ${escapeHtml(karyawan?.jabatan || 'Karyawan')} &nbsp;
        <span class="badge">${escapeHtml(TIPE_LABEL[karyawan?.tipe] || 'HARIAN')}</span>
      </p>
    </div>
    <table class="rate">
      ${rateRows
        .map(([l, v]) => `<tr><td class="l">${escapeHtml(l)}</td><td class="v">${escapeHtml(v)}</td></tr>`)
        .join('')}
    </table>
  </div>`;

const blokCatatan = (catatan) =>
  catatan && String(catatan).trim()
    ? `<div class="catatan"><b>Catatan :</b> ${escapeHtml(catatan)}</div>`
    : '';

const ttdDanFooter = () => `
  <div class="ttd">
    <div><div>Diterima oleh,</div><div class="garis">Karyawan</div></div>
    <div><div>Disetujui oleh,</div><div class="garis">Karya Logam Furniture</div></div>
  </div>
  <p class="footer">Dicetak ${new Date().toLocaleString('id-ID')}</p>`;

const baris = (label, nilai, opt = {}) =>
  `<div class="baris${opt.tebal ? ' tebal' : ''}"><span>${escapeHtml(label)}</span><span>${escapeHtml(nilai)}</span></div>`;

const KOLOM_JAM = [
  ['inPagi', 'IN PAGI'],
  ['outSiang', 'OUT SIANG'],
  ['inSiang', 'IN SIANG'],
  ['outSore', 'OUT SORE'],
  ['inLembur', 'IN LEMBUR'],
  ['outLembur', 'OUT LEMBUR'],
];

// ─── HARIAN ──────────────────────────────────────────────────────────────────
export const cetakAbsensiHarian = ({ karyawan, periodeStart, rows, rekap, rate, catatan }) => {
  const periodeTeks = fmtTanggalPeriode(periodeStart, akhirMinggu(periodeStart));

  const tbody = (rows || [])
    .map((row, i) => {
      const d = (rekap.detail || [])[i] || {};
      const minggu = row.hari === 'MINGGU';
      return `
      <tr class="${minggu ? 'minggu' : ''}">
        <td class="kiri"><b>${escapeHtml(row.hari)}</b><br /><span style="font-size:8px;color:#666">${escapeHtml(tglPendek(row.tanggal))}</span></td>
        ${KOLOM_JAM.map(([k]) => `<td>${escapeHtml(row[k] || '-')}</td>`).join('')}
        <td>${escapeHtml(fmtJam(d.menitNormal))}</td>
        <td>${escapeHtml(fmtJam(d.menitLembur))}</td>
        <td class="kanan">${d.upahJamNormal ? escapeHtml(fmtRp(d.upahJamNormal)) : '-'}</td>
        <td class="kanan">${d.upahMenitNormal ? escapeHtml(fmtRp(d.upahMenitNormal)) : '-'}</td>
        <td class="kanan">${d.upahLembur ? escapeHtml(fmtRp(d.upahLembur)) : '-'}</td>
        <td class="kanan"><b>${d.jumlah ? escapeHtml(fmtRp(d.jumlah)) : '-'}</b></td>
      </tr>`;
    })
    .join('');

  const isi = `
    ${kop('REKAP ABSENSI & GAJI HARIAN', periodeTeks)}
    ${identitas(karyawan, [
      ['GAJI HARIAN', 'Rp ' + fmtRp(karyawan?.gajiHarian)],
      [`GAJI / JAM SIANG (÷${JAM_NORMAL})`, 'Rp ' + fmtRp(rate.perJamSiang)],
      ['GAJI / JAM LEMBUR', 'Rp ' + fmtRp(rate.perJamLembur)],
    ])}
    <table class="data">
      <thead>
        <tr>
          <th class="kiri" rowspan="2">HARI</th>
          ${KOLOM_JAM.map(([, l]) => `<th rowspan="2">${l}</th>`).join('')}
          <th rowspan="2">JAM<br/>KERJA</th>
          <th rowspan="2">JAM<br/>LEMBUR</th>
          <th colspan="3">JUMLAH</th>
          <th rowspan="2">TOTAL</th>
        </tr>
        <tr><th>JAM</th><th>MENIT</th><th>LEMBUR</th></tr>
      </thead>
      <tbody>
        ${tbody}
        <tr class="total">
          <td class="kanan" colspan="9">TOTAL PENDAPATAN</td>
          <td class="kanan">${escapeHtml(fmtRp(rekap.totalUpahJamNormal))}</td>
          <td class="kanan">${escapeHtml(fmtRp(rekap.totalUpahMenitNormal))}</td>
          <td class="kanan">${escapeHtml(fmtRp(rekap.totalUpahLembur))}</td>
          <td class="kanan">${escapeHtml(fmtRp(rekap.totalPendapatan))}</td>
        </tr>
      </tbody>
    </table>
    <div class="kotak">
      <div class="judul">Rekap Periode</div>
      ${baris('Hari Masuk', `${rekap.hariMasuk} hari`)}
      ${baris('Total Jam Kerja', fmtJam(rekap.totalMenitNormal))}
      ${baris('Total Jam Lembur', fmtJam(rekap.totalMenitLembur))}
      ${baris('Total Pendapatan', 'Rp ' + fmtRp(rekap.totalPendapatan))}
      ${baris('Potong Bon', '- Rp ' + fmtRp(rekap.potongBon))}
      ${baris('TOTAL AKHIR', 'Rp ' + fmtRp(rekap.totalAkhir), { tebal: true })}
    </div>
    ${blokCatatan(catatan)}
    ${ttdDanFooter()}`;

  bukaJendelaCetak(kerangka(`Absensi-${(karyawan?.nama || '').replace(/\s+/g, '-')}-${periodeStart}`, isi));
};

// ─── BULANAN MINGGUAN (Pakde) ────────────────────────────────────────────────
export const cetakAbsensiPakde = ({ karyawan, periodeStart, rows, rekap, rate, catatan }) => {
  const periodeTeks = fmtTanggalPeriode(periodeStart, akhirMinggu(periodeStart));
  const kurang = rekap.menitKurang > 0;

  const tbody = (rows || [])
    .map((row, i) => {
      const d = (rekap.detail || [])[i] || {};
      const minggu = row.hari === 'MINGGU';
      const kelas = minggu ? 'minggu' : d.jenis === 'libur' ? 'libur' : '';
      return `
      <tr class="${kelas}">
        <td class="kiri"><b>${escapeHtml(row.hari)}</b><br /><span style="font-size:8px;color:#666">${escapeHtml(tglPendek(row.tanggal))}</span></td>
        ${KOLOM_JAM.map(([k]) => `<td>${escapeHtml(row[k] || '-')}</td>`).join('')}
        <td>${minggu ? 'MINGGU' : d.jenis === 'libur' ? 'LIBUR' : '-'}</td>
        <td><b>${minggu ? '—' : escapeHtml(fmtJam(d.creditedMenit))}</b></td>
      </tr>`;
    })
    .join('');

  const isi = `
    ${kop('REKAP ABSENSI & GAJI MINGGUAN', periodeTeks)}
    ${identitas(karyawan, [
      ['GAJI / MINGGU', 'Rp ' + fmtRp(karyawan?.gajiPerMinggu)],
      [`GAJI / JAM (÷${JAM_NORMAL_MINGGU})`, 'Rp ' + fmtRp(rate.perJamNormal)],
      ['GAJI / JAM LEMBUR', 'Rp ' + fmtRp(rate.perJamLembur)],
    ])}
    <table class="data">
      <thead>
        <tr>
          <th class="kiri">HARI</th>
          ${KOLOM_JAM.map(([, l]) => `<th>${l}</th>`).join('')}
          <th>KETERANGAN</th>
          <th>JAM KERJA</th>
        </tr>
      </thead>
      <tbody>
        ${tbody}
        <tr class="total">
          <td class="kanan" colspan="8">TOTAL JAM KERJA (target ${JAM_NORMAL_MINGGU} jam)</td>
          <td>${escapeHtml(fmtJam(rekap.totalMenit))}</td>
        </tr>
      </tbody>
    </table>
    <div class="kotak">
      <div class="judul">Rekap Mingguan</div>
      ${baris(`Total Jam Kerja (target ${JAM_NORMAL_MINGGU} jam)`, fmtJam(rekap.totalMenit))}
      ${baris('Total Jam Lembur', fmtJam(rekap.menitLembur))}
      ${kurang ? baris('Kekurangan Jam', fmtJam(rekap.menitKurang)) : ''}
      ${baris('Hari Masuk', `${rekap.hariMasuk} hari`)}
      ${baris('Gaji per Minggu', 'Rp ' + fmtRp(rekap.basePay))}
      ${baris('Upah Lembur', 'Rp ' + fmtRp(rekap.upahLembur))}
      ${kurang ? baris('Potongan Jam', '- Rp ' + fmtRp(rekap.potonganJam)) : ''}
      ${baris('Potong Bon', '- Rp ' + fmtRp(rekap.potongBon))}
      ${baris('TOTAL AKHIR', 'Rp ' + fmtRp(rekap.totalAkhir), { tebal: true })}
    </div>
    ${blokCatatan(catatan)}
    ${ttdDanFooter()}`;

  bukaJendelaCetak(kerangka(`Absensi-${(karyawan?.nama || '').replace(/\s+/g, '-')}-${periodeStart}`, isi));
};

// ─── BULANAN (Azwad) ─────────────────────────────────────────────────────────
export const cetakAbsensiBulanan = ({ karyawan, periodeStart, rows, rekap, catatan }) => {
  const periodeTeks = fmtBulan(periodeStart);
  const labelAbsen = (code) => {
    if (!code) return 'Masuk';
    const t = LEAVE_TYPES.find((x) => x.code === code);
    return t ? t.label.split('—').pop().trim() : code;
  };

  const tbody = (rows || [])
    .map((row) => {
      const minggu = new Date(row.tanggal).getDay() === 0;
      const punyaLembur = Number(row.lemburMenit) > 0;
      return `
      <tr class="${minggu ? 'minggu' : ''}">
        <td class="kiri">${escapeHtml(tglPendek(row.tanggal))}</td>
        <td>${escapeHtml(row.hari)}</td>
        <td>${punyaLembur ? escapeHtml(fmtJam(row.lemburMenit)) : '-'}</td>
        <td>${escapeHtml(labelAbsen(row.absen))}</td>
      </tr>`;
    })
    .join('');

  const isi = `
    ${kop('REKAP ABSENSI & SLIP GAJI BULANAN', periodeTeks)}
    ${identitas(karyawan, [
      ['GAJI POKOK / BULAN', 'Rp ' + fmtRp(karyawan?.gajiBulanan)],
      ['UPAH LEMBUR / JAM', 'Rp ' + fmtRp(karyawan?.lemburPerJam)],
      ['POTONG ABSEN / HARI', 'Rp ' + fmtRp(karyawan?.potongAbsenPerHari)],
    ])}
    <table class="data">
      <thead>
        <tr><th class="kiri">TANGGAL</th><th>HARI</th><th>LEMBUR (jam)</th><th>ABSEN / CUTI</th></tr>
      </thead>
      <tbody>
        ${tbody}
        <tr class="total">
          <td class="kanan" colspan="2">TOTAL</td>
          <td>${escapeHtml(fmtJam(rekap.totalLemburMenit))}</td>
          <td>${escapeHtml(String(rekap.totalHariPotong))} hari potong</td>
        </tr>
      </tbody>
    </table>
    <div class="dua-kolom">
      <div class="kotak">
        <div class="judul">Pendapatan</div>
        ${baris('Gaji Pokok', 'Rp ' + fmtRp(rekap.pokok))}
        ${baris(`Lembur (${fmtJam(rekap.totalLemburMenit)} jam × ${fmtRp(rekap.perJamLembur)})`, 'Rp ' + fmtRp(rekap.upahLembur))}
        ${baris('Lain-lain', 'Rp ' + fmtRp(rekap.lainLain))}
        ${baris('Total Pendapatan', 'Rp ' + fmtRp(rekap.totalPendapatan), { tebal: true })}
      </div>
      <div class="kotak">
        <div class="judul">Potongan</div>
        ${baris('Potong Bon', 'Rp ' + fmtRp(rekap.potongBon))}
        ${baris(`Potong Absen (${rekap.totalHariPotong} hari × ${fmtRp(karyawan?.potongAbsenPerHari)})`, 'Rp ' + fmtRp(rekap.potongAbsen))}
        ${baris('Potong Jam Kerja', 'Rp ' + fmtRp(rekap.potongJamKerja))}
        ${baris('Total Potongan', 'Rp ' + fmtRp(rekap.totalPotongan), { tebal: true })}
      </div>
    </div>
    <div class="kotak">
      ${baris('Hari Masuk', `${rekap.hariMasuk} hari`)}
      ${baris('TOTAL GAJI DITERIMA', 'Rp ' + fmtRp(rekap.totalAkhir), { tebal: true })}
    </div>
    ${blokCatatan(catatan)}
    ${ttdDanFooter()}`;

  bukaJendelaCetak(kerangka(`Slip-Gaji-${(karyawan?.nama || '').replace(/\s+/g, '-')}-${periodeStart.slice(0, 7)}`, isi));
};
