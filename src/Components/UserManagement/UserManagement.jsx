import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Input, Button, Typography, Drawer, Select, Switch, message, Popconfirm } from 'antd';
import { FiSearch, FiEdit2, FiChevronDown, FiChevronRight, FiUserPlus, FiCopy, FiUsers, FiKey, FiShield } from 'react-icons/fi';
import { getApiBaseUrl } from '../../Config/APIurl';
import { heicToJpeg } from '../../Utils/heic';
import { useTheme } from '../../ThemeContext';
import { getImageUrl } from '../../Utils/image';

const { Title } = Typography;

/**
 * User Management (/user-management, khusus super admin).
 * Akses = koleksi UserAccess {uid, menu, value}; `menu` = key yang dicek hasMenuAccess di NavigationBar
 * & halaman. Key TIDAK boleh diganti (data lama tersimpan dengan key ini) — yang diatur di sini hanya
 * label & pengelompokan. Akses baru: tambahkan ke GROUPS di bawah.
 * Dua cara lihat: Per User (centang per grup) & Per Akses (siapa saja yang punya satu akses).
 */
const SUPER_ADMIN_UIDS = ['fYpdHwXRDLhj5XGxM5FZIAvxp9E2', 'w4M5JJjgGQeHFbS2nkyoCfUBE532'];

// izin: true = izin khusus di dalam halaman (bukan menu)
const GROUPS = [
  {
    key: 'umum', label: 'Umum', icon: '🏠', items: [
      { key: 'Dashboard', label: 'Dashboard' },
      { key: 'Calendar', label: 'Calendar' },
      { key: 'Notes', label: 'Notes' },
      { key: 'Knowledge', label: 'Knowledge Base' },
      { key: 'KLF AI', label: 'KLF AI', desc: 'Chat AI ERP, termasuk tutup item & usulan aksi' },
    ],
  },
  {
    key: 'order', label: 'Order & Produksi', icon: '🛠️', items: [
      { key: 'Quote', label: 'Quote' },
      { key: 'Invoice', label: 'Invoice' },
      { key: 'Projects', label: 'Projects' },
      { key: 'SPK', label: 'SPK' },
      { key: 'Category', label: 'Category', desc: 'Analisa proses per project (PM)' },
      { key: 'Todo', label: 'To-Do & QC' },
      { key: 'Pengiriman', label: 'Pengiriman' },
      { key: 'Books', label: 'Books' },
      { key: 'Lihat Telepon', label: 'Lihat nomor telepon', desc: 'Nomor customer tidak disensor', izin: true },
      { key: 'QC Alur Kerja', label: 'Centang QC Alur Kerja', desc: 'QC Pass / Servis', izin: true },
      { key: 'Delivery Tracker', label: 'Delivery Tracker', izin: true },
    ],
  },
  {
    key: 'katalog', label: 'Katalog & Produk', icon: '🪑', items: [
      { key: 'Hasil Produksi', label: 'Hasil Produksi → Katalog' },
      { key: 'Products', label: 'Products' },
      { key: 'Desain Produk', label: 'Desain Produk', desc: 'Lihat & upload desain / foto katalog' },
      { key: 'Price List', label: 'Riwayat HPP Produksi' },
      { key: 'Link Produk', label: 'Tautkan project ke produk', desc: 'Kartu Produk Website di detail project', izin: true },
      { key: 'Kurasi Desain', label: 'Kurasi desain', desc: 'Revisi / Arsip / Tambah Produk', izin: true },
      { key: 'Kelola Kategori', label: 'Kelola kategori produk', desc: 'Tambah, ganti nama, gabung — ikut berubah di website', izin: true },
    ],
  },
  {
    key: 'keuangan', label: 'Keuangan', icon: '💰', items: [
      { key: 'Accounting', label: 'Accounting' },
      { key: 'Stocks', label: 'Stocks' },
      { key: 'Assets', label: 'Assets' },
    ],
  },
  {
    key: 'tim', label: 'Tim & Marketing', icon: '👥', items: [
      { key: 'CRM', label: 'CRM' },
      { key: 'Absensi', label: 'Absensi' },
      { key: 'Appraisal', label: 'Appraisal' },
      { key: 'Website Admin', label: 'Website Admin', desc: 'Panel admin website', izin: true },
    ],
  },
];
const ALL_ITEMS = GROUPS.flatMap((g) => g.items.map((it) => ({ ...it, group: g })));

const useIsMobile = () => {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => { const h = () => setM(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return m;
};

const Avatar = ({ u, size = 40 }) => (
  u?.profilePicture
    ? <img src={getImageUrl(u.profilePicture)} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', background: '#e3b75a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.42, flexShrink: 0 }}>{String(u?.name || '?').charAt(0).toUpperCase()}</div>
);

const UserManagement = () => {
  const baseUrl = getApiBaseUrl();
  const { globalTheme } = useTheme();
  const dark = globalTheme !== 'light';
  const isMobile = useIsMobile();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user) { window.location.replace('/login'); return; }
    if (!SUPER_ADMIN_UIDS.includes(user.uid)) window.location.replace('/project');
  }, []);

  const [users, setUsers] = useState([]);
  const [access, setAccess] = useState([]);
  const [mode, setMode] = useState('user'); // 'user' | 'akses'
  const [q, setQ] = useState('');
  const [selUid, setSelUid] = useState(null);
  const [selKey, setSelKey] = useState(ALL_ITEMS[0].key);
  const [open, setOpen] = useState({}); // grup terbuka di detail user
  const [pending, setPending] = useState({}); // `${uid}|${menu}` sedang disimpan
  const [copyFrom, setCopyFrom] = useState(null);

  const [showTambah, setShowTambah] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', profilePicture: '', nomorWa: '', waAlias: '' });
  const [formRegister, setFormRegister] = useState({ name: '', email: '', password: '', profilePicture: '' });

  const fetchUsers = () => fetch(`${baseUrl}/users/all/get`).then((r) => r.json()).then((d) => setUsers(Array.isArray(d) ? d : [])).catch(() => message.error('Gagal memuat user'));
  const fetchAccess = () => fetch(`${baseUrl}/useraccess/get`).then((r) => r.json()).then((d) => setAccess(Array.isArray(d) ? d : [])).catch(() => {});
  useEffect(() => { fetchUsers(); fetchAccess(); }, []);

  const has = (uid, menu) => access.some((a) => a.uid === uid && a.menu === menu && (a.value === true || a.value === 'true'));
  const isSuper = (uid) => SUPER_ADMIN_UIDS.includes(uid);

  // simpan banyak perubahan sekaligus; state lokal diubah dulu (optimistic) supaya centang terasa instan
  const setMany = async (changes) => {
    const todo = changes.filter(({ uid, menu, value }) => has(uid, menu) !== value);
    if (!todo.length) return;
    setAccess((prev) => {
      const next = prev.filter((a) => !todo.some((t) => t.uid === a.uid && t.menu === a.menu));
      return [...next, ...todo.map(({ uid, menu, value }) => ({ uid, menu, value }))];
    });
    setPending((p) => ({ ...p, ...Object.fromEntries(todo.map((t) => [`${t.uid}|${t.menu}`, true])) }));
    const hasil = await Promise.all(todo.map(({ uid, menu, value }) => fetch(`${baseUrl}/useraccess/update`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uid, menu, value }),
    }).then((r) => r.ok).catch(() => false)));
    setPending((p) => { const n = { ...p }; todo.forEach((t) => delete n[`${t.uid}|${t.menu}`]); return n; });
    if (hasil.some((ok) => !ok)) { message.error('Sebagian akses gagal disimpan — dimuat ulang'); fetchAccess(); }
  };

  const countOf = (uid) => ALL_ITEMS.filter((it) => has(uid, it.key)).length;
  const sortedUsers = useMemo(() => {
    const s = q.trim().toLowerCase();
    return users
      .filter((u) => !s || `${u.name} ${u.email}`.toLowerCase().includes(s))
      .sort((a, b) => (isSuper(b.uid) - isSuper(a.uid)) || String(a.name).localeCompare(String(b.name)));
  }, [users, q]);
  const sel = users.find((u) => u.uid === selUid) || null;
  useEffect(() => { if (!isMobile && !selUid && sortedUsers.length) setSelUid(sortedUsers[0].uid); }, [sortedUsers.length, isMobile]);

  // ---- user CRUD (logika lama) ----
  const openEdit = (u) => {
    setFormData({ name: u.name || '', email: u.email || '', password: '', profilePicture: null, id: u.id || u._id || '', nomorWa: u.nomorWa || '', waAlias: Array.isArray(u.waAlias) ? u.waAlias.join(', ') : (u.waAlias || '') });
    setShowEdit(true);
  };
  const handleRegister = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    ['name', 'email', 'password'].forEach((k) => fd.append(k, formRegister[k]));
    if (formRegister.profilePicture) fd.append('profilePicture', formRegister.profilePicture);
    try {
      const res = await fetch(`${baseUrl}/register`, { method: 'POST', body: fd });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Gagal register');
      message.success('User ditambahkan — atur aksesnya');
      setShowTambah(false); setFormRegister({ name: '', email: '', password: '', profilePicture: '' });
      fetchUsers();
    } catch (err) { message.error(err.message); }
  };
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    ['id', 'name', 'email', 'password'].forEach((k) => fd.append(k, formData[k] || ''));
    fd.append('nomorWa', formData.nomorWa || '');
    fd.append('waAlias', formData.waAlias || '');
    if (formData.profilePicture) fd.append('profilePicture', formData.profilePicture);
    try {
      const res = await fetch(`${baseUrl}/user/update`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Gagal update user');
      message.success('User diperbarui'); setShowEdit(false); fetchUsers();
    } catch (err) { message.error(err.message); }
  };
  const handleDeleteUser = async () => {
    try {
      const res = await fetch(`${baseUrl}/user/delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: formData.id }) });
      if (!res.ok) throw new Error('Gagal hapus user');
      message.success('User dihapus'); setShowEdit(false); setSelUid(null); fetchUsers();
    } catch (err) { message.error(err.message); }
  };

  // ---- style ----
  const th = {
    bg: dark ? '#14141f' : '#f5f6fa', card: dark ? '#1e1e2d' : '#fff', border: dark ? '#333' : '#e5e7eb',
    text: dark ? '#fff' : '#1f2937', muted: dark ? '#9aa0a6' : '#6b7280', input: dark ? '#2a2a3a' : '#fff',
    soft: dark ? '#262636' : '#f3f4f6', on: '#013175',
  };
  const card = { background: th.card, border: `1px solid ${th.border}`, borderRadius: 14 };
  const seg = (active) => ({ flex: 1, padding: '9px 12px', border: 'none', borderRadius: 10, background: active ? th.card : 'transparent', color: active ? th.on : th.muted, fontWeight: 600, fontSize: 14, boxShadow: active ? '0 1px 3px rgba(0,0,0,.12)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' });
  const searchBox = (placeholder) => (
    <div style={{ position: 'relative' }}>
      <FiSearch style={{ position: 'absolute', left: 12, top: 12, color: th.muted }} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10, border: `1px solid ${th.border}`, background: th.input, color: th.text, fontSize: 15, outline: 'none' }} />
    </div>
  );

  // baris satu akses (switch besar, ramah jari). Helper render dipanggil sebagai fungsi, bukan <Komponen/>,
  // supaya tidak remount tiap render (input pencarian tidak kehilangan fokus).
  const AksesRow = ({ uid, it }) => {
    const on = has(uid, it.key);
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', cursor: 'pointer' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: th.text, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {it.label}
            {it.izin && <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', background: dark ? '#2e2347' : '#ede9fe', padding: '1px 6px', borderRadius: 999 }}>IZIN KHUSUS</span>}
          </div>
          {it.desc && <div style={{ fontSize: 12, color: th.muted }}>{it.desc}</div>}
        </div>
        <Switch checked={on} loading={!!pending[`${uid}|${it.key}`]} onChange={(v) => setMany([{ uid, menu: it.key, value: v }])} />
      </label>
    );
  };

  // ---------- panel akses satu user ----------
  const UserAkses = ({ u }) => {
    if (isSuper(u.uid)) {
      return <div style={{ ...card, padding: 16, display: 'flex', gap: 10, alignItems: 'center', color: th.text }}><FiShield size={22} color={th.on} /><div><b>Super admin</b><div style={{ fontSize: 13, color: th.muted }}>Selalu boleh membuka User Management. Akses menu lain tetap mengikuti centang di bawah.</div></div></div>;
    }
    return null;
  };
  const DetailUser = ({ u }) => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <Avatar u={u} size={52} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: th.text }}>{u.name}</div>
          <div style={{ fontSize: 13, color: th.muted, overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</div>
          <div style={{ fontSize: 12, color: th.muted }}>{countOf(u.uid)} dari {ALL_ITEMS.length} akses aktif</div>
        </div>
        <Button icon={<FiEdit2 />} onClick={() => openEdit(u)}>{isMobile ? '' : 'Edit profil'}</Button>
      </div>
      {UserAkses({ u })}
      <div style={{ ...card, padding: '10px 14px', margin: '12px 0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <FiCopy color={th.muted} />
        <span style={{ fontSize: 13, color: th.muted }}>Samakan akses dengan</span>
        <Select size="middle" style={{ flex: 1, minWidth: 160 }} placeholder="pilih user…" value={copyFrom} onChange={setCopyFrom}
          options={users.filter((x) => x.uid !== u.uid).map((x) => ({ value: x.uid, label: x.name }))} />
        <Popconfirm title="Timpa semua akses user ini?" description={`Akses ${u.name} dibuat persis sama dengan ${users.find((x) => x.uid === copyFrom)?.name || ''}.`} okText="Ya, samakan" cancelText="Batal" disabled={!copyFrom}
          onConfirm={() => { setMany(ALL_ITEMS.map((it) => ({ uid: u.uid, menu: it.key, value: has(copyFrom, it.key) }))); message.success('Akses disamakan'); setCopyFrom(null); }}>
          <Button type="primary" disabled={!copyFrom}>Terapkan</Button>
        </Popconfirm>
      </div>

      {GROUPS.map((g) => {
        const aktif = g.items.filter((it) => has(u.uid, it.key)).length;
        const semua = aktif === g.items.length;
        const terbuka = open[g.key] ?? aktif > 0;
        return (
          <div key={g.key} style={{ ...card, marginBottom: 10, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: th.soft, cursor: 'pointer' }} onClick={() => setOpen((o) => ({ ...o, [g.key]: !terbuka }))}>
              {terbuka ? <FiChevronDown color={th.muted} /> : <FiChevronRight color={th.muted} />}
              <span style={{ fontSize: 18 }}>{g.icon}</span>
              <div style={{ flex: 1, fontWeight: 700, color: th.text }}>{g.label}</div>
              <span style={{ fontSize: 12, fontWeight: 700, color: aktif ? th.on : th.muted, background: aktif ? (dark ? '#1c2b4a' : '#e0e7ff') : 'transparent', padding: '2px 9px', borderRadius: 999 }}>{aktif}/{g.items.length}</span>
              <span onClick={(e) => e.stopPropagation()}>
                <Popconfirm title={semua ? `Cabut semua akses ${g.label}?` : `Beri semua akses ${g.label}?`} okText="Ya" cancelText="Batal"
                  onConfirm={() => setMany(g.items.map((it) => ({ uid: u.uid, menu: it.key, value: !semua })))}>
                  <Button size="small">{semua ? 'Cabut semua' : 'Semua'}</Button>
                </Popconfirm>
              </span>
            </div>
            {terbuka && g.items.map((it) => (
              <div key={it.key} style={{ borderTop: `1px solid ${th.border}` }}>{AksesRow({ uid: u.uid, it })}</div>
            ))}
          </div>
        );
      })}
    </div>
  );

  // ---------- mode Per Akses ----------
  const selItem = ALL_ITEMS.find((it) => it.key === selKey);
  const PerAkses = () => {
    const pemegang = users.filter((u) => has(u.uid, selKey));
    const s = q.trim().toLowerCase();
    const list = users.filter((u) => !s || `${u.name} ${u.email}`.toLowerCase().includes(s))
      .sort((a, b) => (has(b.uid, selKey) - has(a.uid, selKey)) || String(a.name).localeCompare(String(b.name)));
    return (
      <div style={{ display: isMobile ? 'block' : 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
        <div style={{ ...card, padding: 8, marginBottom: isMobile ? 12 : 0, alignSelf: 'start', ...(isMobile ? {} : { maxHeight: '75vh', overflowY: 'auto' }) }}>
          {isMobile ? (
            <Select size="large" style={{ width: '100%' }} value={selKey} onChange={setSelKey} showSearch optionFilterProp="label"
              options={GROUPS.map((g) => ({ label: `${g.icon} ${g.label}`, options: g.items.map((it) => ({ value: it.key, label: `${it.label} (${users.filter((u) => has(u.uid, it.key)).length})` })) }))} />
          ) : GROUPS.map((g) => (
            <div key={g.key} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: th.muted, textTransform: 'uppercase', padding: '8px 10px 4px' }}>{g.icon} {g.label}</div>
              {g.items.map((it) => {
                const n = users.filter((u) => has(u.uid, it.key)).length;
                const act = it.key === selKey;
                return (
                  <div key={it.key} onClick={() => setSelKey(it.key)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: act ? th.on : 'transparent', color: act ? '#fff' : th.text, fontSize: 14 }}>
                    <span style={{ flex: 1 }}>{it.label}</span>
                    <span style={{ fontSize: 12, opacity: 0.8 }}>{n}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div>
          <div style={{ ...card, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: th.text }}>{selItem?.label} {selItem?.izin && <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', background: dark ? '#2e2347' : '#ede9fe', padding: '1px 6px', borderRadius: 999, verticalAlign: 'middle' }}>IZIN KHUSUS</span>}</div>
            {selItem?.desc && <div style={{ fontSize: 13, color: th.muted }}>{selItem.desc}</div>}
            <div style={{ fontSize: 13, color: th.muted, marginTop: 4 }}>{pemegang.length} dari {users.length} user punya akses ini</div>
          </div>
          <div style={{ marginBottom: 10 }}>{searchBox('Cari user…')}</div>
          <div style={{ ...card, overflow: 'hidden' }}>
            {list.map((u, i) => {
              const on = has(u.uid, selKey);
              return (
                <label key={u.uid} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderTop: i ? `1px solid ${th.border}` : 'none', cursor: 'pointer', opacity: on ? 1 : 0.75 }}>
                  <Avatar u={u} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: th.text, fontSize: 14 }}>{u.name}{isSuper(u.uid) && <FiShield style={{ marginLeft: 6, verticalAlign: -2 }} color={th.on} />}</div>
                    <div style={{ fontSize: 12, color: th.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                  </div>
                  <Switch checked={on} loading={!!pending[`${u.uid}|${selKey}`]} onChange={(v) => setMany([{ uid: u.uid, menu: selKey, value: v }])} />
                </label>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ---------- daftar user ----------
  const DaftarUser = () => (
    <div style={{ ...card, overflow: 'hidden' }}>
      {sortedUsers.map((u, i) => {
        const act = !isMobile && u.uid === selUid;
        const n = countOf(u.uid);
        return (
          <div key={u.uid} onClick={() => setSelUid(u.uid)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderTop: i ? `1px solid ${th.border}` : 'none', cursor: 'pointer', background: act ? (dark ? '#1c2b4a' : '#eef2ff') : 'transparent', borderLeft: `3px solid ${act ? th.on : 'transparent'}` }}>
            <Avatar u={u} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: th.text, display: 'flex', alignItems: 'center', gap: 6 }}>{u.name}{isSuper(u.uid) && <FiShield color={th.on} title="Super admin" />}</div>
              <div style={{ fontSize: 12, color: th.muted }}>{GROUPS.map((g) => g.items.some((it) => has(u.uid, it.key)) ? g.icon : null).filter(Boolean).join(' ') || 'Belum ada akses'}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: n ? th.on : th.muted }}>{n}</span>
            {isMobile && <FiChevronRight color={th.muted} />}
          </div>
        );
      })}
      {!sortedUsers.length && <div style={{ padding: 30, textAlign: 'center', color: th.muted }}>Tidak ada user.</div>}
    </div>
  );

  return (
    <div style={{ background: th.bg, minHeight: '100vh', color: th.text }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 16px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>User Management</div>
            <div style={{ fontSize: 12, color: th.muted }}>{users.length} user · atur akses per user atau per fitur</div>
          </div>
          <Button type="primary" icon={<FiUserPlus />} onClick={() => setShowTambah(true)} style={{ background: th.on }}>{isMobile ? '' : 'Tambah User'}</Button>
        </div>

        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: dark ? '#262636' : '#e5e7eb', marginBottom: 14, maxWidth: 420 }}>
          <button type="button" style={seg(mode === 'user')} onClick={() => { setMode('user'); setQ(''); }}><FiUsers /> Per User</button>
          <button type="button" style={seg(mode === 'akses')} onClick={() => { setMode('akses'); setQ(''); }}><FiKey /> Per Akses</button>
        </div>

        {mode === 'akses' ? PerAkses() : isMobile ? (
          <>
            <div style={{ marginBottom: 10 }}>{searchBox('Cari user…')}</div>
            {DaftarUser()}
            <Drawer open={!!sel} onClose={() => setSelUid(null)} placement="bottom" height="94%" destroyOnClose
              title={<span style={{ color: th.text }}>Akses User</span>} styles={{ body: { background: th.bg, padding: 14 }, header: { background: th.card } }}>
              {sel && DetailUser({ u: sel })}
            </Drawer>
          </>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' }}>
            <div style={{ position: 'sticky', top: 80 }}>
              <div style={{ marginBottom: 10 }}>{searchBox('Cari user…')}</div>
              <div style={{ maxHeight: '72vh', overflowY: 'auto', borderRadius: 14 }}>{DaftarUser()}</div>
            </div>
            <div>{sel ? DetailUser({ u: sel }) : <div style={{ color: th.muted, padding: 40, textAlign: 'center' }}>Pilih user di kiri.</div>}</div>
          </div>
        )}
      </div>

      <Modal title={<Title level={4} style={{ textAlign: 'center', margin: 0 }}>Tambah User</Title>} open={showTambah} onCancel={() => setShowTambah(false)} centered width={400} footer={null}>
        <form onSubmit={handleRegister}>
          {[['name', 'Nama', 'text'], ['email', 'Email', 'text'], ['password', 'Password', 'password']].map(([k, l, t]) => (
            <div className="mb-3" key={k}><label className="mb-1">{l}</label>
              <Input type={t} value={formRegister[k]} onChange={(e) => setFormRegister({ ...formRegister, [k]: e.target.value })} required /></div>
          ))}
          <div className="mb-3"><label className="mb-1">Foto Profil</label>
            <Input type="file" accept="image/*,.heic,.heif" onChange={async (e) => setFormRegister({ ...formRegister, profilePicture: await heicToJpeg(e.target.files[0]) })} /></div>
          <Button type="primary" htmlType="submit" block size="large">Simpan</Button>
        </form>
      </Modal>

      <Modal title={<Title level={4} style={{ textAlign: 'center', margin: 0 }}>Edit User</Title>} open={showEdit} onCancel={() => setShowEdit(false)} width={420} footer={null} centered>
        <form onSubmit={handleUpdateUser}>
          {[['name', 'Nama', 'text', true], ['email', 'Email', 'text', true], ['password', 'Password baru', 'password', false]].map(([k, l, t, req]) => (
            <div className="mb-3" key={k}><label className="mb-1">{l}</label>
              <Input type={t} value={formData[k]} placeholder={k === 'password' ? 'Kosongkan kalau tidak diganti' : ''} onChange={(e) => setFormData({ ...formData, [k]: e.target.value })} required={req} /></div>
          ))}
          <div className="mb-3"><label className="mb-1">Nomor WA</label>
            <Input value={formData.nomorWa} placeholder="08123456789" onChange={(e) => setFormData({ ...formData, nomorWa: e.target.value })} />
            <small style={{ color: '#888' }}>Dipakai Hermes untuk notifikasi saat user ini di-tag di komentar. Kosong = hanya notifikasi di ERP.</small></div>
          <div className="mb-3"><label className="mb-1">Alias Panggilan</label>
            <Input value={formData.waAlias} placeholder="pakde, tatung" onChange={(e) => setFormData({ ...formData, waAlias: e.target.value })} />
            <small style={{ color: '#888' }}>Pisahkan dengan koma. Supaya tag dari WhatsApp ("@pakde") dikenali sebagai user ini.</small></div>
          <div className="mb-3"><label className="mb-1">Foto Profil</label>
            <Input type="file" accept="image/*,.heic,.heif" onChange={async (e) => setFormData({ ...formData, profilePicture: await heicToJpeg(e.target.files[0]) })} /></div>
          <div className="d-flex justify-content-between mt-3">
            <Popconfirm title="Hapus user ini?" okText="Hapus" cancelText="Batal" onConfirm={handleDeleteUser}><Button danger>Hapus User</Button></Popconfirm>
            <Button type="primary" htmlType="submit">Simpan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;
