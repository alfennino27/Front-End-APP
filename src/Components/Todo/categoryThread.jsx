import React, { useEffect, useState, useCallback } from 'react';
import { Image, Mentions } from 'antd';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import ImageUploadZone from '../Pekerjaan/ImageUploadZone';
import { getImageUrl } from '../../Utils/image';
import { mintaRefreshNotif } from '../../Utils/notifRefresh';

// ============================================================================
// Komponen bersama halaman /todo & /papan-order:
// bottom sheet, to-do list category (Projects.Todo<Cat>) dan komentar category
// (Comments + Replies) — sama dengan yang tampil di halaman project.
// ============================================================================

export const PREVIEW = { zIndex: 2000 }; // di atas bottom sheet (z 1050)

// Tinggi area yang benar-benar terlihat (HP: dikurangi toolbar browser & keyboard).
// 100vh di Chrome/Safari HP lebih tinggi dari layar → bagian atas sheet (tombol ×) ketutup.
const useLayarTerlihat = () => {
  const baca = () => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    return vv ? { h: vv.height, top: vv.offsetTop } : { h: typeof window !== 'undefined' ? window.innerHeight : 800, top: 0 };
  };
  const [v, setV] = useState(baca);
  useEffect(() => {
    const vv = window.visualViewport;
    const upd = () => setV(baca());
    window.addEventListener('resize', upd);
    vv?.addEventListener('resize', upd);
    vv?.addEventListener('scroll', upd);
    return () => {
      window.removeEventListener('resize', upd);
      vv?.removeEventListener('resize', upd);
      vv?.removeEventListener('scroll', upd);
    };
  }, []);
  return v;
};

export const Sheet = ({ C, onClose, title, children, maxWidth = 640 }) => {
  const layar = useLayarTerlihat();
  // Kunci scroll halaman di belakang sheet (iOS suka ikut menggulir halaman).
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', left: 0, right: 0, top: layar.top, height: layar.h, background: 'rgba(0,0,0,0.45)', zIndex: 1050,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.card, color: C.text, width: '100%', maxWidth, maxHeight: layar.h - 16,
          display: 'flex', flexDirection: 'column', borderRadius: '16px 16px 0 0', boxShadow: '0 -8px 30px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header tidak ikut menggulir → tombol × selalu terlihat */}
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 8px 8px 16px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ flex: 1, minWidth: 0, fontWeight: 700, fontSize: 16, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{title}</div>
          <button type="button" onClick={onClose} aria-label="Tutup"
            style={{ flex: '0 0 44px', width: 44, height: 44, borderRadius: 999, background: C.soft, border: 'none', color: C.text, fontSize: 24, lineHeight: 1, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', padding: '12px 16px calc(24px + env(safe-area-inset-bottom))' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export const Label = ({ C, children }) => <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, margin: '12px 0 4px' }}>{children}</div>;

const fileUrl = (baseUrl, u) => (/^https?:\/\//.test(u) ? u : `${baseUrl}${u}`);
export const slotFiles = (doc, prefix) => Array.from({ length: 10 }, (_, i) => doc?.[`${prefix}${i + 1}`]).filter(Boolean);

// Teks komentar dengan @nama disorot (nama terpanjang dulu: "@P. Dhe" jangan keburu "@P").
const TeksMention = ({ text, names }) => {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const list = [...names].sort((a, b) => b.length - a.length).map((n) => `@${esc(n)}`);
  if (!list.length || !text) return <span>{text}</span>;
  const parts = String(text).split(new RegExp(`(${list.join('|')})`, 'g'));
  return <span>{parts.map((p, i) => (list.length && p.startsWith('@') && names.includes(p.slice(1)) ? <b key={i} style={{ color: '#2563eb' }}>{p}</b> : p))}</span>;
};

const Lampiran = ({ doc, baseUrl }) => {
  const img = slotFiles(doc, 'image');
  const vid = slotFiles(doc, 'video');
  if (!img.length && !vid.length) return null;
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
      <Image.PreviewGroup preview={PREVIEW}>
        {img.filter((u) => !/\.pdf/i.test(u)).map((u) => (
          <Image key={u} src={getImageUrl(u)} width={72} height={72} style={{ borderRadius: 8, objectFit: 'cover' }} />
        ))}
      </Image.PreviewGroup>
      {img.filter((u) => /\.pdf/i.test(u)).map((u) => (
        <a key={u} href={fileUrl(baseUrl, u)} target="_blank" rel="noopener noreferrer"
          style={{ width: 72, height: 72, borderRadius: 8, background: '#fee2e2', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, textDecoration: 'none' }}>
          PDF
        </a>
      ))}
      {vid.map((u) => <video key={u} src={`${baseUrl}/video/${u.split('/').pop()}`} controls style={{ height: 120, maxWidth: '100%', borderRadius: 8 }} />)}
    </div>
  );
};

// Galeri: foto utama project + gambar category (hasil pecah gambar).
export const gambarCategory = (proj, cat, fallback) => {
  if (!proj) return fallback ? [fallback] : [];
  const rx = new RegExp(`^image${cat}\\d+$`);
  const catImgs = Object.keys(proj).filter((k) => rx.test(k) && proj[k]).sort((a, b) => Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, ''))).map((k) => proj[k]);
  return [...new Set([...slotFiles(proj, 'image'), ...catImgs])].filter((u) => typeof u === 'string' && !/\.pdf/i.test(u));
};

// To-do list + komentar satu category.
// `proj` = hasil /projects/detail (null = memuat), `ubahTodo(body)` = kirim ke /projects/todo/item lalu muat ulang proj.
export const TodoKomentar = ({ projectId, cat, proj, ubahTodo, busy, C, users, userList, user, baseUrl, dark, sInput, sBtn, onKomentar }) => {
  const [comments, setComments] = useState(null);
  const [replies, setReplies] = useState([]);
  const [todoText, setTodoText] = useState('');
  const [komen, setKomen] = useState('');
  const [files, setFiles] = useState([]);
  const [showFiles, setShowFiles] = useState(false);
  const [sending, setSending] = useState(false);

  const loadComments = useCallback(async () => {
    const opt = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: projectId, category: cat }) };
    try {
      const [c, r] = await Promise.all([fetch(`${baseUrl}/comments/list`, opt), fetch(`${baseUrl}/replies/list`, opt)]);
      setComments(c.ok ? await c.json() : []);
      setReplies(r.ok ? await r.json() : []);
    } catch { setComments([]); }
  }, [baseUrl, projectId, cat]);

  useEffect(() => { setComments(null); loadComments(); }, [loadComments]);

  const todos = proj && Array.isArray(proj[`Todo${cat}`]) ? proj[`Todo${cat}`] : [];
  const tambahTodo = async () => {
    const text = todoText.trim();
    if (!text) return;
    await ubahTodo({ op: 'add', text });
    setTodoText('');
  };

  const kirimKomentar = async () => {
    if (sending || (!komen.trim() && !files.length)) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('user', user?.uid || '');
      fd.append('idProduct', projectId);
      fd.append('category', cat);
      fd.append('text', komen.trim());
      files.forEach((f) => f && fd.append('images', f));
      const r = await fetch(`${baseUrl}/comments/create`, { method: 'POST', body: fd });
      if (!r.ok) throw new Error('Gagal mengirim komentar');
      mintaRefreshNotif();
      setKomen(''); setFiles([]); setShowFiles(false);
      await loadComments();
      onKomentar?.();
    } catch (err) {
      alert(`${err.message} — coba lagi (foto masih tersimpan).`);
    } finally {
      setSending(false);
    }
  };

  const namaDari = (uid) => userList.find((u) => u.uid === uid)?.name || 'Unknown';
  const waktu = (doc) => {
    const sec = doc?.date?.value?._seconds;
    return sec ? format(new Date(sec * 1000), 'd MMM yyyy, HH.mm', { locale: localeId }) : '';
  };
  const green = '#16a34a';
  const namaCat = cat === 'BarangJadi' ? 'Umum' : cat;

  return (
    <>
      {/* To-do list category — sama dengan "To Do List" di halaman project */}
      <Label C={C}>To-do list {namaCat}</Label>
      {!proj && <div style={{ fontSize: 13, color: C.muted }}>Memuat…</div>}
      {proj && todos.length === 0 && <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>Belum ada to-do.</div>}
      {todos.map((it, i) => (
        <div key={it.id || i} role="button" tabIndex={0}
          onClick={() => !busy && ubahTodo({ op: 'update', id: it.id || undefined, index: i, patch: { done: !it.done } })}
          onKeyDown={(e) => e.key === 'Enter' && !busy && ubahTodo({ op: 'update', id: it.id || undefined, index: i, patch: { done: !it.done } })}
          style={{
            display: 'flex', gap: 10, alignItems: 'center', padding: '9px 10px', marginBottom: 6, borderRadius: 10, cursor: 'pointer', minHeight: 44,
            border: `1px solid ${it.done ? green : C.border}`, background: it.done ? (dark ? 'rgba(22,163,74,0.15)' : '#f0fdf4') : C.card,
          }}>
          <span style={{
            width: 24, height: 24, flex: '0 0 24px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${it.done ? green : C.muted}`, background: it.done ? green : 'transparent', color: '#fff', fontWeight: 700, fontSize: 15,
          }}>{it.done ? '✓' : ''}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, color: it.done ? green : C.text, fontWeight: it.done ? 600 : 400, wordBreak: 'break-word' }}>{it.text}</div>
            {it.done && it.done_by && <div style={{ fontSize: 11, color: green }}>✓ {it.done_by}{it.done_at ? ` · ${String(it.done_at).slice(0, 10)}` : ''}</div>}
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 6 }}>
        <input style={{ ...sInput, flex: 1, minWidth: 0 }} placeholder="Tambah poin to-do…" value={todoText}
          onChange={(e) => setTodoText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && tambahTodo()} />
        <button type="button" disabled={busy || !todoText.trim()} style={{ ...sBtn('#2563eb'), opacity: todoText.trim() ? 1 : 0.5 }} onClick={tambahTodo}>Tambah</button>
      </div>

      {/* Komentar category — sinkron dengan komentar di halaman project */}
      <Label C={C}>Komentar {namaCat} {comments ? `(${comments.length})` : ''}</Label>
      {!comments && <div style={{ fontSize: 13, color: C.muted }}>Memuat…</div>}
      {comments && comments.length === 0 && <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>Belum ada komentar.</div>}
      {(comments || []).map((c) => (
        <div key={c.id || c._id} style={{ background: C.soft, borderRadius: 10, padding: '8px 10px', marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <b style={{ fontSize: 13 }}>{namaDari(c.user)}</b>
            <span style={{ fontSize: 11, color: C.muted }}>{waktu(c)}</span>
          </div>
          {c.text && <div style={{ fontSize: 14, whiteSpace: 'pre-line', wordBreak: 'break-word' }}><TeksMention text={c.text} names={users} /></div>}
          <Lampiran doc={c} baseUrl={baseUrl} />
          {replies.filter((r) => r.commentId === c.id).map((r) => (
            <div key={r.id || r._id} style={{ borderLeft: `3px solid ${C.border}`, padding: '2px 8px', marginTop: 6 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <b style={{ fontSize: 12 }}>↳ {namaDari(r.user)}</b>
                <span style={{ fontSize: 11, color: C.muted }}>{waktu(r)}</span>
              </div>
              {r.text && <div style={{ fontSize: 13, whiteSpace: 'pre-line', wordBreak: 'break-word' }}><TeksMention text={r.text} names={users} /></div>}
              <Lampiran doc={r} baseUrl={baseUrl} />
            </div>
          ))}
        </div>
      ))}

      <div style={{ marginTop: 4 }}>
        <Mentions
          rows={3}
          value={komen}
          onChange={setKomen}
          placeholder="Tulis komentar… ketik @ untuk tag orang"
          options={users.map((n) => ({ value: n, label: n }))}
          getPopupContainer={(node) => node.parentElement || document.body}
          style={{ width: '100%', fontSize: 16 }}
        />
        {showFiles && (
          <div style={{ marginTop: 6 }}>
            <ImageUploadZone images={files} onChange={setFiles} max={10} theme={dark ? 'dark' : 'light'} allowVideo allowPdf />
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <button type="button" style={sBtn(C.soft, C.text)} onClick={() => setShowFiles((v) => !v)}>
            📎 {files.length ? `${files.length} lampiran` : 'Lampiran'}
          </button>
          <button type="button" disabled={sending || (!komen.trim() && !files.length)}
            style={{ ...sBtn('#2563eb'), flex: 1, opacity: komen.trim() || files.length ? 1 : 0.5 }} onClick={kirimKomentar}>
            {sending ? 'Mengirim…' : 'Kirim komentar'}
          </button>
        </div>
      </div>
    </>
  );
};
