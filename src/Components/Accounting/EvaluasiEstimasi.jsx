import React, { useEffect, useState } from 'react';
import { Container, Dropdown, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { getApiBaseUrl } from '../../Config/APIurl';

// Evaluasi Estimasi — menilai apakah nilai estimasi per kategori (yang dipakai
// menghitung HPP/GPM invoice) sudah realistis dibanding uang yang benar-benar keluar.
//
// PENTING soal cara baca: bahan dibeli untuk STOK, bukan per order, dan pekerjaan
// bisa jalan di bulan berbeda dari tanggal invoice. Jadi angka per bulan PASTI meleset.
// Yang dipakai mengambil keputusan adalah RASIO KUMULATIF; kolom periode hanya untuk
// melihat arah tren. Basis waktu = tanggal cetak SPK, bukan tanggal invoice.

const EvaluasiEstimasi = () => {
  const baseUrl = getApiBaseUrl();
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;

  useEffect(() => {
    const cekLogin = () => {
      if (user == null) {
        window.location.replace('/login');
        return;
      }
      const izin = ['fYpdHwXRDLhj5XGxM5FZIAvxp9E2', 'w4M5JJjgGQeHFbS2nkyoCfUBE532', '4WGPaHicKWYr0Ny84IUh8xb9Bo62', 'ANGTwgX8KxXQy5Ww3cwpLrG0tFT2', 'gwsOqUgVXSPyWFMMHr4bJteBoYs1', '6D4XVa5BSSOl1ugUlkDlTea2COX2', 'MjOCxfNdGtf0q12BPzj0EYAcVJD3', 'knydS6fIBdOwHS37dDm3ZDNQXKQ2', 'Q3LWLX4D7Ye8hMnQVF9fa7SZb953', 'ep15dsFMceTBAyZvpZDiAJ4kMME3'];
      if (!izin.includes(user.uid)) window.location.replace('/accounting');
    };
    cekLogin();
  }, []);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const bulanIni = new Date().toISOString().slice(0, 7);

  const mundurBulan = (bulan, n) => {
    const [y, m] = bulan.split('-').map(Number);
    const total = y * 12 + (m - 1) - n;
    return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
  };

  // Default: 12 bulan terakhir. Bisa diubah bebas lewat pemilih rentang.
  const [dari, setDari] = useState(mundurBulan(bulanIni, 11));
  const [sampai, setSampai] = useState(bulanIni);
  const [window_, setWindow] = useState(3);
  const [detailDibuka, setDetailDibuka] = useState({});

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${baseUrl}/accounting/variance-estimasi/get?dari=${dari}&sampai=${sampai}&window=${window_}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Gagal mengambil data');
      setData(json);
    } catch (err) {
      console.error('Gagal mengambil evaluasi estimasi:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [dari, sampai, window_]);

  const rp = (v) => `Rp. ${Number(v || 0).toLocaleString('id-ID')}`;

  const tableContainerStyle = {
    marginLeft: '20px', marginRight: '20px', overflow: 'hidden',
    borderRadius: '10px', border: '1px solid #dddddd',
  };
  const tableStyle = { width: '100%', borderCollapse: 'separate', borderSpacing: '0' };
  const thTdStyle = { border: '1px solid #c2c2c2', textAlign: 'left', padding: '8px', fontSize: '12px' };
  const thStyle = { ...thTdStyle, backgroundColor: 'blue', textAlign: 'center', color: 'white' };

  // rasio > 1 = realisasi melebihi estimasi (estimasi kekecilan) -> merah
  const warnaRasio = (rasio) => {
    if (rasio == null) return '#6c757d';
    if (rasio > 1.1) return '#c0392b';
    if (rasio < 0.9) return '#1e7e34';
    return '#0b5ed7';
  };
  const artiRasio = (rasio) => {
    if (rasio == null) return 'belum ada estimasi di periode ini';
    if (rasio > 1.1) return `estimasi KEKECILAN ${Math.round((rasio - 1) * 100)}%`;
    if (rasio < 0.9) return `estimasi KEBESARAN ${Math.round((1 - rasio) * 100)}%`;
    return 'estimasi sudah wajar (dalam \u00b110%)';
  };

  // Rasio real/estimasi hanya sahih kalau DUA syarat terpenuhi:
  //  1. sebagian besar pekerjaan di rentang itu sudah punya angka estimasi (cakupan), DAN
  //  2. rentangnya cukup panjang.
  // Syarat kedua penting: sisi estimasi hanya menghitung pekerjaan yang SPK-nya terbit di
  // rentang ini, sedangkan sisi realisasi menghitung semua uang keluar di rentang ini —
  // termasuk pelunasan SPK lama dan pembelian bahan untuk stok. Di rentang pendek, beda
  // waktu itu tidak sempat saling menghapus dan rasionya jadi omong kosong.
  const CAKUPAN_MINIMUM = 0.8;
  const RENTANG_MINIMUM_BULAN = 12;
  const persen = (v) => (v == null ? '—' : `${Math.round(v * 100)}%`);

  const jumlahBulan = (d, sp) => {
    if (!d || !sp) return 0;
    const [y1, m1] = d.split('-').map(Number);
    const [y2, m2] = sp.split('-').map(Number);
    return (y2 * 12 + m2) - (y1 * 12 + m1) + 1;
  };
  const rentangBulan = data ? jumlahBulan(data.dari, data.sampai) : 0;
  const rentangCukup = rentangBulan >= RENTANG_MINIMUM_BULAN;
  const cakupanCukup = (c) => c != null && c >= CAKUPAN_MINIMUM;
  const rasioSahih = (c) => cakupanCukup(c) && rentangCukup;
  const alasanTidakSahih = (c) => {
    if (!cakupanCukup(c)) return `belum bisa dinilai (cakupan ${persen(c)})`;
    return `belum bisa dinilai (rentang baru ${rentangBulan} bulan, minimal ${RENTANG_MINIMUM_BULAN})`;
  };

  return (
    <Container>
      <div className='mt-4 px-4'>
        <div className='row'>
          <div className="col d-flex justify-content-between align-items-center flex-wrap gap-2">
            <Dropdown>
              <Dropdown.Toggle variant="light" id="dropdown-basic" className="text-sm px-2 py-1" style={{ border: "1px solid blue", borderRadius: "5px", color: "blue" }}>
                Evaluasi Estimasi
              </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/accounting/akun" className="dropdown-link">
                    Akun & Saldo Awal
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/customer" className="dropdown-link">
                    Customer
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/supplier" className="dropdown-link">
                    Supplier
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/aset" className="dropdown-link">
                    Aset
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/buku-besar" className="dropdown-link">
                    Buku Besar
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/neraca-saldo" className="dropdown-link">
                    Neraca Saldo
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/laba-rugi-penjualan" className="dropdown-link">
                    Laba - Rugi Penjualan
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/laba-rugi-cash" className="dropdown-link">
                    Laba - Rugi Cash
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/laba-rugi-profit" className="dropdown-link">
                    Laba - Rugi Profit
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/evaluasi-estimasi" className="dropdown-link" style={{ color: "blue" }}>
                    Evaluasi Estimasi
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/jurnal" className="dropdown-link">
                    Jurnal
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/balance-sheet" className="dropdown-link">
                    Balance Sheet
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/jurnal-penyesuaian" className="dropdown-link">
                    Jurnal Penyesuaian
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/cash-flow" className="dropdown-link">
                    Cash Flow
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/piutang" className="dropdown-link">
                    Piutang
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/hutang" className="dropdown-link">
                    Hutang
                  </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>

            <div className='d-flex align-items-center gap-2'>
              <select
                value={window_}
                onChange={(e) => setWindow(Number(e.target.value))}
                title="Berapa bulan digabung jadi satu baris periode"
                style={{ fontSize: '13px', padding: '4px 8px', borderRadius: '5px', border: '1px solid blue', color: 'blue' }}
              >
                <option value={1}>per 1 bulan</option>
                <option value={3}>per 3 bulan</option>
                <option value={6}>per 6 bulan</option>
              </select>
              <DatePicker.RangePicker
                picker="month"
                allowClear={false}
                value={[dayjs(dari, 'YYYY-MM'), dayjs(sampai, 'YYYY-MM')]}
                style={{ borderColor: 'blue' }}
                onChange={(_, teks) => {
                  if (teks && teks[0] && teks[1]) { setDari(teks[0]); setSampai(teks[1]); }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className='mt-3' style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        {loading && <div className='px-4 py-3'><Spinner animation="border" size="sm" /> <span className='ms-2'>Menghitung…</span></div>}
        {error && <p className='px-4 text-danger'>{error}</p>}

        {!loading && data && (
          <>
            <p className='px-4 mb-3' style={{ fontSize: '12px', color: '#555' }}>
              Periode {data.dari} s/d {data.sampai}, dikelompokkan per {data.window} bulan.
              Pengrajin borong tenaga: {data.pengrajin_tenaga.length ? data.pengrajin_tenaga.join(', ') : <span className='text-danger'>belum ada — atur dulu di halaman Supplier</span>}.
            </p>

            {data.kategori.map((k) => (
              <div key={k.kategori} className='mb-4'>
                <div className='px-4 d-flex justify-content-between align-items-center flex-wrap'>
                  <p className='fw-semibold mb-1'>{k.kategori}</p>
                  <p className='mb-1' style={{ fontSize: '13px' }}>
                    <span className='fw-semibold' style={{ color: '#0b5ed7' }}>
                      Bahan : Tenaga = {k.kumulatif.rasio_bahan_tenaga == null ? '—' : `${k.kumulatif.rasio_bahan_tenaga.toFixed(2)}×`}
                    </span>
                    <span style={{ color: '#666' }}>
                      {'  |  '}Estimasi vs realisasi:{' '}
                    </span>
                    <span style={{ color: rasioSahih(k.kumulatif.cakupan) ? warnaRasio(k.kumulatif.rasio) : '#6c757d', fontWeight: 600 }}>
                      {!rasioSahih(k.kumulatif.cakupan)
                        ? alasanTidakSahih(k.kumulatif.cakupan)
                        : `${k.kumulatif.rasio.toFixed(2)}× — ${artiRasio(k.kumulatif.rasio)}`}
                    </span>
                  </p>
                </div>

                <div style={tableContainerStyle}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Periode</th>
                        <th style={thStyle}>Nilai SPK Terbit</th>
                        <th style={thStyle}>Bayar Tenaga</th>
                        <th style={thStyle}>Beli Bahan</th>
                        <th style={thStyle}>Bahan : Tenaga</th>
                        <th style={thStyle}>Estimasi</th>
                        <th style={thStyle}>Cakupan</th>
                        <th style={thStyle}>Rasio Real / Est</th>
                      </tr>
                    </thead>
                    <tbody>
                      {k.periode.map((p, idx) => (
                        <tr key={p.label} style={{ backgroundColor: idx % 2 === 0 ? '#F4F4F4' : '#ffffff' }}>
                          <td style={thTdStyle}>{p.label}</td>
                          <td style={thTdStyle}>{rp(p.nilai_spk)}</td>
                          <td style={thTdStyle}>{rp(p.realisasi_tenaga)}</td>
                          <td style={thTdStyle}>{rp(p.realisasi_bahan)}</td>
                          <td style={thTdStyle}>{p.rasio_bahan_tenaga == null ? '—' : `${p.rasio_bahan_tenaga.toFixed(2)}×`}</td>
                          <td style={thTdStyle}>{rp(p.estimasi)}</td>
                          <td style={{ ...thTdStyle, color: cakupanCukup(p.cakupan) ? '#1e7e34' : '#c0392b' }}>
                            {persen(p.cakupan)} <span style={{ color: '#888' }}>({p.item_ada_estimasi}/{p.item_ada_estimasi + p.item_tanpa_estimasi})</span>
                          </td>
                          <td style={{ ...thTdStyle, color: '#adb5bd', fontWeight: 600 }}>
                            {p.rasio == null ? '—' : `${p.rasio.toFixed(2)}×`}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ backgroundColor: '#E7E7E8' }} className='fw-semibold'>
                        <td style={thTdStyle}>Kumulatif</td>
                        <td style={thTdStyle}>{rp(k.kumulatif.nilai_spk)}</td>
                        <td style={thTdStyle}>{rp(k.kumulatif.realisasi_tenaga)}</td>
                        <td style={thTdStyle}>{rp(k.kumulatif.realisasi_bahan)}</td>
                        <td style={thTdStyle}>{k.kumulatif.rasio_bahan_tenaga == null ? '—' : `${k.kumulatif.rasio_bahan_tenaga.toFixed(2)}×`}</td>
                        <td style={thTdStyle}>{rp(k.kumulatif.estimasi)}</td>
                        <td style={{ ...thTdStyle, color: cakupanCukup(k.kumulatif.cakupan) ? '#1e7e34' : '#c0392b' }}>
                          {persen(k.kumulatif.cakupan)} <span style={{ color: '#888' }}>({k.kumulatif.item_ada_estimasi}/{k.kumulatif.item_ada_estimasi + k.kumulatif.item_tanpa_estimasi})</span>
                        </td>
                        <td style={{ ...thTdStyle, color: rasioSahih(k.kumulatif.cakupan) ? warnaRasio(k.kumulatif.rasio) : '#adb5bd' }}>
                          {k.kumulatif.rasio == null ? '—' : `${k.kumulatif.rasio.toFixed(2)}×`}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className='px-4 mt-2' style={{ fontSize: '12px' }}>
                  {!rasioSahih(k.kumulatif.cakupan) && (
                    <p className='mb-1 text-danger'>
                      ⚠ Kolom “Rasio Real / Est” <b>belum bisa dipakai</b>
                      {!cakupanCukup(k.kumulatif.cakupan)
                        ? ` — cakupan estimasi baru ${persen(k.kumulatif.cakupan)}, ${k.estimasi_kosong} item dikerjakan borong tenaga tapi estimasi${k.kategori} masih kosong.`
                        : ` — rentang yang dipilih baru ${rentangBulan} bulan, minimal ${RENTANG_MINIMUM_BULAN} bulan.`}
                      {' '}Sisi realisasi menghitung <i>semua</i> uang keluar di rentang ini (termasuk pelunasan SPK lama
                      dan belanja bahan untuk stok), sisi estimasi hanya pekerjaan yang SPK-nya terbit di rentang ini.
                      Yang sudah sahih sekarang adalah kolom <b>Bahan : Tenaga</b>.
                    </p>
                  )}
                  <span
                    style={{ color: 'blue', cursor: 'pointer' }}
                    onClick={() => setDetailDibuka((s) => ({ ...s, [k.kategori]: !s[k.kategori] }))}
                  >
                    {detailDibuka[k.kategori] ? '▲ Tutup' : '▼ Lihat'} {k.items.length} item yang membentuk sisi estimasi
                  </span>
                </div>

                {detailDibuka[k.kategori] && (
                  <div style={{ ...tableContainerStyle, marginTop: '8px', maxHeight: '40vh', overflowY: 'auto' }}>
                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Bulan SPK</th>
                          <th style={thStyle}>Invoice</th>
                          <th style={thStyle}>Barang</th>
                          <th style={thStyle}>Pengrajin</th>
                          <th style={thStyle}>Qty</th>
                          <th style={thStyle}>Estimasi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {k.items.map((it, idx) => (
                          <tr key={it.project_id} style={{ backgroundColor: idx % 2 === 0 ? '#F4F4F4' : '#ffffff' }}>
                            <td style={thTdStyle}>{it.bulan_spk}</td>
                            <td style={thTdStyle}>{it.kodeInvoice}</td>
                            <td style={thTdStyle}>{it.namaBarang}</td>
                            <td style={thTdStyle}>{it.pengrajin}</td>
                            <td style={thTdStyle}>{it.qty}</td>
                            <td style={thTdStyle}>{rp(it.estimasi)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}

            <div className='px-4 pb-4' style={{ fontSize: '11px', color: '#666', lineHeight: 1.6 }}>
              <p className='mb-1 fw-semibold'>Cara baca angka ini</p>
              <p className='mb-1'>
                Sisi <b>estimasi</b> diambil dari project yang kategorinya dikerjakan pengrajin bertipe
                “borong tenaga”, dikelompokkan pakai <b>tanggal cetak SPK</b> (bukan tanggal invoice),
                karena tanggal SPK lebih dekat ke saat pekerjaan dan pembelian bahan benar-benar terjadi.
              </p>
              <p className='mb-1'>
                Sisi <b>realisasi</b> diambil dari mutasi akun jurnal terkait (tenaga + bahan).
              </p>
              <p className='mb-1'>
                <b>Bahan : Tenaga</b> = berapa rupiah bahan yang keluar untuk tiap 1 rupiah ongkos tenaga.
                Angka ini tidak bergantung pada estimasi terisi, jadi sudah bisa dipakai sekarang — berguna
                untuk menyusun nilai estimasi yang wajar.
              </p>
              <p className='mb-1'>
                <b>Cakupan</b> = berapa banyak pekerjaan borong tenaga di periode itu yang angka estimasinya
                sudah diisi. Kolom “Rasio Real / Est” baru sahih kalau cakupan minimal 80% <b>dan</b> rentang
                yang dipilih minimal {RENTANG_MINIMUM_BULAN} bulan — di rentang pendek, beda waktu antara
                pekerjaan dan pembayaran belum sempat saling menghapus.
              </p>
              <p className='mb-0'>
                Bahan dibeli untuk stok, bukan per order — jadi angka per periode <b>pasti</b> meleset.
                Pakai <b>baris kumulatif</b> untuk mengambil keputusan; kolom periode hanya untuk melihat arah tren.
              </p>
            </div>
          </>
        )}
      </div>
    </Container>
  );
};

export default EvaluasiEstimasi;
