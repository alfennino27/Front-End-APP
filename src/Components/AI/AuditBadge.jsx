// Components/AI/AuditBadge.jsx
// Badge audit AI per-invoice. Memanggil GET /ai/order/:invoiceId/audit (deterministik) lalu
// menampilkan ringkasan + daftar issue (qty mismatch, proses tanpa SPK, rugi, dll).
// Dipakai di detail invoice (Invoice.jsx).
import React, { useState, useEffect, useCallback } from 'react';
import { BsShieldCheck, BsShieldExclamation, BsArrowClockwise } from 'react-icons/bs';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useTheme } from '../../ThemeContext';

const aiKey = import.meta.env.VITE_KLF_AI_KEY || '';
const authHeaders = (extra = {}) => ({ ...(aiKey ? { 'X-KLF-Key': aiKey } : {}), ...extra });
const SEV_COLOR = { tinggi: '#dc3545', sedang: '#e0a800', rendah: '#6c757d' };

const AuditBadge = ({ invoiceId }) => {
  const baseUrl = getApiBaseUrl();
  const { globalTheme } = useTheme();
  const isLight = globalTheme === 'light';
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const runAudit = useCallback(async () => {
    if (!invoiceId) return;
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/ai/order/${invoiceId}/audit`, { headers: authHeaders() });
      if (res.ok) setResult(await res.json());
      else setResult(null);
    } catch (e) {
      console.error('Gagal audit invoice:', e);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, invoiceId]);

  useEffect(() => { runAudit(); }, [runAudit]);

  if (!invoiceId) return null;

  const bersih = result?.bersih;
  const total = result?.total_issues || 0;
  const color = loading ? '#6c757d' : bersih ? '#28a745' : '#dc3545';

  return (
    <div className="px-2 mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Audit data AI (qty, SPK, margin)"
        className="btn btn-sm d-flex align-items-center gap-1"
        style={{ border: `1px solid ${color}`, color, background: 'transparent', fontWeight: 600 }}
      >
        {bersih ? <BsShieldCheck size={15} /> : <BsShieldExclamation size={15} />}
        {loading ? 'Mengaudit…' : bersih ? 'Audit AI: Bersih' : `Audit AI: ${total} ketidaksesuaian`}
      </button>

      {open && result && (
        <div
          style={{
            marginTop: 8, padding: '10px 12px', borderRadius: 8,
            background: isLight ? '#fff' : '#1e1e1e',
            border: `1px solid ${isLight ? '#e3e3e3' : '#3a3a3a'}`, maxWidth: 640,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <small style={{ color: '#888' }}>{result.ringkasan}</small>
            <button onClick={runAudit} className="btn btn-sm" style={{ color: '#888', padding: 2 }} title="Audit ulang">
              <BsArrowClockwise size={14} />
            </button>
          </div>
          {total === 0 ? (
            <small style={{ color: '#28a745' }}>✓ Tidak ada ketidaksesuaian terdeteksi.</small>
          ) : (
            (result.issues || []).map((iss, i) => (
              <div key={i} style={{ fontSize: 12.5, padding: '3px 0', color: isLight ? '#333' : '#ddd', display: 'flex', gap: 7, alignItems: 'baseline' }}>
                <span style={{ flexShrink: 0, width: 8, height: 8, borderRadius: '50%', background: SEV_COLOR[iss.severity] || '#888', display: 'inline-block', marginTop: 4 }} />
                <span>{iss.message}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AuditBadge;
