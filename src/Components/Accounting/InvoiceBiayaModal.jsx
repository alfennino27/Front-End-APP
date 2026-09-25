import React, { useMemo, useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { Image } from 'antd';
import { getImageUrl } from '../../Utils/image';
import { getApiBaseUrl } from '../../Config/APIurl';
import {
  HPP_CATEGORIES,
  hitungHPPKategori,
  hitungHPPProduct,
  hitungFinansialInvoice,
} from '../../Utils/invoiceFinancial';
import { persenGrossProfit } from '../../Utils/labaRugiReport';

// Popup rincian biaya (HPP) satu invoice — dibuka dari tabel Penjualan di
// Laba Rugi Penjualan / Profit. Tujuannya mengisi estimasi biaya kategori yang
// terlewat dari SPK. Aturan:
//  - kategori yang sudah punya SPK (Σ harga SPKproduct > 0) → dikunci, ubah lewat SPK
//  - kategori tanpa SPK → estimasi bisa diisi/diubah
// Simpan → PUT /invoiceproduct/estimasi (flag hanyaTanpaSPK, server menolak
// kategori ber-SPK) yang juga memicu sync CRM. Parent memperbarui dataProject
// lewat onEstimasiSaved → tabel, total & Keuntungan Penjualan langsung ikut;
// halaman Invoice/Evaluasi Estimasi ikut karena membaca Projects yang sama.

const rupiah = (n) => `Rp. ${Math.round(Number(n || 0)).toLocaleString('id-ID')}`;
const angka = (str) => Number(String(str ?? '').replace(/[^\d]/g, '')) || 0;
// Foto produk pertama yang ada (image1, image2, …) untuk thumbnail.
const fotoProduk = (p) => {
  for (let i = 1; i <= 10; i++) if (p[`image${i}`]) return p[`image${i}`];
  return null;
};
const formatInput = (n) => (n ? Number(n).toLocaleString('id-ID') : '');

const InvoiceBiayaModal = ({
  invoice,
  dataProject,
  dataSPKProduct,
  dataInvoicePengeluaran,
  spkTenagaIds,
  onHide,
  onEstimasiSaved,
}) => {
  // draft[productId][cat] = string input yang sedang diketik (belum disimpan)
  const [draft, setDraft] = useState({});
  const [semuaKategori, setSemuaKategori] = useState({}); // productId → bool
  const [saving, setSaving] = useState(null); // productId yang sedang disimpan
  const [pesan, setPesan] = useState({}); // productId → { tipe, teks }

  useEffect(() => {
    setDraft({});
    setSemuaKategori({});
    setPesan({});
  }, [invoice?.id]);

  const projects = useMemo(
    () => (invoice ? dataProject.filter((p) => p.idInvoice === invoice.id) : []),
    [invoice, dataProject]
  );
  const spkRows = useMemo(() => {
    const ids = new Set(projects.map((p) => p.id));
    return dataSPKProduct.filter((s) => ids.has(s.idProduct));
  }, [projects, dataSPKProduct]);
  const pengeluaran = useMemo(
    () => (invoice ? dataInvoicePengeluaran.filter((x) => x.idInvoice === invoice.id) : []),
    [invoice, dataInvoicePengeluaran]
  );

  const fin = useMemo(
    () => (invoice ? hitungFinansialInvoice(invoice, projects, spkRows, pengeluaran, spkTenagaIds) : null),
    [invoice, projects, spkRows, pengeluaran, spkTenagaIds]
  );

  const infoKategori = (p, cat) => {
    const rows = spkRows.filter((s) => s.idProduct === p.id && s.category === cat);
    const spkTotal = rows.reduce((sum, s) => sum + (Number(s.harga) || 0), 0);
    const estimasi = Number(p[`estimasi${cat}`] || 0);
    const dipakai = hitungHPPKategori(p, spkRows, cat, spkTenagaIds);
    // Kategori dianggap "dipakai" project ini kalau ada jejak apa pun di datanya.
    const aktif =
      spkTotal > 0 || estimasi > 0 || rows.length > 0 ||
      p[`${cat}Reminder`] || p[`Supplier${cat}`] || p[`CategoryStatus${cat}`] || p[`SPK${cat}`];
    return { spkTotal, estimasi, dipakai, terkunci: spkTotal > 0, aktif: !!aktif };
  };

  const ubahDraft = (pid, cat, val) =>
    setDraft((d) => ({ ...d, [pid]: { ...(d[pid] || {}), [cat]: val } }));

  const perubahan = (p) =>
    Object.entries(draft[p.id] || {}).filter(
      ([cat, val]) => angka(val) !== Number(p[`estimasi${cat}`] || 0)
    );

  const simpan = async (p) => {
    const list = perubahan(p);
    if (!list.length) return;
    setSaving(p.id);
    setPesan((m) => ({ ...m, [p.id]: null }));
    try {
      for (const [cat, val] of list) {
        const res = await fetch(`${getApiBaseUrl()}/invoiceproduct/estimasi`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idProduct: p.id, category: cat, value: angka(val), hanyaTanpaSPK: true }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || `Gagal menyimpan ${cat}`);
        onEstimasiSaved?.(p.id, cat, angka(val));
      }
      setDraft((d) => ({ ...d, [p.id]: {} }));
      setPesan((m) => ({ ...m, [p.id]: { tipe: 'ok', teks: 'Estimasi tersimpan.' } }));
    } catch (err) {
      setPesan((m) => ({ ...m, [p.id]: { tipe: 'err', teks: err.message } }));
    } finally {
      setSaving(null);
    }
  };

  const tutup = () => {
    const adaDraft = projects.some((p) => perubahan(p).length);
    if (adaDraft && !window.confirm('Ada estimasi yang belum disimpan. Tutup tanpa menyimpan?')) return;
    onHide();
  };

  const s = {
    ringkasan: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, marginBottom: 14 },
    kotak: { background: '#F4F6FF', border: '1px solid #DCE1FF', borderRadius: 10, padding: '8px 12px' },
    kotakLabel: { fontSize: 11, color: '#666' },
    kotakNilai: { fontSize: 15, fontWeight: 600, color: '#1a1a1a', wordBreak: 'break-word' },
    kartu: { border: '1px solid #e3e3e3', borderRadius: 10, padding: '10px 12px', marginBottom: 10, background: '#fff' },
    judulProduk: { fontSize: 14, fontWeight: 600, wordBreak: 'break-word' },
    meta: { fontSize: 12, color: '#777', marginTop: 2 },
    baris: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: '1px solid #f0f0f0' },
    namaKat: { flex: '0 0 78px', fontSize: 13 },
    badge: (warna) => ({ fontSize: 10, borderRadius: 6, padding: '1px 6px', background: warna.bg, color: warna.fg, whiteSpace: 'nowrap' }),
    nilaiKunci: { flex: 1, textAlign: 'right', fontSize: 13, color: '#555' },
    input: (berubah) => ({
      flex: 1, minWidth: 0, textAlign: 'right', fontSize: 14, padding: '6px 8px', borderRadius: 8,
      border: `1px solid ${berubah ? 'blue' : '#ccc'}`, background: berubah ? '#F4F6FF' : '#fff',
    }),
    tombolLink: { border: 'none', background: 'none', color: 'blue', fontSize: 12, padding: '6px 0' },
    tombolSimpan: { background: 'blue', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 14, width: '100%', marginTop: 8 },
    pesan: (tipe) => ({ fontSize: 13, borderRadius: 8, padding: '6px 10px', marginTop: 8, background: tipe === 'ok' ? '#E8F7EE' : '#FDECEC', color: tipe === 'ok' ? '#1e7a3e' : '#b3261e' }),
    lainBaris: { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' },
  };

  const BADGE = {
    spk: { bg: '#E8F7EE', fg: '#1e7a3e' },
    est: { bg: '#FFF4E0', fg: '#9a5b00' },
    kosong: { bg: '#FDECEC', fg: '#b3261e' },
  };

  if (!invoice || !fin) return null;

  const biayaLain = [
    ['Ongkir customer (+)', Number(invoice.ongkirCustInvoice) || 0],
    ['Ongkir packing (−)', Number(invoice.ongkirPackingInvoice) || 0],
    ['Admin (−)', Number(invoice.adminInvoice) || 0],
    ['Diskon (−)', Number(invoice.discountInvoice) || 0],
    ['Pengeluaran lain invoice (−)', fin.pengeluaranLain],
  ].filter(([, v]) => v);

  return (
    <Modal show={!!invoice} onHide={tutup} centered scrollable fullscreen="sm-down" size="lg">
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: 17 }}>
          {invoice.kodeInvoice}
          <div style={{ fontSize: 13, fontWeight: 400, color: '#666' }}>
            {invoice.customer ? `${invoice.customer} · ` : ''}
            {new Date(invoice.tanggalMulaiInvoice).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ background: '#FAFAFA' }}>
        <div style={s.ringkasan}>
          <div style={s.kotak}>
            <div style={s.kotakLabel}>Nominal</div>
            <div style={s.kotakNilai}>{rupiah(fin.totalPenjualan)}</div>
          </div>
          <div style={s.kotak}>
            <div style={s.kotakLabel}>Total HPP</div>
            <div style={s.kotakNilai}>{rupiah(fin.totalHPP)}</div>
          </div>
          <div style={s.kotak}>
            <div style={s.kotakLabel}>Gross Profit</div>
            <div style={{ ...s.kotakNilai, color: 'blue' }}>
              {rupiah(fin.totalGrossProfit)}{' '}
              <span style={{ fontSize: 12, fontWeight: 400, color: '#666' }}>
                ({persenGrossProfit(fin.totalGrossProfit, fin.totalPenjualan)})
              </span>
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
          Biaya per unit. Kategori ber-SPK <span style={s.badge(BADGE.spk)}>SPK 🔒</span> dikunci (ubah lewat SPK);
          yang lain bisa diisi estimasinya.
        </div>

        {projects.length === 0 && (
          <div className="text-center text-muted py-4" style={{ fontSize: 14 }}>Invoice ini belum punya produk.</div>
        )}

        {projects.map((p) => {
          const tampilSemua = !!semuaKategori[p.id];
          const semua = HPP_CATEGORIES.map((cat) => ({ cat, ...infoKategori(p, cat) }));
          const kategori = tampilSemua ? semua : semua.filter((k) => k.aktif);
          const tersembunyi = semua.length - semua.filter((k) => k.aktif).length;
          const hppUnit = hitungHPPProduct(p, spkRows, spkTenagaIds);
          const qty = Number(p.Qty) || 0;
          const harga = Number(p.Harga) || 0;
          const jmlUbah = perubahan(p).length;

          return (
            <div key={p.id} style={s.kartu}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                {fotoProduk(p) ? (
                  <Image
                    src={getImageUrl(fotoProduk(p))}
                    width={56}
                    height={56}
                    style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }}
                  />
                ) : (
                  <div style={{ width: 56, height: 56, flexShrink: 0, borderRadius: 8, background: '#f1f1f1', color: '#aaa', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    tanpa foto
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={s.judulProduk}>{p.NamaBarang || '(tanpa nama)'}</div>
                  <div style={s.meta}>
                    {qty} × {rupiah(harga)} · HPP/unit {rupiah(hppUnit)} · GP {rupiah((harga - hppUnit) * qty)}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                {kategori.length === 0 && (
                  <div style={{ fontSize: 12, color: '#b3261e', padding: '6px 0' }}>
                    Belum ada kategori biaya sama sekali — tampilkan semua kategori untuk mengisi.
                  </div>
                )}
                {kategori.map(({ cat, spkTotal, estimasi, dipakai, terkunci }) => {
                  const val = draft[p.id]?.[cat];
                  const berubah = val !== undefined && angka(val) !== estimasi;
                  return (
                    <div key={cat} style={s.baris}>
                      <div style={s.namaKat}>
                        {cat}
                        <div>
                          {terkunci ? (
                            <span style={s.badge(BADGE.spk)}>SPK 🔒</span>
                          ) : estimasi > 0 ? (
                            <span style={s.badge(BADGE.est)}>Estimasi</span>
                          ) : (
                            <span style={s.badge(BADGE.kosong)}>Kosong</span>
                          )}
                        </div>
                      </div>
                      {terkunci ? (
                        <div style={s.nilaiKunci}>
                          {rupiah(spkTotal)}
                          {dipakai !== spkTotal && (
                            <div style={{ fontSize: 11, color: '#9a5b00' }}>dipakai estimasi {rupiah(dipakai)} (borong tenaga)</div>
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          style={s.input(berubah)}
                          disabled={saving === p.id}
                          value={val !== undefined ? formatInput(angka(val)) : formatInput(estimasi)}
                          onChange={(ev) => ubahDraft(p.id, cat, ev.target.value)}
                          onKeyDown={(ev) => { if (ev.key === 'Enter') simpan(p); }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {tersembunyi > 0 && (
                <button type="button" style={s.tombolLink} onClick={() => setSemuaKategori((m) => ({ ...m, [p.id]: !tampilSemua }))}>
                  {tampilSemua ? '− Sembunyikan kategori kosong' : `+ Kategori lain (${tersembunyi})`}
                </button>
              )}

              {jmlUbah > 0 && (
                <button type="button" style={{ ...s.tombolSimpan, opacity: saving === p.id ? 0.6 : 1 }} disabled={saving === p.id} onClick={() => simpan(p)}>
                  {saving === p.id ? 'Menyimpan…' : `Simpan ${jmlUbah} perubahan`}
                </button>
              )}
              {pesan[p.id] && <div style={s.pesan(pesan[p.id].tipe)}>{pesan[p.id].teks}</div>}
            </div>
          );
        })}

        {biayaLain.length > 0 && (
          <div style={s.kartu}>
            <div style={{ ...s.judulProduk, marginBottom: 4 }}>Komponen lain invoice</div>
            {biayaLain.map(([label, v]) => (
              <div key={label} style={s.lainBaris}>
                <span style={{ color: '#555' }}>{label}</span>
                <span>{rupiah(v)}</span>
              </div>
            ))}
            <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Diubah lewat halaman Invoice.</div>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default InvoiceBiayaModal;
