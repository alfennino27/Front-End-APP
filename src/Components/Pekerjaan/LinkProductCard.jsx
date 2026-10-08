import React, { useEffect, useMemo, useState } from 'react';
import { message, Popconfirm } from 'antd';
import { getApiBaseUrl } from '../../Config/APIurl';
import ProductPicker, { firstImage, thumb } from '../Katalog/ProductPicker';

/**
 * Kartu "Produk Website" di detail project: tautkan project ke satu atau lebih produk katalog
 * (Projects.linkProducts = [Products.id]; set meja makan sering mix & match meja + kursi).
 * Foto BarangJadi project ini lalu tampil di halaman produk website. Yang boleh ubah: user
 * dengan akses menu 'Link Produk'. Kategori project (KategoriProduk) = kategori website.
 */
const idsAwal = (linkProducts, linkProduct) => {
  const ids = Array.isArray(linkProducts) ? [...linkProducts] : [];
  if (linkProduct && !ids.includes(linkProduct)) ids.unshift(linkProduct);
  return ids.filter(Boolean);
};

const LinkProductCard = ({ projectId, linkProducts, linkProduct, canEdit, kategori, theme = 'light' }) => {
  const baseUrl = getApiBaseUrl();
  const dark = theme !== 'light';
  const [current, setCurrent] = useState(idsAwal(linkProducts, linkProduct));
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setCurrent(idsAwal(linkProducts, linkProduct)); setOpen(false); }, [linkProducts, linkProduct, projectId]);

  const loadProducts = async () => {
    if (products.length) return;
    try {
      const [p, c] = await Promise.all([
        fetch(`${baseUrl}/products/get`).then((r) => r.json()),
        fetch(`${baseUrl}/products/category/get`).then((r) => r.json()),
      ]);
      setProducts(Array.isArray(p) ? p : []);
      setCategories(Array.isArray(c) ? [...c].sort((a, b) => String(a.name).localeCompare(String(b.name))) : []);
    } catch (e) { console.error('load products', e); }
  };
  useEffect(() => { if (current.length) loadProducts(); }, [current.length]);

  const linked = useMemo(() => current.map((id) => products.find((p) => p.id === id)).filter(Boolean), [products, current]);

  const save = async (ids) => {
    setSaving(true);
    try {
      const r = await fetch(`${baseUrl}/projects/link-product`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idProject: projectId, idProducts: ids }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setCurrent(ids);
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
        <h6 className="mb-0" style={{ color: text }}>Produk Website {current.length > 1 ? `(${current.length})` : ''}</h6>
        {canEdit && (
          <button className="btn btn-sm btn-outline-primary" onClick={() => { loadProducts(); setOpen(true); }}>
            {current.length ? 'Ubah' : '+ Tautkan ke produk'}
          </button>
        )}
      </div>
      {current.length ? (
        linked.length ? linked.map((p) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a href={`https://karyalogamfurniture.com/category/detail?id=${p._id || p.id}`} target="_blank" rel="noreferrer" style={{ flex: 1, minWidth: 0, display: 'flex', gap: 10, alignItems: 'center', marginTop: 8, textDecoration: 'none', color: text }}>
            <div style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', background: '#eee', flexShrink: 0 }}>
              {firstImage(p) && <img src={thumb(firstImage(p), 160)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: muted, textTransform: 'uppercase' }}>{p.category}{p.isDisplay ? '' : ' · hidden'}</div>
              <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>{p.judul}</div>
            </div>
          </a>
          {canEdit && (
            <Popconfirm title="Hapus tautan ke produk ini?" okText="Hapus" cancelText="Batal" onConfirm={() => save(current.filter((id) => id !== p.id))}>
              <button className="btn btn-sm btn-outline-danger" disabled={saving} style={{ marginTop: 8 }} title="Hapus tautan">✕</button>
            </Popconfirm>
          )}
          </div>
        )) : <div style={{ fontSize: 12, color: muted, marginTop: 6 }}>Memuat produk…</div>
      ) : (
        <div style={{ fontSize: 12, color: muted, marginTop: 6 }}>Belum tertaut ke produk katalog.</div>
      )}
      {current.length > 0 && <div style={{ fontSize: 11, color: muted, marginTop: 6 }}>Foto Barang Jadi project ini tampil di halaman produk ↗</div>}

      <ProductPicker open={open} onClose={() => setOpen(false)} onSave={save} saving={saving} dark={dark}
        products={products} categories={categories} selected={current} defaultCat={kategori || ''} />
    </div>
  );
};

export default LinkProductCard;
