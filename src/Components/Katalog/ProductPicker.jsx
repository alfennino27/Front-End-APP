import React, { useEffect, useMemo, useState } from 'react';
import { Drawer, Modal, Select } from 'antd';
import { FiCheck, FiSearch } from 'react-icons/fi';
import { getImageUrl } from '../../Utils/image';

/**
 * Pemilih produk katalog (bisa lebih dari satu) — dipakai Hasil Produksi & kartu "Produk Website"
 * di detail project. Satu project boleh tertaut ke beberapa produk (set meja makan mix & match).
 * Produk yang namanya mirip nama barang project naik ke atas dengan badge "Mirip".
 */
export const thumb = (u, w = 300) => {
  if (!u) return '';
  if (!String(u).startsWith('/uploads')) return getImageUrl(u);
  const full = getImageUrl(u);
  return `${full.slice(0, -u.length)}/img?src=${encodeURIComponent(u)}&w=${w}`;
};
export const firstImage = (p) => {
  for (let i = 1; i <= 50; i++) if (p?.[`image${i}`]) return p[`image${i}`];
  return '';
};

const STOP = new Set(['kursi', 'meja', 'makan', 'set', 'dan', 'with', 'table', 'chair', 'the', 'untuk', 'custom', 'pcs', 'unit', 'cm', 'x', 'by', 'top', 'kaki']);
const tokens = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').filter((t) => t.length > 2 && !STOP.has(t) && !/^\d+$/.test(t));
const skorMirip = (nama, judul) => {
  const a = tokens(nama); if (!a.length) return 0;
  const b = new Set(tokens(judul));
  return a.filter((t) => b.has(t)).length;
};

const useIsMobile = () => {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => { const h = () => setM(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return m;
};

const ProductPicker = ({ open, onClose, onSave, products, categories, selected = [], defaultCat = '', namaRef = '', saving = false, dark = false }) => {
  const isMobile = useIsMobile();
  const [pick, setPick] = useState(selected);
  const [cat, setCat] = useState(defaultCat);
  const [q, setQ] = useState('');
  useEffect(() => { if (open) { setPick(selected); setCat(defaultCat); setQ(''); } }, [open]);

  const th = { card: dark ? '#2a2a3a' : '#fff', border: dark ? '#444' : '#e3e3e3', text: dark ? '#fff' : '#1f2937', muted: dark ? '#aaa' : '#6b7280', bg: dark ? '#1e1e2d' : '#fff' };
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return products
      .filter((p) => !cat || p.category === cat)
      .filter((p) => !s || String(p.judul || '').toLowerCase().includes(s))
      .map((p) => ({ p, skor: skorMirip(namaRef, p.judul) }))
      .sort((a, b) => (pick.includes(b.p.id) - pick.includes(a.p.id)) || (b.skor - a.skor) || ((b.p.isDisplay ? 1 : 0) - (a.p.isDisplay ? 1 : 0)));
  }, [products, cat, q, namaRef, open]);
  const toggle = (id) => setPick((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));

  const body = (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <Select style={{ flex: '1 1 180px' }} size="large" placeholder="Semua kategori" allowClear showSearch optionFilterProp="label"
          value={cat || undefined} onChange={(v) => setCat(v || '')} options={categories.map((c) => ({ value: c.name, label: c.name }))} />
        <div style={{ position: 'relative', flex: '2 1 220px' }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: 13, color: th.muted }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama produk…"
            style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 8, border: `1px solid ${th.border}`, background: th.card, color: th.text, fontSize: 15, outline: 'none' }} />
        </div>
      </div>
      <div style={{ fontSize: 12, color: th.muted, marginBottom: 8 }}>{list.length} produk · {pick.length} dipilih · ketuk untuk pilih / batal</div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 130 : 150}px, 1fr))`, gap: 10, paddingBottom: 80 }}>
        {list.map(({ p, skor }) => {
          const on = pick.includes(p.id);
          return (
            <div key={p.id} onClick={() => toggle(p.id)} style={{ position: 'relative', border: `2px solid ${on ? '#013175' : th.border}`, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', background: th.card, opacity: p.isDisplay ? 1 : 0.7 }}>
              <div style={{ aspectRatio: '1 / 1', background: '#f3f4f6' }}>
                {firstImage(p) && <img src={thumb(firstImage(p))} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
              </div>
              {on && <span style={{ position: 'absolute', top: 6, right: 6, background: '#013175', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiCheck /></span>}
              {skor > 0 && <span style={{ position: 'absolute', top: 6, left: 6, background: '#15803d', color: '#fff', borderRadius: 999, fontSize: 10, fontWeight: 700, padding: '2px 7px' }}>Mirip</span>}
              <div style={{ padding: '6px 8px' }}>
                <div style={{ fontSize: 10, color: th.muted, textTransform: 'uppercase' }}>{p.category}{p.isDisplay ? '' : ' · hidden'}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: th.text, lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.judul}</div>
              </div>
            </div>
          );
        })}
      </div>
      {!list.length && <div style={{ color: th.muted, textAlign: 'center', padding: 30 }}>Tidak ada produk.</div>}
      <div style={{ position: 'sticky', bottom: 0, display: 'flex', gap: 10, padding: '12px 0', background: th.bg }}>
        <button type="button" onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px solid ${th.border}`, background: th.card, color: th.text, fontSize: 15 }}>Batal</button>
        <button type="button" disabled={saving} onClick={() => onSave(pick)} style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: '#013175', color: '#fff', fontSize: 15, fontWeight: 600 }}>
          {saving ? 'Menyimpan…' : pick.length ? `Simpan (${pick.length} produk)` : 'Simpan (lepas semua)'}
        </button>
      </div>
    </>
  );

  const title = <span style={{ color: th.text }}>Tautkan ke Produk Website</span>;
  return isMobile
    ? <Drawer open={open} onClose={onClose} placement="bottom" height="94%" destroyOnClose title={title} styles={{ body: { background: th.bg, padding: 14 }, header: { background: th.bg } }}>{body}</Drawer>
    : <Modal open={open} onCancel={onClose} footer={null} width={1000} destroyOnClose title={title} styles={{ body: { maxHeight: '75vh', overflowY: 'auto' } }}>{body}</Modal>;
};

export default ProductPicker;
