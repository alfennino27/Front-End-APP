import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useTheme } from '../../ThemeContext';
import { getImageUrl } from '../../Utils/image';
import CatatanPenerimaanInput from './CatatanPenerimaanInput';

// ============================================================================
// PENGIRIMAN — satu kali serah barang ke ekspedisi, banyak alamat tujuan.
// ----------------------------------------------------------------------------
// Tiap tujuan: penerima, telepon, alamat, CATATAN PENERIMAAN (terisi otomatis
// dari Invoice.catatanPenerimaan), dan barang yang dipilih PER PRODUK (qty
// boleh sebagian). Simpan → satu PDF (server, KLF-Server-main/routes/pengiriman)
// untuk diteruskan ke ekspedisi, plus teks siap-tempel untuk WA.
// ============================================================================

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const pad2 = (n) => String(n).padStart(2, '0');
const toYMD = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const fmtTgl = (s) => {
  const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s || '-';
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
};
const num = (v) => Number(v) || 0;
const waNumber = (s) => {
  let d = String(s || '').replace(/\D/g, '');
  if (d.startsWith('0')) d = '62' + d.slice(1);
  return d;
};
const fileName = (doc) => `Pengiriman ${doc.ekspedisi?.nama || ''} ${doc.tanggalKirim}`.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim();

// Customer yang sama: kode customer sama, atau (kalau salah satu tanpa kode) nama sama.
const normNama = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
const sameCustomer = (a, b) => {
  if (a.kodeCustomer && b.kodeCustomer) return a.kodeCustomer === b.kodeCustomer;
  return normNama(a.customer) === normNama(b.customer);
};

const emptyTujuan = () => ({ key: Math.random().toString(36).slice(2), invoiceIds: [], penerima: '', telepon: '', alamat: '', catatan: '', ongkir: '', pilihan: [] });

// Ongkir per tujuan (diturunkan dari ongkir Quote/Invoice, bisa diubah).
const ONGKIR = { penjual: { label: 'ONGKIR PENJUAL', sub: 'Gratis ongkir', color: '#16a34a' }, penerima: { label: 'ONGKIR PENERIMA', sub: 'Belum termasuk ongkir', color: '#ea580c' } };

// Teks siap tempel ke WhatsApp ekspedisi (isi sama dengan PDF, tanpa foto).
export function buildWaText(doc) {
  const total = doc.tujuan.reduce((s, t) => s + t.items.reduce((a, it) => a + num(it.qty), 0), 0);
  const lines = [
    `*PENGIRIMAN KLF — ${fmtTgl(doc.tanggalKirim)}*`,
    `Ekspedisi: ${doc.ekspedisi?.nama || '-'} · ${doc.tujuan.length} tujuan · ${total} pcs`,
  ];
  if (doc.catatanUmum) lines.push(`Catatan: ${doc.catatanUmum}`);
  doc.tujuan.forEach((t, i) => {
    lines.push('', `*${i + 1}. ${t.penerima || t.customer}*${t.telepon ? ` — ${t.telepon}` : ''}`, `Alamat: ${t.alamat}`);
    if (t.ongkir && ONGKIR[t.ongkir]) lines.push(`💰 *${ONGKIR[t.ongkir].label}*`);
    if (t.catatan) lines.push(`⚠ *CATATAN PENERIMAAN:* ${t.catatan.split('\n').filter(Boolean).join('; ')}`);
    t.items.forEach((it) => lines.push(`• ${it.namaBarang} × ${it.qty}${it.keterangan ? ` — ${it.keterangan}` : ''}`));
  });
  return lines.join('\n');
}

const Pengiriman = () => {
  const baseUrl = getApiBaseUrl();
  const { globalTheme } = useTheme();
  const dark = globalTheme !== 'light';
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();

  const C = {
    bg: dark ? '#0f0f10' : '#f4f4f5',
    card: dark ? '#1c1c1f' : '#ffffff',
    border: dark ? '#2e2e33' : '#e4e4e7',
    text: dark ? '#f4f4f5' : '#18181b',
    muted: dark ? '#a1a1aa' : '#71717a',
    soft: dark ? '#27272a' : '#f4f4f5',
    input: dark ? '#111113' : '#ffffff',
  };
  const sInput = { background: C.input, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 10px', fontSize: 14, minHeight: 38, width: '100%' };
  const sBtn = (bg, fg = '#fff') => ({ background: bg, color: fg, border: 'none', borderRadius: 10, padding: '10px 14px', fontSize: 14, fontWeight: 600, cursor: 'pointer', minHeight: 42 });
  const sCard = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 12 };
  const sLabel = { fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 4, display: 'block' };

  const [list, setList] = useState([]);
  const [ekspedisi, setEkspedisi] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [mode, setMode] = useState('list'); // list | edit | done
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(null);
  const [done, setDone] = useState(null);   // dokumen tersimpan (untuk layar bagikan)
  const [showEkspedisi, setShowEkspedisi] = useState(false);
  const [toast, setToast] = useState('');

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  const fetchList = useCallback(async () => {
    try {
      const [l, e] = await Promise.all([
        fetch(`${baseUrl}/pengiriman/get`).then((r) => r.json()),
        fetch(`${baseUrl}/ekspedisi/get`).then((r) => r.json()),
      ]);
      setList(Array.isArray(l) ? l : []);
      setEkspedisi(Array.isArray(e) ? e : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const ensureInvoices = async () => {
    if (invoices.length) return;
    try {
      const r = await fetch(`${baseUrl}/pengiriman/invoices`).then((x) => x.json());
      setInvoices(Array.isArray(r) ? r : []);
    } catch { /* abaikan */ }
  };

  const fetchInvoiceDetail = async (invoiceId, excludeId) => {
    const r = await fetch(`${baseUrl}/pengiriman/invoice/${invoiceId}${excludeId ? `?exclude=${excludeId}` : ''}`);
    const d = await r.json();
    if (!r.ok) throw new Error(d.message || 'Gagal ambil invoice');
    return d;
  };

  // ── Buka form ──────────────────────────────────────────────────────────────
  const bukaBaru = () => {
    ensureInvoices();
    setEditId(null);
    setForm({ tanggalKirim: toYMD(new Date()), ekspedisiId: ekspedisi[0]?.id || '', catatanUmum: '', tujuan: [emptyTujuan()] });
    setMode('edit');
  };

  const bukaEdit = async (doc) => {
    ensureInvoices();
    setBusy(true);
    try {
      const tujuan = [];
      for (const t of doc.tujuan) {
        const pilihan = t.items.map((it) => ({ ...it, checked: true, terkirim: 0 }));
        // Lengkapi dengan barang lain dari invoice yang sama (belum dicentang)
        for (const invId of (t.invoiceIds && t.invoiceIds.length ? t.invoiceIds : [t.invoiceId]).filter(Boolean)) {
          try {
            const d = await fetchInvoiceDetail(invId, doc.id);
            if (!t.kodeCustomer && d.kodeCustomer) t.kodeCustomer = d.kodeCustomer;
            if (!t.customer) t.customer = d.customer;
            for (const it of d.items) {
              const ada = pilihan.find((p) => p.projectId === it.projectId);
              if (ada) Object.assign(ada, { qtyOrder: it.qtyOrder, terkirim: it.terkirim, status: it.status, spesifikasi: it.spesifikasi });
              else pilihan.push({ ...it, checked: false, qty: Math.max(0, it.qtyOrder - it.terkirim) });
            }
          } catch { /* invoice mungkin sudah dihapus */ }
        }
        tujuan.push({ ...emptyTujuan(), ...t, invoiceIds: t.invoiceIds || [t.invoiceId].filter(Boolean), pilihan });
      }
      setEditId(doc.id);
      setForm({ tanggalKirim: doc.tanggalKirim, ekspedisiId: doc.ekspedisiId, catatanUmum: doc.catatanUmum || '', tujuan });
      setMode('edit');
    } finally {
      setBusy(false);
    }
  };

  // ── Ubah form ──────────────────────────────────────────────────────────────
  const setTujuan = (key, patch) => setForm((f) => ({ ...f, tujuan: f.tujuan.map((t) => (t.key === key ? { ...t, ...patch } : t)) }));
  const setPilihan = (key, projectId, patch) => setForm((f) => ({
    ...f,
    tujuan: f.tujuan.map((t) => (t.key !== key ? t : { ...t, pilihan: t.pilihan.map((p) => (p.projectId === projectId ? { ...p, ...patch } : p)) })),
  }));

  const tambahInvoice = async (key, invoiceId) => {
    if (!invoiceId) return;
    const t = form.tujuan.find((x) => x.key === key);
    if (t.invoiceIds.includes(invoiceId)) return;
    // Satu tujuan = satu customer (tidak mungkin beda customer tapi alamat sama).
    const inv = invoices.find((x) => x.id === invoiceId);
    if (t.invoiceIds.length && inv && !sameCustomer(inv, t)) return alert(`Tujuan ini milik ${t.customer}. Barang customer lain buat sebagai tujuan baru.`);
    setBusy(true);
    try {
      const d = await fetchInvoiceDetail(invoiceId, editId);
      const baru = d.items
        .filter((it) => !t.pilihan.some((p) => p.projectId === it.projectId))
        .map((it) => {
          const sisa = Math.max(0, it.qtyOrder - it.terkirim);
          return { ...it, checked: false, qty: sisa || it.qtyOrder };
        });
      const pertama = t.invoiceIds.length === 0;
      setTujuan(key, {
        invoiceIds: [...t.invoiceIds, d.invoiceId],
        pilihan: [...t.pilihan, ...baru],
        // Invoice pertama mengisi data penerima; invoice tambahan tidak menimpa.
        ...(pertama ? { penerima: d.penerima, telepon: d.telepon, alamat: d.alamat, catatan: d.catatan, customer: d.customer, kodeCustomer: d.kodeCustomer, invoiceId: d.invoiceId, kodeInvoice: d.kodeInvoice, ongkir: d.ongkir } : {}),
        ...(!pertama && d.catatan && !String(t.catatan || '').includes(d.catatan) ? { catatan: [t.catatan, d.catatan].filter(Boolean).join('\n') } : {}),
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const buildPayload = () => {
    const eks = ekspedisi.find((e) => e.id === form.ekspedisiId);
    return {
      tanggalKirim: form.tanggalKirim,
      ekspedisiId: form.ekspedisiId,
      ekspedisi: { nama: eks?.nama || '', wa: eks?.wa || '' },
      catatanUmum: form.catatanUmum,
      uid: user?.uid || '',
      tujuan: form.tujuan.map((t) => ({
        invoiceId: t.invoiceIds[0] || '',
        invoiceIds: t.invoiceIds,
        kodeInvoice: t.kodeInvoice || '',
        customer: t.customer || t.penerima,
        penerima: t.penerima,
        telepon: t.telepon,
        alamat: t.alamat,
        catatan: t.catatan,
        ongkir: t.ongkir,
        items: t.pilihan.filter((p) => p.checked && num(p.qty) > 0).map((p) => ({
          projectId: p.projectId, kodeInvoice: p.kodeInvoice, namaBarang: p.namaBarang, qty: num(p.qty), qtyOrder: p.qtyOrder, image: p.image, keterangan: p.keterangan || '',
        })),
      })),
    };
  };

  const simpan = async () => {
    const body = buildPayload();
    if (!body.ekspedisiId) return alert('Pilih ekspedisi dulu');
    const tanpaOngkir = form.tujuan.findIndex((t) => !t.ongkir);
    if (tanpaOngkir >= 0) return alert(`Pilih ongkir (penjual / penerima) untuk tujuan ${tanpaOngkir + 1}`);
    setBusy(true);
    try {
      const r = await fetch(`${baseUrl}/pengiriman/${editId ? `update/${editId}` : 'create'}`, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Gagal simpan');
      const saved = await fetch(`${baseUrl}/pengiriman/get/${d.id}`).then((x) => x.json());
      setDone(saved);
      setMode('done');
      fetchList();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const hapus = async (doc) => {
    if (!window.confirm(`Hapus pengiriman ${fmtTgl(doc.tanggalKirim)} (${doc.ekspedisi?.nama || ''})?`)) return;
    await fetch(`${baseUrl}/pengiriman/delete/${doc.id}`, { method: 'DELETE' });
    fetchList();
  };

  // ── Bagikan ────────────────────────────────────────────────────────────────
  // ?v= supaya tidak pernah dapat PDF lama dari cache Cloudflare/browser setelah diedit
  const pdfUrl = (doc) => `${baseUrl}/pengiriman/${doc.id}/pdf/${encodeURIComponent(fileName(doc))}.pdf?v=${encodeURIComponent(doc.updated_at || doc.created_at || '')}-${Date.now()}`;

  const bagikanPdf = async (doc) => {
    setBusy(true);
    try {
      const blob = await fetch(pdfUrl(doc)).then((r) => { if (!r.ok) throw new Error('Gagal membuat PDF'); return r.blob(); });
      const file = new File([blob], `${fileName(doc)}.pdf`, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: fileName(doc) });
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${fileName(doc)}.pdf`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        flash('PDF diunduh — lampirkan ke chat ekspedisi');
      }
    } catch (err) {
      if (err.name !== 'AbortError') alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const salinTeks = async (doc) => {
    try { await navigator.clipboard.writeText(buildWaText(doc)); flash('Teks disalin'); } catch { alert('Gagal menyalin'); }
  };

  const chatEkspedisi = (doc) => {
    const n = waNumber(doc.ekspedisi?.wa);
    if (!n) return alert('Nomor WA ekspedisi belum diisi (menu ⚙ Ekspedisi)');
    window.open(`https://wa.me/${n}?text=${encodeURIComponent(buildWaText(doc))}`, '_blank');
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const wrap = { background: C.bg, color: C.text, minHeight: '100vh', padding: '16px 12px 110px' };
  const inner = { maxWidth: 820, margin: '0 auto' };

  if (mode === 'edit' && form) {
    return (
      <div style={wrap}><div style={inner}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <button type="button" style={sBtn(C.soft, C.text)} onClick={() => setMode('list')}>← Kembali</button>
          <div style={{ fontWeight: 700, fontSize: 18, flex: 1 }}>{editId ? 'Ubah Pengiriman' : 'Pengiriman Baru'}</div>
        </div>

        <div style={sCard}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 180px' }}>
              <label style={sLabel}>Tanggal kirim</label>
              <input type="date" style={sInput} value={form.tanggalKirim} onChange={(e) => setForm({ ...form, tanggalKirim: e.target.value })} />
            </div>
            <div style={{ flex: '2 1 240px' }}>
              <label style={sLabel}>Ekspedisi</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <select style={sInput} value={form.ekspedisiId} onChange={(e) => setForm({ ...form, ekspedisiId: e.target.value })}>
                  <option value="">— pilih ekspedisi —</option>
                  {ekspedisi.map((e) => <option key={e.id} value={e.id}>{e.nama}{e.wa ? ` (${e.wa})` : ''}</option>)}
                </select>
                <button type="button" title="Kelola ekspedisi" style={{ ...sBtn(C.soft, C.text), padding: '8px 12px' }} onClick={() => setShowEkspedisi(true)}>⚙</button>
              </div>
            </div>
          </div>
          <label style={{ ...sLabel, marginTop: 10 }}>Catatan umum untuk ekspedisi (opsional)</label>
          <input style={sInput} value={form.catatanUmum} placeholder="mis. barang fragile, ambil di workshop jam 09.00" onChange={(e) => setForm({ ...form, catatanUmum: e.target.value })} />
        </div>

        {form.tujuan.map((t, i) => (
          <TujuanCard
            key={t.key} t={t} i={i} C={C} sInput={sInput} sBtn={sBtn} sCard={sCard} sLabel={sLabel}
            invoices={invoices} busy={busy}
            onChange={(patch) => setTujuan(t.key, patch)}
            onPilihan={(pid, patch) => setPilihan(t.key, pid, patch)}
            onTambahInvoice={(invId) => tambahInvoice(t.key, invId)}
            onHapus={form.tujuan.length > 1 ? () => setForm({ ...form, tujuan: form.tujuan.filter((x) => x.key !== t.key) }) : null}
          />
        ))}

        <button type="button" style={{ ...sBtn(C.card, '#2563eb'), width: '100%', border: '2px dashed #2563eb' }}
          onClick={() => setForm({ ...form, tujuan: [...form.tujuan, emptyTujuan()] })}>
          + Tambah Tujuan
        </button>

        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, background: C.card, borderTop: `1px solid ${C.border}`, padding: '10px 12px', zIndex: 20 }}>
          <div style={{ ...inner, display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ flex: 1, fontSize: 13, color: C.muted }}>
              {form.tujuan.length} tujuan · {form.tujuan.reduce((s, t) => s + t.pilihan.filter((p) => p.checked).reduce((a, p) => a + num(p.qty), 0), 0)} pcs
            </div>
            <button type="button" disabled={busy} style={{ ...sBtn('#16a34a'), opacity: busy ? 0.6 : 1 }} onClick={simpan}>
              {busy ? 'Menyimpan…' : 'Simpan & Cetak'}
            </button>
          </div>
        </div>
        {showEkspedisi && <EkspedisiSheet C={C} sInput={sInput} sBtn={sBtn} baseUrl={baseUrl} list={ekspedisi} onClose={() => setShowEkspedisi(false)} onChanged={fetchList} />}
      </div></div>
    );
  }

  if (mode === 'done' && done) {
    return (
      <div style={wrap}><div style={inner}>
        <div style={{ ...sCard, textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>✅</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Pengiriman tersimpan</div>
          <div style={{ color: C.muted, marginBottom: 14 }}>{fmtTgl(done.tanggalKirim)} · {done.ekspedisi?.nama} · {done.tujuan.length} tujuan</div>
          <div style={{ display: 'grid', gap: 8 }}>
            <button type="button" disabled={busy} style={sBtn('#16a34a')} onClick={() => bagikanPdf(done)}>{busy ? 'Menyiapkan PDF…' : '📤 Bagikan / Unduh PDF'}</button>
            <button type="button" style={sBtn('#2563eb')} onClick={() => window.open(pdfUrl(done), '_blank')}>👁 Lihat PDF</button>
            <button type="button" style={sBtn('#25D366')} onClick={() => chatEkspedisi(done)}>💬 Chat WA {done.ekspedisi?.nama}</button>
            <button type="button" style={sBtn(C.soft, C.text)} onClick={() => salinTeks(done)}>📋 Salin teks untuk WA</button>
            <button type="button" style={sBtn(C.soft, C.text)} onClick={() => setMode('list')}>Selesai</button>
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 10 }}>
            Di HP, “Bagikan” bisa langsung pilih WhatsApp → chat ekspedisi.
          </div>
        </div>
        {toast && <Toast text={toast} />}
      </div></div>
    );
  }

  return (
    <div style={wrap}><div style={inner}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 700, fontSize: 20, flex: 1 }}>Pengiriman</div>
        <button type="button" style={sBtn(C.soft, C.text)} onClick={() => setShowEkspedisi(true)}>⚙ Ekspedisi</button>
        <button type="button" style={sBtn('#2563eb')} onClick={bukaBaru}>+ Pengiriman Baru</button>
      </div>
      {loading && <div style={{ color: C.muted }}>Memuat…</div>}
      {error && <div style={{ color: '#dc2626' }}>{error}</div>}
      {!loading && !list.length && <div style={{ ...sCard, color: C.muted, textAlign: 'center' }}>Belum ada pengiriman.</div>}
      {list.map((doc) => {
        const pcs = doc.tujuan.reduce((s, t) => s + t.items.reduce((a, it) => a + num(it.qty), 0), 0);
        return (
          <div key={doc.id} style={sCard}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 700, flex: 1 }}>{fmtTgl(doc.tanggalKirim)}</div>
              <div style={{ fontSize: 13, color: C.muted }}>{doc.ekspedisi?.nama} · {doc.tujuan.length} tujuan · {pcs} pcs</div>
            </div>
            <div style={{ fontSize: 13, margin: '6px 0 10px' }}>
              {doc.tujuan.map((t, i) => (
                <div key={i}>
                  {i + 1}. <b>{t.penerima || t.customer}</b> — {t.items.map((it) => `${it.namaBarang} ×${it.qty}`).join(', ')}
                  {t.ongkir && ONGKIR[t.ongkir] && <span style={{ color: ONGKIR[t.ongkir].color, fontWeight: 600, fontSize: 12 }}> · {ONGKIR[t.ongkir].label}</span>}
                  {t.catatan && <span style={{ color: '#dc2626' }}> ⚠</span>}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button type="button" disabled={busy} style={sBtn('#16a34a')} onClick={() => bagikanPdf(doc)}>📤 PDF</button>
              <button type="button" style={sBtn(C.soft, C.text)} onClick={() => window.open(pdfUrl(doc), '_blank')}>👁 Lihat</button>
              <button type="button" style={sBtn(C.soft, C.text)} onClick={() => salinTeks(doc)}>📋 Teks WA</button>
              <button type="button" disabled={busy} style={sBtn(C.soft, C.text)} onClick={() => bukaEdit(doc)}>✏️ Ubah</button>
              <button type="button" style={sBtn(C.soft, '#dc2626')} onClick={() => hapus(doc)}>Hapus</button>
            </div>
          </div>
        );
      })}
      {showEkspedisi && <EkspedisiSheet C={C} sInput={sInput} sBtn={sBtn} baseUrl={baseUrl} list={ekspedisi} onClose={() => setShowEkspedisi(false)} onChanged={fetchList} />}
      {toast && <Toast text={toast} />}
    </div></div>
  );
};

// ============================================================================
// Satu tujuan (alamat) + pilih barang
// ============================================================================
const TujuanCard = ({ t, i, C, sInput, sBtn, sCard, sLabel, invoices, busy, onChange, onPilihan, onTambahInvoice, onHapus }) => {
  const [cari, setCari] = useState('');
  const [open, setOpen] = useState(false);
  const hasil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return invoices
      .filter((inv) => !t.invoiceIds.includes(inv.id))
      // Sudah ada invoice → hanya invoice lain milik customer yang SAMA.
      .filter((inv) => !t.invoiceIds.length || sameCustomer(inv, t))
      .filter((inv) => !q || inv.customer.toLowerCase().includes(q) || inv.kodeInvoice.toLowerCase().includes(q))
      .slice(0, 30);
  }, [cari, invoices, t.invoiceIds, t.kodeCustomer, t.customer]);

  const pcs = t.pilihan.filter((p) => p.checked).reduce((a, p) => a + num(p.qty), 0);

  return (
    <div style={{ ...sCard, borderLeft: '4px solid #1e3a8a' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1e3a8a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{i + 1}</div>
        <div style={{ flex: 1, fontWeight: 700 }}>{t.penerima || 'Tujuan baru'}{pcs ? <span style={{ color: C.muted, fontWeight: 400 }}> · {pcs} pcs</span> : null}</div>
        {onHapus && <button type="button" style={{ ...sBtn(C.soft, '#dc2626'), minHeight: 32, padding: '4px 10px' }} onClick={onHapus}>Hapus</button>}
      </div>

      {/* Pilih invoice */}
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <label style={sLabel}>{t.invoiceIds.length ? `Tambah barang dari invoice lain milik ${t.customer || t.penerima}` : 'Pilih invoice / customer'}</label>
        <input
          style={sInput}
          value={cari}
          placeholder="Ketik nama customer atau kode invoice…"
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          onChange={(e) => { setCari(e.target.value); setOpen(true); }}
        />
        {open && (
          <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 30, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, maxHeight: 340, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}>
            {!invoices.length && <div style={{ padding: 10, color: C.muted }}>Memuat invoice…</div>}
            {invoices.length > 0 && !hasil.length && (
              <div style={{ padding: 10, color: C.muted, fontSize: 13 }}>
                {t.invoiceIds.length ? `Tidak ada invoice lain milik ${t.customer || t.penerima} dengan barang ongoing.` : 'Tidak ada invoice dengan barang ongoing yang cocok.'}
              </div>
            )}
            {hasil.map((inv) => (
              <div key={inv.id} onMouseDown={() => { onTambahInvoice(inv.id); setCari(''); setOpen(false); }}
                style={{ padding: '8px 10px', cursor: 'pointer', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontWeight: 600 }}>{inv.customer || '(tanpa nama)'}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{inv.kodeInvoice} · {inv.tanggal} · {inv.jumlahItem} item ongoing</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
                  {(inv.thumbs || []).map((th, k) => (
                    <img key={k} src={getImageUrl(th.image)} alt={th.nama} title={th.nama} loading="lazy"
                      style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, background: C.soft, flex: '0 0 52px' }} />
                  ))}
                  {inv.jumlahItem > (inv.thumbs || []).length && (
                    <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>+{inv.jumlahItem - inv.thumbs.length}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {busy && !t.pilihan.length && t.invoiceIds.length === 0 ? null : null}

      {(t.invoiceIds.length > 0 || t.alamat) && (
        <>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={sLabel}>Nama penerima</label>
              <input style={sInput} value={t.penerima} onChange={(e) => onChange({ penerima: e.target.value })} />
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <label style={sLabel}>Telepon / WA</label>
              <input style={sInput} value={t.telepon} onChange={(e) => onChange({ telepon: e.target.value })} />
            </div>
          </div>
          <label style={{ ...sLabel, marginTop: 10 }}>Alamat lengkap</label>
          <textarea className="form-control" rows={2} style={sInput} value={t.alamat} onChange={(e) => onChange({ alamat: e.target.value })} />

          <label style={{ ...sLabel, marginTop: 10 }}>Ongkir</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.entries(ONGKIR).map(([k, o]) => {
              const on = t.ongkir === k;
              return (
                <button key={k} type="button" onClick={() => onChange({ ongkir: k })}
                  style={{ flex: 1, minHeight: 52, borderRadius: 10, cursor: 'pointer', padding: '6px 8px', lineHeight: 1.25,
                    border: `2px solid ${on ? o.color : C.border}`, background: on ? o.color : 'transparent', color: on ? '#fff' : C.text }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{on ? '✓ ' : ''}{o.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.85 }}>{o.sub}</div>
                </button>
              );
            })}
          </div>
          {!t.ongkir && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>Ongkir di Quote/Invoice belum diisi — pilih salah satu.</div>}

          <label style={{ ...sLabel, marginTop: 10, color: '#dc2626' }}>⚠ Catatan penerimaan</label>
          <CatatanPenerimaanInput value={t.catatan} onChange={(v) => onChange({ catatan: v })} style={sInput} muted={C.muted} rows={2} />
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Terisi dari invoice. Perubahan di sini hanya untuk pengiriman ini.</div>

          <label style={{ ...sLabel, marginTop: 12 }}>Barang yang dikirim</label>
          {t.pilihan.map((p) => {
            const sisa = Math.max(0, num(p.qtyOrder) - num(p.terkirim));
            return (
              <div key={p.projectId}
                style={{ padding: 8, borderRadius: 10, marginBottom: 6, border: `1px solid ${p.checked ? '#16a34a' : C.border}`, background: p.checked ? (C.bg === '#0f0f10' ? '#052e16' : '#f0fdf4') : 'transparent', opacity: !p.checked && sisa === 0 ? 0.55 : 1 }}>
               <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="checkbox" style={{ width: 22, height: 22, flex: '0 0 22px' }} checked={!!p.checked}
                  onChange={(e) => onPilihan(p.projectId, { checked: e.target.checked, qty: p.qty || sisa || p.qtyOrder })} />
                <img src={getImageUrl(p.image)} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, flex: '0 0 64px', background: C.soft }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.namaBarang}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>
                    {p.kodeInvoice} · order {p.qtyOrder}
                    {num(p.terkirim) > 0 && <span style={{ color: sisa ? '#d97706' : '#16a34a' }}> · sudah dikirim {p.terkirim}{sisa ? `, sisa ${sisa}` : ' (lengkap)'}</span>}
                  </div>
                </div>
                {p.checked && (
                  <input type="number" min={1} style={{ ...sInput, width: 70, flex: '0 0 70px', textAlign: 'center' }} value={p.qty}
                    onChange={(e) => onPilihan(p.projectId, { qty: e.target.value })} />
                )}
               </div>
                {/* Keterangan per barang → tampil di bawah foto di PDF & teks WA */}
                {p.checked && (
                  <textarea className="form-control"
                    rows={Math.min(5, Math.max(2, String(p.spesifikasi || '').split('\n').length))}
                    style={{ ...sInput, marginTop: 8, fontSize: 15, resize: 'vertical' }} value={p.keterangan || ''}
                    // Placeholder = deskripsi di detail produk, jadi tidak perlu buka detail produk lagi
                    placeholder={p.spesifikasi ? p.spesifikasi : 'Keterangan untuk ekspedisi (ukuran, marmer, dll)'}
                    onChange={(e) => onPilihan(p.projectId, { keterangan: e.target.value })} />
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

// ============================================================================
// Kelola daftar ekspedisi (nama + WA)
// ============================================================================
const EkspedisiSheet = ({ C, sInput, sBtn, baseUrl, list, onClose, onChanged }) => {
  const [rows, setRows] = useState(list);
  const [baru, setBaru] = useState({ nama: '', wa: '' });
  useEffect(() => setRows(list), [list]);

  const simpan = async (r) => {
    await fetch(`${baseUrl}/ekspedisi/update/${r.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(r) });
    onChanged();
  };
  const tambah = async () => {
    if (!baru.nama.trim()) return;
    await fetch(`${baseUrl}/ekspedisi/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(baru) });
    setBaru({ nama: '', wa: '' });
    onChanged();
  };
  const hapus = async (r) => {
    if (!window.confirm(`Hapus ekspedisi ${r.nama}?`)) return;
    await fetch(`${baseUrl}/ekspedisi/delete/${r.id}`, { method: 'DELETE' });
    onChanged();
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1050, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, color: C.text, width: '100%', maxWidth: 640, maxHeight: '88vh', overflowY: 'auto', borderRadius: '16px 16px 0 0', padding: '14px 16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ flex: 1, fontWeight: 700, fontSize: 16 }}>Daftar Ekspedisi</div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>
        {rows.map((r, i) => (
          <div key={r.id} style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
            <input style={{ ...sInput, flex: '2 1 150px', width: 'auto' }} value={r.nama} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, nama: e.target.value } : x)))} onBlur={() => simpan(rows[i])} />
            <input style={{ ...sInput, flex: '2 1 140px', width: 'auto' }} value={r.wa} placeholder="No. WA" onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, wa: e.target.value } : x)))} onBlur={() => simpan(rows[i])} />
            <button type="button" style={sBtn(C.soft, '#dc2626')} onClick={() => hapus(r)}>Hapus</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
          <input style={{ ...sInput, flex: '2 1 150px', width: 'auto' }} value={baru.nama} placeholder="Nama ekspedisi baru" onChange={(e) => setBaru({ ...baru, nama: e.target.value })} />
          <input style={{ ...sInput, flex: '2 1 140px', width: 'auto' }} value={baru.wa} placeholder="No. WA" onChange={(e) => setBaru({ ...baru, wa: e.target.value })} />
          <button type="button" style={sBtn('#2563eb')} onClick={tambah}>Tambah</button>
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>Perubahan nama/WA tersimpan otomatis saat kolom ditinggalkan.</div>
      </div>
    </div>
  );
};

const Toast = ({ text }) => (
  <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', background: '#111827', color: '#fff', padding: '8px 16px', borderRadius: 999, fontSize: 13, zIndex: 2000 }}>{text}</div>
);

export default Pengiriman;
