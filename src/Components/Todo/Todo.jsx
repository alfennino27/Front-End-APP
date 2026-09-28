import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useTheme } from '../../ThemeContext';
import { getImageUrl } from '../../Utils/image';

// ============================================================================
// AGENDA TO-DO & QC
// ============================================================================
// Pengganti daftar to-do lama. Menggabungkan to-do manual (Projects.Todo<Cat>)
// dan tugas otomatis dari data ERP (belum dipesan, perlu konfirmasi, kain, QC
// fisik, dst — lihat KLF-Server-main/utils/todoAgenda.js). Tiap tugas punya
// tanggal "harus beres" → dikelompokkan per minggu supaya QC/PIC tidak perlu
// membuka project satu per satu.

const KATEGORI = ['Stainless', 'Besi', 'Kayu', 'Jok', 'Rotan', 'Marmer', 'Kaca', 'Fiber', 'Veneer', 'Finishing', 'Hardware', 'BarangJadi'];

const BUCKETS = [
  { key: 'overdue', label: 'Terlambat', color: '#dc2626' },
  { key: 'this_week', label: 'Minggu ini', color: '#d97706' },
  { key: 'next_week', label: 'Minggu depan', color: '#2563eb' },
  { key: 'later', label: 'Nanti', color: '#6b7280' },
  { key: 'snoozed', label: 'Ditunda', color: '#7c3aed' },
];

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
const addDays = (s, n) => {
  const d = fromYMD(s) || new Date();
  d.setDate(d.getDate() + n);
  return toYMD(d);
};
const nextMonday = (s) => {
  const d = fromYMD(s) || new Date();
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() + (7 - dow));
  return toYMD(d);
};

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

  const [tab, setTab] = useState(() => lsGet('todo.tab', 'overdue'));
  const [groupBy, setGroupBy] = useState(() => lsGet('todo.groupBy', 'tanggal'));
  const [showStock, setShowStock] = useState(() => lsGet('todo.showStock', false));
  const [fKategori, setFKategori] = useState('');
  const [fJenis, setFJenis] = useState('');
  const [fPic, setFPic] = useState('');
  const [fSumber, setFSumber] = useState('');
  const [search, setSearch] = useState('');

  const [selectedKey, setSelectedKey] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => lsSet('todo.tab', tab), [tab]);
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
      if (Array.isArray(d)) setUsers(d.map((u) => u.name).filter((n) => n && !/bot|hermes/i.test(n)));
    }).catch(() => {});
  }, [baseUrl, fetchAgenda]);

  const tasks = agenda?.tasks || [];
  const today = agenda?.today || toYMD(new Date());

  // Filter selain bucket — dipakai juga untuk angka di tab.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (!showStock && t.is_stock) return false;
      if (fKategori && t.category !== fKategori) return false;
      if (fJenis && t.jenis !== fJenis) return false;
      if (fSumber && t.sumber !== fSumber) return false;
      if (fPic === '__none' && t.pic) return false;
      if (fPic && fPic !== '__none' && t.pic !== fPic) return false;
      if (q && ![t.judul, t.item, t.customer, t.kode_invoice, t.supplier].some((v) => String(v || '').toLowerCase().includes(q))) return false;
      return true;
    });
  }, [tasks, showStock, fKategori, fJenis, fSumber, fPic, search]);

  const counts = useMemo(() => {
    const c = {};
    filtered.forEach((t) => { c[t.bucket] = (c[t.bucket] || 0) + 1; });
    return c;
  }, [filtered]);

  const groups = useMemo(() => {
    const list = filtered.filter((t) => t.bucket === tab);
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
      label: groupBy === 'tanggal' ? (k === today ? `Hari ini · ${fmtTanggal(k)}` : fmtTanggal(k)) : k,
      items,
    }));
    if (groupBy === 'tanggal') arr.sort((a, b) => (a.key || '9999').localeCompare(b.key || '9999'));
    else arr.sort((a, b) => b.items.length - a.items.length || a.label.localeCompare(b.label));
    return arr;
  }, [filtered, tab, groupBy, today]);

  const selected = tasks.find((t) => t.key === selectedKey) || null;

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
      if (action === 'note') return post('/projects/todo/item', { ...ident, op: 'note', text: value });
      if (action === 'done') return post('/projects/todo/item', { ...ident, op: 'update', patch: { done: true } });
      if (action === 'delete') return post('/projects/todo/item', { ...ident, op: 'delete' });
      const f = { snooze: 'snooze_until', due: 'due', pic: 'pic' }[action];
      return post('/projects/todo/item', { ...ident, op: 'update', patch: { [f]: value || '' } });
    }
    return post('/todo/auto-state', { key: t.key, action, value, jenis: t.jenis });
  };

  const jadikanTodo = (t) => {
    const teks = window.prompt('Teks to-do (mis. "Tanya customer warna finishing — tunggu jawaban"):', t.judul);
    if (!teks || !teks.trim()) return;
    const cat = KATEGORI.includes(t.category) ? t.category : 'BarangJadi';
    post('/projects/todo/item', { projectId: t.project_id, category: cat, op: 'add', text: teks.trim(), due: t.due, pic: t.pic })
      .then((ok) => ok && t.bisa_ditandai_beres && window.confirm('To-do dibuat. Sembunyikan temuan otomatis ini sekarang?') && aksi(t, 'resolve'));
  };

  const bukaProject = (t) => {
    const cat = KATEGORI.includes(t.category) ? `/${t.category}` : '';
    navigate(`/project/${t.project_id}${cat}`);
  };

  // --- Style kecil ------------------------------------------------------------
  const sInput = {
    background: C.input, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: '8px 10px', fontSize: 14, minHeight: 38,
  };
  const sBtn = (bg, fg = '#fff') => ({
    background: bg, color: fg, border: 'none', borderRadius: 10, padding: '10px 14px',
    fontSize: 14, fontWeight: 600, cursor: 'pointer', minHeight: 42,
  });
  const chip = (color) => ({
    display: 'inline-block', background: color, color: '#fff', borderRadius: 999,
    padding: '1px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
  });

  const dueBadge = (t) => {
    if (t.bucket === 'snoozed') return { text: `Ditunda s/d ${fmtTanggal(t.snooze_until)}`, color: '#7c3aed' };
    if (!t.due) return { text: 'Tanpa tanggal', color: C.muted };
    if (t.telat_hari > 0) return { text: `Telat ${t.telat_hari} hr`, color: '#dc2626' };
    if (t.due === today) return { text: 'Hari ini', color: '#d97706' };
    return { text: fmtTanggal(t.due), color: C.muted };
  };

  const kirimBadge = (t) => {
    if (t.sisa_hari == null) return null;
    if (t.sisa_hari < 0) return { text: `Kirim lewat ${-t.sisa_hari} hr`, color: '#dc2626' };
    return { text: `Kirim H-${t.sisa_hari}`, color: t.sisa_hari <= 7 ? '#d97706' : C.muted };
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
          <button type="button" style={sBtn(C.soft, C.text)} onClick={() => { setLoading(true); fetchAgenda(); }} title="Muat ulang">⟳</button>
          <button type="button" style={sBtn(C.soft, C.text)} onClick={() => setShowSettings(true)} title="Setting lead time">⚙</button>
          <button type="button" style={sBtn('#2563eb')} onClick={() => setShowAdd(true)}>+ To-do</button>
        </div>

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
          <input style={{ ...sInput, minWidth: 150, flex: '1 0 150px' }} placeholder="Cari item / customer / supplier" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select style={sInput} value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
            {GROUPS.map((g) => <option key={g.key} value={g.key}>Per {g.label}</option>)}
          </select>
          <select style={sInput} value={fKategori} onChange={(e) => setFKategori(e.target.value)}>
            <option value="">Semua kategori</option>
            {[...KATEGORI, 'Pengiriman'].map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <select style={sInput} value={fJenis} onChange={(e) => setFJenis(e.target.value)}>
            <option value="">Semua jenis</option>
            {Object.entries(jenisOptions).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select style={sInput} value={fPic} onChange={(e) => setFPic(e.target.value)}>
            <option value="">Semua PIC</option>
            <option value="__none">Belum ada PIC</option>
            {users.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <select style={sInput} value={fSumber} onChange={(e) => setFSumber(e.target.value)}>
            <option value="">Manual + otomatis</option>
            <option value="manual">✎ Manual saja</option>
            <option value="otomatis">⚙ Otomatis saja</option>
          </select>
          <label style={{ ...sInput, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', cursor: 'pointer' }}>
            <input type="checkbox" checked={showStock} onChange={(e) => setShowStock(e.target.checked)} /> Item stok
          </label>
        </div>

        {/* Daftar */}
        {loading && !agenda && <div style={{ padding: 30, textAlign: 'center', color: C.muted }}>Memuat agenda…</div>}
        {error && <div style={{ padding: 12, borderRadius: 10, background: '#fee2e2', color: '#991b1b', marginBottom: 10 }}>{error}</div>}
        {agenda && groups.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>
            Tidak ada tugas di “{BUCKETS.find((b) => b.key === tab)?.label}” 🎉
          </div>
        )}

        {groups.map((g) => (
          <div key={g.key || '-'} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '4px 2px 6px' }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{g.label}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{g.items.length} tugas</div>
            </div>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {g.items.map((t) => {
                const due = dueBadge(t);
                const kirim = kirimBadge(t);
                return (
                  <div
                    key={t.key}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedKey(t.key)}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedKey(t.key)}
                    style={{
                      background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${due.color}`,
                      borderRadius: 12, padding: 10, display: 'flex', gap: 10, cursor: 'pointer',
                    }}
                  >
                    {t.image ? (
                      <img src={getImageUrl(t.image)} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flex: '0 0 56px' }} />
                    ) : (
                      <div style={{ width: 56, height: 56, borderRadius: 8, background: C.soft, flex: '0 0 56px' }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
                        <span style={chip(CAT_COLOR[t.category] || '#6b7280')}>{t.category}</span>
                        <span style={{ fontSize: 11, color: C.muted }}>{t.sumber === 'manual' ? '✎ to-do' : `⚙ ${t.jenis_label}`}</span>
                        {t.pic && <span style={{ fontSize: 11, color: C.muted }}>· {t.pic}</span>}
                        {t.notes?.length > 0 && <span style={{ fontSize: 11, color: C.muted }}>· 💬{t.notes.length}</span>}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3, wordBreak: 'break-word' }}>{t.judul}</div>
                      <div style={{ fontSize: 12, color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.item} · {t.customer || t.kode_invoice}
                      </div>
                      <div style={{ display: 'flex', gap: 8, fontSize: 12, marginTop: 2, flexWrap: 'wrap' }}>
                        <span style={{ color: due.color, fontWeight: 600 }}>{due.text}</span>
                        {kirim && <span style={{ color: kirim.color }}>{kirim.text}</span>}
                        {t.supplier && groupBy !== 'supplier' && <span style={{ color: C.muted }}>{t.supplier}</span>}
                      </div>
                      {t.notes?.length > 0 && (
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 4, fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          “{t.notes[t.notes.length - 1].text}”
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <TaskSheet
          t={selected}
          C={C}
          users={users}
          busy={busy}
          today={today}
          sInput={sInput}
          sBtn={sBtn}
          chip={chip}
          onClose={() => setSelectedKey(null)}
          aksi={aksi}
          jadikanTodo={jadikanTodo}
          bukaProject={bukaProject}
        />
      )}
      {showAdd && (
        <AddSheet C={C} users={users} busy={busy} sInput={sInput} sBtn={sBtn} baseUrl={baseUrl} onClose={() => setShowAdd(false)}
          onSubmit={async (body) => { if (await post('/projects/todo/item', { ...body, op: 'add' })) setShowAdd(false); }} />
      )}
      {showSettings && (
        <SettingsSheet C={C} sInput={sInput} sBtn={sBtn} baseUrl={baseUrl} user={user} onClose={() => setShowSettings(false)} onSaved={fetchAgenda} />
      )}
    </div>
  );
};

// ============================================================================
// Bottom sheet
// ============================================================================
const Sheet = ({ C, onClose, title, children }) => (
  <div
    onClick={onClose}
    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1050, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: C.card, color: C.text, width: '100%', maxWidth: 640, maxHeight: '88vh', overflowY: 'auto',
        borderRadius: '16px 16px 0 0', padding: '14px 16px 24px', boxShadow: '0 -8px 30px rgba(0,0,0,0.25)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, fontWeight: 700, fontSize: 16 }}>{title}</div>
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 22, cursor: 'pointer', padding: '0 6px' }}>×</button>
      </div>
      {children}
    </div>
  </div>
);

const Label = ({ C, children }) => <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, margin: '12px 0 4px' }}>{children}</div>;

const TaskSheet = ({ t, C, users, busy, today, sInput, sBtn, chip, onClose, aksi, jadikanTodo, bukaProject }) => {
  const [note, setNote] = useState('');
  const d = t.detail || {};
  const manual = t.sumber === 'manual';

  return (
    <Sheet C={C} onClose={onClose} title={t.judul}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', fontSize: 13 }}>
        <span style={chip(CAT_COLOR[t.category] || '#6b7280')}>{t.category}</span>
        <span style={{ color: C.muted }}>{manual ? '✎ To-do manual' : `⚙ ${t.jenis_label} (otomatis)`}</span>
      </div>
      <div style={{ fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
        <div><b>{t.item}</b></div>
        <div style={{ color: C.muted }}>{t.customer} · {t.kode_invoice}</div>
        {t.supplier && <div style={{ color: C.muted }}>Supplier: {t.supplier}{t.status_kategori ? ` · status ${t.status_kategori}` : ''}</div>}
        <div style={{ color: C.muted }}>
          Target kirim: {t.target_kirim ? fmtTanggal(t.target_kirim) : '—'} · Harus beres: {t.due ? fmtTanggal(t.due) : '—'}
          {t.telat_hari > 0 && <b style={{ color: '#dc2626' }}> (telat {t.telat_hari} hr)</b>}
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

      {/* Aksi utama */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
        {manual && <button type="button" disabled={busy} style={sBtn('#16a34a')} onClick={async () => { if (await aksi(t, 'done')) onClose(); }}>✓ Selesai</button>}
        <button type="button" style={sBtn('#2563eb')} onClick={() => bukaProject(t)}>Buka project</button>
        {!manual && <button type="button" disabled={busy} style={sBtn(C.soft, C.text)} onClick={() => jadikanTodo(t)}>Jadikan to-do</button>}
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

      {/* Tunda */}
      <Label C={C}>Tunda sampai</Label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[['Besok', addDays(today, 1)], ['+3 hari', addDays(today, 3)], ['Senin depan', nextMonday(today)]].map(([l, v]) => (
          <button type="button" key={l} disabled={busy} style={sBtn(C.soft, C.text)} onClick={() => aksi(t, 'snooze', v)}>{l}</button>
        ))}
        <input type="date" style={sInput} value={t.snooze_until || ''} onChange={(e) => aksi(t, 'snooze', e.target.value)} />
        {t.snooze_until && <button type="button" disabled={busy} style={sBtn(C.soft, C.text)} onClick={() => aksi(t, 'snooze', '')}>Batal tunda</button>}
      </div>

      {/* Tanggal & PIC */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 160px' }}>
          <Label C={C}>Harus beres tanggal</Label>
          <input type="date" style={{ ...sInput, width: '100%' }} value={t.due_manual ? t.due : ''} onChange={(e) => aksi(t, 'due', e.target.value)} />
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{t.due_manual ? 'Diatur manual' : `Otomatis: ${t.due ? fmtTanggal(t.due) : '—'}`}</div>
        </div>
        <div style={{ flex: '1 1 160px' }}>
          <Label C={C}>PIC</Label>
          <select style={{ ...sInput, width: '100%' }} value={t.pic || ''} onChange={(e) => aksi(t, 'pic', e.target.value)}>
            <option value="">— belum ada —</option>
            {users.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      {/* Catatan follow-up */}
      <Label C={C}>Catatan follow-up</Label>
      {(t.notes || []).map((n, i) => (
        <div key={i} style={{ fontSize: 13, borderLeft: `3px solid ${C.border}`, padding: '2px 8px', marginBottom: 6 }}>
          <div>{n.text}</div>
          <div style={{ fontSize: 11, color: C.muted }}>{n.by || '—'} · {String(n.at || '').slice(0, 16).replace('T', ' ')}</div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 6 }}>
        <input style={{ ...sInput, flex: 1 }} placeholder="mis. Sudah WA supplier, janji Kamis" value={note} onChange={(e) => setNote(e.target.value)} />
        <button type="button" disabled={busy || !note.trim()} style={sBtn('#2563eb')} onClick={async () => { if (await aksi(t, 'note', note)) setNote(''); }}>Simpan</button>
      </div>

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
  const [due, setDue] = useState('');
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
        {KATEGORI.map((k) => <option key={k} value={k}>{k === 'BarangJadi' ? 'Umum / Barang Jadi' : k}</option>)}
      </select>

      <Label C={C}>To-do</Label>
      <textarea style={{ ...sInput, width: '100%', minHeight: 70 }} placeholder="mis. Kejar marmer ke supplier, minta foto progres" value={text} onChange={(e) => setText(e.target.value)} />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 160px' }}>
          <Label C={C}>Harus beres (opsional)</Label>
          <input type="date" style={{ ...sInput, width: '100%' }} value={due} onChange={(e) => setDue(e.target.value)} />
        </div>
        <div style={{ flex: '1 1 160px' }}>
          <Label C={C}>PIC</Label>
          <select style={{ ...sInput, width: '100%' }} value={pic} onChange={(e) => setPic(e.target.value)}>
            <option value="">— belum ada —</option>
            {users.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      <button type="button" disabled={busy || !projectId || !text.trim()} style={{ ...sBtn('#2563eb'), width: '100%', marginTop: 16, opacity: !projectId || !text.trim() ? 0.5 : 1 }}
        onClick={() => onSubmit({ projectId, category, text: text.trim(), due: due || undefined, pic: pic || undefined })}>
        Simpan to-do
      </button>
    </Sheet>
  );
};

const BASIS_LABEL = { target: 'hari dari target kirim', invoice: 'hari setelah invoice', today: 'segera (hari ini)' };

const SettingsSheet = ({ C, sInput, sBtn, baseUrl, user, onClose, onSaved }) => {
  const [value, setValue] = useState(null);
  const [def, setDef] = useState({});
  const [label, setLabel] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${baseUrl}/todo/settings`).then((r) => r.json()).then((d) => {
      setValue(d.value || {}); setDef(d.default || {}); setLabel(d.jenis_label || {});
    }).catch(() => setValue({}));
  }, [baseUrl]);

  const ubah = (k, f, v) => setValue((prev) => ({ ...prev, [k]: { ...prev[k], [f]: f === 'hari' ? Number(v) : v } }));
  const namaAturan = (k) => {
    const [j, cat] = k.split(':');
    return `${label[j] || j}${cat ? ` — ${cat}` : ''}`;
  };
  const simpan = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${baseUrl}/todo/settings`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value, by: user?.uid || '' }),
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
    <Sheet C={C} onClose={onClose} title="Lead time (kapan tugas harus beres)">
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
        Contoh: “-21 hari dari target kirim” = marmer harus dipesan 3 minggu sebelum barang dikirim.
      </div>
      {!value && <div style={{ color: C.muted }}>Memuat…</div>}
      {value && Object.keys(value).sort().map((k) => (
        <div key={k} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 180px', fontSize: 13, fontWeight: 600 }}>{namaAturan(k)}</div>
          <input type="number" style={{ ...sInput, width: 70 }} disabled={value[k].basis === 'today'} value={value[k].hari} onChange={(e) => ubah(k, 'hari', e.target.value)} />
          <select style={sInput} value={value[k].basis} onChange={(e) => ubah(k, 'basis', e.target.value)}>
            {Object.entries(BASIS_LABEL).map(([b, l]) => <option key={b} value={b}>{l}</option>)}
          </select>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button type="button" style={sBtn(C.soft, C.text)} onClick={() => setValue({ ...def })}>Kembalikan default</button>
        <button type="button" disabled={saving || !value} style={{ ...sBtn('#2563eb'), flex: 1 }} onClick={simpan}>Simpan</button>
      </div>
    </Sheet>
  );
};

export default Todo;
