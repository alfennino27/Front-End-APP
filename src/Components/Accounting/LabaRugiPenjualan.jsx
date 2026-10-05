import React, { useRef, useEffect, useState } from 'react';
import { Col, Row, Modal, Button, Container, Dropdown } from 'react-bootstrap';
import AccountingMenu from './AccountingMenu';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useNavigate } from 'react-router-dom';
import { FaPaste } from 'react-icons/fa';
import { DatePicker, Space } from 'antd';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { ambilSpkTenagaIds } from '../../Utils/invoiceFinancial';
import ExportLabaRugiPdf from './ExportLabaRugiPdf';
import RincianAkunModal from './RincianAkunModal';
import InvoiceBiayaModal from './InvoiceBiayaModal';
import {
  buatLaporanPenjualan, buatLaporanPenjualanRange, persenGrossProfit,
  hitungPenjualanPerBulan, daftarBulan, labelBulan, labelRange,
} from '../../Utils/labaRugiReport';
import HppLuarInvoiceTable from './HppLuarInvoiceTable';
import GrafikBulanan from './GrafikBulanan';

const { RangePicker } = DatePicker;

const rp = (n) => `Rp. ${Math.round(Number(n || 0)).toLocaleString('id-ID')}`;

const Jurnal = () => {
  const baseUrl = getApiBaseUrl();
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;
  useEffect(() => {
    const cekLogin = () => {
      if (user == null) {
        window.location.replace('/login');
      }
      if (user.uid === 'fYpdHwXRDLhj5XGxM5FZIAvxp9E2' || user.uid === 'w4M5JJjgGQeHFbS2nkyoCfUBE532' || user.uid === '4WGPaHicKWYr0Ny84IUh8xb9Bo62' || user.uid === 'ANGTwgX8KxXQy5Ww3cwpLrG0tFT2' || user.uid === 'gwsOqUgVXSPyWFMMHr4bJteBoYs1' || user.uid === '6D4XVa5BSSOl1ugUlkDlTea2COX2' || user.uid === 'MjOCxfNdGtf0q12BPzj0EYAcVJD3' || user.uid === 'knydS6fIBdOwHS37dDm3ZDNQXKQ2' || user.uid === 'Q3LWLX4D7Ye8hMnQVF9fa7SZb953' || user.uid === 'ep15dsFMceTBAyZvpZDiAJ4kMME3') {
        console.log('success');
      } else {
        window.location.replace('/accounting');
      }
    };

    cekLogin();
  }, []);


  const [showTambahDataModal, setShowTambahDataModal] = useState(false);
  const [showEditDataModal, setShowEditDataModal] = useState(false);


  const [dataInvoice, setDataInvoice] = useState([]);
  const [dataInvoicePengeluaran, setDataInvoicePengeluaran] = useState([]);
  const [dataProject, setDataProject] = useState([]);
  const [dataSPKProduct, setDataSPKProduct] = useState([]);
  // idSPK milik pengrajin borong tenaga — HPP kategorinya dikunci ke estimasi.
  const [spkTenagaIds, setSpkTenagaIds] = useState(new Set());
  const [dataJurnal, setDataJurnal] = useState([]);
  const [dataAkun, setDataAkun] = useState([]);



  const tableContainerStyle = {
    marginLeft: '20px',
    marginRight: '20px',
    marginTop: '-10px',
    overflowX: 'auto',
    borderRadius: '10px',
    border: '1px solid #dddddd',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0',
  };

  const thTdStyle = {
    border: '1px solid #c2c2c2',
    textAlign: 'left',
    padding: '8px',
    fontSize: '12px',
  };

  const thStyle = {
    ...thTdStyle,
    backgroundColor: 'blue',
    textAlign: 'center',
    color: 'white',
    position: 'sticky',
    top: 0,
    zIndex: 1
  };

  const tbodyTrOddStyle = {
    backgroundColor: '#ffffff',
  };

  const tbodyTrEvenStyle = {
    backgroundColor: '#F4F4F4',
  };

  const tbodyTrLastChildTdFirstChildStyle = {
    borderBottomLeftRadius: '10px',
  };

  const tbodyTrLastChildTdLastChildStyle = {
    borderBottomRightRadius: '10px',
  };


  const fetchDataJurnal = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/jurnal/get`);
      const data = await res.json();
      setDataJurnal(data);
    } catch (err) {
      console.error('Gagal mengambil data Jurnal:', err);
    }
  };

  const fetchDataAkun = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/akun/get`);
      const data = await res.json();
      setDataAkun(data);
    } catch (err) {
      console.error('Gagal mengambil data Akun:', err);
    }
  };

  const fetchDataInvoice = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/invoice/get`);
      const data = await res.json();
      setDataInvoice(data);
    } catch (err) {
      console.error('Gagal mengambil data Invoice:', err);
    }
  };

  const fetchDataInvoicePengeluaran = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/invoicePengeluaran/get`);
      const data = await res.json();
      setDataInvoicePengeluaran(data);
    } catch (err) {
      console.error('Gagal mengambil data InvoicePengeluaran:', err);
    }
  };

  const fetchDataProject = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/projects/get`);
      const data = await res.json();
      setDataProject(data);
    } catch (err) {
      console.error('Gagal mengambil data Project:', err);
    }
  };

  const fetchDataSPKProduct = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/spkproduct/get`);
      const data = await res.json();
      setDataSPKProduct(data);
    } catch (err) {
      console.error('Gagal mengambil data SPKProduct:', err);
    }
  };



  useEffect(() => {
    fetchDataJurnal();
    fetchDataAkun();
    fetchDataInvoice();
    fetchDataInvoicePengeluaran();
    fetchDataProject();
    fetchDataSPKProduct();
    ambilSpkTenagaIds(baseUrl).then(setSpkTenagaIds);
  }, []);

  // Periode laporan: satu bulan ("bulan") atau rentang beberapa bulan ("range").
  // Disimpan juga di query URL (?bulan= / ?awal=&akhir=) supaya periode tidak
  // hilang saat refresh dan bisa dibuka di tab baru.
  const periodeAwal = useMemo(() => {
    const q = new URLSearchParams(window.location.search);
    const bulan = q.get('bulan');
    const awal = q.get('awal');
    const akhir = q.get('akhir');
    if (awal && akhir) return { mode: 'range', filterDate: null, range: [awal, akhir] };
    if (bulan) return { mode: 'bulan', filterDate: bulan, range: [null, null] };
    return { mode: 'bulan', filterDate: null, range: [null, null] };
  }, []);

  const [mode, setMode] = useState(periodeAwal.mode);
  const [filterDate, setFilterDate] = useState(periodeAwal.filterDate);
  const [rangeBulan, setRangeBulan] = useState(periodeAwal.range);
  // Akun yang diklik di tabel Pengeluaran → popup rincian jurnalnya.
  const [akunDipilih, setAkunDipilih] = useState(null);
  // Invoice yang diklik di tabel Penjualan → popup biaya/estimasi HPP.
  const [invoiceDipilih, setInvoiceDipilih] = useState(null);

  // Daftar bulan yang sedang ditampilkan — satu-satunya sumber periode untuk
  // semua tabel, grafik, dan popup rincian.
  const bulanList = useMemo(() => {
    if (mode === 'range') return daftarBulan(rangeBulan[0], rangeBulan[1]);
    return filterDate ? [filterDate] : [];
  }, [mode, filterDate, rangeBulan]);

  const adaPeriode = bulanList.length > 0;
  const modeRange = bulanList.length > 1;
  const labelPeriode = adaPeriode ? labelRange(bulanList[0], bulanList[bulanList.length - 1]) : '-';

  const dataMentah = {
    dataInvoice, dataProject, dataSPKProduct, dataInvoicePengeluaran, dataAkun, dataJurnal, spkTenagaIds,
  };

  // Semua angka halaman (penjualan, HPP di luar invoice, operasional, rekap per
  // bulan) dihitung oleh util yang sama dengan PDF → layar & laporan tidak bisa beda.
  const hasil = useMemo(
    () => (adaPeriode ? hitungPenjualanPerBulan(bulanList, dataMentah) : null),
    [bulanList, dataInvoice, dataProject, dataSPKProduct, dataInvoicePengeluaran, dataAkun, dataJurnal, spkTenagaIds]
  );

  const handleDateChange = (_, dateString) => setFilterDate(dateString || null); // "YYYY-MM"

  // Periode ikut ditulis ke URL (replace, bukan push) — tab ini tidak menambah
  // riwayat back, tapi link-nya bisa di-copy / dibuka ulang.
  useEffect(() => {
    const q = new URLSearchParams();
    if (mode === 'range') {
      if (rangeBulan[0] && rangeBulan[1]) { q.set('awal', rangeBulan[0]); q.set('akhir', rangeBulan[1]); }
    } else if (filterDate) {
      q.set('bulan', filterDate);
    }
    const url = q.toString() ? `${window.location.pathname}?${q}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [mode, filterDate, rangeBulan]);

  // Klik satu bulan di grafik / rekap → laporan bulan itu dibuka di TAB BARU
  // (link biasa, bukan window.open), supaya rentang di tab ini tidak hilang dan
  // tetap bisa klik-tengah / ⌘-klik.
  const hrefBulan = (bulan) => `${window.location.pathname}?bulan=${bulan}`;

  // Data untuk export PDF — bulan dipilih di modal, jadi laporannya dihitung
  // ulang dari data mentah yang sudah ter-fetch (bukan dari tabel di layar).
  const buatLaporanPdf = (bulan) => buatLaporanPenjualan(bulan, dataMentah);

  // Mode range: bulan-bulan dalam rentang digabung + grafik bulanan.
  const buatLaporanPdfRange = (awal, akhir) => buatLaporanPenjualanRange(awal, akhir, dataMentah);

  return (
    <>
      <Container>
        <div className='mt-4 px-4'>
          <div className='row'>
            <div className="col d-flex flex-wrap justify-content-between align-items-center gap-2">
              <AccountingMenu />

              <div className="d-flex flex-wrap align-items-center gap-2">
                <ExportLabaRugiPdf bulanAktif={filterDate} buatLaporan={buatLaporanPdf} buatLaporanRange={buatLaporanPdfRange} />

                {/* Pilih periode: satu bulan atau rentang beberapa bulan */}
                <div className="d-flex" role="group">
                  {[['bulan', 'Bulan'], ['range', 'Rentang']].map(([nilai, label], i) => (
                    <button
                      key={nilai}
                      type="button"
                      onClick={() => setMode(nilai)}
                      style={{
                        border: '1px solid blue',
                        background: mode === nilai ? 'blue' : '#fff',
                        color: mode === nilai ? '#fff' : 'blue',
                        fontSize: 13, padding: '4px 12px',
                        borderRadius: i === 0 ? '5px 0 0 5px' : '0 5px 5px 0',
                        borderLeftWidth: i === 0 ? 1 : 0,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {mode === 'range' ? (
                  <RangePicker
                    picker="month"
                    style={{ borderColor: 'blue', color: 'blue' }}
                    value={rangeBulan[0] && rangeBulan[1] ? [dayjs(rangeBulan[0], 'YYYY-MM'), dayjs(rangeBulan[1], 'YYYY-MM')] : null}
                    onChange={(_, dateStrings) => setRangeBulan(dateStrings || [null, null])}
                  />
                ) : (
                  <DatePicker
                    picker="month"
                    style={{ borderColor: 'blue', color: 'blue' }}
                    value={filterDate ? dayjs(filterDate, 'YYYY-MM') : null}
                    onChange={handleDateChange}
                  />
                )}
              </div>

            </div>


          </div>

        </div>
        <div className='mt-3' style={{ maxHeight: '77vh', overflowY: 'auto' }}>
          {!adaPeriode && (
            <p className='px-4 text-muted' style={{ fontSize: 13 }}>
              Pilih bulan (atau rentang bulan) dulu untuk menampilkan laporan.
            </p>
          )}

          {modeRange && hasil && (
            <>
              <GrafikBulanan rekap={hasil.rekap} hrefBulan={hrefBulan} />

              <p className='fw-semibold px-4 mt-4 mb-2'>
                Rekap per Bulan{' '}
                <span className='fw-normal text-muted' style={{ fontSize: 12 }}>· klik bulan untuk buka detailnya di tab baru</span>
              </p>
              <div style={tableContainerStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Bulan</th>
                      <th style={thStyle}>Penjualan</th>
                      <th style={thStyle}>Gross Profit</th>
                      <th style={thStyle}>Pengeluaran</th>
                      <th style={thStyle}>Keuntungan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hasil.rekap.map((r, index) => (
                      <tr
                        key={r.bulan}
                        className='tr-hover-effect'
                        style={{ ...(index % 2 === 0 ? tbodyTrEvenStyle : tbodyTrOddStyle) }}
                      >
                        <td style={{ ...thTdStyle, padding: 0 }}>
                          <a
                            href={hrefBulan(r.bulan)}
                            target='_blank'
                            rel='noopener'
                            title='Buka laporan bulan ini di tab baru'
                            style={{ display: 'block', padding: '8px', color: 'blue', textDecoration: 'none' }}
                          >
                            {labelBulan(r.bulan)} ›
                          </a>
                        </td>
                        <td style={thTdStyle}>{rp(r.penjualan)}</td>
                        <td style={thTdStyle}>{rp(r.grossProfit)}</td>
                        <td style={thTdStyle}>{rp(r.pengeluaran)}</td>
                        <td style={{ ...thTdStyle, color: r.keuntungan < 0 ? '#c0392b' : undefined }}>{rp(r.keuntungan)}</td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: '#E7E7E8' }} className='fw-semibold'>
                      <td style={thTdStyle}>Total :</td>
                      <td style={thTdStyle}>{rp(hasil.totalPenjualan)}</td>
                      <td style={thTdStyle}>{rp(hasil.totalGrossProfit)}</td>
                      <td style={thTdStyle}>{rp(hasil.totalPenjualan - hasil.keuntungan)}</td>
                      <td style={thTdStyle}>{rp(hasil.keuntungan)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          <p className='fw-semibold px-4 mt-4 mb-2'>
            Penjualan{' '}
            <span className='fw-normal text-muted' style={{ fontSize: 12 }}>· klik invoice untuk lihat / isi biaya</span>
          </p>
          <div style={{ ...tableContainerStyle, maxHeight: '60vh', overflowY: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>No</th>
                  <th style={thStyle}>Tanggal</th>
                  <th style={thStyle}>Kode Invoice</th>
                  <th style={thStyle}>Nominal</th>
                  <th style={thStyle}>Gross Profit</th>
                  <th style={thStyle}>% Gross Profit</th>
                </tr>
              </thead>
              <tbody>
                {hasil &&
                  hasil.invoices.map(({ invoice, totalPenjualan, totalGrossProfit }, index) => (
                    <tr
                      key={invoice.id || index}
                      className='tr-hover-effect'
                      onClick={() => setInvoiceDipilih(invoice)}
                      title='Klik untuk lihat / isi biaya'
                      style={{ ...(index % 2 === 0 ? tbodyTrEvenStyle : tbodyTrOddStyle), cursor: 'pointer' }}
                    >
                      <td style={thTdStyle} className="text-center">{index + 1}</td>
                      <td style={thTdStyle}>
                        {new Date(invoice.tanggalMulaiInvoice).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </td>
                      <td style={thTdStyle}><span style={{ color: 'blue' }}>{invoice.kodeInvoice} ›</span></td>
                      <td style={thTdStyle}>{rp(totalPenjualan)}</td>
                      <td style={thTdStyle}>{rp(totalGrossProfit)}</td>
                      <td style={thTdStyle}>{persenGrossProfit(totalGrossProfit, totalPenjualan)}</td>
                    </tr>
                  ))}
                <tr style={{ backgroundColor: '#E7E7E8' }} className='fw-semibold'>
                  <td style={thTdStyle} colSpan={3}>Total : </td>
                  <td style={thTdStyle}>{rp(hasil?.totalPenjualan)}</td>
                  <td style={thTdStyle}>{rp(hasil?.totalGrossProfit)}</td>
                  <td style={thTdStyle}>
                    {hasil ? persenGrossProfit(hasil.totalGrossProfit, hasil.totalPenjualan) : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {hasil && (
            <HppLuarInvoiceTable
              hpp={hasil.hppLuar}
              styles={{ tableContainerStyle, tableStyle, thStyle, thTdStyle, tbodyTrEvenStyle, tbodyTrOddStyle }}
              onPilihAkun={(kode) => setAkunDipilih(dataAkun.find((a) => a.kodeAkun === kode) || null)}
            />
          )}

          <p className='fw-semibold px-4 mt-4 mb-2'>
            Pengeluaran (Operasional){' '}
            <span className='fw-normal text-muted' style={{ fontSize: 12 }}>
              · klik akun untuk lihat rincian{modeRange ? ' seluruh rentang' : ''}
            </span>
          </p>
          <div style={{ ...tableContainerStyle, maxHeight: '60vh', overflowY: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>No</th>
                  <th style={thStyle}>Kode Akun</th>
                  <th style={thStyle}>Nama Akun</th>
                  <th style={thStyle}>Nominal</th>
                </tr>
              </thead>
              <tbody>
                {hasil &&
                  hasil.operasional.map(({ akun, nominal }, index) => (
                    <tr
                      key={akun.kodeAkun}
                      className='tr-hover-effect'
                      onClick={() => setAkunDipilih(akun)}
                      title='Klik untuk lihat rincian'
                      style={{ ...(index % 2 === 0 ? tbodyTrEvenStyle : tbodyTrOddStyle), cursor: 'pointer' }}
                    >
                      <td style={thTdStyle} className="text-center">{index + 1}</td>
                      <td style={thTdStyle}>{akun.kodeAkun}</td>
                      <td style={thTdStyle}><span style={{ color: 'blue' }}>{akun.namaAkun} ›</span></td>
                      <td style={thTdStyle}>{rp(nominal)}</td>
                    </tr>
                  ))}
                <tr style={{ backgroundColor: '#E7E7E8' }} className='fw-semibold'>
                  <td style={thTdStyle} colSpan={3}>Total : </td>
                  <td style={thTdStyle}>{rp(hasil?.totalOperasional)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className='fw-semibold px-4 mt-3'>
            Keuntungan Penjualan {adaPeriode ? `(${labelPeriode})` : ''} : {rp(hasil?.keuntungan)}
          </p>


        </div>

      </Container>

      <InvoiceBiayaModal
        invoice={invoiceDipilih}
        dataProject={dataProject}
        dataSPKProduct={dataSPKProduct}
        dataInvoicePengeluaran={dataInvoicePengeluaran}
        spkTenagaIds={spkTenagaIds}
        onHide={() => setInvoiceDipilih(null)}
        onEstimasiSaved={(idProduct, cat, value) =>
          setDataProject((prev) => prev.map((p) => (p.id === idProduct ? { ...p, [`estimasi${cat}`]: value } : p)))
        }
      />

      <RincianAkunModal
        akun={akunDipilih}
        bulanList={bulanList}
        dataJurnal={dataJurnal}
        dataAkun={dataAkun}
        onHide={() => setAkunDipilih(null)}
        onJurnalUpdated={(id, kodeAkunDebet, kodeAkunKredit) =>
          setDataJurnal((prev) => prev.map((j) => ((j.id || j._id) === id ? { ...j, kodeAkunDebet, kodeAkunKredit } : j)))
        }
      />
    </>
  );
};

export default Jurnal;
