import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Image, Mentions } from 'antd';
import { IoRefresh, IoArrowBack } from 'react-icons/io5';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useTheme } from '../../ThemeContext';
import { getImageUrl } from '../../Utils/image';
import { labelKategori } from '../../Utils/kategori';
import useIsMobile from '../../Utils/useIsMobile';
import { Sheet, Label, PREVIEW, TeksMention, Lampiran } from '../Todo/categoryThread';
import ImageUploadZone from '../Pekerjaan/ImageUploadZone';
import { mintaRefreshNotif } from '../../Utils/notifRefresh';

// ============================================================================
// PAPAN ORDER (percobaan) — semua progress order dalam satu layar
// ============================================================================
// customer (urut target kirim terdekat) → semua item order customer itu
// (urut masuk PO) → kartu kecil per category yang memang ada prosesnya.
// Ketuk item = satu sheet berisi SEMUA category berdampingan: status, supplier,
// tanggal order & deadline, foto (slider), komentar terbaru (paling ditonjolkan),
// to-do. Di halaman customer, AI membaca
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

      {sheet && (
        <SheetItem
          cust={cust}
          itemId={sheet.itemId}
          fokus={sheet.cat}
          poin={poin}
          ui={ui}
          refresh={refresh}
          onPindah={(itemId) => setSheet({ itemId, cat: null })}
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
    <span>· 💬 komentar · ☑ to-do · <b style={{ color: '#dc2626' }}>merah</b> = deadline supplier lewat · <b>ketuk item untuk lihat semua progress-nya</b></span>
  </div>
);

// Kartu kecil satu category.
const MiniCard = ({ c, ui, onClick, umum, jumlahPoin }) => {
  const { C } = ui;
  const col = umum ? '#64748b' : (STATUS_COLOR[c.status] || '#94a3b8');
  const todoSisa = c.todo.total - c.todo.done;
  return (
    <div role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); onClick(); }}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onClick(); } }}
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

const hitungPoin = (poin, itemId, cat) => poin.filter((p) => !p.clear && p.item_id === itemId && (cat === 'BarangJadi' ? !p.category : p.category === cat)).length;

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
    <div role="button" tabIndex={0} onClick={() => onPilih(null)} onKeyDown={(e) => e.key === 'Enter' && onPilih(null)}
      style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 10, cursor: 'pointer' }}>
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
            <tr key={it.id} onClick={() => onPilih(it.id, null)} style={{ cursor: 'pointer' }}>
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
    list.sort((a, b) => (!!a.clear - !!b.clear) || (b.penting - a.penting) || (URUT_JENIS.indexOf(a.jenis) - URUT_JENIS.indexOf(b.jenis)) || String(b.tanggal || '').localeCompare(String(a.tanggal || '')));
    return list;
  }, [ringkasan]);
  const perJenis = useMemo(() => {
    const c = {};
    poin.forEach((p) => { if (!p.clear) c[p.jenis] = (c[p.jenis] || 0) + 1; });
    return c;
  }, [poin]);
  const jumlahClear = poin.filter((p) => p.clear).length;

  // Centang poin sudah clear / batalkan — tersimpan di server, tetap ada walau AI membaca ulang.
  const ubahClear = async (p, clear) => {
    try {
      const r = await fetch(`${baseUrl}/papan-order/wa-ringkasan/clear`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: cust.key, poin_key: p.key, clear, by: ui.user?.uid || '' }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Gagal menyimpan');
      setRingkasan(d);
    } catch (err) {
      alert(err.message);
    }
  };
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
                Semua {poin.length - jumlahClear}{jumlahClear ? ` · ✓ ${jumlahClear} clear` : ''}
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
            <KartuPoin key={p.key || i} p={p} ui={ui} onTodo={() => setTodoPoin(p)} onChat={() => setChatSheet(p.kutipan || '')} onClear={(v) => ubahClear(p, v)} />
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

const KartuPoin = ({ p, ui, onTodo, onChat, onClear, ringkas }) => {
  const { C, chip, dark } = ui;
  const j = JENIS_POIN[p.jenis] || JENIS_POIN.lainnya;
  const green = '#16a34a';
  const sBtnKecil = { border: `1px solid ${C.border}`, background: C.card, color: C.text, borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', minHeight: 32 };
  return (
    <div style={{
      borderLeft: `4px solid ${p.clear ? green : j.color}`, borderRadius: 8, padding: '8px 10px', marginTop: 6,
      background: p.clear ? (dark ? 'rgba(22,163,74,0.12)' : '#f0fdf4') : C.soft,
      border: p.clear ? `1px solid ${dark ? 'rgba(22,163,74,0.4)' : '#bbf7d0'}` : '1px solid transparent',
    }}>
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
      <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {onClear && (p.clear ? (
          <button type="button" onClick={() => onClear(false)} title="Batalkan clear"
            style={{ ...sBtnKecil, background: green, color: '#fff', border: `1px solid ${green}` }}>✓ Clear</button>
        ) : (
          <button type="button" onClick={() => onClear(true)} style={{ ...sBtnKecil, color: green, border: `1px solid ${green}` }}>✓ Tandai clear</button>
        ))}
        {!p.clear && <button type="button" onClick={onTodo} style={sBtnKecil}>＋ To-do</button>}
        {onChat && <button type="button" onClick={onChat} style={sBtnKecil}>Lihat di chat</button>}
        {p.clear && <span style={{ fontSize: 11, color: green }}>oleh {p.clear.oleh || '—'} · {waktuWIB(p.clear.at)}</span>}
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
// Sheet satu ITEM: semua category berproses tampil berdampingan dalam satu layar.
// Yang paling ditonjolkan = komentar terbaru (update paling akurat dari lapangan).
// ============================================================================
const SheetItem = ({ cust, itemId, fokus, poin, ui, refresh, onPindah, onClose }) => {
  const { C, baseUrl, sBtn, chip, kirimBadge, isMobile, navigate, busy, post } = ui;
  const idx = cust.items.findIndex((i) => i.id === itemId);
  const item = cust.items[idx];
  const [proj, setProj] = useState(null);
  const [showUmum, setShowUmum] = useState(false);
  const [semuaPoin, setSemuaPoin] = useState(false);

  const loadProj = useCallback(async () => {
    try {
      const r = await fetch(`${baseUrl}/projects/detail`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: itemId }) });
      if (r.ok) setProj(await r.json());
    } catch { /* abaikan — sheet tetap bisa dipakai */ }
  }, [baseUrl, itemId]);
  useEffect(() => { setProj(null); setShowUmum(false); setSemuaPoin(false); loadProj(); }, [loadProj]);

  // Kartu yang diketuk di tabel → gulir ke panel category itu.
  useEffect(() => {
    if (!fokus || !item) return;
    const el = document.getElementById(`panel-${item.id}-${fokus}`);
    if (el) setTimeout(() => el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }), 150);
  }, [fokus, item]);

  if (!item) return null;
  const kirim = kirimBadge(item.sisa_hari);
  const umumAda = showUmum || item.umum.komentar > 0 || item.umum.todo.total > 0;
  const panels = [...item.categories.map((c) => ({ cat: c.category, info: c })), ...(umumAda ? [{ cat: 'BarangJadi', info: null }] : [])];
  const poinItem = poin.filter((p) => p.item_id === item.id).sort((a, b) => !!a.clear - !!b.clear);
  const ubahTodo = (cat) => async (body) => {
    if (await post('/projects/todo/item', { projectId: item.id, category: cat, ...body }, { refresh: false })) { await loadProj(); refresh(); }
  };
  const navBtn = (aktif) => ({ ...sBtn(C.soft, C.text), padding: '6px 12px', opacity: aktif ? 1 : 0.35 });

  return (
    <Sheet C={C} onClose={onClose} maxWidth={1400}
      title={`${idx + 1}/${cust.items.length} · ${item.nama}${item.qty != null ? ` × ${item.qty}` : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {item.image && (
          <Image src={getImageUrl(item.image)} width={44} height={44} preview={PREVIEW} style={{ borderRadius: 8, objectFit: 'cover' }} />
        )}
        <div style={{ flex: 1, minWidth: 160, fontSize: 12, color: C.muted }}>
          {item.kode_invoice} · <span style={{ color: kirim.color, fontWeight: 700 }}>{kirim.text}</span>
          {item.target_kirim ? ` (${tgl(item.target_kirim)})` : ''} · {item.progress.beres}/{item.progress.total} beres
        </div>
        <button type="button" disabled={idx <= 0} style={navBtn(idx > 0)} onClick={() => onPindah(cust.items[idx - 1].id)} aria-label="Item sebelumnya">‹</button>
        <button type="button" disabled={idx >= cust.items.length - 1} style={navBtn(idx < cust.items.length - 1)} onClick={() => onPindah(cust.items[idx + 1].id)} aria-label="Item berikutnya">›</button>
        <button type="button" style={{ ...sBtn('#2563eb'), padding: '6px 12px' }} onClick={() => navigate(`/project/${item.id}`)}>Project</button>
      </div>

      {poinItem.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {(semuaPoin ? poinItem : poinItem.slice(0, 2)).map((p, i) => (
            <div key={i} style={{ fontSize: 13, display: 'flex', gap: 6, alignItems: 'baseline', padding: '3px 6px', borderRadius: 6, background: p.clear ? (ui.dark ? 'rgba(22,163,74,0.12)' : '#f0fdf4') : 'transparent' }}>
              <span style={chip(p.clear ? '#16a34a' : (JENIS_POIN[p.jenis] || JENIS_POIN.lainnya).color)}>{p.clear ? '✓ Clear' : (JENIS_POIN[p.jenis] || JENIS_POIN.lainnya).label}</span>
              <span style={{ flex: 1, minWidth: 0 }}>{p.category ? <b>{namaCat(p.category)}: </b> : null}{p.teks}</span>
            </div>
          ))}
          {poinItem.length > 2 && (
            <button type="button" onClick={() => setSemuaPoin((v) => !v)} style={{ border: 'none', background: 'none', color: '#7c3aed', fontSize: 12, fontWeight: 600, padding: 0, cursor: 'pointer' }}>
              {semuaPoin ? 'Ringkas' : `✨ ${poinItem.length - 2} poin chat lagi`}
            </button>
          )}
        </div>
      )}

      {item.categories.length === 0 && <div style={{ fontSize: 13, color: C.muted, marginTop: 10 }}>Belum ada category berproses (belum dianalisa PM).</div>}

      <div style={{
        display: 'grid', gap: 10, marginTop: 10, alignItems: 'start',
        gridTemplateColumns: isMobile ? '1fr' : `repeat(${Math.min(Math.max(panels.length, 1), 5)}, minmax(230px, 1fr))`,
        overflowX: isMobile ? 'visible' : 'auto', paddingBottom: 4,
      }}>
        {panels.map(({ cat, info }) => (
          <PanelCategory key={`${item.id}-${cat}`} item={item} cat={cat} info={info} proj={proj} fokus={fokus === cat}
            ubahTodo={ubahTodo(cat)} ui={ui} refresh={refresh} busy={busy} />
        ))}
      </div>
      {!umumAda && (
        <button type="button" onClick={() => setShowUmum(true)} style={{ ...sBtn(C.soft, C.text), marginTop: 10, width: isMobile ? '100%' : 'auto' }}>＋ Komentar / to-do Umum</button>
      )}
    </Sheet>
  );
};

// Satu category dalam sheet item: status, supplier & tanggal, foto (slider), komentar terbaru, to-do.
const PanelCategory = ({ item, cat, info, proj, fokus, ubahTodo, ui, refresh, busy }) => {
  const { C, baseUrl, users, userList, user, dark, post, sBtn } = ui;
  const umum = cat === 'BarangJadi';
  const col = info ? (STATUS_COLOR[info.status] || '#94a3b8') : '#64748b';

  const [comments, setComments] = useState(null);
  const [replies, setReplies] = useState([]);
  const [komen, setKomen] = useState('');
  const [files, setFiles] = useState([]);
  const [showFiles, setShowFiles] = useState(false);
  const [sending, setSending] = useState(false);
  const [bukaTodo, setBukaTodo] = useState(false);
  const [todoText, setTodoText] = useState('');
  const [preview, setPreview] = useState(false);

  const loadComments = useCallback(async () => {
    const opt = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: item.id, category: cat }) };
    try {
      const [c, r] = await Promise.all([fetch(`${baseUrl}/comments/list`, opt), fetch(`${baseUrl}/replies/list`, opt)]);
      setComments(c.ok ? await c.json() : []);
      setReplies(r.ok ? await r.json() : []);
    } catch { setComments([]); }
  }, [baseUrl, item.id, cat]);
  useEffect(() => { setComments(null); loadComments(); }, [loadComments]);

  // Thread komentar urut tanggal (lama → terbaru, seperti chat); aktivitas = komentar atau balasan terakhirnya.
  const detik = (d) => d?.date?.value?._seconds || (d?.date ? new Date(d.date).getTime() / 1000 : 0) || 0;
  const threads = useMemo(() => (comments || []).map((c) => {
    const rs = replies.filter((r) => r.commentId === c.id).sort((a, b) => detik(a) - detik(b));
    return { c, rs, last: Math.max(detik(c), ...rs.map(detik)) };
  }).sort((a, b) => a.last - b.last), [comments, replies]);
  // Gulir ke bawah → 2 komentar terbaru langsung terlihat, riwayat di atasnya.
  const kotakKomen = useRef(null);
  useEffect(() => { if (kotakKomen.current) kotakKomen.current.scrollTop = kotakKomen.current.scrollHeight; }, [threads]);

  const foto = useMemo(() => {
    if (!proj) return [];
    const rx = new RegExp(`^image${cat}\\d+$`);
    return Object.keys(proj).filter((k) => rx.test(k) && proj[k]).sort((a, b) => Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, '')))
      .map((k) => proj[k]).filter((u) => typeof u === 'string' && !/\.pdf/i.test(u));
  }, [proj, cat]);

  const todos = proj && Array.isArray(proj[`Todo${cat}`]) ? proj[`Todo${cat}`] : [];
  const todoBelum = todos.map((t, i) => ({ ...t, _i: i })).filter((t) => !t.done);
  const todoTampil = bukaTodo ? todos.map((t, i) => ({ ...t, _i: i })) : todoBelum.slice(0, 3);

  const ubahStatus = async (s) => {
    if (busy || !info || s === info.status) return;
    await post('/projects/update/category-status', { slug: item.id, category: cat, categoryStatus: s });
  };

  const kirimKomentar = async () => {
    if (sending || (!komen.trim() && !files.length)) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('user', user?.uid || '');
      fd.append('idProduct', item.id);
      fd.append('category', cat);
      fd.append('text', komen.trim());
      files.forEach((f) => f && fd.append('images', f));
      const r = await fetch(`${baseUrl}/comments/create`, { method: 'POST', body: fd });
      if (!r.ok) throw new Error('Gagal mengirim komentar');
      mintaRefreshNotif();
      setKomen(''); setFiles([]); setShowFiles(false);
      await loadComments();
      refresh();
    } catch (err) {
      alert(`${err.message} — coba lagi (foto masih tersimpan).`);
    } finally {
      setSending(false);
    }
  };

  const namaDari = (uid) => userList.find((u) => u.uid === uid)?.name || 'Unknown';
  const waktu = (d) => {
    const s = detik(d);
    if (!s) return '';
    const dt = new Date(s * 1000);
    const hari = Math.floor((Date.now() - dt.getTime()) / 86400000);
    const jam = `${pad2(dt.getHours())}.${pad2(dt.getMinutes())}`;
    return hari === 0 ? `hari ini ${jam}` : hari === 1 ? `kemarin ${jam}` : `${dt.getDate()} ${BULAN[dt.getMonth()]} ${jam}`;
  };
  const green = '#16a34a';

  return (
    <div id={`panel-${item.id}-${cat}`} style={{
      background: C.card, border: `1px solid ${fokus ? '#2563eb' : C.border}`, borderTop: `5px solid ${col}`, borderRadius: 12,
      padding: 10, minWidth: 0, boxShadow: fokus ? '0 0 0 2px rgba(37,99,235,0.25)' : 'none',
    }}>
      {/* Header: category + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <b style={{ fontSize: 15, flex: 1, minWidth: 0 }}>{namaCat(cat)}</b>
        {info && (
          <select value={info.status} disabled={busy} onChange={(e) => ubahStatus(e.target.value)} aria-label={`Status ${cat}`}
            style={{ background: col, color: '#fff', border: 'none', borderRadius: 999, padding: '4px 8px', fontSize: 13, fontWeight: 700, cursor: 'pointer', maxWidth: 130 }}>
            {[...new Set([...STATUS_CEPAT, info.status])].map((s) => <option key={s} value={s} disabled={!STATUS_CEPAT.includes(s)}>{s}</option>)}
          </select>
        )}
      </div>

      {/* Supplier, tanggal, foto */}
      {info && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
          <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.4 }}>
            <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: info.supplier ? C.text : C.muted }}>{info.supplier || 'Supplier belum ada'}</div>
            <div style={{ color: info.telat ? '#dc2626' : C.muted, fontWeight: info.telat ? 700 : 400 }}>
              {info.order_date ? tgl(info.order_date) : '—'} → {info.deadline ? tgl(info.deadline) : '—'}
              {info.telat ? ` · telat ${-info.sisa_hari} hr` : info.sisa_hari != null && !info.beres ? ` · H-${info.sisa_hari}` : ''}
            </div>
          </div>
          {foto.length > 0 && (
            <div role="button" tabIndex={0} onClick={() => setPreview(true)} onKeyDown={(e) => e.key === 'Enter' && setPreview(true)}
              style={{ position: 'relative', width: 52, height: 52, flex: '0 0 52px', cursor: 'pointer' }} title="Lihat gambar">
              <img src={getImageUrl(foto[0])} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', border: `1px solid ${C.border}`, background: '#fff' }} />
              {foto.length > 1 && (
                <span style={{ position: 'absolute', right: 2, bottom: 2, background: 'rgba(0,0,0,0.7)', color: '#fff', borderRadius: 6, fontSize: 11, fontWeight: 700, padding: '0 5px' }}>+{foto.length - 1}</span>
              )}
            </div>
          )}
          {foto.length > 0 && (
            // Di luar tombol thumbnail: klik di dalam preview tidak boleh membukanya lagi.
            <Image.PreviewGroup items={foto.map((u) => getImageUrl(u))} preview={{ ...PREVIEW, visible: preview, onVisibleChange: setPreview }} />
          )}
        </div>
      )}

      {/* Komentar — paling ditonjolkan: 2 terbaru terlihat, sisanya gulir */}
      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, margin: '8px 0 4px', textTransform: 'uppercase', letterSpacing: 0.3 }}>
        Update terbaru {comments ? `· ${comments.length} komentar` : ''}
      </div>
      {!comments && <div style={{ fontSize: 13, color: C.muted }}>Memuat…</div>}
      {comments && threads.length === 0 && <div style={{ fontSize: 13, color: C.muted }}>Belum ada komentar.</div>}
      {threads.length > 0 && (
        <div ref={kotakKomen} style={{ maxHeight: 250, overflowY: 'auto', overscrollBehavior: 'contain', display: 'grid', gap: 6, paddingRight: 2 }}>
          {threads.map(({ c, rs }, i) => (
            <div key={c.id || c._id} style={{
              background: i >= threads.length - 2 ? (dark ? 'rgba(37,99,235,0.14)' : '#eff6ff') : C.soft,
              border: `1px solid ${i >= threads.length - 2 ? (dark ? '#1e3a8a' : '#bfdbfe') : 'transparent'}`, borderRadius: 10, padding: '6px 8px',
            }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                <b style={{ fontSize: 13 }}>{namaDari(c.user)}</b>
                <span style={{ fontSize: 11, color: C.muted }}>{waktu(c)}</span>
              </div>
              {c.text && <div style={{ fontSize: 14, lineHeight: 1.4, whiteSpace: 'pre-line', wordBreak: 'break-word' }}><TeksMention text={c.text} names={users} /></div>}
              <Lampiran doc={c} baseUrl={baseUrl} size={48} />
              {rs.map((r) => (
                <div key={r.id || r._id} style={{ borderLeft: `3px solid ${C.border}`, padding: '1px 7px', marginTop: 4 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                    <b style={{ fontSize: 12 }}>↳ {namaDari(r.user)}</b>
                    <span style={{ fontSize: 11, color: C.muted }}>{waktu(r)}</span>
                  </div>
                  {r.text && <div style={{ fontSize: 13, whiteSpace: 'pre-line', wordBreak: 'break-word' }}><TeksMention text={r.text} names={users} /></div>}
                  <Lampiran doc={r} baseUrl={baseUrl} size={48} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Tulis komentar (tag @, lampiran foto/video/PDF) */}
      <div style={{ marginTop: 6 }}>
        <Mentions
          autoSize={{ minRows: 1, maxRows: 5 }}
          value={komen}
          onChange={setKomen}
          placeholder="Tulis update… @ untuk tag"
          options={users.map((n) => ({ value: n, label: n }))}
          getPopupContainer={(node) => node.parentElement || document.body}
          style={{ width: '100%', fontSize: 16 }}
        />
        {showFiles && (
          <div style={{ marginTop: 6 }}>
            <ImageUploadZone images={files} onChange={setFiles} max={10} theme={dark ? 'dark' : 'light'} allowVideo allowPdf />
          </div>
        )}
        {(komen.trim() || files.length > 0 || showFiles) ? (
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button type="button" style={{ ...sBtn(C.soft, C.text), padding: '8px 10px' }} onClick={() => setShowFiles((v) => !v)}>📎 {files.length || ''}</button>
            <button type="button" disabled={sending || (!komen.trim() && !files.length)} style={{ ...sBtn('#2563eb'), flex: 1, padding: '8px 10px', opacity: komen.trim() || files.length ? 1 : 0.5 }} onClick={kirimKomentar}>
              {sending ? 'Mengirim…' : 'Kirim'}
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setShowFiles(true)} style={{ border: 'none', background: 'none', color: C.muted, fontSize: 12, padding: '4px 0 0', cursor: 'pointer' }}>📎 lampirkan foto/video/PDF</button>
        )}
      </div>

      {/* To-do ringkas: yang belum selesai saja, buka untuk semua + tambah */}
      <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 6 }}>
        <div role="button" tabIndex={0} onClick={() => setBukaTodo((v) => !v)} onKeyDown={(e) => e.key === 'Enter' && setBukaTodo((v) => !v)}
          style={{ display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 700, color: C.muted, cursor: 'pointer', minHeight: 28 }}>
          <span style={{ flex: 1 }}>☑ TO-DO {todos.length ? `${todos.length - todoBelum.length}/${todos.length}` : ''}</span>
          <span>{bukaTodo ? 'tutup ▴' : todos.length ? 'semua / tambah ▾' : 'tambah ▾'}</span>
        </div>
        {todoTampil.map((t) => (
          <div key={t.id || t._i} role="button" tabIndex={0}
            onClick={() => !busy && ubahTodo({ op: 'update', id: t.id || undefined, index: t._i, patch: { done: !t.done } })}
            onKeyDown={(e) => e.key === 'Enter' && !busy && ubahTodo({ op: 'update', id: t.id || undefined, index: t._i, patch: { done: !t.done } })}
            style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '4px 0', cursor: 'pointer', fontSize: 13 }}>
            <span style={{
              width: 18, height: 18, flex: '0 0 18px', marginTop: 1, borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              border: `2px solid ${t.done ? green : C.muted}`, background: t.done ? green : 'transparent', color: '#fff', fontSize: 12, fontWeight: 700,
            }}>{t.done ? '✓' : ''}</span>
            <span style={{ flex: 1, minWidth: 0, wordBreak: 'break-word', color: t.done ? green : C.text }}>{t.text}</span>
          </div>
        ))}
        {!bukaTodo && todoBelum.length > 3 && <div style={{ fontSize: 12, color: C.muted }}>+{todoBelum.length - 3} lagi</div>}
        {bukaTodo && (
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <input style={{ ...ui.sInput, flex: 1, minWidth: 0, minHeight: 36, padding: '6px 8px' }} placeholder="Tambah to-do…" value={todoText}
              onChange={(e) => setTodoText(e.target.value)}
              onKeyDown={async (e) => { if (e.key === 'Enter' && todoText.trim()) { await ubahTodo({ op: 'add', text: todoText.trim() }); setTodoText(''); } }} />
            <button type="button" disabled={busy || !todoText.trim()} style={{ ...sBtn('#2563eb'), padding: '6px 10px', minHeight: 36, opacity: todoText.trim() ? 1 : 0.5 }}
              onClick={async () => { await ubahTodo({ op: 'add', text: todoText.trim() }); setTodoText(''); }}>＋</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PapanOrder;
