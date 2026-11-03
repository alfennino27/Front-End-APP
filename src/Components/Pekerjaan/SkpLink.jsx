import React from 'react';

// Lampiran file SketchUp (.skp) di komentar: kotak biru "SKP" + nama file,
// klik → unduh (browser tidak bisa membuka .skp, jadi dibuka di SketchUp).
const SkpLink = ({ href, url, size }) => {
  // Nama asli tanpa prefix timestamp multer ("1730000000000-Meja_Makan.skp").
  const nama = decodeURIComponent((url || '').split('/').pop()).replace(/^\d{10,}-/, '');
  const box = size || 88;
  return (
    <a
      href={href}
      download={nama}
      title={`Unduh ${nama}`}
      onClick={(e) => e.stopPropagation()}
      style={{
        display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        width: box, height: box, marginRight: 8, verticalAlign: 'top', borderRadius: 10,
        background: '#e3f2fd', color: '#1565c0', border: '1px solid #90caf9',
        textDecoration: 'none', padding: 4, overflow: 'hidden', textAlign: 'center',
      }}
    >
      <b style={{ fontSize: 16 }}>SKP</b>
      <span style={{ fontSize: 9, lineHeight: 1.1, wordBreak: 'break-all', maxHeight: 30, overflow: 'hidden' }}>{nama}</span>
    </a>
  );
};

export default SkpLink;
