// Components/AI/DailyBrief.jsx
// Brief Harian AI (proaktif) — pill mengambang di /project menampilkan jumlah hal yang
// perlu perhatian (overdue, deadline minggu ini, item mandek, audit data, flag belum di-ack).
// Sumber: GET /ai/digest/daily (deterministik, di backend). Klik item → buka project.
import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { BsClipboardCheck, BsExclamationTriangleFill, BsClockHistory, BsPauseCircle, BsFlagFill, BsCalendarWeek } from 'react-icons/bs';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useTheme } from '../../ThemeContext';

const aiKey = import.meta.env.VITE_KLF_AI_KEY || '';
const authHeaders = (extra = {}) => ({ ...(aiKey ? { 'X-KLF-Key': aiKey } : {}), ...extra });

const SEV_COLOR = { tinggi: '#dc3545', sedang: '#e0a800', rendah: '#6c757d' };

const DailyBrief = () => {
  const baseUrl = getApiBaseUrl();
  const { globalTheme } = useTheme();
  const isLight = globalTheme === 'light';
  const navigate = useNavigate();

  const [digest, setDigest] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchDigest = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/ai/digest/daily`, { headers: authHeaders() });
      if (res.ok) setDigest(await res.json());
    } catch (e) {
      console.error('Gagal ambil brief harian:', e);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchDigest();
    const t = setInterval(fetchDigest, 5 * 60 * 1000); // refresh tiap 5 menit
    return () => clearInterval(t);
  }, [fetchDigest]);

  const total = digest?.total_perhatian || 0;
  const s = digest?.sections || {};
  const goProject = (pid) => { if (pid) { setOpen(false); navigate(`/project/${pid}`); } };

  const card = { background: isLight ? '#fff' : '#1e1e1e', border: `1px solid ${isLight ? '#e3e3e3' : '#3a3a3a'}`, borderRadius: 10, padding: '10px 12px', marginBottom: 8 };
  const sectionTitle = { display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, margin: '14px 0 8px', color: isLight ? '#222' : '#eee' };
  const rowBtn = { display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '6px 4px', cursor: 'pointer', color: isLight ? '#333' : '#ddd', fontSize: 13, borderBottom: `1px dashed ${isLight ? '#eee' : '#333'}` };

  const Section = ({ icon, title, count, children }) => (count ? (
    <>
      <div style={sectionTitle}>{icon} {title} <span style={{ color: '#888', fontWeight: 400 }}>({count})</span></div>
      <div style={card}>{children}</div>
    </>
  ) : null);

  return (
    <>
      {/* Pill mengambang (kiri tombol chat) */}
      <button
        onClick={() => setOpen(true)}
        title="Brief Harian AI"
        style={{
          position: 'fixed', bottom: 28, right: 92, zIndex: 1049,
          display: 'flex', alignItems: 'center', gap: 8,
          background: isLight ? '#fff' : '#1e1e1e', color: isLight ? '#333' : '#eee',
          border: `1px solid ${total > 0 ? '#dc3545' : (isLight ? '#ccc' : '#444')}`,
          borderRadius: 22, padding: '8px 14px', cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(0,0,0,.18)', fontSize: 13, fontWeight: 600,
        }}
      >
        <BsClipboardCheck size={16} color={total > 0 ? '#dc3545' : '#28a745'} />
        <span style={{ display: window.innerWidth <= 768 ? 'none' : 'inline' }}>Brief</span>
        <span style={{
          background: total > 0 ? '#dc3545' : '#28a745', color: '#fff', borderRadius: 12,
          minWidth: 22, height: 20, padding: '0 6px', fontSize: 12, fontWeight: 700,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>{total}</span>
      </button>

      <Modal show={open} onHide={() => setOpen(false)} size="lg" centered className={isLight ? 'modalKLFlight' : 'modalKLF'} scrollable>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: 17, color: isLight ? '#222' : '#fff' }}>
            📋 Brief Harian {digest?.tanggal ? `— ${digest.tanggal}` : ''}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: isLight ? '#f6f7f9' : '#151515' }}>
          {loading && !digest ? (
            <p style={{ textAlign: 'center', color: '#888' }}>Memuat…</p>
          ) : total === 0 ? (
            <p style={{ textAlign: 'center', color: '#28a745', fontWeight: 600, padding: 20 }}>✅ Semua aman. Tidak ada hal mendesak.</p>
          ) : (
            <>
              <Section icon={<BsExclamationTriangleFill color="#dc3545" />} title="Overdue" count={s.overdue?.length}>
                {(s.overdue || []).map((it) => (
                  <button key={it.project_id} style={rowBtn} onClick={() => goProject(it.project_id)}>
                    <strong>{it.nama_barang}</strong> <span style={{ color: '#888' }}>[{it.kode_invoice}]</span> — <span style={{ color: '#dc3545' }}>telat {-it.sisa_hari} hari</span> <span style={{ color: '#888' }}>({it.customer})</span>
                  </button>
                ))}
              </Section>

              <Section icon={<BsCalendarWeek color="#e0a800" />} title="Deadline minggu ini" count={s.due_minggu_ini?.length}>
                {(s.due_minggu_ini || []).map((it) => (
                  <button key={it.project_id} style={rowBtn} onClick={() => goProject(it.project_id)}>
                    <strong>{it.nama_barang}</strong> <span style={{ color: '#888' }}>[{it.kode_invoice}]</span> — {it.sisa_hari} hari lagi <span style={{ color: '#888' }}>({it.customer})</span>
                  </button>
                ))}
              </Section>

              <Section icon={<BsPauseCircle color="#6f42c1" />} title="Mandek / tak ada aktivitas" count={s.mandek?.length}>
                {(s.mandek || []).map((it) => (
                  <button key={it.project_id} style={rowBtn} onClick={() => goProject(it.project_id)}>
                    <strong>{it.nama_barang}</strong> <span style={{ color: '#888' }}>[{it.kode_invoice}]</span> — {it.idle_hari == null ? 'belum ada komentar' : `${it.idle_hari} hari diam`}
                  </button>
                ))}
              </Section>

              <Section icon={<BsExclamationTriangleFill color="#fd7e14" />} title="Ketidaksesuaian data" count={(s.audit_data || []).reduce((n, inv) => n + (inv.issues?.length || 0), 0)}>
                {(s.audit_data || []).map((inv) => (
                  <div key={inv.invoice_id} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>[{inv.kodeInvoice}] {inv.customer}</div>
                    {(inv.issues || []).map((iss, i) => (
                      <div key={i} style={{ fontSize: 12.5, padding: '2px 0', color: isLight ? '#333' : '#ddd' }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: SEV_COLOR[iss.severity] || '#888', marginRight: 6 }} />
                        {iss.message}
                      </div>
                    ))}
                  </div>
                ))}
              </Section>

              <Section icon={<BsFlagFill color="#dc3545" />} title="Critical flag belum di-ack" count={s.flag_belum_ack?.length}>
                {(s.flag_belum_ack || []).map((it, i) => (
                  <div key={i} style={{ fontSize: 13, padding: '4px 0', color: isLight ? '#333' : '#ddd' }}>
                    <strong>{it.nama_barang}</strong> <span style={{ color: '#888' }}>[{it.kode_invoice}]</span>: {(it.flags || []).join('; ')}
                  </div>
                ))}
              </Section>
            </>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default DailyBrief;
