import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import { MdSave, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { FaFilePdf } from 'react-icons/fa';
import { cetakAbsensiBulanan } from '../../Utils/absensiPdf';
import {
  hitungPeriodeBulanan, parseJamMenit, LEAVE_TYPES,
  awalBulan, akhirBulan, gabungBarisBulan, fmtBulan, fmtJam, fmtRp,
} from '../../Utils/absensiCalc';

// Absensi karyawan BULANAN biasa (mis. Azwad). Direkap per bulan penuh.
// Tiap hari cukup isi total jam lembur (format H.MM, mis. 4.42 = 4 jam 42 menit)
// + jenis absen/cuti. Gaji pokok tetap; potongan absen dari bobot jenis cuti.
// Komponen ini mandiri (fetch/simpan sendiri) supaya alur mingguan (harian &
// Pakde) di Absensi.jsx tidak terganggu.
export default function AbsensiAzwad({ baseUrl, karyawan, dark }) {
  const cardBg = dark ? '#1e1e2e' : '#fff';
  const border = dark ? '1px solid #333' : '1px solid #e8e8e8';
  const cellBorder = dark ? '1px solid #3a3a4a' : '1px solid #d0d0d0';
  const text = dark ? 'white' : '#1a1a1a';
  const muted = dark ? '#aaa' : '#666';
  const headBg = dark ? '#252535' : '#f4f4f4';

  const gajiBulanan = Number(karyawan?.gajiBulanan) || 0;
  const lemburPerJam = Number(karyawan?.lemburPerJam) || 0;
  const potongAbsenPerHari = Number(karyawan?.potongAbsenPerHari) || 0;

  const [periodeStart, setPeriodeStart] = useState(() => awalBulan(new Date()));
  const [rows, setRows] = useState([]);
  const [potongBon, setPotongBon] = useState(0);
  const [lainLain, setLainLain] = useState(0);
  const [potongJamKerja, setPotongJamKerja] = useState(0);
  const [catatan, setCatatan] = useState('');
  const [absensiId, setAbsensiId] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const rekap = useMemo(
    () => hitungPeriodeBulanan(rows, gajiBulanan, lemburPerJam, potongAbsenPerHari, { potongBon, lainLain, potongJamKerja }),
    [rows, gajiBulanan, lemburPerJam, potongAbsenPerHari, potongBon, lainLain, potongJamKerja]
  );

  // Muat data tiap ganti karyawan / bulan
  useEffect(() => {
    if (!karyawan?.id || !periodeStart) return;
    let batal = false;
    (async () => {
      try {
        const res = await fetch(`${baseUrl}/absensi/get?karyawanId=${karyawan.id}&periodeStart=${periodeStart}`);
        const d = await res.json();
        if (batal) return;
        const doc = Array.isArray(d) && d.length ? d[0] : null;
        setRows(gabungBarisBulan(periodeStart, doc?.hari));
        setPotongBon(Number(doc?.potongBon) || 0);
        setLainLain(Number(doc?.lainLain) || 0);
        setPotongJamKerja(Number(doc?.potongJamKerja) || 0);
        setCatatan(doc?.catatan || '');
        setAbsensiId(doc?.id || null);
        setDirty(false);
      } catch (e) {
        console.error(e);
        if (!batal) setRows(gabungBarisBulan(periodeStart, null));
      }
    })();
    return () => { batal = true; };
  }, [baseUrl, karyawan?.id, periodeStart]);

  const geserBulan = (arah) => {
    const d = new Date(periodeStart);
    d.setHours(12, 0, 0, 0);
    d.setMonth(d.getMonth() + arah, 1);
    setPeriodeStart(awalBulan(d));
  };

  const ubahLembur = (idx, value) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, lembur: value, lemburMenit: parseJamMenit(value) } : r)));
    setDirty(true);
  };
  const ubahAbsen = (idx, value) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, absen: value } : r)));
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
          periodeEnd: akhirBulan(periodeStart),
          tipe: 'bulanan',
          gajiBulanan,
          lemburPerJam,
          potongAbsenPerHari,
          hari: rows,
          potongBon: Number(potongBon) || 0,
          lainLain: Number(lainLain) || 0,
          potongJamKerja: Number(potongJamKerja) || 0,
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
  }, [baseUrl, karyawan, periodeStart, gajiBulanan, lemburPerJam, potongAbsenPerHari, rows, potongBon, lainLain, potongJamKerja, catatan, rekap, absensiId]);

  const th = (extra = {}) => ({
    border: cellBorder, padding: '6px 8px', fontSize: 11, fontWeight: 700,
    background: headBg, color: text, textAlign: 'center', whiteSpace: 'nowrap', ...extra,
  });
  const td = (extra = {}) => ({
    border: cellBorder, padding: '4px 8px', fontSize: 12, color: text, textAlign: 'center', ...extra,
  });
  const inputPolos = {
    border: 'none', background: 'transparent', color: text, fontSize: 12,
    width: '100%', textAlign: 'center', outline: 'none', padding: 2,
  };

  return (
    <>
      {/* Toolbar bulan */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Button size="sm" variant="outline-secondary" onClick={() => geserBulan(-1)}><MdChevronLeft /></Button>
          <span style={{ fontSize: 14, fontWeight: 700, color: text, minWidth: 130, textAlign: 'center' }}>{fmtBulan(periodeStart)}</span>
          <Button size="sm" variant="outline-secondary" onClick={() => geserBulan(1)}><MdChevronRight /></Button>
          <Button size="sm" variant="outline-secondary" onClick={() => setPeriodeStart(awalBulan(new Date()))}>Bulan ini</Button>
        </div>
        <Button size="sm" variant={dirty ? 'primary' : 'outline-secondary'} disabled={saving} onClick={simpan}>
          {saving ? <Spinner size="sm" /> : <><MdSave /> {dirty ? 'Simpan Perubahan' : 'Tersimpan'}</>}
        </Button>
        <Button
          size="sm" variant="outline-primary" title="Export slip gaji bulan ini ke PDF"
          onClick={() => cetakAbsensiBulanan({ karyawan, periodeStart, rows, rekap, catatan })}
        >
          <FaFilePdf /> Export PDF
        </Button>
        {dirty && <span style={{ fontSize: 12, color: '#c2410c', fontWeight: 600 }}>Ada perubahan belum disimpan</span>}
      </div>

      {/* Header: nama, bulan, rate */}
      <div style={{ background: cardBg, border, borderRadius: 10, padding: '14px 18px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: muted }}>Nama</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: text }}>{karyawan?.nama || '-'}</div>
          <div style={{ fontSize: 11, color: muted, marginTop: 8 }}>BULAN</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: text }}>{fmtBulan(periodeStart)}</div>
        </div>
        <div style={{ minWidth: 250 }}>
          {[
            ['GAJI POKOK / BULAN', gajiBulanan],
            ['UPAH LEMBUR / JAM', lemburPerJam],
            ['POTONG ABSEN / HARI', potongAbsenPerHari],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 20, padding: '3px 0', borderBottom: dark ? '1px solid #2c2c3c' : '1px solid #f0f0f0' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: muted }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: text }}>{fmtRp(val)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabel: tanggal | lembur | absen */}
      <div style={{ overflowX: 'auto', background: cardBg, border, borderRadius: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
          <thead>
            <tr>
              <th style={th({ textAlign: 'left' })}>TANGGAL</th>
              <th style={th()}>HARI</th>
              <th style={th({ color: '#7c3aed' })}>LEMBUR (jam)</th>
              <th style={th()}>ABSEN / CUTI</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const wd = new Date(row.tanggal).getDay();
              const minggu = wd === 0;
              const rowBg = minggu ? (dark ? '#3b1414' : '#ffe0e0') : 'transparent';
              const potong = LEAVE_TYPES.find((t) => t.code === (row.absen || ''))?.potong || 0;
              return (
                <tr key={row.tanggal} style={{ background: rowBg }}>
                  <td style={td({ textAlign: 'left', fontWeight: 600, color: minggu ? '#c62828' : text })}>
                    {new Date(row.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                  </td>
                  <td style={td({ color: minggu ? '#c62828' : muted, fontSize: 11 })}>{row.hari}</td>
                  <td style={td({ padding: 0 })}>
                    <input
                      type="text" inputMode="decimal" placeholder="-"
                      value={row.lembur || ''}
                      onChange={(e) => ubahLembur(i, e.target.value)}
                      style={{ ...inputPolos, color: row.lemburMenit ? '#7c3aed' : text, fontWeight: row.lemburMenit ? 700 : 400 }}
                    />
                  </td>
                  <td style={td({ padding: 0 })}>
                    <select
                      value={row.absen || ''}
                      onChange={(e) => ubahAbsen(i, e.target.value)}
                      style={{ ...inputPolos, cursor: 'pointer', color: potong > 0 ? '#c62828' : text, colorScheme: dark ? 'dark' : 'light' }}
                    >
                      {LEAVE_TYPES.map((t) => <option key={t.code || 'masuk'} value={t.code}>{t.label}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Rincian pendapatan & potongan ala slip gaji */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 14 }}>
        {/* Pendapatan */}
        <div style={{ flex: '1 1 320px', background: cardBg, border, borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: text, marginBottom: 8, textTransform: 'uppercase' }}>Pendapatan</div>
          <Baris label="Gaji Pokok" value={fmtRp(rekap.pokok)} {...{ muted, text }} />
          <Baris label={`Lembur (${fmtJam(rekap.totalLemburMenit)} jam × ${fmtRp(rekap.perJamLembur)})`} value={fmtRp(rekap.upahLembur)} {...{ muted, text }} />
          <BarisInput label="Lain-lain" value={lainLain} onChange={(v) => { setLainLain(v); setDirty(true); }} color="#15803d" {...{ muted, dark, text }} />
          <Baris label="Total Pendapatan" value={fmtRp(rekap.totalPendapatan)} bold {...{ muted, text }} />
        </div>
        {/* Potongan */}
        <div style={{ flex: '1 1 320px', background: cardBg, border, borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: text, marginBottom: 8, textTransform: 'uppercase' }}>Potongan</div>
          <BarisInput label="Potong Bon" value={potongBon} onChange={(v) => { setPotongBon(v); setDirty(true); }} color="#c62828" {...{ muted, dark, text }} />
          <Baris label={`Potong Absen (${rekap.totalHariPotong} hari × ${fmtRp(potongAbsenPerHari)})`} value={fmtRp(rekap.potongAbsen)} color="#c62828" {...{ muted, text }} />
          <BarisInput label="Potong Jam Kerja" value={potongJamKerja} onChange={(v) => { setPotongJamKerja(v); setDirty(true); }} color="#c62828" {...{ muted, dark, text }} />
          <Baris label="Total Potongan" value={fmtRp(rekap.totalPotongan)} bold color="#c62828" {...{ muted, text }} />
        </div>
      </div>

      {/* Total akhir + ringkasan */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
        {[
          { label: 'Hari Masuk', value: `${rekap.hariMasuk} hari`, color: '#013175' },
          { label: 'Total Lembur', value: fmtJam(rekap.totalLemburMenit), color: '#7c3aed' },
          { label: 'Total Potongan', value: 'Rp ' + fmtRp(rekap.totalPotongan), color: '#c62828' },
          { label: 'Total Gaji', value: 'Rp ' + fmtRp(rekap.totalAkhir), color: '#15803d' },
        ].map((m) => (
          <div key={m.label} style={{ background: cardBg, border, borderRadius: 10, padding: '12px 18px', flex: '1 1 150px' }}>
            <div style={{ fontSize: 11, color: muted, marginBottom: 2 }}>{m.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <Form.Control
          as="textarea" rows={2} placeholder="Catatan bulan ini (opsional)"
          value={catatan}
          onChange={(e) => { setCatatan(e.target.value); setDirty(true); }}
          style={{ background: cardBg, color: text, border, fontSize: 13 }}
        />
      </div>
    </>
  );
}

// Baris label:nilai statis.
function Baris({ label, value, bold, color, muted, text }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '4px 0', borderTop: bold ? '1px solid ' + muted : 'none' }}>
      <span style={{ fontSize: bold ? 12 : 11.5, fontWeight: bold ? 700 : 500, color: bold ? text : muted }}>{label}</span>
      <span style={{ fontSize: bold ? 13 : 12, fontWeight: bold ? 700 : 600, color: color || text }}>Rp {value}</span>
    </div>
  );
}

// Baris label:input rupiah.
function BarisInput({ label, value, onChange, color, muted, dark, text }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '4px 0' }}>
      <span style={{ fontSize: 11.5, fontWeight: 500, color: muted }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 12, color: muted }}>Rp</span>
        <input
          type="number" min={0} value={value || ''}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          style={{ width: 110, textAlign: 'right', fontSize: 12, fontWeight: 700, color: color || text, background: 'transparent', border: dark ? '1px solid #444' : '1px solid #ddd', borderRadius: 4, padding: '2px 6px', colorScheme: dark ? 'dark' : 'light' }}
        />
      </div>
    </div>
  );
}
