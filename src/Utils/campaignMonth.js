// src/Utils/campaignMonth.js
//
// Helper atribusi campaign per BULAN LEAD MASUK (dipakai form Invoice & Quote).
//
// Alasan: ROI campaign dihitung per bulan lead masuk (Model B), bukan bulan
// closing. Lead yang masuk Juli tapi closing Agustus harus tetap dihitung di
// Juli — jadi user memilih bulan lead dulu, lalu daftar campaign dibatasi
// campaign yang MEMANG aktif di bulan itu.
//
// Aturan "aktif di bulan X" mengikuti CRM.jsx (getCampaignMonthData):
// `daily_data` adalah sumber kebenaran per hari; campaign lama tanpa daily_data
// jatuh ke field `bulan`.

const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

/** 'YYYY-MM' → 'Agustus 2026' */
export const labelBulan = (ym) => {
  const [y, m] = String(ym || '').split('-');
  const idx = Number(m) - 1;
  return NAMA_BULAN[idx] ? `${NAMA_BULAN[idx]} ${y}` : (ym || '');
};

/** Date | string | null → 'YYYY-MM' (kosong kalau tidak valid) */
export const toMonth = (value) => {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Campaign benar-benar jalan di bulan tsb? */
export const campaignActiveInMonth = (camp, month) => {
  if (!camp || !month) return false;
  const daily = Array.isArray(camp.daily_data) ? camp.daily_data : [];
  if (daily.length > 0) return daily.some((d) => String(d.date || '').slice(0, 7) === month);
  return camp.bulan === month;   // campaign lama: belum punya daily_data
};

/** Campaign yang boleh dipilih untuk bulan lead tsb. */
export const campaignsForMonth = (campaigns, month) =>
  (campaigns || []).filter((c) => campaignActiveInMonth(c, month));

/**
 * Daftar pilihan bulan lead (terbaru dulu).
 * Isi: `back` bulan terakhir + bulan yang wajib ada (bulan invoice/quote &
 * bulan yang sudah tersimpan) supaya nilai lama tidak pernah hilang dari dropdown.
 */
export const monthChoices = (extras = [], back = 18) => {
  const set = new Set();
  const now = new Date();
  for (let i = 0; i < back; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  extras.filter(Boolean).forEach((m) => set.add(m));
  return Array.from(set).sort().reverse();
};
