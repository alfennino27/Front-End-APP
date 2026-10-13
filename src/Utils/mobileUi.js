// Gaya kontrol bersama untuk panel daftar (SPK, Invoice) yang ramah HP.

// Tombol ikon kepala daftar (≥40px, ramah jari)
export function iconBtn(aktif, tema) {
  const light = tema === 'light';
  return {
    width: 40, height: 40, borderRadius: 10, fontSize: 21, padding: 0, flexShrink: 0,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    border: `1px solid ${aktif ? '#234dba' : (light ? '#ccc' : '#555')}`,
    background: aktif ? 'rgba(35,77,186,.12)' : 'transparent',
    color: aktif ? '#234dba' : (light ? '#222' : '#eee'),
  };
}

// Input/select filter — font 16px supaya iPhone tidak auto-zoom saat fokus
export function fieldStyle(tema, aktif = false) {
  const light = tema === 'light';
  return {
    minHeight: 40, fontSize: 16, borderRadius: 10, padding: '6px 10px', minWidth: 0,
    border: `1px solid ${aktif ? '#234dba' : (light ? '#ccc' : '#555')}`,
    background: aktif ? (light ? '#eef2ff' : '#1d2a4d') : (light ? '#fff' : '#222'),
    color: light ? '#111' : '#eee', fontWeight: aktif ? 600 : 400,
  };
}

// Kartu daftar/rincian di HP
export function kartuStyle(tema) {
  const light = tema === 'light';
  return {
    borderRadius: 12, padding: 10, marginBottom: 8,
    background: light ? '#fff' : '#1f1f1f',
    border: `1px solid ${light ? '#d6d6d6' : '#444'}`,
    color: light ? '#111' : '#eee',
  };
}
