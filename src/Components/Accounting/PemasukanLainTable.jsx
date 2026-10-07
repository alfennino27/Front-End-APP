import React from 'react';

// Tabel "Pemasukan Lain" untuk halaman Laba Rugi (Penjualan & Profit).
// Data dari Utils/labaRugiReport.js → hitungPemasukanLain, jadi angka di layar = PDF.
// Uang masuk di luar invoice (mis. customer ganti ongkir) — menambah keuntungan,
// supaya beban ongkir/packing yang sudah diganti customer tidak terlihat rugi.

const rp = (n) => `Rp. ${Math.round(Number(n || 0)).toLocaleString('id-ID')}`;

const PemasukanLainTable = ({ pemasukan, styles, onPilihAkun }) => {
  const { tableContainerStyle, tableStyle, thStyle, thTdStyle, tbodyTrEvenStyle, tbodyTrOddStyle } = styles;
  const kanan = { ...thTdStyle, textAlign: 'right', whiteSpace: 'nowrap' };

  return (
    <>
      <p className='fw-semibold px-4 mt-4 mb-2'>
        Pemasukan Lain{' '}
        <span className='fw-normal text-muted' style={{ fontSize: 12 }}>
          · uang masuk di luar invoice (akun 4200, atau 4100 tanpa invoice) — menambah keuntungan
        </span>
      </p>
      <div style={{ ...tableContainerStyle, maxHeight: '40vh', overflowY: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>No</th>
              <th style={thStyle}>Tanggal</th>
              <th style={thStyle}>Keterangan</th>
              <th style={thStyle}>Akun</th>
              <th style={thStyle}>Nominal</th>
            </tr>
          </thead>
          <tbody>
            {pemasukan.baris.length === 0 && (
              <tr style={tbodyTrEvenStyle}>
                <td style={{ ...thTdStyle, textAlign: 'center' }} colSpan={5} className='text-muted'>Tidak ada pemasukan lain</td>
              </tr>
            )}
            {pemasukan.baris.map((b, i) => (
              <tr
                key={b.jurnal.id || b.jurnal._id || i}
                className='tr-hover-effect'
                onClick={() => onPilihAkun && onPilihAkun(b.kodeAkun)}
                title='Klik untuk lihat rincian akun'
                style={{ ...(i % 2 === 0 ? tbodyTrEvenStyle : tbodyTrOddStyle), cursor: 'pointer' }}
              >
                <td style={thTdStyle} className='text-center'>{i + 1}</td>
                <td style={{ ...thTdStyle, whiteSpace: 'nowrap' }}>
                  {new Date(b.jurnal.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </td>
                <td style={thTdStyle}><span style={{ color: 'blue' }}>{b.jurnal.keterangan || '-'} ›</span></td>
                <td style={thTdStyle}>{b.kodeAkun}</td>
                <td style={{ ...kanan, color: b.nominal > 0 ? 'green' : undefined }}>{rp(b.nominal)}</td>
              </tr>
            ))}
            <tr style={{ backgroundColor: '#E7E7E8' }} className='fw-semibold'>
              <td style={thTdStyle} colSpan={4}>Total :</td>
              <td style={kanan}>{rp(pemasukan.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default PemasukanLainTable;
