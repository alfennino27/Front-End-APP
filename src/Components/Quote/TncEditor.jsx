import React, { useState } from 'react';

// Editor Syarat & Ketentuan (T&C) modular per quote.
// `tnc` = SNAPSHOT yang tersimpan di quote (judul, label, isi teks) — bukan
// referensi template. Template hanya sumber isi cepat; mengedit template tidak
// mengubah quote yang sudah ada. Struktur bagian dari backend (utils/quoteTnc.js).
//
// tnc = { aktif, catatanKhusus, catatanPosisi: 'atas'|'bawah',
//         sections: [{ key, judul, tipe, pengantar, aktif,
//                      rows: [{ slot, label, aktif, templateId, isi, durasi }] }] }

const clone = (o) => JSON.parse(JSON.stringify(o));

// ---- modal kelola template untuk 1 slot (tambah / edit / hapus / jadikan default) ----
const SlotTemplateManager = ({ slot, label, isGaransi, baseUrl, ui, templates, onClose, onChanged, prefill }) => {
  const base = `${baseUrl}/quotation/tnc/template`;
  const [draft, setDraft] = useState(prefill || null);
  const [busy, setBusy] = useState(false);
  const list = templates.filter((t) => t.slot === slot);

  const save = async () => {
    if (!draft || !(draft.nama || '').trim()) { alert('Nama template wajib diisi'); return; }
    setBusy(true);
    try {
      const url = draft.id ? `${base}/update/${draft.id}` : `${base}/create`;
      const res = await fetch(url, { method: draft.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...draft, slot }) });
      if (!res.ok) throw new Error((await res.json()).message);
      setDraft(null); await onChanged();
    } catch (e) { alert('Gagal simpan template: ' + e.message); }
    setBusy(false);
  };
  const del = async (id) => {
    if (!window.confirm('Hapus template ini? Quote yang sudah memakai isinya TIDAK berubah.')) return;
    try { await fetch(`${base}/delete/${id}`, { method: 'DELETE' }); await onChanged(); } catch (e) { alert('Gagal hapus: ' + e.message); }
  };
  const makeDefault = async (id) => {
    try {
      await fetch(`${base}/update/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isDefault: true }) });
      await onChanged();
    } catch (e) { alert('Gagal: ' + e.message); }
  };

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 16, overflowY: 'auto' };
  const box = { background: ui.card, border: `1px solid ${ui.border}`, borderRadius: 12, padding: 18, width: '100%', maxWidth: 560, marginTop: 40 };
  const btn = { background: '#234dba', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', cursor: 'pointer', fontWeight: 600 };
  const ghost = { background: 'transparent', color: ui.text, border: `1px solid ${ui.border}`, borderRadius: 8, padding: '7px 12px', cursor: 'pointer' };
  const lbl = { display: 'grid', gap: 4, color: ui.sub, fontSize: 13 };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={box} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8 }}>
          <h5 style={{ color: ui.text, margin: 0 }}>Template: {label}</h5>
          <button style={ghost} onClick={onClose}>Tutup</button>
        </div>

        {!draft && (
          <>
            <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
              {list.map((t) => (
                <div key={t.id} style={{ border: `1px solid ${ui.border}`, borderRadius: 8, padding: 10 }}>
                  <div style={{ fontWeight: 600, color: ui.text }}>
                    {t.nama} {t.durasi ? <span style={{ color: '#1e7b34' }}>· {t.durasi}</span> : null}
                    {t.isDefault && <span style={{ marginLeft: 6, background: '#234dba', color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: 11 }}>default</span>}
                  </div>
                  <div style={{ color: ui.sub, fontSize: 12, whiteSpace: 'pre-line', maxHeight: 54, overflow: 'hidden', margin: '4px 0 8px' }}>{t.isi}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button style={ghost} onClick={() => setDraft({ ...t })}>Edit</button>
                    {!t.isDefault && <button style={ghost} onClick={() => makeDefault(t.id)}>Jadikan default</button>}
                    <button style={{ ...ghost, color: '#c0392b' }} onClick={() => del(t.id)}>Hapus</button>
                  </div>
                </div>
              ))}
              {list.length === 0 && <div style={{ color: ui.sub }}>Belum ada template.</div>}
            </div>
            <button style={btn} onClick={() => setDraft({ nama: '', isi: '', durasi: '', isDefault: false })}>+ Template Baru</button>
            <div style={{ color: ui.sub, fontSize: 12, marginTop: 10 }}>Template <b>default</b> otomatis dipakai di quote baru.</div>
          </>
        )}

        {draft && (
          <div style={{ display: 'grid', gap: 10 }}>
            <label style={lbl}>Nama template
              <input style={ui.input} value={draft.nama} onChange={(e) => setDraft({ ...draft, nama: e.target.value })} placeholder="mis. Standar KLF / Harga nego / Proyek B2B" /></label>
            {isGaransi && (
              <label style={lbl}>Durasi
                <input style={ui.input} value={draft.durasi || ''} onChange={(e) => setDraft({ ...draft, durasi: e.target.value })} placeholder="mis. 12 bulan" /></label>
            )}
            <label style={lbl}>Isi
              <textarea style={{ ...ui.input, minHeight: 140, fontFamily: 'inherit' }} value={draft.isi} onChange={(e) => setDraft({ ...draft, isi: e.target.value })} /></label>
            {!draft.id && (
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: ui.text }}>
                <input type="checkbox" checked={!!draft.isDefault} onChange={(e) => setDraft({ ...draft, isDefault: e.target.checked })} /> Jadikan default untuk quote baru
              </label>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={btn} disabled={busy} onClick={save}>{busy ? 'Menyimpan…' : 'Simpan template'}</button>
              <button style={ghost} onClick={() => setDraft(null)}>Batal</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ---- riwayat file PDF yang pernah dicetak (arsip snapshot) ----
export const PdfArsip = ({ baseUrl, quoteId, ui }) => {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState(null);
  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      try { setList(await (await fetch(`${baseUrl}/quotation/${quoteId}/pdf-arsip`)).json()); } catch (e) { setList([]); }
    }
  };
  const fmt = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }); };
  return (
    <div style={{ background: ui.card, border: `1px solid ${ui.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
      <div onClick={toggle} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', color: ui.text, fontWeight: 600 }}>
        <span>🗂 Riwayat PDF tercetak</span><span style={{ color: ui.sub }}>{open ? '▾' : '▸'}</span>
      </div>
      {open && (
        <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
          <div style={{ color: ui.sub, fontSize: 12 }}>Setiap PDF yang dicetak disimpan apa adanya — bukti dokumen yang dikirim ke customer. Cetak ulang tanpa perubahan tidak menambah arsip.</div>
          {list === null && <div style={{ color: ui.sub }}>Memuat…</div>}
          {list && list.length === 0 && <div style={{ color: ui.sub }}>Belum ada PDF yang dicetak.</div>}
          {list && list.map((a) => (
            <a key={a.url} href={`${baseUrl}${a.url}`} target="_blank" rel="noreferrer"
              style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '10px 12px', border: `1px solid ${ui.border}`, borderRadius: 8, color: ui.text, textDecoration: 'none', flexWrap: 'wrap' }}>
              <span><b>Rev {a.rev}</b> · {a.mode === 'pricelist' ? 'Pricelist' : 'Quote/Invoice'} · <span style={{ color: ui.sub }}>{a.status}</span></span>
              <span style={{ color: ui.sub, fontSize: 13 }}>{fmt(a.printedAt)} · {Math.round((a.size || 0) / 1024)} KB ⬇</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

const TncEditor = ({ tnc, onChange, cfg, ui, baseUrl, onTemplatesChanged, copyOptions, onCopyFrom }) => {
  const [openSec, setOpenSec] = useState(null);
  const [mgr, setMgr] = useState(null); // { slot, label, isGaransi, prefill? }
  const templates = (cfg && cfg.templates) || [];

  const card = { background: ui.card, border: `1px solid ${ui.border}`, borderRadius: 12, padding: 16, marginBottom: 16 };
  const ghost = { background: 'transparent', color: ui.text, border: `1px solid ${ui.border}`, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 14 };
  const chk = { display: 'flex', gap: 8, alignItems: 'center', color: ui.text, cursor: 'pointer' };

  if (!tnc) {
    return (
      <div style={card}>
        <div style={{ color: ui.text, fontWeight: 600, marginBottom: 6 }}>📜 Syarat & Ketentuan</div>
        <div style={{ color: ui.sub, fontSize: 13, marginBottom: 10 }}>Quote ini dibuat sebelum fitur Syarat & Ketentuan — PDF tercetak format lama.</div>
        <button style={ghost} disabled={!cfg} onClick={() => onChange(clone(cfg.defaultTnc))}>+ Tambahkan Syarat & Ketentuan standar</button>
      </div>
    );
  }

  const set = (patch) => onChange({ ...tnc, ...patch });
  const setSection = (key, patch) => onChange({ ...tnc, sections: tnc.sections.map((s) => (s.key === key ? { ...s, ...patch } : s)) });
  const setRow = (key, slot, patch) => onChange({
    ...tnc,
    sections: tnc.sections.map((s) => (s.key !== key ? s : { ...s, rows: s.rows.map((r) => (r.slot === slot ? { ...r, ...patch } : r)) })),
  });
  const applyTemplate = (key, slot, id) => {
    const t = templates.find((x) => x.id === id);
    if (t) setRow(key, slot, { templateId: t.id, isi: t.isi, durasi: t.durasi || '' });
  };

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        <div style={{ color: ui.text, fontWeight: 600 }}>📜 Syarat & Ketentuan <span style={{ color: ui.sub, fontWeight: 400, fontSize: 12 }}>(halaman 2 PDF)</span></div>
        <label style={chk}>
          <input type="checkbox" checked={!!tnc.aktif} onChange={(e) => set({ aktif: e.target.checked })} /> Sertakan di PDF
        </label>
      </div>
      {!tnc.aktif && <div style={{ color: ui.sub, fontSize: 12, marginBottom: 10 }}>Dimatikan → PDF format lama (tanpa halaman Syarat & Ketentuan). Catatan khusus tetap dicetak di halaman 1.</div>}

      {/* catatan khusus per order */}
      <label className="klf-fld" style={{ marginBottom: 6 }}><span style={{ color: ui.sub }}>Catatan khusus order ini <small>(mis. kesepakatan garansi karena harga nego)</small></span>
        <textarea style={{ ...ui.input, minHeight: 60, fontFamily: 'inherit' }} value={tnc.catatanKhusus || ''} onChange={(e) => set({ catatanKhusus: e.target.value })} />
      </label>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12, fontSize: 13 }}>
        <span style={{ color: ui.sub }}>Tampil di:</span>
        <label style={chk}><input type="radio" checked={tnc.catatanPosisi !== 'bawah'} onChange={() => set({ catatanPosisi: 'atas' })} /> Halaman 1 (bawah pricelist)</label>
        <label style={chk}><input type="radio" checked={tnc.catatanPosisi === 'bawah'} onChange={() => set({ catatanPosisi: 'bawah' })} /> Akhir Syarat & Ketentuan</label>
      </div>

      {/* salin dari quote lain (repeat order / buru-buru) */}
      {copyOptions && copyOptions.length > 0 && (
        <label className="klf-fld" style={{ marginBottom: 12 }}><span style={{ color: ui.sub }}>Pakai Syarat & Ketentuan dari quote lain</span>
          <select style={ui.input} value="" onChange={(e) => { if (e.target.value && window.confirm('Ganti seluruh Syarat & Ketentuan di form ini dengan milik quote tersebut?')) onCopyFrom(e.target.value); }}>
            <option value="">— pilih quote —</option>
            {copyOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      )}

      {tnc.aktif && (
        <div style={{ display: 'grid', gap: 8 }}>
          {tnc.sections.map((s) => {
            const isOpen = openSec === s.key;
            const nAktif = s.rows.filter((r) => r.aktif).length;
            const isGaransi = s.tipe === 'garansi';
            return (
              <div key={s.key} style={{ border: `1px solid ${ui.border}`, borderRadius: 10, opacity: s.aktif ? 1 : 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
                  <input type="checkbox" checked={!!s.aktif} onChange={(e) => setSection(s.key, { aktif: e.target.checked })} title="Cetak bagian ini" style={{ width: 18, height: 18 }} />
                  <div onClick={() => setOpenSec(isOpen ? null : s.key)} style={{ flex: 1, cursor: 'pointer', color: ui.text, fontWeight: 600, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span>{s.judul}</span>
                    <span style={{ color: ui.sub, fontWeight: 400, fontSize: 13 }}>{s.rows.length > 1 ? `${nAktif}/${s.rows.length} · ` : ''}{isOpen ? '▾' : '▸'}</span>
                  </div>
                </div>
                {isOpen && (
                  <div style={{ padding: '0 12px 12px', display: 'grid', gap: 12 }}>
                    {s.pengantar !== undefined && s.rows.length > 1 && (
                      <label className="klf-fld"><span style={{ color: ui.sub }}>Kalimat pengantar</span>
                        <textarea style={{ ...ui.input, minHeight: 50, fontFamily: 'inherit', fontSize: 14 }} value={s.pengantar || ''} onChange={(e) => setSection(s.key, { pengantar: e.target.value })} />
                      </label>
                    )}
                    {s.rows.map((r) => {
                      const opts = templates.filter((t) => t.slot === r.slot);
                      const tpl = templates.find((t) => t.id === r.templateId);
                      const diubah = tpl && (tpl.isi !== r.isi || (tpl.durasi || '') !== (r.durasi || ''));
                      return (
                        <div key={r.slot} style={{ borderTop: s.rows.length > 1 ? `1px dashed ${ui.border}` : 'none', paddingTop: s.rows.length > 1 ? 10 : 0, opacity: r.aktif ? 1 : 0.55 }}>
                          {s.rows.length > 1 && (
                            <label style={{ ...chk, fontWeight: 600, marginBottom: 6 }}>
                              <input type="checkbox" checked={!!r.aktif} onChange={(e) => setRow(s.key, r.slot, { aktif: e.target.checked })} style={{ width: 18, height: 18 }} /> {r.label}
                            </label>
                          )}
                          {r.aktif && (
                            <div style={{ display: 'grid', gap: 6 }}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <select style={{ ...ui.input, flex: 1, fontSize: 14 }} value={r.templateId || ''} onChange={(e) => applyTemplate(s.key, r.slot, e.target.value)}>
                                  <option value="">{opts.length ? '— pilih template —' : '(belum ada template)'}</option>
                                  {opts.map((t) => <option key={t.id} value={t.id}>{t.nama}{t.durasi ? ` · ${t.durasi}` : ''}</option>)}
                                </select>
                                <button type="button" style={{ ...ghost, padding: '8px 10px' }} title="Kelola template" onClick={() => setMgr({ slot: r.slot, label: r.label, isGaransi })}>⚙</button>
                              </div>
                              {isGaransi && (
                                <input style={{ ...ui.input, fontSize: 14 }} value={r.durasi || ''} placeholder="Durasi, mis. 12 bulan" onChange={(e) => setRow(s.key, r.slot, { durasi: e.target.value })} />
                              )}
                              <textarea style={{ ...ui.input, minHeight: s.rows.length > 1 ? 64 : 120, fontFamily: 'inherit', fontSize: 14 }} value={r.isi || ''} onChange={(e) => setRow(s.key, r.slot, { isi: e.target.value })} />
                              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', fontSize: 12 }}>
                                {diubah && <span style={{ color: '#b7791f' }}>✎ diubah khusus quote ini</span>}
                                {diubah && <button type="button" style={{ ...ghost, padding: '4px 10px', fontSize: 12 }} onClick={() => applyTemplate(s.key, r.slot, tpl.id)}>↺ Kembalikan ke template</button>}
                                {(r.isi || '').trim() && (
                                  <button type="button" style={{ ...ghost, padding: '4px 10px', fontSize: 12 }}
                                    onClick={() => setMgr({ slot: r.slot, label: r.label, isGaransi, prefill: { nama: '', isi: r.isi, durasi: r.durasi || '', isDefault: false } })}>
                                    ＋ Simpan sebagai template
                                  </button>
                                )}
                                {r.slot === 'leadTime' && <span style={{ color: ui.sub }}>{'{deadline}'} = isian Deadline, {'{targetKirim}'} = Target Kirim</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ color: ui.sub, fontSize: 12 }}>Isi di atas tersimpan utuh di quote ini (snapshot). Mengubah template nanti tidak mengubah quote yang sudah ada.</div>
        </div>
      )}

      {mgr && (
        <SlotTemplateManager
          slot={mgr.slot} label={mgr.label} isGaransi={mgr.isGaransi} prefill={mgr.prefill}
          baseUrl={baseUrl} ui={ui} templates={templates}
          onClose={() => setMgr(null)} onChanged={onTemplatesChanged}
        />
      )}
    </div>
  );
};

export default TncEditor;
