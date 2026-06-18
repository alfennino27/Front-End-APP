// Components/AI/ConsistencyCheck.jsx
// Tombol "Cek Konsistensi (AI)" per item: rekonsiliasi chat WA + deskripsi produk +
// deskripsi & komentar tiap category by timestamp -> deteksi gap + usulan koreksi.
import React, { useState } from 'react';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useTheme } from '../../ThemeContext';

const aiKey = import.meta.env.VITE_KLF_AI_KEY || '';
const authHeaders = (extra = {}) => ({ ...(aiKey ? { 'X-KLF-Key': aiKey } : {}), ...extra });

const ConsistencyCheck = ({ projectId, itemName }) => {
  const baseUrl = getApiBaseUrl();
  const { globalTheme } = useTheme();
  const isLight = globalTheme === 'light';

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [fbDone, setFbDone] = useState('');

  const sendFeedback = async (helpful) => {
    let correction = '';
    if (!helpful) {
      correction = window.prompt('Koreksi — hasil cek konsistensi ini salahnya di mana? (disimpan ke knowledge base)') || '';
      if (!correction.trim()) return;
    }
    try {
      await fetch(`${baseUrl}/ai/feedback`, {
        method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ orderId: projectId, context: itemName || '', answer: JSON.stringify(result?.gaps || []), helpful, correction }),
      });
      setFbDone(helpful ? '👍 makasih' : '✅ koreksi disimpan');
    } catch (e) { /* abaikan */ }
  };

  const run = async () => {
    if (!projectId) return;
    setLoading(true); setError(''); setResult(null); setFbDone('');
    try {
      const res = await fetch(`${baseUrl}/ai/item/${projectId}/reconcile`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setResult(data);
      else setError(data.message || 'Gagal cek konsistensi');
    } catch (err) { setError('Koneksi gagal: ' + err.message); } finally { setLoading(false); }
  };

  const textColor = isLight ? '#000' : '#fff';
  const btn = { padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', color: '#fff', background: '#6f42c1', fontWeight: 600 };
  const gaps = result?.gaps || [];

  return (
    <div className="mt-3" style={{ color: textColor }}>
      <button onClick={run} disabled={loading} style={{ ...btn, opacity: loading ? 0.6 : 1 }}>
        {loading ? '⏳ Menganalisa…' : '🔍 Cek Konsistensi (AI)'}
      </button>
      {itemName && <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.7 }}>untuk: {itemName}</span>}

      {error && <div style={{ marginTop: 8, color: '#dc3545' }}>❌ {error}</div>}

      {result && (
        <div style={{ marginTop: 10 }}>
          {result.clear || gaps.length === 0 ? (
            <div style={{ padding: 10, borderRadius: 6, background: 'rgba(25,135,84,0.15)', border: '1px solid #198754' }}>
              ✅ Konsisten — tidak ada gap antara chat, deskripsi, dan komentar terbaru.
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 600, color: '#dc3545', marginBottom: 6 }}>⚠️ Ditemukan {gaps.length} gap (revisi terbaru belum tercermin):</div>
              {gaps.map((g, i) => (
                <div key={i} style={{ padding: 10, marginBottom: 8, borderRadius: 6, background: 'rgba(220,53,69,0.10)', border: '1px solid #dc3545' }}>
                  <div style={{ fontWeight: 700 }}>{g.topic || `Gap ${i + 1}`}</div>
                  <div style={{ fontSize: 14, marginTop: 4 }}>
                    🆕 <b>Terbaru:</b> {g.latest_instruction} <span style={{ opacity: 0.7 }}>({g.latest_source}{g.latest_ts ? `, ${g.latest_ts}` : ''})</span>
                  </div>
                  {g.current_in_production && (
                    <div style={{ fontSize: 14 }}>🏭 <b>Di produksi sekarang:</b> {g.current_in_production}</div>
                  )}
                  {g.where_to_fix && <div style={{ fontSize: 13, opacity: 0.85 }}>📍 Perbaiki di: {g.where_to_fix}</div>}
                  {g.suggestion && (
                    <div style={{ fontSize: 14, marginTop: 4, padding: 8, borderRadius: 4, background: isLight ? '#fff' : '#222' }}>
                      💡 <b>Usulan:</b> {g.suggestion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 8, fontSize: 13 }}>
            {fbDone ? <span style={{ opacity: 0.7 }}>{fbDone}</span> : (
              <>
                <span style={{ marginRight: 6 }}>Hasil ini membantu?</span>
                <button onClick={() => sendFeedback(true)} style={{ ...btn, background: '#198754', padding: '4px 10px' }}>👍</button>
                <button onClick={() => sendFeedback(false)} style={{ ...btn, background: '#dc3545', padding: '4px 10px', marginLeft: 6 }}>👎</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsistencyCheck;
