import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Col, Row, Modal, Button, Container, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { MdFormatListBulletedAdd } from 'react-icons/md';
import { CiEdit } from 'react-icons/ci';
import { debounce } from 'lodash';
import { FaFileInvoice, FaPaste, FaSearch } from 'react-icons/fa';
import { Image } from 'antd';
import { getImageUrl } from '../../Utils/image';

const Piutang = () => {
  const baseUrl = getApiBaseUrl();
  const [showDetailDataModal, setShowDetailDataModal] = useState(false);
  const [showTambahDataModal, setShowTambahDataModal] = useState(false);
  const [showEditDataModal, setShowEditDataModal] = useState(false);
  const [showConfirmDeleteData, setShowConfirmDeleteData] = useState(false);
  const [nama, setNama] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [idDataEdit, setIdDataEdit] = useState('');
  const [dataPiutang, setDataPiutang] = useState([]);
  const [dataPiutangItem, setDataPiutangItem] = useState([]);
  const [dataPiutangPayment, setDataPiutangPayment] = useState([]);
  const [selectedPiutang, setSelectedPiutang] = useState([]);

  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
  const [keterangan, setKeterangan] = useState('');
  const [nominal, setNominal] = useState('');
  const [selectedPiutangItemId, setSelectedPiutangItemId] = useState([]);

  const [itemFileToUpload, setItemFileToUpload] = useState(null);
  const [fileToUploadItemEdit, setFileToUploadItemEdit] = useState(null);
  const [itemImageDelete, setItemImageDelete] = useState(false);
  const [itemImageEdit, setItemImageEdit] = useState('');

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentFileToUpload, setPaymentFileToUpload] = useState(null);
  const [paymentDetail, setPaymentDetail] = useState('');
  const [paymentTanggal, setPaymentTanggal] = useState('');
  const [paymentJumlah, setPaymentJumlah] = useState('');

  const [idPaymentEdit, setIdPaymentEdit] = useState('');
  const [fileToUploadPaymentEdit, setFileToUploadPaymentEdit] = useState(null);
  const [detailEdit, setDetailEdit] = useState('');
  const [tanggalEdit, setTanggalEdit] = useState('');
  const [jumlahEdit, setJumlahEdit] = useState('');
  const [paymentImageEdit, setPaymentImageEdit] = useState('');
  const [paymentImageDelete, setPaymentImageDelete] = useState(false);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [showDeletePaymentModal, setShowDeletePaymentModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState([]);

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
        window.location.replace('/accounting');
      }
    };

    cekLogin();
  }, []);

  const tableContainerStyle = {
    marginLeft: '20px',
    marginRight: '20px',
    marginTop: '10px',
    overflow: 'hidden',
    borderRadius: '10px',
    border: '1px solid #dddddd',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0',
  };

  const thTdStyle = {
    border: '1px solid #c2c2c2',
    textAlign: 'left',
    padding: '8px',
    fontSize: '12px',
  };

  const thStyle = {
    ...thTdStyle,
    backgroundColor: 'blue',
    textAlign: 'center',
    color: 'white',
    position: 'sticky',
    top: 0,
    zIndex: 1
  };

  const tbodyTrOddStyle = {
    backgroundColor: '#ffffff',
  };

  const tbodyTrEvenStyle = {
    backgroundColor: '#F4F4F4',
  };

  const tbodyTrTotalStyle = {
    backgroundColor: '#E7E7E8',
  };

  const tbodyTrLastChildTdFirstChildStyle = {
    borderBottomLeftRadius: '10px',
  };

  const tbodyTrLastChildTdLastChildStyle = {
    borderBottomRightRadius: '10px',
  };


  const handleSubmitTambahData = async () => {
    setShowTambahDataModal(false);

    try {
      const response = await fetch(`${baseUrl}/piutang/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nama,
          tanggal, // pastikan ini string, misalnya "2025-04-09"
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menambahkan data');
      }

      console.log('Berhasil tambah data, ID:', result.insertedId);
    } catch (e) {
      console.error('Error adding document via API:', e);
    }

    fetchDataPiutang(); // Refresh data setelah submit
  };


  const fetchDataPiutang = async () => {
    try {
      const res = await fetch(`${baseUrl}/piutang/get`);
      const data = await res.json();
      setDataPiutang(data); // sesuaikan kalau struktur respons bukan `data`
    } catch (err) {
      console.error('Error fetching Piutang:', err);
    }
  };

  const fetchDataPiutangItem = async () => {
    try {
      const res = await fetch(`${baseUrl}/piutangItem/get`);
      const data = await res.json();
      setDataPiutangItem(data);
    } catch (err) {
      console.error('Error fetching PiutangItem:', err);
    }
  };

  const fetchDataPiutangPayment = async () => {
    try {
      const res = await fetch(`${baseUrl}/piutangPayment/get`);
      const data = await res.json();
      setDataPiutangPayment(data);
    } catch (err) {
      console.error('Error fetching PiutangPayment:', err);
    }
  };


  useEffect(() => {
    fetchDataPiutang();
    fetchDataPiutangItem();
    fetchDataPiutangPayment();
  }, []);


  const handleEditData = () => {
    setIdDataEdit(selectedPiutang.id);
    setNama(selectedPiutang.nama);
    setTanggal(selectedPiutang.tanggal);
    setShowEditDataModal(true);
  }

  const handleSubmitEditData = async () => {
    setShowEditDataModal(false);

    try {
      const response = await fetch(`${baseUrl}/piutang/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: idDataEdit,
          nama,
          tanggal,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal update data');
      }

      console.log('Data berhasil diupdate:', result.message);
    } catch (e) {
      console.error('Error updating document via API:', e);
    }

    fetchDataPiutang(); // refresh data setelah update
  };


  const handleSubmitDeleteData = async () => {
    setShowConfirmDeleteData(false);

    try {
      const response = await fetch(`${baseUrl}/piutang/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: idDataEdit }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menghapus data');
      }

      console.log('Data berhasil dihapus:', result.message);
    } catch (e) {
      console.error('Error deleting document via API:', e);
    }

    fetchDataPiutang();
    fetchDataPiutangItem();
    fetchDataPiutangPayment();
  };



  const refreshData = () => {
    setNama('');
    setTanggal('');
  }

  const refreshDataItem = () => {
    setKeterangan('');
    setNominal('');
  }

  const refreshDataPayment = () => {
    setPaymentDetail('');
    setPaymentTanggal('');
    setPaymentJumlah('');
    setPaymentFileToUpload(null);
    setItemFileToUpload(null);
  }

  const handleSubmitAddItem = async () => {
    setShowAddItemModal(false);

    try {
      const formData = new FormData();
      formData.append('idPiutang', selectedPiutang.id);
      formData.append('nominal', nominal);
      formData.append('keterangan', keterangan);

      if (itemFileToUpload) {
        formData.append('image', itemFileToUpload);
      }

      await fetch(`${baseUrl}/piutangItem/create`, {
        method: 'POST',
        body: formData,
      });

      fetchDataPiutangItem(); // refresh data
    } catch (e) {
      console.error('Error adding document via API: ', e);
    }
  };


  const handleSubmitEditItem = async () => {
    setShowEditItemModal(false);

    try {
      const formData = new FormData();
      formData.append('keterangan', keterangan);
      formData.append('nominal', nominal);

      if (fileToUploadItemEdit) {
        // Jika ada gambar yang diunggah
        formData.append('image', fileToUploadItemEdit);
      }

      // Mengirimkan informasi tentang apakah gambar harus dihapus
      formData.append('itemImageDelete', itemImageDelete);

      // Mengirimkan permintaan ke API untuk update pembayaran
      await fetch(`${baseUrl}/piutangItem/update/${selectedPiutangItemId}`, {
        method: 'PUT',
        body: formData,
      });


      fetchDataPiutangItem(); // refresh data
    } catch (e) {
      console.error('Error saat update item:', e);
    }
  };


  const handleDeleteItem = async () => {
    setShowDeleteItemModal(false);

    try {
      const res = await fetch(`${baseUrl}/piutangItem/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedPiutangItemId,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        console.error('Gagal hapus PiutangItem:', result.message);
      }

      fetchDataPiutangItem(); // Refresh data
    } catch (e) {
      console.error('Error saat menghapus item:', e);
    }
  };


  const handleSubmitPayment = async () => {
    setShowPaymentModal(false);

    try {
      const formData = new FormData();
      formData.append('idPiutang', selectedPiutang.id);
      formData.append('detail', paymentDetail);
      formData.append('tanggal', paymentTanggal);
      formData.append('jumlah', paymentJumlah);

      if (paymentFileToUpload) {
        formData.append('image', paymentFileToUpload);
      }

      await fetch(`${baseUrl}/piutangPayment/create`, {
        method: 'POST',
        body: formData,
      });

      fetchDataPiutangPayment(); // refresh data
    } catch (e) {
      console.error('Error adding document: ', e);
    }
  };




  const handleSubmitEditPayment = async () => {
    setShowEditPaymentModal(false);

    try {
      const formData = new FormData();
      formData.append('detail', detailEdit);
      formData.append('tanggal', tanggalEdit);
      formData.append('jumlah', jumlahEdit);

      if (fileToUploadPaymentEdit) {
        // Jika ada gambar yang diunggah
        formData.append('image', fileToUploadPaymentEdit);
      }

      // Mengirimkan informasi tentang apakah gambar harus dihapus
      formData.append('paymentImageDelete', paymentImageDelete);

      // Mengirimkan permintaan ke API untuk update pembayaran
      await fetch(`${baseUrl}/piutangPayment/update/${idPaymentEdit}`, {
        method: 'PUT',
        body: formData,
      });

      // Mengambil data setelah pembaruan
      fetchDataPiutangPayment();

    } catch (e) {
      console.error('Error updating payment: ', e);
    }
  };


  const handleDeletePayment = async () => {
    setShowDeletePaymentModal(false);
    await fetch(`${baseUrl}/piutangPayment/delete/${idPaymentEdit}`, {
      method: 'DELETE',
    });
    fetchDataPiutangPayment();
  };




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
              setFileToUpload(file);
            }
            if (modal == "editProduct") {
              setFileToUploadEdit(file);
            }
            if (modal == "addPayment") {
              setPaymentFileToUpload(file);
            }
            if (modal == "editPayment") {
              setFileToUploadPaymentEdit(file);
            }
            if (modal == "addItem") {
              setItemFileToUpload(file);
            }
            if (modal == "editItem") {
              setFileToUploadItemEdit(file);
            }
          });
        }
      });
    });
  }

  let grandTotalPiutang = 0;
  let grandTotalSisa = 0;

  useEffect(() => {
    setFilteredData(dataPiutang.filter((item) => item.nama.toLowerCase().includes(searchTerm.toLowerCase())));
  }, [searchTerm, dataPiutang]);

  return (
    <>
      <Container>
        <div className='mt-4 px-4'>
          <div className='row'>
            <div className='col d-flex justify-content-between'>
              <Dropdown>
                <Dropdown.Toggle variant="light" id="dropdown-basic" className="text-sm px-2 py-1" style={{ border: "1px solid blue", borderRadius: "5px", color: "blue" }}>
                  Piutang
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/accounting/akun" className="dropdown-link">
                    Akun & Saldo Awal
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/customer" className="dropdown-link">
                    Customer
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/supplier" className="dropdown-link">
                    Supplier
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/aset" className="dropdown-link">
                    Aset
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/buku-besar" className="dropdown-link">
                    Buku Besar
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/neraca-saldo" className="dropdown-link">
                    Neraca Saldo
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/laba-rugi-penjualan" className="dropdown-link">
                    Laba - Rugi Penjualan
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/laba-rugi-cash" className="dropdown-link">
                    Laba - Rugi Cash
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/laba-rugi-profit" className="dropdown-link">
                    Laba - Rugi Profit
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/jurnal" className="dropdown-link">
                    Jurnal
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/balance-sheet" className="dropdown-link">
                    Balance Sheet
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/jurnal-penyesuaian" className="dropdown-link">
                    Jurnal Penyesuaian
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/cash-flow" className="dropdown-link">
                    Cash Flow
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/piutang" className="dropdown-link" style={{ color: "blue" }}>
                    Piutang
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/hutang" className="dropdown-link">
                    Hutang
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              <div>
                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ fontSize: '12px', borderRadius: '20px', padding: '5px' }} />
                <MdFormatListBulletedAdd style={{ marginLeft: "10px" }} size={25} onClick={() => { setShowTambahDataModal(true); refreshData(); }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ ...tableContainerStyle, maxHeight: '75vh', overflowY: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>No</th>
                <th style={thStyle}>Tanggal</th>
                <th style={thStyle}>Nama</th>
                <th style={thStyle}>Piutang</th>
                <th style={thStyle}>Sisa</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => {
                // Menghitung totalPiutang
                const totalPiutang = dataPiutangItem
                  .filter(piutangItem => piutangItem.idPiutang === item.id)
                  .reduce((sum, current) => sum + Number(current.nominal), 0);

                // Menghitung total pembayaran
                const totalPayment = dataPiutangPayment
                  .filter(payment => payment.idPiutang === item.id)
                  .reduce((sum, current) => sum + Number(current.jumlah), 0);

                // Menghitung totalSisa
                const totalSisa = totalPiutang - totalPayment;

                // Menambahkan nilai ke total akumulasi
                grandTotalPiutang += totalPiutang;
                grandTotalSisa += totalSisa;

                return (
                  <tr
                    key={index}
                    style={{
                      ...(index % 2 === 0 ? tbodyTrEvenStyle : tbodyTrOddStyle),
                      cursor: 'pointer', // <-- ini yang membuat cursor jadi pointer
                    }}
                    onClick={() => { setShowDetailDataModal(true); setSelectedPiutang(item) }}
                  >
                    <td style={thTdStyle} className="text-center">{index + 1}</td>
                    <td style={thTdStyle}>
                      {format(new Date(item.tanggal), 'dd-MM-yyyy')}
                    </td>
                    <td style={thTdStyle}>{item.nama}</td>
                    <td style={thTdStyle}>Rp. {totalPiutang.toLocaleString('id-ID')}</td>
                    <td style={thTdStyle}>Rp. {totalSisa.toLocaleString('id-ID')}</td>
                  </tr>
                );
              })}
              <tr style={tbodyTrTotalStyle} className='fw-semibold'>
                <td style={thTdStyle} colSpan={3}>Total : </td>
                <td style={thTdStyle}>Rp. {grandTotalPiutang.toLocaleString('id-ID')}</td>
                <td style={thTdStyle}>Rp. {grandTotalSisa.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Modal */}
        <Modal
          show={showDetailDataModal}
          onHide={() => setShowDetailDataModal(false)}
          size="xl"
          aria-labelledby="detailModalLabel"
        >
          <Modal.Header closeButton>
            <div className="d-flex align-items-center">
              <Modal.Title id="detailModalLabel">Detail Piutang</Modal.Title>
              <CiEdit className="ms-2" size={24} onClick={() => { handleEditData(); setShowDetailDataModal(false) }} />
            </div>
          </Modal.Header>
          <Modal.Body>

            <div>
              <Row className="align-items-start">
                {/* Kolom Kiri: Nama dan Tanggal */}
                <Col md={6} className="text-left">
                  <p><span className='fw-semibold'>Nama :</span> {selectedPiutang.nama}</p>
                  <p><span className='fw-semibold'>Tanggal :</span> {selectedPiutang.tanggal
                    ? selectedPiutang.tanggal.split('-').reverse().join('-')
                    : 'Tanggal tidak tersedia'}
                  </p>
                </Col>

                {/* Kolom Kanan: Piutang dan Sisa */}
                <Col md={6} className="text-right">
                  <p>
                    <span className='fw-semibold'>Piutang :</span> Rp.
                    {dataPiutangItem
                      .filter((item) => item.idPiutang === selectedPiutang.id)
                      .reduce((acc, item) => acc + Number(item.nominal), 0).toLocaleString('id-ID')}
                  </p>
                  <p><span className='fw-semibold'>Sisa :</span> Rp. {(dataPiutangItem
                    .filter((item) => item.idPiutang === selectedPiutang.id)
                    .reduce((acc, item) => acc + Number(item.nominal), 0) -
                    dataPiutangPayment
                      .filter((payment) => payment.idPiutang === selectedPiutang.id)
                      .reduce((acc, payment) => acc + Number(payment.jumlah), 0)
                  ).toLocaleString('id-ID')}</p>
                </Col>
              </Row>
            </div>

            {/* Tabel Item */}
            <div className="d-flex justify-content-between align-items-center mb-1">
              <p className="mb-1 fw-semibold">Tabel Item</p>
              <MdFormatListBulletedAdd style={{ cursor: 'pointer' }} className="ms-2" size={24} onClick={() => { setShowAddItemModal(true); refreshDataItem(); }} />
            </div>
            <table className="table table-striped table-hover">
              <thead className="table-light">
                <tr>
                  <th>No</th>
                  <th>Gambar</th>
                  <th>Keterangan</th>
                  <th>Nominal</th>
                </tr>
              </thead>
              <tbody>
                {dataPiutangItem
                  .filter(item => item.idPiutang === selectedPiutang.id)
                  .map((item, index) => (
                    <tr key={index} style={{ cursor: 'pointer' }} onClick={() => { setShowEditItemModal(true); setItemImageDelete(false); setSelectedPiutangItemId(item.id); setItemImageEdit(item.image); setFileToUploadItemEdit(null); setKeterangan(item.keterangan); setNominal(item.nominal) }}>
                      <td>{index + 1}</td>
                      <td>
                        {item.image && item.image !== '' && (
                          <span onClick={(e) => { e.stopPropagation(); }}>
                            <Image
                              src={getImageUrl(item.image)}
                              style={{ maxWidth: '50px' }}
                              preview={{
                                mask: <span>Lihat</span>, // teks saat hover
                                zIndex: 9999, // bisa override zIndex kalau perlu
                              }}
                            />
                          </span>
                        )}
                      </td>
                      <td>{item.keterangan}</td>
                      <td>Rp. {Number(item.nominal).toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {/* Tabel Payment */}
            <div className="d-flex justify-content-between align-items-center mb-1">
              <p className="mb-1 fw-semibold">Tabel Payment</p>
              <MdFormatListBulletedAdd style={{ cursor: 'pointer' }} className="ms-2" size={24} onClick={() => {
                // setShowPaymentModal(true); refreshDataPayment();
                alert('Payment piutang hanya bisa dilakukan melalui jurnal.');
              }} />
            </div>
            <table className="table table-striped table-hover">
              <thead className="table-light">
                <tr>
                  <th>No</th>
                  <th>Gambar</th>
                  <th>Detail</th>
                  <th>Tanggal</th>
                  <th>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {dataPiutangPayment
                  .filter(payment => payment.idPiutang === selectedPiutang.id)
                  .map((payment, index) => (
                    <tr key={index} style={{ cursor: 'pointer' }}
                      onClick={() => {
                        // setShowEditPaymentModal(true); setPaymentImageDelete(false); setIdPaymentEdit(payment.id); setPaymentImageEdit(payment.image); setFileToUploadPaymentEdit(null); setDetailEdit(payment.detail); setTanggalEdit(payment.tanggal); setJumlahEdit(payment.jumlah)
                        alert('Edit payment piutang hanya bisa dilakukan melalui jurnal.');
                      }}>
                      <td>{index + 1}</td>
                      <td>
                        {payment.image && payment.image !== '' && (
                          <span onClick={(e) => { e.stopPropagation(); }}>
                            <Image
                              src={getImageUrl(payment.image)}
                              style={{ maxWidth: '50px' }}
                              preview={{
                                mask: <span>Lihat</span>, // teks saat hover
                                zIndex: 9999, // bisa override zIndex kalau perlu
                              }}
                            />
                          </span>
                        )}
                      </td>
                      <td>{payment.detail}</td>
                      <td>
                        {payment.tanggal && !isNaN(new Date(payment.tanggal).getTime())
                          ? format(new Date(payment.tanggal), 'dd-MM-yyyy')
                          : '-'}
                      </td>
                      <td>Rp. {Number(payment.jumlah).toLocaleString('id-ID')}</td>
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
            <label className='mt-2'>Nama :</label>
            <input className="form-control" type='text' defaultValue={nama} onChange={(e) => setNama(e.target.value)} required></input>
            <label className='mt-2'>Tanggal :</label>
            <input className="form-control" type='date' onChange={(e) => setTanggal(e.target.value)} required></input>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={handleSubmitTambahData} style={{ marginLeft: "290px" }}>Submit</Button>
          </Modal.Footer>
        </Modal>
        {/* End Modal */}

        {/* Modal */}
        <Modal show={showEditDataModal} onHide={() => setShowEditDataModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Data</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Your comment form here */}
            <label className='mt-2'>Nama :</label>
            <input className="form-control" type='text' defaultValue={nama} onChange={(e) => setNama(e.target.value)} required></input>
            <label className='mt-2'>Tanggal :</label>
            <input className="form-control" type='date' defaultValue={tanggal} onChange={(e) => setTanggal(e.target.value)} required></input>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="danger" onClick={() => { setShowConfirmDeleteData(true); setShowEditDataModal(false) }}>Delete</Button>
            <Button variant="primary" onClick={() => handleSubmitEditData()}>Submit</Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showConfirmDeleteData} onHide={() => setShowConfirmDeleteData(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>Are you sure you want to delete this data?</Modal.Body>
          <Modal.Footer>
            <Button variant="danger" onClick={handleSubmitDeleteData}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
        {/* End Modal */}

        {/* Modal */}
        <Modal show={showAddItemModal} onHide={() => setShowAddItemModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Add Item</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Your comment form here */}
            <label className='mt-2'>Gambar :</label>
            <div className='d-flex'>
              <input className="form-control" type="file"
                onChange={(e) => {
                  const itemFiles = e.target.files;
                  setItemFileToUpload(itemFiles[0]);
                }}
              />
              <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('addItem')}><FaPaste /></Button>
            </div>
            <label className='mt-2'>Keterangan :</label>
            <input className="form-control" type='text' defaultValue={keterangan} onChange={useCallback(debounce((e) => setKeterangan(e.target.value), 300), [])}></input>
            <label className='mt-2'>Nominal :</label>
            <input className="form-control" type='number' defaultValue={nominal} onChange={useCallback(debounce((e) => setNominal(e.target.value), 300), [])}></input>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={handleSubmitAddItem} style={{ marginLeft: "150px" }}>Submit</Button>
          </Modal.Footer>
        </Modal>
        {/* End Modal */}

        {/* Modal */}
        <Modal show={showEditItemModal} onHide={() => setShowEditItemModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Item</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Your comment form here */}
            <label className='mt-2'>Gambar :</label>
            <img className='mt-2' style={{ width: "150px", display: itemImageDelete ? "none" : "block" }} src={getImageUrl(itemImageEdit)} onClick={() => setItemImageDelete(true)} />
            <div className='d-flex'>
              <input className="form-control" type="file"
                onChange={(e) => {
                  const filesItemEdit = e.target.files;
                  setFileToUploadItemEdit(filesItemEdit[0]);
                }}
              />
              <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editItem')}><FaPaste /></Button>
            </div>
            <label className='mt-2'>Keterangan :</label>
            <input className="form-control" type='text' defaultValue={keterangan} onChange={useCallback(debounce((e) => setKeterangan(e.target.value), 300), [])}></input>
            <label className='mt-2'>Nominal :</label>
            <input className="form-control" type='number' defaultValue={nominal} onChange={useCallback(debounce((e) => setNominal(e.target.value), 300), [])}></input>

          </Modal.Body>
          <Modal.Footer>
            <Button variant="danger" onClick={() => { setShowDeleteItemModal(true); setShowEditItemModal(false) }}>Delete</Button>
            <Button variant="primary" onClick={handleSubmitEditItem} style={{ marginLeft: "290px" }}>Submit</Button>
          </Modal.Footer>
        </Modal>
        {/* End Modal */}

        <Modal show={showDeleteItemModal} onHide={() => setShowDeleteItemModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>Are you sure you want to delete this item?</Modal.Body>
          <Modal.Footer>
            <Button variant="danger" onClick={handleDeleteItem}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal */}
        <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Add Payment</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Your comment form here */}
            <label className='mt-2'>Gambar :</label>
            <div className='d-flex'>
              <input className="form-control" type="file"
                onChange={(e) => {
                  const paymentFiles = e.target.files;
                  setPaymentFileToUpload(paymentFiles[0]);
                }}
              />
              <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('addPayment')}><FaPaste /></Button>
            </div>
            <label className='mt-2'>Detail :</label>
            <input className="form-control" type='text' onChange={useCallback(debounce((e) => setPaymentDetail(e.target.value), 300), [])}></input>
            <label className='mt-2'>Tanggal :</label>
            <input className="form-control" type='date' onChange={(e) => setPaymentTanggal(e.target.value)} required></input>
            <label className='mt-2'>Jumlah :</label>
            <input className="form-control" type='number' onChange={useCallback(debounce((e) => setPaymentJumlah(e.target.value), 300), [])}></input>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={handleSubmitPayment} style={{ marginLeft: "150px" }}>Submit</Button>
          </Modal.Footer>
        </Modal>
        {/* End Modal */}

        {/* Modal */}
        <Modal show={showEditPaymentModal} onHide={() => setShowEditPaymentModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Payment</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Your comment form here */}
            <label className='mt-2'>Gambar :</label>
            <img className='mt-2' style={{ width: "150px", display: paymentImageDelete ? "none" : "block" }} src={getImageUrl(paymentImageEdit)} onClick={() => setPaymentImageDelete(true)} />
            <div className='d-flex'>
              <input className="form-control" type="file"
                onChange={(e) => {
                  const filesPaymentEdit = e.target.files;
                  setFileToUploadPaymentEdit(filesPaymentEdit[0]);
                }}
              />
              <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editPayment')}><FaPaste /></Button>
            </div>
            <label className='mt-2'>Detail :</label>
            <input className="form-control" type='text' defaultValue={detailEdit} onChange={useCallback(debounce((e) => setDetailEdit(e.target.value), 300), [])}></input>
            <label className='mt-2'>Tanggal :</label>
            <input className="form-control" type='date' defaultValue={tanggalEdit} onChange={(e) => setTanggalEdit(e.target.value)} required></input>
            <label className='mt-2'>Jumlah :</label>
            <input className="form-control" type='number' defaultValue={jumlahEdit} onChange={useCallback(debounce((e) => setJumlahEdit(e.target.value), 300), [])}></input>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="danger" onClick={() => { setShowDeletePaymentModal(true); setShowEditPaymentModal(false) }}>Delete</Button>
            <Button variant="primary" onClick={handleSubmitEditPayment} style={{ marginLeft: "290px" }}>Submit</Button>
          </Modal.Footer>
        </Modal>
        {/* End Modal */}

        <Modal show={showDeletePaymentModal} onHide={() => setShowDeletePaymentModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>Are you sure you want to delete this Payment?</Modal.Body>
          <Modal.Footer>
            <Button variant="danger" onClick={handleDeletePayment}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  );
};

export default Piutang;
