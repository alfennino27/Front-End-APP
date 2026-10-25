import React, { useEffect, useState } from 'react';
import { Modal, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTheme } from '../../ThemeContext';
import { getApiBaseUrl } from '../../Config/APIurl';
import useIsMobile from '../../Utils/useIsMobile';

const rupiah = (n) => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');

const Dashboard = () => {
  const { globalTheme } = useTheme();
  const isDark = globalTheme !== 'light';
  const mobile = useIsMobile();
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'kekurangan' | 'hutang' | 'estimasi' | null
  const [togglingKey, setTogglingKey] = useState(null); // 'project_id|category' yg sedang diproses

  useEffect(() => {
    const cekLogin = () => {
      if (user == null) { window.location.replace('/login'); return; }
      const allowed = ['fYpdHwXRDLhj5XGxM5FZIAvxp9E2', 'w4M5JJjgGQeHFbS2nkyoCfUBE532', 'gwsOqUgVXSPyWFMMHr4bJteBoYs1', 'ep15dsFMceTBAyZvpZDiAJ4kMME3'];
      if (!allowed.includes(user.uid)) window.location.replace('/project');
    };
    cekLogin();
  }, []);

  const load = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/dashboard/informatif/get`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('Gagal ambil dashboard informatif:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Toggle exclude satu baris estimasi, lalu muat ulang agar total & sisa piutang ikut update.
  const toggleExclude = async (it) => {
    const key = `${it.project_id}|${it.category}`;
    setTogglingKey(key);
    try {
      await fetch(`${getApiBaseUrl()}/dashboard/informatif/estimasi/exclude`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: it.project_id, category: it.category, excluded: !it.excluded }),
      });
      await load();
    } catch (e) {
      console.error('Gagal toggle exclude:', e);
    } finally {
      setTogglingKey(null);
    }
  };

  const cardText = isDark ? '#fff' : '#222';
  const cardBg = isDark ? '#1e1e2d' : '#fff';
  const border = isDark ? '#333' : '#e3e3e3';

  const Card = ({ title, value, color, onClick, subtitle }) => (
    <div className="col">
      <div
        onClick={onClick}
        style={{
          background: cardBg, border: `1px solid ${border}`, borderLeft: `6px solid ${color}`,
          borderRadius: 12, padding: '18px 20px', height: '100%',
          cursor: onClick ? 'pointer' : 'default', transition: 'transform .1s, box-shadow .1s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
        onMouseEnter={(e) => { if (onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'; } }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
      >
        <div style={{ fontSize: 13, color: isDark ? '#aaa' : '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .3 }}>{title}</div>
        <div style={{ fontSize: 26, fontWeight: 700, color, marginTop: 6 }}>
          {loading ? '…' : rupiah(value)}
        </div>
        <div style={{ fontSize: 12, color: isDark ? '#888' : '#999', marginTop: 4 }}>
          {onClick ? '👆 Klik untuk detail' : subtitle}
        </div>
      </div>
    </div>
  );

  const modalHeaderStyle = { background: cardBg, color: cardText, borderBottom: `1px solid ${border}` };
  const modalBodyStyle = { background: cardBg, color: cardText, padding: mobile ? 12 : undefined };
  const sub = isDark ? '#999' : '#888';

  // Versi HP: satu kartu per baris data (pengganti tabel 5 kolom yang harus digeser)
  const KartuBaris = ({ judul, keterangan, kolom, utama }) => (
    <div style={{ border: `1px solid ${border}`, borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, overflowWrap: 'anywhere' }}>{judul}</div>
          {keterangan && <div style={{ fontSize: 12, color: sub, overflowWrap: 'anywhere' }}>{keterangan}</div>}
        </div>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#e0455e', whiteSpace: 'nowrap' }}>{utama}</div>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 6, fontSize: 12, color: sub }}>
        {kolom.map(([l, v]) => <span key={l}>{l}: <b style={{ color: cardText, fontWeight: 600 }}>{v}</b></span>)}
      </div>
    </div>
  );

  return (
    <>
      <h1 className="text-center mb-4 mt-4 fw-semibold" style={{ color: isDark ? 'white' : 'blue' }}>Dashboard</h1>

      <div className="container">
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-3 mb-4">
          <Card
            title="Total Kekurangan Invoice"
            value={data?.kekurangan_invoice?.total}
            color="#2f6fed"
            onClick={() => data && setModal('kekurangan')}
          />
          <Card
            title="Total Hutang di Supplier"
            value={data?.hutang_spk?.total}
            color="#e0455e"
            onClick={() => data && setModal('hutang')}
          />
          <Card
            title="Total Estimasi Biaya Lain"
            value={data?.estimasi_biaya?.total}
            color="#e08a2f"
            onClick={() => data && setModal('estimasi')}
          />
          <Card
            title="Total Sisa Piutang"
            value={data?.sisa_piutang}
            color="#2fa855"
            subtitle="Kekurangan invoice − hutang SPK − estimasi biaya"
          />
        </div>

        {/* Tombol dashboard lain (existing) */}
        <div className="row row-cols-1 row-cols-md-3 g-4">
          <div className="col">
            <Link to="/dashboard/finance" className="btn btn-light w-100 text-primary text-center border border-primary py-3">
              Finance
            </Link>
          </div>
        </div>
      </div>

      {/* ---- Modal: Kekurangan Invoice ---- */}
      <Modal show={modal === 'kekurangan'} onHide={() => setModal(null)} size="lg" centered scrollable fullscreen="sm-down">
        <Modal.Header closeButton style={modalHeaderStyle}>
          <Modal.Title style={{ fontSize: mobile ? 16 : 18, lineHeight: 1.3 }}>
            Detail Kekurangan Invoice — total {rupiah(data?.kekurangan_invoice?.total)}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={modalBodyStyle}>
          {mobile ? (
            <>
              {(data?.kekurangan_invoice?.detail || []).map((r) => (
                <KartuBaris key={r.id} judul={r.customer || '-'} keterangan={<Link to={`/invoice/${r.id}`} onClick={() => setModal(null)}>{r.kodeInvoice}</Link>} utama={rupiah(r.kekurangan)}
                  kolom={[['Tagihan', rupiah(r.tagihan)], ['Dibayar', rupiah(r.dibayar)]]} />
              ))}
              {!data?.kekurangan_invoice?.detail?.length && <div className="text-center">Tidak ada kekurangan.</div>}
            </>
          ) : (
          <Table striped bordered hover variant={isDark ? 'dark' : undefined} size="sm">
            <thead>
              <tr><th>Kode Invoice</th><th>Customer</th><th className="text-end">Tagihan</th><th className="text-end">Dibayar</th><th className="text-end">Kekurangan</th></tr>
            </thead>
            <tbody>
              {(data?.kekurangan_invoice?.detail || []).map((r) => (
                <tr key={r.id}>
                  <td><Link to={`/invoice/${r.id}`} onClick={() => setModal(null)}>{r.kodeInvoice}</Link></td>
                  <td>{r.customer}</td>
                  <td className="text-end">{rupiah(r.tagihan)}</td>
                  <td className="text-end">{rupiah(r.dibayar)}</td>
                  <td className="text-end fw-semibold" style={{ color: '#e0455e' }}>{rupiah(r.kekurangan)}</td>
                </tr>
              ))}
              {!data?.kekurangan_invoice?.detail?.length && <tr><td colSpan={5} className="text-center">Tidak ada kekurangan.</td></tr>}
            </tbody>
          </Table>
          )}
        </Modal.Body>
      </Modal>

      {/* ---- Modal: Hutang Supplier (SPK belum lunas) ---- */}
      <Modal show={modal === 'hutang'} onHide={() => setModal(null)} size="lg" centered scrollable fullscreen="sm-down">
        <Modal.Header closeButton style={modalHeaderStyle}>
          <Modal.Title style={{ fontSize: mobile ? 16 : 18, lineHeight: 1.3 }}>
            Detail Hutang Supplier (SPK belum lunas) — total {rupiah(data?.hutang_spk?.total)}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={modalBodyStyle}>
          {mobile ? (
            <>
              {(data?.hutang_spk?.detail || []).map((r) => (
                <KartuBaris key={r.id} judul={r.pengrajin || '-'} keterangan={r.code || '-'} utama={rupiah(r.sisa)}
                  kolom={[['Total', rupiah(r.total)], ['Dibayar', rupiah(r.dibayar)]]} />
              ))}
              {!data?.hutang_spk?.detail?.length && <div className="text-center">Semua SPK sudah lunas.</div>}
            </>
          ) : (
          <Table striped bordered hover variant={isDark ? 'dark' : undefined} size="sm">
            <thead>
              <tr><th>Kode SPK</th><th>Supplier / Pengrajin</th><th className="text-end">Total SPK</th><th className="text-end">Dibayar</th><th className="text-end">Sisa</th></tr>
            </thead>
            <tbody>
              {(data?.hutang_spk?.detail || []).map((r) => (
                <tr key={r.id}>
                  <td>{r.code || '-'}</td>
                  <td>{r.pengrajin || '-'}</td>
                  <td className="text-end">{rupiah(r.total)}</td>
                  <td className="text-end">{rupiah(r.dibayar)}</td>
                  <td className="text-end fw-semibold" style={{ color: '#e0455e' }}>{rupiah(r.sisa)}</td>
                </tr>
              ))}
              {!data?.hutang_spk?.detail?.length && <tr><td colSpan={5} className="text-center">Semua SPK sudah lunas.</td></tr>}
            </tbody>
          </Table>
          )}
        </Modal.Body>
      </Modal>

      {/* ---- Modal: Estimasi Biaya Lain (per kategori) ---- */}
      <Modal show={modal === 'estimasi'} onHide={() => setModal(null)} size="lg" centered scrollable fullscreen="sm-down">
        <Modal.Header closeButton style={modalHeaderStyle}>
          <Modal.Title style={{ fontSize: mobile ? 16 : 18, lineHeight: 1.3 }}>
            Estimasi Biaya per Kategori (item belum selesai) — total {rupiah(data?.estimasi_biaya?.total)}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={modalBodyStyle}>
          <div style={{ fontSize: 12, color: isDark ? '#999' : '#888', marginBottom: 10 }}>
            Klik <b>Exclude</b> pada baris untuk mengeluarkannya dari hitungan. Baris ter-exclude ditandai coret & tidak dijumlahkan.
          </div>
          {(data?.estimasi_biaya?.per_kategori || []).map((cat) => (
            <div key={cat.kategori} className="mb-3">
              <div className="d-flex justify-content-between align-items-center" style={{ borderBottom: `2px solid ${border}`, paddingBottom: 4 }}>
                <span className="fw-semibold" style={{ fontSize: 15 }}>
                  {cat.kategori} <span style={{ color: isDark ? '#888' : '#999', fontWeight: 400 }}>({cat.jumlah_item} item{cat.jumlah_exclude ? `, ${cat.jumlah_exclude} exclude` : ''})</span>
                </span>
                <span className="fw-bold" style={{ color: '#e08a2f' }}>{rupiah(cat.total)}</span>
              </div>
              {mobile ? (
                <div style={{ marginTop: 6 }}>
                  {cat.items.map((it, i) => {
                    const key = `${it.project_id}|${it.category}`;
                    const busy = togglingKey === key;
                    return (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${border}`, opacity: it.excluded ? 0.55 : 1 }}>
                        <div style={{ flex: 1, minWidth: 0, textDecoration: it.excluded ? 'line-through' : 'none' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, overflowWrap: 'anywhere' }}>{it.namaBarang}</div>
                          <div style={{ fontSize: 11.5, color: sub, overflowWrap: 'anywhere' }}>
                            {it.kodeInvoice}{it.customer ? ` — ${it.customer}` : ''}
                          </div>
                          {it.alasan && <div style={{ fontSize: 11, color: sub }}>{it.supplier ? `${it.supplier} · ` : ''}{it.alasan}</div>}
                          <div style={{ fontSize: 12.5, marginTop: 2 }}>
                            {rupiah(it.estimasi_unit)} × {it.qty} = <b>{rupiah(it.subtotal)}</b>
                          </div>
                        </div>
                        <button onClick={() => toggleExclude(it)} disabled={busy}
                          style={{
                            flexShrink: 0, minWidth: 76, minHeight: 36, fontSize: 12, borderRadius: 8, cursor: busy ? 'wait' : 'pointer',
                            border: `1px solid ${it.excluded ? '#2fa855' : '#e0455e'}`,
                            background: 'transparent', color: it.excluded ? '#2fa855' : '#e0455e',
                          }}>
                          {busy ? '…' : it.excluded ? 'Include' : 'Exclude'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
              <Table borderless variant={isDark ? 'dark' : undefined} size="sm" className="mb-0">
                <tbody>
                  {cat.items.map((it, i) => {
                    const key = `${it.project_id}|${it.category}`;
                    const busy = togglingKey === key;
                    const muted = isDark ? '#777' : '#aaa';
                    return (
                      <tr key={i} style={{ fontSize: 13, opacity: it.excluded ? 0.55 : 1, textDecoration: it.excluded ? 'line-through' : 'none', color: it.excluded ? muted : undefined }}>
                        <td>{it.kodeInvoice}</td>
                        <td>
                          {it.namaBarang} {it.customer ? <span style={{ color: muted }}>— {it.customer}</span> : null}
                          {/* kenapa masih estimasi: belum ada supplier / SPK belum dibuat / harga SPK kosong */}
                          {it.alasan ? (
                            <div style={{ fontSize: 11, color: muted }}>
                              {it.supplier ? `${it.supplier} · ` : ''}{it.alasan}
                            </div>
                          ) : null}
                        </td>
                        <td className="text-end">{rupiah(it.estimasi_unit)} × {it.qty}</td>
                        <td className="text-end">{rupiah(it.subtotal)}</td>
                        <td className="text-end" style={{ textDecoration: 'none', width: 90 }}>
                          <button
                            onClick={() => toggleExclude(it)}
                            disabled={busy}
                            style={{
                              fontSize: 11, padding: '2px 8px', borderRadius: 6, cursor: busy ? 'wait' : 'pointer',
                              border: `1px solid ${it.excluded ? '#2fa855' : '#e0455e'}`,
                              background: 'transparent', color: it.excluded ? '#2fa855' : '#e0455e', whiteSpace: 'nowrap',
                            }}
                          >
                            {busy ? '…' : it.excluded ? 'Include' : 'Exclude'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              )}
            </div>
          ))}
          {!data?.estimasi_biaya?.per_kategori?.length && <div className="text-center">Tidak ada estimasi biaya.</div>}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Dashboard;
