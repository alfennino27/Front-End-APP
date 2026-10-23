import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Image } from 'antd';
import { IoRefresh, IoArrowBack } from 'react-icons/io5';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useTheme } from '../../ThemeContext';
import { getImageUrl } from '../../Utils/image';
import { labelKategori } from '../../Utils/kategori';
import useIsMobile from '../../Utils/useIsMobile';
import { Sheet, Label, PREVIEW, gambarCategory, TodoKomentar } from '../Todo/categoryThread';

// ============================================================================
// PAPAN ORDER (percobaan) — semua progress order dalam satu layar
// ============================================================================
// customer (urut target kirim terdekat) → semua item order customer itu
// (urut masuk PO) → kartu kecil per category yang memang ada prosesnya.
// Ketuk kartu = sheet: supplier, tanggal order & deadline, status, to-do, komentar
// (komponen sama dengan /todo & halaman project). Di halaman customer, AI membaca
// chat WhatsApp customer (Dualhook) dan merangkum poin penting semua ordernya.
// Data: GET /papan-order, ringkasan chat: /papan-order/wa-ringkasan (lihat
// KLF-Server-main/utils/papanOrder.js & utils/ringkasanWaCustomer.js).

const STATUS_COLOR = {
  'Belum Proses': '#94a3b8', Proses: '#2563eb', Selesai: '#16a34a', 'QC Pass': '#15803d', Servis: '#dc2626', 'Ready Stock': '#0d9488',
};
// QC Pass / Servis sengaja tidak ada di sini — lewat Alur Kerja QC di halaman project.
const STATUS_CEPAT = ['Belum Proses', 'Proses', 'Selesai'];

const JENIS_POIN = {
  beda_erp: { label: '⚠️ Beda dgn ERP', color: '#dc2626' },
  komplain: { label: '😟 Komplain', color: '#b91c1c' },
  belum_dibalas: { label: '⏳ Belum dibalas', color: '#ea580c' },
  perubahan: { label: '🔁 Perubahan', color: '#d97706' },
  permintaan: { label: '📝 Permintaan', color: '#2563eb' },
  janji: { label: '🤝 Janji KLF', color: '#7c3aed' },
  pengiriman: { label: '🚚 Pengiriman', color: '#15803d' },
  pembayaran: { label: '💰 Pembayaran', color: '#0d9488' },
  lainnya: { label: 'Lainnya', color: '#6b7280' },
};
const URUT_JENIS = Object.keys(JENIS_POIN);

const FILTER = [
  { key: 'semua', label: 'Semua' },
  { key: 'telat', label: 'Telat kirim' },
  { key: 'minggu', label: 'Kirim ≤ 7 hari' },
  { key: 'supplier', label: 'Supplier telat' },
  { key: 'chat', label: 'Chat baru' },
];

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const pad2 = (n) => String(n).padStart(2, '0');
const toYMD = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const tgl = (s) => {
  const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${Number(m[3])} ${BULAN[Number(m[2]) - 1]}` : '—';
};
const waktuWIB = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${pad2(d.getHours())}.${pad2(d.getMinutes())}`;
};
const namaCat = (cat) => (cat === 'BarangJadi' ? 'Umum' : labelKategori(cat));
const baru = (iso) => !!iso && Date.now() - new Date(iso).getTime() < 48 * 3600 * 1000;
const aiHeaders = () => ({ 'Content-Type': 'application/json', 'X-KLF-Key': import.meta.env.VITE_KLF_AI_KEY || '' });

const PapanOrder = () => {
  const navigate = useNavigate();
  const baseUrl = getApiBaseUrl();
  const { globalTheme } = useTheme();
  const dark = globalTheme !== 'light';
  const isMobile = useIsMobile();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();
  const [params, setParams] = useSearchParams();
  const customerKey = params.get('c');

  const C = {
    bg: dark ? '#0f0f10' : '#f4f4f5',
    card: dark ? '#1c1c1f' : '#ffffff',
    border: dark ? '#2e2e33' : '#e4e4e7',
    text: dark ? '#f4f4f5' : '#18181b',
    muted: dark ? '#a1a1aa' : '#71717a',
    soft: dark ? '#27272a' : '#f4f4f5',
    input: dark ? '#111113' : '#ffffff',
  };

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('semua');
  const [showStock, setShowStock] = useState(false);
  const [users, setUsers] = useState([]);
  const [userList, setUserList] = useState([]);
  const [busy, setBusy] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const res = await fetch(`${baseUrl}/papan-order?today=${toYMD(new Date())}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Gagal ambil papan order');
      setData(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchData();
    fetch(`${baseUrl}/users/all/get`).then((r) => r.json()).then((d) => {
      if (!Array.isArray(d)) return;
      setUsers(d.map((u) => u.name).filter((n) => n && !/bot|hermes/i.test(n)));
      setUserList(d);
    }).catch(() => {});
  }, [baseUrl, fetchData]);

  // Pindah daftar ↔ halaman customer → mulai dari atas.
  useEffect(() => { window.scrollTo(0, 0); }, [customerKey]);

  const post = async (url, body, { refresh = true } = {}) => {
    setBusy(true);
    try {
      const res = await fetch(`${baseUrl}${url}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, by: user?.uid || '' }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'Gagal menyimpan');
      if (refresh) fetchData();
      return true;
    } catch (err) {
      alert(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const customers = data?.customers || [];
  const terfilter = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (!showStock && c.is_stock) return false;
      if (filter === 'telat' && !(c.sisa_hari != null && c.sisa_hari < 0)) return false;
      if (filter === 'minggu' && !(c.sisa_hari != null && c.sisa_hari >= 0 && c.sisa_hari <= 7)) return false;
      if (filter === 'supplier' && !c.telat_supplier) return false;
      if (filter === 'chat' && !c.chat?.ada_pesan_baru) return false;
      if (q && ![c.nama, ...c.invoices.map((i) => i.kode), ...c.items.map((i) => i.nama)].some((v) => String(v || '').toLowerCase().includes(q))) return false;
      return true;
    });
  }, [customers, search, filter, showStock]);

  const hitung = useMemo(() => {
    const dasar = customers.filter((c) => showStock || !c.is_stock);
    return {
      semua: dasar.length,
      telat: dasar.filter((c) => c.sisa_hari != null && c.sisa_hari < 0).length,
      minggu: dasar.filter((c) => c.sisa_hari != null && c.sisa_hari >= 0 && c.sisa_hari <= 7).length,
      supplier: dasar.filter((c) => c.telat_supplier).length,
      chat: dasar.filter((c) => c.chat?.ada_pesan_baru).length,
    };
  }, [customers, showStock]);

  // --- Style kecil (sama dengan /todo) ----------------------------------------
  const sInput = {
    background: C.input, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: '8px 10px', fontSize: 16, minHeight: 42,
  };
  const sBtn = (bg, fg = '#fff') => ({
    background: bg, color: fg, border: 'none', borderRadius: 10, padding: '10px 14px',
    fontSize: 14, fontWeight: 600, cursor: 'pointer', minHeight: 42,
  });
  const sIconBtn = {
    background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10,
    width: 42, height: 42, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: '0 0 42px',
  };
  const chip = (color) => ({
    display: 'inline-block', background: color, color: '#fff', borderRadius: 999,
    padding: '1px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
  });
  const kirimBadge = (sisa) => {
    if (sisa == null) return { text: 'Tanpa target kirim', color: C.muted };
    if (sisa < 0) return { text: `Telat ${-sisa} hr`, color: '#dc2626' };
    if (sisa === 0) return { text: 'Kirim hari ini', color: '#d97706' };
    return { text: `Kirim H-${sisa}`, color: sisa <= 7 ? '#d97706' : C.muted };
  };

  const ui = { C, dark, isMobile, sInput, sBtn, sIconBtn, chip, kirimBadge, baseUrl, user, users, userList, busy, post, navigate };
  const terpilih = customerKey ? customers.find((c) => c.key === customerKey) : null;

  if (customerKey) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', color: C.text, paddingBottom: 90 }}>
        {terpilih ? (
          <HalamanCustomer cust={terpilih} ui={ui} onBack={() => setParams({})} refresh={fetchData} />
        ) : (
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: 12 }}>
            <button type="button" style={sIconBtn} onClick={() => setParams({})} aria-label="Kembali"><IoArrowBack size={20} /></button>
            <div style={{ padding: 30, textAlign: 'center', color: C.muted }}>
              {loading ? 'Memuat…' : 'Customer tidak ditemukan / semua ordernya sudah selesai.'}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, paddingBottom: 90 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 12px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>Papan Order <span style={{ fontSize: 11, fontWeight: 600, color: '#7c3aed', verticalAlign: 'middle' }}>BETA</span></div>
            <div style={{ fontSize: 12, color: C.muted }}>
              {data ? `${hitung.semua} customer · urut target kirim terdekat` : 'memuat…'}
            </div>
          </div>
          <button type="button" style={sIconBtn} onClick={() => { setLoading(true); fetchData(); }} title="Muat ulang" aria-label="Muat ulang">
            <IoRefresh size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8 }}>
          {FILTER.map((f) => {
            const on = filter === f.key;
            return (
              <button type="button" key={f.key} onClick={() => setFilter(f.key)}
                style={{
                  flex: '0 0 auto', borderRadius: 999, padding: '8px 14px', fontSize: 14, fontWeight: 600, cursor: 'pointer', minHeight: 40,
                  border: `1px solid ${on ? '#2563eb' : C.border}`, background: on ? '#2563eb' : C.card, color: on ? '#fff' : C.text,
                }}>
                {f.label} <span style={{ opacity: 0.75, fontWeight: 500 }}>{hitung[f.key] || 0}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 6, padding: '2px 0 10px' }}>
          <input style={{ ...sInput, flex: 1, minWidth: 0 }} placeholder="Cari customer / item / invoice" value={search} onChange={(e) => setSearch(e.target.value)} />
          <label style={{ ...sInput, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', cursor: 'pointer' }}>
            <input type="checkbox" checked={showStock} onChange={(e) => setShowStock(e.target.checked)} /> Stok
          </label>
        </div>

        {loading && !data && <div style={{ padding: 30, textAlign: 'center', color: C.muted }}>Memuat papan order…</div>}
        {error && <div style={{ padding: 12, borderRadius: 10, background: '#fee2e2', color: '#991b1b', marginBottom: 10 }}>{error}</div>}
        {data && terfilter.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>Tidak ada customer di filter ini.</div>}

        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {terfilter.map((c) => <KartuCustomer key={c.key} c={c} ui={ui} onOpen={() => setParams({ c: c.key })} />)}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Daftar customer
// ============================================================================
const ProgressBar = ({ beres, total, C }) => {
  const pct = total ? Math.round((beres / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 999, background: C.soft, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#16a34a' : '#2563eb' }} />
      </div>
      <span style={{ fontSize: 11, color: C.muted, whiteSpace: 'nowrap' }}>{beres}/{total} beres</span>
    </div>
  );
};

const KartuCustomer = ({ c, ui, onOpen }) => {
  const { C, kirimBadge } = ui;
  const kirim = kirimBadge(c.sisa_hari);
  const foto = c.items.map((i) => i.image).filter(Boolean).slice(0, 4);
  return (
    <div role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${kirim.color}`, borderRadius: 12, padding: 12, cursor: 'pointer' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3, wordBreak: 'break-word' }}>{c.nama}</div>
          <div style={{ fontSize: 12, color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {c.invoices.map((i) => i.kode).join(' · ') || '—'}
          </div>
        </div>
        <div style={{ textAlign: 'right', flex: 'none' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: kirim.color }}>{kirim.text}</div>
          <div style={{ fontSize: 11, color: C.muted }}>{c.target_kirim ? tgl(c.target_kirim) : ''}</div>
        </div>
      </div>
      {foto.length > 0 && (
        <div style={{ display: 'flex', gap: 4, margin: '8px 0 6px' }}>
          {foto.map((u) => <img key={u} src={getImageUrl(u)} alt="" loading="lazy" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />)}
          {c.items.length > foto.length && <div style={{ width: 40, height: 40, borderRadius: 6, background: C.soft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: C.muted }}>+{c.items.length - foto.length}</div>}
        </div>
      )}
      <ProgressBar beres={c.progress.beres} total={c.progress.total} C={C} />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12, marginTop: 6 }}>
        <span style={{ color: C.muted }}>{c.items.length} item</span>
        {c.telat_supplier > 0 && <span style={{ color: '#dc2626', fontWeight: 600 }}>⚠ {c.telat_supplier} supplier telat</span>}
        {c.chat?.ada_pesan_baru && <span style={{ color: '#2563eb', fontWeight: 600 }}>💬 chat baru</span>}
        {!c.wa.length && <span style={{ color: C.muted }}>tanpa nomor WA</span>}
      </div>
    </div>
  );
};

// ============================================================================
// Halaman customer: ringkasan chat AI + item × category
// ============================================================================
const HalamanCustomer = ({ cust, ui, onBack, refresh }) => {
  const { C, isMobile, sIconBtn, kirimBadge, navigate } = ui;
  const kirim = kirimBadge(cust.sisa_hari);
  const [view, setView] = useState(isMobile ? 'kartu' : 'tabel');
  const [sheet, setSheet] = useState(null); // { itemId, cat }
  const [ringkasan, setRingkasan] = useState(null);

  const item = sheet ? cust.items.find((i) => i.id === sheet.itemId) : null;
  const catInfo = item && sheet.cat !== 'BarangJadi' ? item.categories.find((c) => c.category === sheet.cat) : null;
  const poin = ringkasan?.poin || [];

  // Kolom tabel = category yang dipakai minimal satu item, urutan alur produksi.
  const kolom = useMemo(() => {
    const ada = new Set(cust.items.flatMap((i) => i.categories.map((c) => c.category)));
    return ['Besi', 'Kayu', 'Jok', 'Rotan', 'Marmer', 'Kaca', 'Fiber', 'Veneer', 'Finishing', 'Hardware'].filter((k) => ada.has(k));
  }, [cust]);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 12px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <button type="button" style={sIconBtn} onClick={onBack} aria-label="Kembali"><IoArrowBack size={20} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.25, wordBreak: 'break-word' }}>{cust.nama}</div>
          <div style={{ fontSize: 12, color: C.muted }}>
            <span style={{ color: kirim.color, fontWeight: 600 }}>{kirim.text}</span>
            {cust.target_kirim ? ` · ${tgl(cust.target_kirim)}` : ''} · {cust.items.length} item
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {cust.invoices.map((i) => (
          <button type="button" key={i.id} onClick={() => navigate(`/invoice/${i.id}`)}
            style={{ border: `1px solid ${C.border}`, background: C.card, color: C.text, borderRadius: 999, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>
            🧾 {i.kode}{i.tanggal ? ` · ${tgl(i.tanggal)}` : ''}
          </button>
        ))}
      </div>
      <ProgressBar beres={cust.progress.beres} total={cust.progress.total} C={C} />

      <PanelChat cust={cust} ui={ui} ringkasan={ringkasan} setRingkasan={setRingkasan} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0 8px' }}>
        <div style={{ flex: 1, fontWeight: 700, fontSize: 15 }}>Progress per item</div>
        {!isMobile && (
          <div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
            {[['tabel', 'Tabel'], ['kartu', 'Kartu']].map(([k, l]) => (
              <button type="button" key={k} onClick={() => setView(k)}
                style={{ border: 'none', padding: '6px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: view === k ? '#2563eb' : C.card, color: view === k ? '#fff' : C.text }}>
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      <Legenda C={C} />

      {view === 'tabel' && !isMobile ? (
        <TabelItem cust={cust} kolom={kolom} ui={ui} poin={poin} onPilih={(itemId, cat) => setSheet({ itemId, cat })} />
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {cust.items.map((it, idx) => (
            <KartuItem key={it.id} it={it} no={idx + 1} ui={ui} poin={poin} onPilih={(cat) => setSheet({ itemId: it.id, cat })} />
          ))}
        </div>
      )}

      {item && (
        <SheetCategory
          item={item}
          cat={sheet.cat}
          info={catInfo}
          poin={poin.filter((p) => p.item_id === item.id && (sheet.cat === 'BarangJadi' ? !p.category : (p.category === sheet.cat || !p.category)))}
          ui={ui}
          refresh={refresh}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
};

const Legenda = ({ C }) => (
  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 11, color: C.muted, marginBottom: 8 }}>
    {Object.entries(STATUS_COLOR).map(([s, col]) => (
      <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 10, height: 10, borderRadius: 3, background: col }} />{s}
      </span>
    ))}
    <span>· 💬 komentar · ☑ to-do · <b style={{ color: '#dc2626' }}>merah</b> = deadline supplier lewat</span>
  </div>
);

// Kartu kecil satu category.
const MiniCard = ({ c, ui, onClick, umum, jumlahPoin }) => {
  const { C } = ui;
  const col = umum ? '#64748b' : (STATUS_COLOR[c.status] || '#94a3b8');
  const todoSisa = c.todo.total - c.todo.done;
  return (
    <div role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => e.key === 'Enter' && onClick()}
      style={{
        background: c.telat ? (ui.dark ? 'rgba(220,38,38,0.12)' : '#fef2f2') : C.card,
        border: `1px solid ${c.telat ? '#fca5a5' : C.border}`, borderTop: `4px solid ${col}`,
        borderRadius: 10, padding: '6px 8px', cursor: 'pointer', minHeight: 64, minWidth: 0,
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <b style={{ fontSize: 13, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{umum ? 'Umum' : labelKategori(c.category)}</b>
        {!umum && <span style={{ fontSize: 10, fontWeight: 700, color: col, whiteSpace: 'nowrap' }}>{c.status}</span>}
      </div>
      {!umum && (
        <>
          <div style={{ fontSize: 12, color: c.supplier ? C.text : C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {c.supplier || 'Supplier belum ada'}
          </div>
          <div style={{ fontSize: 11, color: c.telat ? '#dc2626' : C.muted, fontWeight: c.telat ? 700 : 400, whiteSpace: 'nowrap' }}>
            {c.order_date ? `${tgl(c.order_date)} → ` : ''}{c.deadline ? tgl(c.deadline) : 'tanpa deadline'}
            {c.telat ? ` (telat ${-c.sisa_hari} hr)` : ''}
          </div>
        </>
      )}
      <div style={{ display: 'flex', gap: 8, fontSize: 11, color: C.muted, marginTop: 2 }}>
        <span style={{ color: baru(c.komentar_terakhir) ? '#2563eb' : C.muted, fontWeight: baru(c.komentar_terakhir) ? 700 : 400 }}>💬 {c.komentar}</span>
        {c.todo.total > 0 && <span style={{ color: todoSisa ? '#d97706' : '#16a34a' }}>☑ {c.todo.done}/{c.todo.total}</span>}
        {jumlahPoin > 0 && <span style={{ color: '#7c3aed', fontWeight: 600 }}>✨ {jumlahPoin}</span>}
      </div>
    </div>
  );
};

const hitungPoin = (poin, itemId, cat) => poin.filter((p) => p.item_id === itemId && (cat === 'BarangJadi' ? !p.category : p.category === cat)).length;

const InfoItem = ({ it, no, ui }) => {
  const { C, kirimBadge } = ui;
  const kirim = kirimBadge(it.sisa_hari);
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 0 }}>
      {it.image ? (
        <span onClick={(e) => e.stopPropagation()} style={{ flex: '0 0 48px' }}>
          <Image src={getImageUrl(it.image)} width={48} height={48} preview={PREVIEW} style={{ borderRadius: 8, objectFit: 'cover' }} />
        </span>
      ) : <div style={{ width: 48, height: 48, borderRadius: 8, background: C.soft, flex: '0 0 48px' }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3, wordBreak: 'break-word' }}>
          <span style={{ color: C.muted }}>{no}.</span> {it.nama} {it.qty != null && <span style={{ color: C.muted, fontWeight: 400 }}>× {it.qty}</span>}
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>
          {it.kode_invoice} · <span style={{ color: kirim.color, fontWeight: it.sisa_hari != null && it.sisa_hari < 0 ? 700 : 400 }}>{kirim.text}</span>
          {' · '}{it.progress.beres}/{it.progress.total} beres
        </div>
      </div>
    </div>
  );
};

const KartuItem = ({ it, no, ui, poin, onPilih }) => {
  const { C } = ui;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 10 }}>
      <InfoItem it={it} no={no} ui={ui} />
      <div style={{ display: 'grid', gap: 6, gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', marginTop: 8 }}>
        {it.categories.map((c) => (
          <MiniCard key={c.category} c={c} ui={ui} jumlahPoin={hitungPoin(poin, it.id, c.category)} onClick={() => onPilih(c.category)} />
        ))}
        <MiniCard umum c={it.umum} ui={ui} jumlahPoin={hitungPoin(poin, it.id, 'BarangJadi')} onClick={() => onPilih('BarangJadi')} />
      </div>
      {it.categories.length === 0 && <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>Belum ada category berproses (belum dianalisa PM).</div>}
    </div>
  );
};

// Desktop: satu tabel item × category — seluruh order customer terlihat sekaligus.
const TabelItem = ({ cust, kolom, ui, poin, onPilih }) => {
  const { C } = ui;
  const th = { textAlign: 'left', fontSize: 12, color: C.muted, fontWeight: 600, padding: '6px 6px', position: 'sticky', top: 0, background: C.bg, zIndex: 1 };
  return (
    <div style={{ overflowX: 'auto', border: `1px solid ${C.border}`, borderRadius: 12, background: C.card }}>
      <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', minWidth: 300 + (kolom.length + 1) * 150 }}>
        <thead>
          <tr>
            <th style={{ ...th, minWidth: 260, position: 'sticky', left: 0, zIndex: 2 }}>Item</th>
            {kolom.map((k) => <th key={k} style={th}>{labelKategori(k)}</th>)}
            <th style={th}>Umum</th>
          </tr>
        </thead>
        <tbody>
          {cust.items.map((it, idx) => (
            <tr key={it.id}>
              <td style={{ padding: 6, borderTop: `1px solid ${C.border}`, position: 'sticky', left: 0, background: C.card, zIndex: 1, verticalAlign: 'top' }}>
                <InfoItem it={it} no={idx + 1} ui={ui} />
              </td>
              {kolom.map((k) => {
                const c = it.categories.find((x) => x.category === k);
                return (
                  <td key={k} style={{ padding: 4, borderTop: `1px solid ${C.border}`, verticalAlign: 'top', width: 150 }}>
                    {c ? <MiniCard c={c} ui={ui} jumlahPoin={hitungPoin(poin, it.id, k)} onClick={() => onPilih(it.id, k)} />
                      : <div style={{ textAlign: 'center', color: C.border, fontSize: 18, paddingTop: 18 }}>—</div>}
                  </td>
                );
              })}
              <td style={{ padding: 4, borderTop: `1px solid ${C.border}`, verticalAlign: 'top', width: 120 }}>
                <MiniCard umum c={it.umum} ui={ui} jumlahPoin={hitungPoin(poin, it.id, 'BarangJadi')} onClick={() => onPilih(it.id, 'BarangJadi')} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================================
// Ringkasan AI chat WhatsApp customer
// ============================================================================
const PanelChat = ({ cust, ui, ringkasan, setRingkasan }) => {
  const { C, baseUrl, sBtn, chip } = ui;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fJenis, setFJenis] = useState('');
  const [semua, setSemua] = useState(false);
  const [buka, setBuka] = useState(true);
  const [chatSheet, setChatSheet] = useState(null); // kutipan yang dicari ('' = buka saja)
  const [todoPoin, setTodoPoin] = useState(null);
  const sudahAuto = useRef(false);

  const perbarui = useCallback(async (force = false) => {
    setLoading(true); setError('');
    try {
      const r = await fetch(`${baseUrl}/papan-order/wa-ringkasan`, { method: 'POST', headers: aiHeaders(), body: JSON.stringify({ key: cust.key, force }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Gagal membaca chat');
      if (d.status === 'ok') setRingkasan(d);
      else setError(d.message || 'Ringkasan belum bisa dibuat');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, cust.key, setRingkasan]);

  // Buka halaman customer → tampilkan ringkasan tersimpan; kalau belum ada / ada chat baru, AI membaca otomatis.
  useEffect(() => {
    setRingkasan(null);
    sudahAuto.current = false;
    if (!cust.wa.length || !cust.chat?.ada) return;
    fetch(`${baseUrl}/papan-order/wa-ringkasan?key=${encodeURIComponent(cust.key)}`).then((r) => r.json()).then((d) => {
      if (d.status === 'ok') setRingkasan(d);
      if ((d.status !== 'ok' || cust.chat.ada_pesan_baru) && !sudahAuto.current) {
        sudahAuto.current = true;
        perbarui(false);
      }
    }).catch(() => {});
  }, [baseUrl, cust.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const poin = useMemo(() => {
    const list = [...(ringkasan?.poin || [])];
    list.sort((a, b) => (b.penting - a.penting) || (URUT_JENIS.indexOf(a.jenis) - URUT_JENIS.indexOf(b.jenis)) || String(b.tanggal || '').localeCompare(String(a.tanggal || '')));
    return list;
  }, [ringkasan]);
  const perJenis = useMemo(() => {
    const c = {};
    poin.forEach((p) => { c[p.jenis] = (c[p.jenis] || 0) + 1; });
    return c;
  }, [poin]);
  const tampil = poin.filter((p) => !fJenis || p.jenis === fJenis);
  const terlihat = semua ? tampil : tampil.slice(0, 8);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div role="button" tabIndex={0} onClick={() => setBuka((v) => !v)} onKeyDown={(e) => e.key === 'Enter' && setBuka((v) => !v)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>✨ Poin penting dari chat WA {buka ? '▾' : '▸'}</div>
          <div style={{ fontSize: 11, color: C.muted }}>
            {!cust.wa.length ? 'Nomor WA customer belum ada di invoice / CRM / data customer'
              : !cust.chat?.ada ? `Belum ada chat tersimpan untuk ${cust.wa.join(', ')}`
                : ringkasan ? `Dibaca AI ${waktuWIB(ringkasan.generated_at)} · ${ringkasan.jumlah_pesan} pesan · chat terakhir ${waktuWIB(ringkasan.pesan_terakhir_at)}`
                  : 'Belum dibaca AI'}
          </div>
        </div>
        {cust.chat?.ada && (
          <>
            <button type="button" style={{ ...sBtn(C.soft, C.text), padding: '8px 10px' }} onClick={() => setChatSheet('')}>Chat</button>
            <button type="button" disabled={loading} style={{ ...sBtn('#7c3aed'), padding: '8px 10px', opacity: loading ? 0.6 : 1 }} onClick={() => perbarui(true)}>
              {loading ? 'Membaca…' : 'Baca ulang'}
            </button>
          </>
        )}
      </div>

      {buka && (
        <>
          {loading && <div style={{ fontSize: 13, color: '#7c3aed', marginTop: 8 }}>AI sedang membaca chat customer… (± 20–60 detik)</div>}
          {error && <div style={{ fontSize: 13, color: '#b91c1c', background: '#fee2e2', borderRadius: 8, padding: '6px 8px', marginTop: 8 }}>{error}</div>}
          {ringkasan?.ringkasan && <div style={{ fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>{ringkasan.ringkasan}</div>}

          {poin.length > 0 && (
            <div style={{ display: 'flex', gap: 5, overflowX: 'auto', margin: '10px 0 6px', paddingBottom: 2 }}>
              <button type="button" onClick={() => setFJenis('')}
                style={{ flex: '0 0 auto', borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${!fJenis ? '#2563eb' : C.border}`, background: !fJenis ? '#2563eb' : C.card, color: !fJenis ? '#fff' : C.text }}>
                Semua {poin.length}
              </button>
              {URUT_JENIS.filter((j) => perJenis[j]).map((j) => (
                <button type="button" key={j} onClick={() => setFJenis(j)}
                  style={{ flex: '0 0 auto', borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${fJenis === j ? JENIS_POIN[j].color : C.border}`, background: fJenis === j ? JENIS_POIN[j].color : C.card, color: fJenis === j ? '#fff' : C.text }}>
                  {JENIS_POIN[j].label} {perJenis[j]}
                </button>
              ))}
            </div>
          )}

          {terlihat.map((p, i) => (
            <KartuPoin key={i} p={p} ui={ui} onTodo={() => setTodoPoin(p)} onChat={() => setChatSheet(p.kutipan || '')} />
          ))}
          {tampil.length > terlihat.length && (
            <button type="button" style={{ ...sBtn(C.soft, C.text), width: '100%', marginTop: 4 }} onClick={() => setSemua(true)}>Lihat semua {tampil.length} poin</button>
          )}
          {ringkasan && !poin.length && <div style={{ fontSize: 13, color: C.muted, marginTop: 8 }}>Tidak ada poin penting dari chat.</div>}
          {ringkasan && <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Isi foto & voice note tidak terbaca AI. Cek kutipan ke chat asli sebelum bertindak. <span style={chip('#64748b')}>AI</span></div>}
        </>
      )}

      {chatSheet != null && <SheetChat cust={cust} cari={chatSheet} ui={ui} onClose={() => setChatSheet(null)} />}
      {todoPoin && <SheetTodoPoin p={todoPoin} cust={cust} ui={ui} onClose={() => setTodoPoin(null)} />}
    </div>
  );
};

const KartuPoin = ({ p, ui, onTodo, onChat, ringkas }) => {
  const { C, chip } = ui;
  const j = JENIS_POIN[p.jenis] || JENIS_POIN.lainnya;
  return (
    <div style={{ borderLeft: `4px solid ${j.color}`, background: C.soft, borderRadius: 8, padding: '8px 10px', marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', marginBottom: 2 }}>
        <span style={chip(j.color)}>{j.label}</span>
        {p.penting && <span style={chip('#b91c1c')}>Penting</span>}
        {!ringkas && p.item_nama && <span style={{ fontSize: 11, fontWeight: 600 }}>{p.item_nama}</span>}
        {!ringkas && p.category && <span style={{ fontSize: 11, color: C.muted }}>· {namaCat(p.category)}</span>}
        {p.tanggal && <span style={{ fontSize: 11, color: C.muted }}>· {tgl(p.tanggal)}</span>}
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.45, wordBreak: 'break-word' }}>{p.teks}</div>
      {p.kutipan && (
        <div style={{ fontSize: 12, color: C.muted, fontStyle: 'italic', marginTop: 3, wordBreak: 'break-word' }}>
          “{p.kutipan}” {!p.kutipan_terverifikasi && <span style={{ fontStyle: 'normal', color: '#d97706' }}>(kutipan tidak persis — cek chat)</span>}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <button type="button" onClick={onTodo} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.text, borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', minHeight: 32 }}>＋ To-do</button>
        {onChat && <button type="button" onClick={onChat} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.text, borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', minHeight: 32 }}>Lihat di chat</button>}
      </div>
    </div>
  );
};

// Chat asli customer; kalau ada kutipan, pesan yang cocok disorot & digulir ke sana.
const SheetChat = ({ cust, cari, ui, onClose }) => {
  const { C, baseUrl } = ui;
  const [data, setData] = useState(null);
  const sorot = useRef(null);
  useEffect(() => {
    fetch(`${baseUrl}/papan-order/wa-chat?key=${encodeURIComponent(cust.key)}&limit=500`).then((r) => r.json()).then(setData).catch(() => setData({ pesan: [] }));
  }, [baseUrl, cust.key]);
  const norm = (s) => String(s || '').toLowerCase().replace(/[\s…."'“”]+/g, ' ').trim();
  const kunci = norm(cari).slice(0, 40);
  const idxCocok = useMemo(() => {
    if (!kunci || !data?.pesan) return -1;
    for (let i = data.pesan.length - 1; i >= 0; i -= 1) if (norm(data.pesan[i].text).includes(kunci)) return i;
    return -1;
  }, [data, kunci]);
  useEffect(() => { if (sorot.current) sorot.current.scrollIntoView({ block: 'center' }); }, [data, idxCocok]);
  const jenisMedia = { image: '[foto]', video: '[video]', document: '[dokumen]', audio: '[voice note]', sticker: '[stiker]', location: '[lokasi]' };

  return (
    <Sheet C={C} onClose={onClose} title={`Chat WA · ${cust.nama}`}>
      {!data && <div style={{ color: C.muted }}>Memuat chat…</div>}
      {data && kunci && idxCocok < 0 && <div style={{ fontSize: 12, color: '#d97706', marginBottom: 8 }}>Kutipan tidak ditemukan persis di 500 pesan terakhir.</div>}
      {data?.pesan?.map((m, i) => {
        const kita = m.arah !== 'masuk';
        const cocok = i === idxCocok;
        return (
          <div key={i} ref={cocok ? sorot : null} style={{ display: 'flex', justifyContent: kita ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
            <div style={{
              maxWidth: '82%', borderRadius: 10, padding: '6px 9px', fontSize: 14, whiteSpace: 'pre-line', wordBreak: 'break-word',
              background: cocok ? '#fde68a' : kita ? (ui.dark ? '#14532d' : '#dcfce7') : C.soft, color: cocok ? '#111' : C.text,
            }}>
              {jenisMedia[m.type] && <span style={{ color: cocok ? '#444' : C.muted }}>{jenisMedia[m.type]} </span>}
              {m.text}
              <div style={{ fontSize: 10, color: cocok ? '#444' : C.muted, textAlign: 'right', marginTop: 2 }}>{waktuWIB(m.timestamp)}</div>
            </div>
          </div>
        );
      })}
    </Sheet>
  );
};

// Jadikan poin chat → to-do category item (pilih item & category kalau AI belum yakin).
const SheetTodoPoin = ({ p, cust, ui, onClose }) => {
  const { C, sInput, sBtn, post, busy } = ui;
  const [itemId, setItemId] = useState(p.item_id || (cust.items.length === 1 ? cust.items[0].id : ''));
  const [cat, setCat] = useState(p.category || 'BarangJadi');
  const [text, setText] = useState(`[Chat WA${p.tanggal ? ` ${tgl(p.tanggal)}` : ''}] ${p.teks}`);
  const item = cust.items.find((i) => i.id === itemId);
  const pilihanCat = item ? [...item.categories.map((c) => c.category), 'BarangJadi'] : ['BarangJadi'];
  useEffect(() => { if (item && !pilihanCat.includes(cat)) setCat(p.category && pilihanCat.includes(p.category) ? p.category : 'BarangJadi'); }, [itemId]); // eslint-disable-line react-hooks/exhaustive-deps

  const simpan = async () => {
    if (await post('/projects/todo/item', { projectId: itemId, category: cat, op: 'add', text: text.trim() })) onClose();
  };
  return (
    <Sheet C={C} onClose={onClose} title="Jadikan to-do">
      <Label C={C}>Item</Label>
      <select style={{ ...sInput, width: '100%' }} value={itemId} onChange={(e) => setItemId(e.target.value)}>
        <option value="">— pilih item —</option>
        {cust.items.map((i, idx) => <option key={i.id} value={i.id}>{idx + 1}. {i.nama} ({i.kode_invoice})</option>)}
      </select>
      <Label C={C}>Category</Label>
      <select style={{ ...sInput, width: '100%' }} value={cat} onChange={(e) => setCat(e.target.value)}>
        {pilihanCat.map((k) => <option key={k} value={k}>{namaCat(k)}</option>)}
      </select>
      <Label C={C}>To-do</Label>
      <textarea style={{ ...sInput, width: '100%', minHeight: 90 }} value={text} onChange={(e) => setText(e.target.value)} />
      <button type="button" disabled={busy || !itemId || !text.trim()} style={{ ...sBtn('#2563eb'), width: '100%', marginTop: 14, opacity: !itemId || !text.trim() ? 0.5 : 1 }} onClick={simpan}>
        Simpan to-do
      </button>
    </Sheet>
  );
};

// ============================================================================
// Sheet satu category: info + status cepat + poin chat terkait + to-do + komentar
// ============================================================================
const SheetCategory = ({ item, cat, info, poin, ui, refresh, onClose }) => {
  const { C, baseUrl, sBtn, sInput, chip, users, userList, user, dark, busy, post, navigate } = ui;
  const [proj, setProj] = useState(null);
  const umum = cat === 'BarangJadi';

  const loadProj = useCallback(async () => {
    try {
      const r = await fetch(`${baseUrl}/projects/detail`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: item.id }) });
      if (r.ok) setProj(await r.json());
    } catch { /* abaikan — sheet tetap bisa dipakai */ }
  }, [baseUrl, item.id]);
  useEffect(() => { setProj(null); loadProj(); }, [loadProj, cat]);

  const gambar = useMemo(() => gambarCategory(proj, cat, item.image), [proj, cat, item.image]);
  const ubahTodo = async (body) => { if (await post('/projects/todo/item', { projectId: item.id, category: cat, ...body }, { refresh: false })) { await loadProj(); refresh(); } };
  const ubahStatus = async (s) => {
    if (busy || s === info?.status) return;
    if (await post('/projects/update/category-status', { slug: item.id, category: cat, categoryStatus: s })) loadProj();
  };
  const deskripsi = proj ? (umum ? proj.Spesifikasi : proj[`Description${cat}`]) : null;
  const col = info ? (STATUS_COLOR[info.status] || '#94a3b8') : '#64748b';
  const baris = (label, isi, warna) => (
    <div style={{ display: 'flex', gap: 8, fontSize: 14, padding: '4px 0', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ width: 110, flex: 'none', color: C.muted }}>{label}</div>
      <div style={{ flex: 1, minWidth: 0, color: warna || C.text, fontWeight: warna ? 700 : 400, wordBreak: 'break-word' }}>{isi}</div>
    </div>
  );

  return (
    <Sheet C={C} onClose={onClose} title={`${namaCat(cat)} · ${item.nama}`} maxWidth={720}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {info && <span style={chip(col)}>{info.status}</span>}
        <span style={{ fontSize: 12, color: C.muted }}>{item.kode_invoice} · qty {item.qty ?? '-'}</span>
      </div>

      {gambar.length > 0 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginTop: 10, paddingBottom: 2 }}>
          <Image.PreviewGroup preview={PREVIEW}>
            {gambar.map((u, i) => (
              <div key={u} style={{ flex: '0 0 auto' }}>
                <Image src={getImageUrl(u)} width={i === 0 ? 96 : 72} height={i === 0 ? 96 : 72} style={{ borderRadius: 10, objectFit: 'cover' }} />
              </div>
            ))}
          </Image.PreviewGroup>
        </div>
      )}

      {info && (
        <div style={{ marginTop: 10 }}>
          {baris('Supplier', info.supplier || 'Belum ada')}
          {baris('Tanggal order', info.order_date ? tgl(info.order_date) : '—')}
          {baris('Deadline', info.deadline ? `${tgl(info.deadline)}${info.telat ? ` · telat ${-info.sisa_hari} hari` : info.sisa_hari != null && !info.beres ? ` · H-${info.sisa_hari}` : ''}` : '—', info.telat ? '#dc2626' : null)}
          {baris('Target kirim', item.target_kirim ? tgl(item.target_kirim) : '—')}

          <Label C={C}>Status category</Label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[...new Set([...STATUS_CEPAT, info.status])].map((s) => {
              const on = s === info.status;
              const warna = STATUS_COLOR[s] || '#64748b';
              return (
                <button type="button" key={s} disabled={busy || !STATUS_CEPAT.includes(s)} onClick={() => ubahStatus(s)}
                  style={{ borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 40, border: `2px solid ${warna}`, background: on ? warna : C.card, color: on ? '#fff' : C.text }}>
                  {s}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>QC Pass / Servis lewat Alur Kerja di halaman project. Supplier & tanggal diubah di project (tombol di bawah).</div>
        </div>
      )}

      <Label C={C}>{umum ? 'Deskripsi produk' : `Deskripsi ${namaCat(cat)}`}</Label>
      <div style={{ fontSize: 14, whiteSpace: 'pre-line', wordBreak: 'break-word', background: C.soft, borderRadius: 8, padding: '6px 8px', color: deskripsi ? C.text : C.muted }}>
        {proj ? (deskripsi || 'Belum ada deskripsi.') : 'Memuat…'}
      </div>

      {poin.length > 0 && (
        <>
          <Label C={C}>✨ Dari chat WA customer</Label>
          {poin.map((p, i) => <KartuPoin key={i} p={p} ui={ui} ringkas onTodo={() => ubahTodo({ op: 'add', text: `[Chat WA${p.tanggal ? ` ${tgl(p.tanggal)}` : ''}] ${p.teks}` })} />)}
        </>
      )}

      <div style={{ marginTop: 12 }}>
        <button type="button" style={{ ...sBtn('#2563eb'), width: '100%' }} onClick={() => navigate(umum ? `/project/${item.id}` : `/project/${item.id}/${cat}`)}>Buka di halaman project</button>
      </div>

      <TodoKomentar projectId={item.id} cat={cat} proj={proj} ubahTodo={ubahTodo} busy={busy} C={C}
        users={users} userList={userList} user={user} baseUrl={baseUrl} dark={dark} sInput={sInput} sBtn={sBtn} onKomentar={refresh} />
    </Sheet>
  );
};

export default PapanOrder;
