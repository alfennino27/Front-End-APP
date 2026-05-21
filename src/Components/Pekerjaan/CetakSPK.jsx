import React, { useEffect, useState } from 'react';
import { getImageUrl } from '../../Utils/image';
import klfLogo from '../../assets/images/klflogo.png';

const fmt = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const CetakSPK = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('cetakSPK');
    if (stored) setData(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (data) window.print();
  }, [data]);

  if (!data) return null;

  const { project, category, spkCode, images, printDate } = data;
  const mainImage = images[0];
  const extraImages = images;

  // Split extra images into groups of 4
  const imagePages = [];
  for (let i = 0; i < extraImages.length; i += 4) {
    imagePages.push(extraImages.slice(i, i + 4));
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 11px; }
        .page { width: 297mm; min-height: 210mm; page-break-after: always; display: flex; flex-direction: column; }
        .page:last-child { page-break-after: auto; }

        /* === Page 1: SPK Template === */
        .spk-header { display: flex; border: 1px solid #333; }
        .spk-header-left { flex: 1; padding: 10px 14px; border-right: 1px solid #333; }
        .spk-header-right { flex: 1; padding: 10px 14px; }
        .spk-header-right table { width: 100%; border-collapse: collapse; }
        .spk-header-right td { padding: 3px 6px; vertical-align: top; }
        .spk-header-right td:first-child { font-weight: bold; white-space: nowrap; width: 110px; }

        .spk-body { display: flex; flex: 1; border: 1px solid #333; border-top: none; }
        .spk-body-left { width: 45%; border-right: 1px solid #333; display: flex; align-items: center; justify-content: center; padding: 10px; }
        .spk-body-left img { max-width: 100%; max-height: 130mm; object-fit: contain; }
        .spk-body-right { flex: 1; padding: 10px 14px; overflow: hidden; }
        .spk-body-right h6 { font-weight: bold; font-size: 11px; margin-bottom: 4px; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
        .spk-body-right pre { font-family: Arial, sans-serif; font-size: 10px; white-space: pre-wrap; line-height: 1.5; }

        .spk-footer { display: flex; border: 1px solid #333; border-top: none; }
        .spk-footer-logo { width: 80px; padding: 8px; display: flex; align-items: center; justify-content: center; border-right: 1px solid #333; }
        .spk-footer-logo img { width: 60px; opacity: 0.85; }
        .spk-footer-boxes { display: flex; flex: 1; }
        .spk-footer-box { flex: 1; border-left: 1px solid #333; padding: 6px 10px; min-height: 55px; }
        .spk-footer-box:first-child { border-left: none; }
        .spk-footer-box p { font-weight: bold; font-size: 10px; margin-bottom: 2px; }

        /* === Page 2+: Image Grid === */
        .img-page-title { text-align: center; font-weight: bold; font-size: 13px; margin-bottom: 10px; margin-top: 6px; }
        .img-grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 10px; flex: 1; }
        .img-grid-item { border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 4px; min-height: 85mm; }
        .img-grid-item img { max-width: 100%; max-height: 100%; object-fit: contain; }

        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* PAGE 1: SPK Template */}
      <div className="page">
        {/* Header row */}
        <div className="spk-header">
          <div className="spk-header-left">
            <div><strong>Tanggal cetak</strong> &nbsp;: {fmt(printDate)}</div>
            <div style={{ marginTop: '6px' }}><strong>Deadline</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {fmt(project[`DeadlineSupplier${category}`])}</div>
          </div>
          <div className="spk-header-right">
            <table>
              <tbody>
                <tr>
                  <td>Cust</td>
                  <td>: {project.Buyer}</td>
                </tr>
                <tr>
                  <td>Nama barang</td>
                  <td>: {project.NamaBarang}</td>
                </tr>
                <tr>
                  <td>Kode SPK</td>
                  <td>: {spkCode || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Body: image + keterangan */}
        <div className="spk-body">
          <div className="spk-body-left">
            {mainImage
              ? <img src={getImageUrl(mainImage)} alt="Gambar Produk" />
              : <span style={{ color: '#aaa', fontSize: '10px' }}>No Image</span>
            }
          </div>
          <div className="spk-body-right">
            <h6>Keterangan</h6>
            <pre>{project[`Description${category}`] || '-'}</pre>
          </div>
        </div>

        {/* Footer: signature boxes */}
        <div className="spk-footer">
          <div className="spk-footer-logo">
            <img src={klfLogo} alt="KLF" />
          </div>
          <div className="spk-footer-boxes">
            <div className="spk-footer-box">
              <p>Penanggung jawab</p>
            </div>
            <div className="spk-footer-box">
              <p>Diantar oleh</p>
            </div>
            <div className="spk-footer-box">
              <p>Supplier</p>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE 2+: Image grid pages */}
      {imagePages.map((pageImages, pageIdx) => (
        <div key={pageIdx} className="page" style={{ padding: '4mm' }}>
          <div className="img-page-title">
            Gambar Spesifik — {project.NamaBarang} ({category}) — Halaman {pageIdx + 2}
          </div>
          <div className="img-grid">
            {pageImages.map((imgSrc, i) => (
              <div key={i} className="img-grid-item">
                <img src={getImageUrl(imgSrc)} alt={`Gambar ${pageIdx * 4 + i + 1}`} />
              </div>
            ))}
            {/* Fill empty slots so grid stays 2x2 */}
            {pageImages.length < 4 && [...Array(4 - pageImages.length)].map((_, i) => (
              <div key={`empty-${i}`} className="img-grid-item" style={{ border: '1px dashed #ccc', background: '#fafafa' }} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
};

export default CetakSPK;
