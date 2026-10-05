import React, { useRef, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { FaFilePdf } from 'react-icons/fa';
import { cetakLaporanLabaRugi } from '../../Utils/labaRugiPdf';
import { labelBulan, labelRange } from '../../Utils/labaRugiReport';

const { RangePicker } = DatePicker;

/**
 * Tombol "Export PDF" untuk halaman Laba Rugi.
 * Dua mode: per bulan (default) dan — kalau halaman mengirim `buatLaporanRange` —
 * rentang beberapa bulan yang datanya digabung + grafik bulanan.
 * Bulan/rentang dipilih sendiri di modal (default = filter yang sedang dipakai
 * halaman), jadi bisa cetak periode lain tanpa ganti filter.
 *
 * @param {string|null} bulanAktif - filter bulan halaman ("YYYY-MM")
 * @param {(bulan: string) => object} buatLaporan - penyusun data laporan 1 bulan
 * @param {((awal: string, akhir: string) => object)=} buatLaporanRange - penyusun laporan rentang
 */
const ExportLabaRugiPdf = ({ bulanAktif, buatLaporan, buatLaporanRange }) => {
  const [show, setShow] = useState(false);
  // Panel bulan antd harus dirender DI DALAM modal — kalau menempel ke <body>
  // posisinya meleset & ketutup backdrop modal bootstrap.
  const wrapperRef = useRef(null);
  const [mode, setMode] = useState('bulan'); // 'bulan' | 'range'
  const [bulan, setBulan] = useState(bulanAktif || dayjs().format('YYYY-MM'));
  const [range, setRange] = useState([null, null]);

  const buka = () => {
    const aktif = bulanAktif || dayjs().format('YYYY-MM');
    setMode('bulan');
    setBulan(aktif);
    setRange([dayjs(aktif, 'YYYY-MM').subtract(5, 'month').format('YYYY-MM'), aktif]);
    setShow(true);
  };

  const rangeValid = !!(range[0] && range[1]);
  const bisaExport = mode === 'bulan' ? !!bulan : rangeValid;

  const handleExport = () => {
    if (!bisaExport) return;
    if (mode === 'range') cetakLaporanLabaRugi(buatLaporanRange(range[0], range[1]));
    else cetakLaporanLabaRugi(buatLaporan(bulan));
    setShow(false);
  };

  const tombolMode = (nilai, label) => (
    <Button
      key={nilai}
      variant={mode === nilai ? 'primary' : 'light'}
      onClick={() => setMode(nilai)}
      className="flex-fill py-2"
      style={{ fontSize: 13, border: '1px solid blue', color: mode === nilai ? '#fff' : 'blue' }}
    >
      {label}
    </Button>
  );

  return (
    <>
      <Button
        variant="light"
        onClick={buka}
        className="text-sm px-2 py-1 d-flex align-items-center gap-1"
        style={{ border: '1px solid blue', borderRadius: '5px', color: 'blue' }}
      >
        <FaFilePdf /> Export PDF
      </Button>

      <Modal show={show} onHide={() => setShow(false)} centered enforceFocus={false}>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '16px' }}>Export PDF</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {buatLaporanRange && (
            <div className="d-flex gap-2 mb-3">
              {tombolMode('bulan', 'Per Bulan')}
              {tombolMode('range', 'Rentang Bulan')}
            </div>
          )}

          <p className="mb-2" style={{ fontSize: '13px' }}>
            {mode === 'range' ? 'Pilih rentang bulan :' : 'Pilih bulan laporan :'}
          </p>
          <div ref={wrapperRef} style={{ position: 'relative' }}>
            {mode === 'range' ? (
              <RangePicker
                picker="month"
                allowClear={false}
                inputReadOnly
                style={{ width: '100%', borderColor: 'blue' }}
                popupStyle={{ zIndex: 2000 }}
                getPopupContainer={() => wrapperRef.current || document.body}
                value={rangeValid ? [dayjs(range[0], 'YYYY-MM'), dayjs(range[1], 'YYYY-MM')] : null}
                onChange={(_, dateStrings) => setRange(dateStrings || [null, null])}
              />
            ) : (
              <DatePicker
                picker="month"
                allowClear={false}
                inputReadOnly
                style={{ width: '100%', borderColor: 'blue' }}
                popupStyle={{ zIndex: 2000 }}
                getPopupContainer={() => wrapperRef.current || document.body}
                value={bulan ? dayjs(bulan, 'YYYY-MM') : null}
                onChange={(_, dateString) => setBulan(dateString)}
              />
            )}
          </div>
          <p className="mt-3 mb-0" style={{ fontSize: '12px', color: '#666' }}>
            Laporan {mode === 'range'
              ? (rangeValid ? labelRange(range[0], range[1]) : '-')
              : (bulan ? labelBulan(bulan) : '-')} akan dibuka di jendela cetak —
            pilih <b>Save as PDF</b> untuk menyimpan filenya.
            {mode === 'range' && (
              <> Penjualan &amp; pengeluaran seluruh bulan digabung, plus grafik penjualan,
                pengeluaran, dan keuntungan per bulan.</>
            )}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>Batal</Button>
          <Button variant="primary" onClick={handleExport} disabled={!bisaExport}>Export PDF</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ExportLabaRugiPdf;
