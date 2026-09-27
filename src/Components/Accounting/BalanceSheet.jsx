import React, { useEffect, useMemo, useState } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { DatePicker, Checkbox, Tooltip } from 'antd';
import dayjs from 'dayjs';
import AccountingMenu from './AccountingMenu';
import { getApiBaseUrl } from '../../Config/APIurl';
import {
  SALDO_AWAL_BULAN, POS, hitungNeraca, rincianTerbuka, saldoTampil, saldoTidakNormal,
} from '../../Utils/neraca';
import '../Accounting/Accounting.css';

// Balance Sheet / Neraca — posisi per AKHIR bulan yang dipilih.
// Seluruh perhitungan ada di Utils/neraca.js (saldo kumulatif dari saldo pembukaan
// SALDO_AWAL_BULAN + seluruh jurnal). Tidak memakai isian saldo awal bulanan "tutup buku".

const IZIN = ['fYpdHwXRDLhj5XGxM5FZIAvxp9E2', 'w4M5JJjgGQeHFbS2nkyoCfUBE532', '4WGPaHicKWYr0Ny84IUh8xb9Bo62', 'ANGTwgX8KxXQy5Ww3cwpLrG0tFT2', 'gwsOqUgVXSPyWFMMHr4bJteBoYs1', '6D4XVa5BSSOl1ugUlkDlTea2COX2', 'MjOCxfNdGtf0q12BPzj0EYAcVJD3', 'knydS6fIBdOwHS37dDm3ZDNQXKQ2', 'Q3LWLX4D7Ye8hMnQVF9fa7SZb953', 'ep15dsFMceTBAyZvpZDiAJ4kMME3'];
const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const rp = (v) => {
  const n = Math.round(Number(v || 0));
  return n < 0 ? `(Rp ${Math.abs(n).toLocaleString('id-ID')})` : `Rp ${n.toLocaleString('id-ID')}`;
};
const labelBulan = (b) => `${NAMA_BULAN[Number(b.slice(5, 7)) - 1]} ${b.slice(0, 4)}`;
const tglPendek = (t) => (t ? `${t.slice(8, 10)}-${t.slice(5, 7)}-${t.slice(0, 4)}` : '-');

const tableContainerStyle = { overflow: 'hidden', borderRadius: '10px', border: '1px solid #dddddd' };
const tableStyle = { width: '100%', borderCollapse: 'separate', borderSpacing: 0 };
const tdStyle = { border: '1px solid #c2c2c2', textAlign: 'left', padding: '6px 8px', fontSize: '12px' };
const tdNum = { ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' };
const thStyle = { ...tdStyle, backgroundColor: 'blue', textAlign: 'center', color: 'white' };
const rowEven = { backgroundColor: '#F4F4F4' };
const rowOdd = { backgroundColor: '#ffffff' };
const rowTotal = { backgroundColor: '#E7E7E8', fontWeight: 600 };
const judulSisi = {
  backgroundColor: 'blue', color: 'white', borderRadius: '20px', textAlign: 'center',
  fontWeight: 600, padding: '4px 0', marginBottom: '12px',
};

const TabelAkun = ({ judul, akun, total, tampilNol }) => {
  const baris = akun.filter((a) => tampilNol || Math.abs(a.saldo) >= 1);
  return (
    <>
      <p className='fw-semibold px-2 mb-2 mt-3'>{judul}</p>
      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: '70px' }}>Kode</th>
              <th style={thStyle}>Nama Akun</th>
              <th style={{ ...thStyle, width: '170px' }}>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {baris.length === 0 && (
              <tr><td style={{ ...tdStyle, textAlign: 'center', color: '#888' }} colSpan={3}>Tidak ada saldo</td></tr>
            )}
            {baris.map((a, i) => {
              const aneh = saldoTidakNormal(a);
              return (
                <tr key={a.kodeAkun} style={i % 2 === 0 ? rowEven : rowOdd} className='tr-hover-effect2'>
                  <td style={tdStyle}>{a.kodeAkun}</td>
                  <td style={tdStyle}>{a.namaAkun}</td>
                  <td style={{ ...tdNum, color: aneh ? '#d46b08' : undefined }}>
                    {aneh ? (
                      <Tooltip title='Saldo tidak normal untuk jenis akun ini (mis. bank minus / hutang bersaldo debit). Perlu dicek jurnalnya.'>
                        <span>⚠ {rp(saldoTampil(a))}</span>
                      </Tooltip>
                    ) : rp(saldoTampil(a))}
                  </td>
                </tr>
              );
            })}
            <tr style={rowTotal}>
              <td style={tdStyle} colSpan={2}>Total {judul}</td>
              <td style={tdNum}>{rp(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

const TabelRincian = ({ judul, catatan, baris, labelTotal }) => {
  const total = baris.reduce((s, r) => s + r.sisa, 0);
  return (
    <>
      <p className='fw-semibold px-2 mb-0 mt-4'>{judul}</p>
      <p className='px-2 mb-2' style={{ fontSize: '11px', color: '#777' }}>{catatan}</p>
      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Tanggal</th>
              <th style={thStyle}>Nama</th>
              <th style={thStyle}>{labelTotal}</th>
              <th style={thStyle}>Sisa</th>
            </tr>
          </thead>
          <tbody>
            {baris.length === 0 && (
              <tr><td style={{ ...tdStyle, textAlign: 'center', color: '#888' }} colSpan={4}>Tidak ada yang terbuka</td></tr>
            )}
            {baris.map((r, i) => (
              <tr key={r.id} style={i % 2 === 0 ? rowEven : rowOdd} className='tr-hover-effect2'>
                <td style={tdStyle}>{tglPendek(r.tanggal)}</td>
                <td style={tdStyle}>
                  {r.nama}
                  {r.bayarTanpaTanggal > 0 && (
                    <Tooltip title={`${r.bayarTanpaTanggal} pembayaran tanpa tanggal — tidak ikut dihitung. Lengkapi tanggalnya lewat jurnal.`}>
                      <span style={{ color: '#d46b08' }}> ⚠</span>
                    </Tooltip>
                  )}
                </td>
                <td style={tdNum}>{rp(r.total)}</td>
                <td style={tdNum}>{rp(r.sisa)}</td>
              </tr>
            ))}
            <tr style={rowTotal}>
              <td style={tdStyle} colSpan={3}>Total sisa (informasi)</td>
              <td style={tdNum}>{rp(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

const BarisRingkas = ({ label, nilai, tebal, garis }) => (
  <div className='d-flex justify-content-between px-2' style={{
    fontSize: '13px', fontWeight: tebal ? 600 : 400, padding: '3px 0',
    borderTop: garis ? '1px solid #c2c2c2' : undefined,
  }}>
    <span>{label}</span><span>{rp(nilai)}</span>
  </div>
);

const BalanceSheet = () => {
  const baseUrl = getApiBaseUrl();
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;

  useEffect(() => {
    if (user == null) { window.location.replace('/login'); return; }
    if (!IZIN.includes(user.uid)) window.location.replace('/accounting');
  }, []);

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [bulan, setBulan] = useState(dayjs().format('YYYY-MM'));
  const [tampilNol, setTampilNol] = useState(false);

  useEffect(() => {
    const ambil = async (path) => {
      const res = await fetch(`${baseUrl}${path}`);
      if (!res.ok) throw new Error(`Gagal ambil ${path}`);
      const json = await res.json();
      return Array.isArray(json) ? json : [];
    };
    (async () => {
      try {
        const [akun, jurnal, piutang, piutangItem, piutangPayment, hutang, hutangItem, hutangPayment] = await Promise.all([
          '/accounting/akun/get', '/accounting/jurnal/get',
          '/accounting/piutang/get', '/accounting/piutangItem/get', '/accounting/piutangPayment/get',
          '/accounting/hutang/get', '/accounting/hutangItem/get', '/accounting/hutangPayment/get',
        ].map(ambil));
        setData({ akun, jurnal, piutang, piutangItem, piutangPayment, hutang, hutangItem, hutangPayment });
      } catch (err) {
        console.error('Gagal mengambil data neraca:', err);
        setError(err.message);
      }
    })();
  }, []);

  const neraca = useMemo(() => (data ? hitungNeraca(data.akun, data.jurnal, bulan) : null), [data, bulan]);
  const piutangLain = useMemo(() => (data
    ? rincianTerbuka(data.piutang, data.piutangItem, data.piutangPayment, 'idPiutang', bulan) : []), [data, bulan]);
  const hutangLain = useMemo(() => (data
    ? rincianTerbuka(data.hutang, data.hutangItem, data.hutangPayment, 'idHutang', bulan) : []), [data, bulan]);

  const akunPos = (pos) => (neraca ? neraca.akun.filter((a) => a.pos === pos) : []);
  const t = neraca?.total;
  const m = neraca?.masalah;
  const dijelaskan = m ? m.akunKosong.nominal + Object.values(m.akunTakDikenal).reduce((s, v) => s + v, 0) : 0;
  const takTerjelaskan = neraca ? neraca.selisih + dijelaskan : 0;
  const seimbang = neraca && Math.abs(neraca.selisih) < 1;

  return (
    <Container>
      <div className='mt-4 px-4'>
        <div className='d-flex justify-content-between align-items-center flex-wrap' style={{ gap: '10px' }}>
          <AccountingMenu />
          <div className='d-flex align-items-center' style={{ gap: '12px' }}>
            <Checkbox checked={tampilNol} onChange={(e) => setTampilNol(e.target.checked)}>Tampilkan akun bersaldo 0</Checkbox>
            <DatePicker
              picker='month'
              allowClear={false}
              value={dayjs(bulan, 'YYYY-MM')}
              onChange={(d) => d && setBulan(d.format('YYYY-MM'))}
              disabledDate={(d) => d.format('YYYY-MM') < SALDO_AWAL_BULAN}
              style={{ borderColor: 'blue', color: 'blue' }}
            />
          </div>
        </div>

        {error && <p className='mt-4 text-danger'>Gagal memuat data: {error}</p>}
        {!neraca && !error && <div className='mt-5 text-center'><Spinner animation='border' size='sm' /> Memuat neraca…</div>}

        {neraca && (
          <>
            <p className='mt-3 mb-1 fw-semibold' style={{ fontSize: '16px' }}>Neraca per akhir {labelBulan(bulan)}</p>
            <p className='mb-2' style={{ fontSize: '12px', color: '#666' }}>
              Saldo = saldo pembukaan {labelBulan(SALDO_AWAL_BULAN)} + seluruh jurnal sampai akhir bulan ini.
            </p>

            {/* Cek keseimbangan */}
            <div className='px-3 py-2 mb-2' style={{
              borderRadius: '10px', fontSize: '13px',
              border: `1px solid ${seimbang ? '#b7eb8f' : '#ffa39e'}`,
              backgroundColor: seimbang ? '#f6ffed' : '#fff1f0',
            }}>
              <div className='fw-semibold'>
                {seimbang ? '✓ Seimbang: Aset = Kewajiban + Ekuitas' : `✗ Tidak seimbang — selisih ${rp(neraca.selisih)} (Aset − (Kewajiban + Ekuitas))`}
              </div>
              {!seimbang && (
                <ul className='mb-0 mt-1' style={{ paddingLeft: '18px' }}>
                  {m.akunKosong.jumlah > 0 && (
                    <li>
                      {m.akunKosong.jumlah} jurnal salah satu sisi akunnya kosong (efek {rp(Math.abs(m.akunKosong.nominal))}) —
                      perbaiki di <Link to='/accounting/temuan-koreksi'>Temuan Koreksi</Link>.
                    </li>
                  )}
                  {Object.entries(m.akunTakDikenal).map(([kode, v]) => (
                    <li key={kode}>Kode akun "{kode}" tidak terdaftar di daftar Akun (efek {rp(Math.abs(v))}).</li>
                  ))}
                  {Math.abs(takTerjelaskan) >= 1 && <li>Selisih lain yang belum terjelaskan: {rp(takTerjelaskan)}.</li>}
                </ul>
              )}
              {m.tanpaTanggal.length > 0 && (
                <div className='mt-1' style={{ color: '#d46b08' }}>
                  ⚠ {m.tanpaTanggal.length} jurnal tanpa tanggal tidak ikut dihitung:{' '}
                  {m.tanpaTanggal.map((j) => `${j.keterangan || j.invoiceSPK || '(tanpa keterangan)'} ${rp(j.nominalDebet)}`).join('; ')}.
                </div>
              )}
            </div>

            <div className='d-flex justify-content-between flex-wrap' style={{ gap: '2%' }}>
              {/* Aktiva */}
              <div style={{ flex: '1 1 440px', minWidth: 0 }}>
                <div className='mt-3' style={judulSisi}>Aktiva</div>
                <TabelAkun judul='Aset Lancar' akun={akunPos(POS.ASET_LANCAR)} total={t.asetLancar} tampilNol={tampilNol} />
                <TabelAkun judul='Aset Tetap' akun={akunPos(POS.ASET_TETAP)} total={t.asetTetap} tampilNol={tampilNol} />
                <div className='mt-3 px-2 py-2' style={{ ...rowTotal, borderRadius: '10px' }}>
                  <BarisRingkas label='TOTAL ASET' nilai={t.aset} tebal />
                </div>

                <TabelRincian
                  judul='Rincian Piutang Lain (terbuka)'
                  catatan='Informasi pendukung — sudah termasuk di saldo akun piutang (1131/1132), tidak dijumlahkan lagi.'
                  baris={piutangLain}
                  labelTotal='Piutang'
                />
              </div>

              {/* Pasiva */}
              <div style={{ flex: '1 1 440px', minWidth: 0 }}>
                <div className='mt-3' style={judulSisi}>Pasiva</div>
                <TabelAkun judul='Kewajiban Lancar' akun={akunPos(POS.KEWAJIBAN_LANCAR)} total={t.kewajibanLancar} tampilNol={tampilNol} />
                <TabelAkun judul='Kewajiban Jangka Panjang' akun={akunPos(POS.KEWAJIBAN_PANJANG)} total={t.kewajibanPanjang} tampilNol={tampilNol} />
                <TabelAkun judul='Modal' akun={akunPos(POS.EKUITAS)} total={t.modal} tampilNol={tampilNol} />

                <p className='fw-semibold px-2 mb-2 mt-3'>Ekuitas</p>
                <div className='px-2 py-2' style={{ border: '1px solid #dddddd', borderRadius: '10px' }}>
                  <BarisRingkas label='Modal (akun 3xxx)' nilai={t.modal} />
                  <BarisRingkas label={`Laba ditahan (s/d Des ${Number(bulan.slice(0, 4)) - 1})`} nilai={neraca.labaDitahan} />
                  <BarisRingkas label={`Laba tahun berjalan (Jan – ${NAMA_BULAN[Number(bulan.slice(5, 7)) - 1]} ${bulan.slice(0, 4)})`} nilai={neraca.labaBerjalan} />
                  <BarisRingkas label='Total Ekuitas' nilai={t.ekuitas} tebal garis />
                </div>

                <div className='mt-3 px-2 py-2' style={{ ...rowTotal, borderRadius: '10px' }}>
                  <BarisRingkas label='Total Kewajiban' nilai={t.kewajiban} />
                  <BarisRingkas label='Total Ekuitas' nilai={t.ekuitas} />
                  <BarisRingkas label='TOTAL KEWAJIBAN + EKUITAS' nilai={t.pasiva} tebal garis />
                </div>

                <TabelRincian
                  judul='Rincian Hutang Lain (terbuka)'
                  catatan='Informasi pendukung — sudah termasuk di saldo akun hutang/modal, tidak dijumlahkan lagi.'
                  baris={hutangLain}
                  labelTotal='Hutang'
                />
              </div>
            </div>
            <div className='mb-5' />
          </>
        )}
      </div>
    </Container>
  );
};

export default BalanceSheet;
