// Components/AI/OrderAssistant.jsx
// Panel KLF AI Order Assistant — dipasang di detail invoice (Pekerjaan/Invoice.jsx).
// CATATAN: file ini terpisah dari AI.jsx (fitur komentar project) di folder yang sama.
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useTheme } from '../../ThemeContext';

const KATEGORI = ['Stainless', 'Besi', 'Kayu', 'Jok', 'Rotan', 'Finishing', 'Marmer', 'Fiber', 'Veneer'];
// Status kategori yang dianggap "beres" untuk memicu gate pre-shipment otomatis.
const STATUS_BERES = ['Selesai', 'QC Pass'];

const FIELD_LABELS = {
  customer_name: 'Nama Customer', product_type: 'Jenis Produk', dimensions: 'Dimensi',
  material: 'Material', color_finish: 'Warna / Finishing', quantity: 'Qty',
  delivery_location: 'Lokasi Kirim', floor_access: 'Akses Lantai', budget: 'Budget',
  agreed_price: 'Harga Deal', payment_terms: 'Termin Bayar', lead_time_promised: 'Lead Time',
};

// Header auth: shared secret dibaca dari env Vite.
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
  const [asking, setAsking] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [correction, setCorrection] = useState('');

  const [gate, setGate] = useState(null); // { clear, issues, unacknowledgedFlags }
  const [gateLoading, setGateLoading] = useState(false);

  // Sinkron kalau invoice prop berubah (mis. setelah refetch parent).
  useEffect(() => {
    setRequests(invoice.ai_extracted_requests || {});
    setFlags(invoice.critical_flags || []);
    setHistory(invoice.chat_history_summary || []);
  }, [invoiceId]);

  // Apakah semua kategori (yang dipakai) sudah beres? -> trigger gate otomatis.
  const allCategoriesDone = useMemo(() => {
    if (!projects || projects.length === 0) return false;
    return projects.every((p) =>
      KATEGORI.filter((c) => p[`CategoryStatus${c}`]).every((c) => STATUS_BERES.includes(p[`CategoryStatus${c}`]))
    ) && projects.some((p) => KATEGORI.some((c) => p[`CategoryStatus${c}`]));
  }, [projects]);

  const runPreshipmentCheck = useCallback(async () => {
    setGateLoading(true);
    try {
      const res = await fetch(`${baseUrl}/ai/order/${invoiceId}/preshipment-check`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setGate(data);
      else setGate({ clear: false, issues: [data.message || 'Gagal pre-shipment check'], unacknowledgedFlags: [] });
    } catch (err) {
      setGate({ clear: false, issues: ['Koneksi gagal: ' + err.message], unacknowledgedFlags: [] });
    } finally {
      setGateLoading(false);
    }
  }, [baseUrl, invoiceId]);

  // Auto-run gate ketika semua kategori beres.
  useEffect(() => {
    if (allCategoriesDone && invoiceId) runPreshipmentCheck();
  }, [allCategoriesDone, invoiceId, runPreshipmentCheck]);

  const handleUpload = async () => {
    if (!file) { setMsg('Pilih file chat (.txt / .zip) dulu.'); return; }
    setUploading(true);
    setMsg('');
    try {
      const fd = new FormData();
      fd.append('chat', file);
      if (startDate) fd.append('startDate', startDate);
      const res = await fetch(`${baseUrl}/ai/order/${invoiceId}/upload-chat`, {
        method: 'POST', headers: authHeaders(), body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        setRequests(data.ai_extracted_requests || {});
        setFlags(data.critical_flags || []);
        setHistory(data.chat_history_summary || []);
        setMsg(`✅ ${data.processed_messages} pesan diproses & ditambahkan.`);
        setFile(null);
        if (allCategoriesDone) runPreshipmentCheck();
      } else {
        setMsg('❌ ' + (data.message || 'Gagal memproses chat'));
      }
    } catch (err) {
      setMsg('❌ Koneksi gagal: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    setAsking(true);
    setAnswer('');
    setFeedbackOpen(false);
    setCorrection('');
    try {
      const res = await fetch(`${baseUrl}/ai/order/${invoiceId}/ask`, {
        method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setAnswer(res.ok ? data.answer : '❌ ' + (data.message || 'Gagal menjawab'));
    } catch (err) {
      setAnswer('❌ Koneksi gagal: ' + err.message);
    } finally {
      setAsking(false);
    }
  };

  const acknowledgeFlag = async (flagText) => {
    try {
      const res = await fetch(`${baseUrl}/ai/order/${invoiceId}/flags/acknowledge`, {
        method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ flagText }),
      });
      const data = await res.json();
      if (res.ok) {
        setFlags(data.critical_flags || []);
        if (allCategoriesDone) runPreshipmentCheck();
      }
    } catch (err) { /* abaikan */ }
  };

  const sendFeedback = async (helpful) => {
    if (helpful) {
      await postFeedback({ helpful: true });
      setMsg('👍 Terima kasih atas feedback-nya.');
      return;
    }
    setFeedbackOpen(true); // 👎 -> minta koreksi
  };

  const postFeedback = async (extra) => {
    try {
      await fetch(`${baseUrl}/ai/feedback`, {
        method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          orderId: invoiceId,
          context: requests.product_type || '',
          answer,
          ...extra,
        }),
      });
    } catch (err) { /* abaikan */ }
  };

  const submitCorrection = async () => {
    if (!correction.trim()) return;
    await postFeedback({ helpful: false, correction });
    setFeedbackOpen(false);
    setCorrection('');
    setMsg('✅ Koreksi disimpan ke knowledge base. AI akan pakai ini ke depan.');
  };

  // ---- styles ----
  const cardBg = isLight ? 'linear-gradient(to right, #ffffff, #e7e7e7)' : 'linear-gradient(to right, #151515, #303030)';
  const border = isLight ? '2px solid rgb(163, 163, 163)' : '2px solid #7a7a7a';
  const textColor = isLight ? '#000' : '#fff';
  const inputStyle = { width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #999', background: isLight ? '#fff' : '#222', color: textColor };
  const btn = { padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', color: '#fff', background: '#0d6efd' };

  const unackFlags = flags.filter((f) => !f.acknowledged);
  const hasExtraction = Object.values(requests).some((v) => (Array.isArray(v) ? v.length : v));

  return (
    <div className="mt-4" style={{ color: textColor }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <h4 style={{ margin: 0, color: textColor }}>🤖 AI Order Assistant</h4>
        {unackFlags.length > 0 && (
          <span style={{ background: '#dc3545', color: '#fff', borderRadius: 12, padding: '2px 10px', fontSize: 13, fontWeight: 600 }}>
            ⚠ {unackFlags.length} Critical Flag
          </span>
        )}
      </div>

      <div className="shadow p-3" style={{ backgroundImage: cardBg, border, borderRadius: 8 }}>
        {/* ---- Pre-shipment gate ---- */}
        {(allCategoriesDone || gate) && (
          <div style={{
            marginBottom: 16, padding: 12, borderRadius: 6,
            background: gate?.clear ? 'rgba(25,135,84,0.15)' : 'rgba(220,53,69,0.15)',
            border: `1px solid ${gate?.clear ? '#198754' : '#dc3545'}`,
          }}>
            <strong>{gateLoading ? '⏳ Mengecek kesiapan kirim...' : gate?.clear ? '✅ Clear — Order siap kirim' : '⚠️ Belum siap kirim'}</strong>
            {gate && !gate.clear && (
              <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                {(gate.unacknowledgedFlags || []).map((f, i) => (
                  <li key={`uf${i}`} style={{ color: '#dc3545' }}>Flag belum di-acknowledge: {f.text}</li>
                ))}
                {(gate.issues || []).map((iss, i) => <li key={`is${i}`}>{iss}</li>)}
              </ul>
            )}
            {!allCategoriesDone && (
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                (Gate berjalan otomatis saat semua kategori produksi berstatus Selesai/QC Pass.)
              </div>
            )}
          </div>
        )}

        {/* ---- Upload Chat WA ---- */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 600 }}>Upload Chat WhatsApp</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'end', marginTop: 6 }}>
            <input type="file" accept=".txt,.zip" onChange={(e) => setFile(e.target.files[0])} style={{ ...inputStyle, flex: '2 1 240px', width: 'auto' }} />
            <div style={{ flex: '1 1 160px' }}>
              <div style={{ fontSize: 12 }}>Tanggal mulai order</div>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
            </div>
            <button onClick={handleUpload} disabled={uploading} style={{ ...btn, opacity: uploading ? 0.6 : 1 }}>
              {uploading ? 'Memproses...' : 'Upload & Ekstrak'}
            </button>
          </div>
          {msg && <div style={{ marginTop: 6, fontSize: 14 }}>{msg}</div>}
          {history.length > 0 && (
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{history.length} chat sudah diproses untuk order ini.</div>
          )}
        </div>

        {/* ---- Critical flags ---- */}
        {flags.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 600, color: '#dc3545' }}>Critical Flags</label>
            {flags.map((f, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                padding: '6px 10px', marginTop: 4, borderRadius: 6,
                background: f.acknowledged ? 'rgba(108,117,125,0.15)' : 'rgba(220,53,69,0.15)',
                border: `1px solid ${f.acknowledged ? '#6c757d' : '#dc3545'}`,
              }}>
                <span style={{ textDecoration: f.acknowledged ? 'line-through' : 'none' }}>
                  {f.acknowledged ? '✔ ' : '⚠ '}{f.text}
                </span>
                {!f.acknowledged && (
                  <button onClick={() => acknowledgeFlag(f.text)} style={{ ...btn, background: '#6c757d', padding: '4px 10px', fontSize: 13 }}>
                    Acknowledge
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ---- Request Customer ---- */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 600 }}>Request Customer</label>
          {!hasExtraction ? (
            <div style={{ fontSize: 14, opacity: 0.7, marginTop: 4 }}>Belum ada hasil ekstraksi. Upload chat WA dulu.</div>
          ) : (
            <div style={{ marginTop: 6 }}>
              <table style={{ width: '100%', fontSize: 14 }}>
                <tbody>
                  {Object.keys(FIELD_LABELS).map((k) => requests[k] ? (
                    <tr key={k}>
                      <td style={{ fontWeight: 600, padding: '3px 8px', verticalAlign: 'top', width: 150 }}>{FIELD_LABELS[k]}</td>
                      <td style={{ padding: '3px 8px' }}>{requests[k]}</td>
                    </tr>
                  ) : null)}
                </tbody>
              </table>
              {requests.special_requests && requests.special_requests.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontWeight: 600 }}>Permintaan Khusus:</div>
                  <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                    {requests.special_requests.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ---- Tanya AI ---- */}
        <div>
          <label style={{ fontWeight: 600 }}>Tanya AI tentang order ini</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <input
              type="text" value={question} placeholder="mis. Apakah perlu akses lift untuk pengiriman?"
              onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              style={inputStyle}
            />
            <button onClick={handleAsk} disabled={asking} style={{ ...btn, opacity: asking ? 0.6 : 1 }}>
              {asking ? '...' : 'Tanya'}
            </button>
          </div>
          {answer && (
            <div style={{ marginTop: 8, padding: 10, borderRadius: 6, background: isLight ? '#f1f3f5' : '#1c1c1c', whiteSpace: 'pre-wrap' }}>
              {answer}
              <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => sendFeedback(true)} style={{ ...btn, background: '#198754', padding: '4px 10px' }}>👍</button>
                <button onClick={() => sendFeedback(false)} style={{ ...btn, background: '#dc3545', padding: '4px 10px' }}>👎</button>
              </div>
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
