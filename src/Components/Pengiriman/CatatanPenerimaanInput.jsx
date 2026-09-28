import React, { useEffect, useState } from 'react';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useTheme } from '../../ThemeContext';

// Chip pilihan cepat catatan penerimaan barang. Dipakai di Quote, Invoice, dan
// Pengiriman supaya kalimatnya seragam & mudah dibaca ekspedisi.
// Daftar template disimpan di server (GET/PUT /catatan-penerimaan/template) dan
// bisa diedit lewat tombol ✏️ — berlaku untuk semua user.
export const PRESET_CATATAN = [
  'Hanya diterima hari & jam kerja (Senin–Jumat 08.00–17.00)',
  'Telepon penerima 1 jam sebelum tiba',
  'Tidak menerima hari Sabtu/Minggu',
  'Akses jalan sempit / tidak bisa truk besar',
  'Tanpa lift, barang naik tangga',
];

// Cache bersama antar-instance (Quote & Invoice bisa render beberapa sekaligus).
let cache = null;
let loading = null;
const listeners = new Set();
const setCache = (items) => { cache = items; listeners.forEach((fn) => fn(items)); };
const loadTemplate = () => {
  if (cache) return Promise.resolve(cache);
  if (!loading) {
    loading = fetch(`${getApiBaseUrl()}/catatan-penerimaan/template`)
      .then((r) => r.json())
      .then((d) => { setCache(Array.isArray(d.items) ? d.items : PRESET_CATATAN); return cache; })
      .catch(() => { loading = null; return PRESET_CATATAN; });
  }
  return loading;
};

/**
 * Textarea catatan penerimaan + chip pilihan cepat (klik = tambah baris,
 * klik lagi = hapus baris itu).
 * Props: value, onChange(str), style (untuk textarea), muted (warna chip), rows
 */
const CatatanPenerimaanInput = ({ value, onChange, style, muted = '#64748b', rows = 3, placeholder }) => {
  const [preset, setPreset] = useState(cache || PRESET_CATATAN);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    listeners.add(setPreset);
    loadTemplate().then(setPreset);
    return () => listeners.delete(setPreset);
  }, []);

  const lines = String(value || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const toggle = (p) => {
    const next = lines.includes(p) ? lines.filter((l) => l !== p) : [...lines, p];
    onChange(next.join('\n'));
  };
  const chipBase = {
    borderRadius: 999, padding: '6px 12px', fontSize: 13, cursor: 'pointer', lineHeight: 1.3,
    minHeight: 34, textAlign: 'left', maxWidth: '100%',
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {preset.map((p) => {
          const on = lines.includes(p);
          return (
            <button
              key={p}
              type="button"
              onClick={() => toggle(p)}
              style={{
                ...chipBase,
                border: `1px solid ${on ? '#dc2626' : muted}`,
                background: on ? '#dc2626' : 'transparent',
                color: on ? '#fff' : muted,
              }}
            >
              {on ? '✓ ' : '+ '}{p}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          title="Edit daftar template"
          style={{ ...chipBase, border: `1px dashed ${muted}`, background: 'transparent', color: muted }}
        >
          ✏️ Edit template
        </button>
      </div>
      <textarea
        className="form-control"
        rows={rows}
        style={style}
        value={value || ''}
        placeholder={placeholder || 'Request customer saat barang diterima, mis. hanya jam kerja, telepon dulu, dsb.'}
        onChange={(e) => onChange(e.target.value)}
      />
      {editOpen && <TemplateEditor items={preset} onClose={() => setEditOpen(false)} />}
    </div>
  );
};

// ============================================================================
// Editor template — bottom sheet, nyaman di HP (tombol besar, input lebar penuh)
// ============================================================================
const TemplateEditor = ({ items, onClose }) => {
  const { globalTheme } = useTheme();
  const dark = globalTheme !== 'light';
  const C = {
    card: dark ? '#1c1c1f' : '#ffffff',
    border: dark ? '#2e2e33' : '#e4e4e7',
    text: dark ? '#f4f4f5' : '#18181b',
    muted: dark ? '#a1a1aa' : '#71717a',
    soft: dark ? '#27272a' : '#f4f4f5',
    input: dark ? '#111113' : '#ffffff',
  };
  const [rows, setRows] = useState(items.length ? [...items] : ['']);
  const [saving, setSaving] = useState(false);

  const iconBtn = {
    width: 40, height: 40, flex: '0 0 40px', borderRadius: 10, border: `1px solid ${C.border}`,
    background: C.soft, color: C.text, fontSize: 16, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  };
  const btn = (bg, fg = '#fff') => ({ background: bg, color: fg, border: 'none', borderRadius: 10, padding: '12px 14px', fontSize: 15, fontWeight: 600, cursor: 'pointer', minHeight: 46 });

  const ubah = (i, v) => setRows(rows.map((r, j) => (j === i ? v : r)));
  const pindah = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
  };

  const simpan = async () => {
    setSaving(true);
    try {
      const user = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();
      const r = await fetch(`${getApiBaseUrl()}/catatan-penerimaan/template`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: rows, uid: user?.uid || '' }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Gagal simpan');
      setCache(d.items);
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.card, color: C.text, width: '100%', maxWidth: 560, maxHeight: '88vh', overflowY: 'auto',
          borderRadius: '16px 16px 0 0', padding: '14px 16px calc(16px + env(safe-area-inset-bottom))', boxShadow: '0 -8px 30px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ flex: 1, fontWeight: 700, fontSize: 17 }}>Template catatan penerimaan</div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 26, cursor: 'pointer', padding: '0 6px' }}>×</button>
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>Berlaku untuk semua user di Quote, Invoice & Pengiriman. Kosongkan baris untuk menghapus.</div>

        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 8 }}>
            <textarea
              rows={2}
              value={r}
              placeholder="Tulis template…"
              onChange={(e) => ubah(i, e.target.value.replace(/\n/g, ' '))}
              style={{ flex: 1, minWidth: 0, background: C.input, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 10px', fontSize: 15, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <button type="button" style={iconBtn} disabled={i === 0} onClick={() => pindah(i, -1)} aria-label="Naik">↑</button>
                <button type="button" style={iconBtn} disabled={i === rows.length - 1} onClick={() => pindah(i, 1)} aria-label="Turun">↓</button>
              </div>
              <button type="button" style={{ ...iconBtn, width: 84, flex: 'none', color: '#dc2626' }} onClick={() => setRows(rows.filter((_, j) => j !== i))}>Hapus</button>
            </div>
          </div>
        ))}

        <button type="button" style={{ ...btn(C.card, '#2563eb'), width: '100%', border: '2px dashed #2563eb', marginBottom: 12 }} onClick={() => setRows([...rows, ''])}>
          + Tambah template
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" style={{ ...btn(C.soft, C.text), flex: '0 0 auto' }} onClick={() => setRows([...PRESET_CATATAN])}>Default</button>
          <button type="button" disabled={saving} style={{ ...btn('#16a34a'), flex: 1, opacity: saving ? 0.6 : 1 }} onClick={simpan}>{saving ? 'Menyimpan…' : 'Simpan'}</button>
        </div>
      </div>
    </div>
  );
};

export default CatatanPenerimaanInput;
