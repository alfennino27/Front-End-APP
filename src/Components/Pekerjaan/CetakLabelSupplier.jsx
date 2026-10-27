import React, { useEffect, useState } from 'react';
import { labelKategori } from '../../Utils/kategori';
import { getImageUrl } from '../../Utils/image';

const WANTED_SECTIONS = ['DIMENSI', 'BAHAN', 'MODEL'];

const extractDimensiBahan = (text) => {
  if (!text) return '-';

  const hasWantedSection = WANTED_SECTIONS.some(s => new RegExp(`^${s}\\s*:`, 'im').test(text));
  if (!hasWantedSection) return text;

  const lines = text.split('\n');
  const result = [];
  let currentHeader = null;
  let inWanted = false;

  for (const line of lines) {
    const headerMatch = line.match(/^([A-Z][A-Z\s]*):\s*$/);
    if (headerMatch) {
      const header = headerMatch[1].trim().toUpperCase();
      currentHeader = header;
      inWanted = WANTED_SECTIONS.includes(header);
      if (inWanted) result.push(line);
    } else if (inWanted) {
      result.push(line);
    }
  }

  return result.join('\n').trim() || text;
};

const BELUM_ADA_SUPPLIER = 'Belum ada Supplier';

const fmtDeadline = (d) => {
  if (!d) return '-';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Senin 00:00 minggu ini (minggu = Senin–Minggu, sama dgn filter periode di ListPekerjaan)
const awalMingguIni = () => {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() + (day === 0 ? -6 : 1 - day));
  start.setHours(0, 0, 0, 0);
  return start;
};

const waktu = (v) => {
  if (!v) return NaN;
  return new Date(v).getTime();
};

// Kelompok minggu untuk periode "Semua": offset minggu dari minggu ini;
// -1 = lewat deadline, null = tanpa tanggal.
const offsetMinggu = (v, senin) => {
  const t = waktu(v);
  if (isNaN(t)) return null;
  if (t < senin.getTime()) return -1;
  return Math.floor((t - senin.getTime()) / (7 * 24 * 3600 * 1000));
};

const labelMinggu = (off, senin) => {
  if (off === null) return 'Tanpa Deadline';
  if (off === -1) return 'Lewat Deadline';
  const minggu = new Date(senin);
  minggu.setDate(senin.getDate() + off * 7 + 6);
  const sd = minggu.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const nama = off === 0 ? 'Minggu Ini' : off === 1 ? 'Minggu Depan' : `${off} Minggu Lagi`;
  return `${nama} (max ${sd})`;
};

const CetakLabelSupplier = () => {
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('');
  const [supplier, setSupplier] = useState('');
  const [basis, setBasis] = useState('supplier');
  const [periode, setPeriode] = useState('semua');

  useEffect(() => {
    const stored = localStorage.getItem('cetakLabelSupplier') ?? sessionStorage.getItem('cetakLabelSupplier');
    if (stored) {
      const data = JSON.parse(stored);
      setItems(data.items || []);
      setCategory(data.category || '');
      setSupplier(data.supplier || '');
      // Data lama tanpa basis → tetap tampil deadline supplier seperti sebelumnya.
      setBasis(data.basis || 'supplier');
      setPeriode(data.periode || 'semua');
    }
  }, []);

  // Kolom tanggal ikut filter: customer = Target Kirim project, supplier = deadline SPK per category.
  const tanggalItem = (item) => basis === 'customer' ? item.TargetKirim : item[`DeadlineSupplier${category}`];
  const judulTanggal = basis === 'customer' ? 'Deadline Kirim' : 'Deadline Supplier';

  // Selalu urut tanggal terdekat dulu; tanpa tanggal di paling bawah.
  const urutTanggal = (arr) => [...arr].sort((a, b) => {
    const ta = waktu(tanggalItem(a)), tb = waktu(tanggalItem(b));
    if (isNaN(ta) && isNaN(tb)) return 0;
    if (isNaN(ta)) return 1;
    if (isNaN(tb)) return -1;
    return ta - tb;
  });

  const senin = awalMingguIni();
  const kelompokMinggu = periode === 'semua';

  // Baris item + (periode Semua) header minggu tiap kali minggunya berganti.
  // `mulaiNo` supaya nomor tetap berlanjut antar grup supplier.
  const renderBaris = (daftar, mulaiNo = 0) => {
    const rows = [];
    let mingguSebelum;
    urutTanggal(daftar).forEach((item, i) => {
      if (kelompokMinggu) {
        const off = offsetMinggu(tanggalItem(item), senin);
        if (off !== mingguSebelum) {
          mingguSebelum = off;
          rows.push(
            <tr key={`minggu-${off}-${i}`}>
              <td colSpan={5} style={{ background: off === -1 ? '#f8d7da' : '#fff3cd', fontWeight: 'bold', padding: '4px 8px' }}>
                {labelMinggu(off, senin)}
              </td>
            </tr>
          );
        }
      }
      const no = mulaiNo + i + 1;
      rows.push(
        <tr key={`${item.id || 'x'}-${no}`}>
          <td className="no">{no}</td>
          <td className="gambar">
            {item.image1
              ? <img src={getImageUrl(item.image1)} alt={item.NamaBarang} />
              : <span style={{ color: '#aaa', fontSize: '10px' }}>No Image</span>
            }
          </td>
          <td>
            <strong>{item.NamaBarang}</strong>{item.Qty ? <span style={{ fontWeight: 600 }}> — {item.Qty} pcs</span> : null}
            {item.Buyer && <><br /><span style={{ color: '#555' }}>{item.Buyer}</span></>}
          </td>
          <td style={{ whiteSpace: 'pre-wrap' }}>{extractDimensiBahan(item[`Description${category}`])}</td>
          <td className="deadline">{fmtDeadline(tanggalItem(item))}</td>
        </tr>
      );
    });
    return rows;
  };

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
          td { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <h2>Daftar Pesanan — {labelKategori(category)}</h2>
      <p className="subtitle">Supplier: {supplier || 'Semua Supplier'}</p>

      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Gambar</th>
            <th>Produk / Customer</th>
            <th>Deskripsi Spesifik</th>
            <th>{judulTanggal}</th>
          </tr>
        </thead>
        <tbody>
          {supplier === '' ? (
            // Mode semua supplier: kelompokkan per supplier dengan header row
            (() => {
              const groups = {};
              items.forEach(item => {
                // Category multi pengrajin (Pengrajin<cat>) → item masuk ke tiap grup pengrajinnya
                const multi = item[`Pengrajin${category}`];
                const daftar = Array.isArray(multi) && multi.length ? multi : [item[`Supplier${category}`] || BELUM_ADA_SUPPLIER];
                daftar.forEach(s => {
                  if (!groups[s]) groups[s] = [];
                  groups[s].push(item);
                });
              });
              let globalNo = 0;
              // Grup "Belum ada Supplier" selalu paling bawah.
              const entries = Object.entries(groups).sort(([a], [b]) => (a === BELUM_ADA_SUPPLIER) - (b === BELUM_ADA_SUPPLIER));
              return entries.map(([supplierName, groupItems]) => (
                <React.Fragment key={supplierName}>
                  <tr>
                    <td colSpan={5} style={{ background: '#dce4f0', fontWeight: 'bold', fontSize: '13px', padding: '6px 8px' }}>
                      {supplierName} ({groupItems.length} item)
                    </td>
                  </tr>
                  {(() => { const r = renderBaris(groupItems, globalNo); globalNo += groupItems.length; return r; })()}
                </React.Fragment>
              ));
            })()
          ) : (
            // Mode satu supplier
            renderBaris(items)
          )}
          {items.length === 0 && (
            <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa' }}>Tidak ada data</td></tr>
          )}
        </tbody>
      </table>
    </>
  );
};

export default CetakLabelSupplier;
