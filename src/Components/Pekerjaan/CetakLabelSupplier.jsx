import React, { useEffect, useState } from 'react';
import { getImageUrl } from '../../Utils/image';

const extractDimensiBahan = (text) => {
  if (!text) return '-';
  const hasDimensi = /DIMENSI\s*:/i.test(text);
  const hasBahan = /BAHAN\s*:/i.test(text);
  if (!hasDimensi && !hasBahan) return text;

  const sections = [];
  const sectionRegex = /^([A-Z][A-Z\s]*):\s*\n([\s\S]*?)(?=\n[A-Z][A-Z\s]*:\s*\n|$)/gm;
  let match;
  while ((match = sectionRegex.exec(text)) !== null) {
    const header = match[1].trim().toUpperCase();
    if (header === 'DIMENSI' || header === 'BAHAN') {
      sections.push(`${match[1].trim()}:\n${match[2].trimEnd()}`);
    }
  }
  return sections.length > 0 ? sections.join('\n\n') : text;
};

const CetakLabelSupplier = () => {
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('');
  const [supplier, setSupplier] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('cetakLabelSupplier');
    if (stored) {
      const data = JSON.parse(stored);
      setItems(data.items || []);
      setCategory(data.category || '');
      setSupplier(data.supplier || '');
    }
  }, []);

  useEffect(() => {
    if (items.length > 0) window.print();
  }, [items]);

  return (
    <>
      <style>{`
        body { font-family: Arial, sans-serif; font-size: 12px; }
        h2 { text-align: center; margin-bottom: 4px; }
        .subtitle { text-align: center; margin-bottom: 16px; color: #555; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #333; padding: 6px 8px; vertical-align: middle; }
        th { background-color: #f0f0f0; text-align: center; font-weight: bold; }
        td.no { text-align: center; width: 36px; }
        td.gambar { text-align: center; width: 80px; }
        td.gambar img { width: 70px; height: 70px; object-fit: cover; border-radius: 4px; }
        td.deadline { width: 100px; }
        @media print {
          @page { size: A4 landscape; margin: 15mm; }
        }
      `}</style>

      <h2>Daftar Pesanan — {category}</h2>
      <p className="subtitle">Supplier: {supplier}</p>

      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Gambar</th>
            <th>Produk / Customer</th>
            <th>Deskripsi Spesifik</th>
            <th>Deadline</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td className="no">{index + 1}</td>
              <td className="gambar">
                {item.image1
                  ? <img src={getImageUrl(item.image1)} alt={item.NamaBarang} />
                  : <span style={{ color: '#aaa', fontSize: '10px' }}>No Image</span>
                }
              </td>
              <td>
                <strong>{item.NamaBarang}</strong>
                {item.Buyer && <><br /><span style={{ color: '#555' }}>{item.Buyer}</span></>}
              </td>
              <td style={{ whiteSpace: 'pre-wrap' }}>{extractDimensiBahan(item[`Description${category}`])}</td>
              <td className="deadline"></td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa' }}>Tidak ada data</td></tr>
          )}
        </tbody>
      </table>
    </>
  );
};

export default CetakLabelSupplier;
