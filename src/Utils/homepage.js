import { getApiBaseUrl } from '../Config/APIurl';

// Halaman awal ERP per user (field Users.homepage, diatur di User Management).
// `menu` = key UserAccess yang dibutuhkan halaman itu (sama dengan NavigationBar).
export const DEFAULT_HOMEPAGE = '/project';
export const HOMEPAGE_OPTIONS = [
  { path: '/project', label: 'Projects', menu: 'Projects' },
  { path: '/dashboard', label: 'Dashboard', menu: 'Dashboard' },
  { path: '/invoice', label: 'Invoice', menu: 'Invoice' },
  { path: '/quote', label: 'Quote', menu: 'Quote' },
  { path: '/spk', label: 'SPK', menu: 'SPK' },
  { path: '/category', label: 'Category', menu: 'Category' },
  { path: '/todo', label: 'To-Do & QC', menu: 'Todo' },
  { path: '/pengiriman', label: 'Pengiriman', menu: 'Pengiriman' },
  { path: '/crm', label: 'CRM', menu: 'CRM' },
  { path: '/calendar', label: 'Calendar', menu: 'Calendar' },
  { path: '/notes', label: 'Notes', menu: 'Notes' },
  { path: '/knowledge', label: 'Knowledge Base', menu: 'Knowledge' },
  { path: '/klf-ai', label: 'KLF AI', menu: 'KLF AI' },
  { path: '/accounting', label: 'Accounting', menu: 'Accounting' },
  { path: '/stock', label: 'Stocks', menu: 'Stocks' },
  { path: '/assets', label: 'Assets', menu: 'Assets' },
  { path: '/hasil-produksi', label: 'Hasil Produksi', menu: 'Hasil Produksi' },
  { path: '/desain', label: 'Desain Produk', menu: 'Desain Produk' },
  { path: '/products', label: 'Products', menu: 'Products' },
  { path: '/pricelist', label: 'Riwayat HPP Produksi', menu: 'Price List' },
  { path: '/absensi', label: 'Absensi', menu: 'Absensi' },
  { path: '/appraisal', label: 'Appraisal', menu: 'Appraisal' },
];

// Ambil homepage terbaru dari server (perubahan admin langsung berlaku tanpa login ulang).
export const fetchHomepage = async (uid) => {
  try {
    const r = await fetch(`${getApiBaseUrl()}/users/profile/get`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uid }),
    });
    const d = await r.json();
    return d?.homepage || DEFAULT_HOMEPAGE;
  } catch {
    return DEFAULT_HOMEPAGE;
  }
};
