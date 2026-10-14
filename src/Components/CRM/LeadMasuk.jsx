// Tab "Lead Masuk" CRM: chat dari iklan Click-to-WhatsApp yang sudah dinilai AI.
// Owner cukup konfirmasi kandidat Serius (1 tap) → jadi lead CRM + dikirim ke Meta (QualifiedLead).
// Label "tidak" otomatis, tidak perlu dicek (tidak dikirim apa-apa ke Meta).
// Backend: KLF-Server routes/crm/leadMasuk.js, utils/leadPipeline.js.
import React, { useCallback, useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';

const LABEL = {
  serius: { t: 'Serius', c: '#2e7d32', bg: '#E3F3E1' },
  potensial: { t: 'Potensial', c: '#b26a00', bg: '#FFF3CD' },
  menunggu: { t: 'Menunggu', c: '#7F77DD', bg: '#EEEDFC' },
  tidak: { t: 'Tidak', c: '#a32d2d', bg: '#F8E1E1' },
};
const TABS = [['kandidat', 'Perlu konfirmasi'], ['followup', 'Perlu follow-up'], ['serius', 'Serius'], ['purchase', 'Purchase'], ['proses', 'Masih proses'], ['tidak', 'Tidak'], ['semua', 'Semua']];

const rupiahSingkat = (n) => {
  const v = Number(n) || 0;
  if (v >= 1e9) return `Rp ${(v / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 2 })} M`;
  if (v >= 1e6) return `Rp ${(v / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
  return `Rp ${v.toLocaleString('id-ID')}`;
};
// Status CAPI per event: terkirim (✓) / gagal (✗) / tidak dikirim (klik > 28 hari)
const BATAS_KIRIM_HARI = 28;
const statusEvent = (c, nama) => {
  const ev = (c.capi || []).filter((e) => e.event_name === nama && !e.test);
  if (ev.some((e) => e.ok)) return 'ok';
  if (ev.length) return 'gagal';
  if (c.ad_clicked_at && Date.now() - new Date(c.ad_clicked_at).getTime() > BATAS_KIRIM_HARI * 86400000) return 'basi';
  return 'antre';
};

const fmtTgl = (d) => (d ? new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-');
const uidSaya = () => { try { return JSON.parse(localStorage.getItem('user'))?.uid || null; } catch { return null; } };

export default function LeadMasuk({ baseUrl, bulan, dark, text, muted, cardBg, border, onBerubah }) {
  const [tab, setTab] = useState('kandidat');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sibuk, setSibuk] = useState(null);
  const [detail, setDetail] = useState(null); // { conv, pesan }

  const bulanAktif = bulan || new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 7);

  const muat = useCallback(() => {
    setLoading(true);
    fetch(`${baseUrl}/crm/lead-masuk?tab=${tab}&bulan=${bulanAktif}`)
      .then((r) => r.json()).then((d) => setList(Array.isArray(d) ? d : [])).catch(() => setList([])).finally(() => setLoading(false));
  }, [baseUrl, tab, bulanAktif]);
  useEffect(() => { muat(); }, [muat]);

  const konfirmasi = async (wa, keputusan) => {
    setSibuk(wa);
    try {
      const r = await fetch(`${baseUrl}/crm/lead-masuk/${wa}/konfirmasi`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keputusan, uid: uidSaya() }),
      }).then((x) => x.json());
      if (r.message) alert(r.message);
      setDetail(null);
      muat();
      onBerubah && onBerubah();
    } finally { setSibuk(null); }
  };

  const bukaChat = async (wa) => {
    setDetail({ loading: true });
    const d = await fetch(`${baseUrl}/crm/lead-masuk/${wa}/chat`).then((r) => r.json()).catch(() => null);
    setDetail(d);
  };

  const subtle = dark ? '#252535' : '#f6f7fb';
  const Pil = ({ label }) => { const L = LABEL[label]; return L ? <span style={{ fontSize: 10, fontWeight: 700, color: L.c, background: L.bg, padding: '2px 7px', borderRadius: 10 }}>{L.t}</span> : null; };

  const TombolKonfirmasi = ({ c, besar }) => {
    const k = c.konfirmasi?.keputusan;
    const gaya = (aktif, warna) => ({ flex: 1, border: `1px solid ${warna}`, background: aktif ? warna : 'none', color: aktif ? '#fff' : warna, borderRadius: 8, padding: besar ? '12px 0' : '9px 0', fontWeight: 700, fontSize: besar ? 15 : 13, cursor: 'pointer' });
    if (sibuk === c.wa) return <div style={{ textAlign: 'center', padding: 8 }}><Spinner size="sm" /></div>;
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="no-active" style={gaya(k === 'serius', '#2e7d32')} onClick={(e) => { e.stopPropagation(); konfirmasi(c.wa, k === 'serius' ? null : 'serius'); }}>✅ Serius</button>
        <button className="no-active" style={gaya(k === 'tidak', '#a32d2d')} onClick={(e) => { e.stopPropagation(); konfirmasi(c.wa, k === 'tidak' ? null : 'tidak'); }}>❌ Tidak</button>
      </div>
    );
  };

  // Baris status Conversions API: satu chat bisa kirim QualifiedLead DAN Purchase.
  const StatusMeta = ({ c }) => {
    const ql = (c.konfirmasi?.keputusan === 'serius') ? statusEvent(c, 'QualifiedLead') : null;
    const pu = c.deal ? statusEvent(c, 'Purchase') : null;
    if (!ql && !pu) return null;
    const teks = { ok: '✓', gagal: '✗ gagal', basi: '– tidak dikirim (klik > 28 hr)', antre: '⏳ antre' };
    const warna = { ok: '#1877F2', gagal: '#a32d2d', basi: muted, antre: '#b26a00' };
    return (
      <div style={{ fontSize: 11, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ color: muted }}>Meta:</span>
        {ql && <span style={{ color: warna[ql] }}>{teks[ql]} Qualified Lead</span>}
        {pu && <span style={{ color: warna[pu] }}>{teks[pu]} Purchase</span>}
      </div>
    );
  };

  const totalPurchase = tab === 'purchase' ? list.reduce((a, c) => a + (Number(c.deal?.deal_value) || 0), 0) : 0;

  return (
    <div>
      <div style={{ fontSize: 12, color: muted, marginBottom: 10 }}>
        Chat dari iklan WhatsApp · {bulanAktif}. AI menilai otomatis; Anda cukup konfirmasi yang <b>Serius</b> — itu yang diajarkan ke Meta.
      </div>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 12 }}>
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className="no-active"
            style={{ whiteSpace: 'nowrap', border: 'none', borderRadius: 16, padding: '7px 14px', fontSize: 13, cursor: 'pointer', background: tab === k ? '#013175' : subtle, color: tab === k ? '#fff' : text }}>{l}</button>
        ))}
      </div>

      {tab === 'purchase' && !loading && list.length > 0 && (
        <div style={{ fontSize: 13, color: text, marginBottom: 10 }}>
          <b>{list.length}</b> chat iklan jadi purchase · total <b>{rupiahSingkat(totalPurchase)}</b>
          <span style={{ color: muted }}> — nilai dari Quote berstatus Deal (subtotal − diskon), dikirim ke Meta sebagai event Purchase.</span>
        </div>
      )}
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div> : list.length === 0 ? (
        <div style={{ textAlign: 'center', color: muted, padding: 40 }}>{tab === 'kandidat' ? 'Tidak ada yang perlu dikonfirmasi 🎉' : tab === 'followup' ? 'Semua lead bagus sudah di-follow up 👍' : 'Kosong.'}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 10 }}>
          {list.map((c) => (
            <div key={c.wa} onClick={() => bukaChat(c.wa)} style={{ background: cardBg, border, borderRadius: 12, padding: 14, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700, color: text, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nama_kontak || c.nama_profil || `+${c.wa}`}</span>
                <span style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {c.konfirmasi && <span title="Sudah dikonfirmasi" style={{ fontSize: 10, color: muted }}>✔︎</span>}
                  <Pil label={c.label_akhir} />
                </span>
              </div>
              {c.ai?.produk && <div style={{ fontSize: 13, color: text }}>🪑 {c.ai.produk}{c.ai.kota ? ` · 📍 ${c.ai.kota}` : ''}</div>}
              {c.ai?.alasan && <div style={{ fontSize: 12, color: muted }}>{c.ai.alasan}</div>}
              {c.ai?.perlu_follow_up && c.ai?.saran_follow_up && (
                <div style={{ fontSize: 12, color: text, background: dark ? '#2a2614' : '#FFF8E1', border: '1px solid ' + (dark ? '#5a4a1a' : '#f3dfa0'), borderRadius: 6, padding: '6px 8px' }}>
                  <div style={{ fontWeight: 700, color: '#b26a00', marginBottom: 2 }}>⏰ Perlu follow-up · sepi sejak {fmtTgl(c.last_at)}</div>
                  <span style={{ color: muted }}>Saran: </span>{c.ai.saran_follow_up}
                  <div style={{ marginTop: 6 }}>
                    <a onClick={(e) => e.stopPropagation()} href={`https://wa.me/${c.wa}`} target="_blank" rel="noreferrer"
                      style={{ display: 'inline-block', background: '#25D366', color: '#fff', borderRadius: 6, padding: '5px 10px', fontWeight: 700, textDecoration: 'none', fontSize: 12 }}>💬 Buka chat WA</a>
                  </div>
                </div>
              )}
              {c.ai?.bukti && <div style={{ fontSize: 12, color: text, background: subtle, borderRadius: 6, padding: '6px 8px', fontStyle: 'italic' }}>“{c.ai.bukti}”</div>}
              <div style={{ fontSize: 11, color: muted, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span>📢 {c.adset_name || c.ad_headline || 'iklan'}</span>
                <span>🕒 klik {fmtTgl(c.ad_clicked_at)}</span>
                <span>💬 {c.jml_masuk}</span>
                {c.kontak_lama && <span style={{ color: '#b26a00' }}>↩ kontak lama</span>}
                {!c.deal && c.quotation && <span style={{ color: '#7F77DD' }}>🧾 quotation</span>}
              </div>
              {c.deal && (
                <div style={{ fontSize: 12, background: dark ? '#14281a' : '#EAF6EC', border: '1px solid ' + (dark ? '#2e5a3a' : '#bfe3c6'), borderRadius: 6, padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#2e7d32', fontWeight: 700 }}>💰 Purchase {rupiahSingkat(c.deal.deal_value)}</span>
                  <span style={{ color: muted, fontSize: 11, textAlign: 'right' }}>{c.deal.sumber === 'invoice' ? 'dari invoice' : 'dari quote'}{c.deal.kode_invoice ? ` · ${c.deal.kode_invoice}` : ''}</span>
                </div>
              )}
              <StatusMeta c={c} />
              <TombolKonfirmasi c={c} />
            </div>
          ))}
        </div>
      )}

      {/* Bottom sheet: isi chat */}
      {detail && (
        <div onClick={() => setDetail(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: dark ? '#1e1e2e' : '#fff', width: '100%', maxWidth: 640, maxHeight: '88vh', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column' }}>
            {detail.loading || !detail.conv ? <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div> : (
              <>
                <div style={{ padding: '12px 16px', borderBottom: border }}>
                  <div style={{ width: 40, height: 4, background: '#ccc', borderRadius: 2, margin: '0 auto 10px' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: text }}>{detail.conv.nama_kontak || detail.conv.nama_profil || `+${detail.conv.wa}`}</div>
                      <a href={`https://wa.me/${detail.conv.wa}`} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>+{detail.conv.wa}</a>
                    </div>
                    <Pil label={detail.conv.label_akhir} />
                  </div>
                  {detail.conv.ai?.alasan && <div style={{ fontSize: 12, color: muted, marginTop: 6 }}>{detail.conv.ai.alasan}</div>}
                </div>
                <div style={{ overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 6, background: dark ? '#14141f' : '#efeae2', flex: 1 }}>
                  {detail.pesan.map((p, i) => (
                    <div key={i} style={{ alignSelf: p.arah === 'masuk' ? 'flex-start' : 'flex-end', maxWidth: '82%', background: p.arah === 'masuk' ? (dark ? '#2a2a3a' : '#fff') : (dark ? '#1f4d3a' : '#d9fdd3'), color: text, borderRadius: 8, padding: '6px 9px', fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {p.text || <i style={{ color: muted }}>[{p.type}]</i>}
                      <div style={{ fontSize: 10, color: muted, textAlign: 'right', marginTop: 2 }}>{fmtTgl(p.timestamp)}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: 12, borderTop: border }}>
                  <TombolKonfirmasi c={detail.conv} besar />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
