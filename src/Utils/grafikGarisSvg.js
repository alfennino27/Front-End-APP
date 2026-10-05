// Grafik garis bulanan (penjualan / pengeluaran / keuntungan) sebagai STRING SVG.
// Satu sumber dipakai dua tempat: PDF cetak (labaRugiPdf.js) dan tampilan ERP
// (Components/Accounting/GrafikBulanan.jsx), jadi grafik di layar = di PDF.
// Tanpa library chart supaya ikut tercetak di dialog print browser.

import { escapeHtml } from './printHtml';
import { labelBulanPendek } from './labaRugiReport';

/** "12 jt" / "1,2 M" — label sumbu Y & tooltip, biar tidak kepanjangan. */
export const singkatRupiah = (n) => {
  const v = Number(n || 0);
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${(v / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 1 })} M`;
  if (abs >= 1e6) return `${(v / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 0 })} jt`;
  if (abs >= 1e3) return `${(v / 1e3).toLocaleString('id-ID', { maximumFractionDigits: 0 })} rb`;
  return String(Math.round(v));
};

export const SERI_GRAFIK = [
  { key: 'penjualan', nama: 'Penjualan', warna: '#0000ff' },
  { key: 'pengeluaran', nama: 'Pengeluaran', warna: '#d92b2b' },
  { key: 'keuntungan', nama: 'Keuntungan', warna: '#1a9850' },
];

/**
 * @param {Array<{bulan:string, penjualan:number, pengeluaran:number, keuntungan:number}>} grafik
 * @param {{hrefBulan?: (bulan: string) => string}} opsi - kalau diisi, tiap bulan
 *        dapat area klik berupa <a target="_blank"> ke laporan bulan itu
 *        (dipakai halaman ERP; di PDF tidak dirender).
 */
export const svgGrafikGaris = (grafik, opsi = {}) => {
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
  const x = (i) => ML + (i * plotW) / (n - 1);
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

  // Pita klik selebar satu bulan — hanya di layar (ERP). Pakai <a target="_blank">
  // supaya laporan bulan itu terbuka di tab baru dan halaman rentang ini tetap utuh
  // (sekaligus bisa klik-tengah / ⌘-klik seperti link biasa).
  const lebarPita = plotW / Math.max(n - 1, 1);
  const pita = opsi.hrefBulan
    ? grafik
        .map((g, i) => {
          const px = Math.max(ML, x(i) - lebarPita / 2);
          const lebar = Math.min(lebarPita, W - MR - px);
          const judul = `${labelBulanPendek(g.bulan)}\nPenjualan ${singkatRupiah(g.penjualan)}\nPengeluaran ${singkatRupiah(
            g.pengeluaran
          )}\nKeuntungan ${singkatRupiah(g.keuntungan)}`;
          return (
            `<a href="${escapeHtml(opsi.hrefBulan(g.bulan))}" target="_blank" rel="noopener">` +
            `<rect x="${px.toFixed(1)}" y="${MT}" width="${lebar.toFixed(1)}" height="${plotH}" fill="transparent" style="cursor:pointer">` +
            `<title>${escapeHtml(judul)}</title></rect></a>`
          );
        })
        .join('')
    : '';

  return `
    <svg viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg">
      <rect x="${ML}" y="${MT}" width="${plotW}" height="${plotH}" fill="#fff" stroke="#c2c2c2" stroke-width="1" />
      ${grid}${garisNol}${garis}${labelX}${legend}${pita}
    </svg>`;
};
