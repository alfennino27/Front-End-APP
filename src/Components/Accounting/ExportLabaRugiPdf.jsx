import React, { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { FaFilePdf } from 'react-icons/fa';
import { cetakLaporanLabaRugi } from '../../Utils/labaRugiPdf';
import { labelBulan } from '../../Utils/labaRugiReport';

/**
 * Tombol "Export PDF" untuk halaman Laba Rugi.
 * Bulan yang diexport dipilih sendiri di modal (default = bulan yang sedang
 * ditampilkan di halaman), jadi bisa cetak bulan lain tanpa ganti filter.
 *
 * @param {string|null} bulanAktif - filter bulan halaman ("YYYY-MM")
 * @param {(bulan: string) => object} buatLaporan - penyusun data laporan
 */
const ExportLabaRugiPdf = ({ bulanAktif, buatLaporan }) => {
  const [show, setShow] = useState(false);
  const [bulan, setBulan] = useState(bulanAktif || dayjs().format('YYYY-MM'));

  const buka = () => {
    setBulan(bulanAktif || dayjs().format('YYYY-MM'));
    setShow(true);
  };

  const handleExport = () => {
    if (!bulan) return;
    cetakLaporanLabaRugi(buatLaporan(bulan));
    setShow(false);
  };

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

      <Modal show={show} onHide={() => setShow(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '16px' }}>Export PDF</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-2" style={{ fontSize: '13px' }}>Pilih bulan laporan :</p>
          <DatePicker
            picker="month"
            style={{ width: '100%', borderColor: 'blue' }}
            value={bulan ? dayjs(bulan, 'YYYY-MM') : null}
            onChange={(_, dateString) => setBulan(dateString)}
          />
          <p className="mt-3 mb-0" style={{ fontSize: '12px', color: '#666' }}>
            Laporan {bulan ? labelBulan(bulan) : '-'} akan dibuka di jendela cetak —
            pilih <b>Save as PDF</b> untuk menyimpan filenya.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>Batal</Button>
          <Button variant="primary" onClick={handleExport} disabled={!bulan}>Export PDF</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ExportLabaRugiPdf;
