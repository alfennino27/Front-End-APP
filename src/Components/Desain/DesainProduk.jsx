import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Drawer, Image, Select, message, Popconfirm, Modal } from 'antd';
import { FiPlus, FiTrash2, FiUpload, FiFileText, FiBox, FiCheck, FiRotateCcw, FiArchive, FiEdit2, FiExternalLink, FiSearch } from 'react-icons/fi';
import { FaRegImages } from 'react-icons/fa';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useTheme } from '../../ThemeContext';
import { compressImageFiles } from '../../Utils/compressImage';
import { getImageUrl } from '../../Utils/image';
import { isHeic } from '../../Utils/heic';

/**
 * Arsip Desain Produk (/desain) — desainer upload desain produk buatan sendiri (foto + 3D .glb
 * untuk halaman produk, gambar kerja PDF untuk arsip internal). Kurator (menu "Kurasi Desain")
 * memilih: Layak → lanjut isi produk di /products/new (draft), Revisi → desainer upload versi
 * baru, Arsip → tetap tersimpan. Backend: KLF-Server-main/routes/desain/desain.js.
 * Sumber kedua: hasil produksi yang belum ada di katalog (?dariProject=<Projects.id> dari /hasil-produksi).
 * Foto real project hanya referensi — yang diupload & dipakai website = foto katalog.
 */
const STATUS = {
  foto: { label: 'Perlu Foto Katalog', color: '#1d4ed8', bg: '#dbeafe' },
  review: { label: 'Menunggu Review', color: '#b45309', bg: '#fef3c7' },
  revisi: { label: 'Revisi', color: '#b91c1c', bg: '#fee2e2' },
  layak: { label: 'Layak', color: '#15803d', bg: '#dcfce7' },
  arsip: { label: 'Arsip', color: '#4b5563', bg: '#e5e7eb' },
};
const TABS = ['foto', 'review', 'revisi', 'layak', 'arsip', 'semua'];
const SUMBER = { desain: 'Desain', produksi: 'Hasil Produksi' };
const rupiah = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;
// Foto real dari project asal (referensi untuk kurator & yang membuat foto katalog)
const RefProduksi = ({ th, baseUrl, projectIds }) => {
  const [data, setData] = useState([]);
  useEffect(() => {
    Promise.all((projectIds || []).map((id) => axios.get(`${baseUrl}/hasil-produksi/project/${id}`).then((r) => r.data).catch(() => null)))
      .then((xs) => setData(xs.filter(Boolean)));
  }, [(projectIds || []).join(',')]);
  if (!data.length) return null;
  return (
    <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
      <div style={{ fontWeight: 700 }}>Hasil produksi asal</div>
      <div style={{ fontSize: 12, color: th.muted, marginBottom: 8 }}>Foto real — hanya referensi, tidak dipakai sebagai foto katalog.</div>
      {data.map((p) => (
        <div key={p.id} style={{ marginBottom: 10 }}>
          <a href={`/project/${p.id}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#013175', display: 'flex', alignItems: 'center', gap: 4 }}>{p.NamaBarang} · {p.Buyer} · {p.KodeInvoice} <FiExternalLink /></a>
          <div style={{ fontSize: 12, color: th.muted, margin: '2px 0 6px' }}>Harga jual {rupiah(p.Harga)}</div>
          <Image.PreviewGroup>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 6 }}>
              {p.foto.slice(0, 12).map((u, i) => (
                <div key={`${u}-${i}`} style={{ aspectRatio: '1/1', borderRadius: 8, overflow: 'hidden', background: '#eee' }}>
                  <Image src={thumb(u, 200)} preview={{ src: fileUrl(u) }} width="100%" height="100%" style={{ objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </Image.PreviewGroup>
        </div>
      ))}
    </div>
  );
};
const MAX_GLB = 200 * 1024 * 1024;

const lastVer = (d) => (d.versions || [])[d.versions.length - 1] || {};
const judulDesain = (d) => d.nama || `Desain ${d.category || ''}`.trim();
const tgl = (x) => (x ? new Date(x).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const fileUrl = (u) => getImageUrl(u);
const thumb = (u, w = 400) => {
  if (!u || !u.startsWith('/uploads')) return getImageUrl(u);
  const origin = getImageUrl(u).slice(0, -u.length);
  return `${origin}/img?src=${encodeURIComponent(u)}&w=${w}`;
};

// <model-viewer> (Google) dimuat sekali saat pertama kali ada file 3D yang dibuka
let mvLoading = null;
const loadModelViewer = () => {
  if (window.customElements?.get('model-viewer')) return Promise.resolve();
  if (!mvLoading) {
    mvLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.type = 'module';
      s.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js';
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  return mvLoading;
};
const Viewer3D = ({ src }) => {
  const [ready, setReady] = useState(!!window.customElements?.get('model-viewer'));
  useEffect(() => { loadModelViewer().then(() => setReady(true)).catch(() => {}); }, []);
  if (!ready) return <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 13 }}>Memuat viewer 3D…</div>;
  return React.createElement('model-viewer', { src, 'camera-controls': true, 'auto-rotate': true, 'shadow-intensity': '1', 'touch-action': 'pan-y', style: { width: '100%', height: 300, background: '#f3f4f6', borderRadius: 12 } });
};

const useIsMobile = () => {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => { const h = () => setM(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return m;
};

// ================= Form upload (desain baru / versi baru) =================
const UploadForm = ({ th, baseUrl, user, categories, target, prefill, onDone, onCancel }) => {
  const isNew = !target; // target = dokumen desain kalau upload versi baru
  const dariProduksi = isNew ? prefill?.sumber === 'produksi' : target?.sumber === 'produksi';
  const [nama, setNama] = useState(prefill?.nama || '');
  const [category, setCategory] = useState(prefill?.category || '');
  // pengajuan hasil produksi (Nanen): cukup nama + kategori + catatan; foto katalog dibuat desainer belakangan
  const ajukan = isNew && dariProduksi;
  const [catatan, setCatatan] = useState('');
  const [photos, setPhotos] = useState([]); // {key, url, preview, pct, err}
  const [model, setModel] = useState(null); // {url, nama, pct, err}
  const [pdfs, setPdfs] = useState([]); // {key, url, nama, pct, err}
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const photoRef = useRef(null); const glbRef = useRef(null); const pdfRef = useRef(null);

  const kirim = (file, kind, onPct) => {
    const fd = new FormData();
    fd.append('file', file);
    return axios.post(`${baseUrl}/desain/upload?kind=${kind}`, fd, {
      onUploadProgress: (e) => onPct(e.total ? Math.round((e.loaded / e.total) * 100) : 50),
    }).then((r) => r.data);
  };
  const key = () => Math.random().toString(36).slice(2);

  const addPhotos = async (incoming) => {
    const files = Array.from(incoming || []).filter((f) => (f.type && f.type.startsWith('image/')) || isHeic(f));
    if (!files.length) return;
    const compressed = await compressImageFiles(files);
    for (const f of compressed) {
      const k = key();
      setPhotos((p) => [...p, { key: k, preview: URL.createObjectURL(f), pct: 0 }]);
      const upd = (patch) => setPhotos((p) => p.map((x) => (x.key === k ? { ...x, ...patch } : x)));
      kirim(f, 'image', (pct) => upd({ pct }))
        .then((d) => upd({ url: d.url, pct: 100 }))
        .catch((e) => upd({ err: e.response?.data?.message || 'Gagal' }));
    }
  };
  const addModel = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.glb')) { message.warning('File 3D harus berformat .glb'); return; }
    if (file.size > MAX_GLB) { message.warning('File 3D maksimal 200 MB'); return; }
    setModel({ nama: file.name, pct: 0 });
    kirim(file, 'model', (pct) => setModel((m) => (m ? { ...m, pct } : m)))
      .then((d) => setModel((m) => (m ? { ...m, url: d.url, pct: 100 } : m)))
      .catch((e) => setModel((m) => (m ? { ...m, err: e.response?.data?.message || 'Gagal' } : m)));
  };
  const addPdfs = (incoming) => {
    Array.from(incoming || []).forEach((file) => {
      const k = key();
      setPdfs((p) => [...p, { key: k, nama: file.name, pct: 0 }]);
      const upd = (patch) => setPdfs((p) => p.map((x) => (x.key === k ? { ...x, ...patch } : x)));
      kirim(file, 'pdf', (pct) => upd({ pct }))
        .then((d) => upd({ url: d.url, pct: 100 }))
        .catch((e) => upd({ err: e.response?.data?.message || 'Gagal' }));
    });
  };

  const uploading = photos.some((p) => !p.url && !p.err) || (model && !model.url && !model.err) || pdfs.some((p) => !p.url && !p.err);
  const submit = async () => {
    if (isNew && !category) { message.warning('Pilih kategori produk'); return; }
    const okPhotos = photos.filter((p) => p.url).map((p) => p.url);
    if (!ajukan && !okPhotos.length) { message.warning(dariProduksi ? 'Minimal 1 foto katalog' : 'Minimal 1 foto desain'); return; }
    if (uploading) { message.info('Tunggu upload selesai'); return; }
    setSaving(true);
    try {
      const files = { photos: okPhotos, model3d: model?.url || null, gambarKerja: pdfs.filter((p) => p.url).map((p) => ({ url: p.url, nama: p.nama })), catatan, uid: user?.uid, designer: user?.displayName || '' };
      if (isNew) await axios.post(`${baseUrl}/desain/create`, { ...files, nama, category, sumber: prefill?.sumber || 'desain', projectIds: prefill?.projectIds || [] });
      else await axios.post(`${baseUrl}/desain/${target.id}/version`, files);
      message.success(ajukan ? 'Diajukan — menunggu foto katalog dari desainer' : isNew ? 'Desain terkirim — menunggu review' : 'Foto terkirim — menunggu review');
      onDone();
    } catch (e) { message.error(e.response?.data?.message || e.message); }
    finally { setSaving(false); }
  };

  const input = { width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${th.border}`, background: th.input, color: th.text, fontSize: 15, outline: 'none' };
  const lbl = (t, req) => <div style={{ fontSize: 12, fontWeight: 600, color: th.muted, margin: '0 0 4px' }}>{t}{req && <span style={{ color: '#c0392b' }}> *</span>}</div>;
  const box = { border: `1px solid ${th.border}`, borderRadius: 14, padding: 14, marginBottom: 14, background: th.card };
  const bar = (pct, err) => (err ? <div style={{ fontSize: 11, color: '#c0392b' }}>{err}</div>
    : pct < 100 ? <div style={{ height: 4, background: th.border, borderRadius: 4, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: '#013175' }} /></div> : null);

  return (
    <div style={{ paddingBottom: 90 }}>
      {isNew ? (
        <div style={box}>
          <div style={{ marginBottom: 12 }}>{lbl('Kategori produk', true)}
            <Select showSearch optionFilterProp="label" size="large" style={{ width: '100%' }} placeholder="Pilih kategori (sesuai katalog)" value={category || undefined} onChange={setCategory}
              options={categories.map((c) => ({ value: c.name, label: c.name }))} />
          </div>
          <div style={{ marginBottom: 12 }}>{lbl('Nama / kode desain')}<input style={input} value={nama} onChange={(e) => setNama(e.target.value)} placeholder="mis. Kursi Makan Lengkung Rotan" /></div>
        </div>
      ) : (
        <div style={{ ...box, fontSize: 13 }}>
          {dariProduksi && !(target.versions || []).length ? <>Foto katalog untuk <b>{judulDesain(target)}</b>.</> : <>Versi baru untuk <b>{judulDesain(target)}</b> (v{(target.versions || []).length + 1}).</>}
          {(() => { const r = [...(target.reviews || [])].reverse().find((x) => x.action === 'revisi'); return r ? <div style={{ marginTop: 8, padding: 10, borderRadius: 10, background: '#fee2e2', color: '#7f1d1d' }}>Catatan revisi: {r.catatan}</div> : null; })()}
        </div>
      )}

      {dariProduksi && <RefProduksi th={th} baseUrl={baseUrl} projectIds={isNew ? prefill?.projectIds : target?.projectIds} />}
      {ajukan && <div style={{ ...box, fontSize: 13, color: th.muted }}>Setelah diajukan, desainer (Pakde / Azwad / Nino) membuat & mengupload <b style={{ color: th.text }}>foto katalog</b>-nya di sini, lalu dikurasi sebelum tampil di website.</div>}

      {/* bagian 1: bahan halaman produk */}
      {!ajukan && <div style={box}>
        <div style={{ fontWeight: 700, color: th.text }}>1 · {dariProduksi ? 'Foto Katalog' : 'Foto & 3D untuk Produk'}{dariProduksi && <span style={{ color: '#c0392b' }}> *</span>}</div>
        <div style={{ fontSize: 12, color: th.muted, marginBottom: 10 }}>{dariProduksi
          ? 'Foto format katalog (latar bersih / render), BUKAN foto real — supaya website tetap rapi. Foto pertama = foto utama.'
          : 'Kalau disetujui, foto & 3D ini dipakai di halaman produk website. Foto pertama = foto utama.'}</div>
        <div onClick={() => photoRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); addPhotos(e.dataTransfer.files); }}
          style={{ border: `2px dashed ${dragOver ? '#013175' : th.border}`, borderRadius: 12, padding: 18, textAlign: 'center', cursor: 'pointer', color: th.muted }}>
          <FaRegImages size={26} />
          <div style={{ fontSize: 14, marginTop: 6, color: th.text }}>{dariProduksi ? 'Tambah foto katalog' : 'Tambah foto desain'}</div>
          <div style={{ fontSize: 11 }}>Bebas berapa pun · JPG / PNG / HEIC</div>
          <input ref={photoRef} type="file" accept="image/*,.heic,.heif" multiple hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = ''; }} />
        </div>
        {photos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8, marginTop: 10 }}>
            {photos.map((p, i) => (
              <div key={p.key} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 10, overflow: 'hidden', border: `2px solid ${i === 0 ? '#013175' : th.border}`, background: '#eee' }}>
                <img src={p.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: p.url ? 1 : 0.5 }} />
                <div style={{ position: 'absolute', left: 4, right: 4, bottom: 4 }}>{bar(p.pct, p.err)}</div>
                <button type="button" onClick={() => setPhotos((x) => x.filter((y) => y.key !== p.key))} style={{ position: 'absolute', top: 4, right: 4, border: 'none', background: 'rgba(220,38,38,.9)', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiTrash2 size={12} /></button>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 14 }}>{lbl('File 3D (.glb) — bisa diputar di halaman produk')}
          {model ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, border: `1px solid ${th.border}`, borderRadius: 10 }}>
              <FiBox size={20} color="#013175" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: th.text }}>{model.nama}</div>
                {bar(model.pct, model.err)}{!model.err && model.pct < 100 && <div style={{ fontSize: 11, color: th.muted }}>{model.pct}%</div>}
              </div>
              <button type="button" onClick={() => setModel(null)} style={{ border: 'none', background: 'none', color: '#c0392b', padding: 6 }}><FiTrash2 /></button>
            </div>
          ) : (
            <button type="button" onClick={() => glbRef.current?.click()} style={{ width: '100%', padding: 12, borderRadius: 10, border: `1px dashed ${th.border}`, background: 'transparent', color: th.text, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><FiBox /> Pilih file .glb</button>
          )}
          <input ref={glbRef} type="file" accept=".glb" hidden onChange={(e) => { addModel(e.target.files[0]); e.target.value = ''; }} />
        </div>
      </div>}

      {/* bagian 2: gambar kerja (arsip internal) */}
      {!ajukan && <div style={box}>
        <div style={{ fontWeight: 700, color: th.text }}>2 · Gambar Kerja</div>
        <div style={{ fontSize: 12, color: th.muted, marginBottom: 10 }}>PDF gambar kerja / teknik. Tetap di arsip desain, tidak tampil di website.</div>
        {pdfs.map((p) => (
          <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, border: `1px solid ${th.border}`, borderRadius: 10, marginBottom: 8 }}>
            <FiFileText size={20} color="#b91c1c" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: th.text }}>{p.nama}</div>
              {bar(p.pct, p.err)}
            </div>
            <button type="button" onClick={() => setPdfs((x) => x.filter((y) => y.key !== p.key))} style={{ border: 'none', background: 'none', color: '#c0392b', padding: 6 }}><FiTrash2 /></button>
          </div>
        ))}
        <button type="button" onClick={() => pdfRef.current?.click()} style={{ width: '100%', padding: 12, borderRadius: 10, border: `1px dashed ${th.border}`, background: 'transparent', color: th.text, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><FiFileText /> Tambah gambar kerja (PDF)</button>
        <input ref={pdfRef} type="file" accept="application/pdf,.pdf,image/jpeg,image/png" multiple hidden onChange={(e) => { addPdfs(e.target.files); e.target.value = ''; }} />
      </div>}

      <div style={box}>{lbl(ajukan ? 'Catatan untuk desainer (opsional)' : 'Catatan untuk kurator')}
        <textarea style={{ ...input, minHeight: 80, fontFamily: 'inherit', resize: 'vertical' }} value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder={ajukan ? 'mis. warna rangka hitam, kain abu, perlu tampak depan & samping' : isNew ? 'Ide desain, finishing yang disarankan, dll.' : 'Apa yang diubah di versi ini?'} />
      </div>

      <div style={{ position: 'sticky', bottom: 0, display: 'flex', gap: 10, padding: '12px 0', background: th.bg }}>
        <button type="button" onClick={onCancel} style={{ flex: 1, padding: 13, borderRadius: 12, border: `1px solid ${th.border}`, background: th.card, color: th.text, fontSize: 15 }}>Batal</button>
        <button type="button" onClick={submit} disabled={saving} style={{ flex: 2, padding: 13, borderRadius: 12, border: 'none', background: uploading ? '#6b7fa3' : '#013175', color: '#fff', fontSize: 15, fontWeight: 600 }}>
          {saving ? 'Mengirim…' : uploading ? 'Mengupload…' : ajukan ? 'Ajukan — butuh foto katalog' : isNew ? 'Kirim Desain' : (dariProduksi && !(target.versions || []).length ? 'Kirim Foto Katalog' : 'Kirim Versi Baru')}
        </button>
      </div>
    </div>
  );
};

// ================= Halaman utama =================
const DesainProduk = () => {
  const baseUrl = getApiBaseUrl();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { globalTheme } = useTheme();
  const dark = globalTheme !== 'light';
  const isMobile = useIsMobile();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const uid = user?.uid;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [kurator, setKurator] = useState(false);
  const [tab, setTab] = useState(null);
  const [fKat, setFKat] = useState('');
  const [fDes, setFDes] = useState('');
  const [fSumber, setFSumber] = useState('');
  const [prefill, setPrefill] = useState(null); // isi awal form dari hasil produksi
  const [q, setQ] = useState('');
  const [form, setForm] = useState(null); // null | 'new' | dokumen desain (versi baru)
  const [selV, setSelV] = useState(null);
  const [editInfo, setEditInfo] = useState(null);
  const [aksi, setAksi] = useState(null); // {action:'revisi'|'arsip', catatan}
  const [busy, setBusy] = useState(false);
  const selId = params.get('id');

  const load = () => axios.get(`${baseUrl}/desain/get`).then((r) => setRows(Array.isArray(r.data) ? r.data : [])).catch(() => message.error('Gagal memuat desain')).finally(() => setLoading(false));
  useEffect(() => {
    if (!user) { window.location.replace('/login'); return; }
    load();
    axios.get(`${baseUrl}/products/category/get`).then((r) => setCategories(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${baseUrl}/desain/badge`, { params: { uid } }).then((r) => { setKurator(!!r.data.kurator); setTab((t) => t || (r.data.kurator ? 'review' : 'semua')); }).catch(() => setTab((t) => t || 'semua'));
    // diajukan dari /hasil-produksi → buka form terisi data project
    const dari = params.get('dariProject');
    if (dari) {
      axios.get(`${baseUrl}/hasil-produksi/project/${dari}`).then(({ data: p }) => {
        setPrefill({ sumber: 'produksi', projectIds: [p.id], nama: p.NamaBarang, category: p.KategoriProduk });
        setForm('new'); setParams({});
      }).catch(() => message.error('Project tidak ditemukan'));
    }
  }, []);

  const sel = rows.find((r) => r.id === selId) || null;
  useEffect(() => { if (sel) setSelV(sel.approvedVersion || lastVer(sel).v); setEditInfo(null); }, [selId, sel?.versions?.length]);
  const openDetail = (id) => setParams(id ? { id } : {});

  const counts = useMemo(() => TABS.reduce((a, t) => ({ ...a, [t]: t === 'semua' ? rows.length : rows.filter((r) => r.status === t).length }), {}), [rows]);
  const designers = useMemo(() => [...new Set(rows.map((r) => r.designer).filter(Boolean))].sort(), [rows]);
  const list = useMemo(() => rows.filter((r) => (tab === 'semua' || !tab || r.status === tab)
    && (!fKat || r.category === fKat) && (!fDes || r.designer === fDes) && (!fSumber || (r.sumber || 'desain') === fSumber)
    && (!q || `${r.nama} ${r.category} ${r.designer}`.toLowerCase().includes(q.toLowerCase()))), [rows, tab, fKat, fDes, fSumber, q]);
  // desain dikelompokkan per kategori → "folder" rapi
  const grouped = useMemo(() => {
    const m = {};
    list.forEach((r) => { (m[r.category || 'Tanpa kategori'] = m[r.category || 'Tanpa kategori'] || []).push(r); });
    return Object.entries(m).sort((a, b) => a[0].localeCompare(b[0]));
  }, [list]);

  // ---- aksi ----
  const kirimReview = async (action, catatan) => {
    setBusy(true);
    try {
      await axios.post(`${baseUrl}/desain/${sel.id}/review`, { uid, action, catatan, v: selV });
      message.success(action === 'revisi' ? 'Dikembalikan ke desainer untuk revisi' : action === 'arsip' ? 'Disimpan di arsip' : 'Dikembalikan ke Menunggu Review');
      setAksi(null); await load();
    } catch (e) { message.error(e.response?.data?.message || e.message); }
    finally { setBusy(false); }
  };
  const layak = async (v) => {
    setBusy(true);
    try {
      const r = await axios.post(`${baseUrl}/desain/${sel.id}/layak`, { uid, v });
      navigate(`/products/new?draft=${r.data.draftId}`);
    } catch (e) { message.error(e.response?.data?.message || e.message); setBusy(false); }
  };
  const simpanInfo = async () => {
    try { await axios.put(`${baseUrl}/desain/${sel.id}/info`, editInfo); message.success('Info desain tersimpan'); setEditInfo(null); load(); }
    catch (e) { message.error(e.response?.data?.message || e.message); }
  };
  const hapus = async () => {
    try { await axios.delete(`${baseUrl}/desain/${sel.id}`, { params: { uid } }); message.success('Desain dihapus'); openDetail(null); load(); }
    catch (e) { message.error(e.response?.data?.message || e.message); }
  };

  // ---- style ----
  const th = {
    bg: dark ? '#14141f' : '#f5f6fa', card: dark ? '#1e1e2d' : '#fff', border: dark ? '#333' : '#e3e3e3',
    text: dark ? '#fff' : '#1f2937', muted: dark ? '#9aa0a6' : '#6b7280', input: dark ? '#2a2a3a' : '#fff',
  };
  const chip = (active) => ({ padding: '8px 14px', borderRadius: 999, border: `1px solid ${active ? '#013175' : th.border}`, background: active ? '#013175' : th.card, color: active ? '#fff' : th.text, fontSize: 13, whiteSpace: 'nowrap', cursor: 'pointer' });
  const pill = (s) => ({ fontSize: 11, fontWeight: 700, color: STATUS[s]?.color, background: STATUS[s]?.bg, padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap' });
  const btn = (bg, color = '#fff') => ({ flex: 1, padding: '12px 10px', borderRadius: 12, border: bg === 'none' ? `1px solid ${th.border}` : 'none', background: bg === 'none' ? th.card : bg, color: bg === 'none' ? th.text : color, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' });
  const drawerProps = isMobile ? { placement: 'bottom', height: '94%' } : { placement: 'right', width: 720 };
  const drawerStyles = { body: { background: th.bg, padding: 16 }, header: { background: th.card, color: th.text } };

  const ver = sel ? (sel.versions || []).find((v) => v.v === selV) || lastVer(sel) : null;
  const hasVer = !!(sel?.versions || []).length;
  // pengajuan hasil produksi yang belum ada foto: semua desainer boleh upload foto katalognya
  const bisaVersiBaru = sel && !sel.productId && sel.status !== 'layak' && (sel.uid === uid || kurator || sel.status === 'foto');
  const bisaHapus = sel && !sel.productId && (sel.uid === uid || kurator);
  const riwayat = sel ? [
    ...(sel.sumber === 'produksi' ? [{ at: sel.created_at, text: `${sel.designer || 'Admin'} mengajukan dari hasil produksi`, catatan: sel.catatanPengajuan }] : []),
    ...(sel.versions || []).map((v) => ({ at: v.created_at, text: `${v.designer || 'Desainer'} upload ${sel.sumber === 'produksi' ? 'foto katalog ' : ''}v${v.v}`, catatan: v.catatan })),
    ...(sel.reviews || []).map((r) => ({ at: r.at, text: `${r.nama || 'Kurator'}: ${{ layak: 'Tambah produk', revisi: 'Minta revisi', arsip: 'Arsipkan', review: 'Kembalikan ke review' }[r.action]}${r.v ? ` (v${r.v})` : ''}`, catatan: r.catatan, action: r.action })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at)) : [];

  return (
    <div style={{ background: th.bg, minHeight: '100vh', color: th.text }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 16px 100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>Desain Produk</div>
            <div style={{ fontSize: 12, color: th.muted }}>Arsip desain buatan tim KLF · {kurator ? 'kamu kurator' : 'upload desainmu di sini'}</div>
          </div>
          {!isMobile && <button type="button" onClick={() => setForm('new')} style={{ ...btn('#013175'), flex: 'none', padding: '10px 16px' }}><FiPlus /> Upload Desain</button>}
        </div>

        {/* tab status */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 8 }}>
          {TABS.map((t) => (
            <button key={t} type="button" style={chip(tab === t)} onClick={() => setTab(t)}>
              {t === 'semua' ? 'Semua' : STATUS[t].label} <b style={{ marginLeft: 4 }}>{counts[t]}</b>
            </button>
          ))}
        </div>
        {/* filter */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          <div style={{ position: 'relative', gridColumn: isMobile ? '1 / -1' : 'auto' }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: 13, color: th.muted }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, kategori…" style={{ width: '100%', padding: '10px 12px 10px 34px', borderRadius: 10, border: `1px solid ${th.border}`, background: th.input, color: th.text, fontSize: 14, outline: 'none' }} />
          </div>
          <Select allowClear size="large" placeholder="Kategori" value={fKat || undefined} onChange={(v) => setFKat(v || '')} options={[...new Set(rows.map((r) => r.category).filter(Boolean))].sort().map((c) => ({ value: c, label: c }))} />
          <Select allowClear size="large" placeholder="Desainer" value={fDes || undefined} onChange={(v) => setFDes(v || '')} options={designers.map((d) => ({ value: d, label: d }))} />
          <Select allowClear size="large" placeholder="Sumber" value={fSumber || undefined} onChange={(v) => setFSumber(v || '')} options={Object.entries(SUMBER).map(([value, label]) => ({ value, label }))} style={isMobile ? { gridColumn: '1 / -1' } : undefined} />
        </div>

        {loading ? <div style={{ color: th.muted, padding: 30, textAlign: 'center' }}>Memuat…</div>
          : !list.length ? (
            <div style={{ color: th.muted, padding: 40, textAlign: 'center', border: `1px dashed ${th.border}`, borderRadius: 14 }}>
              {rows.length ? 'Tidak ada desain di filter ini.' : 'Belum ada desain. Upload desain pertama dengan tombol "Upload Desain".'}
            </div>
          ) : grouped.map(([kat, items]) => (
            <div key={kat} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: th.muted, margin: '4px 2px 8px' }}>📁 {kat} <span style={{ fontWeight: 400 }}>· {items.length}</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 150 : 190}px, 1fr))`, gap: 10 }}>
                {items.map((r) => {
                  const lv = lastVer(r);
                  const cover = (r.versions || []).find((v) => v.v === r.approvedVersion)?.photos?.[0] || lv.photos?.[0];
                  return (
                    <div key={r.id} onClick={() => openDetail(r.id)} style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 14, overflow: 'hidden', cursor: 'pointer' }}>
                      <div style={{ position: 'relative', aspectRatio: '1/1', background: '#eee' }}>
                        {cover && <img src={thumb(cover)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                        <span style={{ ...pill(r.status), position: 'absolute', top: 8, left: 8 }}>{STATUS[r.status]?.label}{r.status === 'layak' && !r.productId ? ' · draft' : ''}</span>
                        {!cover && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 12, textAlign: 'center', padding: 10 }}><FaRegImages size={22} style={{ marginRight: 6 }} /> Belum ada foto katalog</div>}
                        {lv.v && <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 11, fontWeight: 700, background: 'rgba(0,0,0,.6)', color: '#fff', padding: '2px 7px', borderRadius: 999 }}>v{lv.v}</span>}
                        <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 4 }}>
                          {lv.model3d && <span title="Ada file 3D" style={{ background: 'rgba(0,0,0,.6)', color: '#fff', borderRadius: 6, padding: '3px 5px', display: 'flex' }}><FiBox size={12} /></span>}
                          {(lv.gambarKerja || []).length > 0 && <span title="Ada gambar kerja" style={{ background: 'rgba(0,0,0,.6)', color: '#fff', borderRadius: 6, padding: '3px 5px', display: 'flex' }}><FiFileText size={12} /></span>}
                          {r.sumber === 'produksi' && <span title="Dari hasil produksi" style={{ background: 'rgba(29,78,216,.9)', color: '#fff', borderRadius: 6, padding: '2px 6px', fontSize: 10, fontWeight: 700 }}>Produksi</span>}
                        </div>
                      </div>
                      <div style={{ padding: '8px 10px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{judulDesain(r)}</div>
                        <div style={{ fontSize: 11, color: th.muted }}>{r.designer || '-'} · {tgl(r.updated_at)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>

      {/* tombol upload melayang di HP */}
      {isMobile && !sel && !form && (
        <button type="button" onClick={() => setForm('new')} style={{ position: 'fixed', right: 16, bottom: 20, zIndex: 20, border: 'none', borderRadius: 999, background: '#013175', color: '#fff', padding: '14px 20px', fontSize: 15, fontWeight: 600, boxShadow: '0 6px 20px rgba(1,49,117,.35)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiPlus size={18} /> Upload Desain
        </button>
      )}

      {/* ===== detail desain ===== */}
      <Drawer open={!!sel} onClose={() => openDetail(null)} destroyOnClose {...drawerProps} styles={drawerStyles}
        title={sel && <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: th.text }}>{judulDesain(sel)}</span><span style={pill(sel.status)}>{STATUS[sel.status]?.label}</span></div>}>
        {sel && ver && (
          <div style={{ paddingBottom: 90 }}>
            {/* info */}
            {editInfo ? (
              <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
                {[['nama', 'Nama / kode desain']].map(([k, l]) => (
                  <div key={k} style={{ marginBottom: 10 }}><div style={{ fontSize: 12, color: th.muted, marginBottom: 3 }}>{l}</div>
                    <input value={editInfo[k] || ''} onChange={(e) => setEditInfo({ ...editInfo, [k]: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: `1px solid ${th.border}`, background: th.input, color: th.text, fontSize: 15 }} /></div>
                ))}
                <div style={{ fontSize: 12, color: th.muted, marginBottom: 3 }}>Kategori</div>
                <Select size="large" style={{ width: '100%', marginBottom: 12 }} value={editInfo.category} onChange={(v) => setEditInfo({ ...editInfo, category: v })} options={categories.map((c) => ({ value: c.name, label: c.name }))} />
                <div style={{ display: 'flex', gap: 8 }}><button type="button" style={btn('none')} onClick={() => setEditInfo(null)}>Batal</button><button type="button" style={btn('#013175')} onClick={simpanInfo}>Simpan</button></div>
              </div>
            ) : (
              <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 14, padding: 14, marginBottom: 12, fontSize: 13, display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '4px 12px' }}>
                <span style={{ color: th.muted }}>Kategori</span><b>{sel.category}</b>
                {!sel.productId && (sel.uid === uid || kurator) ? <button type="button" onClick={() => setEditInfo({ nama: sel.nama, category: sel.category })} style={{ gridRow: 'span 2', alignSelf: 'start', border: `1px solid ${th.border}`, background: th.card, color: th.text, borderRadius: 8, padding: '6px 10px' }}><FiEdit2 /></button> : <span style={{ gridRow: 'span 2' }} />}
                <span style={{ color: th.muted }}>{sel.sumber === 'produksi' ? 'Diajukan' : 'Desainer'}</span><span>{sel.designer || '-'}{sel.sumber === 'produksi' ? ' · dari hasil produksi' : ''}</span>
                {sel.catatanPengajuan && <><span style={{ color: th.muted }}>Catatan</span><span style={{ gridColumn: 'span 2', whiteSpace: 'pre-wrap' }}>{sel.catatanPengajuan}</span></>}
              </div>
            )}
            {sel.sumber === 'produksi' && <RefProduksi th={th} baseUrl={baseUrl} projectIds={sel.projectIds} />}

            {sel.status === 'revisi' && (() => { const r = [...(sel.reviews || [])].reverse().find((x) => x.action === 'revisi'); return r ? <div style={{ padding: 12, borderRadius: 12, background: '#fee2e2', color: '#7f1d1d', fontSize: 13, marginBottom: 12 }}><b>Perlu revisi:</b> {r.catatan}</div> : null; })()}
            {sel.productId && (
              <button type="button" onClick={() => navigate(`/products?id=${sel.productId}`)} style={{ ...btn('#15803d'), width: '100%', marginBottom: 12 }}><FiExternalLink /> Sudah di Katalog Produk (v{sel.approvedVersion}) — buka</button>
            )}

            {!hasVer && (
              <div style={{ background: th.card, border: `1px dashed ${th.border}`, borderRadius: 14, padding: 18, marginBottom: 12, textAlign: 'center', color: th.muted, fontSize: 13 }}>
                <FaRegImages size={26} /><div style={{ marginTop: 6, color: th.text, fontWeight: 600 }}>Belum ada foto katalog</div>
                Desainer (Pakde / Azwad / Nino) upload foto katalognya lewat tombol di bawah.
              </div>
            )}

            {/* versi */}
            {hasVer && <>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 10 }}>
              {(sel.versions || []).map((v) => (
                <button key={v.v} type="button" style={chip(selV === v.v)} onClick={() => setSelV(v.v)}>
                  v{v.v}{sel.approvedVersion === v.v ? ' ✓' : ''} <span style={{ fontSize: 11, opacity: 0.75 }}>· {tgl(v.created_at)}</span>
                </button>
              ))}
            </div>

            <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Foto desain · v{ver.v} <span style={{ fontWeight: 400, color: th.muted, fontSize: 12 }}>({(ver.photos || []).length})</span></div>
              <Image.PreviewGroup>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                  {(ver.photos || []).map((u) => (
                    <div key={u} style={{ aspectRatio: '1/1', borderRadius: 10, overflow: 'hidden', background: '#eee' }}>
                      <Image src={thumb(u, 300)} preview={{ src: fileUrl(u) }} width="100%" height="100%" style={{ objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </Image.PreviewGroup>
              {ver.model3d && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><FiBox /> Model 3D <span style={{ fontWeight: 400, color: th.muted }}>— geser untuk memutar</span></div>
                  <Viewer3D src={fileUrl(ver.model3d)} />
                </div>
              )}
              {ver.catatan && <div style={{ marginTop: 12, fontSize: 13, padding: 10, borderRadius: 10, background: dark ? '#2a2a3a' : '#f3f4f6' }}><b>Catatan desainer:</b> {ver.catatan}</div>}
            </div>

            <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Gambar Kerja · v{ver.v}</div>
              {(ver.gambarKerja || []).length ? ver.gambarKerja.map((g) => (
                <a key={g.url} href={fileUrl(g.url)} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, border: `1px solid ${th.border}`, borderRadius: 10, marginBottom: 6, color: th.text, textDecoration: 'none' }}>
                  <FiFileText color="#b91c1c" size={18} /><span style={{ flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.nama || g.url.split('/').pop()}</span><FiExternalLink />
                </a>
              )) : <div style={{ fontSize: 13, color: th.muted }}>Belum ada gambar kerja di versi ini.</div>}
            </div>
            </>}

            <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Riwayat</div>
              {riwayat.map((h, i) => (
                <div key={i} style={{ fontSize: 13, padding: '6px 0', borderTop: i ? `1px solid ${th.border}` : 'none' }}>
                  <div><span style={{ color: th.muted, fontSize: 12 }}>{tgl(h.at)}</span> · {h.text}</div>
                  {h.catatan && <div style={{ color: th.muted, fontSize: 12, marginTop: 2 }}>“{h.catatan}”</div>}
                </div>
              ))}
              {bisaHapus && (
                <Popconfirm title="Hapus desain ini beserta semua versinya?" okText="Hapus" cancelText="Batal" onConfirm={hapus}>
                  <button type="button" style={{ marginTop: 10, border: 'none', background: 'none', color: '#c0392b', fontSize: 13, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}><FiTrash2 /> Hapus desain</button>
                </Popconfirm>
              )}
            </div>

            {/* aksi */}
            <div style={{ position: 'sticky', bottom: 0, background: th.bg, padding: '10px 0', display: 'grid', gap: 8 }}>
              {bisaVersiBaru && (
                <button type="button" style={btn(!hasVer || (sel.status === 'revisi' && !kurator) ? '#013175' : 'none')} onClick={() => setForm(sel)}><FiUpload /> {hasVer ? 'Upload Versi Baru' : 'Upload Foto Katalog'}</button>
              )}
              {kurator && !sel.productId && sel.status === 'layak' && (
                <button type="button" disabled={busy} style={btn('#15803d')} onClick={() => layak(sel.approvedVersion)}><FiPlus /> Lanjut Tambah Produk (v{sel.approvedVersion})</button>
              )}
              {kurator && !sel.productId && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {hasVer && sel.status !== 'revisi' && <button type="button" disabled={busy} style={btn('none')} onClick={() => setAksi({ action: 'revisi', catatan: '' })}><FiRotateCcw /> Revisi</button>}
                  {sel.status === 'arsip' || sel.status === 'layak'
                    ? <button type="button" disabled={busy} style={btn('none')} onClick={() => kirimReview('review', '')}><FiRotateCcw /> Ke Review</button>
                    : <button type="button" disabled={busy} style={btn('none')} onClick={() => setAksi({ action: 'arsip', catatan: '' })}><FiArchive /> Arsip</button>}
                  {hasVer && !(sel.status === 'layak' && sel.approvedVersion === ver.v) && (
                    <Popconfirm title={`Tambah produk dari versi ${ver.v}?`} description="Foto katalog versi ini otomatis jadi foto produk. Judul, ukuran, material, harga & varian diisi di halaman Tambah Produk." okText="Ya, lanjut" cancelText="Batal" onConfirm={() => layak(ver.v)}>
                      <button type="button" disabled={busy} style={btn('#15803d')}><FiPlus /> Tambah Produk (v{ver.v})</button>
                    </Popconfirm>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* ===== form upload ===== */}
      <Drawer open={!!form} onClose={() => { setForm(null); setPrefill(null); }} destroyOnClose {...drawerProps} styles={drawerStyles}
        title={<span style={{ color: th.text }}>{form === 'new' ? (prefill?.sumber === 'produksi' ? 'Ajukan Hasil Produksi ke Katalog' : 'Upload Desain Baru') : 'Upload Versi Baru'}</span>} maskClosable={false}>
        {form && (
          <UploadForm th={th} baseUrl={baseUrl} user={user} categories={categories} target={form === 'new' ? null : form} prefill={form === 'new' ? prefill : null}
            onCancel={() => { setForm(null); setPrefill(null); }} onDone={() => { setForm(null); setPrefill(null); load(); if (form === 'new') setTab('review'); }} />
        )}
      </Drawer>

      {/* ===== catatan revisi / arsip ===== */}
      <Modal open={!!aksi} onCancel={() => setAksi(null)} title={aksi?.action === 'revisi' ? 'Minta revisi ke desainer' : 'Simpan di arsip'}
        okText={aksi?.action === 'revisi' ? 'Kirim revisi' : 'Arsipkan'} cancelText="Batal" confirmLoading={busy} onOk={() => kirimReview(aksi.action, aksi.catatan)}>
        <textarea autoFocus value={aksi?.catatan || ''} onChange={(e) => setAksi({ ...aksi, catatan: e.target.value })} rows={4}
          placeholder={aksi?.action === 'revisi' ? 'Apa yang perlu diubah? (wajib)' : 'Alasan (opsional)'} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #ddd', fontSize: 15, fontFamily: 'inherit' }} />
      </Modal>
    </div>
  );
};

export default DesainProduk;
