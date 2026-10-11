// Catatan perubahan iklan otomatis dari log aktivitas Meta (budget, nyala/mati, targeting,
// iklan baru, status akun/tagihan). Dilipat secara default supaya bagian Evaluasi tetap ringkas.
// Backend: GET /crm/meta/aktivitas (KLF-Server routes/crm/leadMasuk.js, utils/metaAktivitas.js).
import React, { useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';

const IKON = {
  ad_account_update_status: '💳', update_ad_set_budget: '💰', update_campaign_budget: '💰',
  update_ad_set_run_status: '⏯', update_ad_run_status: '⏯', update_campaign_run_status: '⏯',
  update_ad_set_target_spec: '🎯', update_ad_set_optimization_goal: '⚙️', update_ad_set_bid_strategy: '⚙️',
  update_ad_set_duration: '📅', update_ad_creative: '🎨', create_ad: '🆕', create_ad_set: '🆕', create_campaign_group: '🆕',
};

export default function PerubahanMeta({ baseUrl, bulan, dark, text, muted, cardBg, border }) {
  const [buka, setBuka] = useState(false);
  const [data, setData] = useState(null);
  const bulanAktif = bulan || new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 7);

  useEffect(() => {
    if (!buka) return;
    setData(null);
    fetch(`${baseUrl}/crm/meta/aktivitas?bulan=${bulanAktif}`).then((r) => r.json()).then(setData).catch(() => setData({ aktivitas: [], review_ulang: 0 }));
  }, [buka, baseUrl, bulanAktif]);

  const perHari = {};
  (data?.aktivitas || []).forEach((a) => {
    const k = new Date(a.waktu).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
    (perHari[k] ||= []).push(a);
  });
  const tagihan = (data?.aktivitas || []).filter((a) => a.jenis === 'ad_account_update_status' && !/→ Active$/.test(a.perubahan || '')).length;

  return (
    <div style={{ background: cardBg, border, borderRadius: 12, padding: 14, marginBottom: 14 }}>
      <button onClick={() => setBuka(!buka)} className="no-active" style={{ border: 'none', background: 'none', padding: 0, width: '100%', textAlign: 'left', cursor: 'pointer', color: text }}>
        <span style={{ fontWeight: 700 }}>🔧 Perubahan di Meta</span>
        <span style={{ fontSize: 12, color: muted }}> · otomatis dari log aktivitas · {bulanAktif}</span>
        <span style={{ float: 'right', color: '#013175' }}>{buka ? '▴' : '▾'}</span>
      </button>
      {buka && (!data ? <div style={{ textAlign: 'center', padding: 16 }}><Spinner size="sm" /></div> : (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: text, marginBottom: 10 }}>
            <span>Perubahan: <b>{data.aktivitas.length}</b></span>
            <span title="Tiap edit membuat iklan direview ulang & fase belajar bisa mulai dari awal">Review ulang karena edit: <b>{data.review_ulang}</b></span>
            {tagihan > 0 && <span style={{ color: '#a32d2d' }}>💳 Akun sempat berhenti karena tagihan: <b>{tagihan}×</b></span>}
          </div>
          {data.aktivitas.length === 0 && <div style={{ color: muted, fontSize: 12 }}>Tidak ada perubahan tercatat.</div>}
          <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(perHari).map(([hari, list]) => (
              <div key={hari}>
                <div style={{ fontSize: 11, fontWeight: 700, color: muted, marginBottom: 4 }}>{hari}</div>
                {list.map((a, i) => (
                  <div key={i} style={{ fontSize: 12, color: text, padding: '3px 0', display: 'flex', gap: 6, background: a.jenis === 'ad_account_update_status' && !/→ Active$/.test(a.perubahan || '') ? (dark ? '#2a1717' : '#fdeeee') : 'none', borderRadius: 4 }}>
                    <span>{IKON[a.jenis] || '•'}</span>
                    <span>
                      <b>{a.judul}</b>{a.objek_nama ? ` — ${a.objek_nama}` : ''}
                      {a.perubahan && a.perubahan.length < 90 && <span style={{ color: muted }}> ({a.perubahan})</span>}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
