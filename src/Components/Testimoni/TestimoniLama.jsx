import React, { useState, useEffect, useRef } from 'react';
import { Container, Button, Modal, Form, Spinner, Badge } from 'react-bootstrap';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useTheme } from '../../ThemeContext';
import { getImageUrl } from '../../Utils/image';
import { MdDelete, MdAddPhotoAlternate } from 'react-icons/md';
import { FiUploadCloud } from 'react-icons/fi';

const TestimoniLama = () => {
    const baseUrl = getApiBaseUrl();
    const { globalTheme } = useTheme();
    const dark = globalTheme === 'dark';

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [namaCustomer, setNamaCustomer] = useState('');
    const [tanggal, setTanggal] = useState('');
    const [screenshots, setScreenshots] = useState([]); // File objects
    const [previews, setPreviews] = useState([]);
    const fileRef = useRef();

    // Delete confirm
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Preview lightbox
    const [lightboxSrc, setLightboxSrc] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${baseUrl}/testimonials-legacy/get`);
            const json = await res.json();
            setData(Array.isArray(json) ? json : []);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setScreenshots(prev => [...prev, ...files]);
        const newPreviews = files.map(f => URL.createObjectURL(f));
        setPreviews(prev => [...prev, ...newPreviews]);
    };

    const removePreview = (idx) => {
        setScreenshots(prev => prev.filter((_, i) => i !== idx));
        setPreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const resetForm = () => {
        setNamaCustomer('');
        setTanggal('');
        setScreenshots([]);
        setPreviews([]);
        if (fileRef.current) fileRef.current.value = '';
    };

    const handleSave = async () => {
        if (!namaCustomer.trim() || !tanggal || screenshots.length === 0) {
            alert('Nama customer, tanggal, dan minimal 1 screenshot wajib diisi!');
            return;
        }
        setSaving(true);
        const formData = new FormData();
        formData.append('namaCustomer', namaCustomer);
        formData.append('tanggal', tanggal);
        screenshots.forEach(f => formData.append('screenshots', f));

        try {
            const res = await fetch(`${baseUrl}/testimonials-legacy/create`, {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                setShowModal(false);
                resetForm();
                fetchData();
            } else {
                const err = await res.json();
                alert(err.message || 'Gagal menyimpan');
            }
        } catch (e) { alert('Gagal menyimpan: ' + e.message); }
        setSaving(false);
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await fetch(`${baseUrl}/testimonials-legacy/delete/${deleteId}`, { method: 'DELETE' });
            setShowDeleteModal(false);
            fetchData();
        } catch (e) { alert('Gagal menghapus'); }
        setDeleting(false);
    };

    const cardBg = dark ? '#1e1e2e' : '#fff';
    const textColor = dark ? 'white' : 'black';
    const mutedColor = dark ? '#aaa' : '#666';

    return (
        <Container className="py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 style={{ color: textColor, fontWeight: 700, marginBottom: 2 }}>Testimoni Lama</h4>
                    <small style={{ color: mutedColor }}>
                        {data.length} testimoni tersimpan
                    </small>
                </div>
                <Button variant="primary" onClick={() => setShowModal(true)}>
                    + Tambah Testimoni
                </Button>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-center py-5"><Spinner /></div>
            ) : data.length === 0 ? (
                <div className="text-center py-5" style={{ color: mutedColor }}>
                    Belum ada testimoni lama. Klik "+ Tambah Testimoni" untuk mulai.
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {data.map((item) => (
                        <div key={item.id} style={{
                            background: cardBg, borderRadius: 12,
                            padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            border: dark ? '1px solid #333' : '1px solid #eee',
                        }}>
                            {/* Screenshots */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: item.screenshots.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                                gap: 6, marginBottom: 12,
                            }}>
                                {item.screenshots.map((src, i) => (
                                    <img
                                        key={i}
                                        src={getImageUrl(src)}
                                        alt={`screenshot-${i}`}
                                        style={{
                                            width: '100%', aspectRatio: '1', objectFit: 'cover',
                                            borderRadius: 8, cursor: 'pointer',
                                        }}
                                        onClick={() => setLightboxSrc(getImageUrl(src))}
                                    />
                                ))}
                            </div>

                            {/* Info */}
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <div style={{ fontWeight: 600, color: textColor }}>{item.namaCustomer}</div>
                                    <small style={{ color: mutedColor }}>
                                        {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </small>
                                    <br />
                                    <Badge bg="secondary" style={{ fontSize: 10, marginTop: 4 }}>
                                        {item.screenshots.length} screenshot
                                    </Badge>
                                </div>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => { setDeleteId(item.id); setShowDeleteModal(true); }}
                                >
                                    <MdDelete />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            <Modal show={showModal} onHide={() => { setShowModal(false); resetForm(); }}
                className={dark ? 'modalKLF' : 'modalKLFlight'} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title style={{ color: textColor }}>Tambah Testimoni Lama</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label style={{ color: textColor, fontWeight: 600 }}>Nama Customer *</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Contoh: Tn. Budi"
                            value={namaCustomer}
                            onChange={e => setNamaCustomer(e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label style={{ color: textColor, fontWeight: 600 }}>Tanggal *</Form.Label>
                        <Form.Control
                            type="date"
                            value={tanggal}
                            onChange={e => setTanggal(e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label style={{ color: textColor, fontWeight: 600 }}>
                            Screenshot WA * <small style={{ color: mutedColor }}>(bisa pilih banyak)</small>
                        </Form.Label>
                        <div
                            style={{
                                border: `2px dashed ${dark ? '#555' : '#ccc'}`,
                                borderRadius: 10, padding: 20, textAlign: 'center',
                                cursor: 'pointer', color: mutedColor,
                            }}
                            onClick={() => fileRef.current?.click()}
                        >
                            <FiUploadCloud size={28} />
                            <p style={{ marginTop: 6, marginBottom: 0, fontSize: 13 }}>
                                Klik untuk pilih gambar
                            </p>
                        </div>
                        <input
                            ref={fileRef}
                            type="file"
                            multiple
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />
                    </Form.Group>

                    {/* Previews */}
                    {previews.length > 0 && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                            gap: 8, marginTop: 12,
                        }}>
                            {previews.map((src, i) => (
                                <div key={i} style={{ position: 'relative' }}>
                                    <img src={src} alt={`preview-${i}`}
                                        style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }} />
                                    <button
                                        onClick={() => removePreview(i)}
                                        style={{
                                            position: 'absolute', top: 2, right: 2,
                                            background: 'red', color: 'white', border: 'none',
                                            borderRadius: '50%', width: 20, height: 20,
                                            fontSize: 12, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >×</button>
                                </div>
                            ))}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>Batal</Button>
                    <Button variant="primary" onClick={handleSave} disabled={saving}>
                        {saving ? <Spinner size="sm" /> : 'Simpan'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Confirm */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}
                className={dark ? 'modalKLF' : 'modalKLFlight'}>
                <Modal.Header closeButton>
                    <Modal.Title style={{ color: textColor }}>Hapus Testimoni?</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p style={{ color: textColor }}>Testimoni ini akan dihapus permanen beserta semua screenshot-nya.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Batal</Button>
                    <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                        {deleting ? <Spinner size="sm" /> : 'Ya, Hapus'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Lightbox */}
            {lightboxSrc && (
                <div
                    onClick={() => setLightboxSrc(null)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
                        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <img src={lightboxSrc} alt="preview"
                        style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />
                </div>
            )}
        </Container>
    );
};

export default TestimoniLama;
