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
 * Tulis `html` ke jendela baru lalu panggil print. Kalau popup diblokir,
 * fallback ke iframe tersembunyi supaya tetap bisa dicetak.
 */
export const bukaJendelaCetak = (html) => {
  const win = window.open('', '_blank');
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
    // Tunggu layout & font siap; kalau print() kepagian hasilnya bisa kosong.
    const cetak = () => {
      win.focus();
      win.print();
    };
    if (win.document.readyState === 'complete') setTimeout(cetak, 300);
    else win.onload = () => setTimeout(cetak, 300);
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => iframe.remove(), 1000);
  }, 400);
};
