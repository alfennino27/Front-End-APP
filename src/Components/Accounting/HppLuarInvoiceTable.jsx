import React from 'react';

// Tabel "HPP di Luar Invoice" untuk halaman Laba Rugi (Penjualan & Profit).
// Data dari Utils/labaRugiReport.js → hitungHppLuarInvoice, jadi angka di layar = PDF.
// Selisih bengkel = biaya riil jurnal − estimasi bengkel yang sudah ikut di GP invoice.
// Negatif artinya bengkel lebih hemat dari budget (menambah keuntungan).

const rp = (n) => `Rp. ${Math.round(Number(n || 0)).toLocaleString('id-ID')}`;

const HppLuarInvoiceTable = ({ hpp, styles, onPilihAkun }) => {
  const { tableContainerStyle, tableStyle, thStyle, thTdStyle, tbodyTrEvenStyle, tbodyTrOddStyle } = styles;
  const kanan = { ...thTdStyle, textAlign: 'right', whiteSpace: 'nowrap' };

  return (
    <>
      <p className='fw-semibold px-4 mt-4 mb-2'>
        HPP di Luar Invoice{' '}
        <span className='fw-normal text-muted' style={{ fontSize: 12 }}>
          · GP invoice memakai estimasi bengkel; di sini selisihnya dengan biaya riil + ongkir/packing/hardware
        </span>
      </p>
      <div style={{ ...tableContainerStyle, overflowY: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Pos</th>
              <th style={thStyle}>Akun</th>
              <th style={thStyle}>Riil (jurnal)</th>
              <th style={thStyle}>Sudah di GP</th>
              <th style={thStyle}>Dikurangkan</th>
            </tr>
          </thead>
          <tbody>
            {hpp.bengkel.map((b, i) => (
              <tr key={b.kategori} style={i % 2 === 0 ? tbodyTrEvenStyle : tbodyTrOddStyle}>
                <td style={thTdStyle}>Selisih bengkel {b.kategori}</td>
                <td style={thTdStyle}>{b.akun.join(', ')}</td>
                <td style={kanan}>{rp(b.real)}</td>
                <td style={kanan}>{rp(b.budget)}</td>
                <td style={{ ...kanan, color: b.selisih < 0 ? 'green' : b.selisih > 0 ? '#c0392b' : undefined }}>
                  {rp(b.selisih)}
                </td>
              </tr>
            ))}
            {hpp.lain.map((l, i) => (
              <tr
                key={l.kodeAkun}
                className='tr-hover-effect'
                onClick={() => onPilihAkun && onPilihAkun(l.kodeAkun)}
                title='Klik untuk lihat rincian'
                style={{ ...((i + hpp.bengkel.length) % 2 === 0 ? tbodyTrEvenStyle : tbodyTrOddStyle), cursor: 'pointer' }}
              >
                <td style={thTdStyle}><span style={{ color: 'blue' }}>{l.namaAkun} ›</span></td>
                <td style={thTdStyle}>{l.kodeAkun}</td>
                <td style={kanan}>{rp(l.nominal)}</td>
                <td style={kanan}>-</td>
                <td style={kanan}>{rp(l.nominal)}</td>
              </tr>
            ))}
            {hpp.sudahDijurnal > 0 && (
              <tr style={tbodyTrOddStyle}>
                <td style={thTdStyle}>
                  Koreksi: Pengeluaran Lain sudah dijurnal
                  <div className='text-muted' style={{ fontSize: 11 }}>Sudah mengurangi GP invoice dan sudah ada di jurnal — dihitung sekali saja</div>
                </td>
                <td style={thTdStyle}>-</td>
                <td style={kanan}>-</td>
                <td style={kanan}>{rp(hpp.sudahDijurnal)}</td>
                <td style={{ ...kanan, color: 'green' }}>{rp(-hpp.sudahDijurnal)}</td>
              </tr>
            )}
            <tr style={{ backgroundColor: '#E7E7E8' }} className='fw-semibold'>
              <td style={thTdStyle} colSpan={4}>Total :</td>
              <td style={kanan}>{rp(hpp.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default HppLuarInvoiceTable;
