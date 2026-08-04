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

  // Print baru dipanggil setelah label ter-render DAN semua gambar selesai
  // dimuat. Kalau print() dipanggil terlalu cepat, snapshot yang dikirim ke
  // printer bisa masih kosong / tanpa gambar walau preview terlihat benar.
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
    // Jaring pengaman kalau ada gambar yang gagal/lambat
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
          max-width: 200px;
          max-height: 200px;
          border-radius: 8px;
          margin: 10px auto;
        }

        .label-card .header, .label-card .footer {
          font-weight: bold;
        }

        .label-card .details {
          margin: 5px 0;
        }

        @media print {
          @page { size: A4 portrait; margin: 10mm; }

          html, body { background: #fff !important; }

          /* Efek transparan (box-shadow rgba) memaksa PDF/spooler bikin
             transparency group — sebagian driver printer men-drop seluruh
             halaman jadi kertas kosong padahal preview terlihat normal.
             Untuk cetak: solid semua, tanpa shadow. */
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
          // Jumlah lembar yang dicetak = Jumlah Print (bebas). Fallback ke
          // quantity untuk label lama yang belum punya field jumlahPrint.
          const copies = Math.max(1, Number(item.jumlahPrint ?? item.quantity) || 1);
          return Array.from({ length: copies }, (_, i) => (
            <div key={`${index}-${i}`} className="label-card">
              <div className="header">{item.buyer}</div>
              <div className="details">{item.telephone}</div>
              <div className="details">{item.address}</div>
              <img src={getImageUrl(item.image)} alt={item.productName} />
              <div className="details">{item.productName}</div>
              <div className="footer">Qty Total: {item.quantity} Pcs</div>
            </div>
          ));
        })}
      </div>
    </>
  );
};

export default CetakLabel;
