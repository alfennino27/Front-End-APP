import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Col, Row, Modal, Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useNavigate } from 'react-router-dom';
import '../Pekerjaan/pekerjaan.css';
import { MdFormatListBulletedAdd } from 'react-icons/md';
import { debounce } from 'lodash';
import { FaFileInvoice, FaPaste, FaSearch } from 'react-icons/fa';
import { CiEdit } from 'react-icons/ci';
import { Image } from 'antd';
import { useTheme } from '../../ThemeContext';
import { getImageUrl } from '../../Utils/image';

const Stock = () => {
  const baseUrl = getApiBaseUrl();
  const { globalTheme } = useTheme();
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;
  useEffect(() => {
    const cekLogin = () => {
      if (user == null) {
        window.location.replace('/login');
      }
      if (user.uid === 'fYpdHwXRDLhj5XGxM5FZIAvxp9E2' || user.uid === 'w4M5JJjgGQeHFbS2nkyoCfUBE532' || user.uid === '4WGPaHicKWYr0Ny84IUh8xb9Bo62' || user.uid === 'ANGTwgX8KxXQy5Ww3cwpLrG0tFT2' || user.uid === 'gwsOqUgVXSPyWFMMHr4bJteBoYs1' || user.uid === '6D4XVa5BSSOl1ugUlkDlTea2COX2' || user.uid === 'MjOCxfNdGtf0q12BPzj0EYAcVJD3' || user.uid === 'knydS6fIBdOwHS37dDm3ZDNQXKQ2' || user.uid === 'Q3LWLX4D7Ye8hMnQVF9fa7SZb953' || user.uid === 'ep15dsFMceTBAyZvpZDiAJ4kMME3') {
        console.log('success');
      } else {
        window.location.replace('/project');
      }
    };

    cekLogin();
  }, []);

  const isMobile = window.innerWidth <= 768;

  const [showTambahDataModal, setShowTambahDataModal] = useState(false);
  const [showEditDataModal, setShowEditDataModal] = useState(false);
  const [showDeleteDataModal, setShowDeleteDataModal] = useState(false);

  const [gambar, setGambar] = useState(null);
  const [keterangan, setKeterangan] = useState(null);
  const [harga, setHarga] = useState(null);
  const [kategori, setKategori] = useState(null);

  const [dataStock, setDataStock] = useState(null);
  const [dataStockMasuk, setDataStockMasuk] = useState([]);
  const [dataStockKeluar, setDataStockKeluar] = useState([]);

  const [selectedData, setSelectedData] = useState(null);
  const [selectedDataId, setSelectedDataId] = useState(null);
  const [showDetailDataModal, setShowDetailDataModal] = useState(false);

  const [showAddItemMasukModal, setShowAddItemMasukModal] = useState(false);
  const [showEditItemMasukModal, setShowEditItemMasukModal] = useState(false);
  const [showDeleteItemMasukModal, setShowDeleteItemMasukModal] = useState(false);

  const [selectedItemMasukId, setSelectedItemMasukId] = useState(null);
  const [tanggalMasuk, setTanggalMasuk] = useState(null);
  const [keteranganMasuk, setKeteranganMasuk] = useState(null);
  const [qtyMasuk, setQtyMasuk] = useState(null);

  const [showAddItemKeluarModal, setShowAddItemKeluarModal] = useState(false);
  const [showEditItemKeluarModal, setShowEditItemKeluarModal] = useState(false);
  const [showDeleteItemKeluarModal, setShowDeleteItemKeluarModal] = useState(false);

  const [selectedItemKeluarId, setSelectedItemKeluarId] = useState(null);
  const [tanggalKeluar, setTanggalKeluar] = useState(null);
  const [keteranganKeluar, setKeteranganKeluar] = useState(null);
  const [qtyKeluar, setQtyKeluar] = useState(null);

  const [kategoriSearch, setKategoriSearch] = useState("All");

  const refreshData = () => {
    setGambar(null);
    setKeterangan(null);
    setHarga(null);
    setKategori(null);
  }

  const refreshDataItemMasuk = () => {
    setTanggalMasuk(null);
    setKeteranganMasuk(null);
    setQtyMasuk(null);
  }

  const refreshDataItemKeluar = () => {
    setTanggalKeluar(null);
    setKeteranganKeluar(null);
    setQtyKeluar(null);
  }


  function pasteImage(modal) {
    navigator.clipboard.read().then(clipboardItems => {
      clipboardItems.forEach(item => {
        if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
          item.getType('image/png').then(blob => {
            const file = new File([blob], 'pasted-image.png', { type: 'image/png' });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(new File([blob], 'pasted-image.png', { type: 'image/png' }));
            const inputElement = document.querySelector('input[type="file"]');
            inputElement.files = dataTransfer.files;
            if (modal == "addProduct") {
              setGambar(file);
            }
          });
        }
      });
    });
  }

  const fetchDataStock = async () => {
    try {
      const res = await fetch(`${baseUrl}/stock/get`);
      const data = await res.json();
      setDataStock(data);
    } catch (err) {
      console.error('Error fetching Stock:', err);
    }
  };

  const fetchDataStockMasuk = async () => {
    try {
      const res = await fetch(`${baseUrl}/stockMasuk/get`);
      const data = await res.json();
      setDataStockMasuk(data);
    } catch (err) {
      console.error('Error fetching StockMasuk:', err);
    }
  };

  const fetchDataStockKeluar = async () => {
    try {
      const res = await fetch(`${baseUrl}/stockKeluar/get`);
      const data = await res.json();
      setDataStockKeluar(data);
    } catch (err) {
      console.error('Error fetching StockKeluar:', err);
    }
  };

  useEffect(() => {
    fetchDataStock();
    fetchDataStockMasuk();
    fetchDataStockKeluar();
  }, []);


  const handleSubmitData = async () => {
    setShowTambahDataModal(false);
  
    try {
      const formData = new FormData();
      formData.append("keterangan", keterangan);
      formData.append("harga", harga);
      formData.append("kategori", kategori);
      if (gambar) {
        formData.append("image", gambar);
      }
  
      const res = await fetch(`${baseUrl}/stock/create`, {
        method: "POST",
        body: formData,
      });
  
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal menambahkan data");
      }
  
      const result = await res.json();
      console.log("Stock berhasil ditambahkan:", result);
  
      fetchDataStock();
    } catch (e) {
      console.error("Error menambahkan stock:", e.message);
    }
  };
  

  const handleEditData = () => {
    setSelectedDataId(selectedData.id);
    setGambar(null);
    setKeterangan(selectedData.keterangan);
    setHarga(selectedData.harga);
    setKategori(selectedData.kategori);
    setShowEditDataModal(true);
  }


  const handleSubmitEditData = async () => {
    setShowEditDataModal(false);
  
    try {
      const formData = new FormData();
      formData.append("id", selectedDataId);
      formData.append("keterangan", keterangan);
      formData.append("harga", harga);
      formData.append("kategori", kategori);
      if (gambar) {
        formData.append("image", gambar);
      }
  
      const res = await fetch(`${baseUrl}/stock/update`, {
        method: "PUT",
        body: formData,
      });
  
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal mengupdate data");
      }
  
      const result = await res.json();
      console.log("Data stock berhasil diupdate:", result);
      fetchDataStock();
    } catch (e) {
      console.error("Error saat mengupdate stock:", e.message);
    }
  };
  

  const handleDeleteData = async () => {
    setShowDeleteDataModal(false);
  
    try {
      const res = await fetch(`${baseUrl}/stock/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: selectedDataId }),
      });
  
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Gagal menghapus data");
      }
  
      const result = await res.json();
      console.log("✅ Data berhasil dihapus:", result.message);
  
      // Refresh data
      fetchDataStock();
      fetchDataStockMasuk();
      fetchDataStockKeluar();
    } catch (e) {
      console.error("Error saat menghapus data:", e.message);
    }
  };
  

  const handleSubmitAddItemMasuk = async () => {
    setShowAddItemMasukModal(false);
  
    try {
      const response = await fetch(`${baseUrl}/stockMasuk/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tanggal: tanggalMasuk,
          keterangan: keteranganMasuk,
          qty: qtyMasuk,
          idStock: selectedData.id,
        }),
      });
  
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Gagal menambahkan data StockMasuk");
      }
  
      const result = await response.json();
      console.log("✅ StockMasuk ditambahkan:", result.insertedId);
  
      fetchDataStockMasuk();
    } catch (e) {
      console.error("❌ Error:", e.message);
    }
  };
  

  const handleSubmitEditItemMasuk = async () => {
    setShowEditItemMasukModal(false);
  
    try {
      const response = await fetch(`${baseUrl}/stockMasuk/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedItemMasukId,
          tanggal: tanggalMasuk,
          keterangan: keteranganMasuk,
          qty: qtyMasuk,
        }),
      });
  
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Gagal mengupdate item");
      }
  
      fetchDataStockMasuk();
    } catch (e) {
      console.error("❌ Error update StockMasuk:", e.message);
    }
  };
  

  const handleSubmitDeleteItemMasuk = async () => {
    setShowDeleteItemMasukModal(false);
  
    try {
      const response = await fetch(`${baseUrl}/stockMasuk/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedItemMasukId,
        }),
      });
  
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Gagal menghapus item");
      }
  
      fetchDataStockMasuk();
    } catch (e) {
      console.error("❌ Error hapus StockMasuk:", e.message);
    }
  };
  

  const handleSubmitAddItemKeluar = async () => {
    setShowAddItemKeluarModal(false);
  
    try {
      const response = await fetch(`${baseUrl}/stockKeluar/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tanggal: tanggalKeluar,
          keterangan: keteranganKeluar,
          qty: qtyKeluar,
          idStock: selectedData.id,
        }),
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal menambahkan StockKeluar");
      }
  
      fetchDataStockKeluar();
    } catch (e) {
      console.error("❌ Error tambah StockKeluar:", e.message);
    }
  };
  

  const handleSubmitEditItemKeluar = async () => {
    setShowEditItemKeluarModal(false);
  
    try {
      const response = await fetch(`${baseUrl}/stockKeluar/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedItemKeluarId,
          tanggal: tanggalKeluar,
          keterangan: keteranganKeluar,
          qty: qtyKeluar,
        }),
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal mengupdate StockKeluar");
      }
  
      fetchDataStockKeluar();
    } catch (e) {
      console.error("❌ Error update StockKeluar:", e.message);
    }
  };
  

  const handleSubmitDeleteItemKeluar = async () => {
    setShowDeleteItemKeluarModal(false);
  
    try {
      const response = await fetch(`${baseUrl}/stockKeluar/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedItemKeluarId,
        }),
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal menghapus item");
      }
  
      fetchDataStockKeluar();
    } catch (e) {
      console.error("❌ Error hapus StockKeluar:", e.message);
    }
  };
  

  // untuk invoice summary
  const [isScrolledInvoiceSummary, setIsScrolledInvoiceSummary] = useState(false);
  const scrollableElementRefInvoiceSummary = useRef(null); // Mengacu ke elemen yang di-scroll

  useEffect(() => {
    const handleScroll = () => {
      if (scrollableElementRefInvoiceSummary.current) {
        const scrollTop = scrollableElementRefInvoiceSummary.current.scrollTop;
        setIsScrolledInvoiceSummary(scrollTop > 50); // Cek jika elemen yang di-scroll melebihi 50px
      }
    };

    const element = scrollableElementRefInvoiceSummary.current;

    // Tambahkan event listener untuk elemen yang di-scroll
    if (element) {
      element.addEventListener("scroll", handleScroll);
    }

    // Hapus event listener ketika komponen di-unmount
    return () => {
      if (element) {
        element.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  return (
    <>
      <Container>
        <Col md={12} ref={scrollableElementRefInvoiceSummary} className='lowonganPekerjaan overflow-auto pekerjaan px-2'>


          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            ...(isMobile ? { top: -1 } : { top: 0 }),
            zIndex: 1,
            padding: '10px',
            backgroundColor: isScrolledInvoiceSummary ? (globalTheme === "light" ? "rgba(243, 243, 243, 0.7)" : "rgba(21, 21, 21, 0.7)") : "transparent",
            color: globalTheme === "light" ? "black" : 'white',
            transition: "background-color 1s ease",
          }}>
            <h4 style={{ margin: 0 }}>Stock</h4>

            <div>
              <select
                style={{
                  fontSize: '16px',
                  padding: '0px 12px',
                  borderRadius: '10px',
                  border: '1px solid #ccc',
                  outline: 'none',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  backgroundColor: '#fff',
                }}
                onChange={(e) => setKategoriSearch(e.target.value)} // Menangani perubahan
              >
                <option value="All">All</option>
                <option value="Bahan Baku">Bahan Baku</option>
                <option value="Barang Jadi">Barang Jadi</option>
                <option value="Perlengkapan">Perlengkapan</option>
                <option value="Kayu">Kayu</option>
              </select>
              <MdFormatListBulletedAdd style={{ marginLeft: "10px", marginBottom: "3px" }} size={25} onClick={() => { setShowTambahDataModal(true); refreshData(); }} />
            </div>
          </div>


          <div style={{
            maxHeight: '80vh',
            border: '1px solid #ddd',
            borderRadius: '12px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
            padding: '6px',
            backgroundColor: 'white',
            overflowX: 'auto'
          }}>
            <table className="table table-striped table-hover"
              style={{
                borderCollapse: 'collapse',
                width: '100%',
                minWidth: '900px',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>

              {/* Header Sticky */}
              <thead className="table-light"
                style={{
                  position: 'sticky',
                  top: 0,
                  backgroundColor: '#f8f9fa',
                  zIndex: 10,
                  boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
                  fontWeight: 'bold',
                  textAlign: 'left',
                  display: 'table',
                  width: '100%',
                  tableLayout: 'fixed'
                }}>
                <tr>
                  <th style={{ paddingY: '12px', color: "#354985" }}>No</th>
                  <th style={{ paddingY: '12px', color: "#354985" }}>Gambar</th>
                  <th style={{ paddingY: '12px', color: "#354985" }}>Keterangan</th>
                  <th style={{ paddingY: '12px', color: "#354985" }}>Harga</th>
                  <th style={{ paddingY: '12px', color: "#354985" }}>Qty</th>
                  <th style={{ paddingY: '12px', color: "#354985" }}>Total</th>
                  <th style={{ paddingY: '12px', color: "#354985" }}>Kategori</th>
                </tr>
              </thead>

              {/* Isi Tabel Scrollable */}
              <tbody style={{
                display: 'block',
                maxHeight: '70vh',
                overflowY: 'auto',
                scrollbarWidth: 'thin', /* Firefox */
                scrollbarColor: '#ccc transparent', /* Firefox */
                width: '100%',
                tableLayout: 'fixed'
              }}>
                {Array.isArray(dataStock) && dataStock.length > 0 ? (
                  <>
                    {dataStock
                      .filter((item) => kategoriSearch === "All" || item.kategori === kategoriSearch) // Filter berdasarkan kategoriSearch
                      .map((item, index) => {
                        const totalMasuk = dataStockMasuk
                          .filter((masuk) => masuk.idStock === item.id)
                          .reduce((total, masuk) => total + Number(masuk.qty), 0);

                        const totalKeluar = dataStockKeluar
                          .filter((keluar) => keluar.idStock === item.id)
                          .reduce((total, keluar) => total + Number(keluar.qty), 0);

                        const qty = totalMasuk - totalKeluar;

                        return (
                          <tr
                            key={index}
                            style={{
                              borderBottom: '1px solid #eee',
                              transition: 'background 0.2s',
                              cursor: 'pointer',
                              display: 'table',
                              width: '100%',
                              tableLayout: 'fixed'
                            }}
                            onClick={() => {
                              setShowDetailDataModal(true);
                              setSelectedData(item);
                            }}
                          >
                            <td>{index + 1}</td>
                            <td>
                              {item.image && item.image !== '' && (
                                <span
                                  style={{ marginRight: "1vh" }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  <Image width={'5vw'} height={'auto'} src={getImageUrl(item.image)} style={{ borderRadius: "12px" }} />
                                </span>
                              )}
                            </td>
                            <td>{item.keterangan}</td>
                            <td>Rp. {Number(item.harga).toLocaleString('id-ID')}</td>
                            <td>
                              {qty !== null && qty !== undefined
                                ? (Number.isInteger(parseFloat(qty))
                                  ? parseInt(qty)
                                  : parseFloat(qty).toFixed(2))
                                : '0'}
                            </td> {/* Kolom Qty */}
                            <td>Rp. {(qty * item.harga).toLocaleString('id-ID')}</td> {/* Kolom Total */}
                            <td>{item.kategori}</td>
                          </tr>
                        );
                      })}
                    <tr
                      style={{
                        borderTop: '1px solid rgba(122, 122, 122, 0.4)',
                        borderBottom: '1px solid #eee',
                        transition: 'background 0.2s',
                        cursor: 'pointer',
                        display: 'table',
                        width: '100%',
                        tableLayout: 'fixed'
                      }}>
                      <td style={{ backgroundColor: "#F8F9FA" }} className='fw-semibold' colSpan={5}>Total</td>
                      <td style={{ backgroundColor: "#F8F9FA" }} className='fw-semibold' colSpan={2}>
                        Rp. {dataStock
                          .filter((item) => kategoriSearch === "All" || item.kategori === kategoriSearch) // Filter berdasarkan kategoriSearch
                          .reduce((total, item) => {
                            const totalMasuk = dataStockMasuk
                              .filter((masuk) => masuk.idStock === item.id)
                              .reduce((sum, masuk) => sum + Number(masuk.qty), 0);
                            const totalKeluar = dataStockKeluar
                              .filter((keluar) => keluar.idStock === item.id)
                              .reduce((sum, keluar) => sum + Number(keluar.qty), 0);
                            const qty = totalMasuk - totalKeluar;
                            return total + qty * item.harga;
                          }, 0)
                          .toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr style={{
                    borderBottom: '1px solid #eee',
                    transition: 'background 0.2s',
                    cursor: 'pointer',
                    display: 'table',
                    width: '100%',
                    tableLayout: 'fixed'
                  }}>
                    <td colSpan="7">No data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>





        </Col>
      </Container>

      {/* Modal */}
      <Modal
        show={showDetailDataModal}
        onHide={() => setShowDetailDataModal(false)}
        size="xl"
        aria-labelledby="detailModalLabel"
      >
        <Modal.Header closeButton>
          <div className="d-flex align-items-center">
            <Modal.Title id="detailModalLabel">Detail Stock</Modal.Title>
            <CiEdit className="ms-2" size={24} onClick={() => { handleEditData(); setShowDetailDataModal(false) }} />
          </div>
        </Modal.Header>
        <Modal.Body>

          <div>
            <Row className="align-items-start">
              {/* Kolom Kiri: Nama dan Tanggal */}
              <Col md={6} className="text-left">
                <p><span className='fw-semibold'>Keterangan :</span> {selectedData?.keterangan}</p>
                <p><span className='fw-semibold'>Kategori :</span> {selectedData?.kategori}</p>
              </Col>

              {/* Kolom Kanan: Piutang dan Sisa */}
              <Col md={6} className="text-right">
                <p><span className='fw-semibold'>Harga :</span> Rp. {Number(selectedData?.harga).toLocaleString('id-ID')}</p>
                <p>
                  <span className="fw-semibold">Quantity :</span>{' '}
                  {
                    (() => {
                      const stockMasuk = dataStockMasuk && selectedData
                        ? dataStockMasuk
                          .filter((item) => item.idStock === selectedData.id)
                          .reduce((total, item) => total + Number(item.qty), 0)
                        : 0;

                      const stockKeluar = dataStockKeluar && selectedData
                        ? dataStockKeluar
                          .filter((item) => item.idStock === selectedData.id)
                          .reduce((total, item) => total + Number(item.qty), 0)
                        : 0;

                      const quantity = stockMasuk - stockKeluar;

                      return Number.isInteger(quantity)
                        ? quantity
                        : quantity.toFixed(2);
                    })()
                  }
                </p>


                <p>
                  <span className="fw-semibold">Total : </span>Rp. {' '}
                  {
                    // Pastikan dataStockMasuk dan dataStockKeluar ada dan selectedData juga valid
                    (
                      ((dataStockMasuk && selectedData ?
                        dataStockMasuk.filter((item) => item.idStock === selectedData.id).reduce((total, item) => total + Number(item.qty), 0) : 0) -
                        (dataStockKeluar && selectedData ?
                          dataStockKeluar.filter((item) => item.idStock === selectedData.id).reduce((total, item) => total + Number(item.qty), 0) : 0)) *
                      (selectedData?.harga ? Number(selectedData.harga) : 0)
                    ).toLocaleString('id-ID')
                  }
                </p>

              </Col>
            </Row>
          </div>

          {/* Stock Masuk */}
          <div className="d-flex justify-content-between align-items-center mb-1">
            <p className="mb-1 fw-semibold">Stock Masuk</p>
            <MdFormatListBulletedAdd className="ms-2" size={24} onClick={() => { setShowAddItemMasukModal(true); refreshDataItemMasuk(); }} />
          </div>
          <table className="table table-striped table-hover">
            <thead className="table-light">
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Keterangan</th>
                <th>Qty</th>
              </tr>
            </thead>
            <tbody>
              {dataStockMasuk?.filter(item => item.idStock === selectedData?.id)
                .map((item, index) => (
                  <tr key={index}
                    onClick={() => { setShowEditItemMasukModal(true); setSelectedItemMasukId(item.id); setTanggalMasuk(item.tanggal); setKeteranganMasuk(item.keterangan); setQtyMasuk(item.qty) }}
                  >
                    <td>{index + 1}</td>
                    <td>{new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                    <td>{item.keterangan}</td>
                    <td>{item.qty}</td>
                  </tr>
                ))}
            </tbody>
          </table>

          {/* Stock Keluar */}
          <div className="d-flex justify-content-between align-items-center mb-1">
            <p className="mb-1 fw-semibold">Stock Keluar</p>
            <MdFormatListBulletedAdd className="ms-2" size={24} onClick={() => { setShowAddItemKeluarModal(true); refreshDataItemKeluar(); }} />
          </div>
          <table className="table table-striped table-hover">
            <thead className="table-light">
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Keterangan</th>
                <th>Qty</th>
              </tr>
            </thead>
            <tbody>
              {dataStockKeluar?.filter(item => item.idStock === selectedData?.id)
                .map((item, index) => (
                  <tr key={index}
                    onClick={() => { setShowEditItemKeluarModal(true); setSelectedItemKeluarId(item.id); setTanggalKeluar(item.tanggal); setKeteranganKeluar(item.keterangan); setQtyKeluar(item.qty) }}
                  >
                    <td>{index + 1}</td>
                    <td>{new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                    <td>{item.keterangan}</td>
                    <td>{item.qty}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Modal.Body>
      </Modal>

      {/* Modal */}
      <Modal show={showTambahDataModal} onHide={() => setShowTambahDataModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Tambah Data</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Your comment form here */}
          <label className='mt-2'>Gambar :</label>
          <div className='d-flex'>
            <input className="form-control" type="file"
              onChange={(e) => {
                const paymentFiles = e.target.files;
                setGambar(paymentFiles[0]);
              }}
            />
            <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('addProduct')}><FaPaste /></Button>
          </div>
          <label className='mt-2'>Keterangan :</label>
          <input className="form-control" type='text' onChange={useCallback(debounce((e) => setKeterangan(e.target.value), 300), [])}></input>
          <label className='mt-2'>Harga :</label>
          <input className="form-control" type='number' onChange={useCallback(debounce((e) => setHarga(e.target.value), 300), [])}></input>
          <label className='mt-2'>Kategori :</label>
          <select className="form-control" onChange={(e) => setKategori(e.target.value)}>
            <option value="-">-</option>
            <option value="Bahan Baku">Bahan Baku</option>
            <option value="Barang Jadi">Barang Jadi</option>
            <option value="Perlengkapan">Perlengkapan</option>
            <option value="Kayu">Kayu</option>
          </select>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" style={{ marginLeft: "290px" }} onClick={handleSubmitData}>Submit</Button>
        </Modal.Footer>
      </Modal>
      {/* End Modal */}

      <Modal show={showEditDataModal} onHide={() => setShowEditDataModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Data</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Your comment form here */}
          <label className='mt-2'>Gambar :</label>
          <div className='d-flex'>
            <input className="form-control" type="file"
              onChange={(e) => {
                const paymentFiles = e.target.files;
                setGambar(paymentFiles[0]);
              }}
            />
            <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('addProduct')}><FaPaste /></Button>
          </div>
          <label className='mt-2'>Keterangan :</label>
          <input className="form-control" type='text' defaultValue={keterangan} onChange={useCallback(debounce((e) => setKeterangan(e.target.value), 300), [])}></input>
          <label className='mt-2'>Harga :</label>
          <input className="form-control" type='number' defaultValue={harga} onChange={useCallback(debounce((e) => setHarga(e.target.value), 300), [])}></input>
          <label className='mt-2'>Kategori :</label>
          <select className="form-control" defaultValue={kategori} onChange={(e) => setKategori(e.target.value)}>
            <option value="-">-</option>
            <option value="Bahan Baku">Bahan Baku</option>
            <option value="Barang Jadi">Barang Jadi</option>
            <option value="Perlengkapan">Perlengkapan</option>
            <option value="Kayu">Kayu</option>
          </select>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={() => { setShowDeleteDataModal(true); setShowEditDataModal(false) }}>Delete</Button>
          <Button variant="primary" onClick={() => handleSubmitEditData()}>Submit</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDeleteDataModal} onHide={() => setShowDeleteDataModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this data?</Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={handleDeleteData}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal */}
      <Modal show={showAddItemMasukModal} onHide={() => setShowAddItemMasukModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Item Masuk</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Your comment form here */}
          <label className='mt-2'>Tanggal :</label>
          <input className="form-control" type='date' defaultValue={tanggalMasuk} onChange={(e) => setTanggalMasuk(e.target.value)} required></input>
          <label className='mt-2'>Keterangan :</label>
          <input className="form-control" type='text' defaultValue={keteranganMasuk} onChange={useCallback(debounce((e) => setKeteranganMasuk(e.target.value), 300), [])}></input>
          <label className='mt-2'>Qty :</label>
          <input className="form-control" type='number' defaultValue={qtyMasuk} onChange={useCallback(debounce((e) => setQtyMasuk(e.target.value), 300), [])}></input>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleSubmitAddItemMasuk} style={{ marginLeft: "150px" }}>Submit</Button>
        </Modal.Footer>
      </Modal>
      {/* End Modal */}

      {/* Modal */}
      <Modal show={showEditItemMasukModal} onHide={() => setShowEditItemMasukModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Item Masuk</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Your comment form here */}
          <label className='mt-2'>Tanggal :</label>
          <input className="form-control" type='date' defaultValue={tanggalMasuk} onChange={(e) => setTanggalMasuk(e.target.value)} required></input>
          <label className='mt-2'>Keterangan :</label>
          <input className="form-control" type='text' defaultValue={keteranganMasuk} onChange={useCallback(debounce((e) => setKeteranganMasuk(e.target.value), 300), [])}></input>
          <label className='mt-2'>Qty :</label>
          <input className="form-control" type='number' defaultValue={qtyMasuk} onChange={useCallback(debounce((e) => setQtyMasuk(e.target.value), 300), [])}></input>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={() => { setShowDeleteItemMasukModal(true); setShowEditItemMasukModal(false) }}>Delete</Button>
          <Button variant="primary" onClick={handleSubmitEditItemMasuk}>Submit</Button>
        </Modal.Footer>
      </Modal>
      {/* End Modal */}

      <Modal show={showDeleteItemMasukModal} onHide={() => setShowDeleteItemMasukModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this data?</Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={handleSubmitDeleteItemMasuk}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal */}
      <Modal show={showAddItemKeluarModal} onHide={() => setShowAddItemKeluarModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Item Keluar</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Your comment form here */}
          <label className='mt-2'>Tanggal :</label>
          <input className="form-control" type='date' defaultValue={tanggalKeluar} onChange={(e) => setTanggalKeluar(e.target.value)} required></input>
          <label className='mt-2'>Keterangan :</label>
          <input className="form-control" type='text' defaultValue={keteranganKeluar} onChange={useCallback(debounce((e) => setKeteranganKeluar(e.target.value), 300), [])}></input>
          <label className='mt-2'>Qty :</label>
          <input className="form-control" type='number' defaultValue={qtyKeluar} onChange={useCallback(debounce((e) => setQtyKeluar(e.target.value), 300), [])}></input>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleSubmitAddItemKeluar} style={{ marginLeft: "150px" }}>Submit</Button>
        </Modal.Footer>
      </Modal>
      {/* End Modal */}

      {/* Modal */}
      <Modal show={showEditItemKeluarModal} onHide={() => setShowEditItemKeluarModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Item Keluar</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Your comment form here */}
          <label className='mt-2'>Tanggal :</label>
          <input className="form-control" type='date' defaultValue={tanggalKeluar} onChange={(e) => setTanggalKeluar(e.target.value)} required></input>
          <label className='mt-2'>Keterangan :</label>
          <input className="form-control" type='text' defaultValue={keteranganKeluar} onChange={useCallback(debounce((e) => setKeteranganKeluar(e.target.value), 300), [])}></input>
          <label className='mt-2'>Qty :</label>
          <input className="form-control" type='number' defaultValue={qtyKeluar} onChange={useCallback(debounce((e) => setQtyKeluar(e.target.value), 300), [])}></input>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={() => { setShowDeleteItemKeluarModal(true); setShowEditItemKeluarModal(false) }}>Delete</Button>
          <Button variant="primary" onClick={handleSubmitEditItemKeluar}>Submit</Button>
        </Modal.Footer>
      </Modal>
      {/* End Modal */}

      <Modal show={showDeleteItemKeluarModal} onHide={() => setShowDeleteItemKeluarModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this data?</Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={handleSubmitDeleteItemKeluar}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

    </>
  );
};



export default Stock;
