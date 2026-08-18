import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import { MdSave, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import {
  hitungPeriodePakde, hitungRatePakde, gabungBaris, awalMinggu, akhirMinggu,
  fmtJam, fmtRp, fmtTanggalPeriode, JAM_NORMAL_MINGGU,
} from '../../Utils/absensiCalc';

const KOLOM_JAM = [
  { key: 'inPagi', label: 'IN PAGI', color: '#c2410c' },
  { key: 'outSiang', label: 'OUT SIANG', color: '#15803d' },
  { key: 'inSiang', label: 'IN SIANG', color: '#15803d' },
  { key: 'outSore', label: 'OUT SORE', color: '#15803d' },
  { key: 'inLembur', label: 'IN LEMBUR', color: '#7c3aed' },
  { key: 'outLembur', label: 'OUT LEMBUR', color: '#7c3aed' },
];

// Absensi karyawan BULANAN MINGGUAN (mis. Pakde). Diabsen mingguan seperti
// harian, TAPI: hari libur kantor tetap dibayar 7 jam, MINGGU otomatis libur &
// tidak dihitung, dan lembur dihitung per minggu (target 42 jam). Komponen ini
// mandiri (fetch/simpan sendiri) supaya alur harian di Absensi.jsx tidak berubah.
export default function AbsensiPakde({ baseUrl, karyawan, dark }) {
  const cardBg = dark ? '#1e1e2e' : '#fff';
  const border = dark ? '1px solid #333' : '1px solid #e8e8e8';
  const cellBorder = dark ? '1px solid #3a3a4a' : '1px solid #d0d0d0';
  const text = dark ? 'white' : '#1a1a1a';
  const muted = dark ? '#aaa' : '#666';
  const headBg = dark ? '#252535' : '#f4f4f4';

  const gajiPerMinggu = Number(karyawan?.gajiPerMinggu) || 0;
  const lemburPerJam = Number(karyawan?.lemburPerJam) || 0;
  const rate = useMemo(() => hitungRatePakde(gajiPerMinggu, lemburPerJam), [gajiPerMinggu, lemburPerJam]);

  const [periodeStart, setPeriodeStart] = useState(() => awalMinggu(new Date()));
  const [rows, setRows] = useState([]);
  const [potongBon, setPotongBon] = useState(0);
  const [catatan, setCatatan] = useState('');
  const [absensiId, setAbsensiId] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const rekap = useMemo(
    () => hitungPeriodePakde(rows, gajiPerMinggu, lemburPerJam, potongBon),
    [rows, gajiPerMinggu, lemburPerJam, potongBon]
  );

  useEffect(() => {
    if (!karyawan?.id || !periodeStart) return;
    let batal = false;
    (async () => {
      try {
        const res = await fetch(`${baseUrl}/absensi/get?karyawanId=${karyawan.id}&periodeStart=${periodeStart}`);
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
  }, [baseUrl, karyawan?.id, periodeStart]);

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
  const ubahLibur = (idx, checked) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, libur: checked } : r)));
    setDirty(true);
  };

  const simpan = useCallback(async () => {
    if (!karyawan) return;
    setSaving(true);
    try {
      const res = await fetch(baseUrl + '/absensi/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          karyawanId: karyawan.id,
          karyawanNama: karyawan.nama,
          periodeStart,
          periodeEnd: akhirMinggu(periodeStart),
          tipe: 'bulanan_mingguan',
          gajiPerMinggu,
          lemburPerJam,
          hari: rows,
          potongBon: Number(potongBon) || 0,
          catatan,
          rekap,
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
  }, [baseUrl, karyawan, periodeStart, gajiPerMinggu, lemburPerJam, rows, potongBon, catatan, rekap, absensiId]);

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
    colorScheme: dark ? 'dark' : 'light',
  };

  const kurang = rekap.menitKurang > 0;

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Button size="sm" variant="outline-secondary" onClick={() => geserPeriode(-1)}><MdChevronLeft /></Button>
          <input
            type="date" value={periodeStart}
            onChange={(e) => e.target.value && setPeriodeStart(awalMinggu(e.target.value))}
            style={{ fontSize: 13, padding: '5px 10px', borderRadius: 6, border: dark ? '1px solid #444' : '1px solid #ddd', background: cardBg, color: text, colorScheme: dark ? 'dark' : 'light' }}
          />
          <Button size="sm" variant="outline-secondary" onClick={() => geserPeriode(1)}><MdChevronRight /></Button>
          <Button size="sm" variant="outline-secondary" onClick={() => setPeriodeStart(awalMinggu(new Date()))}>Minggu ini</Button>
        </div>
        <Button size="sm" variant={dirty ? 'primary' : 'outline-secondary'} disabled={saving} onClick={simpan}>
          {saving ? <Spinner size="sm" /> : <><MdSave /> {dirty ? 'Simpan Perubahan' : 'Tersimpan'}</>}
        </Button>
        {dirty && <span style={{ fontSize: 12, color: '#c2410c', fontWeight: 600 }}>Ada perubahan belum disimpan</span>}
      </div>

      {/* Header */}
      <div style={{ background: cardBg, border, borderRadius: 10, padding: '14px 18px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: muted }}>Nama</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: text }}>{karyawan?.nama || '-'}</div>
          <div style={{ fontSize: 11, color: muted, marginTop: 8 }}>TGL</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: text }}>{fmtTanggalPeriode(periodeStart, akhirMinggu(periodeStart))}</div>
        </div>
        <div style={{ minWidth: 250 }}>
          {[
            ['GAJI / MINGGU', gajiPerMinggu],
            [`GAJI / JAM (÷${JAM_NORMAL_MINGGU})`, rate.perJamNormal],
            ['GAJI / JAM LEMBUR', rate.perJamLembur],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 20, padding: '3px 0', borderBottom: dark ? '1px solid #2c2c3c' : '1px solid #f0f0f0' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: muted }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: text }}>{fmtRp(val)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabel */}
      <div style={{ overflowX: 'auto', background: cardBg, border, borderRadius: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
          <thead>
            <tr>
              <th style={th({ textAlign: 'left' })}>HARI</th>
              {KOLOM_JAM.map((c) => <th key={c.key} style={th({ color: c.color })}>{c.label}</th>)}
              <th style={th()}>LIBUR</th>
              <th style={th({ color: '#0369a1' })}>JAM<br />KERJA</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const d = rekap.detail[i] || {};
              const minggu = row.hari === 'MINGGU';
              const rowBg = minggu ? (dark ? '#3b1414' : '#ffe0e0') : (d.jenis === 'libur' ? (dark ? '#14243b' : '#e0ecff') : 'transparent');
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
                  <td style={td()}>
                    {minggu ? (
                      <span style={{ fontSize: 10, color: '#c62828', fontWeight: 700 }}>MINGGU</span>
                    ) : (
                      <input type="checkbox" checked={!!row.libur} onChange={(e) => ubahLibur(i, e.target.checked)} style={{ cursor: 'pointer', width: 16, height: 16 }} />
                    )}
                  </td>
                  <td style={td({ fontWeight: 700, color: minggu ? muted : (d.jenis === 'libur' ? '#0369a1' : '#0369a1') })}>
                    {minggu ? '—' : fmtJam(d.creditedMenit)}
                    {d.jenis === 'libur' && <div style={{ fontSize: 9, color: '#0369a1', fontWeight: 600 }}>LIBUR 7j</div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Rekap mingguan (lembur dihitung per minggu, target 42 jam) */}
      <div style={{ background: cardBg, border, borderRadius: 10, padding: '12px 16px', marginTop: 14, maxWidth: 460 }}>
        <BarisP label={`Total Jam Kerja (target ${JAM_NORMAL_MINGGU} jam)`} value={fmtJam(rekap.totalMenit)} plain {...{ muted, text }} />
        <BarisP label="Total Jam Lembur" value={fmtJam(rekap.menitLembur)} plain color="#7c3aed" {...{ muted, text }} />
        {kurang && <BarisP label="Kekurangan Jam" value={fmtJam(rekap.menitKurang)} plain color="#c62828" {...{ muted, text }} />}
        <div style={{ height: 6 }} />
        <BarisP label="Gaji per Minggu" value={'Rp ' + fmtRp(rekap.basePay)} {...{ muted, text }} />
        <BarisP label="Upah Lembur" value={'Rp ' + fmtRp(rekap.upahLembur)} color="#7c3aed" {...{ muted, text }} />
        {kurang && <BarisP label="Potongan Jam" value={'- Rp ' + fmtRp(rekap.potonganJam)} color="#c62828" {...{ muted, text }} />}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '4px 0' }}>
          <span style={{ fontSize: 11.5, fontWeight: 500, color: muted }}>Potong Bon</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 12, color: muted }}>Rp</span>
            <input type="number" min={0} value={potongBon || ''}
              onChange={(e) => { setPotongBon(e.target.value === '' ? 0 : Number(e.target.value)); setDirty(true); }}
              style={{ width: 110, textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#c62828', background: 'transparent', border: dark ? '1px solid #444' : '1px solid #ddd', borderRadius: 4, padding: '2px 6px' }} />
          </div>
        </div>
        <BarisP label="Total Akhir" value={'Rp ' + fmtRp(rekap.totalAkhir)} bold color="#15803d" {...{ muted, text }} />
      </div>

      {/* Ringkasan */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
        {[
          { label: 'Hari Masuk', value: `${rekap.hariMasuk} hari`, color: '#013175' },
          { label: 'Total Jam Kerja', value: fmtJam(rekap.totalMenit), color: '#0369a1' },
          { label: 'Total Jam Lembur', value: fmtJam(rekap.menitLembur), color: '#7c3aed' },
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
  );
}

function BarisP({ label, value, bold, plain, color, muted, text }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '4px 0', borderTop: bold ? '1px solid ' + muted : 'none', marginTop: bold ? 4 : 0 }}>
      <span style={{ fontSize: bold ? 12 : 11.5, fontWeight: bold ? 700 : 500, color: bold ? text : muted }}>{label}</span>
      <span style={{ fontSize: bold ? 14 : 12.5, fontWeight: bold ? 700 : 600, color: color || text }}>{plain ? value : value}</span>
    </div>
  );
}
