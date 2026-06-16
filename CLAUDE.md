# KLF-APP — ERP Frontend (React + Vite)

Frontend ERP untuk Karya Logam Furniture. Bagian dari sistem KLF (backend: KLF-Server, website: KLF-Website).

## Jalankan
```bash
npm install
npm run dev      # vite --host  (port 5173)
npm run build    # vite build  — JALANKAN sebelum push untuk catch error
```

## Produksi
Auto-deploy **Vercel** dari push ke GitHub `Front-End-APP` → `https://app.karyalogamfurniture.com`.
**PWA**: perubahan butuh hard refresh (`Cmd+Shift+R`) / "Empty Cache and Hard Reload".

## Arsitektur
- React 18 + React Router 6. Routing semua di `src/App.jsx`.
- UI campuran: MUI 5, Ant Design 5, React-Bootstrap 5, react-icons. Komponen baru cenderung pakai **inline style object**.
- Theme: `ThemeContext` → `useTheme()` → `globalTheme` ('light'|'dark').
- State: `localStorage` + Mitt (tidak ada Redux/Zustand). User: `JSON.parse(localStorage.user)` → `.uid`.
- API base URL: `src/Config/APIurl/index.js` → `getApiBaseUrl()` (localhost:3001 jika `developerMode==='on'`, else api.karyalogamfurniture.com).
- Akses menu: `useraccess` collection; cek `hasMenuAccess(uid, menuKey)` di NavigationBar.

## Struktur
- `src/Pages/*Page.jsx` → wrapper tipis tiap route
- `src/Components/<Modul>/` → komponen utama (Accounting, Pekerjaan/Invoice, CRM, Stock, dll)
- `src/Components/Navbar/NavigationBar.jsx` → menu (dropdown: General, Operations, Finance, Archive, Management, System)
- `src/Components/UserManagement/` → toggle akses menu per user (checkbox `getCheckboxState(uid, menuKey)`)

## Modul yang sering disentuh
- **Pekerjaan/Invoice.jsx** — invoice CRUD, produk, pembayaran, gross profit. Hitung `totalPenjualan`/`totalProfit` dari Projects + SPKproduct. Form Create & Update punya field campaign CRM + toggle Repeat Order.
- **CRM/CRM.jsx** — pipeline (kanban stage), kampanye (import Meta Ads CSV), analitik. Lihat catatan CRM di bawah.

## CRM (baca sebelum edit analitik)
- **Atribusi Model B**: bulan deal = `tanggal_masuk` (= Invoice.tanggalMulaiInvoice), bukan tanggal closing.
- **"From Ads"** = new customer dari campaign saja (exclude repeat & organic). `Total Profit from Ads = GP from Ads − Total Spend Ads`.
- **Repeat Order**: toggle di form invoice → wajib pilih campaign asal → masuk CLV, bukan ROAS. Badge "↩ Repeat".
- **Campaign multi-bulan**: SATU dokumen; metrik per bulan diturunkan dari `daily_data` via `getCampaignMonthData(camp, month)` (weighted-avg by impressions). Jangan pecah jadi multi-dokumen.
- CSV parser Meta Ads ada di `handleCSVFile` (agregasi harian per ad set + simpan `daily_data`).

## Konvensi
- Tidak ada test. Verifikasi: `npm run build` + cek manual di browser.
- Label UI bahasa Indonesia.
- Sebelum push: `npm run build` wajib lolos (Vercel akan gagal kalau build error).

> Dokumentasi lengkap lintas-repo (DB, backend, alur bisnis, deployment) ada di `../CLAUDE.md` (root workspace).
