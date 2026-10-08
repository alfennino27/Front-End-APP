import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Drawer, Image, Select, message, Modal, Popconfirm } from 'antd';
import { FiSearch, FiLink, FiExternalLink, FiUpload, FiSlash, FiRotateCcw, FiEdit2, FiTrash2, FiPlus, FiSettings, FiCheck, FiX } from 'react-icons/fi';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useTheme } from '../../ThemeContext';
import { getImageUrl } from '../../Utils/image';
import ProductPicker, { firstImage, thumb } from './ProductPicker';

/**
 * Hasil Produksi → Katalog (/hasil-produksi). Semua project yang punya foto Barang Jadi:
 * beri kategori (= kategori website, satu sumber), tautkan ke produk katalog yang sudah ada
 * (boleh lebih dari satu), atau ajukan ke Desain Produk kalau produknya belum ada di website
 * (foto real tidak langsung ke katalog — website pakai foto katalog). Custom sekali buat →
 * "Bukan katalog". Backend: KLF-Server-main/routes/katalog/katalog.js.
 */
const SUPER_ADMIN_UIDS = ['w4M5JJjgGQeHFbS2nkyoCfUBE532', 'fYpdHwXRDLhj5XGxM5FZIAvxp9E2'];
const TABS = [
  ['belum_taut', 'Belum ditautkan'],
  ['belum_kategori', 'Belum ada kategori'],
  ['desain', 'Di Desain Produk'],
  ['tertaut', 'Tertaut'],
  ['bukan', 'Bukan katalog'],
  ['semua', 'Semua'],
];
const STATUS_STYLE = {
  belum_taut: { label: 'Belum ditautkan', color: '#b45309', bg: '#fef3c7' },
  belum_kategori: { label: 'Tanpa kategori', color: '#b91c1c', bg: '#fee2e2' },
  desain: { label: 'Di Desain Produk', color: '#1d4ed8', bg: '#dbeafe' },
  tertaut: { label: 'Tertaut', color: '#15803d', bg: '#dcfce7' },
  bukan: { label: 'Bukan katalog', color: '#4b5563', bg: '#e5e7eb' },
};
const DESAIN_LABEL = { review: 'menunggu review', revisi: 'perlu revisi', layak: 'layak — draft produk', arsip: 'diarsip' };

const statusOf = (r) => {
  if (r.bukanKatalog) return 'bukan';
  if (r.linkProducts.length) return 'tertaut';
  if (r.desain && r.desain.status !== 'arsip' && !r.desain.productId) return 'desain';
  if (!r.KategoriProduk) return 'belum_kategori';
  return 'belum_taut';
};
const tgl = (x) => { const d = new Date(x); return x && !isNaN(d) ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; };
const rupiah = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

const useIsMobile = () => {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => { const h = () => setM(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return m;
};

// ================= Kelola Kategori =================
const KelolaKategori = ({ open, onClose, baseUrl, uid, th, onChanged }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [edit, setEdit] = useState(null); // {id, name}
  const [baru, setBaru] = useState('');
  const [busy, setBusy] = useState(false);
  const load = () => { setLoading(true); axios.get(`${baseUrl}/kategori-produk/get`).then((r) => setRows(r.data || [])).catch(() => message.error('Gagal memuat kategori')).finally(() => setLoading(false)); };
  useEffect(() => { if (open) { load(); setEdit(null); setBaru(''); } }, [open]);

  const selesai = async (msg) => { message.success(msg); setEdit(null); load(); onChanged(); };
  const rename = async (merge = false) => {
    if (!edit?.name.trim()) return;
    setBusy(true);
    try {
      const r = await axios.post(`${baseUrl}/kategori-produk/rename`, { id: edit.id, name: edit.name.trim(), uid, merge });
      await selesai(r.data.message);
    } catch (e) {
      if (e.response?.status === 409 && e.response.data?.bisaGabung) {
        const lama = rows.find((x) => x.id === edit.id)?.name;
        Modal.confirm({
          title: `Gabungkan "${lama}" ke "${edit.name.trim()}"?`,
          content: 'Semua produk, project, foto portfolio & aturan opsi pindah ke kategori tujuan, lalu kategori lama dihapus. Ikut berubah di website.',
          okText: 'Ya, gabungkan', cancelText: 'Batal', onOk: () => rename(true),
        });
      } else message.error(e.response?.data?.message || e.message);
    } finally { setBusy(false); }
  };
  const tambah = async () => {
    if (!baru.trim()) return;
    setBusy(true);
    try { await axios.post(`${baseUrl}/kategori-produk/create`, { name: baru.trim(), uid }); setBaru(''); await selesai('Kategori ditambahkan'); }
    catch (e) { message.error(e.response?.data?.message || e.message); }
    finally { setBusy(false); }
  };
  const hapus = async (c) => {
    try { await axios.delete(`${baseUrl}/kategori-produk/${c.id}`, { params: { uid } }); await selesai('Kategori dihapus'); }
    catch (e) { message.error(e.response?.data?.message || e.message); }
  };

  const input = { flex: 1, minWidth: 0, padding: '9px 12px', borderRadius: 10, border: `1px solid ${th.border}`, background: th.input, color: th.text, fontSize: 15, outline: 'none' };
  const iconBtn = (color = th.text) => ({ border: `1px solid ${th.border}`, background: th.card, color, borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center' });
  return (
    <Drawer open={open} onClose={onClose} destroyOnClose title={<span style={{ color: th.text }}>Kelola Kategori Produk</span>}
      {...(window.innerWidth < 768 ? { placement: 'bottom', height: '92%' } : { placement: 'right', width: 560 })}
      styles={{ body: { background: th.bg, padding: 16 }, header: { background: th.card } }}>
      <div style={{ fontSize: 12, color: th.muted, marginBottom: 12, padding: 10, borderRadius: 10, background: th.card, border: `1px solid ${th.border}` }}>
        Kategori ini <b>satu</b> untuk ERP & website. Ganti nama = ikut berubah di website (produk, portfolio, cerita project, quote).
        Nama yang sudah ada = <b>digabung</b>. Kategori yang tidak punya produk tampil tidak muncul di menu website.
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input style={input} value={baru} onChange={(e) => setBaru(e.target.value)} placeholder="Nama kategori baru…" onKeyDown={(e) => e.key === 'Enter' && tambah()} />
        <button type="button" disabled={busy || !baru.trim()} onClick={tambah} style={{ ...iconBtn('#fff'), background: '#013175', border: 'none', gap: 6, padding: '8px 14px' }}><FiPlus /> Tambah</button>
      </div>
      {loading && !rows.length ? <div style={{ color: th.muted, textAlign: 'center', padding: 20 }}>Memuat…</div> : rows.map((c) => (
        <div key={c.id} style={{ padding: '10px 12px', borderRadius: 12, border: `1px solid ${th.border}`, background: th.card, marginBottom: 8 }}>
          {edit?.id === c.id ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <input autoFocus style={input} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && rename()} />
              <button type="button" disabled={busy} onClick={() => rename()} style={{ ...iconBtn('#fff'), background: '#15803d', border: 'none' }}><FiCheck /></button>
              <button type="button" onClick={() => setEdit(null)} style={iconBtn()}><FiX /></button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: th.text }}>{c.name}</div>
                <div style={{ fontSize: 12, color: th.muted }}>
                  {c.jumlahProduk} produk ({c.jumlahTampil} tampil) · {c.jumlahProject} project{c.jumlahPortfolio ? ` · ${c.jumlahPortfolio} foto portfolio` : ''}
                </div>
              </div>
              <button type="button" onClick={() => setEdit({ id: c.id, name: c.name })} style={iconBtn()} title="Ganti nama / gabung"><FiEdit2 /></button>
              {!c.jumlahProduk && !c.jumlahProject && (
                <Popconfirm title={`Hapus kategori "${c.name}"?`} okText="Hapus" cancelText="Batal" onConfirm={() => hapus(c)}>
                  <button type="button" style={iconBtn('#c0392b')} title="Hapus"><FiTrash2 /></button>
                </Popconfirm>
              )}
            </div>
          )}
        </div>
      ))}
    </Drawer>
  );
};

// ================= Halaman utama =================
const HasilProduksi = () => {
  const baseUrl = getApiBaseUrl();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { globalTheme } = useTheme();
  const dark = globalTheme !== 'light';
  const isMobile = useIsMobile();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const uid = user?.uid;

  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canKelola, setCanKelola] = useState(SUPER_ADMIN_UIDS.includes(uid));
  const [tab, setTab] = useState('belum_taut');
  const [fKat, setFKat] = useState(null); // null = semua, '' = tanpa kategori
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(60);
  const [picker, setPicker] = useState(false);
  const [kelola, setKelola] = useState(false);
  const [busy, setBusy] = useState(false);
  const selId = params.get('id');

  const loadRows = () => axios.get(`${baseUrl}/hasil-produksi/get`).then((r) => setRows(Array.isArray(r.data) ? r.data : [])).catch(() => message.error('Gagal memuat hasil produksi')).finally(() => setLoading(false));
  const loadKategori = () => axios.get(`${baseUrl}/products/category/get`).then((r) => setCategories((r.data || []).sort((a, b) => String(a.name).localeCompare(String(b.name))))).catch(() => {});
  const loadProducts = () => axios.get(`${baseUrl}/products/get`).then((r) => setProducts(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  useEffect(() => {
    if (!user) { window.location.replace('/login'); return; }
    loadRows(); loadKategori(); loadProducts();
    axios.get(`${baseUrl}/useraccess/get`).then((r) => {
      if ((r.data || []).some((a) => a.uid === uid && a.menu === 'Kelola Kategori' && (a.value === true || a.value === 'true'))) setCanKelola(true);
    }).catch(() => {});
  }, []);
  useEffect(() => { setLimit(60); }, [tab, fKat, q]);

  const pById = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);
  const withStatus = useMemo(() => rows.map((r) => ({ ...r, status: statusOf(r) }))
    .sort((a, b) => String(b.Date || '').localeCompare(String(a.Date || ''))), [rows]);
  const counts = useMemo(() => TABS.reduce((a, [t]) => ({ ...a, [t]: t === 'semua' ? withStatus.length : withStatus.filter((r) => r.status === t).length }), {}), [withStatus]);
  const inTab = useMemo(() => withStatus.filter((r) => tab === 'semua' || r.status === tab), [withStatus, tab]);
  const katCounts = useMemo(() => inTab.reduce((m, r) => ({ ...m, [r.KategoriProduk || '']: (m[r.KategoriProduk || ''] || 0) + 1 }), {}), [inTab]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return inTab.filter((r) => (fKat === null || (r.KategoriProduk || '') === fKat)
      && (!s || `${r.NamaBarang} ${r.Buyer} ${r.KodeInvoice}`.toLowerCase().includes(s)));
  }, [inTab, fKat, q]);
  const sel = withStatus.find((r) => r.id === selId) || null;
  const openDetail = (id) => setParams(id ? { id } : {});

  // ---- aksi ----
  const patchRow = (id, patch) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const setKategori = async (kategori) => {
    try { await axios.post(`${baseUrl}/hasil-produksi/kategori`, { ids: [sel.id], kategori: kategori || '', uid }); patchRow(sel.id, { KategoriProduk: kategori || '' }); message.success('Kategori disimpan'); }
    catch (e) { message.error(e.response?.data?.message || e.message); }
  };
  const simpanLink = async (ids) => {
    setBusy(true);
    try {
      const r = await axios.post(`${baseUrl}/projects/link-product`, { idProject: sel.id, idProducts: ids });
      patchRow(sel.id, { linkProducts: ids });
      setPicker(false); message.success(r.data.message);
    } catch (e) { message.error(e.response?.data?.message || e.message); }
    finally { setBusy(false); }
  };
  const setBukan = async (value) => {
    try { await axios.post(`${baseUrl}/hasil-produksi/bukan-katalog`, { ids: [sel.id], value }); patchRow(sel.id, { bukanKatalog: value }); message.success(value ? 'Ditandai bukan katalog' : 'Dikembalikan ke daftar'); }
    catch (e) { message.error(e.response?.data?.message || e.message); }
  };

  // ---- style ----
  const th = {
    bg: dark ? '#14141f' : '#f5f6fa', card: dark ? '#1e1e2d' : '#fff', border: dark ? '#333' : '#e3e3e3',
    text: dark ? '#fff' : '#1f2937', muted: dark ? '#9aa0a6' : '#6b7280', input: dark ? '#2a2a3a' : '#fff',
  };
  const chip = (active) => ({ padding: '8px 14px', borderRadius: 999, border: `1px solid ${active ? '#013175' : th.border}`, background: active ? '#013175' : th.card, color: active ? '#fff' : th.text, fontSize: 13, whiteSpace: 'nowrap', cursor: 'pointer' });
  const pill = (s) => ({ fontSize: 11, fontWeight: 700, color: STATUS_STYLE[s]?.color, background: STATUS_STYLE[s]?.bg, padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap' });
  const btn = (bg, color = '#fff') => ({ flex: 1, padding: '12px 10px', borderRadius: 12, border: bg === 'none' ? `1px solid ${th.border}` : 'none', background: bg === 'none' ? th.card : bg, color: bg === 'none' ? th.text : color, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' });
  const box = { background: th.card, border: `1px solid ${th.border}`, borderRadius: 14, padding: 14, marginBottom: 12 };

  const linked = sel ? sel.linkProducts.map((id) => pById[id]).filter(Boolean) : [];
  const desainJalan = sel?.desain && sel.desain.status !== 'arsip' && !sel.desain.productId;

  return (
    <div style={{ background: th.bg, minHeight: '100vh', color: th.text }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 16px 100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>Hasil Produksi → Katalog</div>
            <div style={{ fontSize: 12, color: th.muted }}>Project ber-foto Barang Jadi · tautkan ke produk website atau ajukan ke Desain Produk</div>
          </div>
          {canKelola && <button type="button" onClick={() => setKelola(true)} style={{ ...btn('none'), flex: 'none', padding: '10px 14px' }}><FiSettings /> {isMobile ? '' : 'Kelola Kategori'}</button>}
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 8 }}>
          {TABS.map(([t, l]) => (
            <button key={t} type="button" style={chip(tab === t)} onClick={() => setTab(t)}>{l} <b style={{ marginLeft: 4 }}>{counts[t] || 0}</b></button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 8, marginBottom: 14 }}>
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: 13, color: th.muted }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama barang, customer, invoice…" style={{ width: '100%', padding: '10px 12px 10px 34px', borderRadius: 10, border: `1px solid ${th.border}`, background: th.input, color: th.text, fontSize: 15, outline: 'none' }} />
          </div>
          <Select allowClear showSearch optionFilterProp="label" size="large" placeholder="Semua kategori" value={fKat === null ? undefined : fKat}
            onChange={(v) => setFKat(v === undefined ? null : v)}
            options={[
              ...(katCounts[''] ? [{ value: '', label: `— Tanpa kategori (${katCounts['']})` }] : []),
              ...categories.filter((c) => katCounts[c.name]).map((c) => ({ value: c.name, label: `${c.name} (${katCounts[c.name]})` })),
            ]} />
        </div>

        {loading ? <div style={{ color: th.muted, padding: 30, textAlign: 'center' }}>Memuat…</div>
          : !list.length ? <div style={{ color: th.muted, padding: 40, textAlign: 'center', border: `1px dashed ${th.border}`, borderRadius: 14 }}>Tidak ada hasil produksi di filter ini.</div>
          : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 150 : 190}px, 1fr))`, gap: 10 }}>
                {list.slice(0, limit).map((r) => (
                  <div key={r.id} onClick={() => openDetail(r.id)} style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 14, overflow: 'hidden', cursor: 'pointer' }}>
                    <div style={{ position: 'relative', aspectRatio: '1/1', background: '#eee' }}>
                      {r.foto[0] && <img src={thumb(r.foto[0], 400)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                      <span style={{ ...pill(r.status), position: 'absolute', top: 8, left: 8 }}>{STATUS_STYLE[r.status].label}</span>
                      {r.linkProducts.length > 1 && <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 11, fontWeight: 700, background: 'rgba(0,0,0,.6)', color: '#fff', padding: '2px 7px', borderRadius: 999 }}>{r.linkProducts.length} produk</span>}
                    </div>
                    <div style={{ padding: '8px 10px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.NamaBarang || '(tanpa nama)'}</div>
                      <div style={{ fontSize: 11, color: th.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.KategoriProduk || 'Tanpa kategori'} · {r.Buyer || '-'}</div>
                    </div>
                  </div>
                ))}
              </div>
              {list.length > limit && <button type="button" onClick={() => setLimit((n) => n + 60)} style={{ ...btn('none'), width: '100%', marginTop: 14 }}>Tampilkan lagi ({list.length - limit})</button>}
            </>
          )}
      </div>

      {/* ===== detail ===== */}
      <Drawer open={!!sel} onClose={() => openDetail(null)} destroyOnClose
        {...(isMobile ? { placement: 'bottom', height: '94%' } : { placement: 'right', width: 720 })}
        styles={{ body: { background: th.bg, padding: 16 }, header: { background: th.card } }}
        title={sel && <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: th.text }}>{sel.NamaBarang}</span><span style={pill(sel.status)}>{STATUS_STYLE[sel.status].label}</span></div>}>
        {sel && (
          <div style={{ paddingBottom: 40 }}>
            <div style={box}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Foto Barang Jadi <span style={{ fontWeight: 400, color: th.muted, fontSize: 12 }}>({sel.foto.length}) · foto real, bukan foto katalog</span></div>
              <Image.PreviewGroup>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8 }}>
                  {sel.foto.map((u, i) => (
                    <div key={`${u}-${i}`} style={{ aspectRatio: '1/1', borderRadius: 10, overflow: 'hidden', background: '#eee' }}>
                      <Image src={thumb(u, 300)} preview={{ src: getImageUrl(u) }} width="100%" height="100%" style={{ objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </Image.PreviewGroup>
            </div>

            <div style={{ ...box, fontSize: 13, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px', alignItems: 'center' }}>
              <span style={{ color: th.muted }}>Customer</span><span>{sel.Buyer || '-'}</span>
              <span style={{ color: th.muted }}>Invoice</span><span>{sel.KodeInvoice || '-'} · {tgl(sel.Date)}</span>
              <span style={{ color: th.muted }}>Harga jual</span><span>{rupiah(sel.Harga)}</span>
              <span style={{ color: th.muted }}>Kategori</span>
              <Select showSearch allowClear optionFilterProp="label" size="large" placeholder="Pilih kategori" value={sel.KategoriProduk || undefined}
                onChange={(v) => setKategori(v)} options={categories.map((c) => ({ value: c.name, label: c.name }))} />
              <span />
              <a href={`/project/${sel.id}`} target="_blank" rel="noreferrer" style={{ color: '#013175', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>Buka detail project <FiExternalLink /></a>
            </div>

            <div style={box}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ fontWeight: 700, flex: 1 }}>Produk Website {linked.length ? `(${linked.length})` : ''}</div>
                <button type="button" onClick={() => setPicker(true)} style={{ ...btn(linked.length ? 'none' : '#013175'), flex: 'none', padding: '8px 14px' }}><FiLink /> {linked.length ? 'Ubah' : 'Tautkan'}</button>
              </div>
              {linked.length ? linked.map((p) => (
                <a key={p.id} href={`/products?id=${p.id}`} target="_blank" rel="noreferrer" style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0', textDecoration: 'none', color: th.text }}>
                  <div style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', background: '#eee', flexShrink: 0 }}>{firstImage(p) && <img src={thumb(firstImage(p), 160)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: th.muted, textTransform: 'uppercase' }}>{p.category}{p.isDisplay ? '' : ' · hidden'}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{p.judul}</div>
                  </div>
                </a>
              )) : <div style={{ fontSize: 13, color: th.muted }}>Sudah ada produknya di website? Tautkan — foto barang jadi ini tampil di "Hasil produksi asli" halaman produk. Satu project boleh ke beberapa produk (mis. meja + kursi).</div>}
            </div>

            <div style={box}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Belum ada di katalog?</div>
              {desainJalan ? (
                <>
                  <div style={{ fontSize: 13, color: th.muted, marginBottom: 10 }}>Sudah diajukan ke Desain Produk — {DESAIN_LABEL[sel.desain.status] || sel.desain.status}.</div>
                  <button type="button" onClick={() => navigate(`/desain?id=${sel.desain.id}`)} style={{ ...btn('#1d4ed8'), width: '100%' }}><FiExternalLink /> Buka di Desain Produk</button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: th.muted, marginBottom: 10 }}>Ajukan ke Desain Produk: lengkapi <b>foto katalog</b> (wajib), deskripsi & harga/varian. Setelah dikurasi Layak & disimpan jadi produk, project ini otomatis tertaut.</div>
                  <button type="button" onClick={() => navigate(`/desain?dariProject=${sel.id}`)} style={{ ...btn(linked.length ? 'none' : '#013175'), width: '100%' }}><FiUpload /> Ajukan ke Desain Produk</button>
                </>
              )}
            </div>

            {sel.bukanKatalog
              ? <button type="button" onClick={() => setBukan(false)} style={{ ...btn('none'), width: '100%' }}><FiRotateCcw /> Kembalikan ke daftar katalog</button>
              : !linked.length && <button type="button" onClick={() => setBukan(true)} style={{ ...btn('none'), width: '100%', color: th.muted }}><FiSlash /> Bukan katalog (custom sekali buat)</button>}
          </div>
        )}
      </Drawer>

      <ProductPicker open={picker} onClose={() => setPicker(false)} onSave={simpanLink} saving={busy} dark={dark}
        products={products} categories={categories} selected={sel?.linkProducts || []} defaultCat={sel?.KategoriProduk || ''} namaRef={sel?.NamaBarang || ''} />
      <KelolaKategori open={kelola} onClose={() => setKelola(false)} baseUrl={baseUrl} uid={uid} th={th}
        onChanged={() => { loadKategori(); loadRows(); loadProducts(); }} />
    </div>
  );
};

export default HasilProduksi;
