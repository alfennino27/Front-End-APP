import React, { useEffect, useState } from 'react';
import { getImageUrl } from '../../Utils/image';
import klfLogo from '../../assets/images/klflogo.png';
import { SPK_TEMPLATES, SLOT_LETTERS, gridAreasValue } from './spkTemplates';

// Cetak Gambar Kerja (category GambarKerja) — format lembar gambar ala drawing sheet:
// tiap halaman = bingkai gambar + title block di bawah (logo, product, drafter, designer,
// date, notes, paraf). Halaman 1 = cover (gambar produk utama), berikutnya = layout gambar
// yang dipilih di SPKLayoutModal. Data dari sessionStorage 'cetakGambarKerja'.

const fmt = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// A4 landscape: 297mm × 210mm. @page margin 8mm → konten 281mm × 194mm
const PAGE_H = 190; // mm (sedikit di bawah 194mm supaya tak tumpah ke halaman kosong)
const FOOTER_H = 22; // mm
const DRAWING_H = PAGE_H - FOOTER_H - 6; // bingkai luar 3mm atas-bawah

const DRAFTER = 'Azwad';
const DESIGNER = 'Karya Logam Furniture';
const NOTES = 'FOR CUSTOMER APPROVAL';

const CetakGambarKerja = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('cetakGambarKerja');
    if (stored) setData(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (data) window.print();
  }, [data]);

  if (!data) return null;

  const { project, coverImage, pages = [], printDate } = data;
  const sheets = [
    ...(coverImage ? [{ template: 'full', slots: [coverImage] }] : []),
    ...pages.filter((p) => p.slots.some(Boolean)),
  ];

  const Footer = () => (
    <table className="gk-footer">
      <colgroup>
        <col style={{ width: '17%' }} />
        <col style={{ width: '25%' }} />
        <col style={{ width: '9%' }} />
        <col style={{ width: '15%' }} />
        <col style={{ width: '10%' }} />
        <col style={{ width: '14%' }} />
        <col style={{ width: '10%' }} />
      </colgroup>
      <tbody>
        <tr className="gk-label-row">
          <td rowSpan={2} className="gk-logo">
            <img src={klfLogo} alt="KLF" />
            <span>KARYA LOGAM<br />FURNITURE</span>
          </td>
          <td>PRODUCT :</td>
          <td>DRAFTER :</td>
          <td>DESIGNER :</td>
          <td>DATE :</td>
          <td>NOTES :</td>
          <td>PARAF :</td>
        </tr>
        <tr className="gk-value-row">
          <td>{project.NamaBarang || '-'}</td>
          <td>{DRAFTER}</td>
          <td>{DESIGNER}</td>
          <td>{fmt(printDate)}</td>
          <td>{NOTES}</td>
          <td />
        </tr>
      </tbody>
    </table>
  );

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #fff !important; background-image: none !important; }
        body { font-family: Arial, sans-serif; color: #111; }

        .gk-page {
          width: 100%;
          height: ${PAGE_H}mm;
          border: 0.4mm solid #333;
          padding: 3mm;
          display: flex;
          flex-direction: column;
          gap: 3mm;
          overflow: hidden;
          page-break-after: always;
        }
        .gk-page:last-child { page-break-after: auto; }

        .gk-drawing {
          height: ${DRAWING_H - 3}mm;
          border: 0.3mm solid #333;
          padding: 4mm;
          display: grid;
          gap: 4mm;
        }
        .gk-slot {
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          min-height: 0;
          min-width: 0;
        }
        .gk-slot img { max-width: 100%; max-height: 100%; object-fit: contain; }

        .gk-footer {
          width: 100%;
          height: ${FOOTER_H}mm;
          border-collapse: collapse;
          table-layout: fixed;
        }
        .gk-footer td { border: 0.3mm solid #333; padding: 1mm 2mm; vertical-align: top; }
        .gk-label-row td { height: 5mm; font-size: 8px; font-weight: bold; }
        .gk-value-row td { font-size: 12px; vertical-align: middle; }
        .gk-logo { text-align: left; vertical-align: middle !important; }
        .gk-logo img { width: 12mm; vertical-align: middle; margin-right: 2mm; }
        .gk-logo span { display: inline-block; vertical-align: middle; font-size: 10px; font-weight: bold; line-height: 1.2; }

        @media print {
          @page { size: A4 landscape; margin: 8mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {sheets.map((page, pageIdx) => {
        const tpl = SPK_TEMPLATES[page.template] || SPK_TEMPLATES['4-grid'];
        return (
          <div key={pageIdx} className="gk-page">
            <div
              className="gk-drawing"
              style={{
                gridTemplateColumns: tpl.cols,
                gridTemplateRows: tpl.rows,
                gridTemplateAreas: gridAreasValue(tpl.areas),
              }}
            >
              {page.slots.map((imgSrc, i) => (
                <div key={i} className="gk-slot" style={{ gridArea: SLOT_LETTERS[i] }}>
                  {imgSrc && <img src={getImageUrl(imgSrc)} alt={`Gambar ${i + 1}`} />}
                </div>
              ))}
            </div>
            <Footer />
          </div>
        );
      })}
    </>
  );
};

export default CetakGambarKerja;
