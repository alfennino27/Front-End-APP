import React, { useEffect, useState } from 'react';
import { getImageUrl } from '../../Utils/image';
import klfLogo from '../../assets/images/klflogo.png';

const fmt = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// A4 landscape: 297mm × 210mm. With @page margin 10mm → content = 277mm × 190mm
const PAGE_H = 190; // mm
const HEADER_H = 42; // mm
const FOOTER_H = 23; // mm (reduced 30% from 33mm)
const BODY_H = PAGE_H - HEADER_H - FOOTER_H; // 125mm

const getKeteranganFontSize = (text) => {
  if (!text) return 12;
  // Available height for pre: BODY_H minus ~14mm for h6 header+padding, converted to px at 3.78px/mm
  const availPx = (BODY_H - 14) * 3.78; // ~417px for BODY_H=125
  // Count visual lines: actual newlines + estimate wrapping for long lines
  // Body-right width ~120mm → ~454px; avg char width ≈ fontSize * 0.58
  const rawLines = text.split('\n');
  for (const size of [12, 11, 10, 9, 8]) {
    const charsPerLine = Math.max(20, Math.floor(454 / (size * 0.58)));
    const totalLines = rawLines.reduce(
      (acc, line) => acc + Math.max(1, Math.ceil((line.length || 1) / charsPerLine)),
      0
    );
    if (totalLines * size * 1.6 <= availPx) return size;
  }
  return 8;
};

const IMGPAGE_TITLE_H = 12; // mm
const IMGPAGE_GRID_H = PAGE_H - IMGPAGE_TITLE_H; // 178mm
const IMGPAGE_ROW_H = (IMGPAGE_GRID_H - 4) / 2; // ~87mm per row, 4mm gap

// Hitung css grid-template berdasarkan jumlah gambar di halaman (maks 4).
// 1 → full (1×1), 2 → 2 col 1 row, 3/4 → 2×2
function getGridStyle(count) {
  if (count <= 1) return { cols: '1fr', rows: `${IMGPAGE_GRID_H}mm`, total: 1 };
  if (count === 2) return { cols: '1fr 1fr', rows: `${IMGPAGE_GRID_H}mm`, total: 2 };
  return { cols: '1fr 1fr', rows: `${IMGPAGE_ROW_H}mm ${IMGPAGE_ROW_H}mm`, total: 4 };
}

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

  const { project, category, spkCode, coverImage, imagePages: newImagePages, images, printDate } = data;

  // Support format baru (coverImage + imagePages) dan lama (images flat array)
  const mainImage = coverImage || (images && images[0]);
  let imagePages;
  if (newImagePages) {
    imagePages = newImagePages;
  } else if (images && images.length > 1) {
    const rest = images.slice(1);
    imagePages = [];
    for (let i = 0; i < rest.length; i += 4) imagePages.push(rest.slice(i, i + 4));
  } else {
    imagePages = [];
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; }

        .page {
          overflow: hidden;
          page-break-after: always;
          display: flex;
          flex-direction: column;
        }
        .page:last-child { page-break-after: auto; }

        /* === Page 1: SPK Template === */
        .spk-header {
          display: flex;
          height: ${HEADER_H}mm;
          border: 1px solid #333;
          font-size: 14px;
          font-weight: bold;
        }
        .spk-header-left {
          flex: 1;
          padding: 10px 16px;
          border-right: 1px solid #333;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 8px;
        }
        .spk-header-right {
          flex: 1;
          padding: 8px 16px;
          display: flex;
          align-items: center;
        }
        .spk-header-right table { width: 100%; border-collapse: collapse; }
        .spk-header-right td { padding: 4px 6px; vertical-align: top; font-size: 14px; font-weight: bold; }
        .spk-header-right td:first-child { white-space: nowrap; width: 120px; }

        .spk-body {
          display: flex;
          height: ${BODY_H}mm;
          border: 1px solid #333;
          border-top: none;
        }
        .spk-body-left {
          width: 45%;
          border-right: 1px solid #333;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          overflow: hidden;
        }
        .spk-body-left img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .spk-body-right {
          flex: 1;
          padding: 10px 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .spk-body-right h6 {
          font-weight: bold;
          font-size: 15px;
          margin-bottom: 6px;
          border-bottom: 1px solid #ccc;
          padding-bottom: 4px;
        }
        .spk-body-right pre {
          font-family: Arial, sans-serif;
          white-space: pre-wrap;
          line-height: 1.6;
          overflow: hidden;
          flex: 1;
        }

        .spk-footer {
          display: flex;
          height: ${FOOTER_H}mm;
          border: 1px solid #333;
          border-top: none;
        }
        .spk-footer-logo {
          width: 70px;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-right: 1px solid #333;
          flex-shrink: 0;
        }
        .spk-footer-logo img { width: 52px; opacity: 0.85; }
        .spk-footer-boxes { display: flex; flex: 1; }
        .spk-footer-box {
          flex: 1;
          border-left: 1px solid #333;
          padding: 6px 12px;
        }
        .spk-footer-box:first-child { border-left: none; }
        .spk-footer-box p { font-weight: bold; font-size: 11px; margin-bottom: 2px; }

        /* === Page 2+: Image Grid === */
        .img-page { height: ${PAGE_H}mm; padding: 0; }
        .img-page-title {
          height: ${IMGPAGE_TITLE_H}mm;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 13px;
        }
        .img-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: ${IMGPAGE_ROW_H}mm ${IMGPAGE_ROW_H}mm;
          gap: 4mm;
          height: ${IMGPAGE_GRID_H}mm;
        }
        .img-grid-item {
          border: 1px solid #ccc;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 4px;
        }
        .img-grid-item img { max-width: 100%; max-height: 100%; object-fit: contain; }

        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* PAGE 1: SPK Template */}
      <div className="page" style={{ height: `${PAGE_H}mm` }}>
        <div className="spk-header">
          <div className="spk-header-left">
            <div>Tanggal cetak &nbsp;: {fmt(printDate)}</div>
            <div>Deadline &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {fmt(project[`DeadlineSupplier${category}`])}</div>
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

        <div className="spk-body">
          <div className="spk-body-left">
            {mainImage
              ? <img src={getImageUrl(mainImage)} alt="Gambar Produk" />
              : <span style={{ color: '#aaa', fontSize: '12px' }}>No Image</span>
            }
          </div>
          <div className="spk-body-right">
            <h6>Keterangan</h6>
            <pre style={{ fontSize: `${getKeteranganFontSize(project[`Description${category}`])}px` }}>
              {project[`Description${category}`] || '-'}
            </pre>
          </div>
        </div>

        <div className="spk-footer">
          <div className="spk-footer-logo">
            <img src={klfLogo} alt="KLF" />
          </div>
          <div className="spk-footer-boxes">
            <div className="spk-footer-box"><p>Penanggung jawab</p></div>
            <div className="spk-footer-box"><p>Diantar oleh</p></div>
            <div className="spk-footer-box"><p>Supplier</p></div>
          </div>
        </div>
      </div>

      {/* PAGE 2+: Image grid pages (dynamic layout per jumlah gambar) */}
      {imagePages.map((pageImages, pageIdx) => {
        const { cols, rows, total } = getGridStyle(pageImages.length);
        const emptyCount = total - pageImages.length;
        return (
          <div key={pageIdx} className="page img-page">
            <div className="img-page-title">
              Gambar Spesifik — {project.NamaBarang} ({category})
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: cols,
              gridTemplateRows: rows,
              gap: pageImages.length <= 2 ? '0' : '4mm',
              height: `${IMGPAGE_GRID_H}mm`,
            }}>
              {pageImages.map((imgSrc, i) => (
                <div key={i} className="img-grid-item">
                  <img src={getImageUrl(imgSrc)} alt={`Gambar ${i + 1}`} />
                </div>
              ))}
              {emptyCount > 0 && [...Array(emptyCount)].map((_, i) => (
                <div key={`empty-${i}`} className="img-grid-item" style={{ border: '1px dashed #eee', background: '#fafafa' }} />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
};

export default CetakSPK;
