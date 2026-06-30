import React, { useRef, useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { FaPaste, FaTimes, FaRegImages } from 'react-icons/fa';

// Zona upload gambar serbaguna: drag & drop (termasuk drag langsung dari
// aplikasi Photos / Finder di Mac), paste banyak gambar dari clipboard, dan
// pilih file biasa. `images` = array File, `onChange` = setter (boleh fungsi
// updater seperti setState). Maksimal `max` gambar.
const ImageUploadZone = ({ images = [], onChange, max = 10, theme = 'light' }) => {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const isLight = theme === 'light';

  const addFiles = (incoming) => {
    const onlyImages = Array.from(incoming || []).filter(
      (f) => f && f.type && f.type.startsWith('image/')
    );
    if (onlyImages.length === 0) return;
    onChange((prev) => [...(prev || []), ...onlyImages].slice(0, max));
  };

  const removeAt = (idx) => {
    onChange((prev) => (prev || []).filter((_, i) => i !== idx));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dt = e.dataTransfer;
    let files = [];
    // dataTransfer.items lebih andal untuk drag dari aplikasi Photos di Mac
    if (dt.items && dt.items.length) {
      for (const item of dt.items) {
        if (item.kind === 'file') {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
    }
    if (files.length === 0 && dt.files && dt.files.length) {
      files = Array.from(dt.files);
    }
    addFiles(files);
  };

  // Paste via keyboard (Cmd+V) saat zona di-fokus
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files = [];
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length) {
      e.preventDefault();
      addFiles(files);
    }
  };

  // Tombol clipboard: baca semua gambar yang ada di clipboard sekaligus
  const handlePasteButton = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      const files = [];
      for (const item of clipboardItems) {
        const imageType = item.types.find((t) => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const ext = imageType.split('/')[1];
          files.push(
            new File([blob], `pasted-${Date.now()}-${files.length}.${ext}`, {
              type: imageType,
            })
          );
        }
      }
      if (files.length === 0) {
        alert('Tidak ada gambar di clipboard.');
        return;
      }
      addFiles(files);
    } catch (err) {
      alert(
        'Gagal akses clipboard. Pastikan:\n1. Izin clipboard sudah diaktifkan di browser\n2. Aplikasi diakses via HTTPS\n\nError: ' +
          err.message
      );
    }
  };

  const count = (images || []).length;

  return (
    <div>
      <div className="d-flex align-items-stretch" style={{ gap: '10px' }}>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onPaste={handlePaste}
          onClick={() => inputRef.current && inputRef.current.click()}
          tabIndex={0}
          style={{
            flex: 1,
            border: `2px dashed ${dragOver ? '#0d6efd' : isLight ? '#bbb' : '#555'}`,
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver
              ? isLight
                ? '#eef4ff'
                : '#1c2733'
              : 'transparent',
            color: isLight ? '#555' : '#bbb',
            transition: 'all 0.15s ease',
            outline: 'none',
          }}
        >
          <FaRegImages style={{ fontSize: '22px', marginBottom: '6px' }} />
          <div style={{ fontSize: '13px', lineHeight: 1.4 }}>
            Drag &amp; drop gambar di sini
            <br />
            <span style={{ fontSize: '11px' }}>
              (dari Photos / Finder), klik untuk pilih file, atau paste (Cmd+V)
            </span>
          </div>
          {count > 0 && (
            <div style={{ fontSize: '11px', marginTop: '6px' }}>
              {count}/{max} gambar dipilih
            </div>
          )}
        </div>
        <Button
          variant="secondary"
          title="Tempel dari clipboard"
          style={{ height: 'auto', alignSelf: 'stretch' }}
          onClick={handlePasteButton}
        >
          <FaPaste />
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = ''; // reset agar file yang sama bisa dipilih lagi
        }}
      />

      {count > 0 && (
        <div className="d-flex flex-wrap py-2" style={{ gap: '8px' }}>
          {(images || []).map((file, idx) => (
            <Thumb key={idx} file={file} onRemove={() => removeAt(idx)} isLight={isLight} />
          ))}
        </div>
      )}
    </div>
  );
};

const Thumb = ({ file, onRemove, isLight }) => {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    const objUrl = URL.createObjectURL(file);
    setUrl(objUrl);
    return () => URL.revokeObjectURL(objUrl);
  }, [file]);

  return (
    <div
      style={{
        position: 'relative',
        width: '70px',
        height: '70px',
        borderRadius: '6px',
        overflow: 'hidden',
        border: `1px solid ${isLight ? '#ddd' : '#444'}`,
      }}
    >
      {url && (
        <img
          src={url}
          alt={file.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        title="Hapus"
        style={{
          position: 'absolute',
          top: '2px',
          right: '2px',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          border: 'none',
          background: 'rgba(0,0,0,0.6)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
          fontSize: '10px',
          lineHeight: 1,
        }}
      >
        <FaTimes />
      </button>
    </div>
  );
};

export default ImageUploadZone;
