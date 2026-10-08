// Buka satu halaman HTML di jendela cetak (user pilih "Save as PDF" di dialog
// print; di HP/iPad lewat menu Share). Tidak pakai library PDF sama sekali.
// Dipakai bersama oleh laporan Laba Rugi & rekap Absensi.

export const escapeHtml = (val) =>
  String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Buka `html` di tab baru (tanpa opener) yang langsung memanggil print.
 * Tab dibuat dari blob URL + 'noopener' supaya berjalan di proses terpisah:
 * kalau tidak, dialog print di tab cetak ikut membekukan tab ERP asal
 * (lihat Utils/bukaTab.js).
 */
export const bukaJendelaCetak = (html) => {
  // Tunggu layout & font siap; kalau print() kepagian hasilnya bisa kosong.
  const skrip = '<script>window.addEventListener("load",function(){setTimeout(function(){window.focus();window.print();},300);});<\/script>';
  const isi = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${skrip}</body>`) : html + skrip;
  const url = URL.createObjectURL(new Blob([isi], { type: 'text/html;charset=utf-8' }));
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};
