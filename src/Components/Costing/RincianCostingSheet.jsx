import React, { useEffect, useMemo, useRef, useState } from 'react';
import { labelKategori } from '../../Utils/kategori';
import { getApiBaseUrl } from '../../Config/APIurl';

// ============================================================================
// RINCIAN (SUB) COSTING — popup per komponen costing (Kayu, Jok, …).
// ----------------------------------------------------------------------------
// Satu komponen boleh diisi total langsung, ATAU dirinci jadi baris
// { nama, qty, harga } → total komponen = Σ qty × harga. Dipakai di Quote
// (item.costingRincian) & Invoice (Projects.estimasiRincian).
// Chip "template" = nama rincian yang sering dipakai per komponen. Diatur DI
// LUAR popup (TemplateCostingManager, tombol ⚙️ di halaman Quote & Invoice)
// supaya popup tetap simpel. Koleksi CostingRincianTemplate, dipakai bersama.
// HP: bottom sheet; desktop: popup tengah.
// ============================================================================

const numParse = (v) => Number(String(v ?? '').replace(/[^\d-]/g, '')) || 0;
const fmt = (v) => {
  const d = String(v ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  return d ? d.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
};
const rupiah = (n) => 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID');
const qtyParse = (v) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };

/** Total satu daftar rincian (dipakai juga oleh pemanggil). */
export const totalRincian = (rows) => (rows || []).reduce((a, r) => a + qtyParse(r.qty) * numParse(r.harga), 0);

/** Normalisasi rincian untuk disimpan (angka murni, baris kosong dibuang). */
export const bersihkanRincian = (rows) => (rows || [])
  .map((r) => ({ nama: String(r.nama || '').trim(), qty: qtyParse(r.qty), harga: numParse(r.harga) }))
  .filter((r) => r.nama || r.harga);

// Cache template antar-instance (satu fetch per halaman).
let templateCache = null;
let templatePromise = null;
const loadTemplate = () => {
  if (templateCache) return Promise.resolve(templateCache);
  if (!templatePromise) {
    templatePromise = fetch(`${getApiBaseUrl()}/costing/rincian-template`)
      .then((r) => r.json())
      .then((d) => { templateCache = (d && d.items) || {}; return templateCache; })
      .catch(() => { templatePromise = null; return {}; });
  }
  return templatePromise;
};

export const warna = (dark) => ({
  card: dark ? '#1f2329' : '#fff', text: dark ? '#e8eaed' : '#1f2937', sub: dark ? '#9aa0a8' : '#6b7280',
  border: dark ? '#3a3f47' : '#e5e7eb', soft: dark ? '#2b3038' : '#f3f4f6', input: dark ? '#2b3038' : '#fff',
});
export const inpStyle = (C) => ({ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.input, color: C.text, fontSize: 16, boxSizing: 'border-box', minHeight: 44 });
export const btnStyle = (bg, fg = '#fff', extra = {}) => ({ background: bg, color: fg, border: 'none', borderRadius: 10, padding: '10px 14px', fontSize: 15, fontWeight: 600, cursor: 'pointer', minHeight: 44, ...extra });
// HP (≤640px): bottom sheet; desktop: popup tengah.
export const SHEET_CSS = `
  .klf-rc-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 2000; display: flex; align-items: center; justify-content: center; }
  .klf-rc-sheet { width: 100%; max-width: 560px; max-height: 88vh; display: flex; flex-direction: column; border-radius: 16px; overflow: hidden; }
  @media (max-width: 640px) {
    .klf-rc-overlay { align-items: flex-end; }
    .klf-rc-sheet { max-width: none; max-height: 92vh; border-radius: 18px 18px 0 0; }
  }
`;

const barisBaru = (nama = '', harga = '') => ({ key: Math.random().toString(36).slice(2), nama, qty: '1', harga: fmt(harga) });

/**
 * Props:
 *  open, category, dark
 *  total      — nilai total komponen sekarang (angka)
 *  rincian    — array {nama, qty, harga} tersimpan
 *  subtitle   — teks kecil di bawah judul (opsional, mis. nama produk)
 *  readOnly   — hanya lihat (mis. kategori sudah ada SPK)
 *  onSave({ total, rincian }) — rincian [] = tanpa rincian (total langsung)
 *  onClose()
 */
const RincianCostingSheet = ({ open, category, dark, total, rincian, subtitle, readOnly, onSave, onClose }) => {
  const [rows, setRows] = useState([]);
  const [totalLangsung, setTotalLangsung] = useState('');
  const [tpl, setTpl] = useState({});
  const lastRowRef = useRef(null);
  const focusLast = useRef(false);

  useEffect(() => {
    if (!open) return;
    setRows((rincian || []).map((r) => ({ key: Math.random().toString(36).slice(2), nama: r.nama || '', qty: String(r.qty ?? 1), harga: fmt(r.harga) })));
    setTotalLangsung(fmt(total));
    loadTemplate().then(setTpl);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (focusLast.current && lastRowRef.current) { lastRowRef.current.focus(); focusLast.current = false; }
  }, [rows.length]);

  const sumRows = useMemo(() => totalRincian(rows), [rows]);
  const pakaiRincian = rows.length > 0;
  const nilaiAkhir = pakaiRincian ? sumRows : numParse(totalLangsung);
  const chips = tpl[category] || [];

  if (!open) return null;

  const C = warna(dark);
  const inp = inpStyle(C);
  const btn = btnStyle;

  const tambah = (nama = '', harga = '') => {
    // Pindah dari total langsung ke rincian: total lama jadi baris pertama supaya tidak hilang.
    const awal = !rows.length && numParse(totalLangsung) > 0 && !nama ? [barisBaru('Biaya ' + category, totalLangsung)] : [];
    focusLast.current = !nama;
    setRows((r) => [...r, ...awal, barisBaru(nama, harga)]);
  };
  const ubah = (key, patch) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const hapus = (key) => setRows((r) => r.filter((x) => x.key !== key));

  const simpan = () => {
    const bersih = bersihkanRincian(rows);
    onSave({ total: bersih.length ? totalRincian(bersih) : numParse(totalLangsung), rincian: bersih });
  };

  return (
    <div className="klf-rc-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <style>{SHEET_CSS + `
        .klf-rc-row { display: grid; grid-template-columns: 1fr 64px 130px 40px; gap: 6px; align-items: center; }
        @media (max-width: 640px) {
          .klf-rc-row { grid-template-columns: 64px 1fr 40px; }
          .klf-rc-row .klf-rc-nama { grid-column: 1 / -1; }
        }
      `}</style>
      <div className="klf-rc-sheet" style={{ background: C.card, color: C.text }}>
        {/* header */}
        <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: C.border, margin: '-4px auto 10px' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: C.sub }}>Costing{subtitle ? ` · ${subtitle}` : ''}</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{labelKategori(category)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: C.sub }}>Total / unit</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1e40af' }}>{rupiah(nilaiAkhir)}</div>
            </div>
            <button type="button" aria-label="Tutup" onClick={onClose} style={{ ...btn('transparent', C.sub), minHeight: 36, padding: '2px 8px', fontSize: 22 }}>×</button>
          </div>
        </div>

        {/* isi */}
        <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
          {readOnly && <div style={{ fontSize: 13, color: '#b45309', background: dark ? '#3a2e12' : '#fef3c7', borderRadius: 8, padding: '8px 10px', marginBottom: 12 }}>Komponen ini sudah memakai nilai SPK — rincian estimasi hanya untuk dilihat.</div>}

          {!pakaiRincian && (
            <>
              <label style={{ fontSize: 13, color: C.sub }}>Total langsung</label>
              <input autoFocus={!readOnly} disabled={readOnly} inputMode="numeric" style={{ ...inp, fontSize: 18, fontWeight: 600 }} value={totalLangsung} placeholder="0"
                onChange={(e) => setTotalLangsung(fmt(e.target.value))}
                onKeyDown={(e) => { if (e.key === 'Enter') simpan(); }} />
              <div style={{ fontSize: 12, color: C.sub, margin: '6px 0 14px' }}>Atau rinci jadi beberapa sub costing di bawah — total dihitung otomatis.</div>
            </>
          )}

          {pakaiRincian && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              <div className="klf-rc-row" style={{ fontSize: 11, color: C.sub, fontWeight: 600 }}>
                <span className="klf-rc-nama">Rincian</span><span>Qty</span><span>Harga satuan</span><span />
              </div>
              {rows.map((r, i) => (
                <div key={r.key} style={{ background: C.soft, borderRadius: 12, padding: 8 }}>
                  <div className="klf-rc-row">
                    <input className="klf-rc-nama" ref={i === rows.length - 1 ? lastRowRef : null} disabled={readOnly} style={inp} value={r.nama} placeholder="mis. Kain, Busa, Ongkos jahit"
                      onChange={(e) => ubah(r.key, { nama: e.target.value })} />
                    <input disabled={readOnly} inputMode="decimal" style={{ ...inp, textAlign: 'center', padding: '10px 4px' }} value={r.qty}
                      onChange={(e) => ubah(r.key, { qty: e.target.value.replace(/[^\d.,]/g, '') })} />
                    <input disabled={readOnly} inputMode="numeric" style={inp} value={r.harga} placeholder="0"
                      onChange={(e) => ubah(r.key, { harga: fmt(e.target.value) })} />
                    {!readOnly
                      ? <button type="button" aria-label="Hapus baris" onClick={() => hapus(r.key)} style={{ ...btn('transparent', '#dc2626'), padding: 0, minHeight: 40, fontSize: 18 }}>🗑</button>
                      : <span />}
                  </div>
                  {qtyParse(r.qty) !== 1 && (
                    <div style={{ fontSize: 12, color: C.sub, textAlign: 'right', marginTop: 4 }}>= {rupiah(qtyParse(r.qty) * numParse(r.harga))}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!readOnly && (
            <>
              <button type="button" onClick={() => tambah()} style={{ ...btn('transparent', '#2563eb'), width: '100%', border: '2px dashed #2563eb' }}>+ Tambah sub costing</button>

              {/* template chip (diatur di luar: ⚙️ Template Costing di halaman Quote & Invoice) */}
              <div style={{ fontSize: 13, color: C.sub, fontWeight: 600, margin: '16px 0 8px' }}>Template {labelKategori(category)}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {!chips.length && <div style={{ fontSize: 12, color: C.sub }}>Belum ada template. Atur lewat tombol ⚙️ Template Costing di halaman Quote &amp; Invoice.</div>}
                {chips.map((c) => (
                  <button key={c.nama} type="button" onClick={() => tambah(c.nama, c.harga || '')}
                    style={{ ...btn(C.soft, C.text), minHeight: 38, padding: '6px 12px', fontSize: 14, fontWeight: 500, border: `1px solid ${C.border}` }}>
                    + {c.nama}{c.harga ? <span style={{ color: C.sub }}> · {rupiah(c.harga)}</span> : null}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* footer */}
        <div style={{ padding: '12px 16px calc(12px + env(safe-area-inset-bottom))', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8 }}>
          <button type="button" style={btn(C.soft, C.text, { flex: 1 })} onClick={onClose}>{readOnly ? 'Tutup' : 'Batal'}</button>
          {!readOnly && <button type="button" style={btn('#1e40af', '#fff', { flex: 2 })} onClick={simpan}>Simpan · {rupiah(nilaiAkhir)}</button>}
        </div>
      </div>
    </div>
  );
};

export default RincianCostingSheet;

// ============================================================================
// KELOLA TEMPLATE COSTING — di luar popup (tombol ⚙️ di halaman Quote & Invoice).
// Pilih komponen → daftar rincian (nama + harga default) → tambah/ubah/hapus.
// ============================================================================
const CATEGORIES = ['Besi', 'Kayu', 'Jok', 'Rotan', 'Finishing', 'Marmer', 'Kaca', 'Fiber', 'Veneer'];

export const TemplateCostingManager = ({ open, dark, onClose }) => {
  const [tpl, setTpl] = useState({});
  const [cat, setCat] = useState(CATEGORIES[0]);
  const [rows, setRows] = useState([]);
  const [baru, setBaru] = useState({ nama: '', harga: '' });
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!open) return;
    templateCache = null; templatePromise = null;   // ambil terbaru
    loadTemplate().then(setTpl);
  }, [open]);

  useEffect(() => {
    setRows((tpl[cat] || []).map((x) => ({ key: Math.random().toString(36).slice(2), nama: x.nama, harga: fmt(x.harga) })));
    setBaru({ nama: '', harga: '' });
  }, [cat, tpl]);

  if (!open) return null;
  const C = warna(dark);
  const inp = inpStyle(C);
  const btn = btnStyle;

  const simpan = async (list) => {
    const items = list.map((r) => ({ nama: String(r.nama || '').trim(), harga: numParse(r.harga) })).filter((r) => r.nama);
    setStatus('Menyimpan…');
    try {
      const r = await fetch(`${getApiBaseUrl()}/costing/rincian-template`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat, items }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Gagal simpan');
      const next = { ...tpl, [cat]: d.items };
      templateCache = next;
      setTpl(next);
      setStatus('✓ Tersimpan');
    } catch (e) {
      setStatus('Gagal: ' + e.message);
    }
    setTimeout(() => setStatus(''), 2000);
  };
  const tambah = () => {
    const n = baru.nama.trim();
    if (!n) return;
    if (rows.some((r) => r.nama.trim().toLowerCase() === n.toLowerCase())) return setStatus('Nama sudah ada');
    simpan([...rows, { nama: n, harga: baru.harga }]);
  };

  return (
    <div className="klf-rc-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <style>{SHEET_CSS}</style>
      <div className="klf-rc-sheet" style={{ background: C.card, color: C.text }}>
        <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: C.border, margin: '-4px auto 10px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>Template Costing</div>
              <div style={{ fontSize: 12, color: C.sub }}>Rincian yang sering dipakai — muncul sebagai pilihan cepat di popup costing.</div>
            </div>
            <button type="button" aria-label="Tutup" onClick={onClose} style={{ ...btn('transparent', C.sub), minHeight: 36, padding: '2px 8px', fontSize: 22 }}>×</button>
          </div>
          {/* pilih komponen */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginTop: 10, paddingBottom: 2 }}>
            {CATEGORIES.map((c) => {
              const on = c === cat;
              const n = (tpl[c] || []).length;
              return (
                <button key={c} type="button" onClick={() => setCat(c)}
                  style={{ ...btn(on ? '#1e40af' : C.soft, on ? '#fff' : C.text), minHeight: 38, padding: '6px 12px', fontSize: 14, whiteSpace: 'nowrap', flex: '0 0 auto' }}>
                  {labelKategori(c)}{n ? <span style={{ opacity: 0.75 }}> · {n}</span> : null}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
          {!rows.length && <div style={{ fontSize: 13, color: C.sub, marginBottom: 10 }}>Belum ada template untuk {labelKategori(cat)}.</div>}
          {rows.map((r) => (
            <div key={r.key} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
              <input style={{ ...inp, flex: 2 }} value={r.nama}
                onChange={(e) => setRows((x) => x.map((y) => (y.key === r.key ? { ...y, nama: e.target.value } : y)))}
                onBlur={() => simpan(rows)} />
              <input style={{ ...inp, flex: 1, minWidth: 0 }} inputMode="numeric" placeholder="Harga" value={r.harga}
                onChange={(e) => setRows((x) => x.map((y) => (y.key === r.key ? { ...y, harga: fmt(e.target.value) } : y)))}
                onBlur={() => simpan(rows)} />
              <button type="button" aria-label="Hapus" onClick={() => simpan(rows.filter((y) => y.key !== r.key))}
                style={{ ...btn('transparent', '#dc2626'), padding: '0 6px', fontSize: 18 }}>🗑</button>
            </div>
          ))}

          <div style={{ background: C.soft, borderRadius: 12, padding: 10, marginTop: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 6 }}>+ Tambah rincian {labelKategori(cat)}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <input style={{ ...inp, flex: '2 1 160px' }} placeholder="mis. Kain, Busa, Ongkos jahit" value={baru.nama}
                onChange={(e) => setBaru({ ...baru, nama: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') tambah(); }} />
              <input style={{ ...inp, flex: '1 1 110px' }} inputMode="numeric" placeholder="Harga default (opsional)" value={baru.harga}
                onChange={(e) => setBaru({ ...baru, harga: fmt(e.target.value) })} onKeyDown={(e) => { if (e.key === 'Enter') tambah(); }} />
              <button type="button" style={btn('#1e40af', '#fff', { flex: '1 1 90px' })} onClick={tambah}>Tambah</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '12px 16px calc(12px + env(safe-area-inset-bottom))', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, fontSize: 13, color: status.startsWith('Gagal') ? '#dc2626' : C.sub }}>{status || 'Perubahan tersimpan otomatis.'}</div>
          <button type="button" style={btn(C.soft, C.text, { minWidth: 110 })} onClick={onClose}>Selesai</button>
        </div>
      </div>
    </div>
  );
};
