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
  // Feedback per gap: { [i]: { open, verdict:'not_error'|'user_error', note, status } }
  const [gapFb, setGapFb] = useState({});
  const getUid = () => { try { return JSON.parse(localStorage.getItem('user'))?.uid || null; } catch { return null; } };
  const patchGap = (i, p) => setGapFb((prev) => ({ ...prev, [i]: { ...(prev[i] || {}), ...p } }));

  // Kirim penjelasan satu gap ke AI -> masuk knowledge base.
  const explainGap = async (i, gap) => {
    const fb = gapFb[i] || {};
    const verdict = fb.verdict || 'not_error';
    const note = (fb.note || '').trim();
    if (!note) { patchGap(i, { status: 'need_note' }); return; }
    patchGap(i, { status: 'saving' });
    try {
      const res = await fetch(`${baseUrl}/ai/reconcile/explain`, {
        method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ project_id: projectId, item_name: itemName, gap, verdict, explanation: note, user_uid: getUid() }),
      });
      patchGap(i, { status: res.ok ? 'saved' : 'error' });
    } catch (e) { patchGap(i, { status: 'error' }); }
  };

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
  const chip = { background: 'transparent', border: '1px solid #6f42c1', color: isLight ? '#6f42c1' : '#b794f4', borderRadius: 16, padding: '4px 12px', margin: '0 6px 4px 0', cursor: 'pointer', fontSize: 13 };
  const gaps = result?.gaps || [];

  return (
    // stopPropagation: komponen ini sering dipasang di dalam card yang punya onClick
    // (mis. buka modal edit deskripsi). Cegah klik di sini merembet ke parent.
    <div className="mt-3" style={{ color: textColor }} onClick={(e) => e.stopPropagation()}>
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

                  {/* Jelaskan ke AI -> knowledge base */}
                  {(() => {
                    const fb = gapFb[i] || {};
                    if (fb.status === 'saved') {
                      return <div style={{ marginTop: 8, fontSize: 13, color: '#198754' }}>✅ Penjelasan tersimpan. AI akan memakainya ke depan.</div>;
                    }
                    const verdict = fb.verdict || 'not_error';
                    const vbtn = (val, label) => (
                      <button onClick={() => patchGap(i, { verdict: val })}
                        style={{ ...chip, ...(verdict === val ? { background: '#6f42c1', color: '#fff', borderColor: '#6f42c1' } : {}) }}>{label}</button>
                    );
                    return !fb.open ? (
                      <div style={{ marginTop: 8 }}>
                        <button onClick={() => patchGap(i, { open: true, verdict: 'not_error' })}
                          style={{ ...chip, borderColor: '#6f42c1', color: isLight ? '#6f42c1' : '#b794f4' }}>
                          💬 Jelaskan ke AI
                        </button>
                      </div>
                    ) : (
                      <div style={{ marginTop: 8, padding: 10, borderRadius: 6, background: isLight ? '#faf5ff' : '#241b33', border: '1px solid #6f42c1' }}>
                        <div style={{ fontSize: 13, marginBottom: 6 }}>Menurut kamu gap ini:</div>
                        <div style={{ marginBottom: 6 }}>
                          {vbtn('not_error', '✅ Wajar / bukan kesalahan')}
                          {vbtn('user_error', '✏️ Kesalahan kami (sudah diperbaiki)')}
                        </div>
                        <textarea
                          value={fb.note || ''}
                          onChange={(e) => patchGap(i, { note: e.target.value, status: undefined })}
                          rows={2}
                          placeholder={verdict === 'not_error'
                            ? 'Jelaskan kenapa ini wajar. Mis. "tinggi besi 41cm + marmer 4cm = 45cm total".'
                            : 'Jelaskan kesalahannya & koreksi yang benar. Mis. "marmer harusnya 4cm, deskripsi sudah diperbaiki".'}
                          style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #999', background: isLight ? '#fff' : '#222', color: textColor, boxSizing: 'border-box' }}
                        />
                        {fb.status === 'need_note' && <div style={{ fontSize: 12, color: '#dc3545', marginTop: 4 }}>Tulis penjelasannya dulu.</div>}
                        <div style={{ marginTop: 6 }}>
                          <button onClick={() => explainGap(i, g)} disabled={fb.status === 'saving'}
                            style={{ ...btn, padding: '5px 12px', fontSize: 13, opacity: fb.status === 'saving' ? 0.6 : 1 }}>
                            {fb.status === 'saving' ? 'Menyimpan…' : 'Kirim ke AI'}
                          </button>
                          <button onClick={() => patchGap(i, { open: false })}
                            style={{ ...chip, marginLeft: 6 }}>Batal</button>
                          {fb.status === 'error' && <span style={{ color: '#dc3545', marginLeft: 8, fontSize: 13 }}>❌ Gagal menyimpan</span>}
                        </div>
                      </div>
                    );
                  })()}
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
