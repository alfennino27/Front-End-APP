import React, { useEffect, useMemo, useState } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { DatePicker, Checkbox } from 'antd';
import dayjs from 'dayjs';
import AccountingMenu from './AccountingMenu';
import { getApiBaseUrl } from '../../Config/APIurl';
import { SALDO_AWAL_BULAN, hitungNeracaSaldo } from '../../Utils/neraca';

// Neraca Saldo per bulan — dihitung langsung dari jurnal (Utils/neraca.js).
// Pengganti tombol "tutup buku": saldo awal tiap bulan tidak lagi diisi/di-generate
// manual, jadi selalu mutakhir dan tidak bisa diedit tangan.

const IZIN = ['fYpdHwXRDLhj5XGxM5FZIAvxp9E2', 'w4M5JJjgGQeHFbS2nkyoCfUBE532', '4WGPaHicKWYr0Ny84IUh8xb9Bo62', 'ANGTwgX8KxXQy5Ww3cwpLrG0tFT2', 'gwsOqUgVXSPyWFMMHr4bJteBoYs1', '6D4XVa5BSSOl1ugUlkDlTea2COX2', 'MjOCxfNdGtf0q12BPzj0EYAcVJD3', 'knydS6fIBdOwHS37dDm3ZDNQXKQ2', 'Q3LWLX4D7Ye8hMnQVF9fa7SZb953', 'ep15dsFMceTBAyZvpZDiAJ4kMME3'];
const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const rp = (v) => (Math.abs(v) < 1 ? '-' : `Rp ${Math.round(v).toLocaleString('id-ID')}`);
const labelBulan = (b) => `${NAMA_BULAN[Number(b.slice(5, 7)) - 1]} ${b.slice(0, 4)}`;

const tableContainerStyle = { marginTop: '10px', overflow: 'auto', maxHeight: '72vh', borderRadius: '10px', border: '1px solid #dddddd' };
const tableStyle = { width: '100%', borderCollapse: 'separate', borderSpacing: 0 };
const tdStyle = { border: '1px solid #c2c2c2', textAlign: 'left', padding: '6px 8px', fontSize: '12px' };
const tdNum = { ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' };
const thStyle = { ...tdStyle, backgroundColor: 'blue', textAlign: 'center', color: 'white', position: 'sticky', top: 0, zIndex: 1 };
const rowTotal = { backgroundColor: '#E7E7E8', fontWeight: 600 };

const NeracaSaldo = () => {
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
    (async () => {
      try {
        const [akun, jurnal] = await Promise.all(['/accounting/akun/get', '/accounting/jurnal/get'].map(async (p) => {
          const res = await fetch(`${baseUrl}${p}`);
          if (!res.ok) throw new Error(`Gagal ambil ${p}`);
          return res.json();
        }));
        setData({ akun, jurnal });
      } catch (err) {
        console.error('Gagal mengambil data neraca saldo:', err);
        setError(err.message);
      }
    })();
  }, []);

  const ns = useMemo(() => (data ? hitungNeracaSaldo(data.akun, data.jurnal, bulan) : null), [data, bulan]);
  const rows = ns ? ns.rows.filter((r) => tampilNol || Math.abs(r.awal) >= 1 || r.debit || r.kredit) : [];

  return (
    <Container>
      <div className='mt-4 px-4'>
        <div className='d-flex justify-content-between align-items-center flex-wrap' style={{ gap: '10px' }}>
          <AccountingMenu />
          <div className='d-flex align-items-center' style={{ gap: '12px' }}>
            <Checkbox checked={tampilNol} onChange={(e) => setTampilNol(e.target.checked)}>Tampilkan akun tanpa saldo</Checkbox>
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
        {!ns && !error && <div className='mt-5 text-center'><Spinner animation='border' size='sm' /> Memuat neraca saldo…</div>}

        {ns && (
          <>
            <p className='mt-3 mb-1 fw-semibold' style={{ fontSize: '16px' }}>Neraca Saldo {labelBulan(bulan)}</p>
            <p className='mb-1' style={{ fontSize: '12px', color: '#666' }}>
              Dihitung langsung dari jurnal — tidak perlu "tutup buku". Akun neraca: kumulatif sejak saldo pembukaan {labelBulan(SALDO_AWAL_BULAN)};
              akun laba rugi: sejak 1 Januari {bulan.slice(0, 4)}.
            </p>
            {Math.abs(ns.suspense.awal + ns.suspense.debit - ns.suspense.kredit) >= 1 && (
              <p className='mb-1' style={{ fontSize: '12px', color: '#cf1322' }}>
                ⚠ Ada jurnal yang akunnya kosong / tidak terdaftar — neraca tidak seimbang sampai diperbaiki di <Link to='/accounting/temuan-koreksi'>Temuan Koreksi</Link>.
              </p>
            )}

            <div style={tableContainerStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle} rowSpan={2}>Kode</th>
                    <th style={thStyle} rowSpan={2}>Nama Akun</th>
                    <th style={thStyle} rowSpan={2}>Jenis</th>
                    <th style={thStyle} colSpan={2}>Saldo Awal</th>
                    <th style={thStyle} colSpan={2}>Mutasi {NAMA_BULAN[Number(bulan.slice(5, 7)) - 1]}</th>
                    <th style={thStyle} colSpan={2}>Saldo Akhir</th>
                  </tr>
                  <tr>
                    {['Debit', 'Kredit', 'Debit', 'Kredit', 'Debit', 'Kredit'].map((h, i) => <th key={i} style={{ ...thStyle, top: '29px' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const khusus = r.pos === 'labaDitahan' || r.pos === 'suspense';
                    return (
                      <tr key={`${r.kodeAkun}-${r.namaAkun}`} className='tr-hover-effect2' style={{
                        backgroundColor: r.pos === 'suspense' ? '#fff1f0' : i % 2 === 0 ? '#F4F4F4' : '#ffffff',
                        fontStyle: khusus ? 'italic' : undefined,
                      }}>
                        <td style={tdStyle}>{r.kodeAkun}</td>
                        <td style={tdStyle}>{r.namaAkun}</td>
                        <td style={tdStyle}>{r.jenisAkun}</td>
                        <td style={tdNum}>{r.awal > 0 ? rp(r.awal) : '-'}</td>
                        <td style={tdNum}>{r.awal < 0 ? rp(-r.awal) : '-'}</td>
                        <td style={tdNum}>{rp(r.debit)}</td>
                        <td style={tdNum}>{rp(r.kredit)}</td>
                        <td style={tdNum}>{r.akhir > 0 ? rp(r.akhir) : '-'}</td>
                        <td style={tdNum}>{r.akhir < 0 ? rp(-r.akhir) : '-'}</td>
                      </tr>
                    );
                  })}
                  <tr style={rowTotal}>
                    <td style={tdStyle} colSpan={5}>Total</td>
                    <td style={tdNum}>{rp(ns.total.debit)}</td>
                    <td style={tdNum}>{rp(ns.total.kredit)}</td>
                    <td style={tdNum}>{rp(ns.total.akhirDebit)}</td>
                    <td style={tdNum}>{rp(ns.total.akhirKredit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className='mb-5' />
          </>
        )}
      </div>
    </Container>
  );
};

export default NeracaSaldo;
