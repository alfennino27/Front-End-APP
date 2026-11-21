// Components/AI/SPKQtyCheckModal.jsx
// Gate sebelum Print di halaman SPK: cek JUMLAH tiap item (teks "Qty: N" di keterangan & kolom qty)
// vs qty order customer. Deterministik dari server (GET /spk/qty-check/:idSPK), bukan AI.
// Lahir dari kasus 2026-11-21: order 2, kolom SPK 2, teks keterangan "Qty: 1 PCS" → pengrajin buat 1.
// Kalau semua cocok → langsung cetak. Kalau ada temuan → cetak diblokir sampai tiap temuan
// dijawab "Sudah benar" + alasan (tercatat sebagai komentar di project), atau diperbaiki dulu.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useTheme } from '../../ThemeContext';

const aiKey = import.meta.env.VITE_KLF_AI_KEY || '';
const getUser = () => { try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; } };

const SPKQtyCheckModal = ({ show, idSPK, onClose, onProceed }) => {
  const baseUrl = getApiBaseUrl();
  const { globalTheme } = useTheme();
  const isLight = globalTheme === 'light';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [issues, setIssues] = useState(null);
  const [ans, setAns] = useState({}); // { [i]: { note, status } }
  const patch = (i, p) => setAns((prev) => ({ ...prev, [i]: { ...(prev[i] || {}), ...p } }));
  // Ref: onProceed dari induk biasanya fungsi inline — jangan jadi dependency run (cegah loop fetch).
  const proceedRef = useRef(onProceed);
  proceedRef.current = onProceed;

  const run = useCallback(async () => {
    if (!idSPK) return;
    setLoading(true); setError(''); setIssues(null); setAns({});
    try {
      const res = await fetch(`${baseUrl}/spk/qty-check/${idSPK}`);
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Gagal cek jumlah'); return; }
      if (data.clear) { proceedRef.current(); return; }
      setIssues(data.issues || []);
    } catch (e) { setError('Koneksi gagal: ' + e.message); } finally { setLoading(false); }
  }, [baseUrl, idSPK]);

  useEffect(() => { if (show) run(); }, [show, run]);

  const submit = async (i, g) => {
    const note = (ans[i]?.note || '').trim();
    if (!note) { patch(i, { status: 'need_note' }); return; }
    patch(i, { status: 'saving' });
    try {
      const u = getUser();
      const res = await fetch(`${baseUrl}/ai/project/${g.idProduct}/category/${g.category}/spk-precheck/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(aiKey ? { 'X-KLF-Key': aiKey } : {}) },
        body: JSON.stringify({ kind: 'qty', topic: g.topic, problem: g.problem, verdict: 'correct', answer: note, user_uid: u.uid || null, user_name: u.name || u.displayName || 'User' }),
      });
      patch(i, { status: res.ok ? 'saved' : 'error' });
    } catch { patch(i, { status: 'error' }); }
  };

  const list = issues || [];
  const allOk = list.length > 0 && list.every((_, i) => ans[i]?.status === 'saved');
  const textColor = isLight ? '#000' : '#eee';
  const subColor = isLight ? '#555' : '#bbb';

  return (
    <Modal show={show && (loading || !!error || list.length > 0)} onHide={onClose} centered size="lg" contentClassName={isLight ? '' : 'bg-dark text-light'}>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: 18 }}>🔢 Cek Jumlah sebelum Cetak SPK</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ color: textColor }}>
        {loading && <div>⏳ Mencocokkan jumlah di keterangan & kolom SPK dengan order customer…</div>}
        {error && <div style={{ color: '#dc3545' }}>❌ {error}</div>}
        {list.length > 0 && !loading && (
          <>
            <div style={{ fontWeight: 600, color: '#dc3545', marginBottom: 4 }}>
              ⚠️ {list.length} item jumlahnya tidak cocok dengan order. Pengrajin membaca teks keterangan — cetak diblokir.
            </div>
            <div style={{ fontSize: 13, color: subColor, marginBottom: 10 }}>
              Paling aman: perbaiki teks keterangan / kolom qty dulu, lalu Print lagi. Kalau memang benar (mis. hitungan komponen), tulis alasannya.
            </div>
            {list.map((g, i) => {
              const a = ans[i] || {};
              const warnOnly = g.level === 'cek';
              return (
                <div key={i} style={{ padding: 12, marginBottom: 10, borderRadius: 6,
                  background: warnOnly ? 'rgba(255,193,7,0.15)' : 'rgba(220,53,69,0.10)',
                  border: `1px solid ${warnOnly ? '#d39e00' : '#dc3545'}` }}>
                  <div style={{ fontWeight: 700 }}>
                    <a href={`/project/${g.idProduct}`} target="_blank" rel="noreferrer">{g.namaBarang}</a>
                    {g.kodeInvoice ? <span style={{ fontWeight: 400, color: subColor }}> · {g.kodeInvoice}</span> : null}
                    <span style={{ fontWeight: 400 }}> · {g.category}</span>
                  </div>
                  <div style={{ fontSize: 14, marginTop: 2 }}>{g.problem}</div>
                  {a.status === 'saved' ? (
                    <div style={{ marginTop: 8, fontSize: 13, color: '#198754' }}>✅ Alasan tercatat di komentar {g.category}.</div>
                  ) : (
                    <div style={{ marginTop: 8 }}>
                      <textarea value={a.note || ''} rows={2}
                        onChange={(e) => patch(i, { note: e.target.value, status: undefined })}
                        placeholder='Hanya kalau memang benar — kenapa jumlahnya beda? Mis. "2 lembar marmer untuk 1 meja".'
                        style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #999', background: isLight ? '#fff' : '#222', color: textColor, boxSizing: 'border-box', fontSize: 16 }} />
                      {a.status === 'need_note' && <div style={{ fontSize: 12, color: '#dc3545' }}>Tulis alasannya dulu.</div>}
                      <button onClick={() => submit(i, g)} disabled={a.status === 'saving'}
                        style={{ marginTop: 6, minHeight: 40, background: '#6c757d', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 600 }}>
                        {a.status === 'saving' ? 'Menyimpan…' : '✅ Sudah benar'}
                      </button>
                      {a.status === 'error' && <span style={{ color: '#dc3545', marginLeft: 8, fontSize: 13 }}>❌ Gagal menyimpan</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        {list.length > 0 && !loading && <Button variant="outline-secondary" onClick={run}>🔄 Cek ulang</Button>}
        <Button variant="secondary" onClick={onClose}>Tutup — perbaiki dulu</Button>
        {allOk && <Button variant="primary" onClick={onProceed}>Cetak SPK →</Button>}
      </Modal.Footer>
    </Modal>
  );
};

export default SPKQtyCheckModal;
