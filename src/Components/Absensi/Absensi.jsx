import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Modal, Button, Form, Spinner } from 'react-bootstrap';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useTheme } from '../../ThemeContext';
import { MdAdd, MdEdit, MdDelete, MdSave, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import {
  hitungPeriode, hitungRate, gabungBaris, awalMinggu, akhirMinggu,
  fmtJam, fmtRp, fmtTanggalPeriode, JAM_NORMAL,
} from '../../Utils/absensiCalc';

const KOLOM_JAM = [
  { key: 'inPagi', label: 'IN PAGI', color: '#c2410c' },
  { key: 'outSiang', label: 'OUT SIANG', color: '#15803d' },
  { key: 'inSiang', label: 'IN SIANG', color: '#15803d' },
  { key: 'outSore', label: 'OUT SORE', color: '#15803d' },
  { key: 'inLembur', label: 'IN LEMBUR', color: '#7c3aed' },
  { key: 'outLembur', label: 'OUT LEMBUR', color: '#7c3aed' },
];

const emptyKaryawanForm = { nama: '', tipe: 'harian', jabatan: '', gajiHarian: '', lemburPerJam: '', status: 'aktif' };

export default function Absensi() {
  const baseUrl = getApiBaseUrl();
  const { globalTheme } = useTheme();
  const dark = globalTheme === 'dark';

  const [activeTab, setActiveTab] = useState('absensi');
  const [karyawan, setKaryawan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedKaryawanId, setSelectedKaryawanId] = useState('');
  const [periodeStart, setPeriodeStart] = useState(() => awalMinggu(new Date()));
  const [rows, setRows] = useState([]);
  const [potongBon, setPotongBon] = useState(0);
  const [catatan, setCatatan] = useState('');
  const [absensiId, setAbsensiId] = useState(null);
  const [dirty, setDirty] = useState(false);

  const [showKaryawanModal, setShowKaryawanModal] = useState(false);
  const [editingKaryawan, setEditingKaryawan] = useState(null);
  const [karyawanForm, setKaryawanForm] = useState(emptyKaryawanForm);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const cardBg = dark ? '#1e1e2e' : '#fff';
  const border = dark ? '1px solid #333' : '1px solid #e8e8e8';
  const cellBorder = dark ? '1px solid #3a3a4a' : '1px solid #d0d0d0';
  const text = dark ? 'white' : '#1a1a1a';
  const muted = dark ? '#aaa' : '#666';
  const headBg = dark ? '#252535' : '#f4f4f4';
  const mc = dark ? 'modalKLF' : 'modalKLFlight';

  const selectedKaryawan = useMemo(
    () => karyawan.find((k) => k.id === selectedKaryawanId) || null,
    [karyawan, selectedKaryawanId]
  );
  const karyawanHarian = useMemo(() => karyawan.filter((k) => k.tipe !== 'bulanan'), [karyawan]);

  const gajiHarian = Number(selectedKaryawan?.gajiHarian) || 0;
  const lemburPerJam = Number(selectedKaryawan?.lemburPerJam) || 0;
  const rate = useMemo(() => hitungRate(gajiHarian, lemburPerJam), [gajiHarian, lemburPerJam]);
  const rekap = useMemo(
    () => hitungPeriode(rows, gajiHarian, lemburPerJam, potongBon),
    [rows, gajiHarian, lemburPerJam, potongBon]
  );

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchKaryawan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(baseUrl + '/karyawan/get');
      const d = await res.json();
      setKaryawan(Array.isArray(d) ? d : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [baseUrl]);

  useEffect(() => { fetchKaryawan(); }, [fetchKaryawan]);

  // Pilih karyawan pertama secara otomatis
  useEffect(() => {
    if (!selectedKaryawanId && karyawanHarian.length) setSelectedKaryawanId(karyawanHarian[0].id);
  }, [karyawanHarian, selectedKaryawanId]);

  // Load absensi tiap ganti karyawan / periode
  useEffect(() => {
    if (!selectedKaryawanId || !periodeStart) return;
    let batal = false;
    (async () => {
      try {
        const res = await fetch(`${baseUrl}/absensi/get?karyawanId=${selectedKaryawanId}&periodeStart=${periodeStart}`);
        const d = await res.json();
        if (batal) return;
        const doc = Array.isArray(d) && d.length ? d[0] : null;
        setRows(gabungBaris(periodeStart, doc?.hari));
        setPotongBon(Number(doc?.potongBon) || 0);
        setCatatan(doc?.catatan || '');
        setAbsensiId(doc?.id || null);
        setDirty(false);
      } catch (e) {
        console.error(e);
        if (!batal) setRows(gabungBaris(periodeStart, null));
      }
    })();
    return () => { batal = true; };
  }, [baseUrl, selectedKaryawanId, periodeStart]);

  // ─── Aksi ───────────────────────────────────────────────────────────────────

  const geserPeriode = (arah) => {
    const d = new Date(periodeStart);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + arah * 7);
    setPeriodeStart(awalMinggu(d));
  };

  const ubahJam = (idx, key, value) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
    setDirty(true);
  };

  const simpanAbsensi = async () => {
    if (!selectedKaryawan) return;
    setSaving(true);
    try {
      const { detail, ...rekapRingkas } = rekap; // detail per hari tidak perlu disimpan, bisa dihitung ulang
      const res = await fetch(baseUrl + '/absensi/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          karyawanId: selectedKaryawan.id,
          karyawanNama: selectedKaryawan.nama,
          periodeStart,
          periodeEnd: akhirMinggu(periodeStart),
          gajiHarian,
          lemburPerJam,
          hari: rows,
          potongBon: Number(potongBon) || 0,
          catatan,
          rekap: rekapRingkas,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Gagal menyimpan');
      setAbsensiId(d.id || absensiId);
      setDirty(false);
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan absensi: ' + e.message);
    }
    setSaving(false);
  };

  const submitKaryawan = async () => {
    if (!karyawanForm.nama.trim()) { alert('Nama karyawan wajib diisi'); return; }
    setSaving(true);
    try {
      const body = {
        ...karyawanForm,
        gajiHarian: Number(karyawanForm.gajiHarian) || 0,
        lemburPerJam: Number(karyawanForm.lemburPerJam) || 0,
      };
      const url = editingKaryawan
        ? `${baseUrl}/karyawan/update/${editingKaryawan.id}`
        : `${baseUrl}/karyawan/create`;
      const res = await fetch(url, {
        method: editingKaryawan ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Gagal menyimpan');
      setShowKaryawanModal(false);
      setEditingKaryawan(null);
      setKaryawanForm(emptyKaryawanForm);
      await fetchKaryawan();
      if (!editingKaryawan && d.id) setSelectedKaryawanId(d.id);
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan karyawan: ' + e.message);
    }
    setSaving(false);
  };

  const hapusKaryawan = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${baseUrl}/karyawan/delete/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).message || 'Gagal hapus');
      if (selectedKaryawanId === deleteTarget.id) setSelectedKaryawanId('');
      setDeleteTarget(null);
      fetchKaryawan();
    } catch (e) {
      console.error(e);
      alert('Gagal hapus karyawan: ' + e.message);
    }
  };

  // ─── Style helper tabel ─────────────────────────────────────────────────────

  const th = (extra = {}) => ({
    border: cellBorder, padding: '6px 8px', fontSize: 11, fontWeight: 700,
    background: headBg, color: text, textAlign: 'center', whiteSpace: 'nowrap', ...extra,
  });
  const td = (extra = {}) => ({
    border: cellBorder, padding: '4px 8px', fontSize: 12, color: text, textAlign: 'center', ...extra,
  });
  const inputJam = {
    border: 'none', background: 'transparent', color: text, fontSize: 12,
    width: '100%', textAlign: 'center', outline: 'none', padding: 2,
    colorScheme: dark ? 'dark' : 'light', // biar ikon jam bawaan browser ikut tema
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Container fluid className="py-3 px-3">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h4 style={{ color: text, fontWeight: 700, margin: 0 }}>Absensi</h4>
          <small style={{ color: muted }}>Rekap jam kerja &amp; perhitungan gaji karyawan</small>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {activeTab === 'karyawan' && (
            <Button size="sm" variant="primary" onClick={() => { setEditingKaryawan(null); setKaryawanForm(emptyKaryawanForm); setShowKaryawanModal(true); }}>
              <MdAdd /> Tambah Karyawan
            </Button>
          )}
          {activeTab === 'absensi' && selectedKaryawan && (
            <Button size="sm" variant={dirty ? 'primary' : 'outline-secondary'} disabled={saving} onClick={simpanAbsensi}>
              {saving ? <Spinner size="sm" /> : <><MdSave /> {dirty ? 'Simpan Perubahan' : 'Tersimpan'}</>}
            </Button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid ' + (dark ? '#333' : '#eee'), marginBottom: 20 }}>
        {[['absensi', 'Absensi'], ['karyawan', 'Karyawan']].map(([k, l]) => (
          <button key={k} onClick={() => setActiveTab(k)} className="no-active"
            style={{
              padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: activeTab === k ? 700 : 400, color: activeTab === k ? '#013175' : muted,
              borderBottom: activeTab === k ? '2px solid #013175' : '2px solid transparent', marginBottom: -2,
            }}>{l}</button>
        ))}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 60 }}><Spinner /></div> : <>

        {/* ─── TAB ABSENSI ───────────────────────────────────────────────── */}
        {activeTab === 'absensi' && (
          karyawanHarian.length === 0 ? (
            <div style={{ textAlign: 'center', color: muted, padding: 60 }}>
              Belum ada karyawan harian. Tambahkan dulu di tab <b>Karyawan</b>.
            </div>
          ) : (
            <>
              {/* Toolbar pilih karyawan & periode */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
                <select
                  value={selectedKaryawanId}
                  onChange={(e) => setSelectedKaryawanId(e.target.value)}
                  style={{ fontSize: 13, padding: '6px 12px', borderRadius: 6, border: dark ? '1px solid #444' : '1px solid #ddd', background: cardBg, color: text, fontWeight: 600, cursor: 'pointer' }}
                >
                  {karyawanHarian.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Button size="sm" variant="outline-secondary" onClick={() => geserPeriode(-1)}><MdChevronLeft /></Button>
                  <input
                    type="date"
                    value={periodeStart}
                    onChange={(e) => e.target.value && setPeriodeStart(awalMinggu(e.target.value))}
                    style={{ fontSize: 13, padding: '5px 10px', borderRadius: 6, border: dark ? '1px solid #444' : '1px solid #ddd', background: cardBg, color: text, colorScheme: dark ? 'dark' : 'light' }}
                  />
                  <Button size="sm" variant="outline-secondary" onClick={() => geserPeriode(1)}><MdChevronRight /></Button>
                  <Button size="sm" variant="outline-secondary" onClick={() => setPeriodeStart(awalMinggu(new Date()))}>Minggu ini</Button>
                </div>

                {dirty && <span style={{ fontSize: 12, color: '#c2410c', fontWeight: 600 }}>Ada perubahan belum disimpan</span>}
              </div>

              {/* Header: nama, periode, rate */}
              <div style={{ background: cardBg, border, borderRadius: 10, padding: '14px 18px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: muted }}>Nama</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: text }}>{selectedKaryawan?.nama || '-'}</div>
                  <div style={{ fontSize: 11, color: muted, marginTop: 8 }}>TGL</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: text }}>{fmtTanggalPeriode(periodeStart, akhirMinggu(periodeStart))}</div>
                </div>
                <div style={{ minWidth: 250 }}>
                  {[
                    ['GAJI HARIAN', gajiHarian],
                    [`GAJI / JAM SIANG (÷${JAM_NORMAL})`, rate.perJamSiang],
                    ['GAJI / JAM LEMBUR', rate.perJamLembur],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 20, padding: '3px 0', borderBottom: dark ? '1px solid #2c2c3c' : '1px solid #f0f0f0' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: muted }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: text }}>{fmtRp(val)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabel absensi */}
              <div style={{ overflowX: 'auto', background: cardBg, border, borderRadius: 10 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
                  <thead>
                    <tr>
                      <th style={th({ textAlign: 'left' })} rowSpan={2}>HARI</th>
                      {KOLOM_JAM.map((c) => <th key={c.key} style={th({ color: c.color })} rowSpan={2}>{c.label}</th>)}
                      <th style={th({ color: '#0369a1' })} rowSpan={2}>JAM<br />KERJA</th>
                      <th style={th({ color: '#7c3aed' })} rowSpan={2}>JAM<br />LEMBUR</th>
                      <th style={th()} colSpan={3}>JUMLAH</th>
                      <th style={th()} rowSpan={2}>TOTAL</th>
                    </tr>
                    <tr>
                      <th style={th()}>JAM</th>
                      <th style={th()}>MENIT</th>
                      <th style={th({ color: '#7c3aed' })}>LEMBUR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => {
                      const d = rekap.detail[i] || {};
                      const minggu = row.hari === 'MINGGU';
                      const rowBg = minggu ? (dark ? '#3b1414' : '#ffe0e0') : 'transparent';
                      return (
                        <tr key={row.tanggal} style={{ background: rowBg }}>
                          <td style={td({ textAlign: 'left', fontWeight: 700, color: minggu ? '#c62828' : text })}>
                            {row.hari}
                            <div style={{ fontSize: 10, fontWeight: 400, color: muted }}>
                              {new Date(row.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                            </div>
                          </td>
                          {KOLOM_JAM.map((c) => (
                            <td key={c.key} style={td({ padding: 0 })}>
                              <input type="time" value={row[c.key] || ''} style={inputJam}
                                onChange={(e) => ubahJam(i, c.key, e.target.value)} />
                            </td>
                          ))}
                          <td style={td({ fontWeight: 600, color: '#0369a1' })}>{fmtJam(d.menitNormal)}</td>
                          <td style={td({ fontWeight: 600, color: d.menitLembur ? '#7c3aed' : muted })}>{fmtJam(d.menitLembur)}</td>
                          <td style={td({ textAlign: 'right' })}>{d.upahJamNormal ? fmtRp(d.upahJamNormal) : '-'}</td>
                          <td style={td({ textAlign: 'right' })}>{d.upahMenitNormal ? fmtRp(d.upahMenitNormal) : '-'}</td>
                          <td style={td({ textAlign: 'right', color: d.upahLembur ? '#7c3aed' : muted })}>{d.upahLembur ? fmtRp(d.upahLembur) : '-'}</td>
                          <td style={td({ textAlign: 'right', fontWeight: 700 })}>{d.jumlah ? fmtRp(d.jumlah) : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: headBg }}>
                      <td style={td({ textAlign: 'right', fontWeight: 700 })} colSpan={9}>TOTAL PENDAPATAN</td>
                      <td style={td({ textAlign: 'right', fontWeight: 700 })}>{fmtRp(rekap.totalUpahJamNormal)}</td>
                      <td style={td({ textAlign: 'right', fontWeight: 700 })}>{fmtRp(rekap.totalUpahMenitNormal)}</td>
                      <td style={td({ textAlign: 'right', fontWeight: 700, color: '#7c3aed' })}>{fmtRp(rekap.totalUpahLembur)}</td>
                      <td style={td({ textAlign: 'right', fontWeight: 700 })}>{fmtRp(rekap.totalPendapatan)}</td>
                    </tr>
                    <tr>
                      <td style={td({ textAlign: 'right', fontWeight: 700 })} colSpan={12}>POTONG BON</td>
                      <td style={td({ padding: 0 })}>
                        <input
                          type="number" min={0} value={potongBon}
                          onChange={(e) => { setPotongBon(e.target.value === '' ? 0 : Number(e.target.value)); setDirty(true); }}
                          style={{ ...inputJam, textAlign: 'right', padding: '4px 8px', color: '#c62828', fontWeight: 700 }}
                        />
                      </td>
                    </tr>
                    <tr style={{ background: headBg }}>
                      <td style={td({ textAlign: 'right', fontWeight: 700, fontSize: 13 })} colSpan={12}>TOTAL AKHIR</td>
                      <td style={td({ textAlign: 'right', fontWeight: 700, fontSize: 14, color: '#15803d' })}>{fmtRp(rekap.totalAkhir)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Ringkasan & catatan */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 14 }}>
                {[
                  { label: 'Hari Masuk', value: `${rekap.hariMasuk} hari`, color: '#013175' },
                  { label: 'Total Jam Kerja', value: fmtJam(rekap.totalMenitNormal), color: '#0369a1' },
                  { label: 'Total Jam Lembur', value: fmtJam(rekap.totalMenitLembur), color: '#7c3aed' },
                  { label: 'Total Akhir', value: 'Rp ' + fmtRp(rekap.totalAkhir), color: '#15803d' },
                ].map((m) => (
                  <div key={m.label} style={{ background: cardBg, border, borderRadius: 10, padding: '12px 18px', flex: '1 1 150px' }}>
                    <div style={{ fontSize: 11, color: muted, marginBottom: 2 }}>{m.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 12 }}>
                <Form.Control
                  as="textarea" rows={2} placeholder="Catatan periode ini (opsional)"
                  value={catatan}
                  onChange={(e) => { setCatatan(e.target.value); setDirty(true); }}
                  style={{ background: cardBg, color: text, border, fontSize: 13 }}
                />
              </div>
            </>
          )
        )}

        {/* ─── TAB KARYAWAN ──────────────────────────────────────────────── */}
        {activeTab === 'karyawan' && (
          karyawan.length === 0 ? (
            <div style={{ textAlign: 'center', color: muted, padding: 60 }}>Belum ada karyawan.</div>
          ) : (
            <div style={{ overflowX: 'auto', background: cardBg, border, borderRadius: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr>
                    <th style={th({ textAlign: 'left' })}>NAMA</th>
                    <th style={th({ textAlign: 'left' })}>JABATAN</th>
                    <th style={th()}>TIPE</th>
                    <th style={th({ textAlign: 'right' })}>GAJI HARIAN</th>
                    <th style={th({ textAlign: 'right' })}>GAJI / JAM</th>
                    <th style={th({ textAlign: 'right' })}>LEMBUR / JAM</th>
                    <th style={th()}>STATUS</th>
                    <th style={th()}>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {karyawan.map((k) => (
                    <tr key={k.id}>
                      <td style={td({ textAlign: 'left', fontWeight: 600 })}>{k.nama}</td>
                      <td style={td({ textAlign: 'left', color: muted })}>{k.jabatan || '-'}</td>
                      <td style={td()}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: k.tipe === 'bulanan' ? '#EEEDFE' : '#EAF3FB', color: k.tipe === 'bulanan' ? '#7F77DD' : '#378ADD' }}>
                          {k.tipe === 'bulanan' ? 'BULANAN' : 'HARIAN'}
                        </span>
                      </td>
                      <td style={td({ textAlign: 'right' })}>{fmtRp(k.gajiHarian)}</td>
                      <td style={td({ textAlign: 'right', color: muted })}>{fmtRp(hitungRate(k.gajiHarian, k.lemburPerJam).perJamSiang)}</td>
                      <td style={td({ textAlign: 'right' })}>{fmtRp(k.lemburPerJam)}</td>
                      <td style={td({ color: k.status === 'aktif' ? '#15803d' : muted, fontWeight: 600 })}>{k.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</td>
                      <td style={td()}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <Button size="sm" variant="outline-primary" onClick={() => {
                            setEditingKaryawan(k);
                            setKaryawanForm({
                              nama: k.nama || '', tipe: k.tipe || 'harian', jabatan: k.jabatan || '',
                              gajiHarian: k.gajiHarian ?? '', lemburPerJam: k.lemburPerJam ?? '', status: k.status || 'aktif',
                            });
                            setShowKaryawanModal(true);
                          }}><MdEdit /></Button>
                          <Button size="sm" variant="outline-danger" onClick={() => setDeleteTarget(k)}><MdDelete /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </>}

      {/* Modal tambah/edit karyawan */}
      <Modal show={showKaryawanModal} onHide={() => setShowKaryawanModal(false)} centered contentClassName={mc}>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: 18 }}>{editingKaryawan ? 'Edit Karyawan' : 'Tambah Karyawan'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: 13 }}>Nama</Form.Label>
            <Form.Control value={karyawanForm.nama} onChange={(e) => setKaryawanForm({ ...karyawanForm, nama: e.target.value })} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: 13 }}>Jabatan</Form.Label>
            <Form.Control value={karyawanForm.jabatan} onChange={(e) => setKaryawanForm({ ...karyawanForm, jabatan: e.target.value })} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: 13 }}>Tipe</Form.Label>
            <Form.Select value={karyawanForm.tipe} onChange={(e) => setKaryawanForm({ ...karyawanForm, tipe: e.target.value })}>
              <option value="harian">Harian</option>
              <option value="bulanan">Bulanan (belum didukung)</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: 13 }}>Gaji Harian (Rp)</Form.Label>
            <Form.Control type="number" min={0} value={karyawanForm.gajiHarian}
              onChange={(e) => setKaryawanForm({ ...karyawanForm, gajiHarian: e.target.value })} />
            <Form.Text style={{ fontSize: 11 }}>
              Gaji / jam siang = {fmtRp(hitungRate(karyawanForm.gajiHarian, 0).perJamSiang)} (dibagi {JAM_NORMAL} jam)
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: 13 }}>Lembur per Jam (Rp)</Form.Label>
            <Form.Control type="number" min={0} value={karyawanForm.lemburPerJam}
              onChange={(e) => setKaryawanForm({ ...karyawanForm, lemburPerJam: e.target.value })} />
            <Form.Text style={{ fontSize: 11 }}>Dihitung per menit saat kerja melebihi {JAM_NORMAL} jam sehari.</Form.Text>
          </Form.Group>
          <Form.Group>
            <Form.Label style={{ fontSize: 13 }}>Status</Form.Label>
            <Form.Select value={karyawanForm.status} onChange={(e) => setKaryawanForm({ ...karyawanForm, status: e.target.value })}>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowKaryawanModal(false)}>Batal</Button>
          <Button variant="primary" disabled={saving} onClick={submitKaryawan}>{saving ? <Spinner size="sm" /> : 'Simpan'}</Button>
        </Modal.Footer>
      </Modal>

      {/* Konfirmasi hapus */}
      <Modal show={!!deleteTarget} onHide={() => setDeleteTarget(null)} centered contentClassName={mc}>
        <Modal.Header closeButton><Modal.Title style={{ fontSize: 18 }}>Hapus Karyawan</Modal.Title></Modal.Header>
        <Modal.Body style={{ fontSize: 14 }}>
          Hapus <b>{deleteTarget?.nama}</b>? Seluruh data absensi karyawan ini ikut terhapus.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Batal</Button>
          <Button variant="danger" onClick={hapusKaryawan}>Hapus</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
