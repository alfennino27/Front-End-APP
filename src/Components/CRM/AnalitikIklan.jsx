// Bagian "hasil uang & tren" di tab Analitik CRM:
//   - Funnel dari data chat iklan (chat → kasih ukuran → serius → quotation → deal) + biaya per tahap
//   - Tren 6 bulan: Spend vs GP from Ads, dan Biaya/Lead Serius vs target (+ hari iklan berhenti karena tagihan)
//   - Detail: Ads vs Organic vs Repeat, lama klik → deal
// Backend: GET /crm/lead-masuk/ringkasan & /crm/lead-masuk/tren (KLF-Server routes/crm/leadMasuk.js).
import React, { useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';

const rb = (n) => (n == null ? '-' : Math.abs(n) >= 1e6 ? `${(n / 1e6).toFixed(1).replace('.', ',')} jt` : `${Math.round(n / 1000)} rb`);
const NAMA_BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const labelBulan = (b) => NAMA_BULAN[Number(b.slice(5, 7)) - 1];

// Warna seri (palet tervalidasi: slot 1 biru & slot 3 aqua, langkah terang/gelap terpisah)
const warna = (dark) => ({ spend: dark ? '#3987e5' : '#2a78d6', gp: dark ? '#199e70' : '#1baf7a', grid: dark ? '#333' : '#ececec' });

function GrafikBatang({ bulan, seri, dark, text, muted, target, labelTarget, catatanBawah }) {
  const [hover, setHover] = useState(null);
  const W = 600, H = 190, kiri = 8, bawah = 26, atas = 18;
  const nilaiMaks = Math.max(1, target || 0, ...bulan.flatMap((b) => seri.map((s) => Math.max(0, b[s.key] || 0))));
  const lebarGrup = (W - kiri) / bulan.length;
  const lebarBatang = Math.min(34, (lebarGrup - 14) / seri.length);
  const y = (v) => atas + (H - atas - bawah) * (1 - Math.max(0, v) / nilaiMaks);
  const c = warna(dark);
  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img">
        <line x1={kiri} x2={W} y1={H - bawah} y2={H - bawah} stroke={c.grid} />
        {target != null && (
          <g>
            <line x1={kiri} x2={W} y1={y(target)} y2={y(target)} stroke={muted} strokeDasharray="4 4" />
            <text x={W - 4} y={y(target) - 4} textAnchor="end" fontSize="10" fill={muted}>{labelTarget}</text>
          </g>
        )}
        {bulan.map((b, i) => {
          const x0 = kiri + i * lebarGrup + (lebarGrup - lebarBatang * seri.length - 2 * (seri.length - 1)) / 2;
          return (
            <g key={b.bulan} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(hover === i ? null : i)} style={{ cursor: 'pointer' }}>
              <rect x={kiri + i * lebarGrup} y={0} width={lebarGrup} height={H} fill={hover === i ? (dark ? '#ffffff08' : '#00000006') : 'transparent'} />
              {seri.map((s, j) => {
                const v = b[s.key];
                if (v == null) return null;
                const tinggi = Math.max(2, H - bawah - y(v));
                return <rect key={s.key} x={x0 + j * (lebarBatang + 2)} y={H - bawah - tinggi} width={lebarBatang} height={tinggi} rx={4} fill={s.warna} opacity={b.data_parsial && s.parsialRedup ? 0.35 : 1} />;
              })}
              <text x={kiri + i * lebarGrup + lebarGrup / 2} y={H - 9} textAnchor="middle" fontSize="11" fill={text}>{labelBulan(b.bulan)}{b.data_parsial && seri.some((s) => s.parsialRedup) ? '*' : ''}</text>
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <div style={{ position: 'absolute', top: 0, left: `${Math.min(70, (hover / bulan.length) * 100)}%`, background: dark ? '#2a2a3a' : '#fff', border: `1px solid ${c.grid}`, borderRadius: 8, padding: '6px 10px', fontSize: 12, color: text, pointerEvents: 'none', boxShadow: '0 2px 8px rgba(0,0,0,.12)' }}>
          <div style={{ fontWeight: 700 }}>{labelBulan(bulan[hover].bulan)} {bulan[hover].bulan.slice(0, 4)}</div>
          {seri.map((s) => <div key={s.key}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: s.warna, marginRight: 6 }} />{s.label}: <b>{rb(bulan[hover][s.key])}</b></div>)}
          {catatanBawah && <div style={{ color: muted }}>{catatanBawah(bulan[hover])}</div>}
        </div>
      )}
    </div>
  );
}

export default function AnalitikIklan({ baseUrl, bulan, leads, getLeadMonthMasuk, dark, text, muted, cardBg, border }) {
  const [ringkas, setRingkas] = useState(null);
  const [tren, setTren] = useState(null);
  const [lihatAngka, setLihatAngka] = useState(false);
  const bulanAktif = bulan || new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 7);
  const c = warna(dark);

  useEffect(() => {
    setRingkas(null); setTren(null);
    fetch(`${baseUrl}/crm/lead-masuk/ringkasan?bulan=${bulanAktif}`).then((r) => r.json()).then(setRingkas).catch(() => {});
    fetch(`${baseUrl}/crm/lead-masuk/tren?bulan=${bulanAktif}&n=6`).then((r) => r.json()).then(setTren).catch(() => {});
  }, [baseUrl, bulanAktif]);

  if (!ringkas || !tren) return <div style={{ textAlign: 'center', padding: 30 }}><Spinner size="sm" /></div>;
  const r = ringkas.ringkas;

  // GP from Ads per bulan (Model B: bulan lead masuk; new customer dari campaign saja)
  const gpAds = (b) => leads.filter((l) => l.stage === 'deal' && l.campaign_id && !l.is_repeat_order && getLeadMonthMasuk(l) === b).reduce((s, l) => s + (l.gross_profit || 0), 0);
  const bulanTren = tren.bulan.map((b) => ({ ...b, gp_ads: gpAds(b.bulan) }));
  const adaParsial = bulanTren.some((b) => b.data_parsial);

  const tahapFunnel = [
    { label: 'Chat dari iklan', n: r.chat, biaya: r.spend && r.chat ? r.spend / r.chat : null, ket: 'biaya/chat' },
    { label: 'Kasih ukuran', n: r.lolos_ukuran },
    { label: 'Lead serius', n: r.serius, biaya: r.biaya_per_serius, ket: 'biaya/serius' },
    { label: 'Quotation', n: r.quotation },
    { label: 'Deal', n: r.deal, biaya: r.deal ? r.spend / r.deal : null, ket: 'biaya/deal' },
  ];
  const maksN = Math.max(1, r.chat);

  // Sumber deal bulan ini
  const dealBulan = leads.filter((l) => l.stage === 'deal' && getLeadMonthMasuk(l) === bulanAktif);
  const sumber = [
    ['Iklan (new customer)', dealBulan.filter((l) => l.campaign_id && !l.is_repeat_order)],
    ['Organic', dealBulan.filter((l) => !l.campaign_id && !l.is_repeat_order)],
    ['Repeat order', dealBulan.filter((l) => l.is_repeat_order)],
  ];

  const judul = (t, sub) => <div style={{ marginBottom: 10 }}><div style={{ fontSize: 11, fontWeight: 700, color: muted, letterSpacing: 1 }}>{t}</div>{sub && <div style={{ fontSize: 11, color: muted }}>{sub}</div>}</div>;
  const kotak = { background: cardBg, border, borderRadius: 12, padding: 18, marginBottom: 16 };

  return (
    <>
      {/* Funnel dari data chat */}
      <div style={kotak}>
        {judul(`FUNNEL IKLAN · ${bulanAktif}`, 'Dari chat WhatsApp iklan (dinilai AI + konfirmasi Anda)')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tahapFunnel.map((t, i) => (
            <div key={t.label} style={{ display: 'grid', gridTemplateColumns: 'minmax(96px,130px) 1fr minmax(70px,auto)', alignItems: 'center', gap: 10, fontSize: 13 }}>
              <span style={{ color: text }}>{t.label}</span>
              <div style={{ background: dark ? '#252535' : '#f2f4f8', borderRadius: 4, height: 22, position: 'relative' }}>
                <div style={{ width: `${Math.max(2, (100 * t.n) / maksN)}%`, height: 22, borderRadius: 4, background: c.spend, opacity: 1 - i * 0.13 }} />
                <span style={{ position: 'absolute', left: 8, top: 2, fontWeight: 700, color: (100 * t.n) / maksN > 18 ? '#fff' : text }}>{t.n}{i > 0 && r.chat ? <span style={{ fontWeight: 400 }}> · {Math.round((100 * t.n) / r.chat)}%</span> : ''}</span>
              </div>
              <span style={{ fontSize: 11, color: muted, textAlign: 'right' }}>{t.biaya ? <>{rb(t.biaya)}<br />{t.ket}</> : ''}</span>
            </div>
          ))}
        </div>
        {r.chat_versi_meta && r.chat < r.chat_versi_meta * 0.8 && <div style={{ fontSize: 11, color: muted, marginTop: 8 }}>ℹ️ Riwayat chat bulan ini belum lengkap ({r.chat} dari {r.chat_versi_meta} versi Meta) — persentase indikatif.</div>}
      </div>

      {/* Tren */}
      <div style={kotak}>
        {judul('TREN 6 BULAN', 'Ketuk batang untuk angka')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 22 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: text, marginBottom: 2 }}>Spend vs GP from Ads</div>
            <div style={{ fontSize: 11, color: muted, marginBottom: 6, display: 'flex', gap: 12 }}>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: c.spend, marginRight: 4 }} />Spend</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: c.gp, marginRight: 4 }} />GP from Ads</span>
            </div>
            <GrafikBatang bulan={bulanTren} seri={[{ key: 'spend', label: 'Spend', warna: c.spend }, { key: 'gp_ads', label: 'GP from Ads', warna: c.gp }]} dark={dark} text={text} muted={muted}
              catatanBawah={(b) => `GP − Spend: ${rb(b.gp_ads - b.spend)}`} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: text, marginBottom: 2 }}>Biaya per Lead Serius</div>
            <div style={{ fontSize: 11, color: muted, marginBottom: 6 }}>Garis putus-putus = target {rb(r.target_biaya_serius)}{adaParsial ? ' · * data chat belum lengkap' : ''}</div>
            <GrafikBatang bulan={bulanTren} seri={[{ key: 'biaya_per_serius', label: 'Biaya/serius', warna: c.spend, parsialRedup: true }]} dark={dark} text={text} muted={muted}
              target={r.target_biaya_serius} labelTarget={`target ${rb(r.target_biaya_serius)}`}
              catatanBawah={(b) => `${b.serius} serius dari ${b.chat} chat`} />
          </div>
        </div>
        <div style={{ marginTop: 14, fontSize: 12, color: text }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>💳 Hari iklan berhenti karena tagihan</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {bulanTren.map((b) => (
              <span key={b.bulan} style={{ padding: '3px 8px', borderRadius: 6, background: b.hari_berhenti_tagihan >= 3 ? (dark ? '#2a1717' : '#fdeeee') : (dark ? '#252535' : '#f2f4f8') }}>
                {labelBulan(b.bulan)}: <b>{b.hari_berhenti_tagihan}</b> hari{b.hari_berhenti_tagihan >= 3 ? ' ⚠️' : ''}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 11, color: muted, marginTop: 4 }}>Saat akun "Payment Needed", iklan berhenti tayang dan Meta kehilangan momentum belajarnya.</div>
        </div>
        <button onClick={() => setLihatAngka(!lihatAngka)} className="no-active" style={{ marginTop: 10, border: 'none', background: 'none', color: '#013175', fontSize: 12, padding: 0, cursor: 'pointer' }}>{lihatAngka ? 'Sembunyikan tabel ▴' : 'Lihat tabel angka ▾'}</button>
        {lihatAngka && (
          <div style={{ overflowX: 'auto', marginTop: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: text }}>
              <thead><tr style={{ color: muted, textAlign: 'right' }}>{['Bulan', 'Spend', 'Chat', 'Serius', 'Biaya/serius', 'Deal', 'GP Ads', 'GP − Spend', 'Berhenti'].map((h, i) => <th key={h} style={{ padding: '4px 6px', textAlign: i ? 'right' : 'left', fontWeight: 600 }}>{h}</th>)}</tr></thead>
              <tbody>{bulanTren.map((b) => (
                <tr key={b.bulan} style={{ borderTop: `1px solid ${c.grid}`, textAlign: 'right' }}>
                  <td style={{ padding: '5px 6px', textAlign: 'left' }}>{b.bulan}{b.data_parsial ? '*' : ''}</td>
                  <td style={{ padding: '5px 6px' }}>{rb(b.spend)}</td><td style={{ padding: '5px 6px' }}>{b.chat}</td><td style={{ padding: '5px 6px' }}>{b.serius}</td>
                  <td style={{ padding: '5px 6px' }}>{rb(b.biaya_per_serius)}</td><td style={{ padding: '5px 6px' }}>{b.deal}</td>
                  <td style={{ padding: '5px 6px' }}>{rb(b.gp_ads)}</td><td style={{ padding: '5px 6px' }}>{rb(b.gp_ads - b.spend)}</td><td style={{ padding: '5px 6px' }}>{b.hari_berhenti_tagihan} hr</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sumber deal & lama klik→deal */}
      <div style={kotak}>
        {judul(`SUMBER DEAL · ${bulanAktif}`, 'Berdasarkan bulan lead masuk')}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, color: text }}>
            <thead><tr style={{ color: muted, fontSize: 11, textAlign: 'right' }}><th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 600 }}>Sumber</th>{['Deal', 'Revenue', 'Gross profit'].map((h) => <th key={h} style={{ padding: '4px 6px', fontWeight: 600 }}>{h}</th>)}</tr></thead>
            <tbody>{sumber.map(([nama, ls]) => (
              <tr key={nama} style={{ borderTop: `1px solid ${c.grid}`, textAlign: 'right' }}>
                <td style={{ padding: '6px', textAlign: 'left' }}>{nama}</td><td style={{ padding: '6px' }}>{ls.length}</td>
                <td style={{ padding: '6px' }}>{rb(ls.reduce((s, l) => s + (l.deal_value || 0), 0))}</td><td style={{ padding: '6px' }}>{rb(ls.reduce((s, l) => s + (l.gross_profit || 0), 0))}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {tren.klik_ke_deal?.jumlah > 0 && (
          <div style={{ fontSize: 12, color: text, marginTop: 10 }}>⏱ Lama klik iklan → deal: median <b>{tren.klik_ke_deal.median_hari} hari</b> (terlama {tren.klik_ke_deal.maks_hari} hari, dari {tren.klik_ke_deal.jumlah} deal). Jangan menilai campaign sebelum lewat waktu ini.</div>
        )}
      </div>
    </>
  );
}
