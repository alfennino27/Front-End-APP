// Components/AI/SPKPrecheckModal.jsx
// Gate AI sebelum "Buat SPK": cek deskripsi category vs deskripsi produk,
// category lain, chat WA & komentar. Kalau ada KONTRADIKSI nyata, print diblokir
// sampai user menjawab setiap issue (jelaskan "sudah benar" atau "akan diperbaiki").
// Jawaban dicatat sebagai komentar tanya-jawab + masuk knowledge base.
import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useTheme } from '../../ThemeContext';

const aiKey = import.meta.env.VITE_KLF_AI_KEY || '';
const authHeaders = (extra = {}) => ({ ...(aiKey ? { 'X-KLF-Key': aiKey } : {}), ...extra });
const getUser = () => { try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; } };

const SPKPrecheckModal = ({ show, projectId, category, onClose, onProceed }) => {
  const baseUrl = getApiBaseUrl();
  const { globalTheme } = useTheme();
  const isLight = globalTheme === 'light';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { clear, issues:[{topic,problem}] }
  // Jawaban per issue: { [i]: { verdict:'correct'|'will_fix', note, status } }
  const [ans, setAns] = useState({});
  const patch = (i, p) => setAns((prev) => ({ ...prev, [i]: { ...(prev[i] || {}), ...p } }));

  const run = useCallback(async () => {
    if (!projectId || !category) return;
    setLoading(true); setError(''); setResult(null); setAns({});
    try {
      const res = await fetch(`${baseUrl}/ai/project/${projectId}/category/${category}/spk-precheck`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setResult(data);
      else setError(data.message || 'Gagal cek konsistensi SPK');
    } catch (e) { setError('Koneksi gagal: ' + e.message); } finally { setLoading(false); }
  }, [baseUrl, projectId, category]);

  useEffect(() => { if (show) run(); }, [show, run]);

  const issues = result?.issues || [];
  const allAnswered = issues.length > 0 && issues.every((_, i) => ans[i]?.status === 'saved');

  const submitAnswer = async (i, issue) => {
    const a = ans[i] || {};
    const verdict = a.verdict || 'correct';
    const note = (a.note || '').trim();
    if (!note) { patch(i, { status: 'need_note' }); return; }
    patch(i, { status: 'saving' });
    try {
      const u = getUser();
      const res = await fetch(`${baseUrl}/ai/project/${projectId}/category/${category}/spk-precheck/answer`, {
        method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ topic: issue.topic, problem: issue.problem, verdict, answer: note, user_uid: u.uid || null, user_name: u.name || u.displayName || u.email || 'User' }),
      });
      patch(i, { status: res.ok ? 'saved' : 'error' });
    } catch (e) { patch(i, { status: 'error' }); }
  };

  const textColor = isLight ? '#000' : '#eee';
  const subColor = isLight ? '#555' : '#bbb';
  const chip = { background: 'transparent', border: '1px solid #6f42c1', color: isLight ? '#6f42c1' : '#b794f4', borderRadius: 16, padding: '4px 12px', margin: '0 6px 6px 0', cursor: 'pointer', fontSize: 13 };
  const chipActive = { background: '#6f42c1', color: '#fff', borderColor: '#6f42c1' };

  return (
    <Modal show={show} onHide={onClose} centered size="lg" contentClassName={isLight ? '' : 'bg-dark text-light'}>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: 18 }}>🔍 Cek Konsistensi SPK — {category}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ color: textColor }}>
        {loading && <div style={{ padding: 8 }}>⏳ AI sedang memeriksa deskripsi {category} vs deskripsi produk, category lain, chat & komentar…</div>}
        {error && <div style={{ color: '#dc3545' }}>❌ {error}</div>}

        {result && !loading && (
          result.clear ? (
            <div style={{ padding: 12, borderRadius: 6, background: 'rgba(25,135,84,0.15)', border: '1px solid #198754' }}>
              ✅ Deskripsi {category} konsisten — tidak ada kontradiksi dengan deskripsi produk/category lain. Aman untuk dicetak.
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 600, color: '#dc3545', marginBottom: 4 }}>
                ⚠️ Ditemukan {issues.length} potensi kesalahan. Print diblokir sampai semua dijawab.
              </div>
              <div style={{ fontSize: 13, color: subColor, marginBottom: 10 }}>
                Jelaskan tiap poin: pilih <b>Sudah benar</b> (kalau ini wajar/false alarm) atau <b>Akan diperbaiki</b>. Jawaban tercatat sebagai komentar di {category} & dipelajari AI.
              </div>

              {issues.map((g, i) => {
                const a = ans[i] || {};
                const verdict = a.verdict || 'correct';
                const vbtn = (val, label) => (
                  <button key={val} onClick={() => patch(i, { verdict: val })} disabled={a.status === 'saved'}
                    style={{ ...chip, ...(verdict === val ? chipActive : {}) }}>{label}</button>
                );
                return (
                  <div key={i} style={{ padding: 12, marginBottom: 10, borderRadius: 6, background: 'rgba(220,53,69,0.10)', border: '1px solid #dc3545' }}>
                    {g.topic && <div style={{ fontWeight: 700 }}>{g.topic}</div>}
                    <div style={{ fontSize: 14, marginTop: 2 }}>🤖 {g.problem}</div>

                    {a.status === 'saved' ? (
                      <div style={{ marginTop: 8, fontSize: 13, color: '#198754' }}>
                        ✅ Jawaban tersimpan ({verdict === 'correct' ? 'sudah benar' : 'akan diperbaiki'}) — tercatat di komentar {category}.
                      </div>
                    ) : (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ marginBottom: 4 }}>
                          {vbtn('correct', '✅ Sudah benar')}
                          {vbtn('will_fix', '✏️ Akan diperbaiki')}
                        </div>
                        <textarea
                          value={a.note || ''}
                          onChange={(e) => patch(i, { note: e.target.value, status: undefined })}
                          rows={2}
                          placeholder={verdict === 'correct'
                            ? 'Jelaskan kenapa ini sudah benar. Mis. "tinggi besi 46cm + marmer 4cm = 50cm".'
                            : 'Jelaskan kesalahannya & rencana koreksi. Mis. "tinggi besi salah ketik, harusnya 50cm — akan diperbaiki".'}
                          style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #999', background: isLight ? '#fff' : '#222', color: textColor, boxSizing: 'border-box' }}
                        />
                        {a.status === 'need_note' && <div style={{ fontSize: 12, color: '#dc3545', marginTop: 4 }}>Tulis penjelasannya dulu.</div>}
                        <div style={{ marginTop: 6 }}>
                          <button onClick={() => submitAnswer(i, g)} disabled={a.status === 'saving'}
                            style={{ background: '#6f42c1', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: a.status === 'saving' ? 0.6 : 1 }}>
                            {a.status === 'saving' ? 'Menyimpan…' : 'Kirim jawaban'}
                          </button>
                          {a.status === 'error' && <span style={{ color: '#dc3545', marginLeft: 8, fontSize: 13 }}>❌ Gagal menyimpan</span>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </Modal.Body>
      <Modal.Footer>
        {result && !loading && !result.clear && !allAnswered && (
          <span style={{ fontSize: 12, color: subColor, marginRight: 'auto' }}>Jawab semua poin untuk membuka tombol cetak.</span>
        )}
        <Button variant="secondary" onClick={onClose}>Tutup</Button>
        {result && !loading && (result.clear || allAnswered) && (
          <Button variant="primary" onClick={onProceed}>Lanjut Buat SPK →</Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default SPKPrecheckModal;
