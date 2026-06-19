// Components/AI/AIChatBubble.jsx
// Bubble asisten AI mengambang di halaman Operations -> Project (/project).
// Asisten UMUM: tanya apa saja soal order berjalan (progress, deadline, To Do, yang perlu dikerjakan,
// cari lintas order, detail item). Plus "cek konsistensi <item>". Diproteksi shared secret X-KLF-Key.
// Catatan: upload chat WA dilakukan lewat panel invoice (OrderAssistant), bukan dari bubble.
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useTheme } from '../../ThemeContext';
import { BsChatDotsFill, BsXLg, BsSend, BsArrowsAngleExpand, BsArrowsAngleContract } from 'react-icons/bs';

const aiKey = import.meta.env.VITE_KLF_AI_KEY || '';
const authHeaders = (extra = {}) => ({ ...(aiKey ? { 'X-KLF-Key': aiKey } : {}), ...extra });
const getUid = () => { try { return JSON.parse(localStorage.getItem('user'))?.uid || null; } catch { return null; } };

let MID = 0;
const nid = () => `m${++MID}`;

const AIChatBubble = () => {
  const baseUrl = getApiBaseUrl();
  const { globalTheme } = useTheme();
  const isLight = globalTheme === 'light';

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);
  const apiMsgsRef = useRef([]); // riwayat {role, content} untuk /ai/chat (multi-turn)
  const usersRef = useRef(null); // cache daftar user (untuk resolve tag nama -> uid)
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  useEffect(() => {
    if (open && messages.length === 0) {
      pushBot('Halo! Saya **KLF Chatbot**. Tanya apa saja: progres & deadline order, detail item, '
        + 'atau keuangan seperti _"berapa sisa SPK supplier A?"_ / _"berapa sisa payment invoice B?"_ '
        + '(akses keuangan mengikuti izin akunmu). Saat saya beri detail item, saya sertakan kutipan bukti. '
        + 'Bisa juga ketik "cek konsistensi <nama item>".');
    }
  }, [open]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const push = (m) => setMessages((prev) => [...prev, { id: nid(), ...m }]);
  const pushBot = (text, chips) => push({ role: 'bot', text, chips });
  const pushAnswer = (text) => push({ role: 'bot', text, feedback: true });
  const pushUser = (text) => push({ role: 'user', text });

  // ---- feedback ----
  const sendFeedback = async (m, helpful) => {
    let correction = '';
    if (!helpful) {
      correction = window.prompt('Koreksi — seharusnya apa? (disimpan ke knowledge base)') || '';
      if (!correction.trim()) return;
    }
    try {
      await fetch(`${baseUrl}/ai/feedback`, {
        method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ orderId: null, context: '', answer: m.text, helpful, correction }),
      });
      setMessages((prev) => prev.map((x) => x.id === m.id ? { ...x, feedbackDone: helpful ? '👍 makasih' : '✅ koreksi disimpan' } : x));
    } catch (e) { /* abaikan */ }
  };

  // ---- chat konsultan (multi-turn, tools, permission, bukti, usulan komentar) ----
  const askChat = async (question) => {
    setBusy(true);
    apiMsgsRef.current = [...apiMsgsRef.current, { role: 'user', content: question }];
    try {
      const res = await fetch(`${baseUrl}/ai/chat`, {
        method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ uid: getUid(), messages: apiMsgsRef.current }),
      });
      const data = await res.json();
      if (!res.ok) {
        pushBot('❌ ' + (data.message || 'Gagal menjawab'));
        apiMsgsRef.current = apiMsgsRef.current.slice(0, -1); // batalkan giliran yang gagal
        return;
      }
      apiMsgsRef.current = [...apiMsgsRef.current, { role: 'assistant', content: data.answer || '' }];
      push({
        role: 'bot', text: data.answer || '', feedback: true,
        citations: data.citations || [],
        proposals: (data.proposals || []).map((p) => ({ ...p, _status: 'pending' })),
      });
    } catch (e) { pushBot('❌ Koneksi gagal: ' + e.message); } finally { setBusy(false); }
  };

  // Resolve nama -> uid untuk tag (ambil daftar user sekali).
  const resolveTagUids = async (tagNames) => {
    if (!tagNames || !tagNames.length) return [];
    if (!usersRef.current) {
      try {
        const res = await fetch(`${baseUrl}/users/all/get`, { headers: authHeaders() });
        usersRef.current = res.ok ? await res.json() : [];
      } catch { usersRef.current = []; }
    }
    const users = usersRef.current || [];
    return tagNames.map((nm) => {
      const hit = users.find((u) => (u.name || '').toLowerCase() === String(nm).toLowerCase());
      return hit ? hit.uid : null;
    }).filter(Boolean);
  };

  // Setujui / tolak usulan komentar AI.
  const decideProposal = async (msgId, idx, approve) => {
    const msg = messages.find((m) => m.id === msgId);
    const prop = msg && msg.proposals && msg.proposals[idx];
    if (!prop) return;
    if (!approve) {
      updateProposal(msgId, idx, { _status: 'rejected' });
      return;
    }
    updateProposal(msgId, idx, { _status: 'saving' });
    try {
      const tag_uids = await resolveTagUids(prop.tag_names);
      const res = await fetch(`${baseUrl}/ai/chat/comment/confirm`, {
        method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          project_id: prop.project_id, category: prop.category, text: prop.text,
          created_by_uid: getUid(), tag_uids,
        }),
      });
      updateProposal(msgId, idx, { _status: res.ok ? 'saved' : 'error' });
    } catch { updateProposal(msgId, idx, { _status: 'error' }); }
  };

  const updateProposal = (msgId, idx, patch) => {
    setMessages((prev) => prev.map((m) => {
      if (m.id !== msgId) return m;
      const proposals = m.proposals.map((p, i) => (i === idx ? { ...p, ...patch } : p));
      return { ...m, proposals };
    }));
  };

  // ---- cek konsistensi ----
  const fetchOngoingItems = async () => {
    const res = await fetch(`${baseUrl}/ai/orders/ongoing`, { headers: authHeaders() });
    if (!res.ok) return [];
    const orders = await res.json();
    return orders.flatMap((o) => (o.items || []).map((it) => ({ project_id: it.project_id, name: it.name, kode: o.kodeInvoice })));
  };

  const runConsistency = async (projectId, name) => {
    setBusy(true);
    try {
      const res = await fetch(`${baseUrl}/ai/item/${projectId}/reconcile`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) { pushBot('❌ ' + (data.message || 'Gagal cek konsistensi')); return; }
      if (data.clear || !(data.gaps || []).length) {
        pushBot(`✅ "${name || data.item_name}" konsisten — tidak ada gap antara chat, deskripsi, & komentar terbaru.`);
      } else {
        const lines = data.gaps.map((g) => `• ${g.topic}: terbaru "${g.latest_instruction}" (${g.latest_source})\n   🏭 sekarang: ${g.current_in_production || '-'}\n   💡 ${g.suggestion || '-'}`);
        pushBot(`⚠️ ${data.gaps.length} gap pada "${name || data.item_name}":\n${lines.join('\n')}`);
      }
    } catch (e) { pushBot('❌ ' + e.message); } finally { setBusy(false); }
  };

  const startConsistency = async (target) => {
    setBusy(true);
    try {
      const items = await fetchOngoingItems();
      if (!items.length) { pushBot('Tidak ada item ongoing untuk dicek.'); return; }
      const t = (target || '').trim().toLowerCase();
      const matches = t ? items.filter((i) => (i.name || '').toLowerCase().includes(t)) : items;
      if (matches.length === 1) { runConsistency(matches[0].project_id, matches[0].name); return; }
      const list = (matches.length ? matches : items).slice(0, 12);
      pushBot(matches.length ? 'Pilih item yang mau dicek:' : 'Item tidak ketemu. Pilih dari daftar:',
        list.map((i) => ({ label: `${i.name} (${i.kode})`, onClick: () => { pushUser(i.name); runConsistency(i.project_id, i.name); } })));
    } catch (e) { pushBot('❌ ' + e.message); } finally { setBusy(false); }
  };

  // ---- input handler ----
  const handleSend = () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    pushUser(text);

    const consistency = text.match(/(?:cek\s*konsisten\w*|cek\s*gap|konsistensi)\s*(.*)/i);
    if (consistency) { startConsistency(consistency[1]); return; }
    askChat(text);
  };

  // ---- styles ----
  const accent = '#0d6efd';
  const panelBg = isLight ? '#ffffff' : '#1c1c1c';
  const textColor = isLight ? '#000' : '#eee';
  const chipStyle = { background: 'transparent', border: `1px solid ${accent}`, color: accent, borderRadius: 16, padding: '4px 12px', margin: '3px 4px 0 0', cursor: 'pointer', fontSize: 13 };
  const inputStyle = { flex: 1, padding: '9px 12px', borderRadius: 20, border: '1px solid #999', background: isLight ? '#fff' : '#2a2a2a', color: textColor, outline: 'none', minWidth: 0 };

  // Ukuran & posisi panel: HP = hampir penuh; desktop = normal/expanded.
  const panelStyle = isMobile
    ? { left: 10, right: 10, bottom: 84, top: 12, width: 'auto', height: 'auto' }
    : { right: 24, bottom: 92, width: expanded ? 'min(900px, 94vw)' : 420, height: expanded ? 'min(760px, 86vh)' : 560 };

  // Markdown renderer (tabel rapi + scroll horizontal kalau lebar).
  const mdComponents = {
    table: (p) => <div style={{ overflowX: 'auto', margin: '6px 0' }}><table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }} {...p} /></div>,
    th: (p) => <th style={{ border: `1px solid ${isLight ? '#aaa' : '#555'}`, padding: '4px 7px', textAlign: 'left', background: isLight ? '#e9ecef' : '#333', whiteSpace: 'nowrap' }} {...p} />,
    td: (p) => <td style={{ border: `1px solid ${isLight ? '#ccc' : '#444'}`, padding: '4px 7px', verticalAlign: 'top' }} {...p} />,
    p: (p) => <p style={{ margin: '4px 0' }} {...p} />,
    ul: (p) => <ul style={{ margin: '4px 0', paddingLeft: 18 }} {...p} />,
    ol: (p) => <ol style={{ margin: '4px 0', paddingLeft: 18 }} {...p} />,
    li: (p) => <li style={{ margin: '2px 0' }} {...p} />,
    h1: (p) => <div style={{ fontWeight: 700, fontSize: 15, margin: '6px 0' }} {...p} />,
    h2: (p) => <div style={{ fontWeight: 700, fontSize: 14, margin: '6px 0' }} {...p} />,
    h3: (p) => <div style={{ fontWeight: 700, fontSize: 13, margin: '4px 0' }} {...p} />,
    code: (p) => <code style={{ background: isLight ? '#eee' : '#333', padding: '1px 4px', borderRadius: 3 }} {...p} />,
    a: (p) => <a style={{ color: accent }} {...p} />,
  };

  return (
    <>
      <button onClick={() => setOpen((o) => !o)} title="AI Assistant" style={{
        position: 'fixed', bottom: 24, right: 24, width: 56, height: 56, borderRadius: '50%',
        background: accent, color: '#fff', border: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
        cursor: 'pointer', zIndex: 1050, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {open ? <BsXLg /> : <BsChatDotsFill />}
      </button>

      {open && (
        <div style={{
          position: 'fixed', ...panelStyle,
          background: panelBg, color: textColor, borderRadius: 14, boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
          display: 'flex', flexDirection: 'column', zIndex: 1050, overflow: 'hidden', border: isLight ? '1px solid #ddd' : '1px solid #333',
        }}>
          <div style={{ background: accent, color: '#fff', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700 }}>🤖 AI Assistant</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {!isMobile && (
                <button onClick={() => setExpanded((e) => !e)} title={expanded ? 'Perkecil' : 'Perbesar'}
                  style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 15, display: 'flex' }}>
                  {expanded ? <BsArrowsAngleContract /> : <BsArrowsAngleExpand />}
                </button>
              )}
              <button onClick={() => setOpen(false)} title="Tutup"
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 15, display: 'flex' }}>
                <BsXLg />
              </button>
            </div>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {messages.map((m) => (
              <div key={m.id} style={{ marginBottom: 10, textAlign: m.role === 'user' ? 'right' : 'left' }}>
                <div style={{
                  display: 'inline-block', maxWidth: m.role === 'user' ? '85%' : '96%', padding: '8px 12px', borderRadius: 12,
                  whiteSpace: m.role === 'user' ? 'pre-wrap' : 'normal', textAlign: 'left', overflowWrap: 'anywhere',
                  background: m.role === 'user' ? accent : (isLight ? '#f1f3f5' : '#2a2a2a'),
                  color: m.role === 'user' ? '#fff' : textColor, fontSize: 14,
                }}>
                  {m.role === 'user'
                    ? m.text
                    : <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{m.text}</ReactMarkdown>}
                </div>
                {m.chips && (
                  <div style={{ marginTop: 4 }}>
                    {m.chips.map((c, i) => <button key={i} onClick={c.onClick} disabled={busy} style={chipStyle}>{c.label}</button>)}
                  </div>
                )}
                {m.citations && m.citations.length > 0 && (
                  <div style={{ marginTop: 6, fontSize: 12, padding: '6px 10px', borderRadius: 8, background: isLight ? '#f8f9fa' : '#222', border: isLight ? '1px solid #e3e3e3' : '1px solid #333' }}>
                    <div style={{ fontWeight: 700, marginBottom: 3, opacity: 0.8 }}>🔎 Bukti</div>
                    {m.citations.map((c, i) => (
                      <div key={i} style={{ marginBottom: 3 }}>
                        {c.verified
                          ? <span style={{ color: '#198754' }}>✓ </span>
                          : <span style={{ color: '#fd7e14' }} title="Kutipan tidak ditemukan di sumber — verifikasi manual">⚠ </span>}
                        <span style={{ fontStyle: 'italic' }}>"{c.quote}"</span>
                        {c.verified && c.source_label && <span style={{ opacity: 0.6 }}> — {c.source_label}</span>}
                      </div>
                    ))}
                  </div>
                )}
                {m.proposals && m.proposals.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    {m.proposals.map((p, i) => (
                      <div key={i} style={{ fontSize: 13, padding: '8px 10px', marginBottom: 6, borderRadius: 8, background: isLight ? '#fff8e1' : '#2a2620', border: '1px solid #f0c000' }}>
                        <div style={{ fontWeight: 700, marginBottom: 2 }}>📝 Usulan komentar → {p.category}</div>
                        <div style={{ whiteSpace: 'pre-wrap', marginBottom: 4 }}>{p.text}</div>
                        {p.tag_names && p.tag_names.length > 0 && (
                          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Tag: {p.tag_names.join(', ')}</div>
                        )}
                        {p._status === 'pending' && (
                          <div>
                            <button onClick={() => decideProposal(m.id, i, true)} style={{ ...chipStyle, border: '1px solid #198754', color: '#198754' }}>✓ Setujui & simpan</button>
                            <button onClick={() => decideProposal(m.id, i, false)} style={{ ...chipStyle, border: '1px solid #dc3545', color: '#dc3545' }}>✕ Tolak</button>
                          </div>
                        )}
                        {p._status === 'saving' && <span style={{ opacity: 0.7 }}>Menyimpan…</span>}
                        {p._status === 'saved' && <span style={{ color: '#198754' }}>✅ Tersimpan sebagai komentar "AI Chatbot"</span>}
                        {p._status === 'rejected' && <span style={{ opacity: 0.6 }}>Ditolak</span>}
                        {p._status === 'error' && <span style={{ color: '#dc3545' }}>❌ Gagal menyimpan</span>}
                      </div>
                    ))}
                  </div>
                )}
                {m.feedback && (
                  <div style={{ marginTop: 4, fontSize: 12 }}>
                    {m.feedbackDone ? <span style={{ opacity: 0.7 }}>{m.feedbackDone}</span> : (
                      <>
                        <button onClick={() => sendFeedback(m, true)} style={{ ...chipStyle, border: '1px solid #198754', color: '#198754' }}>👍</button>
                        <button onClick={() => sendFeedback(m, false)} style={{ ...chipStyle, border: '1px solid #dc3545', color: '#dc3545' }}>👎</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
            {busy && <div style={{ fontSize: 12, opacity: 0.6 }}>AI sedang memproses…</div>}
          </div>

          <div style={{ display: 'flex', gap: 8, padding: 10, borderTop: isLight ? '1px solid #eee' : '1px solid #333' }}>
            <input
              value={input} placeholder="Tanya apa saja…"
              onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              style={inputStyle}
            />
            <button onClick={handleSend} disabled={busy} style={{ background: accent, color: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BsSend />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatBubble;
