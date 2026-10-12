import React, { useEffect, useState } from 'react';
import { getApiBaseUrl } from '../../Config/APIurl';
import { warna, inpStyle, btnStyle, SHEET_CSS } from '../Costing/RincianCostingSheet';

// ============================================================================
// CATATAN ONGKIR — daftar pilihan dropdown Quote/Invoice, bisa diedit user
// (backend utils/ongkirNote.js, GET/PUT /ongkir-note/template). Tiap catatan:
// teks (tercetak di PDF) + pihak ongkir (penjual/penerima → badge Pengiriman).
// `key` disimpan di Quote/Invoice.ongkirNote; catatan yang dihapus hanya
// dinonaktifkan supaya quote lama tetap tercetak benar.
// ============================================================================

export const PIHAK_LABEL = { penjual: 'ongkir penjual', penerima: 'ongkir penerima', '': 'tanpa pihak' };

let cache = null;
const listeners = new Set();
const setCache = (items) => { cache = items; listeners.forEach((fn) => fn(items)); };
const muat = () => fetch(`${getApiBaseUrl()}/ongkir-note/template`)
  .then((r) => r.json()).then((d) => setCache(Array.isArray(d.items) ? d.items : [])).catch(() => {});

/** Semua catatan (termasuk nonaktif, untuk membaca nilai lama). Dibagi antar komponen. */
export const useOngkirNotes = () => {
  const [items, setItems] = useState(cache || []);
  useEffect(() => {
    listeners.add(setItems);
    if (!cache) muat();
    return () => listeners.delete(setItems);
  }, []);
  return items;
};

/** Opsi <select>: catatan aktif + nilai sekarang kalau sudah dinonaktifkan. */
export const opsiOngkir = (items, current) => {
  const aktif = items.filter((x) => x.aktif !== false);
  const lama = current && current !== 'none' && !aktif.some((x) => x.key === current) ? items.find((x) => x.key === current) : null;
  return [
    { value: 'none', label: 'Tanpa catatan ongkir' },
    ...aktif.map((x) => ({ value: x.key, label: `${x.teks}${x.pihak ? ` (${PIHAK_LABEL[x.pihak]})` : ''}` })),
    ...(lama ? [{ value: lama.key, label: `${lama.teks} (sudah dihapus)` }] : []),
    ...(current && current !== 'none' && !items.some((x) => x.key === current) ? [{ value: current, label: current }] : []),
  ];
};

const baris = (x) => ({ rk: Math.random().toString(36).slice(2), key: x.key || '', teks: x.teks || '', pihak: x.pihak || '' });

export const OngkirNoteManager = ({ open, dark, onClose }) => {
  const items = useOngkirNotes();
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) { muat(); setStatus(''); } }, [open]);
  useEffect(() => { if (open) setRows(items.filter((x) => x.aktif !== false).map(baris)); }, [open, items]);

  if (!open) return null;
  const C = warna(dark);
  const inp = inpStyle(C);
  const btn = btnStyle;
  const ubah = (rk, patch) => setRows((r) => r.map((x) => (x.rk === rk ? { ...x, ...patch } : x)));

  const simpan = async () => {
    setSaving(true);
    try {
      const user = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();
      const r = await fetch(`${getApiBaseUrl()}/ongkir-note/template`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user?.uid || '', items: rows.filter((x) => x.teks.trim()).map(({ key, teks, pihak }) => ({ key, teks, pihak })) }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Gagal simpan');
      setCache(d.items);
      onClose();
    } catch (e) {
      setStatus('Gagal: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="klf-rc-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <style>{SHEET_CSS}</style>
      <div className="klf-rc-sheet" style={{ background: C.card, color: C.text }}>
        <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: C.border, margin: '-4px auto 10px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>Catatan Ongkir</div>
              <div style={{ fontSize: 12, color: C.sub }}>Berlaku untuk semua Quote & Invoice. Teks tercetak di PDF; pihak ongkir dipakai di Pengiriman.</div>
            </div>
            <button type="button" aria-label="Tutup" onClick={onClose} style={{ ...btn('transparent', C.sub), minHeight: 36, padding: '2px 8px', fontSize: 22 }}>×</button>
          </div>
        </div>

        <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
          {rows.map((r) => (
            <div key={r.rk} style={{ background: C.soft, borderRadius: 12, padding: 10, marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input style={{ ...inp, flex: 1 }} value={r.teks} placeholder="mis. *gratis ongkir Jabodetabek" onChange={(e) => ubah(r.rk, { teks: e.target.value })} />
                <button type="button" aria-label="Hapus" onClick={() => setRows((x) => x.filter((y) => y.rk !== r.rk))}
                  style={{ ...btn('transparent', '#dc2626'), padding: '0 6px', fontSize: 18 }}>🗑</button>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {[['penjual', 'Ongkir penjual', '#16a34a'], ['penerima', 'Ongkir penerima', '#ea580c'], ['', 'Tidak ditentukan', '#64748b']].map(([k, lbl, col]) => {
                  const on = r.pihak === k;
                  return (
                    <button key={k || 'x'} type="button" onClick={() => ubah(r.rk, { pihak: k })}
                      style={{ ...btn(on ? col : 'transparent', on ? '#fff' : C.text), flex: 1, minHeight: 38, padding: '4px 6px', fontSize: 13, border: `1.5px solid ${on ? col : C.border}` }}>
                      {on ? '✓ ' : ''}{lbl}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setRows((r) => [...r, baris({ pihak: 'penjual' })])}
            style={{ ...btn('transparent', '#2563eb'), width: '100%', border: '2px dashed #2563eb' }}>+ Tambah catatan ongkir</button>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 10 }}>Catatan yang dihapus hilang dari pilihan, tapi quote/invoice lama yang memakainya tetap tercetak seperti semula.</div>
        </div>

        <div style={{ padding: '12px 16px calc(12px + env(safe-area-inset-bottom))', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          {status && <div style={{ flex: 1, fontSize: 13, color: '#dc2626' }}>{status}</div>}
          <button type="button" style={btn(C.soft, C.text, { flex: 1 })} onClick={onClose}>Batal</button>
          <button type="button" disabled={saving} style={btn('#1e40af', '#fff', { flex: 2, opacity: saving ? 0.6 : 1 })} onClick={simpan}>{saving ? 'Menyimpan…' : 'Simpan'}</button>
        </div>
      </div>
    </div>
  );
};
