import React, { useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { getApiBaseUrl } from '../../Config/APIurl';

// Popup rincian jurnal satu kode akun di bulan terpilih — dipakai tabel
// Pengeluaran di Laba Rugi Penjualan / Profit / Cash. Rumus nominalnya sama
// persis dengan kolom Nominal di tabel (saldo awal + debet − kredit), jadi
// total di popup selalu cocok dengan angka yang diklik.
// Tampil fullscreen di HP (fullscreen="sm-down") dan pakai kartu, bukan tabel
// lebar, supaya tidak perlu scroll horizontal.
// Tombol "Ubah akun" per transaksi → POST /jurnal/update-akun (hanya kode akun
// debet/kredit; nominal & efek samping SPK/Piutang tidak tersentuh). Setelah
// sukses, parent memperbarui dataJurnal lewat onJurnalUpdated → tabel & popup
// langsung ikut; laporan lain ikut karena semuanya membaca koleksi Jurnal.

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

const RincianAkunModal = ({ akun, filterDate, dataJurnal, dataAkun, onHide, onJurnalUpdated }) => {
  const kodeAkun = akun?.kodeAkun;
  // Form edit akun: hanya satu transaksi yang terbuka sekaligus.
  const [editId, setEditId] = useState(null);
  const [editDebet, setEditDebet] = useState('');
  const [editKredit, setEditKredit] = useState('');
  const [saving, setSaving] = useState(false);
  const [pesan, setPesan] = useState(null); // { tipe: 'ok'|'err', teks }

  const idJurnal = (e) => e.id || e._id;

  const bukaEdit = (e) => {
    setEditId(idJurnal(e));
    setEditDebet(e.kodeAkunDebet || '');
    setEditKredit(e.kodeAkunKredit || '');
    setPesan(null);
  };

  const tutup = () => {
    setEditId(null);
    setPesan(null);
    onHide();
  };

  const simpanAkun = async (e) => {
    if (!editDebet || !editKredit) return setPesan({ tipe: 'err', teks: 'Akun debet & kredit wajib dipilih.' });
    if (editDebet === editKredit) return setPesan({ tipe: 'err', teks: 'Akun debet dan kredit tidak boleh sama.' });
    setSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const res = await fetch(`${getApiBaseUrl()}/jurnal/update-akun`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idJurnal: idJurnal(e), kodeAkunDebet: editDebet, kodeAkunKredit: editKredit, uid: user?.uid }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan');
      onJurnalUpdated?.(idJurnal(e), editDebet, editKredit);
      const pindah = editDebet !== kodeAkun && editKredit !== kodeAkun;
      setEditId(null);
      setPesan({ tipe: 'ok', teks: pindah ? `Tersimpan — transaksi "${e.keterangan || ''}" dipindah dari akun ini.` : 'Kode akun tersimpan.' });
    } catch (err) {
      setPesan({ tipe: 'err', teks: err.message });
    } finally {
      setSaving(false);
    }
  };

  const opsiAkun = useMemo(
    () => [...(dataAkun || [])].sort((a, b) => String(a.kodeAkun).localeCompare(String(b.kodeAkun))),
    [dataAkun]
  );

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
    tombolUbah: { border: '1px solid #c9d0ff', background: '#fff', color: 'blue', borderRadius: 8, fontSize: 12, padding: '4px 10px', marginTop: 8 },
    formEdit: { marginTop: 10, paddingTop: 10, borderTop: '1px dashed #ddd' },
    labelEdit: { fontSize: 12, color: '#555', marginBottom: 2, display: 'block' },
    select: { width: '100%', fontSize: 14, padding: '8px', borderRadius: 8, border: '1px solid #ccc', marginBottom: 8, background: '#fff' },
    tombolSimpan: { background: 'blue', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 14, flex: 1 },
    tombolBatal: { background: '#fff', color: '#333', border: '1px solid #ccc', borderRadius: 8, padding: '8px 16px', fontSize: 14, flex: 1 },
    pesan: (tipe) => ({ fontSize: 13, borderRadius: 8, padding: '8px 12px', marginBottom: 10, background: tipe === 'ok' ? '#E8F7EE' : '#FDECEC', color: tipe === 'ok' ? '#1e7a3e' : '#b3261e' }),
  };

  return (
    <Modal show={!!akun} onHide={tutup} centered scrollable fullscreen="sm-down" size="lg">
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

        {pesan && !editId && <div style={s.pesan(pesan.tipe)}>{pesan.teks}</div>}

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

              {editId === idJurnal(e) ? (
                <div style={s.formEdit}>
                  <label style={s.labelEdit}>Akun Debet · {rupiah(e.nominalDebet)}</label>
                  <select style={s.select} value={editDebet} onChange={(ev) => setEditDebet(ev.target.value)} disabled={saving}>
                    <option value="">— pilih akun —</option>
                    {opsiAkun.map((a) => (
                      <option key={a.kodeAkun} value={a.kodeAkun}>{a.kodeAkun} · {a.namaAkun}</option>
                    ))}
                  </select>
                  <label style={s.labelEdit}>Akun Kredit · {rupiah(e.nominalKredit)}</label>
                  <select style={s.select} value={editKredit} onChange={(ev) => setEditKredit(ev.target.value)} disabled={saving}>
                    <option value="">— pilih akun —</option>
                    {opsiAkun.map((a) => (
                      <option key={a.kodeAkun} value={a.kodeAkun}>{a.kodeAkun} · {a.namaAkun}</option>
                    ))}
                  </select>
                  {pesan?.tipe === 'err' && <div style={s.pesan('err')}>{pesan.teks}</div>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" style={s.tombolBatal} onClick={() => { setEditId(null); setPesan(null); }} disabled={saving}>Batal</button>
                    <button type="button" style={{ ...s.tombolSimpan, opacity: saving ? 0.6 : 1 }} onClick={() => simpanAkun(e)} disabled={saving}>
                      {saving ? 'Menyimpan…' : 'Simpan'}
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" style={s.tombolUbah} onClick={() => bukaEdit(e)}>✎ Ubah akun</button>
              )}
            </div>
          ))
        )}
      </Modal.Body>
    </Modal>
  );
};

export default RincianAkunModal;
