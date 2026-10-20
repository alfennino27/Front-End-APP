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
// Kelompok segmen: B2B = tujuan iklan (deal ±3–4 bln), B2C = pembiaya bulanan. Mirror utils/segmenLead.js.
// Backend sudah mengirim c.segmen_kelompok (koreksi owner > AI); ini cadangan untuk data lama.
const SEGMEN_B2B = ['kantor_b2b', 'kontraktor_desainer', 'cafe_resto_hotel', 'reseller'];
const kelompokSegmen = (c) => c.segmen_kelompok !== undefined ? c.segmen_kelompok
  : (c.segmen_koreksi?.kelompok || (SEGMEN_B2B.includes(c.ai?.segmen) ? 'b2b' : c.ai?.segmen === 'rumah_tangga' ? 'b2c' : null));
const SEG = {
  b2b: { t: '🏢 B2B', c: '#0b5cad', bg: '#E3EEFB' },
  b2c: { t: '🏠 B2C', c: '#6b4f12', bg: '#F5EBD7' },
  null: { t: '? Segmen', c: '#777', bg: '#EEE' },
};
const NAMA_SEGMEN = { rumah_tangga: 'rumah tangga', cafe_resto_hotel: 'cafe/resto/hotel', kantor_b2b: 'kantor', kontraktor_desainer: 'kontraktor/desainer', reseller: 'reseller', lainnya: 'lainnya' };
const FILTER_SEG = [['', 'Semua'], ['b2b', '🏢 B2B'], ['b2c', '🏠 B2C'], ['belum', '? Belum']];

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
  const [segmen, setSegmen] = useState('');
  const [cari, setCari] = useState('');
  const [q, setQ] = useState(''); // nilai cari setelah jeda ketik
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sibuk, setSibuk] = useState(null);
  const [detail, setDetail] = useState(null); // { conv, pesan }

  const bulanAktif = bulan || new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 7);

  useEffect(() => { const t = setTimeout(() => setQ(cari.trim()), 400); return () => clearTimeout(t); }, [cari]);

  const muat = useCallback(() => {
    setLoading(true);
    fetch(`${baseUrl}/crm/lead-masuk?tab=${tab}&bulan=${bulanAktif}${segmen ? `&segmen=${segmen}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`)
      .then((r) => r.json()).then((d) => setList(Array.isArray(d) ? d : [])).catch(() => setList([])).finally(() => setLoading(false));
  }, [baseUrl, tab, bulanAktif, segmen, q]);
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

  // Koreksi segmen 1 tap. kelompok null = kembali ke tebakan AI. Update lokal dulu supaya terasa instan.
  const ubahSegmen = async (c, kelompok) => {
    const terapkan = (x) => (x.wa === c.wa ? { ...x, segmen_koreksi: kelompok ? { kelompok } : null, segmen_kelompok: kelompok ?? (SEGMEN_B2B.includes(x.ai?.segmen) ? 'b2b' : x.ai?.segmen === 'rumah_tangga' ? 'b2c' : null) } : x);
    setList((l) => l.map(terapkan));
    setDetail((d) => (d?.conv?.wa === c.wa ? { ...d, conv: terapkan(d.conv) } : d));
    const r = await fetch(`${baseUrl}/crm/lead-masuk/${c.wa}/segmen`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kelompok, uid: uidSaya() }),
    }).then((x) => x.json()).catch((e) => ({ message: e.message }));
    if (r.message) { alert(r.message); muat(); }
    onBerubah && onBerubah();
  };

  const bukaChat = async (wa) => {
    setDetail({ loading: true });
    const d = await fetch(`${baseUrl}/crm/lead-masuk/${wa}/chat`).then((r) => r.json()).catch(() => null);
    setDetail(d);
  };

  const subtle = dark ? '#252535' : '#f6f7fb';
  const Pil = ({ label }) => { const L = LABEL[label]; return L ? <span style={{ fontSize: 10, fontWeight: 700, color: L.c, background: L.bg, padding: '2px 7px', borderRadius: 10 }}>{L.t}</span> : null; };

  // Badge segmen di kartu: tap = tukar B2B ⇄ B2C (yang belum diketahui → B2B).
  const BadgeSegmen = ({ c }) => {
    const k = kelompokSegmen(c);
    const S = SEG[k];
    const dikoreksi = !!c.segmen_koreksi?.kelompok;
    return (
      <button className="no-active" title={`${c.ai?.segmen ? `AI: ${NAMA_SEGMEN[c.ai.segmen] || c.ai.segmen}` : 'AI belum tahu segmennya'}${dikoreksi ? ' · dikoreksi' : ''} — tap untuk ganti B2B/B2C`}
        onClick={(e) => { e.stopPropagation(); ubahSegmen(c, k === 'b2b' ? 'b2c' : 'b2b'); }}
        style={{ border: 'none', fontSize: 10, fontWeight: 700, color: S.c, background: S.bg, padding: '3px 8px', borderRadius: 10, cursor: 'pointer', minHeight: 22 }}>
        {S.t}{dikoreksi ? ' ✎' : ''}
      </button>
    );
  };

  // Di bottom sheet: pilihan eksplisit + kembali ke AI
  const PilihSegmen = ({ c }) => {
    const k = kelompokSegmen(c);
    const dikoreksi = !!c.segmen_koreksi?.kelompok;
    const gaya = (aktif) => ({ flex: 1, border: '1px solid #013175', background: aktif ? '#013175' : 'none', color: aktif ? '#fff' : '#013175', borderRadius: 8, padding: '8px 0', fontWeight: 600, fontSize: 13, cursor: 'pointer' });
    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 11, color: muted, marginBottom: 4 }}>
          Segmen{c.ai?.segmen ? ` · AI: ${NAMA_SEGMEN[c.ai.segmen] || c.ai.segmen}` : ' · AI belum tahu'}{dikoreksi ? ' · dikoreksi' : ''}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="no-active" style={gaya(k === 'b2b')} onClick={() => ubahSegmen(c, 'b2b')}>🏢 B2B</button>
          <button className="no-active" style={gaya(k === 'b2c')} onClick={() => ubahSegmen(c, 'b2c')}>🏠 B2C</button>
          {dikoreksi && <button className="no-active" style={{ ...gaya(false), flex: '0 0 auto', padding: '8px 10px', fontWeight: 400 }} onClick={() => ubahSegmen(c, null)}>Ikut AI</button>}
        </div>
      </div>
    );
  };

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
    // InitiateCheckout = kembaran QualifiedLead untuk optimasi ad set Sales
    const ic = (c.konfirmasi?.keputusan === 'serius') ? statusEvent(c, 'InitiateCheckout') : null;
    const pu = c.deal ? statusEvent(c, 'Purchase') : null;
    if (!ql && !pu) return null;
    const teks = { ok: '✓', gagal: '✗ gagal', basi: '– tidak dikirim (klik > 28 hr)', antre: '⏳ antre' };
    const warna = { ok: '#1877F2', gagal: '#a32d2d', basi: muted, antre: '#b26a00' };
    return (
      <div style={{ fontSize: 11, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ color: muted }}>Meta:</span>
        {ql && <span style={{ color: warna[ql] }}>{teks[ql]} Qualified Lead</span>}
        {ic && <span style={{ color: warna[ic] }} title="Kembaran Qualified Lead — target optimasi iklan">{teks[ic]} Initiate Checkout</span>}
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
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <input type="search" value={cari} onChange={(e) => setCari(e.target.value)} placeholder="🔍 Cari nomor WA / nama kontak"
          style={{ width: '100%', boxSizing: 'border-box', padding: '10px 36px 10px 12px', fontSize: 16, borderRadius: 10, border: `1px solid ${dark ? '#444' : '#ddd'}`, background: cardBg, color: text }} />
        {cari && <button className="no-active" onClick={() => setCari('')} aria-label="Hapus pencarian"
          style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: muted, fontSize: 18, width: 32, height: 32, cursor: 'pointer' }}>×</button>}
      </div>
      {q && <div style={{ fontSize: 12, color: muted, marginBottom: 8 }}>Hasil cari “{q}” di <b>semua chat WA</b> (bulan & status apa pun, termasuk yang bukan dari iklan) — tab di bawah diabaikan selama mencari.</div>}

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 6, opacity: q ? 0.45 : 1 }}>
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className="no-active"
            style={{ whiteSpace: 'nowrap', border: 'none', borderRadius: 16, padding: '7px 14px', fontSize: 13, cursor: 'pointer', background: tab === k ? '#013175' : subtle, color: tab === k ? '#fff' : text }}>{l}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 12 }}>
        {FILTER_SEG.map(([k, l]) => (
          <button key={k || 'semua'} onClick={() => setSegmen(k)} className="no-active"
            style={{ whiteSpace: 'nowrap', border: `1px solid ${segmen === k ? '#013175' : (dark ? '#444' : '#ddd')}`, borderRadius: 14, padding: '5px 12px', fontSize: 12, cursor: 'pointer', background: 'none', color: segmen === k ? '#013175' : muted, fontWeight: segmen === k ? 700 : 400 }}>{l}</button>
        ))}
      </div>

      {tab === 'purchase' && !loading && list.length > 0 && (
        <div style={{ fontSize: 13, color: text, marginBottom: 10 }}>
          <b>{list.length}</b> chat iklan jadi purchase · total <b>{rupiahSingkat(totalPurchase)}</b>
          <span style={{ color: muted }}> — nilai dari Quote berstatus Deal (subtotal − diskon), dikirim ke Meta sebagai event Purchase.</span>
        </div>
      )}
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div> : list.length === 0 ? (
        <div style={{ textAlign: 'center', color: muted, padding: 40 }}>{q ? 'Tidak ada chat WA dengan nomor / nama ini.' : tab === 'kandidat' ? 'Tidak ada yang perlu dikonfirmasi 🎉' : tab === 'followup' ? 'Semua lead bagus sudah di-follow up 👍' : 'Kosong.'}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 10 }}>
          {list.map((c) => (
            <div key={c.wa} onClick={() => bukaChat(c.wa)} style={{ background: cardBg, border, borderRadius: 12, padding: 14, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700, color: text, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nama_kontak || c.nama_profil || `+${c.wa}`}</span>
                <span style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
                  {c.konfirmasi && <span title="Sudah dikonfirmasi" style={{ fontSize: 10, color: muted }}>✔︎</span>}
                  <BadgeSegmen c={c} />
                  <Pil label={c.label_akhir} />
                </span>
              </div>
              {c.ai?.produk && <div style={{ fontSize: 13, color: text }}>🪑 {c.ai.produk}{c.ai.kota ? ` · 📍 ${c.ai.kota}` : ''}</div>}
              {c.ai?.b2b_prospek && c.label_akhir !== 'serius' && <div style={{ fontSize: 11, color: '#0b5cad', fontWeight: 600 }}>🏢 Prospek B2B — biasanya order 3–4 bulan lagi, follow-up berkala</div>}
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
              {c.dari_iklan === false && (
                <div style={{ fontSize: 12, color: '#b26a00', background: dark ? '#2a2614' : '#FFF8E1', borderRadius: 6, padding: '6px 8px' }}>
                  ⚠️ Bukan dari klik iklan WA (tanpa data klik, mis. DM/profil IG) — tidak dinilai AI & tidak bisa dikirim ke Meta. Chat pertama {fmtTgl(c.first_at)}.
                </div>
              )}
              <div style={{ fontSize: 11, color: muted, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {c.dari_iklan !== false && <span>📢 {c.adset_name || c.ad_headline || 'iklan'}</span>}
                {c.dari_iklan !== false && <span>🕒 klik {fmtTgl(c.ad_clicked_at)}</span>}
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
              {c.crm_lead !== undefined && (
                <div style={{ fontSize: 12, fontWeight: 600, color: c.crm_lead ? '#2e7d32' : '#a32d2d' }}>
                  {c.crm_lead ? `📇 Sudah di CRM · stage ${c.crm_lead.stage}${c.crm_lead.kode_invoice ? ` · ${c.crm_lead.kode_invoice}` : ''}` : '📇 Belum masuk CRM'}
                </div>
              )}
              <StatusMeta c={c} />
              {c.dari_iklan !== false && <TombolKonfirmasi c={c} />}
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
                  <PilihSegmen c={detail.conv} />
                </div>
                <div style={{ overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 6, background: dark ? '#14141f' : '#efeae2', flex: 1 }}>
                  {detail.pesan.map((p, i) => (
                    <div key={i} style={{ alignSelf: p.arah === 'masuk' ? 'flex-start' : 'flex-end', maxWidth: '82%', background: p.arah === 'masuk' ? (dark ? '#2a2a3a' : '#fff') : (dark ? '#1f4d3a' : '#d9fdd3'), color: text, borderRadius: 8, padding: '6px 9px', fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {p.text || <i style={{ color: muted }}>[{p.type}]</i>}
                      <div style={{ fontSize: 10, color: muted, textAlign: 'right', marginTop: 2 }}>{fmtTgl(p.timestamp)}</div>
                    </div>
                  ))}
                </div>
                {detail.conv.dari_iklan !== false && (
                  <div style={{ padding: 12, borderTop: border }}>
                    <TombolKonfirmasi c={detail.conv} besar />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
