import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Container, Modal, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { DatePicker, Image } from 'antd';
import dayjs from 'dayjs';
import { getApiBaseUrl } from '../../Config/APIurl';
import { getImageUrl } from '../../Utils/image';
import noImageAvailable from '../../assets/images/noImageAvailable.png';

// Cek Finishing & Jok — budget vs real cost bengkel in-house.
//
// Budget di sini disimpan TERPISAH (koleksi BudgetFinishingJok), bukan di estimasi
// invoice. Jadi mengisi / mengubah budget di halaman ini TIDAK mengubah gross profit
// invoice, CRM, maupun laporan keuangan. Real = jurnal bahan + tenaga per bulan.
// Perbandingan hanya sahih per PERIODE (bahan dibeli per bulan, bukan per item).

const IZIN = ['fYpdHwXRDLhj5XGxM5FZIAvxp9E2', 'w4M5JJjgGQeHFbS2nkyoCfUBE532', '4WGPaHicKWYr0Ny84IUh8xb9Bo62', 'ANGTwgX8KxXQy5Ww3cwpLrG0tFT2', 'gwsOqUgVXSPyWFMMHr4bJteBoYs1', '6D4XVa5BSSOl1ugUlkDlTea2COX2', 'MjOCxfNdGtf0q12BPzj0EYAcVJD3', 'knydS6fIBdOwHS37dDm3ZDNQXKQ2', 'Q3LWLX4D7Ye8hMnQVF9fa7SZb953', 'ep15dsFMceTBAyZvpZDiAJ4kMME3'];
const KATEGORI = ['Finishing', 'Jok'];
const CAKUPAN_MINIMUM = 0.8;
// Isi akun real per kategori, supaya jelas apa saja yang sudah terhitung
const LABEL_REAL = {
  Finishing: { bahan: 'bahan + gaji harian tukang finishing', tenaga: 'borongan Mad (mulai 21 Mei 2025)' },
  Jok: { bahan: 'kain, busa, lem', tenaga: 'borongan Defid' },
};
const NAMA_BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const rp = (v) => `Rp ${Math.round(Number(v || 0)).toLocaleString('id-ID')}`;
const jt = (v) => `${(Number(v || 0) / 1e6).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} jt`;
const labelBulan = (b) => `${NAMA_BULAN[Number(b.slice(5, 7)) - 1]} ${b.slice(0, 4)}`;
const tglPendek = (t) => (t ? `${Number(t.slice(8, 10))} ${NAMA_BULAN[Number(t.slice(5, 7)) - 1]} ${t.slice(2, 4)}` : '-');
const tambahBulan = (bulan, n) => {
  const [y, m] = bulan.split('-').map(Number);
  const total = y * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
};
// '150.000' / '150000' / '150rb' -> 150000 ; '' -> null
const parseNominal = (teks) => {
  const s = String(teks ?? '').trim().toLowerCase();
  if (s === '') return null;
  const kali = /rb|k$/.test(s) ? 1000 : /jt/.test(s) ? 1e6 : 1;
  const angka = Number(s.replace(/rb|jt|k/g, '').replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, ''));
  return Number.isFinite(angka) ? Math.round(angka * kali) : null;
};
// Gambar /uploads lewat endpoint resize supaya ratusan thumbnail tidak mengunduh file asli
const urlThumb = (url) => (url && url.startsWith('/uploads') ? `https://api.karyalogamfurniture.com/img?src=${encodeURIComponent(url)}&w=120` : getImageUrl(url));
const tglPanjang = (t) => (t ? new Date(t).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-');
const fmtInput = (v) => (v === null || v === undefined ? '' : Number(v).toLocaleString('id-ID'));

const status = (r) => {
  if (!r || r.rasio === null) return { teks: 'Belum ada budget', warna: '#6c757d', bg: '#f1f3f5' };
  if (r.rasio > 1.1) return { teks: `Boncos ${Math.round((r.rasio - 1) * 100)}%`, warna: '#c0392b', bg: '#fdecea' };
  if (r.rasio < 0.9) return { teks: `Di bawah budget ${Math.round((1 - r.rasio) * 100)}%`, warna: '#1e7e34', bg: '#e8f5ec' };
  return { teks: 'Sesuai budget (±10%)', warna: '#0b5ed7', bg: '#e7f0fd' };
};

const CekFinishingJok = () => {
  const baseUrl = getApiBaseUrl();
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;

  useEffect(() => {
    if (user == null) { window.location.replace('/login'); return; }
    if (!IZIN.includes(user.uid)) window.location.replace('/accounting');
  }, []);

  const [panjang, setPanjang] = useState(12);
  const [mulai, setMulai] = useState('2025-01');
  const sampai = tambahBulan(mulai, panjang - 1);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [edit, setEdit] = useState({}); // idProduct -> { Finishing?: teks, Jok?: teks }
  const [menyimpan, setMenyimpan] = useState(false);
  const [pesan, setPesan] = useState('');
  const [cari, setCari] = useState('');
  const [hanyaKosong, setHanyaKosong] = useState(false);
  const tabelRef = useRef(null);
  const [detail, setDetail] = useState(null); // item yang dibuka di popup

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${baseUrl}/accounting/cek-finishing-jok/get?dari=${mulai}&sampai=${sampai}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Gagal mengambil data');
      setData(json);
    } catch (err) {
      console.error('Gagal mengambil cek finishing & jok:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [mulai, panjang]);

  const jumlahPerubahan = Object.values(edit).reduce((s, e) => s + Object.keys(e).length, 0);

  const pindahPeriode = (arah) => setMulai(tambahBulan(mulai, arah * panjang));
  const gantiPanjang = (n) => {
    setPanjang(n);
    // selaraskan awal periode supaya rapi: 3 bln -> awal kuartal, 6 -> awal semester, 12 -> Januari
    const [y, m] = mulai.split('-').map(Number);
    const awal = n === 12 ? 1 : Math.floor((m - 1) / n) * n + 1;
    setMulai(`${y}-${String(awal).padStart(2, '0')}`);
  };

  const nilaiSel = (item, k) => {
    const e = edit[item.id];
    if (e && e[k] !== undefined) return e[k];
    return fmtInput(k === 'Finishing' ? item.budgetFinishing : item.budgetJok);
  };
  const ubahSel = (item, k, teks) => {
    setPesan('');
    setEdit((prev) => {
      const asli = fmtInput(k === 'Finishing' ? item.budgetFinishing : item.budgetJok);
      const baris = { ...(prev[item.id] || {}) };
      if (teks === asli) delete baris[k]; else baris[k] = teks;
      const next = { ...prev };
      if (Object.keys(baris).length) next[item.id] = baris; else delete next[item.id];
      return next;
    });
  };

  const itemsTampil = useMemo(() => {
    if (!data) return [];
    const q = cari.trim().toLowerCase();
    return data.items.filter((it) => {
      if (q && !`${it.kodeInvoice} ${it.customer} ${it.namaBarang} ${it.supplierFinishing} ${it.supplierJok}`.toLowerCase().includes(q)) return false;
      if (hanyaKosong) {
        const kosongFin = it.masukFinishing && (edit[it.id]?.Finishing ?? fmtInput(it.budgetFinishing)) === '';
        const kosongJok = it.masukJok && (edit[it.id]?.Jok ?? fmtInput(it.budgetJok)) === '';
        if (!kosongFin && !kosongJok) return false;
      }
      return true;
    });
  }, [data, cari, hanyaKosong, edit]);

  // Enter = turun ke baris berikutnya di kolom yang sama
  const fokusSel = (baris, k) => {
    const el = tabelRef.current?.querySelector(`input[data-baris="${baris}"][data-kat="${k}"]`);
    if (el) { el.focus(); el.select(); }
  };
  const onKeyDown = (e, idx, k) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); fokusSel(idx + 1, k); }
    if (e.key === 'ArrowUp') { e.preventDefault(); fokusSel(idx - 1, k); }
  };
  // Tempel satu kolom dari Excel -> isi ke bawah mulai sel ini
  const onPaste = (e, idx, k) => {
    const teks = e.clipboardData.getData('text');
    const baris = teks.split(/\r?\n/).filter((x, i, arr) => !(i === arr.length - 1 && x === ''));
    if (baris.length <= 1) return;
    e.preventDefault();
    baris.forEach((isi, i) => {
      const item = itemsTampil[idx + i];
      if (item) ubahSel(item, k, isi.split('\t')[0].trim());
    });
  };

  const simpan = async () => {
    const payload = [];
    for (const [idProduct, e] of Object.entries(edit)) {
      const baris = { idProduct };
      for (const k of KATEGORI) {
        if (e[k] === undefined) continue;
        const v = parseNominal(e[k]);
        if (e[k].trim() !== '' && v === null) { setPesan(`Angka tidak valid: "${e[k]}"`); return; }
        baris[k.toLowerCase()] = v;
      }
      payload.push(baris);
    }
    setMenyimpan(true);
    try {
      const res = await fetch(`${baseUrl}/accounting/cek-finishing-jok/budget`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user?.uid, items: payload }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Gagal menyimpan');
      setEdit({});
      setPesan(`${payload.length} item tersimpan.`);
      await fetchData();
    } catch (err) {
      setPesan(`Gagal menyimpan: ${err.message}`);
    } finally {
      setMenyimpan(false);
    }
  };

  // ----- gaya -----
  const kartu = { border: '1px solid #dddddd', borderRadius: '10px', padding: '16px 18px', background: '#fff', flex: '1 1 320px' };
  const th = { border: '1px solid #c2c2c2', padding: '7px 8px', fontSize: '12px', backgroundColor: 'blue', color: 'white', textAlign: 'center', position: 'sticky', top: 0, zIndex: 1 };
  const td = { border: '1px solid #e1e1e1', padding: '5px 8px', fontSize: '12px', verticalAlign: 'middle' };
  const tdR = { ...td, textAlign: 'right', whiteSpace: 'nowrap' };
  const tombol = (aktif) => ({ fontSize: '13px', padding: '4px 12px', border: '1px solid blue', background: aktif ? 'blue' : 'white', color: aktif ? 'white' : 'blue', cursor: 'pointer' });

  const KartuKategori = ({ k }) => {
    const r = data.ringkasan[k];
    const st = status(r);
    const cakupanKurang = r.cakupan === null || r.cakupan < CAKUPAN_MINIMUM;
    return (
      <div style={kartu}>
        <div className='d-flex justify-content-between align-items-center mb-2'>
          <span className='fw-semibold' style={{ fontSize: '16px' }}>{k} in-house</span>
          <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 10px', borderRadius: '99px', color: st.warna, background: st.bg }}>{st.teks}</span>
        </div>
        <table style={{ width: '100%', fontSize: '13px' }}>
          <tbody>
            <tr><td>Budget</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{rp(r.budget)}</td></tr>
            <tr><td>Real</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{rp(r.real)}</td></tr>
            <tr style={{ color: '#6c757d', fontSize: '12px' }}><td style={{ paddingLeft: '12px' }}>{LABEL_REAL[k].bahan} (akun {data.akun[k].akunBahan.join(', ')})</td><td style={{ textAlign: 'right' }}>{rp(r.real_bahan)}</td></tr>
            <tr style={{ color: '#6c757d', fontSize: '12px' }}><td style={{ paddingLeft: '12px' }}>{LABEL_REAL[k].tenaga} (akun {data.akun[k].akunTenaga.join(', ')})</td><td style={{ textAlign: 'right' }}>{rp(r.real_tenaga)}</td></tr>
            <tr style={{ borderTop: '1px solid #ddd' }}><td className='pt-1'>Selisih (real − budget)</td><td className='pt-1' style={{ textAlign: 'right', fontWeight: 700, color: r.selisih > 0 ? '#c0392b' : '#1e7e34' }}>{r.selisih > 0 ? '+' : ''}{rp(r.selisih)}</td></tr>
          </tbody>
        </table>
        <div className='mt-2' style={{ fontSize: '12px', color: cakupanKurang ? '#b8860b' : '#6c757d' }}>
          Budget terisi {r.item_terisi} dari {r.item_total} item ({r.cakupan === null ? '0' : Math.round(r.cakupan * 100)}%).
          {cakupanKurang && ' Isi budget minimal 80% item dulu supaya perbandingannya bisa dipercaya.'}
        </div>
      </div>
    );
  };

  return (
    <Container fluid className='px-4 pb-5'>
      <div className='mt-4 d-flex justify-content-between align-items-center flex-wrap gap-2'>
        <div>
          <Link to='/accounting' style={{ fontSize: '13px' }}>← Accounting</Link>
          <h4 className='fw-semibold mb-0' style={{ color: 'blue' }}>Cek Finishing &amp; Jok</h4>
          <div style={{ fontSize: '12px', color: '#6c757d' }}>
            Budget di halaman ini tidak mengubah gross profit invoice maupun laporan keuangan.
          </div>
        </div>
        <div className='d-flex align-items-center gap-2 flex-wrap'>
          <div className='d-flex' style={{ borderRadius: '5px', overflow: 'hidden' }}>
            {[3, 6, 12].map((n) => (
              <button key={n} type='button' style={tombol(panjang === n)} onClick={() => gantiPanjang(n)}>
                {n === 12 ? '1 tahun' : `${n} bulan`}
              </button>
            ))}
          </div>
          <button type='button' style={{ ...tombol(false), borderRadius: '5px' }} onClick={() => pindahPeriode(-1)} aria-label='Periode sebelumnya'>‹</button>
          <DatePicker picker='month' allowClear={false} value={dayjs(mulai, 'YYYY-MM')} format='MMM YYYY'
            onChange={(d) => { if (d) setMulai(d.format('YYYY-MM')); }} style={{ borderColor: 'blue', width: 120 }} />
          <span style={{ fontSize: '13px' }}>s/d {labelBulan(sampai)}</span>
          <button type='button' style={{ ...tombol(false), borderRadius: '5px' }} onClick={() => pindahPeriode(1)} aria-label='Periode berikutnya'>›</button>
        </div>
      </div>

      {loading && <div className='text-center my-5'><Spinner animation='border' /></div>}
      {error && <div className='alert alert-danger mt-3'>{error}</div>}

      {data && !loading && (
        <>
          <div className='d-flex gap-3 flex-wrap mt-3'>
            {KATEGORI.map((k) => <KartuKategori key={k} k={k} />)}
          </div>

          <div className='mt-4' style={{ overflowX: 'auto', border: '1px solid #dddddd', borderRadius: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead>
                <tr>
                  <th style={th} rowSpan={2}>Bulan</th>
                  {KATEGORI.map((k) => <th key={k} style={th} colSpan={3}>{k}</th>)}
                </tr>
                <tr>
                  {KATEGORI.map((k) => (
                    <React.Fragment key={k}>
                      <th style={th}>Budget</th><th style={th}>Real</th><th style={th}>Selisih</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.per_bulan.map((r) => (
                  <tr key={r.bulan}>
                    <td style={td}>{labelBulan(r.bulan)}</td>
                    {KATEGORI.map((k) => (
                      <React.Fragment key={k}>
                        <td style={tdR}>{jt(r[k].budget)}</td>
                        <td style={tdR}>{jt(r[k].real)}</td>
                        <td style={{ ...tdR, color: r[k].selisih > 0 ? '#c0392b' : '#1e7e34' }}>{r[k].selisih > 0 ? '+' : ''}{jt(r[k].selisih)}</td>
                      </React.Fragment>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '6px' }}>
            Per bulan pasti meleset karena bahan dibeli untuk stok. Yang dipakai mengambil keputusan adalah total periode di atas.
          </div>

          <div className='mt-4 d-flex justify-content-between align-items-end flex-wrap gap-2'>
            <div>
              <div className='fw-semibold' style={{ fontSize: '15px' }}>Isi budget per unit ({data.items.length} item)</div>
              <div style={{ fontSize: '12px', color: '#6c757d', maxWidth: 720 }}>
                Isi angka all-in per unit (bahan + ongkos). Untuk jok yang dijahit supplier luar, isi biaya kain &amp; busanya saja.
                Isi <b>0</b> kalau item memang tanpa finishing/jok. Tekan Enter untuk turun, atau tempel satu kolom dari Excel.
                Contoh: 150000, 150.000, atau 150rb.
              </div>
            </div>
            <div className='d-flex gap-2 align-items-center flex-wrap'>
              <input type='search' placeholder='Cari invoice, barang, supplier…' value={cari} onChange={(e) => setCari(e.target.value)}
                style={{ fontSize: '13px', padding: '4px 8px', border: '1px solid blue', borderRadius: '5px', width: 240 }} />
              <label style={{ fontSize: '13px' }} className='d-flex align-items-center gap-1'>
                <input type='checkbox' checked={hanyaKosong} onChange={(e) => setHanyaKosong(e.target.checked)} /> Hanya yang belum diisi
              </label>
            </div>
          </div>

          <div ref={tabelRef} className='mt-2' style={{ overflow: 'auto', maxHeight: '70vh', border: '1px solid #dddddd', borderRadius: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
              <thead>
                <tr>
                  <th style={th}>No</th><th style={th}>Invoice</th><th style={th}>Produk</th><th style={th}>Qty</th>
                  <th style={th}>Tgl finishing</th><th style={th}>Supplier finishing</th><th style={th}>Budget finishing / unit</th>
                  <th style={th}>Tgl jok</th><th style={th}>Supplier jok</th><th style={th}>Budget jok / unit</th>
                  <th style={th}>Total budget</th>
                </tr>
              </thead>
              <tbody>
                {itemsTampil.map((it, idx) => {
                  const sel = (k) => {
                    const masuk = k === 'Finishing' ? it.masukFinishing : it.masukJok;
                    const diubah = edit[it.id]?.[k] !== undefined;
                    return (
                      <td style={{ ...td, padding: '2px 4px', background: diubah ? '#fff8d6' : undefined }}
                        title={masuk ? '' : `Tanggal ${k.toLowerCase()} di luar periode ini, jadi tidak ikut dihitung di periode ini`}>
                        <input
                          data-baris={idx} data-kat={k}
                          inputMode='numeric'
                          value={nilaiSel(it, k)}
                          onChange={(e) => ubahSel(it, k, e.target.value)}
                          onKeyDown={(e) => onKeyDown(e, idx, k)}
                          onPaste={(e) => onPaste(e, idx, k)}
                          onFocus={(e) => e.target.select()}
                          placeholder={masuk ? 'belum diisi' : 'di luar periode'}
                          style={{ width: '100%', minWidth: 100, textAlign: 'right', border: '1px solid #ccc', borderRadius: '4px', padding: '3px 6px', fontSize: '12px', opacity: masuk ? 1 : 0.55 }}
                        />
                      </td>
                    );
                  };
                  const fin = parseNominal(nilaiSel(it, 'Finishing')) || 0;
                  const jok = parseNominal(nilaiSel(it, 'Jok')) || 0;
                  return (
                    <tr key={it.id}>
                      <td style={{ ...td, textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}><a href={`/invoice/${it.idInvoice}`} target='_blank' rel='noreferrer' title={it.customer}>{it.kodeInvoice}</a></td>
                      <td style={{ ...td, padding: '3px', textAlign: 'center', width: 70 }}>
                        <button type='button' onClick={() => setDetail(it)} title={`${it.namaBarang} — klik untuk lihat detail`}
                          style={{ border: 'none', padding: 0, background: 'none', cursor: 'zoom-in', position: 'relative' }}>
                          <img src={it.images[0] ? urlThumb(it.images[0]) : noImageAvailable} alt={it.namaBarang} loading='lazy'
                            style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd', display: 'block' }} />
                          {it.images.length > 1 && (
                            <span style={{ position: 'absolute', right: 2, bottom: 2, fontSize: '10px', background: 'rgba(0,0,0,.6)', color: '#fff', borderRadius: '4px', padding: '0 4px' }}>{it.images.length}</span>
                          )}
                        </button>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>{it.qty}</td>
                      <td style={{ ...td, whiteSpace: 'nowrap', color: it.masukFinishing ? undefined : '#aaa' }}>{tglPendek(it.tglFinishing)}</td>
                      <td style={td}>{it.supplierFinishing || '-'}</td>
                      {sel('Finishing')}
                      <td style={{ ...td, whiteSpace: 'nowrap', color: it.masukJok ? undefined : '#aaa' }}>{tglPendek(it.tglJok)}</td>
                      <td style={td}>{it.supplierJok || '-'}</td>
                      {sel('Jok')}
                      <td style={tdR}>{rp((fin + jok) * it.qty)}</td>
                    </tr>
                  );
                })}
                {itemsTampil.length === 0 && (
                  <tr><td style={{ ...td, textAlign: 'center', padding: '20px' }} colSpan={11}>Tidak ada item yang cocok.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {(jumlahPerubahan > 0 || pesan) && (
            <div style={{ position: 'sticky', bottom: 'env(safe-area-inset-bottom, 0px)', marginTop: '12px', background: '#fff', border: '1px solid blue', borderRadius: '10px', padding: '10px 14px', zIndex: 5 }}
              className='d-flex justify-content-between align-items-center flex-wrap gap-2'>
              <span style={{ fontSize: '13px' }}>
                {jumlahPerubahan > 0 ? `${jumlahPerubahan} perubahan belum disimpan.` : ''} {pesan}
              </span>
              {jumlahPerubahan > 0 && (
                <div className='d-flex gap-2'>
                  <button type='button' className='btn btn-sm btn-outline-secondary' onClick={() => { setEdit({}); setPesan(''); }} disabled={menyimpan}>Batal</button>
                  <button type='button' className='btn btn-sm btn-primary' onClick={simpan} disabled={menyimpan}>
                    {menyimpan ? 'Menyimpan…' : 'Simpan semua'}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <Modal show={!!detail} onHide={() => setDetail(null)} size='lg' centered enforceFocus={false}>
        {detail && (
          <>
            <Modal.Header closeButton>
              <Modal.Title style={{ fontSize: '18px' }}>
                {detail.namaBarang}
                <div style={{ fontSize: '14px', fontWeight: 400, color: '#555' }}>{detail.buyer || detail.customer}</div>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div style={{ fontSize: '13px' }}>
                <div>🧾 Invoice: <a href={`/invoice/${detail.idInvoice}`} target='_blank' rel='noreferrer'>{detail.kodeInvoice}</a></div>
                <div>⏱ Deadline: {tglPanjang(detail.deadline)}</div>
                {detail.targetKirim && <div style={{ color: '#e67e22', fontWeight: 600 }}>🚚 Target Kirim: {tglPanjang(detail.targetKirim)}</div>}
              </div>

              <div className='fw-semibold mt-3 mb-2'>Gambar Produk</div>
              {detail.images.length > 0 ? (
                <Image.PreviewGroup preview={{ zIndex: 2000 }}>
                  <div className='d-flex flex-wrap gap-2'>
                    {detail.images.map((url, i) => (
                      <Image key={url + i} src={getImageUrl(url)} height={140} style={{ borderRadius: '8px', objectFit: 'cover' }} alt={`${detail.namaBarang} ${i + 1}`} />
                    ))}
                  </div>
                </Image.PreviewGroup>
              ) : (
                <img src={noImageAvailable} alt='Tidak ada gambar' style={{ height: 120, borderRadius: '8px' }} />
              )}
              <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px' }}>Klik gambar untuk memperbesar.</div>

              <div className='fw-semibold mt-3 mb-1'>Deskripsi Produk</div>
              <div style={{ whiteSpace: 'pre-line', fontSize: '13px' }}>{detail.spesifikasi || '-'}</div>
              <div style={{ fontSize: '13px', marginTop: '6px' }}>Quantity: <b>{detail.qty}</b></div>

              <div className='d-flex gap-3 flex-wrap mt-3 p-2' style={{ background: '#f6f8fb', borderRadius: '8px', fontSize: '13px' }}>
                {KATEGORI.map((k) => (
                  <div key={k} style={{ flex: '1 1 220px' }}>
                    <div className='fw-semibold'>{k}</div>
                    <div style={{ color: '#555' }}>{tglPendek(k === 'Finishing' ? detail.tglFinishing : detail.tglJok)} · {(k === 'Finishing' ? detail.supplierFinishing : detail.supplierJok) || '-'}</div>
                    <label className='mt-1 d-block' htmlFor={`modal-budget-${k}`}>Budget {k.toLowerCase()} / unit</label>
                    <input id={`modal-budget-${k}`} inputMode='numeric' value={nilaiSel(detail, k)} onChange={(e) => ubahSel(detail, k, e.target.value)}
                      placeholder='belum diisi' style={{ width: '100%', textAlign: 'right', border: '1px solid #ccc', borderRadius: '4px', padding: '4px 6px' }} />
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px' }}>Perubahan di sini ikut tombol "Simpan semua" di bawah tabel.</div>
            </Modal.Body>
          </>
        )}
      </Modal>
    </Container>
  );
};

export default CekFinishingJok;
