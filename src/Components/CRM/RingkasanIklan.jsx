// Ringkasan evaluasi iklan untuk tab Kampanye CRM.
// Level 1 = kartu ringkas (selalu tampil). Level 2 = detail, tersembunyi di tombol "Lihat detail".
// Data: GET /crm/lead-masuk/ringkasan (KLF-Server routes/crm/leadMasuk.js) — chat WA iklan + spend Meta.
import React, { useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';

const fmtRp = (n) => (n == null ? '-' : 'Rp ' + Math.round(n).toLocaleString('id-ID'));
const fmtMenit = (m) => (m == null ? '-' : m < 60 ? `${m} mnt` : m < 1440 ? `${(m / 60).toFixed(1).replace('.', ',').replace(',0', '')} jam` : `${Math.round(m / 1440)} hari`);
const fmtRb = (n) => (n == null ? '-' : n >= 1e6 ? (n / 1e6).toFixed(1).replace('.', ',') + ' jt' : Math.round(n / 1000) + ' rb');

const NAMA_TAHAP = {
  salam_lokasi: 'Salam / tanya lokasi',
  tanya_harga: 'Tanya harga (belum kasih ukuran)',
  kasih_ukuran: 'Kasih ukuran (belum dapat harga)',
  terima_harga: 'Terima harga lalu berhenti',
  diskusi_lanjut: 'Diskusi lanjut setelah harga',
  quotation: 'Quotation',
  deal: 'Deal',
};
const NAMA_GAGAL = {
  menghilang_sebelum_ukuran: 'Hilang sebelum kasih ukuran',
  diam_setelah_harga: 'Diam setelah dapat harga',
  harga_tidak_cocok: 'Harga tidak cocok',
  ukuran_atau_produk_tidak_cocok: 'Produk/ukuran tidak cocok',
  lokasi: 'Lokasi',
  waktu: 'Waktu',
  salah_sasaran: 'Salah sasaran',
  lainnya: 'Lainnya',
};
const NAMA_SEGMEN = {
  rumah_tangga: 'Rumah tangga', cafe_resto_hotel: 'Cafe / resto / hotel', kantor_b2b: 'Kantor / B2B',
  kontraktor_desainer: 'Kontraktor / desainer', reseller: 'Reseller', lainnya: 'Lainnya',
};

export default function RingkasanIklan({ baseUrl, bulan, dark, text, muted, cardBg, border }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [buka, setBuka] = useState(false);
  const [bagian, setBagian] = useState('campaign');
  const [campBuka, setCampBuka] = useState({});

  const bulanAktif = bulan || new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 7);

  useEffect(() => {
    setLoading(true);
    fetch(`${baseUrl}/crm/lead-masuk/ringkasan?bulan=${bulanAktif}`)
      .then((r) => r.json()).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [baseUrl, bulanAktif]);

  if (loading) return <div style={{ textAlign: 'center', padding: 20 }}><Spinner size="sm" /></div>;
  if (!data?.ringkas) return null;
  const r = data.ringkas;
  if (!r.chat && !r.spend) return null;

  const merah = '#a32d2d', hijau = '#2e7d32', biru = '#013175';
  const warnaTarget = r.status_target === 'hijau' ? hijau : r.status_target === 'merah' ? merah : muted;
  const cakupan = r.chat_versi_meta ? Math.round((100 * r.chat) / r.chat_versi_meta) : 100;
  const tahapBerhenti = (data.tahap || []).filter((t) => !['diskusi_lanjut', 'quotation', 'deal'].includes(t.nama));
  const terbesar = tahapBerhenti.sort((a, b) => b.jumlah - a.jumlah)[0];
  const subtle = dark ? '#252535' : '#f6f7fb';
  const bl = r.balas || {};
  const warnaBalas = bl.median_jam_kerja == null ? muted : bl.median_jam_kerja <= bl.target_menit ? hijau : bl.median_jam_kerja <= 30 ? '#b26a00' : merah;

  const Angka = ({ label, nilai, warna, sub }) => (
    <div style={{ flex: '1 1 120px', minWidth: 110 }}>
      <div style={{ fontSize: 11, color: muted }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 700, color: warna || text, lineHeight: 1.25 }}>{nilai}</div>
      {sub && <div style={{ fontSize: 11, color: muted }}>{sub}</div>}
    </div>
  );

  const Bar = ({ items, total, nama = (x) => x, warna = biru }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.length === 0 && <div style={{ color: muted, fontSize: 12 }}>Belum ada data.</div>}
      {items.map((it) => {
        const pct = total ? Math.round((100 * it.jumlah) / total) : 0;
        return (
          <div key={it.nama} style={{ fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: text }}>
              <span>{nama(it.nama)}</span><span style={{ color: muted }}>{it.jumlah} · {pct}%</span>
            </div>
            <div style={{ height: 6, background: subtle, borderRadius: 3 }}>
              <div style={{ width: `${pct}%`, height: 6, background: warna, borderRadius: 3 }} />
            </div>
          </div>
        );
      })}
    </div>
  );

  const BarisMetrik = ({ x, nama, sub, onClick, indent }) => (
    <tr onClick={onClick} style={{ borderBottom: '1px solid ' + (dark ? '#2a2a2a' : '#f0f0f0'), cursor: onClick ? 'pointer' : 'default' }}>
      <td style={{ padding: '7px 6px', paddingLeft: indent ? 22 : 6, color: text, fontWeight: indent ? 400 : 600 }}>
        {nama}{sub && <div style={{ fontSize: 10, color: muted }}>{sub}</div>}
      </td>
      <td style={{ padding: '7px 6px', textAlign: 'right' }}>{fmtRb(x.spend)}</td>
      <td style={{ padding: '7px 6px', textAlign: 'right' }}>{x.chat}</td>
      <td style={{ padding: '7px 6px', textAlign: 'right' }}>{x.pct_lolos_ukuran}%</td>
      <td style={{ padding: '7px 6px', textAlign: 'right' }}>{x.serius}</td>
      <td style={{ padding: '7px 6px', textAlign: 'right', fontWeight: 700, color: x.biaya_per_serius == null ? muted : x.biaya_per_serius <= r.target_biaya_serius ? hijau : merah }}>{fmtRb(x.biaya_per_serius)}</td>
      <td style={{ padding: '7px 6px', textAlign: 'right' }}>{x.deal}</td>
    </tr>
  );
  const KepalaTabel = ({ pertama }) => (
    <thead><tr style={{ color: muted, fontSize: 11, textAlign: 'right' }}>
      <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 600 }}>{pertama}</th>
      {['Spend', 'Chat', 'Lolos ukuran', 'Serius', 'Biaya/serius', 'Deal'].map((h) => <th key={h} style={{ padding: '4px 6px', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>)}
    </tr></thead>
  );

  const TABS = [['campaign', 'Campaign'], ['tahap', 'Tahap berhenti'], ['iklan', 'Per iklan'], ['pasar', 'Produk · Kota · Segmen'], ['gagal', 'Alasan gagal & jam'], ['balas', 'Kecepatan balas']];

  return (
    <div style={{ background: cardBg, border, borderRadius: 12, padding: 16, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ fontWeight: 700, color: text }}>Ringkasan iklan · {bulanAktif}</div>
        <div style={{ fontSize: 11, color: muted }}>chat WhatsApp + spend Meta otomatis</div>
      </div>

      {/* ── Level 1 ── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <Angka label="Biaya / Lead Serius" nilai={fmtRb(r.biaya_per_serius)} warna={warnaTarget} sub={`target ${fmtRb(r.target_biaya_serius)}`} />
        <Angka label="Lead Serius" nilai={`${r.serius} / ${r.chat}`} sub={`${r.pct_serius}% dari chat${r.ql_per_juta != null ? ` · ${String(r.ql_per_juta).replace('.', ',')} per Rp1 jt` : ''}`} />
        <Angka label="QL 🏢 B2B · 🏠 B2C" nilai={`${r.ql_b2b ?? 0} · ${r.ql_b2c ?? 0}`} warna={biru}
          sub={`porsi B2B ${r.pct_ql_b2b ?? 0}%${r.ql_segmen_belum ? ` · ${r.ql_segmen_belum} belum tahu` : ''}`} />
        <Angka label="Deal dari iklan" nilai={r.deal} sub={r.revenue ? fmtRb(r.revenue) : null} />
        <Angka label="Balas pertama (jam kerja)" nilai={fmtMenit(bl.median_jam_kerja)} warna={warnaBalas}
          sub={`median · target ≤${bl.target_menit ?? 5} mnt${bl.pct_tepat_target_jam_kerja != null ? ` · ${bl.pct_tepat_target_jam_kerja}% tepat` : ''}`} />
        <Angka label="GP − Spend" nilai={fmtRb(r.gp_minus_spend)} warna={r.gp_minus_spend >= 0 ? hijau : merah} sub={`spend ${fmtRb(r.spend)}`} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
        {terbesar && r.chat > 0 && (
          <div style={{ color: text }}>⚠️ {Math.round((100 * terbesar.jumlah) / r.dinilai)}% chat berhenti di tahap <b>{(NAMA_TAHAP[terbesar.nama] || terbesar.nama).toLowerCase()}</b></div>
        )}
        {r.kandidat_belum_dikonfirmasi > 0 && <div style={{ color: '#b26a00' }}>🟢 {r.kandidat_belum_dikonfirmasi} kandidat Serius menunggu konfirmasi Anda (tab Lead Masuk)</div>}
        {cakupan < 80 && <div style={{ color: muted }}>ℹ️ Chat tercatat {r.chat} dari {r.chat_versi_meta} versi Meta — riwayat WA bulan ini belum lengkap, angka biaya per serius belum bisa dipegang.</div>}
      </div>

      <button onClick={() => setBuka(!buka)} className="no-active"
        style={{ marginTop: 12, border: '1px solid ' + (dark ? '#444' : '#ddd'), background: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: biru, fontWeight: 600, cursor: 'pointer', width: '100%' }}>
        {buka ? 'Sembunyikan detail ▴' : 'Lihat detail ▾'}
      </button>

      {/* ── Level 2 ── */}
      {buka && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 10 }}>
            {TABS.map(([k, l]) => (
              <button key={k} onClick={() => setBagian(k)} className="no-active"
                style={{ whiteSpace: 'nowrap', border: 'none', borderRadius: 16, padding: '6px 12px', fontSize: 12, cursor: 'pointer', background: bagian === k ? biru : subtle, color: bagian === k ? '#fff' : text }}>{l}</button>
            ))}
          </div>

          {bagian === 'campaign' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: text }}>
                <KepalaTabel pertama="Campaign / ad set" />
                <tbody>
                  {data.campaigns.map((c) => (
                    <React.Fragment key={c.campaign_id}>
                      <BarisMetrik x={c} nama={`${campBuka[c.campaign_id] ? '▾' : '▸'} ${c.campaign_name}`} onClick={() => setCampBuka({ ...campBuka, [c.campaign_id]: !campBuka[c.campaign_id] })} />
                      {campBuka[c.campaign_id] && c.adsets.map((a) => <BarisMetrik key={a.adset_id} x={a} nama={a.nama} sub={`chat versi Meta: ${a.chat_versi_meta}`} indent />)}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {bagian === 'tahap' && (
            <>
              <div style={{ fontSize: 12, color: muted, marginBottom: 8 }}>Tahap terakhir yang dicapai tiap chat iklan. Paling banyak berhenti sebelum ukuran = iklan menarik orang penasaran; banyak berhenti setelah harga = harapan harga tidak cocok.</div>
              <Bar items={[...(data.tahap || [])].sort((a, b) => Object.keys(NAMA_TAHAP).indexOf(a.nama) - Object.keys(NAMA_TAHAP).indexOf(b.nama))} total={r.dinilai} nama={(k) => NAMA_TAHAP[k] || k} />
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 12, color: text }}>
                <span>Rata-rata pesan customer: <b>{r.rata_pesan_cust}</b></span>
                <span>Berhenti ≤3 pesan: <b>{r.pct_berhenti_3_pesan}%</b></span>
                <span>Kontak lama: <b>{r.kontak_lama}</b></span>
              </div>
            </>
          )}

          {bagian === 'iklan' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: text }}>
                <KepalaTabel pertama="Iklan" />
                <tbody>{data.iklan.map((a) => <BarisMetrik key={a.ad_id} x={a} nama={a.ad_name || a.headline || a.ad_id} sub={a.adset_name} />)}</tbody>
              </table>
            </div>
          )}

          {bagian === 'pasar' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
              <div><div style={{ fontWeight: 600, fontSize: 12, color: text, marginBottom: 6 }}>Produk dicari (lead serius)</div><Bar items={data.detail.produk_serius} total={r.serius} /></div>
              <div><div style={{ fontWeight: 600, fontSize: 12, color: text, marginBottom: 6 }}>Kota (lead serius)</div><Bar items={data.detail.kota_serius} total={r.serius} /></div>
              <div><div style={{ fontWeight: 600, fontSize: 12, color: text, marginBottom: 6 }}>Segmen (lead serius)</div><Bar items={data.detail.segmen_serius || []} total={r.serius} nama={(k) => NAMA_SEGMEN[k] || k} warna="#0b5cad" />
                <div style={{ fontSize: 11, color: muted, marginTop: 6 }}>Chat B2B: {r.chat_b2b ?? 0} · deal B2B: {r.deal_b2b ?? 0} (deal dihitung ke bulan klik pertama)</div></div>
              <div><div style={{ fontWeight: 600, fontSize: 12, color: text, marginBottom: 6 }}>Segmen (semua chat)</div><Bar items={data.detail.segmen} total={r.dinilai} nama={(k) => NAMA_SEGMEN[k] || k} /></div>
              <div><div style={{ fontWeight: 600, fontSize: 12, color: text, marginBottom: 6 }}>Kota (semua chat)</div><Bar items={data.detail.kota.slice(0, 8)} total={r.dinilai} warna="#7F77DD" /></div>
            </div>
          )}

          {bagian === 'gagal' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
              <div><div style={{ fontWeight: 600, fontSize: 12, color: text, marginBottom: 6 }}>Alasan tidak lanjut</div><Bar items={data.detail.alasan_gagal} total={data.detail.alasan_gagal.reduce((s, x) => s + x.jumlah, 0)} nama={(k) => NAMA_GAGAL[k] || k} warna={merah} /></div>
              {(data.detail.alasan_gagal_b2b || []).length > 0 && <div><div style={{ fontWeight: 600, fontSize: 12, color: text, marginBottom: 6 }}>Alasan tidak lanjut — B2B</div><Bar items={data.detail.alasan_gagal_b2b} total={data.detail.alasan_gagal_b2b.reduce((s, x) => s + x.jumlah, 0)} nama={(k) => NAMA_GAGAL[k] || k} warna="#0b5cad" /></div>}
              <div><div style={{ fontWeight: 600, fontSize: 12, color: text, marginBottom: 6 }}>Hari lead serius masuk</div><Bar items={data.detail.hari_serius} total={r.serius} warna={hijau} /></div>
              <div><div style={{ fontWeight: 600, fontSize: 12, color: text, marginBottom: 6 }}>Jam lead serius masuk (WIB)</div><Bar items={data.detail.jam_serius} total={r.serius} warna={hijau} nama={(j) => `${j}.00`} /></div>
            </div>
          )}
          {bagian === 'balas' && (
            <>
              <div style={{ fontSize: 12, color: muted, marginBottom: 10 }}>
                Waktu dari chat iklan masuk sampai balasan pertama kita. Lead high-ticket yang serius biasanya sedang membandingkan beberapa vendor, jadi yang membalas cepat dan tepat lebih berpeluang dipilih. Patokan: ≤{bl.target_menit ?? 5} menit di jam kerja ({String(bl.jam_kerja?.[0] ?? 8).padStart(2, '0')}.00–{String(bl.jam_kerja?.[1] ?? 21).padStart(2, '0')}.00 WIB).
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                <Angka label="Median jam kerja" nilai={fmtMenit(bl.median_jam_kerja)} warna={warnaBalas} sub={`${bl.chat_jam_kerja ?? 0} chat`} />
                <Angka label="Median di luar jam kerja" nilai={fmtMenit(bl.median_luar_jam)} sub="malam / dini hari" />
                <Angka label="Median semua" nilai={fmtMenit(bl.median)} sub={`${bl.tercatat ?? 0} chat tercatat`} />
                <Angka label="Dibalas > 1 jam" nilai={bl.pct_lebih_1_jam == null ? '-' : `${bl.pct_lebih_1_jam}%`} warna={bl.pct_lebih_1_jam > 30 ? merah : text} sub={bl.belum_dibalas ? `${bl.belum_dibalas} belum dibalas` : null} />
              </div>
              <div style={{ fontWeight: 600, fontSize: 12, color: text, marginBottom: 6 }}>Sebaran waktu balas</div>
              <Bar items={(bl.kelompok || []).map((k) => ({ nama: k.label, jumlah: k.jumlah }))} total={bl.tercatat} warna={biru} />
              <div style={{ fontWeight: 600, fontSize: 12, color: text, margin: '14px 0 6px' }}>% jadi Lead Serius per kecepatan balas</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(bl.kelompok || []).map((k) => (
                  <div key={k.kunci} style={{ fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: text }}>
                      <span>{k.label}</span><span style={{ color: muted }}>{k.serius} dari {k.jumlah} · {k.pct_serius == null ? '-' : `${k.pct_serius}%`}</span>
                    </div>
                    <div style={{ height: 6, background: subtle, borderRadius: 3 }}>
                      <div style={{ width: `${k.pct_serius || 0}%`, height: 6, background: hijau, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: muted, marginTop: 8 }}>Jumlah per kelompok masih kecil di awal bulan. Baca polanya setelah ±50 chat.</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
