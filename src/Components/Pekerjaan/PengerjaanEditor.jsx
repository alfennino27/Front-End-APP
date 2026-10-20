import React, { useState } from 'react';
import { Select } from 'antd';
import { MdDelete } from 'react-icons/md';
import { getApiBaseUrl } from '../../Config/APIurl';

// Editor "Pengerjaan" di modal Category: satu category (mis. Kayu) dikerjakan
// >1 pengrajin — tiap baris = 1 item SPK dgn bagian (teks bebas), supplier,
// SPK, deadline, status. Disimpan oleh DetailPekerjaan.handleSubmit lewat
// POST /pengerjaan/save & /pengerjaan/hapus (backend: routes/spk/spk.js).

export const STATUS_PENGERJAAN = ['Belum Proses', 'Proses', 'QC Pass', 'Servis', 'Selesai', 'Ready Stock'];

export const barisBaru = (deadline = '') => ({
  key: `baru-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  idSpkProduct: null,
  bagian: '',
  supplier: '',
  idSPK: '',
  deadline,
  statusPengerjaan: 'Belum Proses',
  keterangan: '',
  harga: 0,
});

const fieldStyle = { fontSize: 16, minHeight: 40 };

export default function PengerjaanEditor({ rows, setRows, onHapus, suppliers, spkList, onSpkCreated, orderDate, globalTheme }) {
  const baseUrl = getApiBaseUrl();
  const [kodeBaru, setKodeBaru] = useState({});
  const terang = globalTheme === 'light';

  const ubah = (key, patch) => setRows(prev => prev.map(r => (r.key === key ? { ...r, ...patch } : r)));

  const buatSPK = async (row) => {
    const code = (kodeBaru[row.key] || '').trim();
    if (!code) { alert('Ketik SPK Code baru dulu.'); return; }
    if (!row.supplier) { alert('Pilih supplier dulu.'); return; }
    try {
      const res = await fetch(`${baseUrl}/spk/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pengrajin: row.supplier, tanggalCetak: orderDate || '', code, status: 'Draft' }),
      });
      const data = await res.json();
      if (!res.ok) { alert(`Gagal membuat SPK: ${data.message}`); return; }
      if (data.insertedId) ubah(row.key, { idSPK: data.insertedId });
      setKodeBaru(prev => ({ ...prev, [row.key]: '' }));
      onSpkCreated?.();
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat membuat SPK');
    }
  };

  const kartu = {
    border: `1px solid ${terang ? '#c9c9c9' : '#555'}`,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    background: terang ? '#fafafa' : '#1e1e1e',
  };

  return (
    <div>
      {rows.map((row, i) => {
        const opsiSPK = spkList.filter(s => s.pengrajin === row.supplier);
        return (
          <div key={row.key} style={kartu}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <strong>Bagian {i + 1}</strong>
              <button
                type="button"
                onClick={() => onHapus(row)}
                style={{ border: 'none', background: 'transparent', color: '#dc3545', padding: 8, minWidth: 40, minHeight: 40 }}
                aria-label="Hapus bagian"
              >
                <MdDelete size={22} />
              </button>
            </div>

            <label>Bagian :</label>
            <input
              className="form-control"
              style={fieldStyle}
              placeholder="mis. Kaki / Top Table"
              value={row.bagian}
              onChange={(e) => ubah(row.key, { bagian: e.target.value })}
            />

            <label className="mt-2">Supplier :</label>
            <select
              className="form-control"
              style={fieldStyle}
              value={row.supplier || ''}
              onChange={(e) => ubah(row.key, { supplier: e.target.value, idSPK: '' })}
            >
              <option value="" disabled>Select Supplier</option>
              {suppliers.map(s => <option key={s.id || s.supplierName} value={s.supplierName}>{s.supplierName}</option>)}
              {row.supplier && !suppliers.some(s => s.supplierName === row.supplier) && (
                <option value={row.supplier}>{row.supplier}</option>
              )}
            </select>

            <label className="mt-2">SPK Code <small style={{ color: '#888' }}>(boleh dikosongkan dulu)</small> :</label>
            <Select
              showSearch
              placeholder="Pilih SPK"
              value={row.idSPK || undefined}
              onChange={(v) => ubah(row.key, { idSPK: v || '' })}
              onSearch={(v) => { if (v) setKodeBaru(prev => ({ ...prev, [row.key]: v })); }}
              optionFilterProp="label"
              style={{ width: '100%', minHeight: 40 }}
              getPopupContainer={(t) => t.parentNode}
              allowClear
              options={opsiSPK.map(s => ({ value: s.id, label: s.code }))}
              notFoundContent={row.supplier ? 'SPK belum ada — ketik kode lalu "Buat SPK"' : 'Pilih supplier dulu'}
            />
            {!row.idSPK && row.supplier && (
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <input
                  className="form-control"
                  style={fieldStyle}
                  placeholder="SPK Code baru"
                  value={kodeBaru[row.key] || ''}
                  onChange={(e) => setKodeBaru(prev => ({ ...prev, [row.key]: e.target.value }))}
                />
                <button type="button" className="btn btn-outline-secondary" style={{ whiteSpace: 'nowrap', minHeight: 40 }} onClick={() => buatSPK(row)}>
                  Buat SPK
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 140px' }}>
                <label className="mt-2">Deadline :</label>
                <input
                  className="form-control"
                  style={fieldStyle}
                  type="date"
                  value={row.deadline || ''}
                  onChange={(e) => ubah(row.key, { deadline: e.target.value })}
                />
              </div>
              <div style={{ flex: '1 1 140px' }}>
                <label className="mt-2">Status :</label>
                <select
                  className="form-control"
                  style={fieldStyle}
                  value={row.statusPengerjaan || ''}
                  onChange={(e) => ubah(row.key, { statusPengerjaan: e.target.value || null })}
                >
                  <option value="">— Tidak ada status —</option>
                  {STATUS_PENGERJAAN.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <label className="mt-2">Keterangan untuk pengrajin :</label>
            <textarea
              className="form-control"
              style={fieldStyle}
              rows={3}
              value={row.keterangan || ''}
              onChange={(e) => ubah(row.key, { keterangan: e.target.value })}
            />
            {Number(row.harga) > 0 && (
              <small style={{ color: '#888' }}>Sudah ada harga di SPK — hapus bagian ini dari halaman SPK.</small>
            )}
          </div>
        );
      })}
    </div>
  );
}
