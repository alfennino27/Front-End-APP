import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getApiBaseUrl } from '../../Config/APIurl';

// ============================================================================
// RINCIAN (SUB) COSTING — popup per komponen costing (Kayu, Jok, …).
// ----------------------------------------------------------------------------
// Satu komponen boleh diisi total langsung, ATAU dirinci jadi baris
// { nama, qty, harga } → total komponen = Σ qty × harga. Dipakai di Quote
// (item.costingRincian) & Invoice (Projects.estimasiRincian).
// Chip "template" = nama rincian yang sering dipakai per komponen, bisa
// ditambah/dihapus sendiri (koleksi CostingRincianTemplate, dipakai bersama).
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
  const [aturTpl, setAturTpl] = useState(false);
  const [tplBaru, setTplBaru] = useState({ nama: '', harga: '' });
  const [savingTpl, setSavingTpl] = useState(false);
  const lastRowRef = useRef(null);
  const focusLast = useRef(false);

  useEffect(() => {
    if (!open) return;
    setRows((rincian || []).map((r) => ({ key: Math.random().toString(36).slice(2), nama: r.nama || '', qty: String(r.qty ?? 1), harga: fmt(r.harga) })));
    setTotalLangsung(fmt(total));
    setAturTpl(false);
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

  const C = {
    card: dark ? '#1f2329' : '#fff', text: dark ? '#e8eaed' : '#1f2937', sub: dark ? '#9aa0a8' : '#6b7280',
    border: dark ? '#3a3f47' : '#e5e7eb', soft: dark ? '#2b3038' : '#f3f4f6', input: dark ? '#2b3038' : '#fff',
  };
  const inp = { width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.input, color: C.text, fontSize: 16, boxSizing: 'border-box', minHeight: 44 };
  const btn = (bg, fg = '#fff', extra = {}) => ({ background: bg, color: fg, border: 'none', borderRadius: 10, padding: '10px 14px', fontSize: 15, fontWeight: 600, cursor: 'pointer', minHeight: 44, ...extra });

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

  const simpanTpl = async (list) => {
    const next = { ...tpl, [category]: list };
    setTpl(next);
    templateCache = next;
    setSavingTpl(true);
    try {
      await fetch(`${getApiBaseUrl()}/costing/rincian-template`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, items: list }),
      });
    } catch { /* abaikan, cache lokal tetap */ } finally { setSavingTpl(false); }
  };
  const tambahTpl = (nama, harga) => {
    const n = String(nama || '').trim();
    if (!n || chips.some((c) => c.nama.toLowerCase() === n.toLowerCase())) return;
    simpanTpl([...chips, { nama: n, harga: numParse(harga) }]);
  };

  return (
    <div className="klf-rc-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <style>{`
        .klf-rc-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 2000; display: flex; align-items: center; justify-content: center; }
        .klf-rc-sheet { width: 100%; max-width: 560px; max-height: 88vh; display: flex; flex-direction: column; border-radius: 16px; overflow: hidden; }
        .klf-rc-row { display: grid; grid-template-columns: 1fr 64px 130px 40px; gap: 6px; align-items: center; }
        @media (max-width: 640px) {
          .klf-rc-overlay { align-items: flex-end; }
          .klf-rc-sheet { max-width: none; max-height: 92vh; border-radius: 18px 18px 0 0; }
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
              <div style={{ fontSize: 20, fontWeight: 700 }}>{category}</div>
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

              {/* template chip */}
              <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0 8px' }}>
                <div style={{ flex: 1, fontSize: 13, color: C.sub, fontWeight: 600 }}>Template {category}{savingTpl ? ' · menyimpan…' : ''}</div>
                <button type="button" onClick={() => setAturTpl((v) => !v)} style={{ ...btn('transparent', '#2563eb'), minHeight: 32, padding: '4px 8px', fontSize: 13 }}>{aturTpl ? 'Selesai' : '✏️ Atur'}</button>
              </div>
              {!aturTpl && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {!chips.length && <div style={{ fontSize: 12, color: C.sub }}>Belum ada template. Tekan ✏️ Atur untuk menambah rincian yang sering dipakai.</div>}
                  {chips.map((c) => (
                    <button key={c.nama} type="button" onClick={() => tambah(c.nama, c.harga || '')}
                      style={{ ...btn(C.soft, C.text), minHeight: 38, padding: '6px 12px', fontSize: 14, fontWeight: 500, border: `1px solid ${C.border}` }}>
                      + {c.nama}{c.harga ? <span style={{ color: C.sub }}> · {rupiah(c.harga)}</span> : null}
                    </button>
                  ))}
                </div>
              )}
              {aturTpl && (
                <div style={{ background: C.soft, borderRadius: 12, padding: 10 }}>
                  {chips.map((c) => (
                    <div key={c.nama} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
                      <div style={{ flex: 1 }}>{c.nama}{c.harga ? <span style={{ color: C.sub }}> · {rupiah(c.harga)}</span> : null}</div>
                      <button type="button" onClick={() => simpanTpl(chips.filter((x) => x.nama !== c.nama))} style={{ ...btn('transparent', '#dc2626'), minHeight: 34, padding: '2px 10px', fontSize: 13 }}>Hapus</button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    <input style={{ ...inp, flex: '2 1 160px' }} placeholder="Nama rincian baru" value={tplBaru.nama} onChange={(e) => setTplBaru({ ...tplBaru, nama: e.target.value })} />
                    <input style={{ ...inp, flex: '1 1 110px' }} inputMode="numeric" placeholder="Harga default (opsional)" value={tplBaru.harga} onChange={(e) => setTplBaru({ ...tplBaru, harga: fmt(e.target.value) })} />
                    <button type="button" style={btn('#2563eb', '#fff', { flex: '1 1 90px' })} onClick={() => { tambahTpl(tplBaru.nama, tplBaru.harga); setTplBaru({ nama: '', harga: '' }); }}>Tambah</button>
                  </div>
                  {rows.some((r) => r.nama.trim() && !chips.some((c) => c.nama.toLowerCase() === r.nama.trim().toLowerCase())) && (
                    <button type="button" style={{ ...btn('transparent', '#2563eb'), marginTop: 6, fontSize: 13, minHeight: 34, padding: '4px 0' }}
                      onClick={() => {
                        const baru = [...chips];
                        rows.forEach((r) => { const n = r.nama.trim(); if (n && !baru.some((c) => c.nama.toLowerCase() === n.toLowerCase())) baru.push({ nama: n, harga: 0 }); });
                        simpanTpl(baru);
                      }}>+ Jadikan rincian di atas sebagai template</button>
                  )}
                </div>
              )}
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
