import React, { useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { rincianSelisihBengkel } from '../../Utils/selisihBengkel';
import { labelBulan, labelRange } from '../../Utils/labaRugiReport';

// Popup cek "Selisih bengkel Finishing / Jok" di Laba Rugi Penjualan.
// Data dari Utils/selisihBengkel.js — totalnya sama persis dengan baris di
// tabel "HPP di Luar Invoice". Empat tab:
//   Per Bulan   → di bulan mana selisihnya menumpuk
//   Riil        → jurnal akun bengkel, ditandai yang juga ada di Pengeluaran Lain
//   Sudah di GP → biaya bengkel per produk yang ikut di HPP invoice
//   Perlu Dicek → produk pakai kategori tapi 0 di GP + yang dikerjakan supplier luar
// Fullscreen di HP, kartu (bukan tabel lebar) supaya tidak scroll horizontal.

const rp = (n) => `Rp. ${Math.round(Number(n || 0)).toLocaleString('id-ID')}`;
const tgl = (t) => {
  if (!t) return '-';
  const d = new Date(t);
  return isNaN(d) ? String(t) : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};
const warnaSelisih = (n) => (n > 0 ? '#c0392b' : n < 0 ? 'green' : '#1a1a1a');

const s = {
  ringkasan: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 12 },
  kotak: { background: '#F4F6FF', border: '1px solid #DCE1FF', borderRadius: 10, padding: '8px 12px' },
  kotakLabel: { fontSize: 11, color: '#666' },
  kotakNilai: { fontSize: 15, fontWeight: 600, color: '#1a1a1a', wordBreak: 'break-word' },
  catatan: { fontSize: 12, color: '#555', background: '#FFF8E6', border: '1px solid #F3E2B3', borderRadius: 8, padding: '8px 10px', marginBottom: 12 },
  tabs: { display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 12, paddingBottom: 2 },
  tab: (on) => ({
    border: '1px solid blue', background: on ? 'blue' : '#fff', color: on ? '#fff' : 'blue',
    borderRadius: 18, padding: '6px 14px', fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0,
  }),
  judulGrup: { display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, margin: '14px 0 6px' },
  kartu: { border: '1px solid #e3e3e3', borderRadius: 10, padding: '10px 12px', marginBottom: 8, background: '#fff' },
  barisAtas: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  ket: { fontSize: 14, fontWeight: 500, wordBreak: 'break-word' },
  nominal: { fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' },
  meta: { fontSize: 12, color: '#777', marginTop: 4, wordBreak: 'break-word' },
  badge: (warna, latar) => ({
    display: 'inline-block', fontSize: 11, borderRadius: 6, padding: '2px 8px', marginTop: 6, marginRight: 6,
    color: warna, background: latar,
  }),
  saklar: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, margin: '0 0 8px', cursor: 'pointer' },
  kosong: { textAlign: 'center', color: '#888', fontSize: 14, padding: '24px 0' },
  tabel: { width: '100%', borderCollapse: 'collapse', fontSize: 12, background: '#fff' },
  th: { background: 'blue', color: '#fff', padding: '6px 8px', textAlign: 'right', whiteSpace: 'nowrap' },
  td: { borderBottom: '1px solid #eee', padding: '6px 8px', textAlign: 'right', whiteSpace: 'nowrap' },
};

const BadgePL = ({ tandai }) => (
  <span style={s.badge('#8a5a00', '#FFF1CC')} title={tandai.keterangan}>
    Pengeluaran Lain {tandai.kodeInvoice}
    {tandai.cara === 'gabungan' ? ' (gabungan)' : tandai.cara === 'spk' ? ' (via SPK)' : ''}
  </span>
);

const SUMBER_WARNA = {
  estimasi: ['#1e4fd8', '#E8EEFF'],
  budget: ['#6b3fb3', '#F1E9FF'],
  'nilai SPK': ['#555', '#EEE'],
};

const SelisihBengkelModal = ({ kategori, bulanList, data, onHide }) => {
  const [tab, setTab] = useState('bulan');
  const [sembunyiPL, setSembunyiPL] = useState(false);

  const r = useMemo(
    () => (kategori && bulanList?.length ? rincianSelisihBengkel(kategori, bulanList, data) : null),
    [kategori, bulanList, data]
  );

  const periode = bulanList?.length ? labelRange(bulanList[0], bulanList[bulanList.length - 1]) : '';
  const tutup = () => { setTab('bulan'); setSembunyiPL(false); onHide(); };

  const daftarTab = [
    ['bulan', 'Per Bulan'],
    ['riil', `Riil (${r?.entries.length || 0})`],
    ['gp', `Sudah di GP (${r?.diGP.length || 0})`],
    ['cek', `Perlu Dicek (${(r?.tanpaEstimasi.length || 0) + (r?.supplierLuar.length || 0)})`],
  ];

  const renderBulan = () => (
    <div style={{ overflowX: 'auto', border: '1px solid #e3e3e3', borderRadius: 10 }}>
      <table style={s.tabel}>
        <thead>
          <tr>
            <th style={{ ...s.th, textAlign: 'left' }}>Bulan</th>
            <th style={s.th}>Riil</th>
            <th style={s.th}>di Peng. Lain</th>
            <th style={s.th}>Sudah di GP</th>
            <th style={s.th}>Selisih bersih</th>
          </tr>
        </thead>
        <tbody>
          {r.perBulan.map((b) => (
            <tr key={b.bulan}>
              <td style={{ ...s.td, textAlign: 'left' }}>{labelBulan(b.bulan)}</td>
              <td style={s.td}>{rp(b.riil)}</td>
              <td style={{ ...s.td, color: b.ditandai ? '#8a5a00' : '#aaa' }}>{b.ditandai ? `−${rp(b.ditandai)}` : '-'}</td>
              <td style={s.td}>{rp(b.gp)}</td>
              <td style={{ ...s.td, fontWeight: 600, color: warnaSelisih(b.selisihBersih) }}>{rp(b.selisihBersih)}</td>
            </tr>
          ))}
          <tr style={{ background: '#E7E7E8', fontWeight: 600 }}>
            <td style={{ ...s.td, textAlign: 'left' }}>Total</td>
            <td style={s.td}>{rp(r.totalRiil)}</td>
            <td style={s.td}>{r.totalDitandai ? `−${rp(r.totalDitandai)}` : '-'}</td>
            <td style={s.td}>{rp(r.totalGP)}</td>
            <td style={{ ...s.td, color: warnaSelisih(r.selisihBersih) }}>{rp(r.selisihBersih)}</td>
          </tr>
        </tbody>
      </table>
      <div style={{ ...s.meta, padding: '8px 10px' }}>
        Riil dihitung per tanggal jurnal (saat bayar), Sudah di GP per bulan invoice. Selisih satu bulan
        bisa tertutup bulan berikutnya kalau bahan/tukang dibayar setelah bulan invoice-nya.
      </div>
    </div>
  );

  const renderRiil = () => {
    const tampil = r.entries.filter((e) => !(sembunyiPL && e.tandai));
    return (
      <>
        {r.totalDitandai > 0 && (
          <label style={s.saklar}>
            <input type="checkbox" checked={sembunyiPL} onChange={(ev) => setSembunyiPL(ev.target.checked)} />
            Sembunyikan yang sudah di Pengeluaran Lain ({rp(r.totalDitandai)})
          </label>
        )}
        {r.perAkun.map((a) => {
          const baris = tampil.filter((e) => e.akun === a.kodeAkun);
          return (
            <div key={a.kodeAkun}>
              <div style={s.judulGrup}>
                <span>{a.kodeAkun} · {a.namaAkun}</span>
                <span>{rp(a.total)}</span>
              </div>
              {a.ditandai > 0 && (
                <div style={{ ...s.meta, marginTop: -4, marginBottom: 6 }}>
                  termasuk {rp(a.ditandai)} yang juga dicatat di Pengeluaran Lain
                </div>
              )}
              {baris.length === 0 ? (
                <div style={{ ...s.meta, marginBottom: 8 }}>Tidak ada transaksi.</div>
              ) : (
                baris.map((e, i) => (
                  <div key={e.jurnal.id || e.jurnal._id || i} style={{ ...s.kartu, opacity: e.tandai ? 0.85 : 1 }}>
                    <div style={s.barisAtas}>
                      <div style={s.ket}>{e.jurnal.keterangan || '(tanpa keterangan)'}</div>
                      <div style={{ ...s.nominal, color: e.nominal < 0 ? 'green' : '#1a1a1a' }}>{rp(e.nominal)}</div>
                    </div>
                    <div style={s.meta}>
                      {tgl(e.jurnal.tanggal)}
                      {e.spk ? ` · ${e.spk.code}` : e.jurnal.invoiceSPK ? ` · ${e.jurnal.invoiceSPK}` : ''}
                    </div>
                    {e.jurnal.catatan && <div style={{ ...s.meta, fontStyle: 'italic' }}>{e.jurnal.catatan}</div>}
                    {e.tandai && <BadgePL tandai={e.tandai} />}
                  </div>
                ))
              )}
            </div>
          );
        })}
      </>
    );
  };

  const renderGP = () => (
    <>
      <div style={{ ...s.ringkasan, marginBottom: 8 }}>
        {r.perSumber.map((x) => (
          <div key={x.sumber} style={s.kotak}>
            <div style={s.kotakLabel}>Dari {x.sumber} · {x.jumlah} produk</div>
            <div style={s.kotakNilai}>{rp(x.total)}</div>
          </div>
        ))}
      </div>
      {r.diGP.length === 0 ? (
        <div style={s.kosong}>Tidak ada produk {kategori} bengkel sendiri di periode ini.</div>
      ) : (
        [...r.diGP]
          .sort((a, b) => String(a.invoice.tanggalMulaiInvoice).localeCompare(String(b.invoice.tanggalMulaiInvoice)))
          .map((d, i) => {
            const [warna, latar] = SUMBER_WARNA[d.sumber] || SUMBER_WARNA['nilai SPK'];
            return (
              <div key={d.product.id || i} style={s.kartu}>
                <div style={s.barisAtas}>
                  <div style={s.ket}>{d.product.NamaBarang || '(tanpa nama)'}</div>
                  <div style={s.nominal}>{rp(d.total)}</div>
                </div>
                <div style={s.meta}>
                  {d.invoice.kodeInvoice} · {tgl(d.invoice.tanggalMulaiInvoice)} · {d.qty} × {rp(d.perUnit)}
                </div>
                <span style={s.badge(warna, latar)}>{d.sumber}</span>
                {d.pengrajin && <span style={s.badge('#555', '#F2F2F2')}>{d.pengrajin}</span>}
              </div>
            );
          })
      )}
    </>
  );

  const renderCek = () => (
    <>
      <div style={s.judulGrup}>
        <span>Pakai {kategori}, bengkel sendiri, tapi 0 di GP</span>
        <span>{r.tanpaEstimasi.length}</span>
      </div>
      <div style={{ ...s.meta, marginTop: -4, marginBottom: 8 }}>
        Biaya riilnya tetap keluar tapi tidak ada anggarannya di GP — isi estimasi {kategori} di invoice,
        kecuali biayanya memang dilacak lewat Pengeluaran Lain.
      </div>
      {r.tanpaEstimasi.length === 0 ? (
        <div style={{ ...s.meta, marginBottom: 8 }}>Tidak ada.</div>
      ) : (
        r.tanpaEstimasi.map((t, i) => (
          <div key={t.product.id || i} style={s.kartu}>
            <div style={s.ket}>{t.product.NamaBarang || '(tanpa nama)'}</div>
            <div style={s.meta}>
              {t.invoice.kodeInvoice} · {tgl(t.invoice.tanggalMulaiInvoice)} · qty {t.qty}
              {t.pengrajin ? ` · ${t.pengrajin}` : ''}
            </div>
          </div>
        ))
      )}

      <div style={{ ...s.judulGrup, marginTop: 18 }}>
        <span>Dikerjakan supplier luar (tidak dibandingkan)</span>
        <span>{rp(r.totalSupplierLuar)}</span>
      </div>
      <div style={{ ...s.meta, marginTop: -4, marginBottom: 8 }}>
        Biaya sudah masuk GP lewat nilai SPK supplier. Kalau KLF membelikan bahan untuk mereka
        (mis. kain), pembelian itu masuk Riil tanpa pasangan di GP.
      </div>
      {r.supplierLuar.length === 0 ? (
        <div style={{ ...s.meta, marginBottom: 8 }}>Tidak ada.</div>
      ) : (
        r.supplierLuar.map((x, i) => (
          <div key={x.product.id || i} style={s.kartu}>
            <div style={s.barisAtas}>
              <div style={s.ket}>{x.product.NamaBarang || '(tanpa nama)'}</div>
              <div style={s.nominal}>{rp(x.total)}</div>
            </div>
            <div style={s.meta}>
              {x.invoice.kodeInvoice} · {x.qty} × {rp(x.perUnit)} · {x.pengrajin}
            </div>
          </div>
        ))
      )}
    </>
  );

  return (
    <Modal show={!!kategori} onHide={tutup} centered scrollable fullscreen="sm-down" size="lg">
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: 17 }}>
          Selisih bengkel {kategori}
          <div style={{ fontSize: 13, fontWeight: 400, color: '#666' }}>{periode}</div>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ background: '#FAFAFA' }}>
        {r && (
          <>
            <div style={s.ringkasan}>
              <div style={s.kotak}>
                <div style={s.kotakLabel}>Riil (jurnal {r.akunList.join(', ')})</div>
                <div style={s.kotakNilai}>{rp(r.totalRiil)}</div>
              </div>
              <div style={s.kotak}>
                <div style={s.kotakLabel}>Sudah di GP</div>
                <div style={s.kotakNilai}>{rp(r.totalGP)}</div>
              </div>
              <div style={s.kotak}>
                <div style={s.kotakLabel}>Selisih di Laba Rugi</div>
                <div style={{ ...s.kotakNilai, color: warnaSelisih(r.selisih) }}>{rp(r.selisih)}</div>
              </div>
              {r.totalDitandai !== 0 && (
                <div style={s.kotak}>
                  <div style={s.kotakLabel}>Juga di Pengeluaran Lain</div>
                  <div style={{ ...s.kotakNilai, color: '#8a5a00' }}>−{rp(r.totalDitandai)}</div>
                </div>
              )}
              <div style={{ ...s.kotak, background: '#fff', borderColor: 'blue' }}>
                <div style={s.kotakLabel}>Selisih bersih bengkel</div>
                <div style={{ ...s.kotakNilai, color: warnaSelisih(r.selisihBersih) }}>{rp(r.selisihBersih)}</div>
              </div>
            </div>

            {r.totalDitandai !== 0 && (
              <div style={s.catatan}>
                {rp(r.totalDitandai)} dari Riil adalah biaya yang <b>juga</b> dicatat sebagai Pengeluaran Lain
                invoice (bertanda “sudah dijurnal”). Biaya itu sudah mengurangi GP invoice-nya dan dikembalikan
                di baris <i>Koreksi</i>, jadi total Laba Rugi tetap benar — tapi membuat baris selisih ini terlihat besar.
                Kinerja bengkel yang sebenarnya = <b>selisih bersih</b>.
              </div>
            )}

            <div style={s.tabs}>
              {daftarTab.map(([k, label]) => (
                <button key={k} type="button" style={s.tab(tab === k)} onClick={() => setTab(k)}>{label}</button>
              ))}
            </div>

            {tab === 'bulan' && renderBulan()}
            {tab === 'riil' && renderRiil()}
            {tab === 'gp' && renderGP()}
            {tab === 'cek' && renderCek()}
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default SelisihBengkelModal;
