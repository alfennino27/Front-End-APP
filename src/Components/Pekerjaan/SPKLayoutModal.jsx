import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { getImageUrl } from '../../Utils/image';
import {
  SPK_TEMPLATES, TEMPLATE_ORDER, SLOT_LETTERS,
  gridAreasValue, buildInitialPages,
} from './spkTemplates';

// Modal 2 langkah untuk Buat SPK:
//  1. Pilih gambar cover (tampil di halaman template SPK).
//  2. Atur layout tiap halaman gambar: pilih template + assign gambar ke placeholder.
// onConfirm({ coverImage, pages }) dengan pages = [{ template, slots: [img|null] }].
const SPKLayoutModal = ({ show, images = [], namaBarang = '', globalTheme = 'light', onClose, onConfirm }) => {
  const dark = globalTheme !== 'light';
  const [step, setStep] = useState(1);
  const [cover, setCover] = useState(null);
  const [pages, setPages] = useState([]);
  const [activeSlot, setActiveSlot] = useState(null); // { pageIdx, slotIdx }

  // Reset tiap kali modal dibuka.
  useEffect(() => {
    if (show) {
      setStep(1);
      setCover(null);
      setPages([]);
      setActiveSlot(null);
    }
  }, [show]);

  const handlePickCover = (img) => {
    setCover(img);
    setPages((prev) => (prev.length ? prev : buildInitialPages(images)));
    setStep(2);
  };

  const changeTemplate = (pageIdx, key) => {
    setPages((prev) => prev.map((p, pi) => {
      if (pi !== pageIdx) return p;
      const n = SPK_TEMPLATES[key].slots;
      const slots = Array.from({ length: n }, (_, i) => p.slots[i] ?? null);
      return { template: key, slots };
    }));
    setActiveSlot((a) => (a && a.pageIdx === pageIdx ? null : a));
  };

  const assignImage = (img) => {
    if (!activeSlot) return;
    const { pageIdx, slotIdx } = activeSlot;
    setPages((prev) => prev.map((p, pi) => (
      pi !== pageIdx ? p : { ...p, slots: p.slots.map((s, si) => (si === slotIdx ? img : s)) }
    )));
    setActiveSlot(null);
  };

  const clearSlot = (pageIdx, slotIdx) => {
    setPages((prev) => prev.map((p, pi) => (
      pi !== pageIdx ? p : { ...p, slots: p.slots.map((s, si) => (si === slotIdx ? null : s)) }
    )));
  };

  const addPage = () => setPages((prev) => [...prev, { template: 'full', slots: [null] }]);
  const removePage = (pageIdx) => {
    setPages((prev) => prev.filter((_, i) => i !== pageIdx));
    setActiveSlot(null);
  };

  // Gambar yang sudah dipakai di slot mana pun.
  const usedImages = useMemo(() => {
    const s = new Set();
    pages.forEach((p) => p.slots.forEach((img) => { if (img) s.add(img); }));
    return s;
  }, [pages]);

  const unusedCount = images.filter((im) => !usedImages.has(im)).length;

  // Untuk picker: gambar yang dipakai di slot LAIN (bukan slot aktif) → disable.
  const usedElsewhere = useMemo(() => {
    if (!activeSlot) return new Set();
    const s = new Set();
    pages.forEach((p, pi) => p.slots.forEach((img, si) => {
      if (img && !(pi === activeSlot.pageIdx && si === activeSlot.slotIdx)) s.add(img);
    }));
    return s;
  }, [pages, activeSlot]);

  const handleConfirm = () => {
    onConfirm({ coverImage: cover, pages });
  };

  const txtMuted = dark ? '#aaa' : '#666';
  const border = dark ? '#555' : '#ccc';
  const cardBg = dark ? '#2a2a2a' : '#fff';

  return (
    <Modal show={show} onHide={onClose} size="xl" className={dark ? 'modalKLF' : 'modalKLFlight'} scrollable>
      <Modal.Header closeButton>
        <Modal.Title style={{ color: dark ? 'white' : 'black', fontSize: '16px' }}>
          {step === 1 ? 'Pilih Gambar Cover SPK' : 'Atur Layout Halaman Gambar'}
          <span style={{ marginLeft: 10, fontSize: 12, color: '#888', fontWeight: 'normal' }}>Langkah {step}/2</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {step === 1 ? (
          <>
            <p style={{ color: txtMuted, fontSize: 13, marginBottom: 12 }}>
              Klik gambar yang ingin ditampilkan sebagai gambar utama di halaman cover SPK.
            </p>
            {images.length === 0 ? (
              <p style={{ color: '#aaa', textAlign: 'center' }}>Tidak ada gambar tersedia.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                {images.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => handlePickCover(img)}
                    style={{
                      cursor: 'pointer', borderRadius: 8, overflow: 'hidden', aspectRatio: '1',
                      border: `2px solid ${cover === img ? '#0d6efd' : border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: dark ? '#222' : '#f8f8f8', transition: 'border-color .15s, transform .15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0d6efd'; e.currentTarget.style.transform = 'scale(1.03)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = cover === img ? '#0d6efd' : border; e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <img src={getImageUrl(img)} alt={`Gambar ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Picker gambar untuk slot aktif */}
            {activeSlot && (
              <div style={{
                border: '2px solid #0d6efd', borderRadius: 10, padding: 12, marginBottom: 16,
                background: dark ? '#1f2a3a' : '#f0f6ff',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong style={{ color: dark ? '#cfe2ff' : '#0d6efd', fontSize: 13 }}>
                    Pilih gambar → Halaman {activeSlot.pageIdx + 1}, slot {activeSlot.slotIdx + 1}
                  </strong>
                  <Button size="sm" variant="outline-secondary" onClick={() => setActiveSlot(null)}>Tutup</Button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
                  {images.map((img, i) => {
                    const disabled = usedElsewhere.has(img);
                    return (
                      <div
                        key={i}
                        onClick={() => !disabled && assignImage(img)}
                        title={disabled ? 'Sudah dipakai di slot lain' : 'Pilih gambar ini'}
                        style={{
                          position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer',
                          borderRadius: 6, overflow: 'hidden', aspectRatio: '1',
                          border: `2px solid ${border}`, opacity: disabled ? 0.4 : 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', background: dark ? '#222' : '#fff',
                        }}
                      >
                        <img src={getImageUrl(img)} alt={`G${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {disabled && (
                          <span style={{
                            position: 'absolute', top: 2, right: 2, background: '#dc3545', color: '#fff',
                            fontSize: 9, padding: '1px 5px', borderRadius: 8,
                          }}>dipakai</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cover preview + info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 11, color: txtMuted, whiteSpace: 'nowrap' }}>Cover:</span>
              <div style={{ width: 44, height: 44, borderRadius: 6, overflow: 'hidden', border: '2px solid #0d6efd', flexShrink: 0 }}>
                {cover && <img src={getImageUrl(cover)} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <span style={{ fontSize: 11, color: txtMuted }}>tampil di halaman pertama SPK</span>
            </div>

            {/* Daftar halaman */}
            {pages.map((page, pageIdx) => {
              const tpl = SPK_TEMPLATES[page.template];
              return (
                <div key={pageIdx} style={{ border: `1px solid ${border}`, borderRadius: 10, padding: 12, marginBottom: 14, background: cardBg }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                    <strong style={{ color: dark ? '#fff' : '#222', fontSize: 14 }}>Halaman {pageIdx + 1}</strong>
                    {/* Template selector */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {TEMPLATE_ORDER.map((key) => (
                        <div
                          key={key}
                          onClick={() => changeTemplate(pageIdx, key)}
                          title={SPK_TEMPLATES[key].label}
                          style={{
                            cursor: 'pointer', padding: 3, borderRadius: 6,
                            border: `2px solid ${page.template === key ? '#0d6efd' : 'transparent'}`,
                            background: page.template === key ? (dark ? '#1f2a3a' : '#eef4ff') : 'transparent',
                          }}
                        >
                          <MiniTemplateIcon tplKey={key} dark={dark} />
                        </div>
                      ))}
                    </div>
                    {pages.length > 1 && (
                      <Button size="sm" variant="outline-danger" onClick={() => removePage(pageIdx)}>Hapus halaman</Button>
                    )}
                  </div>

                  {/* Preview layout dengan placeholder */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: tpl.cols, gridTemplateRows: tpl.rows,
                    gridTemplateAreas: gridAreasValue(tpl.areas), gap: 6,
                    width: '100%', aspectRatio: '277 / 178', maxWidth: 560, margin: '0 auto',
                  }}>
                    {page.slots.map((img, slotIdx) => {
                      const isActive = activeSlot && activeSlot.pageIdx === pageIdx && activeSlot.slotIdx === slotIdx;
                      return (
                        <div
                          key={slotIdx}
                          style={{
                            gridArea: SLOT_LETTERS[slotIdx],
                            border: `2px ${img ? 'solid' : 'dashed'} ${isActive ? '#0d6efd' : (img ? border : '#bbb')}`,
                            borderRadius: 6, overflow: 'hidden', position: 'relative',
                            background: dark ? '#1a1a1a' : '#fafafa', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                          onClick={() => setActiveSlot({ pageIdx, slotIdx })}
                        >
                          {img ? (
                            <>
                              <img src={getImageUrl(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              <button
                                onClick={(e) => { e.stopPropagation(); clearSlot(pageIdx, slotIdx); }}
                                title="Kosongkan slot"
                                style={{
                                  position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%',
                                  border: 'none', background: 'rgba(220,53,69,.9)', color: '#fff', cursor: 'pointer',
                                  fontSize: 13, lineHeight: '22px', padding: 0,
                                }}
                              >×</button>
                            </>
                          ) : (
                            <span style={{ color: '#999', fontSize: 12, textAlign: 'center' }}>+ Pilih gambar</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <Button variant="outline-primary" size="sm" onClick={addPage}>+ Tambah Halaman</Button>
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        {step === 2 && (
          <>
            <Button variant="outline-secondary" onClick={() => setStep(1)} style={{ marginRight: 'auto' }}>← Ganti cover</Button>
            {unusedCount > 0 && (
              <span style={{ fontSize: 12, color: '#e0a800' }}>{unusedCount} gambar belum dipasang</span>
            )}
            <Button variant="primary" onClick={handleConfirm}>Cetak SPK</Button>
          </>
        )}
        <Button variant="secondary" onClick={onClose}>Batal</Button>
      </Modal.Footer>
    </Modal>
  );
};

// Ikon mini template untuk selector (memakai grid-areas yang sama).
const MiniTemplateIcon = ({ tplKey, dark }) => {
  const tpl = SPK_TEMPLATES[tplKey];
  return (
    <div style={{
      width: 38, height: 26, display: 'grid',
      gridTemplateColumns: tpl.cols, gridTemplateRows: tpl.rows,
      gridTemplateAreas: gridAreasValue(tpl.areas), gap: 2,
    }}>
      {Array.from({ length: tpl.slots }).map((_, i) => (
        <div key={i} style={{ gridArea: SLOT_LETTERS[i], background: dark ? '#888' : '#9aa7b5', borderRadius: 2 }} />
      ))}
    </div>
  );
};

export default SPKLayoutModal;
