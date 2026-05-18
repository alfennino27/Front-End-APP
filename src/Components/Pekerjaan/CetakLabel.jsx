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
          .label-container {
            page-break-inside: avoid;
          }
        }
      `}</style>
      <div className="label-container">
        {labels.flatMap((item, index) =>
          Array.from({ length: item.quantity }, (_, i) => (
            <div key={`${index}-${i}`} className="label-card">
              <div className="header">{item.buyer}</div>
              <div className="details">{item.telephone}</div>
              <div className="details">{item.address}</div>
              <img src={getImageUrl(item.image)} alt={item.productName} />
              <div className="details">{item.productName}</div>
              <div className="footer">Qty Total: {item.quantity} Pcs</div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default CetakLabel;
