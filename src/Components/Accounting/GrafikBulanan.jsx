import React, { useMemo } from 'react';
import { svgGrafikGaris } from '../../Utils/grafikGarisSvg';

// Grafik garis Penjualan / Pengeluaran / Keuntungan per bulan di halaman ERP.
// SVG-nya dibuat oleh Utils/grafikGarisSvg.js — sama persis dengan yang dicetak
// di PDF, jadi layar dan laporan tidak bisa beda. Klik area satu bulan →
// halaman pindah ke mode per bulan untuk bulan itu (drill-down).

const GrafikBulanan = ({ rekap, onPilihBulan }) => {
  const svg = useMemo(() => svgGrafikGaris(rekap, { interaktif: true }), [rekap]);
  if (!svg) return null;

  const handleClick = (ev) => {
    const target = ev.target.closest?.('[data-bulan]');
    if (target && onPilihBulan) onPilihBulan(target.getAttribute('data-bulan'));
  };

  return (
    <>
      <p className='fw-semibold px-4 mt-2 mb-2'>
        Grafik Bulanan{' '}
        <span className='fw-normal text-muted' style={{ fontSize: 12 }}>· klik satu bulan untuk lihat detail bulan itu</span>
      </p>
      <div
        className='mx-4'
        style={{ border: '1px solid #dddddd', borderRadius: 10, padding: 8, background: '#fff' }}
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </>
  );
};

export default GrafikBulanan;
