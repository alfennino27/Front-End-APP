// Buka halaman ERP di tab baru TANPA hubungan opener.
//
// Kenapa: tab yang dibuka window.open(url, '_blank') biasa berbagi proses
// renderer (satu thread JS) dengan tab asal. Halaman cetak memanggil
// window.print() yang memblokir thread itu selama dialog print terbuka —
// akibatnya tab ERP asal ikut beku (tidak bisa klik/ketik/reload) sampai
// dialog print di tab lain ditutup. 'noopener' memisahkan prosesnya.
//
// Catatan: tab noopener TIDAK mewarisi sessionStorage, jadi data titipan untuk
// halaman cetak lewat localStorage.

export const bukaTab = (url) => {
  window.open(url, '_blank', 'noopener');
};
