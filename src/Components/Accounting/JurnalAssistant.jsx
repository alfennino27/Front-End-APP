import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import { Button, Checkbox, Input, Segmented, Select, Upload, message, Popconfirm } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import AccountingMenu from './AccountingMenu';
import { getApiBaseUrl } from '../../Config/APIurl';

// Jurnal Assistant — upload PDF (rekening koran BCA / Rek CV, laporan petty cash) →
// server cek dobel ke semua jurnal & payment yang sudah ada → AI usulkan akun →
// user cek/ubah di sini → simpan. Logika di KLF-Server utils/jurnalAssistant.
// Hermes memakai batch yang sama (link ?batch=<id>).

const NAMA_BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const rp = (v) => `Rp ${Number(v || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })}`;
const tglPendek = (t) => (t ? `${Number(t.slice(8, 10))} ${NAMA_BULAN[Number(t.slice(5, 7)) - 1]} ${t.slice(2, 4)}` : '-');
const NAMA_AKUN_SUMBER = { 1110: 'Kas', 1120: 'BCA', 1125: 'Rek CV' };

const STATUS = [
  { key: 'perlu_cek', label: 'Perlu cek', warna: '#d46b08' },
  { key: 'siap', label: 'Siap', warna: '#1d39c4' },
  { key: 'sudah_ada', label: 'Sudah ada', warna: '#389e0d' },
  { key: 'duplikat', label: 'Duplikat', warna: '#8c8c8c' },
  { key: 'disimpan', label: 'Disimpan', warna: '#237804' },
  { key: 'dilewati', label: 'Dilewati', warna: '#8c8c8c' },
];
const AKSI = [
  { value: 'jurnal', label: 'Jurnal biasa' },
  { value: 'payment_invoice', label: 'Payment invoice (uang masuk customer)' },
  { value: 'payment_spk', label: 'Payment SPK (bayar supplier)' },
  { value: 'lewati', label: 'Lewati (tidak dijurnal)' },
];
const LABEL_AKSI = { tautkan_payment_invoice: 'Tautkan payment invoice yang sudah ada', tautkan_payment_spk: 'Tautkan payment SPK yang sudah ada' };

function useLebar() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const f = () => setW(window.innerWidth);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  return w;
}

const filterOpsi = (input, option) => String(option?.label || '').toLowerCase().includes(input.toLowerCase());

// ---------------------------------------------------------------------------
// Satu baris (kartu). memo: batch bisa 250+ baris.
// ---------------------------------------------------------------------------
const BarisKartu = memo(({ r, opsiAkun, opsiInvoice, opsiSpk, dipilih, onPilih, onUbah, sibuk, mobile }) => {
  const [ket, setKet] = useState(r.keterangan || '');
  useEffect(() => { setKet(r.keterangan || ''); }, [r.keterangan]);
  const bisaUbah = r.status === 'siap' || r.status === 'perlu_cek' || r.status === 'dilewati';
  const masuk = r.arah === 'CR';
  const nominal = r.nominalJurnal ?? r.nominal;

  const kotak = { border: '1px solid #e5e5e5', borderRadius: 10, padding: mobile ? '10px 12px' : '12px 16px', background: '#fff', marginBottom: 10, opacity: sibuk ? 0.6 : 1 };
  const kecil = { fontSize: 12, color: '#777' };
  const label = { fontSize: 11, color: '#888', marginBottom: 2 };
  const grid = { display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 8, marginTop: 8 };

  const opsiSpkBaris = useMemo(() => {
    const kand = (r.kandidatSpk || []).map((s) => ({ value: s.id, label: `★ ${s.kode} — ${s.pengrajin} — sisa ${rp(s.sisa)}` }));
    const ids = new Set(kand.map((o) => o.value));
    return [...kand, ...opsiSpk.filter((o) => !ids.has(o.value))];
  }, [r.kandidatSpk, opsiSpk]);
  const opsiInvoiceBaris = useMemo(() => {
    const kand = (r.kandidatInvoice || []).map((i) => ({ value: i.id, label: `★ ${i.kode} — ${i.customer} — sisa ${rp(i.sisa)}` }));
    const ids = new Set(kand.map((o) => o.value));
    return [...kand, ...opsiInvoice.filter((o) => !ids.has(o.value))];
  }, [r.kandidatInvoice, opsiInvoice]);

  return (
    <div style={kotak}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        {r.status === 'siap' && <Checkbox checked={dipilih} onChange={(e) => onPilih(r.no, e.target.checked)} style={{ marginTop: 2 }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13 }}>
              <b>#{r.no}</b> · {tglPendek(r.tanggal)} ·{' '}
              <span style={{ background: '#f0f5ff', color: '#1d39c4', borderRadius: 4, padding: '0 6px', fontSize: 11 }}>{NAMA_AKUN_SUMBER[r.akunSumber] || r.akunSumber}</span>
            </span>
            <span style={{ fontWeight: 700, color: masuk ? '#389e0d' : '#cf1322', whiteSpace: 'nowrap' }}>
              {masuk ? '+' : '−'} {rp(nominal)}
              {r.nominalJurnal != null && r.nominalJurnal !== r.nominal && <span style={{ ...kecil, fontWeight: 400 }}> (dari {rp(r.nominal)})</span>}
            </span>
          </div>
          <div style={{ ...kecil, marginTop: 2, wordBreak: 'break-word' }}>{r.uraian || <i>(tanpa keterangan)</i>}</div>
        </div>
      </div>

      {(r.status === 'sudah_ada' || r.status === 'duplikat') && (
        <div style={{ marginTop: 8, fontSize: 12, background: r.status === 'sudah_ada' ? '#f6ffed' : '#fafafa', border: `1px solid ${r.status === 'sudah_ada' ? '#b7eb8f' : '#e5e5e5'}`, borderRadius: 6, padding: '6px 8px' }}>
          {r.status === 'sudah_ada' && r.cek ? (
            <>✓ Sudah tercatat: <b>{r.cek.keterangan || '-'}</b> ({r.cek.debet} / {r.cek.kredit}, {tglPendek(r.cek.tanggal)}){r.cek.otomatis ? ` · otomatis ${r.cek.otomatis}` : ''}</>
          ) : (r.alasanCek || 'Sudah tercatat')}
          <Popconfirm title="Tandai sebagai transaksi baru?" description="Hanya kalau yakin pencocokan ini salah — kalau tidak, jurnal jadi dobel." okText="Ya, transaksi lain" cancelText="Batal" onConfirm={() => onUbah(r, { paksaBaru: true, aksi: 'jurnal' })}>
            <a style={{ marginLeft: 8, fontSize: 11, color: '#999' }}>bukan ini?</a>
          </Popconfirm>
        </div>
      )}

      {r.status === 'disimpan' && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#237804' }}>
          ✓ Disimpan sebagai {r.disimpan?.tipe === 'jurnal' ? 'jurnal' : r.disimpan?.tipe === 'invoice_payment' ? 'payment invoice' : 'payment SPK'}
          {r.keterangan ? ` — ${r.keterangan}` : ''} ({r.debet || ''}{r.kredit ? ` / ${r.kredit}` : ''})
        </div>
      )}

      {bisaUbah && (
        <>
          {r.alasanCek && (
            <div style={{ marginTop: 8, fontSize: 12, background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 6, padding: '6px 8px' }}>
              ⚠ {r.alasanCek}
              {r.peringatan?.length > 0 && !r.dikonfirmasi && (
                <div style={{ marginTop: 6 }}>
                  <Button size="small" onClick={() => onUbah(r, { konfirmasi: true })}>Sudah dicek, bukan dobel</Button>
                </div>
              )}
            </div>
          )}
          <div style={grid}>
            <div>
              <div style={label}>Aksi</div>
              {LABEL_AKSI[r.aksi] ? <div style={{ fontSize: 13, padding: '4px 0' }}>{LABEL_AKSI[r.aksi]}</div> : (
                <Select value={r.status === 'dilewati' ? 'lewati' : r.aksi} options={AKSI} style={{ width: '100%' }} onChange={(v) => onUbah(r, { aksi: v })} />
              )}
            </div>
            <div>
              <div style={label}>Keterangan</div>
              <Input value={ket} onChange={(e) => setKet(e.target.value)} onBlur={() => ket !== (r.keterangan || '') && onUbah(r, { keterangan: ket })} />
            </div>
            {r.aksi === 'jurnal' && r.status !== 'dilewati' && (
              <>
                <div>
                  <div style={label}>Debet</div>
                  <Select showSearch value={r.debet || undefined} placeholder="Cari akun…" options={opsiAkun} filterOption={filterOpsi} style={{ width: '100%' }} onChange={(v) => onUbah(r, { debet: v })} />
                </div>
                <div>
                  <div style={label}>Kredit</div>
                  <Select showSearch value={r.kredit || undefined} placeholder="Cari akun…" options={opsiAkun} filterOption={filterOpsi} style={{ width: '100%' }} onChange={(v) => onUbah(r, { kredit: v })} />
                </div>
              </>
            )}
            {r.aksi === 'payment_invoice' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={label}>Invoice (★ = nama/nominal mirip)</div>
                <Select showSearch value={r.invoice?.id || undefined} placeholder="Pilih invoice…" options={opsiInvoiceBaris} filterOption={filterOpsi} style={{ width: '100%' }} onChange={(v) => onUbah(r, { invoiceId: v })} />
              </div>
            )}
            {r.aksi === 'payment_spk' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={label}>SPK yang dibayar {r.pengrajin ? `(pengrajin: ${r.pengrajin}; ★ = kandidat)` : ''}</div>
                <Select showSearch value={r.spk?.id || undefined} placeholder="Pilih SPK…" options={opsiSpkBaris} filterOption={filterOpsi} style={{ width: '100%' }} onChange={(v) => onUbah(r, { spkId: v })} />
              </div>
            )}
          </div>
          {r.alasan && <div style={{ ...kecil, marginTop: 6 }}>AI: {r.alasan}{r.keyakinan != null ? ` (${Math.round(r.keyakinan * 100)}%)` : ''}</div>}
        </>
      )}
    </div>
  );
});

// ---------------------------------------------------------------------------
const JurnalAssistant = () => {
  const baseUrl = getApiBaseUrl();
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;
  const uid = user?.uid;
  const lebar = useLebar();
  const mobile = lebar < 768;
  const [params, setParams] = useSearchParams();

  useEffect(() => { if (user == null) window.location.replace('/login'); }, []);

  const [batches, setBatches] = useState([]);
  const [batch, setBatch] = useState(null);
  const [ref, setRef] = useState({ akun: [], invoice: [], spk: [] });
  const [files, setFiles] = useState([]);
  const [mengunggah, setMengunggah] = useState(false);
  const [tab, setTab] = useState('perlu_cek');
  const [cari, setCari] = useState('');
  const [pilih, setPilih] = useState({});
  const [sibuk, setSibuk] = useState({});
  const [menyimpan, setMenyimpan] = useState(false);
  const [error, setError] = useState('');
  const batchId = params.get('batch');
  const poll = useRef(null);

  const api = useCallback(async (path, opt = {}) => {
    const sep = path.includes('?') ? '&' : '?';
    const res = await fetch(`${baseUrl}${path}${opt.method && opt.method !== 'GET' ? '' : `${sep}uid=${encodeURIComponent(uid || '')}`}`, opt);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || `Gagal (${res.status})`);
    return json;
  }, [baseUrl, uid]);
  const kirim = (path, method, body) => api(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, uid }) });

  const muatDaftar = useCallback(() => api('/jurnal-assistant/batches').then(setBatches).catch((e) => setError(e.message)), [api]);
  useEffect(() => { muatDaftar(); api('/jurnal-assistant/referensi').then(setRef).catch(() => {}); }, []);

  const muatBatch = useCallback(async (id) => {
    try {
      const b = await api(`/jurnal-assistant/batch/${id}`);
      setBatch(b);
      if (b.status === 'proses') {
        clearTimeout(poll.current);
        poll.current = setTimeout(() => muatBatch(id), 3000);
      } else {
        muatDaftar();
        const ada = (k) => b.rows.some((r) => r.status === k);
        setTab((t) => (ada(t) ? t : ['perlu_cek', 'siap', 'sudah_ada', 'disimpan'].find(ada) || 'perlu_cek'));
      }
    } catch (e) { setError(e.message); }
  }, [api, muatDaftar]);
  useEffect(() => {
    clearTimeout(poll.current);
    setPilih({});
    if (batchId) muatBatch(batchId); else setBatch(null);
    return () => clearTimeout(poll.current);
  }, [batchId]);

  const unggah = async () => {
    if (!files.length) { message.warning('Pilih PDF dulu'); return; }
    setMengunggah(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      fd.append('uid', uid);
      const res = await fetch(`${baseUrl}/jurnal-assistant/upload`, { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Upload gagal');
      const gagal = (json.files || []).filter((f) => f.error);
      if (gagal.length) message.warning(`${gagal.length} file tidak terbaca: ${gagal.map((f) => f.nama).join(', ')}`);
      setFiles([]);
      setParams({ batch: json.id });
    } catch (e) { message.error(e.message); } finally { setMengunggah(false); }
  };

  const gantiBaris = (row) => setBatch((b) => ({ ...b, rows: b.rows.map((x) => (x.no === row.no ? row : x)) }));
  const ubah = useCallback(async (r, patch) => {
    setSibuk((s) => ({ ...s, [r.no]: true }));
    try {
      const row = await kirim(`/jurnal-assistant/batch/${batch.id}/row/${r.no}`, 'PUT', patch);
      gantiBaris(row);
      if (row.status !== 'siap') setPilih((p) => { const n = { ...p }; delete n[r.no]; return n; });
    } catch (e) { message.error(e.message); } finally { setSibuk((s) => ({ ...s, [r.no]: false })); }
  }, [batch?.id]);
  const onPilih = useCallback((no, v) => setPilih((p) => ({ ...p, [no]: v })), []);

  const rows = batch?.rows || [];
  const hitung = useMemo(() => { const h = {}; rows.forEach((r) => { h[r.status] = (h[r.status] || 0) + 1; }); return h; }, [rows]);
  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return rows.filter((r) => r.status === tab && (!q || `${r.uraian} ${r.keterangan} ${r.nominal} ${r.debet} ${r.kredit}`.toLowerCase().includes(q)));
  }, [rows, tab, cari]);
  const siap = rows.filter((r) => r.status === 'siap');
  const nosDipilih = siap.filter((r) => pilih[r.no]).map((r) => r.no);
  const target = nosDipilih.length ? siap.filter((r) => pilih[r.no]) : siap;
  const totalTarget = target.reduce((t, r) => t + Number(r.nominalJurnal ?? r.nominal), 0);

  const simpan = async () => {
    setMenyimpan(true);
    try {
      const h = await kirim(`/jurnal-assistant/batch/${batch.id}/simpan`, 'POST', { nos: nosDipilih });
      message.success(`${h.disimpan} disimpan${h.sudahAda ? ` · ${h.sudahAda} ternyata sudah tercatat (dilewati)` : ''}${h.gagal ? ` · ${h.gagal} gagal` : ''}`, 6);
      setPilih({});
      await muatBatch(batch.id);
    } catch (e) { message.error(e.message); } finally { setMenyimpan(false); }
  };

  const opsiAkun = useMemo(() => ref.akun.map((a) => ({ value: a.kodeAkun, label: `${a.kodeAkun} ${a.namaAkun}` })), [ref.akun]);
  const opsiInvoice = useMemo(() => ref.invoice.map((i) => ({ value: i.id, label: `${i.kode} — ${i.customer} — sisa ${rp(i.sisa)}` })), [ref.invoice]);
  const opsiSpk = useMemo(() => ref.spk.map((s) => ({ value: s.id, label: `${s.kode} — ${s.pengrajin} — sisa ${rp(s.sisa)}` })), [ref.spk]);

  const kartu = { border: '1px solid #dddddd', borderRadius: 10, padding: mobile ? 12 : 16, background: '#fff', marginBottom: 12 };

  return (
    <Container fluid={mobile} style={{ paddingTop: 16, paddingBottom: 90, maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <h4 style={{ margin: 0, color: 'blue', fontWeight: 600 }}>Jurnal Assistant</h4>
        <AccountingMenu />
      </div>
      {error && <div style={{ color: '#cf1322', marginBottom: 8 }}>{error}</div>}

      {/* Upload */}
      <div style={kartu}>
        <Upload.Dragger
          multiple
          accept="application/pdf,.pdf"
          fileList={files.map((f, i) => ({ uid: String(i), name: f.name, status: 'done' }))}
          beforeUpload={(f) => { setFiles((l) => [...l, f]); return false; }}
          onRemove={(f) => setFiles((l) => l.filter((_, i) => String(i) !== f.uid))}
        >
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p style={{ margin: 0, fontWeight: 600 }}>Pilih / seret PDF di sini — boleh beberapa sekaligus</p>
          <p style={{ margin: 0, fontSize: 12, color: '#888' }}>Rekening koran BCA & Rek CV, laporan petty cash harian</p>
        </Upload.Dragger>
        <Button type="primary" block={mobile} loading={mengunggah} disabled={!files.length} onClick={unggah} style={{ marginTop: 10 }}>
          Analisa {files.length ? `${files.length} PDF` : ''}
        </Button>
        {batches.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Batch sebelumnya</div>
            <Select
              style={{ width: '100%' }}
              value={batchId || undefined}
              placeholder="Buka batch…"
              onChange={(v) => setParams({ batch: v })}
              options={batches.map((b) => ({
                value: b.id,
                label: `${tglPendek(b.dibuat?.slice(0, 10))} · ${(b.files || []).map((f) => f.label || f.nama).join(', ')} · ${b.via === 'hermes' ? 'Hermes · ' : ''}${b.status === 'proses' ? 'diproses' : `${b.ringkasan?.perlu_cek || 0} perlu cek, ${b.ringkasan?.siap || 0} siap`}`,
              }))}
            />
          </div>
        )}
      </div>

      {batch && (
        <>
          {/* File & progres */}
          <div style={kartu}>
            {(batch.files || []).map((f, i) => (
              <div key={i} style={{ fontSize: 13, marginBottom: 4 }}>
                {f.error ? <span style={{ color: '#cf1322' }}>✗ {f.nama}: {f.error}</span> : (
                  <>
                    {f.checksum?.ok ? '✓' : <span style={{ color: '#cf1322' }}>⚠ checksum tidak cocok —</span>} <b>{f.label}</b> · {f.jumlahBaris} baris
                    {(f.peringatan || []).map((p, j) => <div key={j} style={{ fontSize: 12, color: '#d46b08' }}>⚠ {p}</div>)}
                  </>
                )}
              </div>
            ))}
            {batch.status === 'proses' && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <Spinner animation="border" size="sm" /> {batch.progres || 'Memproses…'}
              </div>
            )}
            {batch.status === 'gagal' && (
              <div style={{ marginTop: 8, color: '#cf1322', fontSize: 13 }}>
                {batch.progres}
                <Button size="small" style={{ marginLeft: 8 }} onClick={() => kirim(`/jurnal-assistant/batch/${batch.id}/proses-ulang`, 'POST', {}).then(() => muatBatch(batch.id)).catch((e) => message.error(e.message))}>Proses ulang</Button>
              </div>
            )}
            {batch.status === 'siap' && (
              <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
                "Sudah ada" = transaksi yang sudah punya jurnal/payment (termasuk payment invoice & SPK otomatis) — tidak akan dijurnal lagi.
              </div>
            )}
          </div>

          {batch.status === 'siap' && (
            <>
              <div style={{ overflowX: 'auto', marginBottom: 10 }}>
                <Segmented
                  value={tab}
                  onChange={setTab}
                  options={STATUS.filter((s) => hitung[s.key]).map((s) => ({ value: s.key, label: <span style={{ color: s.warna }}>{s.label} {hitung[s.key]}</span> }))}
                />
              </div>
              <Input.Search allowClear placeholder="Cari uraian / nominal / akun…" value={cari} onChange={(e) => setCari(e.target.value)} style={{ marginBottom: 10 }} />
              {tab === 'siap' && siap.length > 0 && (
                <div style={{ marginBottom: 8, fontSize: 13 }}>
                  <Checkbox
                    checked={nosDipilih.length === siap.length}
                    indeterminate={nosDipilih.length > 0 && nosDipilih.length < siap.length}
                    onChange={(e) => setPilih(e.target.checked ? Object.fromEntries(siap.map((r) => [r.no, true])) : {})}
                  >
                    Pilih semua
                  </Checkbox>
                </div>
              )}
              {tampil.map((r) => (
                <BarisKartu
                  key={r.no}
                  r={r}
                  opsiAkun={opsiAkun}
                  opsiInvoice={opsiInvoice}
                  opsiSpk={opsiSpk}
                  dipilih={!!pilih[r.no]}
                  onPilih={onPilih}
                  onUbah={ubah}
                  sibuk={!!sibuk[r.no]}
                  mobile={mobile}
                />
              ))}
              {!tampil.length && <div style={{ color: '#888', textAlign: 'center', padding: 24 }}>Tidak ada baris.</div>}
            </>
          )}

          {batch.status === 'siap' && siap.length > 0 && (
            <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, background: '#fff', borderTop: '1px solid #ddd', padding: '10px 16px', zIndex: 20, boxShadow: '0 -2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 13 }}>
                  {nosDipilih.length ? `${nosDipilih.length} dipilih` : `${siap.length} siap`} · {rp(totalTarget)}
                </span>
                <Popconfirm
                  title={`Simpan ${target.length} baris?`}
                  description="Jurnal & payment langsung masuk. Server mengecek dobel sekali lagi sebelum menulis."
                  okText="Simpan"
                  cancelText="Batal"
                  onConfirm={simpan}
                >
                  <Button type="primary" loading={menyimpan}>Simpan {nosDipilih.length ? 'yang dipilih' : 'semua yang siap'}</Button>
                </Popconfirm>
              </div>
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default JurnalAssistant;
