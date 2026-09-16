import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { Select, Input, message } from 'antd';
import { FaSearch } from 'react-icons/fa';
import { getApiBaseUrl } from '../../Config/APIurl';
import { getImageUrl } from '../../Utils/image';

/**
 * Kartu "Produk Website" di detail project: hubungkan project ke produk katalog
 * (Projects.linkProduct = Products.id). Foto BarangJadi project ini lalu tampil di
 * halaman produk website. Yang boleh ubah: user dengan akses menu 'Link Produk'.
 */
const firstImage = (p) => {
  for (let i = 1; i <= 50; i++) if (p[`image${i}`]) return getImageUrl(p[`image${i}`]);
  return '';
};

const LinkProductCard = ({ projectId, linkProduct, canEdit, theme = 'light' }) => {
  const baseUrl = getApiBaseUrl();
  const dark = theme !== 'light';
  const [current, setCurrent] = useState(linkProduct || null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState('');
  const [q, setQ] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { setCurrent(linkProduct || null); }, [linkProduct]);

  const loadProducts = async () => {
    if (products.length) return;
    try {
      const [p, c] = await Promise.all([
        fetch(`${baseUrl}/products/get`).then((r) => r.json()),
        fetch(`${baseUrl}/products/category/get`).then((r) => r.json()),
      ]);
      setProducts(Array.isArray(p) ? p : []);
      setCategories(Array.isArray(c) ? c : []);
    } catch (e) { console.error('load products', e); }
  };
  // produk ter-link perlu datanya buat kartu ringkas
  useEffect(() => { if (current) loadProducts(); }, [current]);

  const linked = useMemo(() => products.find((p) => p.id === current) || null, [products, current]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return products
      .filter((p) => !cat || p.category === cat)
      .filter((p) => !s || String(p.judul || '').toLowerCase().includes(s));
  }, [products, cat, q]);

  const save = async (idProduct) => {
    setSaving(true);
    try {
      const r = await fetch(`${baseUrl}/projects/link-product`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idProject: projectId, idProduct }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setCurrent(idProduct);
      setOpen(false);
      message.success(d.message);
    } catch (e) { message.error(e.message || 'Gagal menyimpan'); }
    finally { setSaving(false); }
  };

  const border = dark ? '#444' : '#e3e3e3';
  const text = dark ? '#fff' : '#222';
  const muted = dark ? '#aaa' : '#777';

  return (
    // stopPropagation: parent di DetailPekerjaan punya onClick (buka modal Information) — jangan ikut terpicu,
    // termasuk klik di dalam Modal (event React bubble lewat tree, bukan DOM).
    <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 16, border: `1px solid ${border}`, borderRadius: 12, padding: '10px 12px', background: dark ? '#1e1e2d' : '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h6 className="mb-0" style={{ color: text }}>Produk Website</h6>
        {canEdit && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-sm btn-outline-primary" onClick={() => { loadProducts(); setCat(linked ? linked.category : ''); setQ(''); setOpen(true); }}>
              {current ? 'Ubah' : '+ Hubungkan ke produk'}
            </button>
            {current && <button className="btn btn-sm btn-outline-danger" disabled={saving} onClick={() => save(null)}>Lepas</button>}
          </div>
        )}
      </div>
      {current ? (
        linked ? (
          <a href={`https://karyalogamfurniture.com/category/detail?id=${linked._id || linked.id}`} target="_blank" rel="noreferrer" style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8, textDecoration: 'none', color: text }}>
            <div style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', background: '#eee', flexShrink: 0 }}>
              {firstImage(linked) && <img src={firstImage(linked)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: muted, textTransform: 'uppercase' }}>{linked.category}</div>
              <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>{linked.judul}</div>
              <div style={{ fontSize: 11, color: muted }}>Foto Barang Jadi project ini tampil di halaman produk ↗</div>
            </div>
          </a>
        ) : <div style={{ fontSize: 12, color: muted, marginTop: 6 }}>Memuat produk…</div>
      ) : (
        <div style={{ fontSize: 12, color: muted, marginTop: 6 }}>Belum terhubung ke produk katalog.</div>
      )}

      <Modal show={open} onHide={() => setOpen(false)} size="xl" centered scrollable>
        <Modal.Header closeButton><Modal.Title style={{ fontSize: 17 }}>Pilih Produk Website</Modal.Title></Modal.Header>
        <Modal.Body>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, position: 'sticky', top: -16, background: dark ? '#1e1e2d' : '#fff', padding: '4px 0', zIndex: 1 }}>
            <Select
              style={{ width: 220 }} placeholder="Semua kategori" allowClear showSearch optionFilterProp="label"
              value={cat || undefined} onChange={(v) => setCat(v || '')}
              options={categories.map((c) => ({ value: c.name, label: c.name }))}
              getPopupContainer={(n) => n.parentNode}
            />
            <Input allowClear prefix={<FaSearch style={{ color: '#999' }} />} placeholder="Cari nama produk…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 260 }} />
            <span style={{ alignSelf: 'center', fontSize: 12, color: muted }}>{list.length} produk</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {list.map((p) => {
              const active = p.id === current;
              return (
                <div
                  key={p.id}
                  onClick={() => !saving && save(p.id)}
                  style={{ border: `2px solid ${active ? '#013175' : border}`, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', background: dark ? '#2a2a3a' : '#fff', opacity: p.isDisplay ? 1 : 0.7 }}
                >
                  <div style={{ aspectRatio: '1 / 1', background: '#f3f4f6' }}>
                    {firstImage(p) && <img src={firstImage(p)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                  </div>
                  <div style={{ padding: '6px 8px' }}>
                    <div style={{ fontSize: 10, color: muted, textTransform: 'uppercase' }}>{p.category}{p.isDisplay ? '' : ' · hidden'}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: text, lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.judul}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {list.length === 0 && <div style={{ color: muted, textAlign: 'center', padding: 30 }}>Tidak ada produk.</div>}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default LinkProductCard;
