// Components/AI/AIChatBubble.jsx
// Bubble asisten AI mengambang di halaman Operations -> Project (/project).
// Asisten UMUM: tanya apa saja soal order berjalan (progress, deadline, To Do, yang perlu dikerjakan,
// cari lintas order, detail item). Plus "cek konsistensi <item>". Diproteksi shared secret X-KLF-Key.
// Catatan: upload chat WA dilakukan lewat panel invoice (OrderAssistant), bukan dari bubble.
import React, { useState, useRef, useEffect } from 'react';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useTheme } from '../../ThemeContext';
import { BsChatDotsFill, BsXLg, BsSend } from 'react-icons/bs';

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
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      pushBot('Halo! Saya asisten AI KLF. Tanya apa saja soal order yang sedang berjalan — progres, deadline, '
        + 'yang perlu dikerjakan segera, To Do yang belum selesai, atau detail/pencarian item. '
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

  // ---- asisten umum ----
  const askGeneral = async (question) => {
    setBusy(true);
    try {
      const res = await fetch(`${baseUrl}/ai/assistant/ask`, {
        method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ question, user_uid: getUid() }),
      });
      const data = await res.json();
      if (res.ok) pushAnswer(data.answer);
      else pushBot('❌ ' + (data.message || 'Gagal menjawab'));
    } catch (e) { pushBot('❌ Koneksi gagal: ' + e.message); } finally { setBusy(false); }
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
    askGeneral(text);
  };

  // ---- styles ----
  const accent = '#0d6efd';
  const panelBg = isLight ? '#ffffff' : '#1c1c1c';
  const textColor = isLight ? '#000' : '#eee';
  const chipStyle = { background: 'transparent', border: `1px solid ${accent}`, color: accent, borderRadius: 16, padding: '4px 12px', margin: '3px 4px 0 0', cursor: 'pointer', fontSize: 13 };
  const inputStyle = { flex: 1, padding: '9px 12px', borderRadius: 20, border: '1px solid #999', background: isLight ? '#fff' : '#2a2a2a', color: textColor, outline: 'none' };

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
          position: 'fixed', bottom: 92, right: 24, width: 'min(380px, 92vw)', height: 'min(540px, 75vh)',
          background: panelBg, color: textColor, borderRadius: 14, boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
          display: 'flex', flexDirection: 'column', zIndex: 1050, overflow: 'hidden', border: isLight ? '1px solid #ddd' : '1px solid #333',
        }}>
          <div style={{ background: accent, color: '#fff', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700 }}>🤖 AI Assistant</div>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {messages.map((m) => (
              <div key={m.id} style={{ marginBottom: 10, textAlign: m.role === 'user' ? 'right' : 'left' }}>
                <div style={{
                  display: 'inline-block', maxWidth: '85%', padding: '8px 12px', borderRadius: 12, whiteSpace: 'pre-wrap', textAlign: 'left',
                  background: m.role === 'user' ? accent : (isLight ? '#f1f3f5' : '#2a2a2a'),
                  color: m.role === 'user' ? '#fff' : textColor, fontSize: 14,
                }}>{m.text}</div>
                {m.chips && (
                  <div style={{ marginTop: 4 }}>
                    {m.chips.map((c, i) => <button key={i} onClick={c.onClick} disabled={busy} style={chipStyle}>{c.label}</button>)}
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
