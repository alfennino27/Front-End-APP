# Fitur Quote & Invoice di ERP — Design Spec

> Tanggal: 2026-07-07
> Repo: `KLF-APP-main` (frontend) + `KLF-Server-main` (backend). DB `KLF-APP-DB`.
> Status: DESIGN — menunggu review user sebelum implementasi.

## 1. Latar Belakang & Tujuan

Owner (Nino) sering diminta customer membuat **quotation / invoice** saat sedang di luar / tidak
pegang PC. Akibatnya follow-up delay (nunggu pulang, kadang lupa). Solusi: fitur buat Quote &
Invoice **langsung di dalam ERP**, bisa diakses dari **HP maupun iPad** dengan mudah.

Kunci sukses:
- Bisa buat quote/invoice cepat dari HP/iPad (form responsive, HP-first).
- Output PDF **persis** template Excel yang selama ini dipakai (contoh: `Quote Ny. Mila.xlsx`
  sheet Q1/Q2 → PDF `Invoice Ny. Mila - 11 Jun 26.pdf`).
- Terintegrasi ke sistem yang sudah ada: costing → budget invoice (`estimasi<Category>`),
  status → pipeline CRM, dan saat Deal otomatis jadi Invoice resmi (jurnal Piutang/Penjualan jalan).

## 2. Keputusan yang Sudah Disepakati

| Topik | Keputusan |
|---|---|
| Quote vs Invoice | **Satu dokumen, ubah status.** Quote → Deal meng-convert jadi Invoice resmi. |
| Visibilitas | Quote **disembunyikan** dari list Invoice/produksi sampai status = Deal. |
| Jumlah item | Bervariasi / tak terbatas. Form pakai pola "tambah item" dinamis. |
| Penomoran | **Manual** (kode diketik user), kecuali `rev` yang otomatis. |
| Kirim ke customer | v1: cukup **Download PDF**, user share manual (WA). Tidak ada WA API. |
| Approval | Tidak ada approval digital. PDF statis. |
| Menu | Menu **terpisah** `/quote` di navbar (grup Operations). |
| Akses | Ada filter akses di User Management, menu key `"Quote"`. |
| CRM sync | Buat quote → lead CRM; status → pipeline; hapus → hapus lead. |
| Nilai Quote | = **subtotal − discount** (nilai deal penuh), bukan nominal DP. |
| Costing categories | Pakai **9 kategori sistem** (`estimasi<Category>`), bukan label Excel. |
| Rev | Mulai 1, **+1 setiap simpan perubahan** setelah pembuatan awal. |
| Grand Total | **Manual** (nominal jatuh tempo di dokumen ini, mis. = DP). Default subtotal−discount, bisa diedit. |
| Responsive | **HP-first**, melebar otomatis di iPad/desktop. |

## 3. Anatomi Template PDF (yang harus direplikasi)

Ukuran: **A4 landscape** (842×595 pt). Semua garis tabel hitam tipis.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [LOGO KLF - kotak gelap]        │ v.1 │ INVOICE <Nama Customer>           │
│                                 │     ├───────────────────────────────────┤
│                                 │     │ CODE      : Mila/26/VI/01          │
│                                 │     │ DATE      : 11/06/26               │
│                                 │     │ DEADLINE  : 3-4 weeks after payment│
│                                 │     │ REV       : 1                      │
├───────────────────────────────────────┬───────────────────────────────────┤
│ 1.- SUPPLIER                          │ 2.- DELIVERY                       │
│ Karya Logam Furniture                 │ CUSTOMER : Ny. Mila Maidarti        │
│ Jl. Bendansari No.2, ... Jepara       │ ADDRESS  :                          │
│ email : nino@karyalogamfurniture.com  │ Email    :                          │
│ Mobile: +6281327737717 / +62895...    │ Mobile   : +62 811-969-092          │
├───────────────────────────────────────────────────────────────────────────┤
│ 3.- PRICELIST                                                              │
├────┬──────────────┬────────────────────┬────────────┬─────┬───────────────┤
│ NO │   GAMBAR     │      DETAILS       │ HARGA (Rp) │ QTY │ TOTAL HARGA   │
├────┼──────────────┼────────────────────┼────────────┼─────┼───────────────┤
│ 1  │ [img][img]   │ Dimensi: ...       │ Rp 10.000.000│ 1 │ Rp 10.000.000 │
│    │              │ Bahan: ...         │            │     │               │
│ …  │              │ (multiline)        │            │     │               │
├────┴──────────────┴────────────────────┼────────────┼─────┼───────────────┤
│ *gratis ongkir Jawa & Bali             │ SUBTOTAL │ 4 │ Rp 19.650.000     │
│ ┌─────────────────────────────┐        ├──────────┴───┴───────────────────┤
│ │ PAYMENT TERMS : (blok biru)  │        │ DISCOUNT      Rp 4.650.000 (merah)│
│ │ - Termin 1 : DP 50% di awal  │        │ DP 1          Rp 7.500.000 (merah)│
│ │ - Termin 2 : Pelunasan ...   │        │ GRAND TOTAL   Rp 7.500.000 (bold) │
│ │ BCA a.n. CV Karya Logam ...  │        └───────────────────────────────────┘
│ │ 2471082360                   │
│ └─────────────────────────────┘
├───────────────────────────────────────────────────────────────────────────┤
│ [bar gradasi abu→gelap di paling bawah]                                    │
└───────────────────────────────────────────────────────────────────────────┘
```

Catatan format:
- Judul header: `INVOICE <namaCustomer>` (label bisa "INVOICE"/"QUOTATION" tergantung dokumen — lihat §7).
- Angka rupiah: `Rp` rata kiri, nominal rata kanan, ribuan pakai titik, tanpa desimal.
- DISCOUNT & baris DP nominalnya **merah**; GRAND TOTAL **bold hitam**.
- Gambar per item bisa **lebih dari satu** (contoh: foto produk + foto marmer).
- Catatan ongkir (`*gratis ongkir Jawa & Bali`) tampil di kiri-bawah area item.
- Blok PAYMENT TERMS: background biru, teks putih, berisi terms + info rekening.
- Bila item > 1 halaman, tabel lanjut ke halaman berikutnya (header tabel diulang).

## 4. Data Model (koleksi baru)

### `Quotation` (header + item embedded)
```js
{
  id,                      // string = _id.toString() (pola insertWithIdField)
  kodeInvoice,             // manual, mis. "Mila/26/VI/01"
  docLabel,                // 'INVOICE' | 'QUOTATION' (judul header PDF; default 'QUOTATION')
  customer,                // nama
  customerAddress,
  customerEmail,
  customerWA,
  tanggal,                 // manual (ISO / yyyy-mm-dd)
  deadline,                // manual, free text (mis. "3-4 weeks after payment")
  rev,                     // number, auto (mulai 1)
  status,                  // 'quote' | 'deal' | 'lost'
  items: [
    {
      no,                  // urutan (auto dari index+1)
      images: [ "/uploads/quotation/<file>.jpg", ... ],  // 0..n
      details,             // multiline text
      harga,               // number (harga satuan)
      qty,                 // number
      costing: {           // 9 kategori sistem; angka, boleh 0/absen
        Stainless, Besi, Kayu, Jok, Rotan, Finishing, Marmer, Fiber, Veneer
      }
    }
  ],
  discount,                // number
  paymentRows: [ { label, amount } ],   // mis. {label:"DP 1", amount:7500000}
  grandTotal,              // number, manual (nominal jatuh tempo dokumen ini)
  hideTotals,              // bool — mode pricelist (sembunyikan SUBTOTAL & GRAND TOTAL)
  termsTemplateId,         // ref QuotationTermsTemplate.id
  ongkirNote,              // 'gratis_jawa_bali' | 'belum_termasuk' | 'none'
  campaignId,              // atribusi CRM (opsional)
  isRepeatOrder,           // bool
  repeatRefCampaignId,     // ref campaign asal (bila repeat)
  invoiceId,               // terisi saat convert → Invoice (null sebelum Deal)
  crmLeadId,               // ref CRMLeads.id
  created_at
}
```

### `QuotationTermsTemplate`
```js
{ id, nama, isiTerms /* multiline */, bankInfo /* multiline, mis. "BCA a.n. CV Karya Logam Furindo\n2471082360" */ }
```
Seed awal 1 template default (Termin 1 DP 50% / Termin 2 pelunasan sebelum kirim + rekening BCA di contoh).

## 5. Endpoint Backend (`routes/quotation/quotation.js`, daftarkan di `server.js`)

Ikuti pola native MongoClient (connect → query → `finally close()`), `insertWithIdField`, `normalizeId`.

```
GET    /quotation/get                 # list semua quote (untuk tabel)
GET    /quotation/:id                  # detail 1 quote
POST   /quotation/create               # buat quote (multipart utk gambar) → sync CRM lead
PUT    /quotation/update/:id           # update; rev += 1; re-sync CRM lead
DELETE /quotation/delete/:id           # hapus quote + hapus CRM lead terkait
POST   /quotation/:id/status           # ubah status: quote|deal|lost (lihat §6)
GET    /quotation/:id/pdf?mode=quote|pricelist   # puppeteer → PDF (mirror spkPdf.js)

# Terms templates
GET    /quotation/terms/get
POST   /quotation/terms/create
PUT    /quotation/terms/update/:id
DELETE /quotation/terms/delete/:id
```

Upload gambar: Multer → `public/uploads/quotation/...`, kompres `sharp` (pola sama seperti
`invoiceproduct/create`). PDF puppeteer memuat gambar via base URL server sendiri (lihat pola `spkPdf.js`).

## 6. Alur Status & Sinkronisasi CRM

Perhitungan nilai memakai `utils/crmSync.js` (`computeInvoiceFinancials`) agar konsisten.
Untuk quote yang belum jadi invoice, hitung `deal_value`/`gross_profit` langsung dari data quote
(harga, qty, costing→HPP, discount) memakai formula yang sama.

### Buat Quote (`POST /create`)
- Simpan `Quotation` (status `quote`).
- Buat `CRMLeads`: `stage='quotation'`, `nama=customer`, `wa=customerWA`,
  `deal_value = Σ(harga×qty) − discount`, `gross_profit` dari costing,
  `campaign_id`, `is_repeat_order`, `repeat_ref_campaign_id`, `source`
  (`campaign`/`organic`/`repeat`), `tanggal_masuk = tanggal`. Simpan `crmLeadId` di quote.

### Update Quote (`PUT /update/:id`)
- `rev += 1`. Update lead terkait (`deal_value`, `gross_profit`, dll).
- Bila sudah punya `invoiceId` (sudah Deal), update juga Invoice + Projects terkait
  lalu panggil `syncInvoiceToCRM`.

### Status → Deal (`POST /:id/status` body `{status:'deal'}`)
1. Update quote `status='deal'`.
2. **Convert** (idempoten — cek `invoiceId` null):
   - Buat record `Invoice` (reuse logic `POST /invoice/create` — jurnal Piutang 1130 / Penjualan 4100 otomatis).
     Field: `kodeInvoice`, `customer`, `tanggalMulaiInvoice=tanggal`, `deadlineInvoice=deadline`,
     `discountInvoice=discount`, `crmCampaignId`, `is_repeat_order`, `repeat_ref_campaign_id`.
   - Untuk tiap item quote → buat `Projects` (pola `invoiceproduct/create`):
     `KodeInvoice`, `Harga`, `Qty`, `NamaBarang`/`Spesifikasi`=details, gambar,
     dan `estimasi<Category>` = `costing[<Category>]` (budget/biaya sementara).
   - Simpan `invoiceId` di quote.
3. **Link lead** existing (`crmLeadId`) ke invoice: set `invoice_id`, `kode_invoice`, `stage='deal'`
   → panggil `syncInvoiceToCRM` (tidak membuat lead kedua). *Anti dobel-lead.*

### Status → Lost (`{status:'lost'}`)
- Quote `status='lost'`; lead `stage='lost'`.
- Bila sudah terlanjur jadi Invoice: beri konfirmasi di UI (invoice tidak otomatis dihapus).

### Hapus Quote (`DELETE /delete/:id`)
- Hapus `Quotation` + hapus `CRMLeads` (by `crmLeadId`).
- Bila sudah punya `invoiceId`: konfirmasi dulu — hapus quote **tidak** menghapus Invoice/Projects/Jurnal.

## 7. Frontend (`src/Components/Quote/Quote.jsx`, route `/quote`)

### Navigasi & akses
- Tambah menu **Quote** di `NavigationBar.jsx` grup Operations.
- User Management: checkbox akses menu key `"Quote"` (pola `getCheckboxState`).

### Tampilan daftar (tabel)
Kolom: **No | Kode | Customer | Nilai Quote | Rev | Status (badge Quote/Deal/Lost) | Aksi
(Edit / Download PDF / Ubah Status / Hapus)**. Search by kode/customer. Badge warna:
Quote=abu, Deal=hijau, Lost=merah.

### Form buat/edit (HP-first responsive, inline-style sesuai konvensi komponen baru)
- **Header**: kode (manual), docLabel (Quotation/Invoice), customer + kontak, tanggal, deadline,
  pilih **terms template**, pilih **catatan ongkir** (gratis Jawa&Bali / belum termasuk / none),
  toggle **sembunyikan subtotal & grand total** (mode pricelist), campaign + toggle Repeat Order.
- **Items**: daftar *card* (1 kolom di HP, multi-kolom di layar lebar). Tiap card:
  - Upload/kamera gambar (multi), details (textarea), harga (numeric), qty (numeric),
    **Costing** dalam accordion collapse (9 kategori sistem).
  - Tombol hapus item; tombol **+ Tambah Item** full-width.
- **Totals**: SUBTOTAL (auto Σ harga×qty), DISCOUNT, baris pembayaran dinamis (DP1/DP2… label+nominal),
  GRAND TOTAL (manual, default subtotal−discount).
- **Aksi sticky** di bawah: Simpan, Download PDF, (Ubah Status).
- Nilai numerik ditampilkan terformat ribuan; keyboard angka di mobile.

## 8. Non-Goals (v1)
- Tidak ada pengiriman WA/email otomatis.
- Tidak ada approval/tanda tangan digital.
- Tidak ada auto-generate nomor.
- Tidak mengubah alur Invoice.jsx yang sudah ada (hanya menambah jalur convert).

## 9. Verifikasi
- Backend: uji endpoint manual (buat quote, generate PDF, convert → cek Invoice+Projects+Jurnal+CRM lead).
- Frontend: `npm run build` wajib lolos; cek manual di browser (mode HP via devtools) + preview PDF
  dibandingkan dengan `Invoice Ny. Mila - 11 Jun 26.pdf` (harus mirip).
- CRM: pastikan tidak ada lead dobel setelah convert; status Deal/Lost/hapus tercermin di pipeline.

## 10. Risiko / Catatan
- **Konsistensi formula finansial** ada di 3 tempat kini (Invoice.jsx, crmSync.js, dan quote).
  Untuk quote, **reuse** `computeInvoiceFinancials` sebisa mungkin (kirim data quote dalam bentuk
  yang kompatibel) agar tidak ada formula ke-4.
- **Mapping costing**: label Excel (Kain, ongkir, Packing) tidak 1:1 dengan 9 kategori sistem;
  form costing memakai kategori sistem. Costing tidak tampil di PDF sehingga tak mempengaruhi output.
- **Puppeteer di VPS** butuh lib apt (sudah terpasang untuk SPK PDF); reuse `launchBrowser()` pattern.
- **PWA cache**: setelah deploy frontend, perlu hard refresh.
