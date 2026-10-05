// Render laporan Laba Rugi jadi halaman siap cetak lalu panggil print dialog.
// Tidak ada library PDF: user pilih "Save as PDF" di dialog print (di HP/iPad
// lewat menu Share). Nama file PDF ikut <title> halaman cetaknya.

import { labelBulan, labelBulanPendek } from './labaRugiReport';
import { escapeHtml, bukaJendelaCetak } from './printHtml';

// --- Grafik garis penjualan / pengeluaran / keuntungan per bulan -------------
// SVG inline (tanpa library) supaya ikut tercetak di dialog print browser.

const singkatRupiah = (n) => {
  const v = Number(n || 0);
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${(v / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 1 })} M`;
  if (abs >= 1e6) return `${(v / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 0 })} jt`;
  if (abs >= 1e3) return `${(v / 1e3).toLocaleString('id-ID', { maximumFractionDigits: 0 })} rb`;
  return String(Math.round(v));
};

const SERI_GRAFIK = [
  { key: 'penjualan', nama: 'Penjualan', warna: '#0000ff' },
  { key: 'pengeluaran', nama: 'Pengeluaran', warna: '#d92b2b' },
  { key: 'keuntungan', nama: 'Keuntungan', warna: '#1a9850' },
];

const htmlGrafik = (grafik) => {
  if (!grafik || grafik.length < 2) return '';

  const W = 760, H = 320, ML = 72, MR = 14, MT = 14, MB = 58;
  const plotW = W - ML - MR;
  const plotH = H - MT - MB;

  const semua = grafik.flatMap((g) => SERI_GRAFIK.map((s) => Number(g[s.key] || 0)));
  let max = Math.max(...semua, 0);
  let min = Math.min(...semua, 0);
  if (max === min) max = min + 1;
  max += (max - min) * 0.1;
  if (min < 0) min -= (max - min) * 0.05;

  const n = grafik.length;
  const x = (i) => ML + (n === 1 ? plotW / 2 : (i * plotW) / (n - 1));
  const y = (v) => MT + ((max - Number(v || 0)) / (max - min)) * plotH;

  // Garis bantu + label sumbu Y (5 tingkat).
  const ticks = Array.from({ length: 5 }, (_, i) => min + ((max - min) * i) / 4);
  const grid = ticks
    .map(
      (t) =>
        `<line x1="${ML}" y1="${y(t).toFixed(1)}" x2="${W - MR}" y2="${y(t).toFixed(1)}" stroke="#e0e0e0" stroke-width="1" />` +
        `<text x="${ML - 6}" y="${(y(t) + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="#666">${escapeHtml(singkatRupiah(t))}</text>`
    )
    .join('');

  const garisNol =
    min < 0 && max > 0
      ? `<line x1="${ML}" y1="${y(0).toFixed(1)}" x2="${W - MR}" y2="${y(0).toFixed(1)}" stroke="#999" stroke-width="1" />`
      : '';

  // Label bulan — kalau bulannya banyak, tampilkan selang-seling biar tidak tabrakan.
  const langkah = Math.ceil(n / 12);
  const labelX = grafik
    .map((g, i) =>
      i % langkah === 0 || i === n - 1
        ? `<text x="${x(i).toFixed(1)}" y="${H - MB + 16}" text-anchor="middle" font-size="9" fill="#444">${escapeHtml(
            labelBulanPendek(g.bulan)
          )}</text>`
        : ''
    )
    .join('');

  const garis = SERI_GRAFIK.map((s) => {
    const titik = grafik.map((g, i) => `${x(i).toFixed(1)},${y(g[s.key]).toFixed(1)}`).join(' ');
    const bulat = grafik
      .map((g, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(g[s.key]).toFixed(1)}" r="2.5" fill="${s.warna}" />`)
      .join('');
    return `<polyline points="${titik}" fill="none" stroke="${s.warna}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />${bulat}`;
  }).join('');

  const legend = SERI_GRAFIK.map((s, i) => {
    const lx = ML + i * 140;
    const ly = H - 14;
    return (
      `<line x1="${lx}" y1="${ly - 4}" x2="${lx + 20}" y2="${ly - 4}" stroke="${s.warna}" stroke-width="2" />` +
      `<circle cx="${lx + 10}" cy="${ly - 4}" r="2.5" fill="${s.warna}" />` +
      `<text x="${lx + 26}" y="${ly}" font-size="10" fill="#333">${escapeHtml(s.nama)}</text>`
    );
  }).join('');

  return `
    <div class="blok grafik">
      <p class="judul-section">Grafik Bulanan</p>
      <svg viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="${ML}" y="${MT}" width="${plotW}" height="${plotH}" fill="#fff" stroke="#c2c2c2" stroke-width="1" />
        ${grid}${garisNol}${garis}${labelX}${legend}
      </svg>
    </div>`;
};

const htmlSection = (section) => {
  const jumlahKolom = section.kolom.length;
  const align = section.align || section.kolom.map(() => 'left');

  const thead = section.kolom
    .map((k) => `<th>${escapeHtml(k)}</th>`)
    .join('');

  const tbody = section.baris.length
    ? section.baris
        .map(
          (row, i) =>
            `<tr class="${i % 2 === 0 ? 'even' : 'odd'}">` +
            row
              .map((cell, c) => `<td class="a-${align[c] || 'left'}">${escapeHtml(cell)}</td>`)
              .join('') +
            '</tr>'
        )
        .join('')
    : `<tr><td class="kosong" colspan="${jumlahKolom}">Tidak ada data di periode ini</td></tr>`;

  const total = section.total
    ? `<tr class="total">` +
      `<td colspan="${section.total.labelSpan}">${escapeHtml(section.total.label)}</td>` +
      section.total.nilai.map((n) => `<td class="a-right">${escapeHtml(n)}</td>`).join('') +
      `</tr>`
    : '';

  return `
    <div class="blok">
      <p class="judul-section">${escapeHtml(section.judul)}</p>
      <table>
        <thead><tr>${thead}</tr></thead>
        <tbody>${tbody}${total}</tbody>
      </table>
    </div>`;
};

const htmlLaporan = (laporan, namaFile) => `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(namaFile)}</title>
  <style>
    @page { size: A4; margin: 14mm 12mm; }
    * { box-sizing: border-box; }
    html, body { background: #fff; }
    :root { color-scheme: light; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
      margin: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .kop { border-bottom: 2px solid #0000ff; padding-bottom: 8px; margin-bottom: 16px; }
    .kop h1 { font-size: 16px; margin: 0 0 2px; color: #0000ff; }
    .kop .perusahaan { font-size: 11px; margin: 0 0 4px; font-weight: bold; }
    .kop .periode { font-size: 11px; margin: 0; }
    .blok { margin-bottom: 18px; page-break-inside: auto; }
    .judul-section { font-size: 12px; font-weight: bold; margin: 0 0 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th, td { border: 1px solid #c2c2c2; padding: 5px 6px; }
    th { background: #0000ff; color: #fff; text-align: center; }
    tr.even td { background: #f4f4f4; }
    tr.odd td { background: #fff; }
    tr.total td { background: #e7e7e8; font-weight: bold; }
    td.kosong { text-align: center; font-style: italic; color: #777; }
    .grafik { page-break-inside: avoid; }
    .a-center { text-align: center; }
    .a-right { text-align: right; }
    .a-left { text-align: left; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
    .ringkasan {
      margin-top: 10px; border: 1px solid #0000ff; border-radius: 6px;
      padding: 8px 10px; font-size: 12px; font-weight: bold;
      page-break-inside: avoid;
    }
    .ringkasan div { display: flex; justify-content: space-between; }
    .footer { margin-top: 14px; font-size: 9px; color: #666; }
  </style>
</head>
<body>
  <div class="kop">
    <p class="perusahaan">KARYA LOGAM FURNITURE</p>
    <h1>${escapeHtml(laporan.judul)}</h1>
    <p class="periode">Periode : ${escapeHtml(laporan.periode || labelBulan(laporan.bulan))}</p>
  </div>
  ${htmlGrafik(laporan.grafik)}
  ${laporan.sections.map(htmlSection).join('')}
  <div class="ringkasan">
    ${laporan.ringkasan
      .map(
        (r) => `<div><span>${escapeHtml(r.label)}</span><span>${escapeHtml(r.nilai)}</span></div>`
      )
      .join('')}
  </div>
  <p class="footer">Dicetak ${new Date().toLocaleString('id-ID')}</p>
</body>
</html>`;

/** Nama file (tanpa ekstensi) yang jadi default saat "Save as PDF". */
const namaFileLaporan = (laporan) =>
  `${laporan.judul.replace(/\s+/g, '-')}-${laporan.periodeFile || laporan.bulan}`;

/**
 * Buka jendela cetak untuk satu laporan. Kalau popup diblokir, fallback ke
 * iframe tersembunyi supaya tetap bisa dicetak.
 */
export const cetakLaporanLabaRugi = (laporan) => {
  const namaFile = namaFileLaporan(laporan);
  bukaJendelaCetak(htmlLaporan(laporan, namaFile));
};
