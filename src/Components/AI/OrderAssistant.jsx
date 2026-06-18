// Components/AI/OrderAssistant.jsx
// Panel KLF AI Order Assistant — dipasang di detail invoice (Pekerjaan/Invoice.jsx).
// PHASE 2: render per-item + blok konfirmasi atribusi (ambiguous).
// CATATAN: terpisah dari AI.jsx (fitur komentar project) di folder yang sama.
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useTheme } from '../../ThemeContext';

const KATEGORI = ['Stainless', 'Besi', 'Kayu', 'Jok', 'Rotan', 'Finishing', 'Marmer', 'Fiber', 'Veneer'];
const STATUS_BERES = ['Selesai', 'QC Pass'];

const ORDER_LABELS = {
  customer_name: 'Nama Customer', delivery_location: 'Lokasi Kirim', floor_access: 'Akses Lantai',
  budget: 'Budget', agreed_price: 'Harga Deal', payment_terms: 'Termin Bayar', lead_time_promised: 'Lead Time',
};
const ITEM_LABELS = { dimensions: 'Dimensi', material: 'Material', color_finish: 'Warna/Finishing', quantity: 'Qty' };

const aiKey = import.meta.env.VITE_KLF_AI_KEY || '';
const authHeaders = (extra = {}) => ({ ...(aiKey ? { 'X-KLF-Key': aiKey } : {}), ...extra });

const OrderAssistant = ({ invoiceId, kodeInvoice, projects = [], invoice = {} }) => {
  const baseUrl = getApiBaseUrl();
  const { globalTheme } = useTheme();
  const isLight = globalTheme === 'light';

  const [requests, setRequests] = useState(invoice.ai_extracted_requests || {});
  const [flags, setFlags] = useState(invoice.critical_flags || []);
  const [history, setHistory] = useState(invoice.chat_history_summary || []);

  const [file, setFile] = useState(null);
  const [startDate, setStartDate] = useState(invoice.tanggalMulaiInvoice || '');
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [answerCandidates, setAnswerCandidates] = useState([]); // need_item
  const [asking, setAsking] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [correction, setCorrection] = useState('');

  const [gate, setGate] = useState(null);
  const [gateLoading, setGateLoading] = useState(false);

  useEffect(() => {
    setRequests(invoice.ai_extracted_requests || {});
    setFlags(invoice.critical_flags || []);
    setHistory(invoice.chat_history_summary || []);
  }, [invoiceId]);

  const ambiguous = requests.ambiguous || [];
  const items = requests.items || [];
  // Bentuk lama (flat) -> tampung agar tidak hilang.
  const legacyRequests = !items.length && Array.isArray(requests.special_requests) ? requests.special_requests : [];

  const allCategoriesDone = useMemo(() => {
    if (!projects || projects.length === 0) return false;
    return projects.every((p) => KATEGORI.filter((c) => p[`CategoryStatus${c}`]).every((c) => STATUS_BERES.includes(p[`CategoryStatus${c}`])))
      && projects.some((p) => KATEGORI.some((c) => p[`CategoryStatus${c}`]));
  }, [projects]);

  const runPreshipmentCheck = useCallback(async () => {
    setGateLoading(true);
    try {
      const res = await fetch(`${baseUrl}/ai/order/${invoiceId}/preshipment-check`, { headers: authHeaders() });
      const data = await res.json();
      setGate(res.ok ? data : { clear: false, issues: [data.message || 'Gagal cek'], unacknowledgedFlags: [] });
    } catch (err) {
      setGate({ clear: false, issues: ['Koneksi gagal: ' + err.message], unacknowledgedFlags: [] });
    } finally { setGateLoading(false); }
  }, [baseUrl, invoiceId]);

  useEffect(() => { if (allCategoriesDone && invoiceId) runPreshipmentCheck(); }, [allCategoriesDone, invoiceId, runPreshipmentCheck]);

  const applyResponse = (data) => {
    if (data.ai_extracted_requests) setRequests(data.ai_extracted_requests);
    if (data.critical_flags) setFlags(data.critical_flags);
    if (data.chat_history_summary) setHistory(data.chat_history_summary);
  };

  const handleUpload = async () => {
    if (!file) { setMsg('Pilih file chat (.txt / .zip) dulu.'); return; }
    setUploading(true); setMsg('');
    try {
      const fd = new FormData();
      fd.append('chat', file);
      if (startDate) fd.append('startDate', startDate);
      const res = await fetch(`${baseUrl}/ai/order/${invoiceId}/upload-chat`, { method: 'POST', headers: authHeaders(), body: fd });
      const data = await res.json();
      if (res.ok) {
        applyResponse(data);
        setMsg(`✅ ${data.processed_messages} pesan diproses & ditambahkan.`);
        setFile(null);
        if (allCategoriesDone) runPreshipmentCheck();
      } else setMsg('❌ ' + (data.message || 'Gagal memproses chat'));
    } catch (err) { setMsg('❌ Koneksi gagal: ' + err.message); } finally { setUploading(false); }
  };

  const confirmAttribution = async (amb, itemName) => {
    try {
      const res = await fetch(`${baseUrl}/ai/order/${invoiceId}/attribute`, {
        method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ text: amb.text, type: amb.type, item_name: itemName }),
      });
      const data = await res.json();
      if (res.ok) { applyResponse(data); if (allCategoriesDone) runPreshipmentCheck(); }
    } catch (err) { /* abaikan */ }
  };

  const askWith = async (q, itemId) => {
    setAsking(true); setAnswer(''); setAnswerCandidates([]); setFeedbackOpen(false); setCorrection('');
    try {
      const res = await fetch(`${baseUrl}/ai/order/${invoiceId}/ask`, {
        method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ question: q, itemId: itemId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setAnswer('❌ ' + (data.message || 'Gagal menjawab')); return; }
      if (data.type === 'need_item') {
        setAnswer(data.message || 'Item yang mana yang kamu maksud?');
        setAnswerCandidates(data.candidates || []);
      } else setAnswer(data.answer);
    } catch (err) { setAnswer('❌ Koneksi gagal: ' + err.message); } finally { setAsking(false); }
  };

  const handleAsk = () => { if (question.trim()) askWith(question); };
  const pickCandidate = (name) => {
    const p = projects.find((pr) => (pr.NamaBarang || '') === name);
    askWith(question, p ? p.id : undefined);
  };

  const acknowledgeFlag = async (flagText) => {
    try {
      const res = await fetch(`${baseUrl}/ai/order/${invoiceId}/flags/acknowledge`, {
        method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ flagText }),
      });
      const data = await res.json();
      if (res.ok) { setFlags(data.critical_flags || []); if (allCategoriesDone) runPreshipmentCheck(); }
    } catch (err) { /* abaikan */ }
  };

  const sendFeedback = async (helpful) => {
    if (helpful) { await postFeedback({ helpful: true }); setMsg('👍 Terima kasih atas feedback-nya.'); return; }
    setFeedbackOpen(true);
  };
  const postFeedback = async (extra) => {
    try {
      await fetch(`${baseUrl}/ai/feedback`, {
        method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ orderId: invoiceId, answer, ...extra }),
      });
    } catch (err) { /* abaikan */ }
  };
  const submitCorrection = async () => {
    if (!correction.trim()) return;
    await postFeedback({ helpful: false, correction });
    setFeedbackOpen(false); setCorrection('');
    setMsg('✅ Koreksi disimpan ke knowledge base. AI akan pakai ini ke depan.');
  };

  // ---- styles ----
  const cardBg = isLight ? 'linear-gradient(to right, #ffffff, #e7e7e7)' : 'linear-gradient(to right, #151515, #303030)';
  const border = isLight ? '2px solid rgb(163, 163, 163)' : '2px solid #7a7a7a';
  const textColor = isLight ? '#000' : '#fff';
  const inputStyle = { width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #999', background: isLight ? '#fff' : '#222', color: textColor };
  const btn = { padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', color: '#fff', background: '#0d6efd' };
  const chip = { background: 'transparent', border: '1px solid #0d6efd', color: '#0d6efd', borderRadius: 16, padding: '3px 10px', margin: '4px 4px 0 0', cursor: 'pointer', fontSize: 13 };

  const unackFlags = flags.filter((f) => !f.acknowledged);
  const orderFieldsFilled = Object.keys(ORDER_LABELS).some((k) => requests[k]);
  const hasAnything = orderFieldsFilled || items.length || legacyRequests.length || flags.length;

  return (
    <div className="mt-4" style={{ color: textColor }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <h4 style={{ margin: 0, color: textColor }}>🤖 AI Order Assistant</h4>
        {unackFlags.length > 0 && (
          <span style={{ background: '#dc3545', color: '#fff', borderRadius: 12, padding: '2px 10px', fontSize: 13, fontWeight: 600 }}>⚠ {unackFlags.length} Critical Flag</span>
        )}
      </div>

      <div className="shadow p-3" style={{ backgroundImage: cardBg, border, borderRadius: 8 }}>
        {/* Pre-shipment gate */}
        {(allCategoriesDone || gate) && (
          <div style={{ marginBottom: 16, padding: 12, borderRadius: 6, background: gate?.clear ? 'rgba(25,135,84,0.15)' : 'rgba(220,53,69,0.15)', border: `1px solid ${gate?.clear ? '#198754' : '#dc3545'}` }}>
            <strong>{gateLoading ? '⏳ Mengecek kesiapan kirim...' : gate?.clear ? '✅ Clear — Order siap kirim' : '⚠️ Belum siap kirim'}</strong>
            {gate && !gate.clear && (
              <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                {(gate.unacknowledgedFlags || []).map((f, i) => <li key={`uf${i}`} style={{ color: '#dc3545' }}>Flag belum di-acknowledge{f.item_name ? ` [${f.item_name}]` : ''}: {f.text}</li>)}
                {(gate.issues || []).map((iss, i) => <li key={`is${i}`}>{iss}</li>)}
                {(gate.gaps || []).flatMap((it) => (it.gaps || []).map((g, j) => (
                  <li key={`gap${it.item_name}${j}`} style={{ color: '#fd7e14' }}>
                    Gap [{it.item_name}] {g.topic}: terbaru "{g.latest_instruction}" ({g.latest_source}) — {g.suggestion}
                  </li>
                )))}
              </ul>
            )}
          </div>
        )}

        {/* Upload Chat WA */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 600 }}>Upload Chat WhatsApp</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'end', marginTop: 6 }}>
            <input type="file" accept=".txt,.zip" onChange={(e) => setFile(e.target.files[0])} style={{ ...inputStyle, flex: '2 1 240px', width: 'auto' }} />
            <div style={{ flex: '1 1 160px' }}>
              <div style={{ fontSize: 12 }}>Tanggal mulai order</div>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
            </div>
            <button onClick={handleUpload} disabled={uploading} style={{ ...btn, opacity: uploading ? 0.6 : 1 }}>{uploading ? 'Memproses...' : 'Upload & Ekstrak'}</button>
          </div>
          {msg && <div style={{ marginTop: 6, fontSize: 14 }}>{msg}</div>}
          {history.length > 0 && <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{history.length} chat sudah diproses untuk order ini.</div>}
        </div>

        {/* Ambiguous — perlu konfirmasi item */}
        {ambiguous.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 600, color: '#fd7e14' }}>Perlu Konfirmasi (AI tidak yakin untuk item mana)</label>
            {ambiguous.map((amb, i) => (
              <div key={i} style={{ padding: '8px 10px', marginTop: 6, borderRadius: 6, background: 'rgba(253,126,20,0.12)', border: '1px solid #fd7e14' }}>
                <div>"{amb.text}" <span style={{ fontSize: 12, opacity: 0.7 }}>({amb.type === 'flag' ? 'critical flag' : 'request'})</span></div>
                <div>
                  {(amb.candidates && amb.candidates.length ? amb.candidates : projects.map((p) => p.NamaBarang)).map((name, j) => (
                    <button key={j} onClick={() => confirmAttribution(amb, name)} style={chip}>{name}</button>
                  ))}
                  <button onClick={() => confirmAttribution(amb, 'UMUM')} style={chip}>Umum</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Request Customer */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 600 }}>Request Customer</label>
          {!hasAnything ? (
            <div style={{ fontSize: 14, opacity: 0.7, marginTop: 4 }}>Belum ada hasil ekstraksi. Upload chat WA dulu.</div>
          ) : (
            <div style={{ marginTop: 6 }}>
              {/* Order-level */}
              {orderFieldsFilled && (
                <table style={{ width: '100%', fontSize: 14, marginBottom: 8 }}><tbody>
                  {Object.keys(ORDER_LABELS).map((k) => requests[k] ? (
                    <tr key={k}><td style={{ fontWeight: 600, padding: '3px 8px', verticalAlign: 'top', width: 140 }}>{ORDER_LABELS[k]}</td><td style={{ padding: '3px 8px' }}>{requests[k]}</td></tr>
                  ) : null)}
                </tbody></table>
              )}

              {/* Per item */}
              {items.map((it, i) => (
                <div key={i} style={{ padding: '8px 10px', marginBottom: 6, borderRadius: 6, background: isLight ? '#f1f3f5' : '#1c1c1c' }}>
                  <div style={{ fontWeight: 700 }}>📦 {it.item_name || `Item ${i + 1}`}</div>
                  <div style={{ fontSize: 13 }}>
                    {Object.keys(ITEM_LABELS).map((k) => it[k] ? <span key={k} style={{ marginRight: 10 }}><b>{ITEM_LABELS[k]}:</b> {it[k]}</span> : null)}
                  </div>
                  {it.special_requests && it.special_requests.length > 0 && (
                    <ul style={{ margin: '4px 0', paddingLeft: 18 }}>{it.special_requests.map((s, j) => <li key={j}>{s}</li>)}</ul>
                  )}
                  {it.critical_flags && it.critical_flags.length > 0 && (
                    <ul style={{ margin: '4px 0', paddingLeft: 18, color: '#dc3545' }}>{it.critical_flags.map((s, j) => <li key={j}>⚠ {s}</li>)}</ul>
                  )}
                </div>
              ))}

              {/* Legacy flat (data lama) */}
              {legacyRequests.length > 0 && (
                <div><div style={{ fontWeight: 600 }}>Permintaan Khusus:</div><ul style={{ margin: '4px 0', paddingLeft: 20 }}>{legacyRequests.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
              )}
            </div>
          )}
        </div>

        {/* Critical flags (ack-able) */}
        {flags.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 600, color: '#dc3545' }}>Critical Flags</label>
            {flags.map((f, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '6px 10px', marginTop: 4, borderRadius: 6, background: f.acknowledged ? 'rgba(108,117,125,0.15)' : 'rgba(220,53,69,0.15)', border: `1px solid ${f.acknowledged ? '#6c757d' : '#dc3545'}` }}>
                <span style={{ textDecoration: f.acknowledged ? 'line-through' : 'none' }}>{f.acknowledged ? '✔ ' : '⚠ '}{f.item_name ? `[${f.item_name}] ` : ''}{f.text}</span>
                {!f.acknowledged && <button onClick={() => acknowledgeFlag(f.text)} style={{ ...btn, background: '#6c757d', padding: '4px 10px', fontSize: 13 }}>Acknowledge</button>}
              </div>
            ))}
          </div>
        )}

        {/* Tanya AI */}
        <div>
          <label style={{ fontWeight: 600 }}>Tanya AI tentang order ini</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <input type="text" value={question} placeholder="mis. Sofa-nya perlu akses lift nggak?" onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAsk()} style={inputStyle} />
            <button onClick={handleAsk} disabled={asking} style={{ ...btn, opacity: asking ? 0.6 : 1 }}>{asking ? '...' : 'Tanya'}</button>
          </div>
          {answer && (
            <div style={{ marginTop: 8, padding: 10, borderRadius: 6, background: isLight ? '#f1f3f5' : '#1c1c1c', whiteSpace: 'pre-wrap' }}>
              {answer}
              {/* need_item -> tombol kandidat */}
              {answerCandidates.length > 0 && (
                <div style={{ marginTop: 6 }}>{answerCandidates.map((name, i) => <button key={i} onClick={() => pickCandidate(name)} style={chip}>{name}</button>)}</div>
              )}
              {answerCandidates.length === 0 && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={() => sendFeedback(true)} style={{ ...btn, background: '#198754', padding: '4px 10px' }}>👍</button>
                  <button onClick={() => sendFeedback(false)} style={{ ...btn, background: '#dc3545', padding: '4px 10px' }}>👎</button>
                </div>
              )}
              {feedbackOpen && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 13, marginBottom: 4 }}>Seharusnya apa? (akan disimpan ke knowledge base)</div>
                  <textarea value={correction} onChange={(e) => setCorrection(e.target.value)} rows={2} style={inputStyle} />
                  <button onClick={submitCorrection} style={{ ...btn, marginTop: 6 }}>Simpan Koreksi</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderAssistant;
