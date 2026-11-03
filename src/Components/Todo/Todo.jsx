import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { labelKategori } from '../../Utils/kategori';
import { useNavigate } from 'react-router-dom';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useTheme } from '../../ThemeContext';
import { getImageUrl } from '../../Utils/image';
import { IoRefresh, IoSettingsOutline } from 'react-icons/io5';
import { Image } from 'antd';
import { Sheet, Label, PREVIEW, gambarCategory, TodoKomentar } from './categoryThread';

// ============================================================================
// AGENDA TO-DO & QC
// ============================================================================
// Pengganti daftar to-do lama. Menggabungkan to-do manual (Projects.Todo<Cat>)
// dan tugas otomatis dari data ERP (belum dipesan, perlu konfirmasi, kain, QC
// fisik, dst — lihat KLF-Server-main/utils/todoAgenda.js). Tiap tugas
// dikelompokkan per minggu menurut TARGET KIRIM supaya QC/PIC tidak perlu
// membuka project satu per satu. Sheet tugas memuat to-do list & komentar
// category yang sama dengan halaman project (Projects.Todo<Cat>, Comments).
//
// 3 TAMPILAN (2026-11-03, supaya tidak overwhelming):
//   🎯 Fokus  — maks FOKUS_MAX tugas terpenting; selesai satu, berikutnya naik.
//   🏭 Rute   — per bengkel (supplier): saat berkunjung, cek semua barangnya sekaligus.
//   📋 Daftar — daftar lengkap lama (tab bucket + filter).
// Cek-in pantau: "Sesuai jadwal" menyembunyikan tugas pantau/servis CEKIN_HARI hari (t.diam dari server).

const KATEGORI = ['Besi', 'Kayu', 'Jok', 'Rotan', 'Marmer', 'Kaca', 'Fiber', 'Veneer', 'Finishing', 'Hardware', 'BarangJadi'];

const BUCKETS = [
  { key: 'urgent', label: 'Mendesak', color: '#b91c1c' }, // t.mendesak: telat/kirim minggu ini/Servis/QC/belum order di jendela pantau (default)
  { key: 'all', label: 'Semua', color: '#334155' },
  { key: 'overdue', label: 'Terlambat', color: '#dc2626' },
  { key: 'this_week', label: 'Minggu ini', color: '#d97706' },
  { key: 'next_week', label: 'Minggu depan', color: '#2563eb' },
  { key: 'later', label: 'Nanti', color: '#6b7280' },
];

const MODES = [
  { key: 'fokus', label: '🎯 Fokus' },
  { key: 'rute', label: '🏭 Bengkel' },
  { key: 'daftar', label: '📋 Semua' },
];
const FOKUS_MAX = 10;
const CEKIN_HARI = 3; // sama dengan CEKIN_HARI di utils/todoAgenda.js

// Urutan Fokus: dilaporkan telat → siap QC → servis → telat kirim → mendesak → sisanya; lalu target kirim terdekat.
const rankFokus = (t) => (t.dilaporkan_telat ? 0 : t.jenis === 'qc' ? 1 : t.jenis === 'servis' ? 2 : t.telat_hari > 0 ? 3 : t.mendesak ? 4 : 5);
const alasanFokus = (t) => (t.dilaporkan_telat ? 'Dilaporkan telat' : t.jenis === 'qc' ? 'Siap QC' : t.jenis === 'servis' ? 'Servis'
  : t.telat_hari > 0 ? `Telat kirim ${t.telat_hari} hr` : t.mendesak ? 'Mendesak' : null);

const GROUPS = [
  { key: 'tanggal', label: 'Tanggal' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'project', label: 'Project' },
  { key: 'jenis', label: 'Jenis' },
];

const CAT_COLOR = {
  Stainless: '#64748b', Besi: '#475569', Kayu: '#a16207', Jok: '#be185d', Rotan: '#b45309',
  Marmer: '#0f766e', Kaca: '#0891b2', Fiber: '#7c3aed', Veneer: '#92400e', Finishing: '#c2410c',
  Hardware: '#4b5563', BarangJadi: '#1d4ed8', Pengiriman: '#15803d',
};

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const pad2 = (n) => String(n).padStart(2, '0');
const toYMD = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const fromYMD = (s) => {
  const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};
const fmtTanggal = (s) => {
  const d = fromYMD(s);
  return d ? `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]}` : 'Tanpa tanggal';
};
// Category untuk to-do & komentar: kategori non-proses (Pengiriman, '(umum)') → BarangJadi.
const catProject = (c) => (KATEGORI.includes(c) ? c : 'BarangJadi');

const lsGet = (k, def) => { try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch { return def; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* abaikan */ } };

const Todo = () => {
  const navigate = useNavigate();
  const baseUrl = getApiBaseUrl();
  const { globalTheme } = useTheme();
  const dark = globalTheme !== 'light';
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();

  const C = {
    bg: dark ? '#0f0f10' : '#f4f4f5',
    card: dark ? '#1c1c1f' : '#ffffff',
    border: dark ? '#2e2e33' : '#e4e4e7',
    text: dark ? '#f4f4f5' : '#18181b',
    muted: dark ? '#a1a1aa' : '#71717a',
    soft: dark ? '#27272a' : '#f4f4f5',
    input: dark ? '#111113' : '#ffffff',
  };

  const [agenda, setAgenda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [userList, setUserList] = useState([]); // {uid, name, profilePicture} — nama penulis komentar
  const [myName, setMyName] = useState(null);

  // Selalu buka "Mendesak" (Terlambat + Minggu ini) supaya tidak langsung melihat semua tugas.
  const [tab, setTab] = useState('urgent');
  // Selalu buka "Fokus" — daftar lengkap hanya kalau memang dicari.
  const [mode, setMode] = useState('fokus');
  const [ruteKey, setRuteKey] = useState(null);
  // Cek-in yang baru di-tap (tampil instan sebelum agenda dimuat ulang): key → 'on_track' | 'telat'.
  const [cekinLokal, setCekinLokal] = useState({});
  const [groupBy, setGroupBy] = useState(() => lsGet('todo.groupBy', 'tanggal'));
  const [showStock, setShowStock] = useState(() => lsGet('todo.showStock', false));
  const [fKategori, setFKategori] = useState('');
  const [fJenis, setFJenis] = useState('');
  // PIC: '__me' = PIC diri sendiri (default tiap buka halaman, sengaja tidak diingat), '' = semua, '__none' = belum ada.
  const [fPic, setFPic] = useState('__me');
  const [fSumber, setFSumber] = useState('');
  const [search, setSearch] = useState('');

  const [selectedKey, setSelectedKey] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => lsSet('todo.groupBy', groupBy), [groupBy]);
  useEffect(() => lsSet('todo.showStock', showStock), [showStock]);

  const fetchAgenda = useCallback(async () => {
    try {
      setError('');
      const res = await fetch(`${baseUrl}/todo/agenda?today=${toYMD(new Date())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal ambil agenda');
      setAgenda(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchAgenda();
    fetch(`${baseUrl}/users/all/get`).then((r) => r.json()).then((d) => {
      if (!Array.isArray(d)) return;
      setUsers(d.map((u) => u.name).filter((n) => n && !/bot|hermes/i.test(n)));
      setUserList(d);
      setMyName(d.find((u) => u.uid === user?.uid)?.name || '');
    }).catch(() => {});
  }, [baseUrl, fetchAgenda]);

  const tasks = useMemo(() => (agenda?.tasks || []).map((t) => {
    const c = cekinLokal[t.key];
    if (!c) return t;
    const checkin = { status: c, umur_hari: 0, by: myName || '' };
    return c === 'on_track'
      ? { ...t, diam: true, mendesak: false, dilaporkan_telat: false, checkin }
      : { ...t, diam: false, mendesak: true, dilaporkan_telat: true, checkin };
  }), [agenda, cekinLokal, myName]);
  const today = agenda?.today || toYMD(new Date());

  // PIC efektif: '__me' → nama user login (selama belum dimuat, tampilkan semua).
  const picAktif = fPic === '__me' ? (myName || '') : fPic;
  const picOf = (t) => t.pics || (t.pic ? [t.pic] : []);

  // Filter selain bucket & PIC — dipakai untuk angka di baris PIC.
  const filteredNoPic = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (!showStock && t.is_stock) return false;
      if (fKategori && t.category !== fKategori) return false;
      if (fJenis && t.jenis !== fJenis) return false;
      if (fSumber && t.sumber !== fSumber) return false;
      if (q && ![t.judul, t.item, t.customer, t.kode_invoice, t.supplier].some((v) => String(v || '').toLowerCase().includes(q))) return false;
      return true;
    });
  }, [tasks, showStock, fKategori, fJenis, fSumber, search]);

  // Filter selain bucket — dipakai juga untuk angka di tab. filteredAll ikut memuat tugas
  // yang sedang "diam" (sudah dicek sesuai jadwal) untuk bagian "Sudah dicek" di Rute.
  const filteredAll = useMemo(() => filteredNoPic.filter((t) => {
    if (picAktif === '__none') return picOf(t).length === 0;
    return !picAktif || picOf(t).includes(picAktif);
  }), [filteredNoPic, picAktif]);
  const filtered = useMemo(() => filteredAll.filter((t) => !t.diam), [filteredAll]);
  const jumlahDiam = filteredAll.length - filtered.length;

  const fokus = useMemo(() => [...filtered]
    .sort((a, b) => rankFokus(a) - rankFokus(b) || (a.sisa_hari ?? 9999) - (b.sisa_hari ?? 9999))
    .slice(0, FOKUS_MAX), [filtered]);

  // Rute: kelompok per bengkel (supplier). Tanpa supplier = urusan kantor.
  const rute = useMemo(() => {
    const map = new Map();
    filteredAll.forEach((t) => {
      const k = t.supplier || '';
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(t);
    });
    return [...map.entries()].map(([k, items]) => {
      const aktif = items.filter((t) => !t.diam);
      const st = {
        qc: aktif.filter((t) => t.jenis === 'qc').length,
        telat: aktif.filter((t) => t.dilaporkan_telat || t.telat_hari > 0).length,
        cek: aktif.filter((t) => t.bisa_cekin).length,
        sudah: items.length - aktif.length,
      };
      return {
        key: k, label: k || 'Kantor (belum ada bengkel)', items, aktif, ...st,
        kategori: [...new Set(items.map((t) => t.category))],
        skor: st.qc * 3 + st.telat * 2 + st.cek + aktif.length * 0.1,
      };
    }).sort((a, b) => (!a.key) - (!b.key) || (b.aktif.length > 0) - (a.aktif.length > 0) || b.skor - a.skor);
  }, [filteredAll]);
  const ruteAktif = ruteKey != null ? rute.find((g) => g.key === ruteKey) : null;

  // Baris PIC: saya dulu, lalu PIC lain urut jumlah tugas terbanyak.
  const picRow = useMemo(() => {
    const c = {};
    let none = 0;
    const aktifNoPic = filteredNoPic.filter((t) => !t.diam);
    aktifNoPic.forEach((t) => { const ps = picOf(t); if (!ps.length) none += 1; ps.forEach((p) => { c[p] = (c[p] || 0) + 1; }); });
    const lain = Object.keys(c).filter((n) => n !== myName).sort((a, b) => c[b] - c[a]);
    return { c, none, lain, semua: aktifNoPic.length };
  }, [filteredNoPic, myName]);

  const counts = useMemo(() => {
    const c = {};
    filtered.forEach((t) => { c[t.bucket] = (c[t.bucket] || 0) + 1; });
    c.all = filtered.length;
    c.urgent = filtered.filter((t) => t.mendesak).length;
    return c;
  }, [filtered]);

  const groups = useMemo(() => {
    const list = tab === 'all' ? filtered
      : tab === 'urgent' ? filtered.filter((t) => t.mendesak)
      : filtered.filter((t) => t.bucket === tab);
    const map = new Map();
    const keyOf = (t) => {
      if (groupBy === 'supplier') return t.supplier || 'Belum ada supplier';
      if (groupBy === 'project') return `${t.item} — ${t.customer || t.kode_invoice}`;
      if (groupBy === 'jenis') return t.jenis_label;
      return t.due || '';
    };
    list.forEach((t) => {
      const k = keyOf(t);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(t);
    });
    const arr = [...map.entries()].map(([k, items]) => ({
      key: k,
      label: groupBy === 'tanggal' ? (!k ? 'Tanpa target kirim' : `Kirim ${k === today ? 'hari ini · ' : ''}${fmtTanggal(k)}`) : k,
      items,
    }));
    if (groupBy === 'tanggal') arr.sort((a, b) => (a.key || '9999').localeCompare(b.key || '9999'));
    else arr.sort((a, b) => b.items.length - a.items.length || a.label.localeCompare(b.label));
    return arr;
  }, [filtered, tab, groupBy, today]);

  // Snapshot: to-do manual yang dicentang selesai hilang dari agenda, tapi sheet-nya tetap terbuka.
  const [selectedSnap, setSelectedSnap] = useState(null);
  const selected = selectedKey ? (tasks.find((t) => t.key === selectedKey) || selectedSnap) : null;
  const pilih = (t) => { setSelectedSnap(t); setSelectedKey(t.key); };

  // --- Aksi ------------------------------------------------------------------
  const post = async (url, body) => {
    setBusy(true);
    try {
      const res = await fetch(`${baseUrl}${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, by: user?.uid || '' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan');
      await fetchAgenda();
      return true;
    } catch (err) {
      alert(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  // Satu pintu: tugas manual → /projects/todo/item, otomatis → /todo/auto-state.
  const aksi = (t, action, value) => {
    if (t.sumber === 'manual') {
      const ident = { projectId: t.project_id, category: t.category, id: t.todo_id || undefined, index: t.todo_index };
      if (action === 'done') return post('/projects/todo/item', { ...ident, op: 'update', patch: { done: true } });
      if (action === 'delete') return post('/projects/todo/item', { ...ident, op: 'delete' });
      if (action === 'pic') return post('/projects/todo/item', { ...ident, op: 'update', patch: { pic: value || '' } });
    }
    return post('/todo/auto-state', { key: t.key, action, value, jenis: t.jenis, today: toYMD(new Date()) });
  };

  // Cek-in cepat (Rute/Fokus): tampil instan, simpan di belakang, lalu agenda dimuat ulang.
  // status null = batalkan cek-in. Banyak tugas sekaligus → satu kali muat ulang agenda.
  const cekin = async (list, status) => {
    const arr = Array.isArray(list) ? list : [list];
    const keys = arr.map((t) => t.key);
    if (status) setCekinLokal((m) => ({ ...m, ...Object.fromEntries(keys.map((k) => [k, status])) }));
    try {
      const hasil = await Promise.all(arr.map((t) => fetch(`${baseUrl}/todo/auto-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: t.key, action: status ? 'checkin' : 'uncheckin', value: status || undefined, jenis: t.jenis, today: toYMD(new Date()), by: user?.uid || '' }),
      })));
      if (hasil.some((r) => !r.ok)) throw new Error('Sebagian cek-in gagal disimpan — coba lagi.');
      await fetchAgenda();
    } catch (err) {
      alert(err.message);
    } finally {
      setCekinLokal((m) => { const n = { ...m }; keys.forEach((k) => delete n[k]); return n; });
    }
  };

  const bukaProject = (t) => {
    const cat = KATEGORI.includes(t.category) ? `/${t.category}` : '';
    navigate(`/project/${t.project_id}${cat}`);
  };

  // --- Style kecil ------------------------------------------------------------
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

  // "Telat" hanya kalau target kirim benar-benar sudah lewat.
  const kirimBadge = (t) => {
    if (t.sisa_hari == null) return { text: 'Tanpa target kirim', color: C.muted };
    if (t.sisa_hari < 0) return { text: `Telat ${-t.sisa_hari} hr`, color: '#dc2626' };
    if (t.sisa_hari === 0) return { text: 'Kirim hari ini', color: '#d97706' };
    return { text: `Kirim H-${t.sisa_hari}`, color: t.sisa_hari <= 7 ? '#d97706' : C.muted };
  };

  // Kartu tugas (Daftar & Fokus). nomor/alasan hanya untuk Fokus.
  const kartu = (t, { nomor, alasan } = {}) => {
    const kirim = kirimBadge(t);
    return (
      <div
        key={t.key}
        role="button"
        tabIndex={0}
        onClick={() => pilih(t)}
        onKeyDown={(e) => e.key === 'Enter' && pilih(t)}
        style={{
          background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${kirim.color}`,
          borderRadius: 12, padding: 10, display: 'flex', gap: 10, cursor: 'pointer', position: 'relative',
        }}
      >
        {nomor != null && (
          <div style={{ flex: '0 0 26px', width: 26, height: 26, borderRadius: 999, background: C.soft, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }}>{nomor}</div>
        )}
        {t.image ? (
          // Ketuk thumbnail = lihat gambar besar (bukan buka sheet).
          <span onClick={(e) => e.stopPropagation()} style={{ flex: '0 0 56px', width: 56, height: 56 }}>
            <Image src={getImageUrl(t.image)} width={56} height={56} preview={PREVIEW}
              style={{ borderRadius: 8, objectFit: 'cover' }} />
          </span>
        ) : (
          <div style={{ width: 56, height: 56, borderRadius: 8, background: C.soft, flex: '0 0 56px' }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
            {alasan && <span style={chip(alasan === 'Siap QC' ? '#7c3aed' : '#dc2626')}>{alasan}</span>}
            <span style={chip(CAT_COLOR[t.category] || '#6b7280')}>{labelKategori(t.category)}</span>
            <span style={{ fontSize: 11, color: C.muted }}>{t.sumber === 'manual' ? '✎ ditulis orang' : `⚙ ${t.jenis_label}`}</span>
            {t.pic && <span style={{ fontSize: 11, color: C.muted }}>· {t.pic}</span>}
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3, wordBreak: 'break-word' }}>{t.judul}</div>
          <div style={{ fontSize: 12, color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {t.item} · {t.customer || t.kode_invoice}
          </div>
          <div style={{ display: 'flex', gap: 8, fontSize: 12, marginTop: 2, flexWrap: 'wrap' }}>
            <span style={{ color: kirim.color, fontWeight: t.sisa_hari != null && t.sisa_hari < 0 ? 600 : 400 }}>{kirim.text}</span>
            {t.supplier && groupBy !== 'supplier' && <span style={{ color: C.muted }}>{t.supplier}</span>}
          </div>
          {nomor != null && t.bisa_cekin && tombolCekin(t)}
        </div>
      </div>
    );
  };

  // Dua tombol cek-in pantau (Sesuai jadwal / Telat) — dipakai di Fokus & Rute.
  const tombolCekin = (t) => (
    <div style={{ display: 'flex', gap: 6, marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
      <button type="button" style={{ ...sBtn('#16a34a'), flex: 1, padding: '8px 6px', fontSize: 13 }} onClick={() => cekin(t, 'on_track')}>✅ Sesuai jadwal</button>
      <button type="button" style={{ ...sBtn(t.dilaporkan_telat ? '#7f1d1d' : '#dc2626'), flex: 1, padding: '8px 6px', fontSize: 13 }} onClick={() => cekin(t, 'telat')}>
        ⚠️ {t.dilaporkan_telat ? 'Masih telat' : 'Telat'}
      </button>
    </div>
  );

  // Baris ringkas di sheet bengkel.
  const barisBengkel = (t, { aksiKanan } = {}) => {
    const kirim = kirimBadge(t);
    return (
      <div key={t.key} style={{ padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }} onClick={() => pilih(t)}>
          {t.image ? (
            <span onClick={(e) => e.stopPropagation()} style={{ flex: '0 0 48px', width: 48, height: 48 }}>
              <Image src={getImageUrl(t.image)} width={48} height={48} preview={PREVIEW} style={{ borderRadius: 8, objectFit: 'cover' }} />
            </span>
          ) : <div style={{ width: 48, height: 48, borderRadius: 8, background: C.soft, flex: '0 0 48px' }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.item}</div>
            <div style={{ fontSize: 12, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {labelKategori(t.category)} · {t.customer || t.kode_invoice}
            </div>
            <div style={{ fontSize: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ color: kirim.color, fontWeight: t.sisa_hari != null && t.sisa_hari < 0 ? 600 : 400 }}>{kirim.text}</span>
              {t.dilaporkan_telat && <span style={{ color: '#dc2626', fontWeight: 600 }}>⚠️ dilaporkan telat{t.checkin?.umur_hari ? ` ${t.checkin.umur_hari} hr lalu` : ' hari ini'}</span>}
              {t.jenis !== 'pantau_progress' && t.jenis !== 'qc' && <span style={{ color: C.muted }}>{t.judul}</span>}
            </div>
          </div>
          {aksiKanan}
        </div>
        {t.bisa_cekin && !t.diam && tombolCekin(t)}
      </div>
    );
  };

  const jenisOptions = agenda?.jenis_label || {};

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, paddingBottom: 90 }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '12px 12px 0' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>To-Do & QC</div>
            <div style={{ fontSize: 12, color: C.muted }}>
              {fmtTanggal(today)} · {agenda ? `${agenda.jumlah_item} item ongoing` : 'memuat…'}
            </div>
          </div>
          <button type="button" style={sIconBtn} onClick={() => { setLoading(true); fetchAgenda(); }} title="Muat ulang" aria-label="Muat ulang">
            <IoRefresh size={20} />
          </button>
          <button type="button" style={sIconBtn} onClick={() => setShowSettings(true)} title="Setting PIC & lead time" aria-label="Setting To-do">
            <IoSettingsOutline size={20} />
          </button>
          <button type="button" style={sBtn('#2563eb')} onClick={() => setShowAdd(true)}>+ To-do</button>
        </div>

        {/* PIC — default tugas saya */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8 }}>
          {[
            ...(myName ? [{ v: '__me', label: `Tugas saya`, n: picRow.c[myName] || 0, on: fPic === '__me' || fPic === myName }] : []),
            ...picRow.lain.map((n) => ({ v: n, label: n, n: picRow.c[n], on: fPic === n })),
            ...(picRow.none ? [{ v: '__none', label: 'Belum ada PIC', n: picRow.none, on: fPic === '__none' }] : []),
            { v: '', label: 'Semua', n: picRow.semua, on: fPic === '' || (fPic === '__me' && myName === '') },
          ].map((o) => (
            <button type="button" key={o.v || 'semua'} onClick={() => setFPic(o.v)}
              style={{
                flex: '0 0 auto', borderRadius: 999, padding: '8px 14px', fontSize: 14, fontWeight: 600, cursor: 'pointer', minHeight: 40,
                border: `1px solid ${o.on ? '#2563eb' : C.border}`, background: o.on ? '#2563eb' : C.card, color: o.on ? '#fff' : C.text,
              }}>
              {o.v === '__me' ? '👤 ' : ''}{o.label} <span style={{ opacity: 0.75, fontWeight: 500 }}>{o.n}</span>
            </button>
          ))}
        </div>

        {/* Pilihan tampilan */}
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: C.soft, border: `1px solid ${C.border}`, marginBottom: 10 }}>
          {MODES.map((m) => {
            const on = mode === m.key;
            const n = m.key === 'fokus' ? fokus.length : m.key === 'rute' ? rute.filter((g) => g.key && g.aktif.length).length : filtered.length;
            return (
              <button type="button" key={m.key} onClick={() => setMode(m.key)}
                style={{
                  flex: 1, minHeight: 44, borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, lineHeight: 1.2,
                  background: on ? C.card : 'transparent', color: on ? C.text : C.muted, boxShadow: on ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                }}>
                {m.label}{agenda ? <span style={{ fontWeight: 500, opacity: 0.7 }}> {n}</span> : null}
              </button>
            );
          })}
        </div>

        {loading && !agenda && <div style={{ padding: 30, textAlign: 'center', color: C.muted }}>Memuat agenda…</div>}
        {error && <div style={{ padding: 12, borderRadius: 10, background: '#fee2e2', color: '#991b1b', marginBottom: 10 }}>{error}</div>}

        {/* ================= FOKUS ================= */}
        {mode === 'fokus' && agenda && (
          <div>
            <div style={{ fontSize: 13, color: C.muted, margin: '0 2px 8px' }}>
              {fokus.length
                ? <>Kerjakan dari nomor 1. Selesai satu, tugas berikutnya naik otomatis. <b style={{ color: C.text }}>{filtered.length - fokus.length}</b> tugas lain menunggu.</>
                : null}
              {jumlahDiam > 0 && <> · ✅ {jumlahDiam} sudah dicek (muncul lagi ≤{CEKIN_HARI} hari)</>}
            </div>
            {fokus.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>Semua beres untuk hari ini 🎉</div>
            )}
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {fokus.map((t, i) => kartu(t, { nomor: i + 1, alasan: alasanFokus(t) }))}
            </div>
            {filtered.length > fokus.length && (
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                <button type="button" style={{ ...sBtn(C.card, C.text), border: `1px solid ${C.border}`, flex: '1 1 160px' }} onClick={() => setMode('rute')}>🏭 Lihat per bengkel</button>
                <button type="button" style={{ ...sBtn(C.card, C.text), border: `1px solid ${C.border}`, flex: '1 1 160px' }} onClick={() => setMode('daftar')}>📋 Lihat semua ({filtered.length})</button>
              </div>
            )}
          </div>
        )}

        {/* ================= RUTE PER BENGKEL ================= */}
        {mode === 'rute' && agenda && (
          <div>
            <div style={{ fontSize: 13, color: C.muted, margin: '0 2px 8px' }}>
              Saat berkunjung, buka bengkelnya lalu cek semua barang sekaligus. Yang "Sesuai jadwal" disembunyikan {CEKIN_HARI} hari.
            </div>
            {rute.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>Tidak ada tugas 🎉</div>}
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {rute.map((g) => {
                const beres = g.aktif.length === 0;
                const warna = g.qc || g.telat ? '#dc2626' : beres ? '#16a34a' : '#2563eb';
                return (
                  <div key={g.key || '__kantor'} role="button" tabIndex={0} onClick={() => setRuteKey(g.key)}
                    onKeyDown={(e) => e.key === 'Enter' && setRuteKey(g.key)}
                    style={{
                      background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${warna}`, borderRadius: 12,
                      padding: 12, cursor: 'pointer', opacity: beres ? 0.65 : 1,
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {g.key ? '🏭' : '🏢'} {g.label}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: warna }}>{g.aktif.length}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', margin: '4px 0 6px' }}>
                      {g.kategori.slice(0, 4).map((k) => <span key={k} style={chip(CAT_COLOR[k] || '#6b7280')}>{labelKategori(k)}</span>)}
                    </div>
                    <div style={{ fontSize: 13, display: 'flex', gap: 10, flexWrap: 'wrap', color: C.muted }}>
                      {g.qc > 0 && <span style={{ color: '#7c3aed', fontWeight: 700 }}>🔍 {g.qc} siap QC</span>}
                      {g.telat > 0 && <span style={{ color: '#dc2626', fontWeight: 700 }}>⚠️ {g.telat} telat</span>}
                      {g.cek > 0 && <span>👀 {g.cek} perlu dicek</span>}
                      {g.sudah > 0 && <span style={{ color: '#16a34a' }}>✅ {g.sudah} sudah dicek</span>}
                      {beres && g.sudah === 0 && <span>Tidak ada tugas</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {mode === 'daftar' && (<>
        {/* Tab bucket */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, position: 'sticky', top: 0, zIndex: 5, background: C.bg }}>
          {BUCKETS.map((b) => {
            const active = tab === b.key;
            return (
              <button
                type="button"
                key={b.key}
                onClick={() => setTab(b.key)}
                style={{
                  flex: '0 0 auto', border: `2px solid ${active ? b.color : C.border}`, background: active ? b.color : C.card,
                  color: active ? '#fff' : C.text, borderRadius: 12, padding: '6px 12px', cursor: 'pointer', textAlign: 'left', minWidth: 92,
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.1, color: active ? '#fff' : b.color }}>{counts[b.key] || 0}</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{b.label}</div>
              </button>
            );
          })}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '6px 0 10px' }}>
          <input style={{ ...sInput, minWidth: 150, flex: '1 0 150px' }} placeholder="Cari item / customer / supplier" value={search} onChange={(e) => {
            const v = e.target.value;
            if (!search.trim() && v.trim()) setTab('all');
            setSearch(v);
          }} />
          <select style={sInput} value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
            {GROUPS.map((g) => <option key={g.key} value={g.key}>Per {g.label}</option>)}
          </select>
          <select style={sInput} value={fKategori} onChange={(e) => setFKategori(e.target.value)}>
            <option value="">Semua kategori</option>
            {[...KATEGORI, 'Pengiriman'].map((k) => <option key={k} value={k}>{labelKategori(k)}</option>)}
          </select>
          <select style={sInput} value={fJenis} onChange={(e) => setFJenis(e.target.value)}>
            <option value="">Semua jenis</option>
            {Object.entries(jenisOptions).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select style={sInput} value={fSumber} onChange={(e) => setFSumber(e.target.value)}>
            <option value="">Semua sumber</option>
            <option value="manual">✎ Ditulis orang</option>
            <option value="otomatis">⚙ Temuan sistem</option>
          </select>
          <label style={{ ...sInput, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', cursor: 'pointer' }}>
            <input type="checkbox" checked={showStock} onChange={(e) => setShowStock(e.target.checked)} /> Item stok
          </label>
        </div>

        {/* Daftar */}
        {agenda && groups.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>
            Tidak ada tugas di “{BUCKETS.find((b) => b.key === tab)?.label}”{picAktif && picAktif !== '__none' ? ` untuk ${picAktif}` : ''} 🎉
          </div>
        )}

        {groups.map((g) => (
          <div key={g.key || '-'} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '4px 2px 6px' }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{g.label}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{g.items.length} tugas</div>
            </div>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {g.items.map((t) => kartu(t))}
            </div>
          </div>
        ))}
        </>)}
      </div>

      {ruteAktif && (() => {
        const g = ruteAktif;
        const qc = g.aktif.filter((t) => t.jenis === 'qc');
        const cek = g.aktif.filter((t) => t.bisa_cekin)
          .sort((a, b) => (b.dilaporkan_telat ? 1 : 0) - (a.dilaporkan_telat ? 1 : 0) || (a.sisa_hari ?? 9999) - (b.sisa_hari ?? 9999));
        const lain = g.aktif.filter((t) => t.jenis !== 'qc' && !t.bisa_cekin);
        const sudah = g.items.filter((t) => t.diam);
        const belumDicek = cek.filter((t) => !t.dilaporkan_telat);
        const judul = (teks, n, warna) => n > 0 && (
          <div style={{ fontWeight: 700, fontSize: 14, margin: '14px 0 2px', color: warna || C.text }}>{teks} <span style={{ color: C.muted, fontWeight: 500 }}>{n}</span></div>
        );
        return (
          <Sheet C={C} onClose={() => setRuteKey(null)} title={`${g.key ? '🏭' : '🏢'} ${g.label}`}>
            {belumDicek.length > 1 && (
              <button type="button" style={{ ...sBtn('#16a34a'), width: '100%', minHeight: 48 }}
                onClick={() => { if (window.confirm(`Tandai ${belumDicek.length} barang "Sesuai jadwal"? Yang telat tandai dulu satu-satu.`)) cekin(belumDicek, 'on_track'); }}>
                ✅ Semua sesuai jadwal ({belumDicek.length})
              </button>
            )}
            {judul('🔍 Siap QC', qc.length, '#7c3aed')}
            {qc.map((t) => barisBengkel(t, { aksiKanan: <button type="button" style={{ ...sBtn('#7c3aed'), flex: '0 0 auto' }} onClick={(e) => { e.stopPropagation(); pilih(t); }}>QC →</button> }))}
            {judul('👀 Cek progress', cek.length)}
            {cek.map((t) => barisBengkel(t))}
            {judul('📌 Lainnya', lain.length)}
            {lain.map((t) => barisBengkel(t, { aksiKanan: <span style={{ color: C.muted, fontSize: 20 }}>›</span> }))}
            {g.aktif.length === 0 && <div style={{ padding: '24px 0', textAlign: 'center', color: C.muted }}>Semua barang di bengkel ini sudah dicek 🎉</div>}
            {sudah.length > 0 && (
              <details style={{ marginTop: 16 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 14, color: '#16a34a', padding: '6px 0' }}>✅ Sudah dicek ({sudah.length})</summary>
                {sudah.map((t) => barisBengkel(t, {
                  aksiKanan: (
                    <div style={{ textAlign: 'right', fontSize: 11, color: C.muted, flex: '0 0 auto' }} onClick={(e) => e.stopPropagation()}>
                      <div>{t.checkin?.umur_hari ? `${t.checkin.umur_hari} hr lalu` : 'hari ini'}{t.checkin?.by ? ` · ${t.checkin.by}` : ''}</div>
                      <button type="button" style={{ background: 'none', border: 'none', color: '#2563eb', padding: '6px 0', fontSize: 13, cursor: 'pointer' }} onClick={() => cekin(t, null)}>Batal</button>
                    </div>
                  ),
                }))}
              </details>
            )}
          </Sheet>
        );
      })()}

      {selected && (
        <TaskSheet
          t={selected}
          C={C}
          users={users}
          userList={userList}
          user={user}
          baseUrl={baseUrl}
          busy={busy}
          sInput={sInput}
          sBtn={sBtn}
          chip={chip}
          dark={dark}
          kirimBadge={kirimBadge}
          onClose={() => setSelectedKey(null)}
          aksi={aksi}
          post={post}
          bukaProject={bukaProject}
        />
      )}
      {showAdd && (
        <AddSheet C={C} users={users} busy={busy} sInput={sInput} sBtn={sBtn} baseUrl={baseUrl} onClose={() => setShowAdd(false)}
          onSubmit={async (body) => { if (await post('/projects/todo/item', { ...body, op: 'add' })) setShowAdd(false); }} />
      )}
      {showSettings && (
        <SettingsSheet C={C} sInput={sInput} sBtn={sBtn} baseUrl={baseUrl} user={user} users={users} onClose={() => setShowSettings(false)} onSaved={fetchAgenda} />
      )}
    </div>
  );
};

const TaskSheet = ({ t, C, users, userList, user, baseUrl, busy, sInput, sBtn, chip, dark, kirimBadge, onClose, aksi, post, bukaProject }) => {
  const d = t.detail || {};
  const manual = t.sumber === 'manual';
  const cat = catProject(t.category);
  const kirim = kirimBadge(t);

  const [proj, setProj] = useState(null);

  const loadProj = useCallback(async () => {
    try {
      const r = await fetch(`${baseUrl}/projects/detail`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: t.project_id }) });
      if (r.ok) setProj(await r.json());
    } catch { /* abaikan — sheet tetap bisa dipakai */ }
  }, [baseUrl, t.project_id]);

  useEffect(() => { setProj(null); loadProj(); }, [loadProj]);

  const gambar = useMemo(() => gambarCategory(proj, cat, t.image), [proj, t.image, cat]);
  const ubahTodo = async (body) => { if (await post('/projects/todo/item', { projectId: t.project_id, category: cat, ...body })) await loadProj(); };

  const picValue = t.pic_otomatis ? '' : (t.pic || '');
  const green = '#16a34a';

  return (
    <Sheet C={C} onClose={onClose} title={t.judul}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', fontSize: 13 }}>
        <span style={chip(CAT_COLOR[t.category] || '#6b7280')}>{labelKategori(t.category)}</span>
        <span style={{ color: C.muted }}>{manual ? '✎ To-do ditulis orang' : `⚙ ${t.jenis_label} (temuan sistem)`}</span>
      </div>

      {/* Foto — ketuk untuk perbesar */}
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

      <div style={{ fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
        <div><b>{t.item}</b></div>
        <div style={{ color: C.muted }}>{t.customer} · {t.kode_invoice}</div>
        {t.supplier && <div style={{ color: C.muted }}>Supplier: {t.supplier}{t.status_kategori ? ` · status ${t.status_kategori}` : ''}</div>}
        <div style={{ color: C.muted }}>
          Target kirim: {t.target_kirim ? fmtTanggal(t.target_kirim) : '—'}
          {t.sisa_hari != null && t.sisa_hari < 0 && <b style={{ color: kirim.color }}> ({kirim.text.toLowerCase()})</b>}
        </div>
        {t.created_by && <div style={{ color: C.muted }}>Dibuat oleh {t.created_by}</div>}
      </div>

      {d.permintaan?.length > 0 && (
        <>
          <Label C={C}>Permintaan konfirmasi</Label>
          {d.permintaan.map((p, i) => <div key={i} style={{ fontSize: 13, background: C.soft, borderRadius: 8, padding: '6px 8px', marginBottom: 4 }}>{p}</div>)}
          {d.kandidat_jawaban?.length > 0 && (
            <>
              <Label C={C}>Mungkin sudah dijawab di sini? (cek dulu)</Label>
              {d.kandidat_jawaban.map((p, i) => <div key={i} style={{ fontSize: 13, borderLeft: `3px solid ${C.border}`, padding: '2px 8px', marginBottom: 4 }}>{p}</div>)}
            </>
          )}
        </>
      )}
      {d.kutipan?.length > 0 && (
        <>
          <Label C={C}>Disebut di</Label>
          {d.kutipan.map((p, i) => <div key={i} style={{ fontSize: 13, background: C.soft, borderRadius: 8, padding: '6px 8px', marginBottom: 4 }}>{p}</div>)}
        </>
      )}
      {d.deadline_supplier && <div style={{ fontSize: 13, marginTop: 6 }}>Deadline supplier: {fmtTanggal(d.deadline_supplier)}</div>}
      {t.jenis === 'pantau_progress' && (
        <div style={{ fontSize: 13, marginTop: 6, color: C.muted }}>Cek progres ke supplier. Kalau sudah jadi, ubah status category ke <b>Selesai</b> → lanjut QC.</div>
      )}
      {t.jenis === 'qc' && (
        <div style={{ fontSize: 13, marginTop: 6, background: C.soft, borderRadius: 8, padding: '6px 8px' }}>
          Buka project → centang semua <b>Alur Kerja</b> {labelKategori(t.category)}. Semua OK → status otomatis <b>QC Pass</b>; ada yang perlu servis → status <b>Servis</b>.
        </div>
      )}
      {t.jenis === 'servis' && (
        <div style={{ fontSize: 13, marginTop: 6, color: C.muted }}>Pantau perbaikan di supplier, lalu QC ulang lewat Alur Kerja sampai QC Pass.</div>
      )}

      {/* Cek-in pantau: sekali per CEKIN_HARI hari */}
      {!manual && t.bisa_cekin && (
        <div style={{ marginTop: 12, background: C.soft, borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Hasil cek ke bengkel
            {t.checkin && <span style={{ fontWeight: 400, color: C.muted }}> · terakhir: {t.checkin.status === 'telat' ? '⚠️ telat' : '✅ sesuai jadwal'} {t.checkin.umur_hari ? `${t.checkin.umur_hari} hr lalu` : 'hari ini'}</span>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" disabled={busy} style={{ ...sBtn(green), flex: 1 }} onClick={async () => { if (await aksi(t, 'checkin', 'on_track')) onClose(); }}>✅ Sesuai jadwal</button>
            <button type="button" disabled={busy} style={{ ...sBtn('#dc2626'), flex: 1 }} onClick={async () => { if (await aksi(t, 'checkin', 'telat')) onClose(); }}>⚠️ Telat</button>
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>Sesuai jadwal → disembunyikan {CEKIN_HARI} hari, lalu muncul lagi untuk dicek ulang.</div>
        </div>
      )}

      {/* Aksi utama */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
        {manual && <button type="button" disabled={busy} style={sBtn(green)} onClick={async () => { if (await aksi(t, 'done')) onClose(); }}>✓ Selesai</button>}
        <button type="button" style={sBtn('#2563eb')} onClick={() => bukaProject(t)}>Buka project</button>
        {!manual && t.bisa_ditandai_beres && (
          <button type="button" disabled={busy} style={sBtn(C.soft, C.text)}
            onClick={async () => { if (window.confirm('Tandai sudah beres? Tugas akan muncul lagi kalau teks sumbernya berubah.') && await aksi(t, 'resolve')) onClose(); }}>
            Sudah beres
          </button>
        )}
      </div>
      {!manual && !t.bisa_ditandai_beres && (
        <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>
          Tugas ini hilang sendiri setelah data project diperbaiki (status kategori / SPK / alamat).
        </div>
      )}

      {/* PIC */}
      <Label C={C}>PIC</Label>
      <select style={{ ...sInput, width: '100%' }} disabled={busy} value={picValue} onChange={(e) => aksi(t, 'pic', e.target.value)}>
        <option value="">{t.pic_otomatis && t.pic ? `Otomatis — ${t.pic}` : '— Otomatis sesuai jenis tugas —'}</option>
        {picValue && !users.includes(picValue) && <option value={picValue}>{picValue}</option>}
        {users.map((u) => <option key={u} value={u}>{u}</option>)}
      </select>

      <TodoKomentar projectId={t.project_id} cat={cat} proj={proj} ubahTodo={ubahTodo} busy={busy} C={C}
        users={users} userList={userList} user={user} baseUrl={baseUrl} dark={dark} sInput={sInput} sBtn={sBtn} />

      {manual && (
        <div style={{ marginTop: 18, textAlign: 'right' }}>
          <button type="button" disabled={busy} style={sBtn('transparent', '#dc2626')}
            onClick={async () => { if (window.confirm('Hapus to-do ini?') && await aksi(t, 'delete')) onClose(); }}>
            Hapus to-do
          </button>
        </div>
      )}
    </Sheet>
  );
};

const AddSheet = ({ C, users, busy, sInput, sBtn, baseUrl, onClose, onSubmit }) => {
  const [projects, setProjects] = useState([]);
  const [q, setQ] = useState('');
  const [projectId, setProjectId] = useState('');
  const [category, setCategory] = useState('BarangJadi');
  const [text, setText] = useState('');
  const [pic, setPic] = useState('');

  useEffect(() => {
    fetch(`${baseUrl}/projects/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showCompleted: false, searchSupplier: '', searchSupplierCategory: '' }),
    }).then((r) => r.json()).then((d) => Array.isArray(d) && setProjects(d)).catch(() => {});
  }, [baseUrl]);

  const hasil = projects.filter((p) => {
    const s = q.trim().toLowerCase();
    return !s || [p.NamaBarang, p.Buyer, p.KodeInvoice].some((v) => String(v || '').toLowerCase().includes(s));
  }).slice(0, 30);
  const terpilih = projects.find((p) => p.id === projectId);

  return (
    <Sheet C={C} onClose={onClose} title="Tambah to-do">
      <Label C={C}>Project</Label>
      {terpilih ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.soft, borderRadius: 10, padding: 8 }}>
          <div style={{ flex: 1, fontSize: 14 }}><b>{terpilih.NamaBarang}</b><div style={{ fontSize: 12, color: C.muted }}>{terpilih.Buyer} · {terpilih.KodeInvoice}</div></div>
          <button type="button" style={sBtn(C.card, C.text)} onClick={() => setProjectId('')}>Ganti</button>
        </div>
      ) : (
        <>
          <input style={{ ...sInput, width: '100%' }} placeholder="Cari nama barang / customer / invoice" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
          <div style={{ maxHeight: 220, overflowY: 'auto', marginTop: 6 }}>
            {hasil.map((p) => (
              <div key={p.id} role="button" tabIndex={0} onClick={() => setProjectId(p.id)} onKeyDown={(e) => e.key === 'Enter' && setProjectId(p.id)}
                style={{ padding: '8px 6px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', fontSize: 14 }}>
                {p.NamaBarang} <span style={{ color: C.muted, fontSize: 12 }}>· {p.Buyer} · {p.KodeInvoice}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <Label C={C}>Kategori</Label>
      <select style={{ ...sInput, width: '100%' }} value={category} onChange={(e) => setCategory(e.target.value)}>
        {KATEGORI.map((k) => <option key={k} value={k}>{k === 'BarangJadi' ? 'Umum / Barang Jadi' : labelKategori(k)}</option>)}
      </select>

      <Label C={C}>To-do</Label>
      <textarea style={{ ...sInput, width: '100%', minHeight: 70 }} placeholder="mis. Kejar marmer ke supplier, minta foto progres" value={text} onChange={(e) => setText(e.target.value)} />

      <Label C={C}>PIC</Label>
      <select style={{ ...sInput, width: '100%' }} value={pic} onChange={(e) => setPic(e.target.value)}>
        <option value="">— otomatis (sesuai setting PIC) —</option>
        {users.map((u) => <option key={u} value={u}>{u}</option>)}
      </select>

      <button type="button" disabled={busy || !projectId || !text.trim()} style={{ ...sBtn('#2563eb'), width: '100%', marginTop: 16, opacity: !projectId || !text.trim() ? 0.5 : 1 }}
        onClick={() => onSubmit({ projectId, category, text: text.trim(), pic: pic || undefined })}>
        Simpan to-do
      </button>
    </Sheet>
  );
};

const SettingsSheet = ({ C, sInput, sBtn, baseUrl, user, users, onClose, onSaved }) => {
  const [value, setValue] = useState(null);
  const [pic, setPic] = useState({});
  const [picDef, setPicDef] = useState({});
  const [def, setDef] = useState({});
  const [label, setLabel] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${baseUrl}/todo/settings`).then((r) => r.json()).then((d) => {
      setValue(d.value || {}); setDef(d.default || {}); setLabel(d.jenis_label || {});
      setPic(d.pic || {}); setPicDef(d.pic_default || {});
    }).catch(() => setValue({}));
  }, [baseUrl]);

  const simpan = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${baseUrl}/todo/settings`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value, pic, by: user?.uid || '' }),
      });
      if (!res.ok) throw new Error('Gagal simpan setting');
      await onSaved();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet C={C} onClose={onClose} title="Setting To-do">
      <div style={{ fontWeight: 700, fontSize: 14 }}>PIC otomatis per jenis tugas</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>
        Berlaku untuk semua tugas yang PIC-nya belum diatur manual (termasuk yang sudah ada). “To-do” = to-do yang ditulis orang di tiap category.
      </div>
      {Object.keys(label).filter((j) => pic[j] || picDef[j]).map((j) => (
        <div key={j} style={{ padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{label[j]}</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {users.map((u) => {
              const now = pic[j] || [];
              const on = now.includes(u);
              return (
                <button type="button" key={u} onClick={() => setPic((p) => ({ ...p, [j]: on ? now.filter((x) => x !== u) : [...now, u] }))}
                  style={{ borderRadius: 999, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: `1px solid ${on ? '#2563eb' : C.border}`, background: on ? '#2563eb' : C.card, color: on ? '#fff' : C.text }}>
                  {u}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button type="button" style={sBtn(C.soft, C.text)} onClick={() => { setValue({ ...def }); setPic({ ...picDef }); }}>Kembalikan default</button>
        <button type="button" disabled={saving || !value} style={{ ...sBtn('#2563eb'), flex: 1 }} onClick={simpan}>Simpan</button>
      </div>
    </Sheet>
  );
};

export default Todo;
