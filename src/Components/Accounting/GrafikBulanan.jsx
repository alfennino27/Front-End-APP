import React, { useMemo } from 'react';
import { svgGrafikGaris } from '../../Utils/grafikGarisSvg';

// Grafik garis Penjualan / Pengeluaran / Keuntungan per bulan di halaman ERP.
// SVG-nya dibuat oleh Utils/grafikGarisSvg.js — sama persis dengan yang dicetak
// di PDF, jadi layar dan laporan tidak bisa beda. Klik area satu bulan →
// laporan bulan itu dibuka di tab baru (drill-down), rentang di tab ini tetap.

const GrafikBulanan = ({ rekap, hrefBulan }) => {
  const svg = useMemo(() => svgGrafikGaris(rekap, { hrefBulan }), [rekap, hrefBulan]);
  if (!svg) return null;

  return (
    <>
      <p className='fw-semibold px-4 mt-2 mb-2'>
        Grafik Bulanan{' '}
        <span className='fw-normal text-muted' style={{ fontSize: 12 }}>· klik satu bulan untuk buka detailnya di tab baru</span>
      </p>
      <div
        className='mx-4'
        style={{ border: '1px solid #dddddd', borderRadius: 10, padding: 8, background: '#fff' }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </>
  );
};

export default GrafikBulanan;
