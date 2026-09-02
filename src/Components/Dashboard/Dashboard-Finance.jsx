// Dashboard Finance — SATU halaman, semua grafik tampil sekaligus (tanpa carousel).
// Tujuan: CEO paham kondisi finansial & historikalnya hanya dari halaman ini.
//
// Semua angka datang dari SATU endpoint: GET /dashboard/finance/get?year=YYYY
// (rumus & sumber tiap angka ada di KLF-Server utils/financeDashboard.js).
// Tiap kartu membawa label sumber: "operasional" (Invoice/SPK, real-time) atau
// "jurnal" (akuntansi) — supaya tidak ada angka yang tidak jelas asalnya.

import { useEffect, useMemo, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { useTheme } from '../../ThemeContext';
import { getApiBaseUrl } from '../../Config/APIurl';
import './dashboard.css';

const rupiah = (n) => 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID');
/** Angka ringkas untuk sumbu & kartu: 1.850.000.000 → "Rp 1,85 M". */
const ringkas = (n) => {
  const v = Number(n) || 0;
  const abs = Math.abs(v);
  const tanda = v < 0 ? '-' : '';
  if (abs >= 1e9) return `${tanda}Rp ${(abs / 1e9).toFixed(2).replace('.', ',')} M`;
  if (abs >= 1e6) return `${tanda}Rp ${(abs / 1e6).toFixed(0)} jt`;
  if (abs >= 1e3) return `${tanda}Rp ${(abs / 1e3).toFixed(0)} rb`;
  return `${tanda}Rp ${abs}`;
};

const WARNA = {
  penjualan: '#2563eb',
  gp: '#16a34a',
  hpp: '#94a3b8',
  beban: '#f59e0b',
  laba: '#7c3aed',
  masuk: '#16a34a',
  keluar: '#dc2626',
  net: '#2563eb',
  aset: '#2563eb',
  kewajiban: '#dc2626',
  ekuitas: '#16a34a',
};

const DashboardFinance = () => {
  const baseUrl = getApiBaseUrl();
  const { globalTheme } = useTheme();
  const dark = globalTheme !== 'light';

  const [year, setYear] = useState(dayjs().format('YYYY'));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let batal = false;
    (async () => {
      setLoading(true); setError('');
      try {
        const res = await fetch(`${baseUrl}/dashboard/finance/get?year=${year}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!batal) setData(json);
      } catch (e) {
        if (!batal) setError(e.message || 'Gagal memuat data');
      } finally {
        if (!batal) setLoading(false);
      }
    })();
    return () => { batal = true; };
  }, [baseUrl, year]);

  // ---- konfigurasi grafik (di-memo: tanpa ini Chart.js dibangun ulang tiap render) ----
  const t = useMemo(() => ({
    bg: dark ? '#15181d' : '#f4f6fa',
    card: dark ? '#1e232b' : '#ffffff',
    border: dark ? '#2f353f' : '#e3e8ef',
    text: dark ? '#e8ecf1' : '#1a2027',
    sub: dark ? '#9aa4b2' : '#6b7684',
    grid: dark ? '#2b313a' : '#eceff4',
  }), [dark]);

  const grafik = useMemo(() => (data ? {
    penjualan: cfgPenjualan(data, t),
    labaRugi: cfgLabaRugi(data, t),
    kas: cfgKas(data, t),
    neraca: cfgNeraca(data, t),
  } : null), [data, t]);

  return (
    <div style={{ background: t.bg, minHeight: '100vh', padding: '20px 16px 40px' }}>
      <div style={{ maxWidth: 1560, margin: '0 auto' }}>
        <Kepala t={t} year={year} setYear={setYear} data={data} loading={loading} />

        {error && (
          <div style={{ ...kotak(t), color: '#dc2626', marginBottom: 16 }}>
            Gagal memuat data: {error}
          </div>
        )}
        {loading && !data && <div style={{ ...kotak(t), color: t.sub }}>Memuat data finansial…</div>}

        {data && (
          <>
            <BarisKPI t={t} kpi={data.kpi} />

            <div className="klf-fin-grid">
              <Kartu t={t} judul="Penjualan & Gross Profit" sumber="operasional"
                info="Omset dihitung per tanggal invoice dibuat. Garis = margin GP (%)." lebar>
                <Grafik tinggi={320} config={grafik.penjualan} />
              </Kartu>

              <Kartu t={t} judul="Laba Rugi Bulanan" sumber="operasional + jurnal"
                info="Gross Profit dari Invoice/SPK, Beban Operasional dari jurnal akuntansi.">
                <Grafik tinggi={280} config={grafik.labaRugi} />
              </Kartu>

              <Kartu t={t} judul="Arus Kas Riil" sumber="pembayaran riil"
                info="Masuk: pembayaran customer & piutang. Keluar: bayar supplier (SPK), hutang, beban operasional.">
                <Grafik tinggi={280} config={grafik.kas} />
              </Kartu>

              <Kartu t={t} judul="Neraca — Posisi Keuangan" sumber="campuran"
                info="Aset = kas & bank + piutang + aset tetap. Kewajiban = hutang supplier + hutang lain. Tiap pos diambil dari sumber yang paling dapat dipercaya (lihat catatan di bawah halaman).">
                <Grafik tinggi={280} config={grafik.neraca} />
              </Kartu>

              <Kartu t={t} judul="Proyeksi Kas 30 / 60 Hari" sumber="operasional"
                info={data.proyeksi.catatan}>
                <Proyeksi t={t} p={data.proyeksi} />
              </Kartu>

              <Kartu t={t} judul="Posisi Hari Ini" sumber="campuran"
                info="Saldo kas/bank dari jurnal; piutang & hutang dari Invoice/SPK." lebar>
                <Posisi t={t} data={data} />
              </Kartu>

              <Kartu t={t} judul="Rekap Bulanan" sumber="gabungan"
                info="Angka pasti tiap bulan — untuk dibaca, bukan ditaksir dari grafik." lebar>
                <Tabel t={t} rows={data.per_bulan} neraca={data.neraca.per_bulan} />
              </Kartu>
            </div>

            <div style={{ color: t.sub, fontSize: 12, marginTop: 14, lineHeight: 1.7 }}>
              Sumber angka — Penjualan &amp; Gross Profit: {data.meta.sumber.penjualan_gross_profit}. Beban
              Operasional: {data.meta.sumber.beban_operasional}. Kas/Bank &amp; Neraca: {data.meta.sumber.kas_bank_neraca}.
              Piutang, Hutang &amp; Estimasi: {data.meta.sumber.piutang_hutang_estimasi}.
              {data.meta.spk_payment_pakai_submit_date > 0 && (
                <> Catatan: {data.meta.spk_payment_pakai_submit_date} pembayaran SPK belum punya tanggal bayar,
                  dipakai tanggal input sebagai perkiraan.</>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// Bagian-bagian
// =============================================================================
const kotak = (t) => ({ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 18 });

const Kepala = ({ t, year, setYear, data, loading }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
    <div>
      <h3 style={{ color: t.text, margin: 0, fontWeight: 700 }}>Dashboard Finance</h3>
      <div style={{ color: t.sub, fontSize: 13, marginTop: 4 }}>
        {data ? `Posisi per ${dayjs(data.per_tanggal).format('D MMMM YYYY')}` : 'Memuat…'}
        {data?.meta?.execution_time_ms ? ` · dihitung ${data.meta.execution_time_ms} ms` : ''}
        {loading && data ? ' · memperbarui…' : ''}
      </div>
    </div>
    <DatePicker picker="year" allowClear={false} value={dayjs(year, 'YYYY')}
      onChange={(_, s) => s && setYear(s)} style={{ minWidth: 120 }} />
  </div>
);

const BarisKPI = ({ t, kpi }) => {
  const kartu = [
    { label: 'Omset', k: kpi.omset, warna: WARNA.penjualan },
    { label: 'Gross Profit', k: kpi.gross_profit, warna: WARNA.gp, extra: `margin ${kpi.gross_profit.margin_persen}%` },
    { label: 'Laba Bersih', k: kpi.laba_bersih, warna: WARNA.laba },
    { label: 'Kas Bersih', k: kpi.kas_bersih, warna: WARNA.net, extra: `masuk ${ringkas(kpi.kas_bersih.masuk)} · keluar ${ringkas(kpi.kas_bersih.keluar)}` },
    { label: 'Kas & Bank', k: kpi.kas_bank, warna: '#0891b2' },
    { label: 'Free Cash', k: kpi.free_cash, warna: '#db2777', extra: kpi.free_cash.rumus },
  ];
  return (
    <div className="klf-fin-kpi">
      {kartu.map((c) => (
        <div key={c.label} style={{ ...kotak(t), padding: 16 }}>
          <div style={{ color: t.sub, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4, display: 'flex', justifyContent: 'space-between', gap: 6 }}>
            <span>{c.label}</span>
            <span style={{ textTransform: 'none', fontSize: 10, opacity: 0.75 }}>{c.k.sumber}</span>
          </div>
          <div style={{ color: c.k.nilai < 0 ? '#dc2626' : c.warna, fontSize: 24, fontWeight: 700, margin: '6px 0 2px', lineHeight: 1.15 }}>
            {ringkas(c.k.nilai)}
          </div>
          <div style={{ color: t.sub, fontSize: 11.5 }} title={rupiah(c.k.nilai)}>
            {c.extra || rupiah(c.k.nilai)}
          </div>
          {c.k.bulan_ini !== undefined && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${t.border}`, fontSize: 12, color: t.sub, display: 'flex', justifyContent: 'space-between' }}>
              <span>bulan ini {ringkas(c.k.bulan_ini)}</span>
              {c.k.delta_persen !== null && c.k.delta_persen !== undefined && (
                <span style={{ color: c.k.delta_persen >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                  {c.k.delta_persen >= 0 ? '▲' : '▼'} {Math.abs(c.k.delta_persen)}%
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const Kartu = ({ t, judul, sumber, info, lebar, children }) => (
  <div style={{ ...kotak(t), gridColumn: lebar ? '1 / -1' : 'auto' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
      <h5 style={{ color: t.text, margin: 0, fontWeight: 650, fontSize: 16 }}>{judul}</h5>
      <span style={{ color: t.sub, fontSize: 11, border: `1px solid ${t.border}`, borderRadius: 20, padding: '2px 9px', whiteSpace: 'nowrap' }}>{sumber}</span>
    </div>
    {info && <div style={{ color: t.sub, fontSize: 12, marginBottom: 10 }}>{info}</div>}
    {children}
  </div>
);

/** Canvas + siklus hidup Chart.js (destroy sebelum render ulang biar tidak dobel). */
const Grafik = ({ config, tinggi }) => {
  const ref = useRef(null);
  const inst = useRef(null);
  useEffect(() => {
    if (!ref.current) return undefined;
    inst.current = new Chart(ref.current.getContext('2d'), config);
    return () => { if (inst.current) inst.current.destroy(); };
  }, [config]);
  return <div style={{ position: 'relative', height: tinggi, width: '100%' }}><canvas ref={ref} /></div>;
};

const Proyeksi = ({ t, p }) => {
  const baris = [
    { label: 'Lewat jatuh tempo', masuk: p.masuk.lewat_jatuh_tempo, keluar: p.keluar.lewat_jatuh_tempo },
    { label: '0–30 hari', masuk: p.masuk.hari_30, keluar: p.keluar.hari_30 },
    { label: '31–60 hari', masuk: p.masuk.hari_60, keluar: p.keluar.hari_60 },
    { label: '> 60 hari', masuk: p.masuk.lebih_60, keluar: p.keluar.lebih_60 },
    { label: 'Tanpa tanggal', masuk: p.masuk.tanpa_tanggal, keluar: p.keluar.tanpa_tanggal },
  ];
  const maks = Math.max(1, ...baris.flatMap((b) => [b.masuk, b.keluar]));
  return (
    <div>
      {baris.map((b) => (
        <div key={b.label} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: t.sub, marginBottom: 3 }}>
            <span>{b.label}</span>
            <span><span style={{ color: WARNA.masuk }}>+{ringkas(b.masuk)}</span> · <span style={{ color: WARNA.keluar }}>−{ringkas(b.keluar)}</span></span>
          </div>
          <div style={{ display: 'flex', gap: 3, height: 8 }}>
            <div style={{ flex: 1, background: t.grid, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${(b.masuk / maks) * 100}%`, height: '100%', background: WARNA.masuk }} />
            </div>
            <div style={{ flex: 1, background: t.grid, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${(b.keluar / maks) * 100}%`, height: '100%', background: WARNA.keluar }} />
            </div>
          </div>
        </div>
      ))}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
        <span style={{ color: t.sub }}>Perkiraan kas bersih 30 hari</span>
        <strong style={{ color: p.net_30 >= 0 ? WARNA.masuk : WARNA.keluar }}>{rupiah(p.net_30)}</strong>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 4 }}>
        <span style={{ color: t.sub }}>Perkiraan kas bersih 60 hari</span>
        <strong style={{ color: p.net_60 >= 0 ? WARNA.masuk : WARNA.keluar }}>{rupiah(p.net_60)}</strong>
      </div>
    </div>
  );
};

const Posisi = ({ t, data }) => {
  const { saldo, piutang, hutang, estimasi_belum_spk: est } = data.posisi;
  const blok = [
    { judul: 'Kas & Bank', total: saldo.total, warna: '#0891b2', rows: saldo.rincian.map((r) => ({ label: r.label, nilai: r.nominal })) },
    { judul: 'Piutang', total: piutang.total, warna: '#7c3aed', rows: [{ label: 'Customer (invoice belum lunas)', nilai: piutang.customer }, { label: 'Piutang lain', nilai: piutang.lain }] },
    { judul: 'Hutang', total: hutang.total, warna: '#dc2626', rows: [{ label: 'Supplier (SPK belum lunas)', nilai: hutang.supplier }, { label: 'Hutang lain', nilai: hutang.lain }] },
    { judul: 'Estimasi belum ber-SPK', total: est.total, warna: '#f59e0b', rows: est.per_kategori.slice(0, 5).map((k) => ({ label: `${k.kategori} (${k.jumlah_item} item)`, nilai: k.total })) },
  ];
  return (
    <div className="klf-fin-posisi">
      {blok.map((b) => (
        <div key={b.judul} style={{ border: `1px solid ${t.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ color: t.sub, fontSize: 12 }}>{b.judul}</div>
          <div style={{ color: b.warna, fontSize: 20, fontWeight: 700, margin: '4px 0 10px' }}>{rupiah(b.total)}</div>
          {b.rows.filter((r) => r.nilai).map((r) => {
            const persen = b.total > 0 ? Math.round((r.nilai / b.total) * 100) : 0;
            return (
              <div key={r.label} style={{ marginBottom: 7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: t.sub, gap: 8 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
                  <span style={{ whiteSpace: 'nowrap' }}>{ringkas(r.nilai)}</span>
                </div>
                <div style={{ height: 5, background: t.grid, borderRadius: 3, marginTop: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${persen}%`, height: '100%', background: b.warna, opacity: 0.85 }} />
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const Tabel = ({ t, rows, neraca }) => {
  const ekuitas = Object.fromEntries(neraca.map((n) => [n.bulan, n.ekuitas]));
  const th = { padding: '8px 10px', color: t.sub, fontWeight: 600, fontSize: 12, textAlign: 'right', whiteSpace: 'nowrap', borderBottom: `1px solid ${t.border}` };
  const td = { padding: '7px 10px', color: t.text, fontSize: 13, textAlign: 'right', whiteSpace: 'nowrap' };
  const total = (f) => rows.reduce((s, r) => s + r[f], 0);
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
        <thead>
          <tr>
            <th style={{ ...th, textAlign: 'left' }}>Bulan</th>
            <th style={th}>Inv</th>
            <th style={th}>Penjualan</th>
            <th style={th}>HPP</th>
            <th style={th}>Gross Profit</th>
            <th style={th}>Margin</th>
            <th style={th}>Beban Ops</th>
            <th style={th}>Laba Bersih</th>
            <th style={th}>Kas Masuk</th>
            <th style={th}>Kas Keluar</th>
            <th style={th}>Kas Net</th>
            <th style={th}>Ekuitas</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.bulan} style={{ borderBottom: `1px solid ${t.border}` }}>
              <td style={{ ...td, textAlign: 'left', color: t.sub }}>{r.label}</td>
              <td style={td}>{r.jumlah_invoice || '—'}</td>
              <td style={td}>{r.penjualan ? ringkas(r.penjualan) : '—'}</td>
              <td style={{ ...td, color: t.sub }}>{r.hpp ? ringkas(r.hpp) : '—'}</td>
              <td style={{ ...td, color: r.gross_profit >= 0 ? WARNA.gp : WARNA.keluar }}>{r.gross_profit ? ringkas(r.gross_profit) : '—'}</td>
              <td style={{ ...td, color: t.sub }}>{r.penjualan ? `${r.margin_persen}%` : '—'}</td>
              <td style={{ ...td, color: r.beban_operasional ? WARNA.beban : t.sub }}>{r.beban_operasional ? ringkas(r.beban_operasional) : '—'}</td>
              <td style={{ ...td, color: r.laba_bersih >= 0 ? WARNA.laba : WARNA.keluar, fontWeight: 600 }}>{r.penjualan || r.beban_operasional ? ringkas(r.laba_bersih) : '—'}</td>
              <td style={{ ...td, color: WARNA.masuk }}>{r.kas_masuk ? ringkas(r.kas_masuk) : '—'}</td>
              <td style={{ ...td, color: WARNA.keluar }}>{r.kas_keluar ? ringkas(r.kas_keluar) : '—'}</td>
              <td style={{ ...td, color: r.kas_net >= 0 ? t.text : WARNA.keluar }}>{r.kas_masuk || r.kas_keluar ? ringkas(r.kas_net) : '—'}</td>
              <td style={{ ...td, color: t.sub }}>{ekuitas[r.bulan] !== undefined ? ringkas(ekuitas[r.bulan]) : '—'}</td>
            </tr>
          ))}
          <tr style={{ borderTop: `2px solid ${t.border}` }}>
            <td style={{ ...td, textAlign: 'left', fontWeight: 700 }}>Total</td>
            <td style={{ ...td, fontWeight: 700 }}>{total('jumlah_invoice')}</td>
            <td style={{ ...td, fontWeight: 700 }}>{ringkas(total('penjualan'))}</td>
            <td style={{ ...td, fontWeight: 700 }}>{ringkas(total('hpp'))}</td>
            <td style={{ ...td, fontWeight: 700, color: WARNA.gp }}>{ringkas(total('gross_profit'))}</td>
            <td style={{ ...td, fontWeight: 700 }}>{total('penjualan') ? `${Math.round((total('gross_profit') / total('penjualan')) * 1000) / 10}%` : '—'}</td>
            <td style={{ ...td, fontWeight: 700, color: WARNA.beban }}>{ringkas(total('beban_operasional'))}</td>
            <td style={{ ...td, fontWeight: 700, color: WARNA.laba }}>{ringkas(total('laba_bersih'))}</td>
            <td style={{ ...td, fontWeight: 700, color: WARNA.masuk }}>{ringkas(total('kas_masuk'))}</td>
            <td style={{ ...td, fontWeight: 700, color: WARNA.keluar }}>{ringkas(total('kas_keluar'))}</td>
            <td style={{ ...td, fontWeight: 700 }}>{ringkas(total('kas_net'))}</td>
            <td style={td} />
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// =============================================================================
// Konfigurasi grafik
// =============================================================================
const dasar = (t) => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { position: 'bottom', labels: { color: t.sub, boxWidth: 12, boxHeight: 12, padding: 14, font: { size: 11 } } },
    tooltip: {
      callbacks: {
        label: (c) => `${c.dataset.label}: ${c.dataset.yAxisID === 'persen' ? `${c.parsed.y}%` : rupiah(c.parsed.y)}`,
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: t.sub, font: { size: 11 } } },
    y: { grid: { color: t.grid }, ticks: { color: t.sub, font: { size: 11 }, callback: (v) => ringkas(v) } },
  },
});

const labels = (d) => d.per_bulan.map((r) => r.label_pendek);
// Bulan yang belum ada datanya dikirim null, bukan 0 — kalau 0, garis margin &
// laba ikut terjun ke dasar grafik dan terbaca seolah bulan itu rugi/0%.
const kosongJadiNull = (rows, nilai, adaData) => rows.map((r) => (adaData(r) ? nilai(r) : null));

const cfgPenjualan = (d, t) => ({
  type: 'bar',
  data: {
    labels: labels(d),
    datasets: [
      { label: 'Penjualan', data: d.per_bulan.map((r) => r.penjualan), backgroundColor: WARNA.penjualan, borderRadius: 4, order: 2 },
      { label: 'Gross Profit', data: d.per_bulan.map((r) => r.gross_profit), backgroundColor: WARNA.gp, borderRadius: 4, order: 2 },
      { label: 'Margin %', data: kosongJadiNull(d.per_bulan, (r) => r.margin_persen, (r) => r.penjualan > 0), type: 'line', yAxisID: 'persen', borderColor: WARNA.beban, backgroundColor: WARNA.beban, tension: 0.3, pointRadius: 3, order: 1 },
    ],
  },
  options: {
    ...dasar(t),
    scales: {
      ...dasar(t).scales,
      persen: { position: 'right', grid: { display: false }, ticks: { color: t.sub, font: { size: 11 }, callback: (v) => `${v}%` } },
    },
  },
});

const cfgLabaRugi = (d, t) => ({
  type: 'bar',
  data: {
    labels: labels(d),
    datasets: [
      { label: 'Gross Profit', data: d.per_bulan.map((r) => r.gross_profit), backgroundColor: WARNA.gp, borderRadius: 4 },
      { label: 'Beban Operasional', data: d.per_bulan.map((r) => -r.beban_operasional), backgroundColor: WARNA.beban, borderRadius: 4 },
      { label: 'Laba Bersih', data: kosongJadiNull(d.per_bulan, (r) => r.laba_bersih, (r) => r.penjualan || r.beban_operasional), type: 'line', borderColor: WARNA.laba, backgroundColor: WARNA.laba, tension: 0.3, pointRadius: 3 },
    ],
  },
  options: dasar(t),
});

const cfgKas = (d, t) => ({
  type: 'bar',
  data: {
    labels: labels(d),
    datasets: [
      { label: 'Kas Masuk', data: d.per_bulan.map((r) => r.kas_masuk), backgroundColor: WARNA.masuk, borderRadius: 4 },
      { label: 'Kas Keluar', data: d.per_bulan.map((r) => -r.kas_keluar), backgroundColor: WARNA.keluar, borderRadius: 4 },
      { label: 'Kas Bersih', data: kosongJadiNull(d.per_bulan, (r) => r.kas_net, (r) => r.kas_masuk || r.kas_keluar), type: 'line', borderColor: WARNA.net, backgroundColor: WARNA.net, tension: 0.3, pointRadius: 3 },
    ],
  },
  options: dasar(t),
});

const cfgNeraca = (d, t) => ({
  type: 'line',
  data: {
    labels: d.neraca.per_bulan.map((r) => r.label_pendek),
    datasets: [
      { label: 'Aset', data: d.neraca.per_bulan.map((r) => r.aset), borderColor: WARNA.aset, backgroundColor: `${WARNA.aset}22`, fill: true, tension: 0.3, pointRadius: 3 },
      { label: 'Kewajiban', data: d.neraca.per_bulan.map((r) => r.kewajiban), borderColor: WARNA.kewajiban, backgroundColor: `${WARNA.kewajiban}22`, fill: true, tension: 0.3, pointRadius: 3 },
      { label: 'Ekuitas', data: d.neraca.per_bulan.map((r) => r.ekuitas), borderColor: WARNA.ekuitas, backgroundColor: 'transparent', borderDash: [5, 4], tension: 0.3, pointRadius: 3 },
    ],
  },
  options: dasar(t),
});

export default DashboardFinance;
