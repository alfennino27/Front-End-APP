// Components/AI/AIChatBubble.jsx
// Bubble chat AI mengambang di halaman Operations -> Project (/project).
// Bisa: (1) upload chat WA per order ("upload WA"), (2) tanya item tertentu (pilih item -> tanya;
// kalau belum pilih item, AI minta user klik item). Diproteksi shared secret X-KLF-Key.
import React, { useState, useRef, useEffect } from 'react';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useTheme } from '../../ThemeContext';
import { BsChatDotsFill, BsXLg, BsSend } from 'react-icons/bs';

const aiKey = import.meta.env.VITE_KLF_AI_KEY || '';
const authHeaders = (extra = {}) => ({ ...(aiKey ? { 'X-KLF-Key': aiKey } : {}), ...extra });

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
  // context order/item yang sedang difokuskan
  const [ctx, setCtx] = useState({ invoiceId: null, kodeInvoice: null, customer: '', items: [], itemId: null, itemName: null });
  // form upload inline
  const [uploadFor, setUploadFor] = useState(null); // { invoiceId, kodeInvoice }
  const [file, setFile] = useState(null);
  const [startDate, setStartDate] = useState('');
  const pendingQ = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      pushBot('Halo! Saya asisten AI KLF. Ketik "upload WA" untuk memproses chat WhatsApp sebuah order, atau langsung tanya soal item tertentu.');
    }
  }, [open]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, uploadFor]);

  const push = (m) => setMessages((prev) => [...prev, { id: nid(), ...m }]);
  const pushBot = (text, chips) => push({ role: 'bot', text, chips });
  const pushUser = (text) => push({ role: 'user', text });

  // ---- API ----
  const fetchOngoing = async () => {
    const res = await fetch(`${baseUrl}/ai/orders/ongoing`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Gagal ambil daftar order ongoing');
    return res.json();
  };

  // ---- Flow: upload WA ----
  const startUploadFlow = async () => {
    setBusy(true);
    try {
      const orders = await fetchOngoing();
      if (!orders.length) { pushBot('Tidak ada order dengan project Ongoing saat ini.'); return; }
      pushBot('Pilih order yang mau di-upload chat WA-nya:',
        orders.map((o) => ({ label: `${o.kodeInvoice} — ${o.customer || 'Tanpa nama'}`, onClick: () => chooseOrderForUpload(o) })));
    } catch (e) {
      pushBot('❌ ' + e.message);
    } finally { setBusy(false); }
  };

  const chooseOrderForUpload = (order) => {
    setCtx({ invoiceId: order.invoice_id, kodeInvoice: order.kodeInvoice, customer: order.customer, items: order.items || [], itemId: null, itemName: null });
    setUploadFor({ invoiceId: order.invoice_id, kodeInvoice: order.kodeInvoice });
    pushUser(`Upload untuk ${order.kodeInvoice}`);
    pushBot(`Oke, upload file chat WA (.txt / .zip) untuk ${order.kodeInvoice} dan isi tanggal mulai order di bawah.`);
  };

  const submitUpload = async () => {
    if (!file || !uploadFor) { pushBot('Pilih file dulu ya.'); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('chat', file);
      if (startDate) fd.append('startDate', startDate);
      const res = await fetch(`${baseUrl}/ai/order/${uploadFor.invoiceId}/upload-chat`, { method: 'POST', headers: authHeaders(), body: fd });
      const data = await res.json();
      if (!res.ok) { pushBot('❌ ' + (data.message || 'Gagal memproses chat')); return; }

      const ext = data.ai_extracted_requests || {};
      const lines = (ext.items || []).map((it) => {
        const reqs = [...(it.special_requests || []), ...(it.critical_flags || [])];
        return `• ${it.item_name}${reqs.length ? ': ' + reqs.join('; ') : ' (tidak ada request khusus)'}`;
      });
      pushBot(`✅ ${data.processed_messages} pesan diproses.\nHasil per item:\n${lines.join('\n') || '(tidak ada item)'}`);

      // Ambiguous -> minta konfirmasi item.
      (data.ambiguous || []).forEach((amb) => askAttribution(uploadFor.invoiceId, amb, ctx.items));
      setUploadFor(null); setFile(null);
    } catch (e) {
      pushBot('❌ Koneksi gagal: ' + e.message);
    } finally { setBusy(false); }
  };

  const askAttribution = (invoiceId, amb, items) => {
    const chips = [...items.map((it) => ({
      label: it.name,
      onClick: () => confirmAttribution(invoiceId, amb, it.name),
    })), { label: 'Umum (seluruh order)', onClick: () => confirmAttribution(invoiceId, amb, 'UMUM') }];
    pushBot(`⚠️ AI tidak yakin request ini untuk item mana:\n"${amb.text}"\nIni untuk item yang mana?`, chips);
  };

  const confirmAttribution = async (invoiceId, amb, itemName) => {
    pushUser(itemName);
    setBusy(true);
    try {
      const res = await fetch(`${baseUrl}/ai/order/${invoiceId}/attribute`, {
        method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ text: amb.text, type: amb.type, item_name: itemName }),
      });
      if (res.ok) pushBot(`✅ Tersimpan untuk "${itemName}".`);
      else pushBot('❌ Gagal menyimpan atribusi.');
    } catch (e) { pushBot('❌ ' + e.message); } finally { setBusy(false); }
  };

  // ---- Flow: tanya ----
  const doAsk = async (question) => {
    setBusy(true);
    try {
      const res = await fetch(`${baseUrl}/ai/order/${ctx.invoiceId}/ask`, {
        method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ question, itemId: ctx.itemId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { pushBot('❌ ' + (data.message || 'Gagal menjawab')); return; }

      if (data.type === 'need_item') {
        const chips = (data.candidates || ctx.items.map((i) => i.name)).map((name) => {
          const it = ctx.items.find((i) => i.name === name);
          return { label: name, onClick: () => { setCtx((c) => ({ ...c, itemId: it ? it.project_id : null, itemName: name })); pushUser(name); doAsk(question); } };
        });
        pushBot(data.message || 'Item yang mana yang kamu maksud?', chips);
      } else {
        pushBot(data.answer);
      }
    } catch (e) {
      pushBot('❌ Koneksi gagal: ' + e.message);
    } finally { setBusy(false); }
  };

  // Belum ada order context -> minta pilih order lalu item.
  const askChooseOrderThenItem = async (question) => {
    setBusy(true);
    try {
      const orders = await fetchOngoing();
      if (!orders.length) { pushBot('Tidak ada order Ongoing untuk ditanyakan.'); return; }
      pendingQ.current = question;
      pushBot('Tanya tentang order yang mana? Pilih dulu:',
        orders.map((o) => ({ label: `${o.kodeInvoice} — ${o.customer || 'Tanpa nama'}`, onClick: () => chooseOrderForAsk(o) })));
    } catch (e) { pushBot('❌ ' + e.message); } finally { setBusy(false); }
  };

  const chooseOrderForAsk = (order) => {
    pushUser(order.kodeInvoice);
    const next = { invoiceId: order.invoice_id, kodeInvoice: order.kodeInvoice, customer: order.customer, items: order.items || [], itemId: null, itemName: null };
    if ((order.items || []).length === 1) {
      next.itemId = order.items[0].project_id; next.itemName = order.items[0].name;
      setCtx(next);
      if (pendingQ.current) { const q = pendingQ.current; pendingQ.current = null; setTimeout(() => doAskWith(next, q), 0); }
    } else {
      setCtx(next);
      pushBot('Item yang mana?', (order.items || []).map((it) => ({
        label: it.name,
        onClick: () => { const c = { ...next, itemId: it.project_id, itemName: it.name }; setCtx(c); pushUser(it.name); if (pendingQ.current) { const q = pendingQ.current; pendingQ.current = null; doAskWith(c, q); } },
      })));
    }
  };

  // doAsk dgn context eksplisit (hindari stale state saat baru pilih).
  const doAskWith = async (context, question) => {
    setBusy(true);
    try {
      const res = await fetch(`${baseUrl}/ai/order/${context.invoiceId}/ask`, {
        method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ question, itemId: context.itemId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { pushBot('❌ ' + (data.message || 'Gagal menjawab')); return; }
      if (data.type === 'need_item') {
        const chips = (data.candidates || context.items.map((i) => i.name)).map((name) => {
          const it = context.items.find((i) => i.name === name);
          return { label: name, onClick: () => { const c = { ...context, itemId: it ? it.project_id : null, itemName: name }; setCtx(c); pushUser(name); doAskWith(c, question); } };
        });
        pushBot(data.message || 'Item yang mana?', chips);
      } else pushBot(data.answer);
    } catch (e) { pushBot('❌ ' + e.message); } finally { setBusy(false); }
  };

  // ---- Flow: cek konsistensi (reconcile) untuk item terpilih ----
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

  // ---- input handler ----
  const handleSend = () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    pushUser(text);

    if (/upload\s*wa|upload\s*chat/i.test(text)) { startUploadFlow(); return; }
    if (/konsisten|cek gap|rekonsiliasi|consistency/i.test(text)) {
      if (ctx.itemId) { runConsistency(ctx.itemId, ctx.itemName); return; }
      pushBot('Pilih item dulu untuk cek konsistensi. Ketik pertanyaan atau pilih order/item.');
      return;
    }
    if (ctx.invoiceId && ctx.itemId) { doAsk(text); return; }
    if (ctx.invoiceId && !ctx.itemId && ctx.items.length) {
      // sudah pilih order, belum item -> tanya langsung, server bisa minta pilih item
      doAsk(text); return;
    }
    askChooseOrderThenItem(text);
  };

  const resetContext = () => {
    setCtx({ invoiceId: null, kodeInvoice: null, customer: '', items: [], itemId: null, itemName: null });
    pushBot('Konteks order direset. Pilih order lain atau ketik "upload WA".');
  };

  // ---- styles ----
  const accent = '#0d6efd';
  const panelBg = isLight ? '#ffffff' : '#1c1c1c';
  const textColor = isLight ? '#000' : '#eee';
  const chipStyle = { background: 'transparent', border: `1px solid ${accent}`, color: accent, borderRadius: 16, padding: '4px 12px', margin: '3px 4px 0 0', cursor: 'pointer', fontSize: 13 };
  const inputStyle = { flex: 1, padding: '9px 12px', borderRadius: 20, border: '1px solid #999', background: isLight ? '#fff' : '#2a2a2a', color: textColor, outline: 'none' };

  return (
    <>
      {/* Floating button */}
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
          {/* Header */}
          <div style={{ background: accent, color: '#fff', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700 }}>🤖 AI Assistant</div>
              {ctx.kodeInvoice && <div style={{ fontSize: 11, opacity: 0.9 }}>{ctx.kodeInvoice}{ctx.itemName ? ` • ${ctx.itemName}` : ''}</div>}
            </div>
            {ctx.invoiceId && <button onClick={resetContext} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 12 }}>Reset</button>}
          </div>

          {/* Messages */}
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
              </div>
            ))}

            {/* Inline upload form */}
            {uploadFor && (
              <div style={{ padding: 10, borderRadius: 10, background: isLight ? '#f8f9fa' : '#252525', marginBottom: 10 }}>
                <input type="file" accept=".txt,.zip" onChange={(e) => setFile(e.target.files[0])} style={{ width: '100%', marginBottom: 6, color: textColor }} />
                <div style={{ fontSize: 12, marginBottom: 2 }}>Tanggal mulai order</div>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: '100%', marginBottom: 6, padding: 6, borderRadius: 6, border: '1px solid #999', background: isLight ? '#fff' : '#2a2a2a', color: textColor }} />
                <button onClick={submitUpload} disabled={busy} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', width: '100%' }}>
                  {busy ? 'Memproses...' : 'Upload & Ekstrak'}
                </button>
              </div>
            )}
            {busy && <div style={{ fontSize: 12, opacity: 0.6 }}>AI sedang memproses…</div>}
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: 8, padding: 10, borderTop: isLight ? '1px solid #eee' : '1px solid #333' }}>
            <input
              value={input} placeholder='Ketik pesan / "upload WA"…'
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
