import React, { useEffect, useState } from 'react';
import { getImageUrl } from '../../Utils/image';

// Halaman cetak Detail Piutang — isinya sama dengan pop up Detail Piutang
// (header, Tabel Item, Tabel Payment). Data dikirim lewat localStorage.cetakPiutang.
const rupiah = (n) => `Rp. ${Number(n || 0).toLocaleString('id-ID')}`;
const fmtTanggal = (t) => {
  if (!t) return '-';
  const d = new Date(t);
  if (isNaN(d.getTime())) return '-';
  const p = (x) => String(x).padStart(2, '0');
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`;
};

const CetakPiutang = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('cetakPiutang');
    if (stored) setData(JSON.parse(stored));
  }, []);

  // Tunggu semua gambar selesai dimuat baru print, supaya bukti tidak kosong di PDF.
  useEffect(() => {
    if (!data) return;
    const imgs = Array.from(document.images);
    Promise.all(imgs.map(img => img.complete ? null : new Promise(r => { img.onload = r; img.onerror = r; })))
      .then(() => setTimeout(() => window.print(), 300));
  }, [data]);

  if (!data) return <p style={{ padding: 20 }}>Data piutang tidak ditemukan.</p>;

  const { piutang, items = [], payments = [] } = data;
  const totalPiutang = items.reduce((a, i) => a + Number(i.nominal || 0), 0);
  const totalBayar = payments.reduce((a, p) => a + Number(p.jumlah || 0), 0);

  return (
    <div className="cetak-piutang">
      <style>{`
        .cetak-piutang { font-family: Arial, sans-serif; font-size: 13px; color: #000; padding: 16px; background: #fff; }
        .cetak-piutang h2 { margin: 0 0 16px; font-size: 22px; }
        .cetak-piutang .info { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; margin-bottom: 18px; }
        .cetak-piutang .info p { margin: 0; }
        .cetak-piutang .judul { font-weight: 600; margin: 14px 0 6px; }
        .cetak-piutang table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        .cetak-piutang th, .cetak-piutang td { padding: 8px; text-align: left; vertical-align: top; border-bottom: 1px solid #dee2e6; }
        .cetak-piutang thead th { background: #f8f9fa; border-bottom: 2px solid #adb5bd; }
        .cetak-piutang tbody tr:nth-child(odd) td { background: #f2f2f2; }
        .cetak-piutang td.img img { width: 50px; }
        .cetak-piutang tr.total td { font-weight: 600; background: #fff !important; border-top: 2px solid #adb5bd; }
        .cetak-piutang tr { page-break-inside: avoid; }
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <h2>Detail Piutang</h2>
      <div className="info">
        <p><strong>Nama :</strong> {piutang?.nama}</p>
        <p><strong>Piutang :</strong> {rupiah(totalPiutang)}</p>
        <p><strong>Tanggal :</strong> {piutang?.tanggal ? piutang.tanggal.split('-').reverse().join('-') : '-'}</p>
        <p><strong>Sisa :</strong> {rupiah(totalPiutang - totalBayar)}</p>
      </div>

      <p className="judul">Tabel Item</p>
      <table>
        <thead>
          <tr><th style={{ width: 40 }}>No</th><th style={{ width: 80 }}>Gambar</th><th>Keterangan</th><th style={{ width: 160 }}>Nominal</th></tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.id || i}>
              <td>{i + 1}</td>
              <td className="img">{item.image ? <img src={getImageUrl(item.image)} alt="" /> : null}</td>
              <td>{item.keterangan}</td>
              <td>{rupiah(item.nominal)}</td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#888' }}>Belum ada item</td></tr>}
          <tr className="total"><td colSpan={3}>Total</td><td>{rupiah(totalPiutang)}</td></tr>
        </tbody>
      </table>

      <p className="judul">Tabel Payment</p>
      <table>
        <thead>
          <tr><th style={{ width: 40 }}>No</th><th style={{ width: 80 }}>Gambar</th><th>Detail</th><th style={{ width: 110 }}>Tanggal</th><th style={{ width: 160 }}>Jumlah</th></tr>
        </thead>
        <tbody>
          {payments.map((p, i) => (
            <tr key={p.id || i}>
              <td>{i + 1}</td>
              <td className="img">{p.image ? <img src={getImageUrl(p.image)} alt="" /> : null}</td>
              <td>{p.detail}</td>
              <td>{fmtTanggal(p.tanggal)}</td>
              <td>{rupiah(p.jumlah)}</td>
            </tr>
          ))}
          {payments.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>Belum ada payment</td></tr>}
          <tr className="total"><td colSpan={4}>Total</td><td>{rupiah(totalBayar)}</td></tr>
        </tbody>
      </table>
    </div>
  );
};

export default CetakPiutang;
