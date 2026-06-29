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
import { BsChatDotsFill, BsXLg, BsSend, BsArrowsAngleExpand, BsArrowsAngleContract, BsPaperclip, BsCameraFill } from 'react-icons/bs';

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
  const taRef = useRef(null); // textarea input (auto-grow)
  const fileRef = useRef(null); // input file tersembunyi (upload chat WA)
  const imgRef = useRef(null);  // input file tersembunyi (bukti transfer/gambar)
  const apiMsgsRef = useRef([]); // riwayat {role, content} untuk /ai/chat (multi-turn)
  const usersRef = useRef(null); // cache daftar user (untuk resolve tag nama -> uid)
  const paymentImgBase64Ref = useRef(null); // simpan base64 gambar bukti untuk approval
  const [waFile, setWaFile] = useState(null); // file export chat WA yang dilampirkan
  const [paymentImageFile, setPaymentImageFile] = useState(null); // bukti transfer
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

  // Auto-grow textarea (maks ~4 baris); reset saat input dikosongkan.
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 96) + 'px';
  }, [input, open]);

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

  // Kompres gambar ke max 1200px & kualitas 80% sebelum dikirim (cegah payload oversize di HP).
  const compressImage = (file) => new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX) { height = Math.round((height * MAX) / width); width = MAX; }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

  // ---- chat konsultan (multi-turn, tools, permission, bukti, usulan komentar) ----
  const askChat = async (question) => {
    setBusy(true);
    apiMsgsRef.current = [...apiMsgsRef.current, { role: 'user', content: question }];

    // Gambar bukti (kalau ada) — dikompres dulu lalu dikirim ke AI untuk dibaca.
    // Disimpan di ref untuk dipakai saat user klik Setujui.
    let imageBase64 = null;
    if (paymentImageFile) {
      try {
        imageBase64 = await compressImage(paymentImageFile) || await fileToBase64(paymentImageFile);
        paymentImgBase64Ref.current = imageBase64;
        setPaymentImageFile(null);
      } catch { /* abaikan, lanjut tanpa gambar */ }
    }

    try {
      const res = await fetch(`${baseUrl}/ai/chat`, {
        method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ uid: getUid(), messages: apiMsgsRef.current, image_base64: imageBase64 }),
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

  // Setujui / tolak usulan AI (komentar, deskripsi, atau payment).
  const decideProposal = async (msgId, idx, approve) => {
    const msg = messages.find((m) => m.id === msgId);
    const prop = msg && msg.proposals && msg.proposals[idx];
    if (!prop) return;
    if (!approve) { updateProposal(msgId, idx, { _status: 'rejected' }); return; }

    updateProposal(msgId, idx, { _status: 'saving' });
    try {
      if (prop.type === 'invoice_payment' || prop.type === 'spk_payment') {
        const res = await fetch(`${baseUrl}/ai/chat/payment/confirm`, {
          method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            type: prop.type,
            invoice_id: prop.invoice_id, kode_invoice: prop.kode_invoice,
            spk_id: prop.spk_id, kode_spk: prop.kode_spk,
            jumlah: prop.jumlah, tanggal: prop.tanggal, detail: prop.detail,
            bukti_base64: paymentImgBase64Ref.current,
            created_by_uid: getUid(),
          }),
        });
        if (res.ok) paymentImgBase64Ref.current = null;
        updateProposal(msgId, idx, { _status: res.ok ? 'saved' : 'error' });
      } else {
        const tag_uids = prop.type === 'comment' ? await resolveTagUids(prop.tag_names) : [];
        const res = await fetch(`${baseUrl}/ai/chat/write/confirm`, {
          method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            type: prop.type || 'comment',
            project_id: prop.project_id, category: prop.category, text: prop.text,
            created_by_uid: getUid(), tag_uids,
          }),
        });
        updateProposal(msgId, idx, { _status: res.ok ? 'saved' : 'error' });
      }
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

  // ---- upload chat WA ----
  const onPickFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) setWaFile(f);
    if (fileRef.current) fileRef.current.value = '';
  };

  // ---- upload gambar bukti transfer (termasuk HEIC dari iPhone) ----
  const onPickImage = async (e) => {
    let f = e.target.files && e.target.files[0];
    if (!f) return;
    // Konversi HEIC → JPEG di browser sebelum disimpan ke state.
    if (f.type === 'image/heic' || f.type === 'image/heif' || f.name.toLowerCase().endsWith('.heic') || f.name.toLowerCase().endsWith('.heif')) {
      try {
        const heic2any = (await import('heic2any')).default;
        const blob = await heic2any({ blob: f, toType: 'image/jpeg', quality: 0.85 });
        f = new File([blob], f.name.replace(/\.heic?$/i, '.jpg'), { type: 'image/jpeg' });
      } catch { /* gagal konversi → tetap kirim aslinya, biar server yang handle */ }
    }
    setPaymentImageFile(f);
    if (imgRef.current) imgRef.current.value = '';
  };

  // Proses file WA yang terlampir ke satu invoice.
  const uploadToInvoice = async (invoiceId, label) => {
    if (!waFile) return;
    setBusy(true);
    pushBot(`⏳ Memproses chat WA untuk ${label}…`);
    try {
      const fd = new FormData();
      fd.append('chat', waFile);
      const res = await fetch(`${baseUrl}/ai/order/${invoiceId}/upload-chat`, { method: 'POST', headers: authHeaders(), body: fd });
      const data = await res.json();
      if (!res.ok) { pushBot('❌ ' + (data.message || 'Gagal memproses chat')); return; }
      const amb = (data.ambiguous || []).length;
      pushBot(`✅ ${data.processed_messages} pesan diproses untuk **${label}**.`
        + (amb ? ` ⚠️ ${amb} hal perlu konfirmasi item — buka panel Order Assistant di invoice tsb.` : '')
        + ' Kamu bisa tanya detailnya sekarang.');
      setWaFile(null);
    } catch (e) { pushBot('❌ ' + e.message); } finally { setBusy(false); }
  };

  // Cari order yang cocok dari instruksi user, lalu upload (atau minta pilih kalau >1).
  const resolveAndUpload = async (text) => {
    try {
      const res = await fetch(`${baseUrl}/ai/orders/ongoing`, { headers: authHeaders() });
      const list = res.ok ? await res.json() : [];
      const toks = text.toLowerCase().split(/\s+/).filter(Boolean);
      const score = (o) => {
        const hay = `${o.customer || ''} ${o.kodeInvoice || ''} ${(o.items || []).map((i) => i.name).join(' ')}`.toLowerCase();
        return toks.filter((t) => hay.includes(t)).length;
      };
      let matches = toks.length
        ? list.map((o) => ({ o, s: score(o) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).map((x) => x.o)
        : list;
      if (!matches.length) {
        pushBot('Order tidak ketemu dari instruksi itu. Sebutkan **nama customer / kode invoice / nama item** dari order yang sedang berjalan. (File WA masih terlampir.)');
        return;
      }
      if (matches.length === 1) {
        uploadToInvoice(matches[0].invoice_id, `${matches[0].kodeInvoice} (${matches[0].customer || '-'})`);
        return;
      }
      pushBot('Untuk order yang mana chat ini diproses?', matches.slice(0, 8).map((o) => ({
        label: `${o.kodeInvoice} — ${o.customer || '-'}`,
        onClick: () => { pushUser(`${o.kodeInvoice} — ${o.customer || '-'}`); uploadToInvoice(o.invoice_id, `${o.kodeInvoice} (${o.customer || '-'})`); },
      })));
    } catch (e) { pushBot('❌ ' + e.message); }
  };

  // ---- input handler ----
  const handleSend = () => {
    if (busy) return;
    const text = input.trim();

    // Ada file WA terlampir -> proses upload pakai instruksi user.
    if (waFile) {
      setInput('');
      if (text) pushUser(text);
      resolveAndUpload(text);
      return;
    }

    if (!text && !paymentImageFile) return;
    if (!text) { pushBot('Tulis instruksi bersama gambar bukti tersebut (mis. "update payment invoice Budi").'); return; }
    setInput('');
    pushUser(text + (paymentImageFile ? ' 📎 [bukti transfer]' : ''));

    const consistency = text.match(/(?:cek\s*konsisten\w*|cek\s*gap|konsistensi)\s*(.*)/i);
    if (consistency) { startConsistency(consistency[1]); return; }
    askChat(text);
  };

  // ---- styles ----
  const accent = '#0d6efd';
  const panelBg = isLight ? '#ffffff' : '#1c1c1c';
  const textColor = isLight ? '#000' : '#eee';
  const chipStyle = { background: 'transparent', border: `1px solid ${accent}`, color: accent, borderRadius: 16, padding: '4px 12px', margin: '3px 4px 0 0', cursor: 'pointer', fontSize: 13 };
  // fontSize 16 wajib: iOS Safari auto-zoom saat fokus input ber-font < 16px.
  const inputStyle = { flex: 1, padding: '9px 12px', borderRadius: 18, border: '1px solid #999', background: isLight ? '#fff' : '#2a2a2a', color: textColor, outline: 'none', minWidth: 0, resize: 'none', lineHeight: '20px', maxHeight: 96, overflowY: 'auto', fontFamily: 'inherit', fontSize: 16, boxSizing: 'border-box' };

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
                    {m.proposals.map((p, i) => {
                      const isPayment = p.type === 'invoice_payment' || p.type === 'spk_payment';
                      const formatRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
                      return (
                        <div key={i} style={{ fontSize: 13, padding: '8px 10px', marginBottom: 6, borderRadius: 8,
                          background: isPayment ? (isLight ? '#fff3cd' : '#2a2108') : (isLight ? '#fff8e1' : '#2a2620'),
                          border: isPayment ? '2px solid #ffc107' : '1px solid #f0c000' }}>
                          {isPayment ? (
                            <>
                              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                                {p.type === 'invoice_payment' ? '💳 Catat Payment Customer' : '💳 Catat Payment ke Supplier'}
                              </div>
                              <div><b>{p.type === 'invoice_payment' ? p.kode_invoice : p.kode_spk}</b>
                                {' '}<span style={{ opacity: 0.7 }}>({p.type === 'invoice_payment' ? p.customer : p.pengrajin})</span>
                              </div>
                              <div>Nominal: <b>{formatRp(p.jumlah)}</b></div>
                              <div>Tanggal: {p.tanggal}</div>
                              {p.detail && <div>Ket: {p.detail}</div>}
                              <div style={{ marginTop: 4, padding: '4px 8px', borderRadius: 6, background: isLight ? '#fff9e6' : '#1a1500', fontSize: 12 }}>
                                Sisa sebelum: {formatRp(p.sisa_sekarang)} → <b>Sisa sesudah: {formatRp(Math.max(0, p.sisa_sekarang - p.jumlah))}</b>
                              </div>
                            </>
                          ) : (
                            <>
                              <div style={{ fontWeight: 700, marginBottom: 2 }}>
                                {p.type === 'category_description' ? `📝 Tambah deskripsi → ${p.category}`
                                  : p.type === 'product_description' ? '📝 Tambah deskripsi produk'
                                  : `📝 Usulan komentar → ${p.category}`}
                              </div>
                              <div style={{ whiteSpace: 'pre-wrap', marginBottom: 4 }}>{p.text}</div>
                              {p.tag_names && p.tag_names.length > 0 && (
                                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Tag: {p.tag_names.join(', ')}</div>
                              )}
                            </>
                          )}
                          {p._status === 'pending' && (
                            <div style={{ marginTop: 6 }}>
                              <button onClick={() => decideProposal(m.id, i, true)} style={{ ...chipStyle, border: '1px solid #198754', color: '#198754' }}>✓ Setujui & simpan</button>
                              <button onClick={() => decideProposal(m.id, i, false)} style={{ ...chipStyle, border: '1px solid #dc3545', color: '#dc3545' }}>✕ Tolak</button>
                            </div>
                          )}
                          {p._status === 'saving' && <span style={{ opacity: 0.7 }}>Menyimpan…</span>}
                          {p._status === 'saved' && <span style={{ color: '#198754' }}>✅ {isPayment ? 'Payment berhasil dicatat' : 'Tersimpan oleh "AI Chatbot"'}</span>}
                          {p._status === 'rejected' && <span style={{ opacity: 0.6 }}>Ditolak</span>}
                          {p._status === 'error' && <span style={{ color: '#dc3545' }}>❌ Gagal menyimpan</span>}
                        </div>
                      );
                    })}
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

          {/* Chip file WA terlampir */}
          {waFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px 0', fontSize: 13 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: isLight ? '#e7f1ff' : '#22303f', color: accent, borderRadius: 14, padding: '3px 10px', maxWidth: '100%' }}>
                <BsPaperclip />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{waFile.name}</span>
                <button onClick={() => setWaFile(null)} title="Hapus lampiran" style={{ background: 'transparent', border: 'none', color: accent, cursor: 'pointer', display: 'flex', padding: 0 }}><BsXLg size={11} /></button>
              </span>
              <span style={{ opacity: 0.6, fontSize: 12 }}>Sebutkan customer/kode/item, lalu kirim untuk proses.</span>
            </div>
          )}

          {/* Chip gambar bukti transfer */}
          {paymentImageFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px 0', fontSize: 13 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: isLight ? '#fff3cd' : '#2a2108', color: '#856404', borderRadius: 14, padding: '3px 10px', maxWidth: '100%' }}>
                <BsCameraFill size={12} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{paymentImageFile.name}</span>
                <button onClick={() => { setPaymentImageFile(null); paymentImgBase64Ref.current = null; }} title="Hapus gambar" style={{ background: 'transparent', border: 'none', color: '#856404', cursor: 'pointer', display: 'flex', padding: 0 }}><BsXLg size={11} /></button>
              </span>
              <span style={{ opacity: 0.6, fontSize: 12 }}>Bukti transfer — tulis instruksi & kirim.</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, padding: 10, borderTop: isLight ? '1px solid #eee' : '1px solid #333', alignItems: 'flex-end' }}>
            <input ref={fileRef} type="file" accept=".txt,.zip" onChange={onPickFile} style={{ display: 'none' }} />
            <input ref={imgRef} type="file" accept="image/*,.heic,.heif" onChange={onPickImage} style={{ display: 'none' }} />
            <button onClick={() => fileRef.current && fileRef.current.click()} disabled={busy} title="Lampirkan export chat WhatsApp (.txt/.zip)"
              style={{ background: 'transparent', color: accent, border: `1px solid ${accent}`, borderRadius: '50%', width: 40, height: 40, minWidth: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BsPaperclip />
            </button>
            <button onClick={() => imgRef.current && imgRef.current.click()} disabled={busy} title="Lampirkan bukti transfer (gambar)"
              style={{ background: 'transparent', color: '#856404', border: '1px solid #ffc107', borderRadius: '50%', width: 40, height: 40, minWidth: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BsCameraFill />
            </button>
            <textarea
              ref={taRef} value={input} rows={1}
              placeholder={isMobile ? 'Tulis pesan…  (pakai tombol kirim →)' : 'Tanya apa saja…  (Enter kirim, Shift+Enter baris baru)'}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                // Mobile: Enter = baris baru (kirim hanya lewat tombol). Desktop: Enter = kirim.
                if (e.key === 'Enter' && !e.shiftKey && !isMobile) { e.preventDefault(); handleSend(); }
              }}
              style={inputStyle}
            />
            <button onClick={handleSend} disabled={busy} style={{ background: accent, color: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, minWidth: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BsSend />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatBubble;
