// Components/AI/KnowledgeBase.jsx
// UI kelola knowledge base AI KLF: lihat/tambah/edit/hapus SOP & koreksi, verifikasi
// entri auto-learning, lihat percakapan terbaru yang dipelajari.
import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useTheme } from '../../ThemeContext';

const aiKey = import.meta.env.VITE_KLF_AI_KEY || '';
const authHeaders = (extra = {}) => ({ ...(aiKey ? { 'X-KLF-Key': aiKey } : {}), ...extra });

const TYPES = ['sop', 'correction', 'consistency_rule', 'flag_rule', 'example', 'common_mistake', 'learned'];
const TYPE_LABEL = { sop: 'SOP', correction: 'Koreksi', consistency_rule: 'Aturan Konsistensi', flag_rule: 'Aturan Flag', example: 'Contoh', common_mistake: 'Kesalahan Umum', learned: 'Auto-Learning' };

const KnowledgeBase = () => {
  const baseUrl = getApiBaseUrl();
  const { globalTheme } = useTheme();
  const isLight = globalTheme === 'light';

  const [items, setItems] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [filterReviewed, setFilterReviewed] = useState(''); // '', 'true', 'false'
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(false);

  // form tambah
  const [newType, setNewType] = useState('sop');
  const [newContext, setNewContext] = useState('');
  const [newContent, setNewContent] = useState('');
  // edit inline
  const [editId, setEditId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (filterReviewed) qs.set('reviewed', filterReviewed);
      if (filterType) qs.set('type', filterType);
      const [kRes, cRes] = await Promise.all([
        fetch(`${baseUrl}/ai/knowledge/get?${qs.toString()}`, { headers: authHeaders() }),
        fetch(`${baseUrl}/ai/conversations?limit=20`, { headers: authHeaders() }),
      ]);
      setItems(kRes.ok ? await kRes.json() : []);
      setConversations(cRes.ok ? await cRes.json() : []);
    } catch (err) { /* abaikan */ } finally { setLoading(false); }
  }, [baseUrl, filterReviewed, filterType]);

  useEffect(() => { load(); }, [load]);

  const addKnowledge = async () => {
    if (!newContent.trim()) return;
    const res = await fetch(`${baseUrl}/ai/knowledge/create`, {
      method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ type: newType, context: newContext, content: newContent }),
    });
    if (res.ok) { setNewContent(''); setNewContext(''); load(); }
  };

  const verify = async (id) => {
    await fetch(`${baseUrl}/ai/knowledge/${id}`, { method: 'PUT', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ reviewed: true }) });
    load();
  };
  const remove = async (id) => {
    if (!window.confirm('Hapus knowledge ini?')) return;
    await fetch(`${baseUrl}/ai/knowledge/${id}`, { method: 'DELETE', headers: authHeaders() });
    load();
  };
  const saveEdit = async (id) => {
    await fetch(`${baseUrl}/ai/knowledge/${id}`, { method: 'PUT', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ content: editContent }) });
    setEditId(null); setEditContent(''); load();
  };

  const text = isLight ? '#000' : '#eee';
  const cardBg = isLight ? '#fff' : '#1c1c1c';
  const border = isLight ? '1px solid #ddd' : '1px solid #333';
  const inputStyle = { padding: '8px', borderRadius: 6, border: '1px solid #999', background: isLight ? '#fff' : '#222', color: text };
  const btn = { padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', color: '#fff', background: '#0d6efd', fontSize: 13 };

  const Badge = ({ k }) => k.reviewed === false
    ? <span style={{ background: '#fd7e14', color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: 11 }}>belum diverifikasi</span>
    : <span style={{ background: '#198754', color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: 11 }}>terverifikasi</span>;

  return (
    <div style={{ padding: 20, color: text, maxWidth: 1000, margin: '0 auto' }}>
      <h3>🧠 Knowledge Base AI</h3>
      <p style={{ opacity: 0.8, fontSize: 14 }}>
        Pengetahuan yang dipakai AI untuk memahami workflow KLF. Entri <b>terverifikasi</b> jadi acuan utama;
        <b> auto-learning</b> (hasil percakapan harian) perlu kamu review dulu.
      </p>

      {/* Tambah */}
      <div style={{ background: cardBg, border, borderRadius: 8, padding: 14, marginBottom: 16 }}>
        <h6>+ Tambah Knowledge / SOP</h6>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <select value={newType} onChange={(e) => setNewType(e.target.value)} style={inputStyle}>
            {TYPES.filter((t) => t !== 'learned').map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
          <input placeholder="Konteks (mis. sofa, finishing) — opsional" value={newContext} onChange={(e) => setNewContext(e.target.value)} style={{ ...inputStyle, flex: '1 1 200px' }} />
        </div>
        <textarea placeholder="Isi pengetahuan / aturan / SOP…" value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={2} style={{ ...inputStyle, width: '100%', marginBottom: 8 }} />
        <button onClick={addKnowledge} style={btn}>Simpan</button>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13 }}>Filter:</span>
        <select value={filterReviewed} onChange={(e) => setFilterReviewed(e.target.value)} style={inputStyle}>
          <option value="">Semua status</option>
          <option value="true">Terverifikasi</option>
          <option value="false">Belum diverifikasi</option>
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={inputStyle}>
          <option value="">Semua tipe</option>
          {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
        </select>
        {loading && <span style={{ fontSize: 12, opacity: 0.6 }}>memuat…</span>}
      </div>

      {/* List */}
      <div style={{ background: cardBg, border, borderRadius: 8 }}>
        {items.length === 0 && <div style={{ padding: 14, opacity: 0.6 }}>Belum ada knowledge.</div>}
        {items.map((k) => (
          <div key={k.id || k._id} style={{ padding: 12, borderBottom: border, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0d6efd' }}>{TYPE_LABEL[k.type] || k.type}</span>
                {k.context && <span style={{ fontSize: 11, opacity: 0.7 }}>#{k.context}</span>}
                <Badge k={k} />
                {k.source_type === 'auto' && <span style={{ fontSize: 11, opacity: 0.6 }}>🤖 auto</span>}
              </div>
              {editId === (k.id || k._id) ? (
                <div>
                  <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={2} style={{ ...inputStyle, width: '100%' }} />
                  <button onClick={() => saveEdit(k.id || k._id)} style={{ ...btn, marginTop: 4 }}>Simpan</button>
                  <button onClick={() => setEditId(null)} style={{ ...btn, background: '#6c757d', marginLeft: 6 }}>Batal</button>
                </div>
              ) : (
                <div style={{ fontSize: 14 }}>{k.content}</div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
              {k.reviewed === false && <button onClick={() => verify(k.id || k._id)} style={{ ...btn, background: '#198754' }}>✓ Verifikasi</button>}
              <button onClick={() => { setEditId(k.id || k._id); setEditContent(k.content); }} style={{ ...btn, background: '#6c757d' }}>Edit</button>
              <button onClick={() => remove(k.id || k._id)} style={{ ...btn, background: '#dc3545' }}>Hapus</button>
            </div>
          </div>
        ))}
      </div>

      {/* Percakapan terbaru */}
      <h5 style={{ marginTop: 24 }}>💬 Percakapan terbaru (bahan pelajaran)</h5>
      <div style={{ background: cardBg, border, borderRadius: 8 }}>
        {conversations.length === 0 && <div style={{ padding: 14, opacity: 0.6 }}>Belum ada percakapan terekam.</div>}
        {conversations.map((c) => (
          <div key={c._id} style={{ padding: 10, borderBottom: border, fontSize: 13 }}>
            <div style={{ opacity: 0.6, fontSize: 11 }}>{c.ts ? new Date(c.ts).toLocaleString('id-ID') : ''}{c.item_name ? ` • ${c.item_name}` : ''}</div>
            <div><b>Q:</b> {c.question}</div>
            <div style={{ opacity: 0.85 }}><b>A:</b> {(c.answer || '').slice(0, 200)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KnowledgeBase;
