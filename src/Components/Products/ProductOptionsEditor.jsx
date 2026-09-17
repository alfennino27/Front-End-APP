import React, { useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { Select, Input, message, Popconfirm } from 'antd';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { FaSearch } from 'react-icons/fa';
import { getApiBaseUrl } from '../../Config/APIurl';
import { getImageUrl } from '../../Utils/image';

/**
 * Editor "Opsi Tambahan" produk (konfigurator ala GrabFood) — dipakai di panel detail Products.
 * Saat ini: tipe 'produk' (item menunjuk ke produk+varian lain, mis. kursi untuk meja makan;
 * harga & HPP otomatis ikut produk itu × jumlah). Tipe 'pilihan' (matriks harga per varian) menyusul.
 * Props: product, products (semua), varians (semua), categories, onSaved(options), theme
 */
const uid = () => Math.random().toString(36).slice(2, 10);
const rp = (n) => `Rp ${Math.round(Number(n) || 0).toLocaleString('id-ID')}`;
const firstImage = (p) => { for (let i = 1; i <= 50; i++) if (p && p[`image${i}`]) return getImageUrl(p[`image${i}`]); return ''; };
const hppOf = (v) => ['stainless', 'besi', 'kayu', 'jok', 'rotan', 'finishing', 'marmer', 'fiber', 'veneer'].reduce((a, k) => a + (Number(v?.[k]) || 0), 0);

const ProductOptionsEditor = ({ product, products, varians, categories, onSaved, theme = 'light' }) => {
  const baseUrl = getApiBaseUrl();
  const dark = theme !== 'light';
  const options = Array.isArray(product.options) ? product.options : [];
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState(null); // { groupId } saat memilih produk untuk item baru
  const [pickCat, setPickCat] = useState('');
  const [pickQ, setPickQ] = useState('');
  const [pickProduct, setPickProduct] = useState(null); // produk terpilih → pilih varian

  const border = dark ? '#444' : '#e3e3e3';
  const text = dark ? '#fff' : '#222';
  const muted = dark ? '#aaa' : '#777';
  const btn = { padding: '5px 10px', borderRadius: 8, border: `1px solid ${border}`, background: dark ? '#1e1e2d' : '#fff', color: text, cursor: 'pointer', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 };

  const pById = useMemo(() => { const m = {}; (products || []).forEach((p) => { m[p.id] = p; }); return m; }, [products]);
  const vById = useMemo(() => { const m = {}; (varians || []).forEach((v) => { m[v.id] = v; }); return m; }, [varians]);

  const save = async (next) => {
    setSaving(true);
    try {
      const r = await fetch(`${baseUrl}/products/options/update`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, options: next }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      onSaved(d.options);
    } catch (e) { message.error(e.message || 'Gagal simpan opsi'); }
    finally { setSaving(false); }
  };
  const updateGroup = (gid, patch) => save(options.map((g) => (g.id === gid ? { ...g, ...patch } : g)));

  const addGroup = () => save([...options, { id: uid(), nama: 'Kursi', tipe: 'produk', noneLabel: 'Tanpa kursi', defaultItemId: null, items: [] }]);
  const addItem = (gid, p, v) => {
    const g = options.find((x) => x.id === gid);
    if (g.items.some((it) => it.linkVarian === v.id)) { message.warning('Varian itu sudah ada di grup ini'); return; }
    updateGroup(gid, { items: [...g.items, { id: uid(), label: v.varian, linkProduct: p.id, linkVarian: v.id }] });
    setPicker(null); setPickProduct(null);
  };

  const pickList = useMemo(() => {
    const q = pickQ.trim().toLowerCase();
    return (products || []).filter((p) => p.id !== product.id && p.isDisplay).filter((p) => !pickCat || p.category === pickCat).filter((p) => !q || String(p.judul || '').toLowerCase().includes(q));
  }, [products, pickCat, pickQ, product.id]);

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: text }}>Opsi Tambahan {saving && <span style={{ fontSize: 11, color: muted }}>· menyimpan…</span>}</div>
          <div style={{ fontSize: 11, color: muted }}>Pilihan ekstra di website (mis. kursi untuk meja makan). Harga ikut produk yang ditautkan × jumlah.</div>
        </div>
        <button style={btn} onClick={addGroup} disabled={saving}><FiPlus /> Opsi dari produk lain</button>
      </div>

      {options.length === 0 && <div style={{ fontSize: 12, color: muted, marginTop: 8 }}>Belum ada opsi — produk tampil biasa di website.</div>}

      {options.map((g) => (
        <div key={g.id} style={{ border: `1px solid ${border}`, borderRadius: 10, padding: 10, marginTop: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              defaultValue={g.nama}
              onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== g.nama) updateGroup(g.id, { nama: v }); }}
              style={{ fontWeight: 600, fontSize: 13, border: 'none', borderBottom: `1px dashed ${border}`, background: 'transparent', color: text, flex: 1, outline: 'none' }}
              title="Nama grup (klik untuk ubah)"
            />
            <span style={{ fontSize: 11, color: muted }}>{g.items.length} pilihan</span>
            <Popconfirm title="Hapus grup opsi ini?" onConfirm={() => save(options.filter((x) => x.id !== g.id))} okText="Hapus" cancelText="Batal">
              <button style={{ ...btn, color: '#c0392b' }}><FiTrash2 /></button>
            </Popconfirm>
          </div>

          <table style={{ width: '100%', fontSize: 12, marginTop: 8, borderCollapse: 'collapse' }}>
            <tbody>
              {/* baris "Tanpa …" = default bawaan */}
              <tr>
                <td style={{ padding: '4px 2px', width: 22 }}><input type="radio" name={`def-${g.id}`} checked={!g.defaultItemId} onChange={() => updateGroup(g.id, { defaultItemId: null })} title="Jadikan default" /></td>
                <td style={{ padding: '4px 2px' }} colSpan={2}>
                  <input defaultValue={g.noneLabel || 'Tanpa'} onBlur={(e) => { const v = e.target.value.trim(); if (v !== (g.noneLabel || '')) updateGroup(g.id, { noneLabel: v }); }}
                    style={{ border: 'none', borderBottom: `1px dashed ${border}`, background: 'transparent', color: text, outline: 'none', width: '100%' }} />
                </td>
                <td style={{ padding: '4px 2px', textAlign: 'right', color: muted }}>Rp 0</td>
                <td />
              </tr>
              {g.items.map((it) => {
                const lp = pById[it.linkProduct]; const lv = vById[it.linkVarian];
                const ok = lp && lv && lp.isDisplay;
                return (
                  <tr key={it.id} style={{ borderTop: `1px solid ${border}`, opacity: ok ? 1 : 0.55 }}>
                    <td style={{ padding: '4px 2px' }}><input type="radio" name={`def-${g.id}`} checked={g.defaultItemId === it.id} onChange={() => updateGroup(g.id, { defaultItemId: it.id })} title="Jadikan default" /></td>
                    <td style={{ padding: '4px 2px', width: 34 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 6, overflow: 'hidden', background: '#eee' }}>{lp && firstImage(lp) && <img src={firstImage(lp)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div>
                    </td>
                    <td style={{ padding: '4px 2px' }}>
                      <input defaultValue={it.label} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== it.label) updateGroup(g.id, { items: g.items.map((x) => (x.id === it.id ? { ...x, label: v } : x)) }); }}
                        style={{ border: 'none', borderBottom: `1px dashed ${border}`, background: 'transparent', color: text, outline: 'none', width: '100%', fontWeight: 600 }} title="Label yang dilihat customer" />
                      <div style={{ fontSize: 10, color: ok ? muted : '#c0392b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                        {!lp ? 'produk terhapus' : !lv ? 'varian terhapus' : !lp.isDisplay ? `hidden: ${lp.judul}` : `${lp.judul} · ${lv.varian}`}
                      </div>
                    </td>
                    <td style={{ padding: '4px 2px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {lv ? <><b>{rp(lv.jual)}</b><span style={{ color: muted }}>/pc</span><div style={{ fontSize: 10, color: muted }}>HPP {rp(hppOf(lv))}</div></> : '-'}
                    </td>
                    <td style={{ padding: '4px 2px', textAlign: 'right' }}>
                      <button style={{ ...btn, color: '#c0392b', padding: '3px 6px' }} onClick={() => updateGroup(g.id, { items: g.items.filter((x) => x.id !== it.id), defaultItemId: g.defaultItemId === it.id ? null : g.defaultItemId })}><FiTrash2 size={12} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button style={{ ...btn, marginTop: 6 }} onClick={() => { setPicker({ groupId: g.id }); setPickCat(''); setPickQ(''); setPickProduct(null); }}><FiPlus /> Tambah pilihan dari produk</button>
        </div>
      ))}

      {/* picker produk → varian */}
      <Modal show={!!picker} onHide={() => setPicker(null)} size="xl" centered scrollable>
        <Modal.Header closeButton><Modal.Title style={{ fontSize: 16 }}>{pickProduct ? `Pilih varian — ${pickProduct.judul}` : 'Pilih produk untuk opsi'}</Modal.Title></Modal.Header>
        <Modal.Body>
          {pickProduct ? (
            <>
              <button style={{ ...btn, marginBottom: 10 }} onClick={() => setPickProduct(null)}>‹ Ganti produk</button>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                {(varians || []).filter((v) => v.idProduct === pickProduct.id).map((v) => (
                  <div key={v.id} onClick={() => addItem(picker.groupId, pickProduct, v)} style={{ border: `1px solid ${border}`, borderRadius: 10, padding: 10, cursor: 'pointer' }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{v.varian}</div>
                    <div style={{ fontSize: 12 }}>{rp(v.jual)}/pc · <span style={{ color: muted }}>HPP {rp(hppOf(v))}</span></div>
                  </div>
                ))}
                {(varians || []).filter((v) => v.idProduct === pickProduct.id).length === 0 && <div style={{ color: muted }}>Produk ini belum punya varian.</div>}
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <Select style={{ width: 200 }} placeholder="Semua kategori" allowClear showSearch optionFilterProp="label" value={pickCat || undefined} onChange={(v) => setPickCat(v || '')}
                  options={(categories || []).map((c) => ({ value: c.name, label: c.name }))} getPopupContainer={(n) => n.parentNode} />
                <Input allowClear prefix={<FaSearch style={{ color: '#999' }} />} placeholder="Cari nama produk…" value={pickQ} onChange={(e) => setPickQ(e.target.value)} style={{ width: 260 }} />
                <span style={{ alignSelf: 'center', fontSize: 12, color: muted }}>{pickList.length} produk (hanya yang tampil di website)</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                {pickList.map((p) => (
                  <div key={p.id} onClick={() => setPickProduct(p)} style={{ border: `1px solid ${border}`, borderRadius: 10, overflow: 'hidden', cursor: 'pointer' }}>
                    <div style={{ aspectRatio: '1 / 1', background: '#f3f4f6' }}>{firstImage(p) && <img src={firstImage(p)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}</div>
                    <div style={{ padding: '6px 8px' }}>
                      <div style={{ fontSize: 10, color: muted, textTransform: 'uppercase' }}>{p.category}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.judul}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ProductOptionsEditor;
