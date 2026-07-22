import React, { useEffect, useState } from 'react';
import { getImageUrl } from '../../Utils/image';

const CetakLabel = () => {
  const [labels, setLabels] = useState([]);

  useEffect(() => {
    const storedLabels = sessionStorage.getItem('cetakLabel');
    if (storedLabels) {
      setLabels(JSON.parse(storedLabels));
    }
  }, []);

  useEffect(() => {
    window.print();
  }, []);

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
          .label-container {
            page-break-inside: avoid;
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
