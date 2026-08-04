import React, { useEffect, useState } from 'react';
import { getImageUrl } from '../../Utils/image';

const CetakLabel = () => {
  const [labels, setLabels] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedLabels = sessionStorage.getItem('cetakLabel');
    if (storedLabels) {
      setLabels(JSON.parse(storedLabels));
    }
    setReady(true);
  }, []);

  // Print setelah label ter-render DAN gambar selesai dimuat (lihat CetakLabel.jsx)
  useEffect(() => {
    if (!ready) return;
    let printed = false;
    const doPrint = () => {
      if (printed) return;
      printed = true;
      window.print();
    };

    const pending = Array.from(document.images).filter((img) => !img.complete);
    if (pending.length === 0) {
      const t = setTimeout(doPrint, 150);
      return () => clearTimeout(t);
    }

    let left = pending.length;
    const tick = () => { if (--left <= 0) doPrint(); };
    pending.forEach((img) => {
      img.addEventListener('load', tick, { once: true });
      img.addEventListener('error', tick, { once: true });
    });
    const timeout = setTimeout(doPrint, 8000);
    return () => clearTimeout(timeout);
  }, [ready, labels]);

  return (
    <>
      <style>{`
        .label-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .label-card {
          border: 1px solid #ccc;
          border-radius: 8px;
          padding: 10px;
          text-align: center;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
          box-sizing: border-box;
          page-break-inside: avoid;
        }

        .label-card img {
          max-width: 180px;
          max-height: 180px;
          border-radius: 8px;
          margin: 10px auto;
        }

        .label-card .header, .label-card .footer {
          font-weight: bold;
        }

        .label-card .details {
          margin-top: 5px;
          margin-bottom: 5px;
          margin-left:10px;
          text-align: left;
        }

        @media print {
          @page { size: A4 portrait; margin: 10mm; }

          html, body { background: #fff !important; }

          /* box-shadow rgba → transparency group di PDF/spooler; sebagian
             driver printer men-drop seluruh halaman (kertas keluar kosong). */
          .label-card {
            box-shadow: none !important;
            border: 1px solid #000 !important;
            background: #fff !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .label-card img {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
      <div className="label-container">
        {labels.flatMap((item, index) => {
          // Jumlah lembar = Jumlah Print (bebas). Fallback ke quantity utk label lama.
          const copies = Math.max(1, Number(item.jumlahPrint ?? item.quantity) || 1);
          return Array.from({ length: copies }, (_, i) => (
            <div key={`${index}-${i}`} className="label-card">
              <div className="fw-bold text-center">{item.productName}</div>
              <img src={getImageUrl(item.image)} alt={item.productName} />
              <div className="border text-start small" style={{ paddingLeft:"5px" }}>Ukuran : {item.ukuranQC}</div>
              <div className="border text-start small" style={{ paddingLeft:"5px" }}>Bentuk :</div>
              <div className="border text-start small" style={{ paddingLeft:"5px" }}>Finishing : {item.finishingQC}</div>
              <div className="border text-start small" style={{ paddingLeft:"5px" }}>Kerapian :</div>
              <div className="border text-start small" style={{ paddingLeft:"5px" }}>Jenis Marmer : {item.jenisMarmerQC}</div>
              <div className="border text-start small" style={{ paddingLeft:"5px" }}>Jenis Kain : {item.jenisKainQC}</div>
              <div className="border text-start small" style={{ paddingLeft:"5px" }}>Kebersihan :</div>
              <div className="border text-start small" style={{ paddingLeft:"5px" }}>Flat Kaca :</div>
              <div className="border text-start small" style={{ paddingLeft:"5px" }}>Sepatu :</div>
              <div className="border text-start small" style={{ paddingLeft:"5px" }}>Bungkus :</div>
              <div className="border text-start small" style={{ paddingLeft:"5px" }}>Foto :</div>
            </div>
          ));
        })}
      </div>
    </>
  );
};

export default CetakLabel;
