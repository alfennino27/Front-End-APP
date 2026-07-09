import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useTheme } from '../../ThemeContext';

// Dropdown dengan search bar (dipakai untuk pilih customer & template).
const SearchableSelect = ({ options, value, onChange, placeholder, ui }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);
  const current = options.find((o) => o.value === value);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const filtered = options.filter((o) => (o.label || '').toLowerCase().includes(q.toLowerCase()));
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen((v) => !v)} style={{ ...ui.input, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: current ? ui.text : ui.sub }}>{current ? current.label : (placeholder || 'Pilih…')}</span>
        <span style={{ color: ui.sub }}>▾</span>
      </div>
      {open && (
        <div style={{ position: 'absolute', zIndex: 60, top: '100%', left: 0, right: 0, background: ui.card, border: `1px solid ${ui.border}`, borderRadius: 8, maxHeight: 300, overflowY: 'auto', marginTop: 4, boxShadow: '0 6px 20px rgba(0,0,0,.25)' }}>
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari…" style={{ ...ui.input, borderRadius: 0, border: 'none', borderBottom: `1px solid ${ui.border}`, position: 'sticky', top: 0 }} />
          {filtered.map((o, i) => (
            <div key={`${o.value}-${i}`} onClick={() => { onChange(o.value); setOpen(false); setQ(''); }}
              style={{ padding: '10px 12px', cursor: 'pointer', color: ui.text, background: o.value === value ? (ui.dark ? '#2b3038' : '#eef1f6') : 'transparent' }}>
              {o.label}
            </div>
          ))}
          {filtered.length === 0 && <div style={{ padding: '10px 12px', color: ui.sub }}>Tidak ada hasil</div>}
        </div>
      )}
    </div>
  );
};

// Kategori costing = kategori estimasi sistem (mirror backend). Saat quote jadi
// invoice, costing → estimasi<Category> (biaya sementara / budget).
const CATEGORIES = ['Stainless', 'Besi', 'Kayu', 'Jok', 'Rotan', 'Finishing', 'Marmer', 'Fiber', 'Veneer'];

const ONGKIR_OPTIONS = [
  { value: 'none', label: 'Tanpa catatan ongkir' },
  { value: 'gratis_jawa_bali', label: '*gratis ongkir Jawa & Bali' },
  { value: 'belum_termasuk', label: '*belum termasuk ongkir' },
];

const rupiah = (n) => 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID');
const numParse = (v) => Number(String(v ?? '').replace(/[^\d-]/g, '')) || 0;
// Format input angka jadi ada titik pemisah ribuan saat diketik (mis. "1.100.000"),
// supaya harga/DP/costing tidak rawan typo. Simpan sebagai string berformat di
// state; numParse() di atas sudah strip titik saat baca nilai aslinya.
const formatRibuan = (v) => {
  const digits = String(v ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const emptyItem = () => ({
  pid: null,        // link ke Projects.id bila quote sudah jadi Invoice
  images: [],       // { url } (existing) atau { file, preview } (baru)
  details: '',
  harga: '',
  qty: 1,
  costing: CATEGORIES.reduce((a, c) => ({ ...a, [c]: '' }), {}),
  costingOpen: false,
});

// Modal kelola template (deskripsi item ATAU payment terms) — tambah/edit/hapus.
const TemplateManager = ({ type, baseUrl, ui, templates, onClose, onChanged }) => {
  const isDesc = type === 'desc';
  const base = `${baseUrl}/quotation/${isDesc ? 'desctemplate' : 'terms'}`;
  const blank = isDesc ? { nama: '', isi: '' } : { nama: '', isiTerms: '', bankInfo: '' };
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!draft || !(draft.nama || '').trim()) { alert('Nama template wajib diisi'); return; }
    setBusy(true);
    try {
      const url = draft.id ? `${base}/update/${draft.id}` : `${base}/create`;
      await fetch(url, { method: draft.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
      setDraft(null); await onChanged();
    } catch (e) { alert('Gagal simpan template: ' + e.message); }
    setBusy(false);
  };
  const del = async (id) => {
    if (!window.confirm('Hapus template ini?')) return;
    try { await fetch(`${base}/delete/${id}`, { method: 'DELETE' }); await onChanged(); } catch (e) { alert('Gagal hapus: ' + e.message); }
  };

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 16, overflowY: 'auto' };
  const box = { background: ui.card, border: `1px solid ${ui.border}`, borderRadius: 12, padding: 18, width: '100%', maxWidth: 560, marginTop: 40 };
  const btn = { background: '#234dba', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', cursor: 'pointer', fontWeight: 600 };
  const ghost = { background: 'transparent', color: ui.text, border: `1px solid ${ui.border}`, borderRadius: 8, padding: '7px 12px', cursor: 'pointer' };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={box} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h5 style={{ color: ui.text, margin: 0 }}>Kelola Template {isDesc ? 'Deskripsi' : 'Payment Terms'}</h5>
          <button style={ghost} onClick={onClose}>Tutup</button>
        </div>

        {!draft && (
          <>
            <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
              {(templates || []).map((t) => (
                <div key={t.id} style={{ border: `1px solid ${ui.border}`, borderRadius: 8, padding: 10, display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: ui.text }}>{t.nama}</div>
                    <div style={{ color: ui.sub, fontSize: 12, whiteSpace: 'pre-line', maxHeight: 40, overflow: 'hidden' }}>{isDesc ? t.isi : t.isiTerms}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button style={ghost} onClick={() => setDraft({ ...t })}>Edit</button>
                    <button style={{ ...ghost, color: '#c0392b' }} onClick={() => del(t.id)}>Hapus</button>
                  </div>
                </div>
              ))}
              {(templates || []).length === 0 && <div style={{ color: ui.sub }}>Belum ada template.</div>}
            </div>
            <button style={btn} onClick={() => setDraft({ ...blank })}>+ Template Baru</button>
          </>
        )}

        {draft && (
          <div style={{ display: 'grid', gap: 10 }}>
            <label style={{ display: 'grid', gap: 4, color: ui.sub, fontSize: 13 }}>Nama template
              <input style={ui.input} value={draft.nama} onChange={(e) => setDraft({ ...draft, nama: e.target.value })} /></label>
            {isDesc ? (
              <label style={{ display: 'grid', gap: 4, color: ui.sub, fontSize: 13 }}>Isi deskripsi
                <textarea style={{ ...ui.input, minHeight: 140, fontFamily: 'inherit' }} value={draft.isi} onChange={(e) => setDraft({ ...draft, isi: e.target.value })} /></label>
            ) : (
              <>
                <label style={{ display: 'grid', gap: 4, color: ui.sub, fontSize: 13 }}>Isi terms
                  <textarea style={{ ...ui.input, minHeight: 110, fontFamily: 'inherit' }} value={draft.isiTerms} onChange={(e) => setDraft({ ...draft, isiTerms: e.target.value })} /></label>
                <label style={{ display: 'grid', gap: 4, color: ui.sub, fontSize: 13 }}>Info rekening / bank
                  <textarea style={{ ...ui.input, minHeight: 60, fontFamily: 'inherit' }} value={draft.bankInfo} onChange={(e) => setDraft({ ...draft, bankInfo: e.target.value })} /></label>
              </>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={btn} disabled={busy} onClick={save}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
              <button style={ghost} onClick={() => setDraft(null)}>Batal</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Quote = () => {
  const baseUrl = getApiBaseUrl();
  const { globalTheme } = useTheme();
  const dark = globalTheme === 'dark';
  const navigate = useNavigate();
  const { id: routeId } = useParams();

  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;

  const [view, setView] = useState('folders'); // folders | customerDetail | allQuotes | form
  const [loading, setLoading] = useState(false);
  const [folders, setFolders] = useState([]);
  const [allQuotes, setAllQuotes] = useState([]);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [terms, setTerms] = useState([]);
  const [descTpls, setDescTpls] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [custList, setCustList] = useState([]);
  const [search, setSearch] = useState('');
  const [tplMgr, setTplMgr] = useState(null); // null | 'desc' | 'terms'
  const [dragIdx, setDragIdx] = useState(null); // item index yang sedang di-drag-over
  const [renamingFolder, setRenamingFolder] = useState(false);
  const [folderDraft, setFolderDraft] = useState({ namaCust: '', waCust: '', alamatCust: '' });
  const [renamingBusy, setRenamingBusy] = useState(false);

  // ---- form state ----
  const blankForm = () => ({
    id: null,
    kodeInvoice: '',
    docLabel: 'QUOTATION',
    kodeCust: '',
    customer: '',
    customerAddress: '',
    customerEmail: '',
    customerWA: '',
    tanggal: new Date().toISOString().slice(0, 10),
    deadline: '',
    discount: '',
    grandTotal: '',
    hideTotals: false,
    termsTemplateId: '',
    ongkirNote: 'gratis_jawa_bali',
    campaignId: 'organic',
    isRepeatOrder: false,
    repeatRefCampaignId: '',
    paymentRows: [{ label: 'DP 1', amount: '', paid: false }],
    items: [emptyItem()],
    status: 'quote',
    invoiceId: null,
    isDraft: true,
    rev: 1,
  });
  const [form, setForm] = useState(blankForm());
  const [saving, setSaving] = useState(false);

  // ================= data fetching =================
  const fetchFolders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/quotation/customers/summary`);
      setFolders(await res.json());
    } catch (e) { console.error('fetch folders', e); }
    setLoading(false);
  }, [baseUrl]);

  const fetchAllQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/quotation/get`);
      setAllQuotes(await res.json());
    } catch (e) { console.error('fetch all quotes', e); }
    setLoading(false);
  }, [baseUrl]);

  const refreshTemplates = useCallback(async () => {
    try { setTerms(await (await fetch(`${baseUrl}/quotation/terms/get`)).json()); } catch (e) { /* ignore */ }
    try { setDescTpls(await (await fetch(`${baseUrl}/quotation/desctemplate/get`)).json()); } catch (e) { /* ignore */ }
  }, [baseUrl]);

  const fetchCustomerDetail = useCallback(async (kodeCust) => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/quotation/customer/${encodeURIComponent(kodeCust)}`);
      setCustomerDetail(await res.json());
      setRenamingFolder(false);
      setView('customerDetail');
    } catch (e) { console.error('fetch customer detail', e); }
    setLoading(false);
  }, [baseUrl]);

  const saveFolderRename = async () => {
    const kodeCust = customerDetail?.customer?.kodeCust;
    if (!kodeCust || !folderDraft.namaCust.trim()) return;
    setRenamingBusy(true);
    try {
      const res = await fetch(`${baseUrl}/quotation/customer/${encodeURIComponent(kodeCust)}/rename`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ namaCust: folderDraft.namaCust.trim(), waCust: folderDraft.waCust.trim(), alamatCust: folderDraft.alamatCust.trim() }),
      });
      const r = await res.json();
      if (!res.ok) throw new Error(r.message);
      setCustomerDetail((cd) => ({ ...cd, customer: { ...cd.customer, namaCust: r.namaCust, waCust: r.waCust, alamatCust: r.alamatCust } }));
      setRenamingFolder(false);
      fetchFolders();
      try { setCustList(await (await fetch(`${baseUrl}/accounting/cust/get`)).json()); } catch (e) { /* ignore */ }
    } catch (e) { alert('Gagal ubah data folder: ' + e.message); }
    setRenamingBusy(false);
  };

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchFolders();
    refreshTemplates();
    (async () => {
      try { setCampaigns(await (await fetch(`${baseUrl}/crm/campaigns/get`)).json()); } catch (e) { /* ignore */ }
      try { setCustList(await (await fetch(`${baseUrl}/accounting/cust/get`)).json()); } catch (e) { /* ignore */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // buka langsung form edit bila /quote/:id
  useEffect(() => {
    if (routeId) { openEdit(routeId); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]);

  // ================= derived =================
  const subtotal = useMemo(
    () => form.items.reduce((a, it) => a + numParse(it.harga) * numParse(it.qty), 0),
    [form.items],
  );
  // Grand Total OTOMATIS = subtotal − discount − Σ DP (sisa yang harus dibayar)
  const totalDP = useMemo(
    () => form.paymentRows.reduce((a, p) => a + numParse(p.amount), 0),
    [form.paymentRows],
  );
  const grandTotalCalc = subtotal - numParse(form.discount) - totalDP;

  // ================= form actions =================
  const setF = (patch) => setForm((f) => ({ ...f, ...patch }));

  const openCreate = (prefillCust) => {
    const f = blankForm();
    if (terms[0]) f.termsTemplateId = terms[0].id;
    if (prefillCust) {
      f.kodeCust = prefillCust.kodeCust || '';
      f.customer = prefillCust.namaCust || '';
      f.customerAddress = prefillCust.alamatCust || '';
      f.customerEmail = prefillCust.emailCust || '';
      f.customerWA = prefillCust.waCust || prefillCust.noTelpCust || '';
    }
    setForm(f);
    setView('form');
  };

  const openEdit = async (qid) => {
    setLoading(true);
    try {
      const q = await (await fetch(`${baseUrl}/quotation/${qid}`)).json();
      if (q && q.id) {
        setForm({
          ...blankForm(),
          ...q,
          discount: formatRibuan(q.discount),
          grandTotal: formatRibuan(q.grandTotal),
          paymentRows: (q.paymentRows && q.paymentRows.length) ? q.paymentRows.map((p) => ({ label: p.label, amount: formatRibuan(p.amount), paid: !!p.paid })) : [{ label: 'DP 1', amount: '', paid: false }],
          items: (q.items && q.items.length ? q.items : [emptyItem()]).map((it) => ({
            pid: it.pid || null,
            images: (it.images || []).map((u) => ({ url: u })),
            details: it.details || '',
            harga: formatRibuan(it.harga),
            qty: it.qty || 1,
            costing: CATEGORIES.reduce((a, c) => ({ ...a, [c]: formatRibuan(it.costing && it.costing[c]) }), {}),
            costingOpen: false,
          })),
          campaignId: q.campaignId || 'organic',
          termsTemplateId: q.termsTemplateId || (terms[0] ? terms[0].id : ''),
        });
        setView('form');
      }
    } catch (e) { console.error('open edit', e); }
    setLoading(false);
  };

  // item helpers
  const updateItem = (idx, patch) => setForm((f) => ({
    ...f, items: f.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
  }));
  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }));
  const removeItem = (idx) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const addFilesToItem = (idx, files) => {
    const arr = Array.from(files || []).filter((f) => f && f.type && f.type.startsWith('image/'));
    if (!arr.length) return;
    const added = arr.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    updateItem(idx, { images: [...form.items[idx].images, ...added] });
  };
  const addItemImages = (idx, fileList) => addFilesToItem(idx, fileList);
  // paste dari tombol (Clipboard API)
  const pasteImageFromClipboard = async (idx) => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) { alert('Browser tidak mendukung paste gambar. Pakai tombol File.'); return; }
      const items = await navigator.clipboard.read();
      for (const it of items) {
        const type = it.types.find((t) => t.startsWith('image/'));
        if (type) { const blob = await it.getType(type); addFilesToItem(idx, [new File([blob], `paste-${Date.now()}.png`, { type })]); return; }
      }
      alert('Tidak ada gambar di clipboard.');
    } catch (e) { alert('Gagal paste gambar: ' + e.message); }
  };
  // drop file (drag & drop, termasuk dari Photos / Finder di Mac)
  const handleDropFiles = (idx, e) => {
    const dt = e.dataTransfer;
    let files = [];
    if (dt.items && dt.items.length) {
      for (const item of dt.items) { if (item.kind === 'file') { const f = item.getAsFile(); if (f) files.push(f); } }
    }
    if (!files.length && dt.files && dt.files.length) files = Array.from(dt.files);
    addFilesToItem(idx, files);
  };
  // paste langsung (Ctrl/Cmd+V) di dalam card item
  const onCardPaste = (idx, e) => {
    const files = Array.from(e.clipboardData?.items || [])
      .filter((i) => i.type && i.type.startsWith('image/'))
      .map((i) => i.getAsFile()).filter(Boolean);
    if (files.length) { e.preventDefault(); addFilesToItem(idx, files); }
  };
  // terapkan template deskripsi
  const applyDescTemplate = (idx, tplId) => {
    const t = descTpls.find((x) => x.id === tplId);
    if (!t) return;
    const cur = form.items[idx].details;
    updateItem(idx, { details: cur && cur.trim() ? cur + '\n' + t.isi : t.isi });
  };
  const removeItemImage = (idx, imgIdx) => updateItem(idx, {
    images: form.items[idx].images.filter((_, i) => i !== imgIdx),
  });
  // pindahkan gambar ke urutan pertama = jadi foto utama (paling besar di PDF)
  const makeImageMain = (idx, imgIdx) => {
    const imgs = [...form.items[idx].images];
    const [chosen] = imgs.splice(imgIdx, 1);
    updateItem(idx, { images: [chosen, ...imgs] });
  };

  // payment rows
  const updatePayRow = (idx, patch) => setForm((f) => ({
    ...f, paymentRows: f.paymentRows.map((p, i) => (i === idx ? { ...p, ...patch } : p)),
  }));
  const addPayRow = () => setForm((f) => ({ ...f, paymentRows: [...f.paymentRows, { label: `DP ${f.paymentRows.length + 1}`, amount: '', paid: false }] }));
  const removePayRow = (idx) => setForm((f) => ({ ...f, paymentRows: f.paymentRows.filter((_, i) => i !== idx) }));

  // pilih customer existing dari dropdown
  const pickCustomer = (kodeCust) => {
    const c = custList.find((x) => x.kodeCust === kodeCust);
    if (c) setF({ kodeCust: c.kodeCust, customer: c.namaCust || '', customerAddress: c.alamatCust || '', customerEmail: c.emailCust || '', customerWA: c.waCust || c.noTelpCust || '' });
    else setF({ kodeCust });
  };

  const buildFormData = () => {
    const fd = new FormData();
    const itemsPayload = form.items.map((it, idx) => {
      const existingUrls = it.images.filter((im) => im.url).map((im) => im.url);
      it.images.filter((im) => im.file).forEach((im) => fd.append(`item_${idx}_image`, im.file));
      const costing = {};
      CATEGORIES.forEach((c) => { costing[c] = numParse(it.costing[c]); });
      return { pid: it.pid || null, images: existingUrls, details: it.details, harga: numParse(it.harga), qty: numParse(it.qty), costing };
    });
    fd.append('items', JSON.stringify(itemsPayload));
    fd.append('paymentRows', JSON.stringify(form.paymentRows.filter((p) => p.label || p.amount).map((p) => ({ label: p.label, amount: numParse(p.amount), paid: !!p.paid }))));
    fd.append('kodeInvoice', form.kodeInvoice);
    fd.append('docLabel', form.docLabel);
    fd.append('kodeCust', form.kodeCust);
    fd.append('customer', form.customer);
    fd.append('customerAddress', form.customerAddress);
    fd.append('customerEmail', form.customerEmail);
    fd.append('customerWA', form.customerWA);
    fd.append('tanggal', form.tanggal);
    fd.append('deadline', form.deadline);
    fd.append('discount', numParse(form.discount));
    // grandTotal dihitung otomatis di backend (subtotal − discount − DP)
    fd.append('hideTotals', form.hideTotals);
    fd.append('termsTemplateId', form.termsTemplateId || '');
    fd.append('ongkirNote', form.ongkirNote);
    fd.append('campaignId', form.campaignId);
    fd.append('isRepeatOrder', form.isRepeatOrder);
    fd.append('repeatRefCampaignId', form.repeatRefCampaignId || '');
    return fd;
  };

  const saveQuote = async ({ thenPdf } = {}) => {
    setSaving(true);
    try {
      const fd = buildFormData();
      const url = form.id ? `${baseUrl}/quotation/update/${form.id}` : `${baseUrl}/quotation/create`;
      const method = form.id ? 'PUT' : 'POST';
      const res = await fetch(url, { method, body: fd });
      const saved = await res.json();
      if (!res.ok) throw new Error(saved.message || 'Gagal simpan');
      setSaving(false);
      // refresh lists
      fetchFolders();
      try { setCustList(await (await fetch(`${baseUrl}/accounting/cust/get`)).json()); } catch (e) { /* ignore */ }
      if (thenPdf && saved.id) {
        window.open(`${baseUrl}/quotation/${saved.id}/pdf`, '_blank');
      }
      // stay on form in edit mode
      setForm((f) => ({ ...f, id: saved.id, invoiceId: saved.invoiceId ?? f.invoiceId }));
      return saved;
    } catch (e) {
      console.error('save quote', e);
      alert('Gagal menyimpan quote: ' + e.message);
      setSaving(false);
      return null;
    }
  };

  const changeStatus = async (qid, status) => {
    if (status === 'deal' && !window.confirm('Ubah jadi DEAL akan membuat Invoice resmi (masuk produksi & jurnal). Lanjutkan?')) return;
    try {
      const res = await fetch(`${baseUrl}/quotation/${qid}/status`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
      });
      const r = await res.json();
      if (!res.ok) throw new Error(r.message);
      if (customerDetail) fetchCustomerDetail(customerDetail.customer.kodeCust);
      fetchFolders();
      if (view === 'allQuotes') fetchAllQuotes();
    } catch (e) { alert('Gagal ubah status: ' + e.message); }
  };

  const finalizeQuote = async (qid, isDraft) => {
    // isDraft=false → finalkan; isDraft=true → kembalikan ke draft
    if (!isDraft && !window.confirm('Finalkan quote ini? Setelah final, tiap kali diedit nomor revisi (rev) akan naik +1.')) return;
    try {
      const res = await fetch(`${baseUrl}/quotation/${qid}/finalize`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isDraft }),
      });
      const r = await res.json();
      if (!res.ok) throw new Error(r.message);
      if (form.id === qid) setForm((f) => ({ ...f, isDraft }));
      if (customerDetail) fetchCustomerDetail(customerDetail.customer.kodeCust);
      fetchFolders();
      if (view === 'allQuotes') fetchAllQuotes();
    } catch (e) { alert('Gagal ubah status draft: ' + e.message); }
  };

  const deleteQuote = async (q) => {
    const warn = q.invoiceId ? 'Quote ini sudah jadi Invoice. Menghapus quote TIDAK menghapus Invoice. Lanjutkan?' : 'Hapus quote ini?';
    if (!window.confirm(warn)) return;
    try {
      await fetch(`${baseUrl}/quotation/delete/${q.id}`, { method: 'DELETE' });
      if (customerDetail) fetchCustomerDetail(customerDetail.customer.kodeCust);
      fetchFolders();
      if (view === 'allQuotes') fetchAllQuotes();
    } catch (e) { alert('Gagal hapus: ' + e.message); }
  };

  // ================= styles =================
  const bg = dark ? '#1a1d21' : '#f5f6f8';
  const card = dark ? '#24282e' : '#ffffff';
  const border = dark ? '#3a3f47' : '#e2e5ea';
  const text = dark ? '#e9e9e9' : '#1c1c1c';
  const sub = dark ? '#9aa0a8' : '#6b7280';
  const primary = '#234dba';

  const statusBadge = (s) => {
    const map = { quote: { bg: '#6b7280', t: 'Quote' }, deal: { bg: '#1e7b34', t: 'Deal' }, lost: { bg: '#c0392b', t: 'Lost' } };
    const m = map[s] || map.quote;
    return <span style={{ background: m.bg, color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{m.t}</span>;
  };

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${border}`, background: dark ? '#2b3038' : '#fff', color: text, fontSize: 15, boxSizing: 'border-box' };
  const ui = { input: inputStyle, card, border, text, sub, dark };
  const btn = (color) => ({ background: color, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 14 });
  const btnGhost = { background: 'transparent', color: text, border: `1px solid ${border}`, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 14 };

  // ================= renders =================
  const renderTabs = () => (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
      <button style={view === 'folders' || view === 'customerDetail' ? btn(primary) : btnGhost}
        onClick={() => { setView('folders'); fetchFolders(); }}>📁 Customer</button>
      <button style={view === 'allQuotes' ? btn(primary) : btnGhost}
        onClick={() => { setView('allQuotes'); fetchAllQuotes(); }}>🧾 Semua Quote</button>
      <div style={{ flex: 1 }} />
      <button style={btn('#1e7b34')} onClick={() => openCreate(null)}>+ Quote Baru</button>
    </div>
  );

  const renderFolders = () => {
    const q = search.trim().toLowerCase();
    // dedupe by kodeCust (data lama bisa ada duplikat) + key unik → cegah bug render
    const seen = new Set();
    const uniqueFolders = folders.filter((c) => {
      const k = c.kodeCust || `__${c.namaCust}`;
      if (seen.has(k)) return false; seen.add(k); return true;
    });
    const filtered = q ? uniqueFolders.filter((c) => (c.namaCust || '').toLowerCase().includes(q)) : uniqueFolders;
    return (
      <div>
        <input placeholder="Cari customer…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, marginBottom: 14 }} />
        {loading && <p style={{ color: sub }}>Memuat…</p>}
        <div className="klf-quote-grid">
          {filtered.map((c, idx) => (
            <div key={`${c.kodeCust || 'x'}-${idx}`} className="klf-quote-folder" style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 16, cursor: 'pointer' }}
              onClick={() => fetchCustomerDetail(c.kodeCust)}>
              <div style={{ fontSize: 30, marginBottom: 6 }}>📁</div>
              <div style={{ fontWeight: 700, color: text, fontSize: 16, marginBottom: 2 }}>{c.namaCust || '(tanpa nama)'}</div>
              <div style={{ color: sub, fontSize: 13 }}>{c.waCust || c.noTelpCust || ''}</div>
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 13, color: sub }}>
                <span>{c.quoteCount} quote</span>
                <span style={{ fontWeight: 600, color: text }}>{rupiah(c.totalNilai)}</span>
              </div>
            </div>
          ))}
          {!loading && filtered.length === 0 && <p style={{ color: sub }}>Belum ada customer. Buat quote baru untuk menambah folder.</p>}
        </div>
      </div>
    );
  };

  const renderCustomerDetail = () => {
    if (!customerDetail) return null;
    const c = customerDetail.customer || {};
    return (
      <div>
        <button style={{ ...btnGhost, marginBottom: 14 }} onClick={() => { setView('folders'); fetchFolders(); }}>← Kembali</button>
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              {renamingFolder ? (
                <div style={{ display: 'grid', gap: 8, marginBottom: 6, maxWidth: 420 }}>
                  <label className="klf-fld"><span style={{ color: sub, fontSize: 12 }}>Nama folder</span>
                    <input autoFocus style={inputStyle} value={folderDraft.namaCust}
                      onChange={(e) => setFolderDraft((f) => ({ ...f, namaCust: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Escape') setRenamingFolder(false); }} /></label>
                  <label className="klf-fld"><span style={{ color: sub, fontSize: 12 }}>Nomor telepon / WA</span>
                    <input style={inputStyle} value={folderDraft.waCust}
                      onChange={(e) => setFolderDraft((f) => ({ ...f, waCust: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Escape') setRenamingFolder(false); }} /></label>
                  <label className="klf-fld"><span style={{ color: sub, fontSize: 12 }}>Alamat</span>
                    <input style={inputStyle} value={folderDraft.alamatCust}
                      onChange={(e) => setFolderDraft((f) => ({ ...f, alamatCust: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveFolderRename(); if (e.key === 'Escape') setRenamingFolder(false); }} /></label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={btn('#1e7b34')} disabled={renamingBusy} onClick={saveFolderRename}>{renamingBusy ? 'Menyimpan…' : 'Simpan'}</button>
                    <button style={btnGhost} onClick={() => setRenamingFolder(false)}>Batal</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: text }}>📁 {c.namaCust || '(tanpa nama)'}</div>
                    <button title="Edit folder (nama, telepon, alamat)" style={{ ...btnGhost, padding: '4px 9px', fontSize: 13 }}
                      onClick={() => { setFolderDraft({ namaCust: c.namaCust || '', waCust: c.waCust || c.noTelpCust || '', alamatCust: c.alamatCust || '' }); setRenamingFolder(true); }}>✏️</button>
                  </div>
                  <div style={{ color: sub, fontSize: 14 }}>{c.waCust || c.noTelpCust || ''} {c.emailCust ? '· ' + c.emailCust : ''}</div>
                  {c.alamatCust && <div style={{ color: sub, fontSize: 13 }}>{c.alamatCust}</div>}
                </>
              )}
            </div>
            <button style={btn('#1e7b34')} onClick={() => openCreate(c)}>+ Quote Baru</button>
          </div>
        </div>

        <h6 style={{ color: text, marginBottom: 8 }}>Quote / Invoice</h6>
        <div style={{ display: 'grid', gap: 10 }}>
          {(customerDetail.quotes || []).map((q) => (
            <div key={q.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700, color: text }}>{q.kodeInvoice || '(tanpa kode)'} <span style={{ color: sub, fontWeight: 400, fontSize: 13 }}>rev {q.rev}</span></div>
                  <div style={{ color: sub, fontSize: 13 }}>{q.tanggal} · {rupiah(q.nilai)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {q.isDraft !== false && <span style={{ background: '#b7791f', color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>DRAFT</span>}
                  {statusBadge(q.status)}
                  {q.invoiceId && <span style={{ fontSize: 12, color: '#1e7b34' }}>✔ Invoice</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                <a href={`${baseUrl}/quotation/${q.id}/pdf`} target="_blank" rel="noreferrer" style={{ ...btnGhost, textDecoration: 'none' }}>⬇ PDF</a>
                <a href={`${baseUrl}/quotation/${q.id}/pdf?mode=pricelist`} target="_blank" rel="noreferrer" style={{ ...btnGhost, textDecoration: 'none' }}>Pricelist</a>
                <button style={btnGhost} onClick={() => openEdit(q.id)}>Edit</button>
                {q.isDraft !== false && <button style={btn('#b7791f')} onClick={() => finalizeQuote(q.id, false)}>✓ Finalkan</button>}
                {q.status !== 'deal' && <button style={btn('#1e7b34')} onClick={() => changeStatus(q.id, 'deal')}>Deal</button>}
                {/* setelah jadi Invoice (Deal), Lost & Hapus dikunci — batalkan invoice di modul Invoice dulu */}
                {!q.invoiceId && q.status !== 'lost' && <button style={btnGhost} onClick={() => changeStatus(q.id, 'lost')}>Lost</button>}
                {!q.invoiceId && <button style={{ ...btnGhost, color: '#c0392b' }} onClick={() => deleteQuote(q)}>Hapus</button>}
              </div>
              {q.invoiceId && <div style={{ color: sub, fontSize: 12, marginTop: 8 }}>🔒 Sudah jadi Invoice. Edit harga/qty/item di sini otomatis sinkron ke Invoice. Untuk membatalkan, hapus invoice-nya di modul Invoice (quote akan kembali bisa diubah).</div>}
            </div>
          ))}
          {(customerDetail.quotes || []).length === 0 && <p style={{ color: sub }}>Belum ada quote untuk customer ini.</p>}
        </div>
      </div>
    );
  };

  const renderAllQuotes = () => {
    const filtered = allQuotes.filter((q) =>
      (q.kodeInvoice || '').toLowerCase().includes(search.toLowerCase()) ||
      (q.customer || '').toLowerCase().includes(search.toLowerCase()));
    return (
      <div>
        <input placeholder="Cari kode / customer…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, marginBottom: 14 }} />
        <div style={{ overflowX: 'auto', background: card, border: `1px solid ${border}`, borderRadius: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640, color: text }}>
            <thead>
              <tr style={{ background: dark ? '#2b3038' : '#f0f2f5' }}>
                {['No', 'Kode', 'Customer', 'Nilai', 'Rev', 'Status', 'Aksi'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 13, color: sub }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((q, i) => {
                const nilai = (q.items || []).reduce((a, it) => a + (Number(it.harga) || 0) * (Number(it.qty) || 0), 0) - (Number(q.discount) || 0);
                return (
                  <tr key={q.id} style={{ borderTop: `1px solid ${border}` }}>
                    <td style={{ padding: '10px 12px' }}>{i + 1}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{q.kodeInvoice}</td>
                    <td style={{ padding: '10px 12px' }}>{q.customer}</td>
                    <td style={{ padding: '10px 12px' }}>{rupiah(nilai)}</td>
                    <td style={{ padding: '10px 12px' }}>{q.rev}</td>
                    <td style={{ padding: '10px 12px' }}>{statusBadge(q.status)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <a href={`${baseUrl}/quotation/${q.id}/pdf`} target="_blank" rel="noreferrer" style={{ ...btnGhost, padding: '5px 10px', textDecoration: 'none' }}>PDF</a>
                        <button style={{ ...btnGhost, padding: '5px 10px' }} onClick={() => openEdit(q.id)}>Edit</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={7} style={{ padding: 16, color: sub }}>Tidak ada quote.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderForm = () => (
    <div>
      <button style={{ ...btnGhost, marginBottom: 14 }} onClick={() => { setView('folders'); fetchFolders(); }}>← Kembali</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
        <h5 style={{ color: text, margin: 0 }}>{form.id ? 'Edit' : 'Buat'} {form.docLabel === 'INVOICE' ? 'Invoice' : 'Quote'} {form.id ? `· rev ${form.rev || 1}` : ''}</h5>
        {form.id && (form.isDraft
          ? <span style={{ background: '#b7791f', color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>DRAFT</span>
          : <span style={{ background: '#1e7b34', color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>FINAL</span>)}
        {form.id && (form.isDraft
          ? <button style={{ ...btnGhost, padding: '4px 12px' }} onClick={() => finalizeQuote(form.id, false)}>✓ Finalkan</button>
          : <button style={{ ...btnGhost, padding: '4px 12px' }} onClick={() => finalizeQuote(form.id, true)}>↩ Kembalikan ke draft</button>)}
      </div>
      {form.id && (
        <div style={{ color: sub, fontSize: 12, marginBottom: 10 }}>
          {form.isDraft
            ? 'Mode DRAFT — menyimpan perubahan tidak menaikkan nomor revisi. Klik Finalkan saat siap kirim ke customer.'
            : 'Mode FINAL — tiap simpan perubahan menaikkan rev +1 (revisi resmi).'}
        </div>
      )}

      {/* HEADER */}
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div className="klf-quote-form-grid">
          <label className="klf-fld"><span style={{ color: sub }}>Kode</span>
            <input style={inputStyle} value={form.kodeInvoice} onChange={(e) => setF({ kodeInvoice: e.target.value })} placeholder="mis. Mila/26/VI/01" /></label>
          <label className="klf-fld"><span style={{ color: sub }}>Tipe dokumen</span>
            <select style={inputStyle} value={form.docLabel} onChange={(e) => setF({ docLabel: e.target.value })}>
              <option value="QUOTATION">Quotation</option><option value="INVOICE">Invoice</option></select></label>
          <label className="klf-fld"><span style={{ color: sub }}>Customer (pilih / cari)</span>
            <SearchableSelect ui={ui} value={form.kodeCust} onChange={pickCustomer} placeholder="— baru / ketik manual —"
              options={[{ value: '', label: '— baru / ketik manual —' }, ...custList.map((c, i) => ({ value: c.kodeCust || `__${i}`, label: c.namaCust || '(tanpa nama)' }))]} /></label>
          <label className="klf-fld"><span style={{ color: sub }}>Nama customer</span>
            <input style={inputStyle} value={form.customer} onChange={(e) => setF({ customer: e.target.value })} /></label>
          <label className="klf-fld"><span style={{ color: sub }}>WA / HP</span>
            <input style={inputStyle} value={form.customerWA} onChange={(e) => setF({ customerWA: e.target.value })} /></label>
          <label className="klf-fld"><span style={{ color: sub }}>Email</span>
            <input style={inputStyle} value={form.customerEmail} onChange={(e) => setF({ customerEmail: e.target.value })} /></label>
          <label className="klf-fld klf-fld-full"><span style={{ color: sub }}>Alamat</span>
            <input style={inputStyle} value={form.customerAddress} onChange={(e) => setF({ customerAddress: e.target.value })} /></label>
          <label className="klf-fld"><span style={{ color: sub }}>Tanggal</span>
            <input type="date" style={inputStyle} value={form.tanggal} onChange={(e) => setF({ tanggal: e.target.value })} /></label>
          <label className="klf-fld"><span style={{ color: sub }}>Deadline</span>
            <input style={inputStyle} value={form.deadline} onChange={(e) => setF({ deadline: e.target.value })} placeholder="mis. 3-4 weeks after payment" /></label>
        </div>
      </div>

      {/* ITEMS */}
      <h6 style={{ color: text }}>Item</h6>
      <div style={{ display: 'grid', gap: 12, marginBottom: 12 }}>
        {form.items.map((it, idx) => (
          <div key={idx} style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 14 }} onPaste={(e) => onCardPaste(idx, e)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ color: text }}>Item #{idx + 1}</strong>
              {form.items.length > 1 && <button style={{ ...btnGhost, color: '#c0392b', padding: '4px 10px' }} onClick={() => removeItem(idx)}>Hapus</button>}
            </div>

            {/* gambar: thumbnail + zona drag & drop. Foto pertama (badge ⭐) = foto utama di PDF */}
            {it.images.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {it.images.map((im, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={im.url ? `${baseUrl}${im.url}` : im.preview} alt="" style={{ width: 74, height: 74, objectFit: 'cover', borderRadius: 8, border: i === 0 ? `2px solid ${primary}` : `1px solid ${border}` }} />
                    {i === 0 && <span title="Foto utama" style={{ position: 'absolute', bottom: 2, left: 2, background: primary, color: '#fff', fontSize: 10, padding: '1px 5px', borderRadius: 6 }}>⭐ Utama</span>}
                    {i !== 0 && <button title="Jadikan foto utama" onClick={() => makeImageMain(idx, i)} style={{ position: 'absolute', bottom: 2, left: 2, background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 10, padding: '1px 5px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>⭐ Utama</button>}
                    <button onClick={() => removeItemImage(idx, i)} style={{ position: 'absolute', top: -6, right: -6, background: '#c0392b', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', lineHeight: '18px' }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', marginBottom: 10 }}>
              <label
                onDragOver={(e) => { e.preventDefault(); setDragIdx(idx); }}
                onDragLeave={() => setDragIdx(null)}
                onDrop={(e) => { e.preventDefault(); setDragIdx(null); handleDropFiles(idx, e); }}
                style={{
                  flex: 1, border: `2px dashed ${dragIdx === idx ? primary : border}`, borderRadius: 8,
                  padding: '16px', textAlign: 'center', cursor: 'pointer', color: sub,
                  background: dragIdx === idx ? (dark ? '#1c2733' : '#eef4ff') : 'transparent', transition: 'all .15s',
                }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>🖼️</div>
                <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                  Drag &amp; drop gambar di sini
                  <br /><span style={{ fontSize: 11 }}>(dari Photos / Finder), klik untuk pilih file, atau paste (Cmd+V)</span>
                </div>
                <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => { addItemImages(idx, e.target.files); e.target.value = ''; }} />
              </label>
              <button type="button" title="Tempel dari clipboard" onClick={() => pasteImageFromClipboard(idx)}
                style={{ ...btnGhost, width: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📋</button>
            </div>

            {/* template deskripsi */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <SearchableSelect ui={ui} value="" placeholder="↧ Sisipkan template deskripsi…"
                  options={descTpls.map((t, i) => ({ value: t.id || `__${i}`, label: t.nama }))}
                  onChange={(id) => applyDescTemplate(idx, id)} />
              </div>
              <button style={{ ...btnGhost, padding: '8px 10px' }} title="Kelola template deskripsi" onClick={() => setTplMgr('desc')}>⚙</button>
            </div>

            <textarea style={{ ...inputStyle, minHeight: 96, resize: 'vertical', fontFamily: 'inherit' }} placeholder={'Dimensi : ...\nBahan : ...\nFinishing : ...'} value={it.details} onChange={(e) => updateItem(idx, { details: e.target.value })} />

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <label className="klf-fld" style={{ flex: 1 }}><span style={{ color: sub }}>Harga satuan</span>
                <input inputMode="numeric" style={inputStyle} value={it.harga} onChange={(e) => updateItem(idx, { harga: formatRibuan(e.target.value) })} /></label>
              <label className="klf-fld" style={{ width: 90 }}><span style={{ color: sub }}>Qty</span>
                <input inputMode="numeric" style={inputStyle} value={it.qty} onChange={(e) => updateItem(idx, { qty: e.target.value })} /></label>
            </div>
            <div style={{ textAlign: 'right', color: sub, fontSize: 13, marginTop: 6 }}>Total: <strong style={{ color: text }}>{rupiah(numParse(it.harga) * numParse(it.qty))}</strong></div>

            {/* costing accordion */}
            <button style={{ ...btnGhost, width: '100%', marginTop: 8, textAlign: 'left' }} onClick={() => updateItem(idx, { costingOpen: !it.costingOpen })}>
              {it.costingOpen ? '▾' : '▸'} Costing (biaya per kategori) — masuk sebagai budget saat jadi Invoice
            </button>
            {it.costingOpen && (
              <div className="klf-quote-costing" style={{ marginTop: 10 }}>
                {CATEGORIES.map((cat) => (
                  <label key={cat} className="klf-fld"><span style={{ color: sub, fontSize: 12 }}>{cat}</span>
                    <input inputMode="numeric" style={{ ...inputStyle, padding: '8px 10px' }} value={it.costing[cat]} onChange={(e) => updateItem(idx, { costing: { ...it.costing, [cat]: formatRibuan(e.target.value) } })} /></label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <button style={{ ...btnGhost, width: '100%', marginBottom: 16, padding: '12px' }} onClick={addItem}>+ Tambah Item</button>

      {/* TOTALS + OPTIONS */}
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ color: sub }}>Subtotal</span><strong style={{ color: text }}>{rupiah(subtotal)}</strong>
        </div>
        <label className="klf-fld" style={{ marginBottom: 10 }}><span style={{ color: sub }}>Discount</span>
          <input inputMode="numeric" style={inputStyle} value={form.discount} onChange={(e) => setF({ discount: formatRibuan(e.target.value) })} /></label>

        <div style={{ color: sub, fontSize: 13, marginBottom: 6 }}>Baris pembayaran (DP / termin) — bisa banyak</div>
        {form.paymentRows.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input style={{ ...inputStyle, flex: '1 1 120px' }} placeholder="Label (mis. DP 1)" value={p.label} onChange={(e) => updatePayRow(i, { label: e.target.value })} />
            <input inputMode="numeric" style={{ ...inputStyle, flex: '1 1 120px' }} placeholder="Nominal" value={p.amount} onChange={(e) => updatePayRow(i, { amount: formatRibuan(e.target.value) })} />
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', color: p.paid ? '#1e7b34' : sub, fontWeight: p.paid ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 13 }}>
              <input type="checkbox" checked={!!p.paid} onChange={(e) => updatePayRow(i, { paid: e.target.checked })} />
              *PAID
            </label>
            <button style={{ ...btnGhost, color: '#c0392b' }} onClick={() => removePayRow(i)}>×</button>
          </div>
        ))}
        <button style={{ ...btnGhost, marginBottom: 12 }} onClick={addPayRow}>+ Baris pembayaran</button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '10px 12px', background: dark ? '#2b3038' : '#eef1f6', borderRadius: 8 }}>
          <span style={{ color: sub, fontWeight: 600 }}>Grand Total <span style={{ fontWeight: 400, fontSize: 12 }}>(otomatis: subtotal − discount − DP)</span></span>
          <strong style={{ color: grandTotalCalc < 0 ? '#c0392b' : text, fontSize: 18 }}>{rupiah(grandTotalCalc)}</strong>
        </div>

        <div className="klf-quote-form-grid">
          <label className="klf-fld"><span style={{ color: sub }}>Template Payment Terms</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <select style={{ ...inputStyle, flex: 1 }} value={form.termsTemplateId || ''} onChange={(e) => setF({ termsTemplateId: e.target.value })}>
                {terms.map((t) => <option key={t.id} value={t.id}>{t.nama}</option>)}
              </select>
              <button type="button" style={{ ...btnGhost, padding: '8px 10px' }} title="Kelola payment terms" onClick={() => setTplMgr('terms')}>⚙</button>
            </div></label>
          <label className="klf-fld"><span style={{ color: sub }}>Catatan ongkir</span>
            <select style={inputStyle} value={form.ongkirNote} onChange={(e) => setF({ ongkirNote: e.target.value })}>
              {ONGKIR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select></label>
          <label className="klf-fld"><span style={{ color: sub }}>Campaign (CRM)</span>
            <select style={inputStyle} value={form.campaignId} onChange={(e) => setF({ campaignId: e.target.value })} disabled={form.isRepeatOrder}>
              <option value="organic">Organic / tanpa campaign</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.nama}</option>)}
            </select></label>
        </div>
        <div style={{ display: 'flex', gap: 18, marginTop: 12, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: text, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.hideTotals} onChange={(e) => setF({ hideTotals: e.target.checked })} />
            Sembunyikan total (mode pricelist)
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: text, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isRepeatOrder} onChange={(e) => setF({ isRepeatOrder: e.target.checked })} />
            Repeat Order
          </label>
        </div>
        {form.isRepeatOrder && (
          <label className="klf-fld" style={{ marginTop: 10 }}><span style={{ color: sub }}>Campaign asal (repeat → CLV)</span>
            <select style={inputStyle} value={form.repeatRefCampaignId} onChange={(e) => setF({ repeatRefCampaignId: e.target.value })}>
              <option value="">— pilih —</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.nama}</option>)}
            </select></label>
        )}
      </div>

      {/* sticky actions */}
      <div className="klf-quote-actions" style={{ background: card, borderTop: `1px solid ${border}` }}>
        <button style={{ ...btnGhost }} disabled={saving} onClick={() => saveQuote()}>{saving ? 'Menyimpan…' : 'Simpan'}</button>
        <button style={btn(primary)} disabled={saving} onClick={() => saveQuote({ thenPdf: true })}>Simpan & PDF</button>
        {form.id && <a href={`${baseUrl}/quotation/${form.id}/pdf`} target="_blank" rel="noreferrer" style={{ ...btnGhost, textDecoration: 'none' }}>⬇ PDF</a>}
      </div>
    </div>
  );

  return (
    <div style={{ background: bg, minHeight: '100vh', padding: 16, color: text }}>
      <style>{`
        .klf-quote-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
        .klf-quote-form-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
        .klf-quote-costing { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .klf-fld { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
        .klf-fld-full { grid-column: 1 / -1; }
        .klf-quote-actions { display: flex; gap: 10px; flex-wrap: wrap; position: sticky; bottom: 0; padding: 12px 0; margin-top: 8px; }
        @media (min-width: 640px) {
          .klf-quote-grid { grid-template-columns: repeat(2, 1fr); }
          .klf-quote-form-grid { grid-template-columns: repeat(2, 1fr); }
          .klf-quote-costing { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1024px) {
          .klf-quote-grid { grid-template-columns: repeat(4, 1fr); }
          .klf-quote-form-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h4 style={{ color: text, marginBottom: 16 }}>Quote & Invoice</h4>
        {view !== 'form' && renderTabs()}
        {view === 'folders' && renderFolders()}
        {view === 'customerDetail' && renderCustomerDetail()}
        {view === 'allQuotes' && renderAllQuotes()}
        {view === 'form' && renderForm()}
      </div>
      {tplMgr && (
        <TemplateManager
          type={tplMgr}
          baseUrl={baseUrl}
          ui={{ ...ui, sub }}
          templates={tplMgr === 'desc' ? descTpls : terms}
          onClose={() => setTplMgr(null)}
          onChanged={refreshTemplates}
        />
      )}
    </div>
  );
};

export default Quote;
