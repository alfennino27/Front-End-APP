import React, { useMemo } from 'react';
import { Modal } from 'react-bootstrap';

// Popup rincian jurnal satu kode akun di bulan terpilih — dipakai tabel
// Pengeluaran di Laba Rugi Penjualan / Profit / Cash. Rumus nominalnya sama
// persis dengan kolom Nominal di tabel (saldo awal + debet − kredit), jadi
// total di popup selalu cocok dengan angka yang diklik.
// Tampil fullscreen di HP (fullscreen="sm-down") dan pakai kartu, bukan tabel
// lebar, supaya tidak perlu scroll horizontal.

const rupiah = (n) => `Rp. ${Number(n || 0).toLocaleString('id-ID')}`;

const formatTanggal = (t) => {
  if (!t) return '-';
  const d = new Date(t);
  if (isNaN(d)) return String(t);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const namaBulan = (ym) => {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
};

const RincianAkunModal = ({ akun, filterDate, dataJurnal, dataAkun, onHide }) => {
  const kodeAkun = akun?.kodeAkun;

  const { entries, saldoAwal, totalDebet, totalKredit, total } = useMemo(() => {
    if (!akun || !filterDate) return { entries: [], saldoAwal: 0, totalDebet: 0, totalKredit: 0, total: 0 };

    const saldoAwal = Number(akun.saldoAwalDebit?.[filterDate] || 0) || Number(akun.saldoAwalKredit?.[filterDate] || 0);

    const entries = dataJurnal
      .filter((j) =>
        (j.kodeAkunDebet === kodeAkun || j.kodeAkunKredit === kodeAkun) &&
        String(j.tanggal || '').substring(0, 7) === filterDate
      )
      .map((j) => {
        const debet = j.kodeAkunKredit === kodeAkun ? 0 : Number(j.nominalDebet || 0);
        const kredit = j.kodeAkunDebet === kodeAkun ? 0 : Number(j.nominalKredit || 0);
        const kodeLawan = j.kodeAkunDebet === kodeAkun ? j.kodeAkunKredit : j.kodeAkunDebet;
        return { ...j, debet, kredit, nilai: debet - kredit, kodeLawan };
      })
      .sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)));

    const totalDebet = entries.reduce((s, e) => s + e.debet, 0);
    const totalKredit = entries.reduce((s, e) => s + e.kredit, 0);
    return { entries, saldoAwal, totalDebet, totalKredit, total: saldoAwal + totalDebet - totalKredit };
  }, [akun, filterDate, dataJurnal, kodeAkun]);

  const namaAkun = (kode) => dataAkun?.find((a) => a.kodeAkun === kode)?.namaAkun || '';

  const s = {
    ringkasan: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginBottom: 14 },
    kotak: { background: '#F4F6FF', border: '1px solid #DCE1FF', borderRadius: 10, padding: '8px 12px' },
    kotakLabel: { fontSize: 11, color: '#666' },
    kotakNilai: { fontSize: 15, fontWeight: 600, color: '#1a1a1a', wordBreak: 'break-word' },
    kartu: { border: '1px solid #e3e3e3', borderRadius: 10, padding: '10px 12px', marginBottom: 8, background: '#fff' },
    barisAtas: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
    ket: { fontSize: 14, fontWeight: 500, wordBreak: 'break-word' },
    nominal: (neg) => ({ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', color: neg ? '#c0392b' : '#1a1a1a' }),
    meta: { fontSize: 12, color: '#777', marginTop: 4, wordBreak: 'break-word' },
    catatan: { fontSize: 12, color: '#555', marginTop: 4, fontStyle: 'italic', wordBreak: 'break-word' },
  };

  return (
    <Modal show={!!akun} onHide={onHide} centered scrollable fullscreen="sm-down" size="lg">
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: 17 }}>
          {kodeAkun} · {akun?.namaAkun}
          <div style={{ fontSize: 13, fontWeight: 400, color: '#666' }}>{namaBulan(filterDate)}</div>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ background: '#FAFAFA' }}>
        <div style={s.ringkasan}>
          <div style={s.kotak}>
            <div style={s.kotakLabel}>Total</div>
            <div style={{ ...s.kotakNilai, color: 'blue' }}>{rupiah(total)}</div>
          </div>
          <div style={s.kotak}>
            <div style={s.kotakLabel}>Jumlah transaksi</div>
            <div style={s.kotakNilai}>{entries.length}</div>
          </div>
          {saldoAwal !== 0 && (
            <div style={s.kotak}>
              <div style={s.kotakLabel}>Saldo awal</div>
              <div style={s.kotakNilai}>{rupiah(saldoAwal)}</div>
            </div>
          )}
          {totalKredit !== 0 && (
            <>
              <div style={s.kotak}>
                <div style={s.kotakLabel}>Debet</div>
                <div style={s.kotakNilai}>{rupiah(totalDebet)}</div>
              </div>
              <div style={s.kotak}>
                <div style={s.kotakLabel}>Kredit (pengurang)</div>
                <div style={{ ...s.kotakNilai, color: '#c0392b' }}>−{rupiah(totalKredit)}</div>
              </div>
            </>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="text-center text-muted py-4" style={{ fontSize: 14 }}>
            Tidak ada transaksi jurnal untuk akun ini di {namaBulan(filterDate)}.
          </div>
        ) : (
          entries.map((e, i) => (
            <div key={e.id || e._id || i} style={s.kartu}>
              <div style={s.barisAtas}>
                <div style={s.ket}>{e.keterangan || '(tanpa keterangan)'}</div>
                <div style={s.nominal(e.nilai < 0)}>
                  {e.nilai < 0 ? '−' : ''}{rupiah(Math.abs(e.nilai))}
                </div>
              </div>
              <div style={s.meta}>
                {formatTanggal(e.tanggal)}
                {e.kodeLawan ? ` · ${e.nilai < 0 ? 'ke' : 'dari'} ${e.kodeLawan} ${namaAkun(e.kodeLawan)}` : ''}
              </div>
              {(e.kodeCustomerSupplier || e.invoiceSPK) && (
                <div style={s.meta}>
                  {[e.kodeCustomerSupplier, e.invoiceSPK].filter(Boolean).join(' · ')}
                </div>
              )}
              {e.catatan && <div style={s.catatan}>{e.catatan}</div>}
            </div>
          ))
        )}
      </Modal.Body>
    </Modal>
  );
};

export default RincianAkunModal;
