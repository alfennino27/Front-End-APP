import React, { useEffect, useMemo, useState } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import { Select, message } from 'antd';
import AccountingMenu from './AccountingMenu';
import { getApiBaseUrl } from '../../Config/APIurl';
import { getImageUrl } from '../../Utils/image';

// Temuan Koreksi — jurnal bermasalah hasil analisa keuangan (diisi Claude per batch).
// Korektif saja: user pilih akun yang benar (jurnal langsung diubah, jejak di riwayatAkun)
// atau tandai "sudah benar" dengan alasan. Setelah itu baris hilang dari daftar.

const IZIN = ['fYpdHwXRDLhj5XGxM5FZIAvxp9E2', 'w4M5JJjgGQeHFbS2nkyoCfUBE532', '4WGPaHicKWYr0Ny84IUh8xb9Bo62', 'ANGTwgX8KxXQy5Ww3cwpLrG0tFT2', 'gwsOqUgVXSPyWFMMHr4bJteBoYs1', '6D4XVa5BSSOl1ugUlkDlTea2COX2', 'MjOCxfNdGtf0q12BPzj0EYAcVJD3', 'knydS6fIBdOwHS37dDm3ZDNQXKQ2', 'Q3LWLX4D7Ye8hMnQVF9fa7SZb953', 'ep15dsFMceTBAyZvpZDiAJ4kMME3'];
const NAMA_BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const JENIS = { akun_kosong: 'Akun kosong', salah_akun: 'Akun perlu dicek' };

const rp = (v) => `Rp ${Math.round(Number(v || 0)).toLocaleString('id-ID')}`;
const jt = (v) => `${(Number(v || 0) / 1e6).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} jt`;
const tglPendek = (t) => (t ? `${Number(t.slice(8, 10))} ${NAMA_BULAN[Number(t.slice(5, 7)) - 1]} ${t.slice(2, 4)}` : '-');

const TemuanKoreksi = () => {
  const baseUrl = getApiBaseUrl();
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;

  useEffect(() => {
    if (user == null) { window.location.replace('/login'); return; }
    if (!IZIN.includes(user.uid)) window.location.replace('/accounting');
  }, []);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pilihan, setPilihan] = useState({}); // id -> { debet, kredit, catatan }
  const [menyimpan, setMenyimpan] = useState(null); // id yang sedang disimpan
  const [cari, setCari] = useState('');
  const [urut, setUrut] = useState('tanggal');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${baseUrl}/accounting/temuan-koreksi/get`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Gagal mengambil data');
      setData(json);
    } catch (err) {
      console.error('Gagal mengambil temuan koreksi:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const opsiAkun = useMemo(() => (data?.akun || []).map((a) => ({
    value: a.kodeAkun,
    label: `${a.kodeAkun} ${a.namaAkun}`,
  })), [data]);

  // nilai awal pilihan: akun yang sudah ada, atau saran dari analisa
  const nilai = (it, sisi) => {
    const p = pilihan[it.id] || {};
    if (p[sisi] !== undefined) return p[sisi];
    if (sisi === 'catatan') return '';
    const saran = sisi === 'debet' ? it.saran.kodeAkunDebet : it.saran.kodeAkunKredit;
    const sekarang = sisi === 'debet' ? it.kodeAkunDebet : it.kodeAkunKredit;
    return saran || sekarang || undefined;
  };
  const ubah = (id, sisi, v) => setPilihan((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), [sisi]: v } }));

  const simpan = async (it, tandaiBenar) => {
    const body = { id: it.id, uid: user?.uid, catatan: nilai(it, 'catatan') };
    if (tandaiBenar) {
      if (!String(body.catatan || '').trim()) { message.warning('Tulis alasan singkat di kolom catatan dulu'); return; }
      body.tandaiBenar = true;
    } else {
      body.kodeAkunDebet = nilai(it, 'debet');
      body.kodeAkunKredit = nilai(it, 'kredit');
      if (!body.kodeAkunDebet || !body.kodeAkunKredit) { message.warning('Pilih akun debet dan kredit dulu'); return; }
    }
    setMenyimpan(it.id);
    try {
      const res = await fetch(`${baseUrl}/accounting/temuan-koreksi/selesaikan`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Gagal menyimpan');
      message.success(json.message);
      setData((prev) => ({ ...prev, items: prev.items.filter((x) => x.id !== it.id), selesai: prev.selesai + 1 }));
    } catch (err) {
      message.error(err.message);
    } finally {
      setMenyimpan(null);
    }
  };

  const itemsTampil = useMemo(() => {
    if (!data) return [];
    const q = cari.trim().toLowerCase();
    const list = data.items.filter((it) => !q || `${it.keterangan} ${it.catatanJurnal} ${it.pesan} ${it.nominal}`.toLowerCase().includes(q));
    if (urut === 'nominal') return [...list].sort((a, b) => b.nominal - a.nominal);
    return list;
  }, [data, cari, urut]);

  const perBatch = useMemo(() => {
    const g = {};
    itemsTampil.forEach((it) => { (g[it.batch] = g[it.batch] || []).push(it); });
    return Object.entries(g);
  }, [itemsTampil]);

  const totalNominal = (data?.items || []).reduce((s, it) => s + it.nominal, 0);

  // ----- gaya -----
  const kartu = { border: '1px solid #dddddd', borderRadius: '10px', padding: '14px 18px', background: '#fff', flex: '1 1 200px' };
  const th = { border: '1px solid #c2c2c2', padding: '7px 8px', fontSize: '12px', backgroundColor: 'blue', color: 'white', textAlign: 'center', position: 'sticky', top: 0, zIndex: 1 };
  const td = { border: '1px solid #e1e1e1', padding: '5px 8px', fontSize: '12px', verticalAlign: 'middle' };
  const tdR = { ...td, textAlign: 'right', whiteSpace: 'nowrap' };
  const tombol = (warna, isi) => ({ fontSize: '12px', padding: '3px 10px', border: `1px solid ${warna}`, borderRadius: '5px', background: isi ? warna : 'white', color: isi ? 'white' : warna, cursor: 'pointer', whiteSpace: 'nowrap' });

  const selAkun = (it, sisi) => {
    const terisi = sisi === 'debet' ? it.kodeAkunDebet : it.kodeAkunKredit;
    const namaTerisi = sisi === 'debet' ? it.namaAkunDebet : it.namaAkunKredit;
    // akun_kosong: sisi yang sudah terisi cukup ditampilkan; salah_akun: dua sisi bisa diganti
    if (it.jenis === 'akun_kosong' && terisi) {
      return <td style={td}><span style={{ color: '#495057' }}>{terisi} {namaTerisi}</span></td>;
    }
    const v = nilai(it, sisi);
    const kosong = !v;
    return (
      <td style={{ ...td, padding: '3px 4px', background: kosong ? '#fff5f5' : undefined }}>
        <Select
          showSearch
          allowClear
          value={v}
          placeholder='Pilih akun…'
          options={opsiAkun}
          optionFilterProp='label'
          onChange={(val) => ubah(it.id, sisi, val || '')}
          style={{ width: '100%', minWidth: 190, fontSize: '12px' }}
          size='small'
          popupMatchSelectWidth={320}
        />
        {it.jenis === 'salah_akun' && terisi && v !== terisi && (
          <div style={{ fontSize: '11px', color: '#868e96', marginTop: 2 }}>Sekarang: {terisi} {namaTerisi}</div>
        )}
      </td>
    );
  };

  return (
    <Container fluid className='px-4 pb-5'>
      <div className='mt-4'>
        <div className='mb-2'><AccountingMenu /></div>
        <h4 className='fw-semibold mb-0' style={{ color: 'blue' }}>Temuan Koreksi</h4>
        <div style={{ fontSize: '12px', color: '#6c757d', maxWidth: 720 }}>
          Jurnal yang perlu dicek dari hasil analisa keuangan. Pilih akun yang benar lalu klik Simpan (jurnal langsung diperbaiki),
          atau klik Sudah benar dengan alasan di kolom catatan. Baris yang sudah beres hilang dari daftar.
        </div>
      </div>

      {loading && <div className='text-center my-5'><Spinner animation='border' /></div>}
      {error && <div className='alert alert-danger mt-3'>{error}</div>}

      {data && !loading && (
        <>
          <div className='d-flex gap-3 flex-wrap mt-3'>
            <div style={kartu}>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>Perlu dicek</div>
              <div style={{ fontSize: '22px', fontWeight: 600, color: data.items.length ? '#c0392b' : '#1e7e34' }}>{data.items.length} jurnal</div>
            </div>
            <div style={kartu}>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>Total nominal</div>
              <div style={{ fontSize: '22px', fontWeight: 600 }}>{jt(totalNominal)}</div>
            </div>
            <div style={kartu}>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>Sudah beres</div>
              <div style={{ fontSize: '22px', fontWeight: 600, color: '#1e7e34' }}>{data.selesai}</div>
            </div>
          </div>

          {data.items.length === 0 ? (
            <div className='mt-4 p-4 text-center' style={{ border: '1px solid #dddddd', borderRadius: '10px', background: '#f6fbf7', color: '#1e7e34' }}>
              Tidak ada temuan yang perlu dicek. Daftar akan terisi lagi setelah analisa berikutnya.
            </div>
          ) : (
            <>
              <div className='d-flex gap-2 align-items-center flex-wrap mt-4'>
                <input type='search' placeholder='Cari keterangan atau nominal…' value={cari} onChange={(e) => setCari(e.target.value)}
                  style={{ fontSize: '13px', padding: '4px 8px', border: '1px solid blue', borderRadius: '5px', width: 260 }} />
                <select value={urut} onChange={(e) => setUrut(e.target.value)}
                  style={{ fontSize: '13px', padding: '4px 8px', border: '1px solid blue', borderRadius: '5px' }}>
                  <option value='tanggal'>Urut tanggal</option>
                  <option value='nominal'>Nominal terbesar dulu</option>
                </select>
              </div>

              {perBatch.map(([batch, list]) => (
                <div key={batch} className='mt-3'>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: 6 }}>
                    {batch} <span style={{ fontWeight: 400, color: '#6c757d', fontSize: '12px' }}>· {list.length} jurnal · {rp(list.reduce((s, x) => s + x.nominal, 0))}</span>
                  </div>
                  <div style={{ overflow: 'auto', maxHeight: '70vh', border: '1px solid #dddddd', borderRadius: '10px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
                      <thead>
                        <tr>
                          <th style={th}>Tanggal</th><th style={th}>Keterangan</th><th style={th}>Nominal</th>
                          <th style={th}>Akun debet</th><th style={th}>Akun kredit</th><th style={th}>Catatan</th><th style={th}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((it) => (
                          <tr key={it.id}>
                            <td style={{ ...td, whiteSpace: 'nowrap' }}>{tglPendek(it.tanggal)}</td>
                            <td style={{ ...td, minWidth: 220 }}>
                              <div style={{ fontWeight: 600 }}>{it.keterangan || '(tanpa keterangan)'}</div>
                              {it.catatanJurnal && <div style={{ color: '#868e96' }}>Catatan jurnal: {it.catatanJurnal}</div>}
                              <div style={{ color: it.jenis === 'salah_akun' ? '#9a6b00' : '#c0392b', fontSize: '11px' }}>
                                {JENIS[it.jenis] || it.jenis}{it.pesan ? ` · ${it.pesan}` : ''}
                              </div>
                              {it.image && <a href={getImageUrl(it.image)} target='_blank' rel='noreferrer' style={{ fontSize: '11px' }}>Lihat bukti</a>}
                            </td>
                            <td style={tdR}>{rp(it.nominal)}</td>
                            {selAkun(it, 'debet')}
                            {selAkun(it, 'kredit')}
                            <td style={{ ...td, padding: '3px 4px' }}>
                              <input value={nilai(it, 'catatan')} onChange={(e) => ubah(it.id, 'catatan', e.target.value)}
                                placeholder='opsional / alasan'
                                style={{ width: '100%', minWidth: 140, border: '1px solid #ccc', borderRadius: '4px', padding: '3px 6px', fontSize: '12px' }} />
                            </td>
                            <td style={{ ...td, whiteSpace: 'nowrap' }}>
                              <div className='d-flex gap-1'>
                                <button type='button' disabled={menyimpan === it.id} style={tombol('blue', true)} onClick={() => simpan(it, false)}>
                                  {menyimpan === it.id ? 'Menyimpan…' : 'Simpan'}
                                </button>
                                <button type='button' disabled={menyimpan === it.id} style={tombol('#6c757d', false)} onClick={() => simpan(it, true)}
                                  title='Jurnal tidak diubah. Isi alasan di kolom catatan.'>
                                  Sudah benar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {list.length === 0 && (
                          <tr><td style={{ ...td, textAlign: 'center', padding: '20px' }} colSpan={7}>Tidak ada yang cocok.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              {perBatch.length === 0 && <div className='mt-3' style={{ fontSize: '13px', color: '#6c757d' }}>Tidak ada yang cocok dengan pencarian.</div>}
            </>
          )}
        </>
      )}
    </Container>
  );
};

export default TemuanKoreksi;
