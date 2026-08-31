// Render laporan Laba Rugi jadi halaman siap cetak lalu panggil print dialog.
// Tidak ada library PDF: user pilih "Save as PDF" di dialog print (di HP/iPad
// lewat menu Share). Nama file PDF ikut <title> halaman cetaknya.

import { labelBulan } from './labaRugiReport';
import { escapeHtml, bukaJendelaCetak } from './printHtml';

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
    : `<tr><td class="kosong" colspan="${jumlahKolom}">Tidak ada data di bulan ini</td></tr>`;

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
    <p class="periode">Periode : ${escapeHtml(labelBulan(laporan.bulan))}</p>
  </div>
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
  `${laporan.judul.replace(/\s+/g, '-')}-${laporan.bulan}`;

/**
 * Buka jendela cetak untuk satu laporan. Kalau popup diblokir, fallback ke
 * iframe tersembunyi supaya tetap bisa dicetak.
 */
export const cetakLaporanLabaRugi = (laporan) => {
  const namaFile = namaFileLaporan(laporan);
  bukaJendelaCetak(htmlLaporan(laporan, namaFile));
};
