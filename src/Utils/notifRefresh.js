// Minta bel notifikasi (NavigationBar) menghitung ulang SEKARANG, tanpa menunggu
// polling 30 detik — dipanggil setelah komentar/balasan dibuat, diedit, dihapus,
// supaya notif yang sudah dibalas langsung padam tanpa reload.
export const NOTIF_REFRESH_EVENT = 'klf:notif-refresh';

export function mintaRefreshNotif() {
  window.dispatchEvent(new Event(NOTIF_REFRESH_EVENT));
}
