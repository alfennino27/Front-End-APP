import React, { useRef, useState } from 'react';
import { Image } from 'antd';
import { getApiBaseUrl } from '../../Config/APIurl';
import { getImageUrl } from '../../Utils/image';
import { heicToJpegAll } from '../../Utils/heic';

// Kartu category multi pengrajin (mis. Kayu: Kaki & Top Table): tab "Umum" +
// satu tab per bagian. Tab bagian punya gambar kerja & deskripsi sendiri
// (SPKproduct.gambar & .keterangan) — POST /pengerjaan/gambar(/hapus).

const PDF_LOGO = 'https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3';

export const warnaStatus = (s) => (
  s === 'Belum Proses' ? '#dc3545' : s === 'Servis' ? '#fd7e14' : s === 'Proses' ? '#0d6efd' : '#198754'
);

export const BadgeStatus = ({ status }) => (status ? (
  <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 10, background: warnaStatus(status), color: 'white', whiteSpace: 'nowrap' }}>{status}</span>
) : null);

const idItem = (s) => s.id || s._id;

export function TabPengerjaan({ items, aktif, onPilih, globalTheme }) {
  const terang = globalTheme === 'light';
  const tab = (key, label, status) => {
    const on = aktif === key;
    return (
      <button
        key={key}
        type="button"
        onClick={(e) => { e.stopPropagation(); onPilih(key); }}
        style={{
          flex: '0 0 auto',
          minHeight: 40,
          padding: '6px 14px',
          borderRadius: 20,
          border: `1.5px solid ${on ? '#0d6efd' : (terang ? '#bbb' : '#666')}`,
          background: on ? '#0d6efd' : (terang ? '#fff' : '#2a2a2a'),
          color: on ? '#fff' : (terang ? '#333' : '#ddd'),
          fontWeight: 600,
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {label}
        {status && !on && <span style={{ width: 8, height: 8, borderRadius: 4, background: warnaStatus(status) }} />}
      </button>
    );
  };
  return (
    <div
      className="no-active"
      onClick={(e) => e.stopPropagation()}
      style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 0 8px', marginTop: 16, clear: 'both', WebkitOverflowScrolling: 'touch' }}
    >
      {tab('umum', 'Umum')}
      {items.map((s, i) => tab(idItem(s), s.bagian || `Bagian ${i + 1}`, s.statusPengerjaan))}
    </div>
  );
}

// Ringkasan semua bagian di tab Umum — tap baris = pindah ke tab bagian itu.
export function RingkasanBagian({ items, spkById, onPilih, globalTheme }) {
  const terang = globalTheme === 'light';
  return (
    <div className="mt-2">
      {items.map((s, i) => {
        const spk = spkById(s.idSPK);
        return (
          <div
            key={idItem(s)}
            className="no-active"
            onClick={(e) => { e.stopPropagation(); onPilih(idItem(s)); }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
              padding: '10px 12px', marginBottom: 6, borderRadius: 10, cursor: 'pointer',
              border: `1px solid ${terang ? '#d5d5d5' : '#555'}`, background: terang ? '#fff' : '#242424',
              color: terang ? 'black' : 'white',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>{s.bagian || `Bagian ${i + 1}`}</div>
              <small style={{ opacity: 0.75 }}>
                {spk?.pengrajin || s.pengrajin || '-'} · {spk?.code || 'SPK belum ada'}
                {s.deadline ? ` · ${new Date(s.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}` : ''}
              </small>
            </div>
            <BadgeStatus status={s.statusPengerjaan} />
          </div>
        );
      })}
    </div>
  );
}

export function DetailBagian({ item, spk, globalTheme, canEdit, showDeskripsi, onChanged }) {
  const baseUrl = getApiBaseUrl();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const warnaTeks = globalTheme === 'light' ? 'black' : 'white';
  const gambar = Array.isArray(item.gambar) ? item.gambar : [];
  const id = idItem(item);

  const upload = async (fileList) => {
    if (!fileList?.length) return;
    setUploading(true);
    try {
      const files = await heicToJpegAll(fileList);
      const fd = new FormData();
      fd.append('idSpkProduct', id);
      files.forEach((f) => fd.append('gambar', f));
      const res = await fetch(`${baseUrl}/pengerjaan/gambar`, { method: 'POST', body: fd });
      if (!res.ok) alert((await res.json().catch(() => ({}))).message || 'Gagal upload gambar');
      await onChanged?.();
    } catch (err) {
      console.error(err);
      alert('Gagal upload gambar');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const hapus = async (url) => {
    if (!window.confirm('Hapus gambar ini dari bagian?')) return;
    await fetch(`${baseUrl}/pengerjaan/gambar/hapus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idSpkProduct: id, url }),
    });
    await onChanged?.();
  };

  const baris = (label, isi) => (
    <div style={{ display: 'flex', gap: 8, fontSize: 14, lineHeight: 1.6 }}>
      <span style={{ minWidth: 86, opacity: 0.7 }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{isi}</span>
    </div>
  );

  return (
    <div style={{ color: warnaTeks }}>
      {baris('Pengrajin', spk?.pengrajin || item.pengrajin || '-')}
      {baris('SPK', spk?.code || 'Belum ada')}
      {baris('Deadline', item.deadline ? new Date(item.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-')}
      {baris('Status', item.statusPengerjaan ? <BadgeStatus status={item.statusPengerjaan} /> : '-')}

      <h6 className="mt-4">Gambar Kerja — {item.bagian || 'Bagian'}</h6>
      <div className="no-active" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-start' }}>
        {gambar.map((url) => {
          const isPDF = url.toLowerCase().includes('.pdf');
          return (
            <div key={url} style={{ position: 'relative' }}>
              {isPDF ? (
                <a href={`${baseUrl}${url}`} target="_blank" rel="noopener noreferrer">
                  <img src={PDF_LOGO} alt="PDF" style={{ height: '11vh' }} />
                </a>
              ) : (
                <Image height="11vh" width="auto" style={{ borderRadius: 10 }} src={getImageUrl(url)} alt="gambar kerja" />
              )}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => hapus(url)}
                  aria-label="Hapus gambar"
                  style={{ position: 'absolute', top: -6, right: -6, width: 28, height: 28, borderRadius: 14, border: 'none', background: '#dc3545', color: '#fff', fontWeight: 700, lineHeight: '28px', padding: 0 }}
                >×</button>
              )}
            </div>
          );
        })}
        {canEdit && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            style={{
              height: '11vh', minHeight: 72, minWidth: 90, borderRadius: 10,
              border: `2px dashed ${globalTheme === 'light' ? '#aaa' : '#777'}`,
              background: 'transparent', color: warnaTeks, fontSize: 13, padding: '0 10px',
            }}
          >
            {uploading ? 'Mengunggah…' : '+ Gambar'}
          </button>
        )}
        {!canEdit && gambar.length === 0 && <small style={{ opacity: 0.7 }}>Belum ada gambar kerja bagian ini.</small>}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.heic,.heif"
          style={{ display: 'none' }}
          onChange={(e) => upload(Array.from(e.target.files || []))}
        />
      </div>

      <h6 className="mt-4">Deskripsi — {item.bagian || 'Bagian'}</h6>
      <p className="mt-2" style={{ whiteSpace: 'pre-line', display: showDeskripsi ? '' : 'none' }}>
        {item.keterangan || '-'}
      </p>
    </div>
  );
}
