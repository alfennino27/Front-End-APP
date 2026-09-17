import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Select, Input, message, Switch, Popconfirm } from 'antd';
import { FiPlus, FiTrash2, FiCopy, FiChevronLeft, FiChevronRight, FiArrowLeft } from 'react-icons/fi';
import { FaRegImages, FaStar } from 'react-icons/fa';
import { NumericFormat } from 'react-number-format';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useTheme } from '../../ThemeContext';
import { compressImageFiles } from '../../Utils/compressImage';
import { getImageUrl } from '../../Utils/image';
import { isHeic } from '../../Utils/heic';

/**
 * Halaman /products/new — tambah produk katalog website sekali jalan, gaya marketplace:
 * foto (drag&drop / pilih / paste, urutan bisa digeser), info, label, video & 3D, varian + costing.
 * Simpan → POST /products/create-full → kembali ke /products (produk baru langsung terpilih).
 */
const CATEGORIES = ['stainless', 'besi', 'kayu', 'jok', 'rotan', 'finishing', 'marmer', 'fiber', 'veneer'];
const CAT_LABEL = { stainless: 'Stainless', besi: 'Besi', kayu: 'Kayu', jok: 'Jok', rotan: 'Rotan', finishing: 'Finishing', marmer: 'Marmer', fiber: 'Fiber', veneer: 'Veneer' };
const emptyVarian = () => ({ key: Math.random().toString(36).slice(2), varian: '', jual: '', open: false, ...CATEGORIES.reduce((a, c) => ({ ...a, [c]: '' }), {}) });
const num = (x) => Number(String(x ?? '').replace(/\./g, '')) || 0;
const rp = (n) => `Rp ${Math.round(Number(n) || 0).toLocaleString('id-ID')}`;

// Didefinisikan di luar komponen supaya identitasnya stabil — kalau di dalam, tiap ketik
// komponen dibuat ulang dan input kehilangan fokus.
const Section = ({ th, title, hint, children }) => (
  <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 14, padding: '16px 18px', marginBottom: 14 }}>
    <div style={{ fontWeight: 700, fontSize: 15, color: th.text }}>{title}</div>
    {hint && <div style={{ fontSize: 12, color: th.muted, marginBottom: 10 }}>{hint}</div>}
    {children}
  </div>
);
const Field = ({ th, label, children, req }) => (
  <label style={{ display: 'block', marginBottom: 12 }}>
    <div style={{ fontSize: 12, fontWeight: 600, color: th.muted, marginBottom: 4 }}>{label}{req && <span style={{ color: '#c0392b' }}> *</span>}</div>
    {children}
  </label>
);
const PlainInput = React.forwardRef((props, ref) => <input ref={ref} {...props} />);

const ProductNew = () => {
  const baseUrl = getApiBaseUrl();
  const navigate = useNavigate();
  const { globalTheme } = useTheme();
  const dark = globalTheme !== 'light';
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  useEffect(() => { if (!user) window.location.replace('/login'); }, []);

  // ---- master data ----
  const [categories, setCategories] = useState([]);
  const [labelMaster, setLabelMaster] = useState({ defaultOngkir: 'Gratis ongkir', labels: [] });
  useEffect(() => {
    fetch(`${baseUrl}/products/category/get`).then((r) => r.json()).then((d) => setCategories(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${baseUrl}/products/labels/get`).then((r) => r.json()).then((d) => { if (d && d.labels) { setLabelMaster(d); setOngkirTag(d.defaultOngkir); } }).catch(() => {});
  }, []);

  // ---- form ----
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [category, setCategory] = useState('');
  const [ongkirTag, setOngkirTag] = useState('Gratis ongkir');
  const [labels, setLabels] = useState([]);
  const [video, setVideo] = useState(['', '', '']);
  const [model3d, setModel3d] = useState(null);
  const [isDisplay, setIsDisplay] = useState(true);
  const [varians, setVarians] = useState([emptyVarian()]);
  const [photos, setPhotos] = useState([]); // [{url}] — url di server (foto draft langsung diupload)
  const [saving, setSaving] = useState(false);
  // ---- draft & autosave ----
  const [searchParams] = useSearchParams();
  const [draftId, setDraftId] = useState(searchParams.get('draft') || null);
  const draftIdRef = useRef(draftId);
  useEffect(() => { draftIdRef.current = draftId; }, [draftId]);
  const [draftStatus, setDraftStatus] = useState(''); // '', 'Menyimpan…', 'Tersimpan HH:MM', 'Gagal'
  const [draftLoaded, setDraftLoaded] = useState(!searchParams.get('draft'));
  const dirtyRef = useRef(false);
  const timerRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const fileRef = useRef(null);
  const glbRef = useRef(null);

  const ongkirOptions = labelMaster.labels.filter((l) => l.type === 'ongkir');
  const labelOptions = labelMaster.labels.filter((l) => l.type === 'label' && l.category === category);
  const prevCatRef = useRef(category);
  useEffect(() => { if (prevCatRef.current && prevCatRef.current !== category) setLabels([]); prevCatRef.current = category; }, [category]); // ganti kategori → label direset

  // muat draft (?draft=id)
  useEffect(() => {
    const id = searchParams.get('draft');
    if (!id) return;
    fetch(`${baseUrl}/products/drafts/get`).then((r) => r.json()).then((rows) => {
      const d = (rows || []).find((x) => x.id === id);
      if (!d) { message.warning('Draft tidak ditemukan'); setDraftId(null); setDraftLoaded(true); return; }
      const dt = d.data || {};
      setJudul(dt.judul || ''); setDeskripsi(dt.deskripsi || ''); setCategory(dt.category || '');
      if (dt.ongkirTag) setOngkirTag(dt.ongkirTag);
      setVideo(Array.isArray(dt.video) && dt.video.length === 3 ? dt.video : ['', '', '']);
      setIsDisplay(dt.isDisplay !== false);
      setVarians(Array.isArray(dt.varians) && dt.varians.length ? dt.varians.map((v) => ({ ...emptyVarian(), ...v, open: false })) : [emptyVarian()]);
      setPhotos((d.photos || []).map((u) => ({ url: u })));
      // labels diset setelah category (efek reset label hanya saat kategori BERUBAH dari nilai sebelumnya)
      setTimeout(() => setLabels(Array.isArray(dt.labels) ? dt.labels : []), 0);
      setDraftLoaded(true);
      setDraftStatus(d.updated_at ? `Tersimpan ${new Date(d.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : '');
    }).catch(() => setDraftLoaded(true));
  }, []);

  // autosave: 1,5 detik setelah perubahan terakhir (setelah draft dimuat). Draft dibuat saat ada isi.
  const draftPayload = () => ({ judul, deskripsi, category, ongkirTag, labels, video, isDisplay, varians: varians.map(({ key, open, ...v }) => v) });
  const hasContent = () => judul.trim() || deskripsi.trim() || category || photos.length || varians.some((v) => v.varian || num(v.jual) > 0);
  const saveDraft = async (photoList) => {
    if (!hasContent() && !draftIdRef.current) return null;
    setDraftStatus('Menyimpan…');
    try {
      const r = await fetch(`${baseUrl}/products/drafts/save`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: draftIdRef.current, uid: user?.uid, data: draftPayload(), photos: (photoList || photos).map((p) => p.url) }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      if (!draftIdRef.current) { draftIdRef.current = d.id; setDraftId(d.id); window.history.replaceState(null, '', `/products/new?draft=${d.id}`); }
      dirtyRef.current = false;
      setDraftStatus(`Tersimpan ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`);
      return d.id;
    } catch (e) { setDraftStatus('Gagal autosave'); return null; }
  };
  useEffect(() => {
    if (!draftLoaded) return;
    dirtyRef.current = true;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { if (dirtyRef.current) saveDraft(); }, 1500);
    return () => clearTimeout(timerRef.current);
  }, [judul, deskripsi, category, ongkirTag, labels, video, isDisplay, varians, photos, draftLoaded]);
  // peringatan kalau tutup tab saat masih ada perubahan yang belum tersimpan
  useEffect(() => {
    const h = (e) => { if (dirtyRef.current && hasContent()) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  });

  // ---- foto: tambah (drop / pilih / paste), hapus, geser urutan ----
  const addFiles = async (incoming) => {
    const files = Array.from(incoming || []).filter((f) => f && ((f.type && f.type.startsWith('image/')) || isHeic(f)));
    if (!files.length) return;
    if (photos.length + files.length > 50) { message.error('Maksimal 50 foto'); return; }
    const hide = message.loading('Mengupload foto…', 0);
    try {
      const compressed = await compressImageFiles(files);
      // pastikan draft ada dulu (foto disimpan ke draft supaya aman kalau tab ditutup)
      let id = draftIdRef.current;
      if (!id) id = await saveDraft([]);
      if (!id) throw new Error('Draft belum bisa dibuat');
      const fd = new FormData();
      compressed.forEach((f) => fd.append('images', f));
      const r = await fetch(`${baseUrl}/products/drafts/${id}/photos`, { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Upload gagal');
      setPhotos((prev) => [...prev, ...(d.urls || []).map((u) => ({ url: u }))]);
    } catch (e) { message.error(e.message); }
    finally { hide(); }
  };
  useEffect(() => {
    const onPaste = (e) => {
      const imgs = Array.from(e.clipboardData?.items || []).filter((it) => it.type.startsWith('image/')).map((it) => it.getAsFile()).filter(Boolean);
      if (imgs.length) { e.preventDefault(); addFiles(imgs); }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  });
  const movePhoto = (from, to) => {
    if (to < 0 || to >= photos.length || from === to) return;
    setPhotos((prev) => { const a = [...prev]; const [x] = a.splice(from, 1); a.splice(to, 0, x); return a; });
  };
  const removePhoto = (i) => setPhotos((prev) => prev.filter((_, j) => j !== i));

  // ---- varian helpers ----
  const setV = (key, patch) => setVarians((prev) => prev.map((v) => (v.key === key ? { ...v, ...patch } : v)));
  const hppOf = (v) => CATEGORIES.reduce((a, c) => a + num(v[c]), 0);
  const totals = useMemo(() => varians.map((v) => { const hpp = hppOf(v); const jual = num(v.jual); return { hpp, jual, margin: jual - hpp, pct: jual > 0 ? ((jual - hpp) / jual) * 100 : 0 }; }), [varians]);

  // ---- simpan ----
  const validate = () => {
    if (!judul.trim()) return 'Judul wajib diisi';
    if (!category) return 'Pilih kategori';
    if (!varians.length) return 'Minimal 1 varian';
    if (varians.some((v) => !v.varian.trim())) return 'Nama varian tidak boleh kosong';
    if (varians.some((v) => num(v.jual) <= 0)) return 'Harga jual tiap varian harus diisi';
    return null;
  };
  const save = async () => {
    const err = validate();
    if (err) { message.warning(err); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('judul', judul.trim());
      fd.append('deskripsi', deskripsi);
      fd.append('category', category);
      video.forEach((v, i) => fd.append(`linkVideo${i + 1}`, v.trim()));
      fd.append('ongkirTag', ongkirTag);
      fd.append('labels', JSON.stringify(labels));
      fd.append('isDisplay', String(isDisplay));
      fd.append('varians', JSON.stringify(varians.map(({ key, open, ...v }) => v)));
      fd.append('existingImages', JSON.stringify(photos.map((p) => p.url)));
      if (draftIdRef.current) fd.append('draftId', draftIdRef.current);
      if (model3d) fd.append('model3d', model3d);
      const r = await fetch(`${baseUrl}/products/create-full`, { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Gagal menyimpan');
      dirtyRef.current = false;
      message.success('Produk tersimpan');
      navigate(`/products?id=${d.insertedId}`);
    } catch (e) { message.error(e.message); }
    finally { setSaving(false); }
  };

  const discardDraft = async () => {
    if (draftIdRef.current) {
      try { await fetch(`${baseUrl}/products/drafts/delete/${draftIdRef.current}`, { method: 'DELETE' }); } catch (e) { /* abaikan */ }
    }
    dirtyRef.current = false;
    navigate('/products');
  };

  // ---- style ----
  const bg = dark ? '#14141f' : '#f5f6fa';
  const card = dark ? '#1e1e2d' : '#fff';
  const border = dark ? '#333' : '#e3e3e3';
  const text = dark ? '#fff' : '#1f2937';
  const muted = dark ? '#9aa0a6' : '#6b7280';
  const input = { width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${border}`, background: dark ? '#2a2a3a' : '#fff', color: text, fontSize: 14, outline: 'none' };
  const th = { card, border, text, muted };
  const btn = (primary) => ({ padding: '8px 14px', borderRadius: 8, border: `1px solid ${primary ? '#013175' : border}`, background: primary ? '#013175' : card, color: primary ? '#fff' : text, cursor: 'pointer', fontSize: 13, fontWeight: primary ? 600 : 400, display: 'inline-flex', alignItems: 'center', gap: 6 });

  return (
    <div style={{ background: bg, minHeight: '100vh', color: text }}>
      {/* header sticky */}
      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: card, borderBottom: `1px solid ${border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button style={btn(false)} onClick={() => navigate('/products')}><FiArrowLeft /> Kembali</button>
        <div style={{ fontWeight: 700, fontSize: 17 }}>Tambah Produk Baru</div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: draftStatus.startsWith('Gagal') ? '#c0392b' : muted }} title="Draft tersimpan otomatis; bisa dilanjutkan dari tombol Draft di halaman Products">
            {draftStatus ? `Draft · ${draftStatus}` : 'Draft otomatis tersimpan'}
          </span>
          {draftId && (
            <Popconfirm title="Buang draft ini? Foto yang sudah diupload ikut dihapus." onConfirm={discardDraft} okText="Buang" cancelText="Batal">
              <button style={{ ...btn(false), color: '#c0392b' }}>Buang draft</button>
            </Popconfirm>
          )}
        </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '18px 16px 80px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 14 }} className="klf-pn-grid">
        <div>
          {/* FOTO */}
          <Section th={th} title="Foto Produk" hint="Foto pertama = foto utama di website. Geser kartu (drag) atau pakai panah untuk mengatur urutan. Bisa drag & drop dari Finder/Photos, klik untuk pilih file, atau paste (Cmd/Ctrl+V). Foto langsung tersimpan ke draft.">
            <div
              onClick={() => fileRef.current && fileRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); if (dragIdx === null) addFiles(e.dataTransfer.files); }}
              style={{ border: `2px dashed ${dragOver ? '#013175' : border}`, background: dragOver ? (dark ? '#22304a' : '#eef3fb') : 'transparent', borderRadius: 12, padding: 18, textAlign: 'center', cursor: 'pointer', color: muted }}
            >
              <FaRegImages size={26} />
              <div style={{ fontSize: 13, marginTop: 6, color: text }}>Drag & drop foto di sini, klik untuk pilih, atau paste</div>
              <div style={{ fontSize: 11 }}>JPG / PNG / HEIC · otomatis dikompres · maks 50 foto</div>
              <input ref={fileRef} type="file" accept="image/*,.heic,.heif" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
            </div>
            {photos.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10, marginTop: 12 }}>
                {photos.map((p, i) => (
                  <div
                    key={p.url}
                    draggable
                    onDragStart={(e) => { setDragIdx(i); e.dataTransfer.effectAllowed = 'move'; }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (dragIdx !== null) movePhoto(dragIdx, i); setDragIdx(null); }}
                    onDragEnd={() => setDragIdx(null)}
                    style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: `2px solid ${i === 0 ? '#013175' : border}`, aspectRatio: '1 / 1', background: '#eee', cursor: 'grab', opacity: dragIdx === i ? 0.4 : 1 }}
                  >
                    <img src={getImageUrl(p.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
                    {i === 0 && <span style={{ position: 'absolute', top: 6, left: 6, fontSize: 10, fontWeight: 700, background: '#013175', color: '#fff', padding: '2px 7px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 3 }}><FaStar size={9} /> Utama</span>}
                    <span style={{ position: 'absolute', bottom: 6, left: 6, fontSize: 10, background: 'rgba(0,0,0,.55)', color: '#fff', padding: '1px 6px', borderRadius: 999 }}>{i + 1}</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); removePhoto(i); }} title="Hapus" style={{ position: 'absolute', top: 6, right: 6, border: 'none', background: 'rgba(220,38,38,.9)', color: '#fff', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiTrash2 size={12} /></button>
                    <div style={{ position: 'absolute', bottom: 6, right: 6, display: 'flex', gap: 3 }}>
                      <button type="button" onClick={(e) => { e.stopPropagation(); movePhoto(i, i - 1); }} disabled={i === 0} style={{ border: 'none', background: 'rgba(0,0,0,.55)', color: '#fff', borderRadius: 6, width: 22, height: 22, cursor: 'pointer', opacity: i === 0 ? .35 : 1 }}><FiChevronLeft size={13} /></button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); movePhoto(i, i + 1); }} disabled={i === photos.length - 1} style={{ border: 'none', background: 'rgba(0,0,0,.55)', color: '#fff', borderRadius: 6, width: 22, height: 22, cursor: 'pointer', opacity: i === photos.length - 1 ? .35 : 1 }}><FiChevronRight size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* INFO */}
          <Section th={th} title="Informasi Produk">
            <Field th={th} label="Judul produk" req><input style={input} value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="mis. Dining Table Set Modern Minimalis - Meja Makan Besi Top Kayu Solid" /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field th={th} label="Kategori" req>
                <Select showSearch optionFilterProp="label" style={{ width: '100%' }} size="large" placeholder="Pilih kategori" value={category || undefined} onChange={setCategory}
                  options={categories.map((c) => ({ value: c.name, label: c.name }))} />
              </Field>
              <Field th={th} label="Tag ongkir" req>
                <Select style={{ width: '100%' }} size="large" value={ongkirTag} onChange={setOngkirTag} options={ongkirOptions.map((o) => ({ value: o.name, label: o.name }))} />
              </Field>
            </div>
            <Field th={th} label={`Label produk${category ? ` (${category})` : ''}`}>
              <Select mode="multiple" size="large" style={{ width: '100%' }} value={labels} onChange={setLabels} disabled={!category}
                placeholder={!category ? 'Pilih kategori dulu' : labelOptions.length ? 'Pilih label (bisa lebih dari satu)' : 'Belum ada label untuk kategori ini — tambah lewat ⚙ Label di halaman Products'}
                options={labelOptions.map((o) => ({ value: o.name, label: o.name }))} />
            </Field>
            <Field th={th} label="Deskripsi">
              <textarea style={{ ...input, minHeight: 220, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} placeholder={'DETAIL PRODUK :\nDimensi : ...\nMaterial : ...\nFinishing : ...'} />
            </Field>
          </Section>

          {/* VARIAN */}
          <Section th={th} title="Varian, Harga & Costing" hint="Tiap varian punya harga jual sendiri. Buka 'Costing' untuk isi biaya per kategori — HPP & margin dihitung otomatis (patokan jual = HPP ÷ 0,7 untuk margin 30%).">
            {varians.map((v, i) => {
              const t = totals[i];
              const okMargin = t.hpp > 0 && t.margin >= 0;
              return (
                <div key={v.key} style={{ border: `1px solid ${border}`, borderRadius: 10, padding: 12, marginBottom: 10, background: dark ? '#232334' : '#fafbfd' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr auto', gap: 10, alignItems: 'end' }}>
                    <Field th={th} label={`Varian ${i + 1}`} req><input style={input} value={v.varian} onChange={(e) => setV(v.key, { varian: e.target.value })} placeholder="mis. Meja 160x90 / 3 Seater" /></Field>
                    <Field th={th} label="Harga jual" req>
                      <NumericFormat customInput={PlainInput} style={input} value={v.jual} thousandSeparator="." decimalSeparator="," prefix="Rp "
                        placeholder={t.hpp > 0 ? `patokan ${rp(Math.round(t.hpp / 0.7))}` : 'Rp'} onValueChange={(vals) => setV(v.key, { jual: vals.value })} />
                    </Field>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                      <button type="button" style={btn(false)} title="Duplikat varian" onClick={() => setVarians((prev) => { const a = [...prev]; a.splice(i + 1, 0, { ...v, key: Math.random().toString(36).slice(2), varian: `${v.varian} (copy)` }); return a; })}><FiCopy /></button>
                      <Popconfirm title="Hapus varian ini?" onConfirm={() => setVarians((prev) => prev.filter((x) => x.key !== v.key))} okText="Hapus" cancelText="Batal" disabled={varians.length === 1}>
                        <button type="button" style={{ ...btn(false), color: '#c0392b', opacity: varians.length === 1 ? .4 : 1 }} disabled={varians.length === 1}><FiTrash2 /></button>
                      </Popconfirm>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', fontSize: 13 }}>
                    <button type="button" style={{ ...btn(false), padding: '5px 10px' }} onClick={() => setV(v.key, { open: !v.open })}>{v.open ? '▾' : '▸'} Costing</button>
                    <span style={{ color: muted }}>HPP <b style={{ color: t.hpp > 0 ? text : '#c0392b' }}>{t.hpp > 0 ? rp(t.hpp) : 'belum diisi'}</b></span>
                    {t.hpp > 0 && t.jual > 0 && <span style={{ color: muted }}>Margin <b style={{ color: okMargin ? '#1e7b34' : '#c0392b' }}>{rp(t.margin)} ({t.pct.toFixed(1)}%)</b></span>}
                  </div>
                  {v.open && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginTop: 10 }}>
                      {CATEGORIES.map((c) => (
                        <label key={c}>
                          <div style={{ fontSize: 11, color: muted, marginBottom: 2 }}>{CAT_LABEL[c]}</div>
                          <NumericFormat customInput={PlainInput} style={{ ...input, padding: '6px 8px', fontSize: 13 }} value={v[c]} thousandSeparator="." decimalSeparator="," placeholder="0" onValueChange={(vals) => setV(v.key, { [c]: vals.value })} />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <button type="button" style={btn(false)} onClick={() => setVarians((prev) => [...prev, emptyVarian()])}><FiPlus /> Tambah varian</button>
          </Section>
        </div>

        {/* kolom kanan */}
        <div>
          <Section th={th} title="Video & 3D" hint="Opsional. Link YouTube/TikTok/IG dan file 3D (.glb) untuk viewer AR di website.">
            {video.map((v, i) => (
              <Field th={th} key={i} label={`Link video ${i + 1}`}><input style={input} value={v} onChange={(e) => setVideo((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))} placeholder="https://…" /></Field>
            ))}
            <Field th={th} label="3D Model (.glb) — tidak ikut draft, pilih saat akan simpan">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button type="button" style={btn(false)} onClick={() => glbRef.current && glbRef.current.click()}>Pilih file</button>
                <span style={{ fontSize: 12, color: muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{model3d ? model3d.name : 'Belum ada'}</span>
                {model3d && <button type="button" style={{ ...btn(false), color: '#c0392b', padding: '4px 8px' }} onClick={() => setModel3d(null)}><FiTrash2 /></button>}
                <input ref={glbRef} type="file" accept=".glb" hidden onChange={(e) => { setModel3d(e.target.files[0] || null); e.target.value = ''; }} />
              </div>
            </Field>
          </Section>

          <Section th={th} title="Ringkasan">
            <div style={{ fontSize: 13, display: 'grid', gap: 6 }}>
              <div><span style={{ color: muted }}>Foto:</span> {photos.length}</div>
              <div><span style={{ color: muted }}>Kategori:</span> {category || '-'}</div>
              <div><span style={{ color: muted }}>Ongkir:</span> {ongkirTag}</div>
              <div><span style={{ color: muted }}>Label:</span> {labels.length ? labels.join(', ') : '-'}</div>
              <div><span style={{ color: muted }}>Varian:</span> {varians.length}</div>
              <div><span style={{ color: muted }}>Harga:</span> {(() => { const j = totals.map((t) => t.jual).filter((x) => x > 0); return j.length ? (Math.min(...j) === Math.max(...j) ? rp(j[0]) : `${rp(Math.min(...j))} – ${rp(Math.max(...j))}`) : '-'; })()}</div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 14, padding: '10px 12px', border: `1px solid ${border}`, borderRadius: 10, cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Tampil di website</div>
                <div style={{ fontSize: 11, color: muted }}>{isDisplay ? 'Produk langsung terlihat customer setelah disimpan' : 'Disimpan sebagai hidden — bisa ditampilkan nanti'}</div>
              </div>
              <Switch checked={isDisplay} onChange={setIsDisplay} />
            </label>
            <button style={{ ...btn(true), width: '100%', justifyContent: 'center', marginTop: 10, padding: '11px 14px', fontSize: 14 }} disabled={saving} onClick={save}>{saving ? 'Menyimpan…' : 'Simpan Produk'}</button>
          </Section>
        </div>
      </div>
      <style>{`@media (max-width: 900px) { .klf-pn-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
};

export default ProductNew;
