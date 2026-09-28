import React from 'react';

// Pilihan cepat catatan penerimaan barang. Dipakai di Quote, Invoice, dan
// Pengiriman supaya kalimatnya seragam & mudah dibaca ekspedisi.
export const PRESET_CATATAN = [
  'Hanya diterima hari & jam kerja (Senin–Jumat 08.00–17.00)',
  'Telepon penerima 1 jam sebelum tiba',
  'Tidak menerima hari Sabtu/Minggu',
  'Akses jalan sempit / tidak bisa truk besar',
  'Tanpa lift, barang naik tangga',
];

/**
 * Textarea catatan penerimaan + chip pilihan cepat (klik = tambah baris,
 * klik lagi = hapus baris itu).
 * Props: value, onChange(str), style (untuk textarea), muted (warna chip), rows
 */
const CatatanPenerimaanInput = ({ value, onChange, style, muted = '#64748b', rows = 3, placeholder }) => {
  const lines = String(value || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const toggle = (p) => {
    const next = lines.includes(p) ? lines.filter((l) => l !== p) : [...lines, p];
    onChange(next.join('\n'));
  };
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
        {PRESET_CATATAN.map((p) => {
          const on = lines.includes(p);
          return (
            <button
              key={p}
              type="button"
              onClick={() => toggle(p)}
              style={{
                border: `1px solid ${on ? '#dc2626' : muted}`,
                background: on ? '#dc2626' : 'transparent',
                color: on ? '#fff' : muted,
                borderRadius: 999, padding: '3px 10px', fontSize: 12, cursor: 'pointer', lineHeight: 1.4,
              }}
            >
              {on ? '✓ ' : '+ '}{p}
            </button>
          );
        })}
      </div>
      <textarea
        className="form-control"
        rows={rows}
        style={style}
        value={value || ''}
        placeholder={placeholder || 'Request customer saat barang diterima, mis. hanya jam kerja, telepon dulu, dsb.'}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default CatatanPenerimaanInput;
