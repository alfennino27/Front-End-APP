import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Col, Row, Container, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import '../Accounting/Accounting.css';
import { useParams } from 'react-router-dom';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useNavigate } from 'react-router-dom';
import { FaPaste } from 'react-icons/fa';
import { MdFormatListBulletedAdd } from "react-icons/md";
import { AudioOutlined } from '@ant-design/icons';
import { BsSortDown } from "react-icons/bs";
import { IoMdSearch } from "react-icons/io";
import { debounce } from 'lodash';
import { Input, Space, DatePicker, Popover, Radio, Pagination, Modal, InputNumber, Button, Popconfirm, Select } from 'antd';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea, Search } = Input;

const suffix = (
  <AudioOutlined
    style={{
      fontSize: 16,
      color: '#1677ff',
    }}
  />
);

const Jurnal = () => {
  const baseUrl = getApiBaseUrl();
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


  const [showTambahDataModal, setShowTambahDataModal] = useState(false);
  const [showEditDataModal, setShowEditDataModal] = useState(false);

  const [showSearch, setShowSearch] = useState(false); // Kontrol utama
  const [animateSearch, setAnimateSearch] = useState(false); // Kontrol animasi

  const toggleSearch = () => {
    setFilters({
      tanggal: null,
      kodeCustomerSupplier: "",
      invoiceSPK: "",
      keterangan: "",
      kodeAkunDebet: "",
      nominalDebet: "",
      kodeAkunKredit: "",
      nominalKredit: "",
    }); // Reset filters ke nilai awal

    if (!showSearch) {
      setShowSearch(true); // Tampilkan komponen
      setTimeout(() => setAnimateSearch(true), 50); // Mulai animasi setelah jeda
    } else {
      setAnimateSearch(false); // Hentikan animasi
      setTimeout(() => setShowSearch(false), 200); // Sembunyikan komponen setelah animasi selesai
    }
  };

  const [dataJurnal, setDataJurnal] = useState([]);
  const [dataKodeCust, setDataKodeCust] = useState([]);
  const [dataSupplier, setDataSupplier] = useState([]);
  const [dataInvoice, setDataInvoice] = useState([]);
  const [dataSPK, setDataSPK] = useState([]);
  const [dataAkun, setDataAkun] = useState([]);
  const [dataPiutang, setDataPiutang] = useState([]);

  const [sortBy, setSortBy] = useState("tanggal");

  const [filteredDataKodeCust, setFilteredDataKodeCust] = useState([]);
  const [filteredDataSupplier, setFilteredDataSupplier] = useState([]);
  const [filteredDataInvoice, setFilteredDataInvoice] = useState([]);
  const [filteredDataSPK, setFilteredDataSPK] = useState([]);

  const [searchKodeCustomerSupplier, setSearchKodeCustomerSupplier] = useState('');
  const [kodeCustomerSupplier, setKodeCustomerSupplier] = useState('');
  const [selectedPiutang, setSelectedPiutang] = useState(null);

  const [searchInvoiceSPK, setSearchInvoiceSPK] = useState('');
  const [invoiceSPK, setInvoiceSPK] = useState('');

  const [idEditData, setIdEditData] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [kodeAkunDebet, setKodeAkunDebet] = useState('');
  const [nominalDebet, setNominalDebet] = useState('');
  const [kodeAkunKredit, setKodeAkunKredit] = useState('');
  const [nominalKredit, setNominalKredit] = useState('');
  const [catatan, setCatatan] = useState('');
  const [idSPKpayment, setIdSPKpayment] = useState('');
  const [imageJurnal, setImageJurnal] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);

  const [imageDelete, setImageDelete] = useState(false);

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

  const tbodyTrLastChildTdFirstChildStyle = {
    borderBottomLeftRadius: '10px',
  };

  const tbodyTrLastChildTdLastChildStyle = {
    borderBottomRightRadius: '10px',
  };


  const fetchDataJurnal = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/jurnal/get`);
      const data = await res.json();
      setDataJurnal(data);
    } catch (err) {
      console.error('Gagal fetch data jurnal:', err);
    }
  };

  const fetchDataCust = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/cust/get`);
      const data = await res.json();
      setDataKodeCust(data);
    } catch (err) {
      console.error('Gagal fetch data jurnal:', err);
    }
  };

  const fetchDataSup = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/supplier/get`);
      const data = await res.json();
      setDataSupplier(data);
    } catch (err) {
      console.error('Gagal fetch data supplier:', err);
    }
  };

  const fetchDataInvoice = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/invoice/get`);
      const data = await res.json();
      setDataInvoice(data);
    } catch (err) {
      console.error('Gagal fetch data invoice:', err);
    }
  };

  const fetchDataSPK = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/spk/get`);
      const data = await res.json();
      setDataSPK(data);
    } catch (err) {
      console.error('Gagal fetch data SPK:', err);
    }
  };

  const fetchDataAkun = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/akun/get`);
      const data = await res.json();
      setDataAkun(data);
    } catch (err) {
      console.error('Gagal fetch data akun:', err);
    }
  };

  const fetchDataPiutang = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/piutang/get`);
      const data = await res.json();
      setDataPiutang(data);
    } catch (err) {
      console.error('Gagal fetch data piutang:', err);
    }
  };

  useEffect(() => {
    fetchDataJurnal();
    fetchDataCust();
    fetchDataSup();
    fetchDataInvoice();
    fetchDataSPK();
    fetchDataAkun();
    fetchDataPiutang();
  }, []);

  useEffect(() => {
    setFilteredDataKodeCust(
      dataKodeCust.filter(item =>
        item.kodeCust.toLowerCase().includes(searchKodeCustomerSupplier.toLowerCase()) ||
        item.namaCust.toLowerCase().includes(searchKodeCustomerSupplier.toLowerCase())
      )
    );
  }, [searchKodeCustomerSupplier, dataKodeCust]);

  useEffect(() => {
    setFilteredDataSupplier(
      dataSupplier.filter(item =>
        item.supplierName.toLowerCase().includes(searchKodeCustomerSupplier.toLowerCase())
      )
    );
  }, [searchKodeCustomerSupplier, dataSupplier]);

  // useEffect(() => {
  //   setFilteredDataInvoice(
  //     dataInvoice.filter(item =>
  //       item.kodeInvoice.toLowerCase().includes(searchInvoiceSPK.toLowerCase())
  //     )
  //   );
  // }, [searchInvoiceSPK, dataInvoice, kodeCustomerSupplier]);

  useEffect(() => {
    const filteredData = dataInvoice.filter(item => {
      const codeMatch = item.kodeInvoice.toLowerCase().includes(searchInvoiceSPK.toLowerCase());
      // const customerMatch = item.kodeCustomer?.toLowerCase().includes(kodeCustomerSupplier?.toLowerCase() || '');
      const customerMatch = !kodeCustomerSupplier || item.kodeCustomer?.toLowerCase().includes(kodeCustomerSupplier.toLowerCase());
      return codeMatch && customerMatch;
    });

    setFilteredDataInvoice(filteredData);
  }, [searchInvoiceSPK, dataInvoice, kodeCustomerSupplier]);

  useEffect(() => {
    const filteredData = dataSPK.filter(item => {
      const codeMatch = item.code.toLowerCase().includes(searchInvoiceSPK.toLowerCase());
      // const pengrajinMatch = item.pengrajin.toLowerCase().includes(kodeCustomerSupplier.toLowerCase());
      const pengrajinMatch = !kodeCustomerSupplier || item.pengrajin.toLowerCase().includes(kodeCustomerSupplier.toLowerCase());
      return codeMatch && pengrajinMatch;
    });

    setFilteredDataSPK(filteredData);
  }, [searchInvoiceSPK, dataSPK, kodeCustomerSupplier]);

  const handleSubmitTambahData = async () => {
    setShowTambahDataModal(false);

    try {
      const formData = new FormData();

      if (fileToUpload) {
        formData.append('image', fileToUpload);
      }

      formData.append('tanggal', tanggal);
      formData.append('kodeCustomerSupplier', kodeCustomerSupplier || '');
      formData.append('invoiceSPK', invoiceSPK || '');
      formData.append('piutang', selectedPiutang || '');
      formData.append('keterangan', keterangan || '');
      formData.append('kodeAkunDebet', kodeAkunDebet || '');
      formData.append('nominalDebet', nominalDebet || '');
      formData.append('kodeAkunKredit', kodeAkunKredit || '');
      formData.append('nominalKredit', nominalKredit || '');
      formData.append('catatan', catatan || '');

      const response = await fetch(`${baseUrl}/jurnal/create`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Berhasil tambah jurnal:', result);
        // tampilkan notifikasi berhasil kalau perlu
      } else {
        console.error('Gagal tambah jurnal:', result.message);
        // tampilkan notifikasi gagal kalau perlu
      }
    } catch (e) {
      console.error('Error adding jurnal via API:', e);
    }

    fetchDataJurnal();
  };


  const refreshState = () => {
    setIdEditData('');
    setSearchKodeCustomerSupplier('');
    setKodeCustomerSupplier(null);
    setSearchInvoiceSPK('');
    setInvoiceSPK(null);
    setSelectedPiutang(null);
    setTanggal('');
    setKeterangan('');
    setKodeAkunDebet(null);
    setNominalDebet('');
    setKodeAkunKredit(null);
    setNominalKredit('');
    setCatatan('');
    setImageJurnal('');
    setIdSPKpayment('');
    setFileToUpload(null);
    setImageDelete(false);
  }

  const namaAkun = (kodeAkun) => {
    const akun = dataAkun.find(akun => akun.kodeAkun === kodeAkun);
    return akun ? akun.namaAkun : ''; // Mengembalikan namaAkun jika ditemukan, atau string kosong jika tidak ditemukan
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
            if (modal == "imageJurnal") {
              setFileToUpload(file);
            }
          });
        }
      });
    });
  }

  const handleEditData = (item) => {
    refreshState();

    setIdEditData(item.id);
    setKodeCustomerSupplier(item.kodeCustomerSupplier);
    setInvoiceSPK(item.invoiceSPK);
    setSelectedPiutang(item.piutang);
    setTanggal(item.tanggal);
    setKeterangan(item.keterangan);
    setKodeAkunDebet(item.kodeAkunDebet);
    setNominalDebet(item.nominalDebet);
    setKodeAkunKredit(item.kodeAkunKredit);
    setNominalKredit(item.nominalKredit);
    setCatatan(item.catatan);
    setIdSPKpayment(item.idSPKpayment);
    setImageJurnal(item.image);
    setShowEditDataModal(true);
  };

  const handleSubmitEditData = async () => {
    setShowEditDataModal(false);
    try {
      const formData = new FormData();

      formData.append('idEditData', idEditData);
      formData.append('tanggal', tanggal);
      formData.append('kodeCustomerSupplier', kodeCustomerSupplier);
      formData.append('invoiceSPK', invoiceSPK);
      formData.append('piutang', selectedPiutang);
      formData.append('keterangan', keterangan);
      formData.append('kodeAkunDebet', kodeAkunDebet);
      formData.append('nominalDebet', nominalDebet);
      formData.append('kodeAkunKredit', kodeAkunKredit);
      formData.append('nominalKredit', nominalKredit);
      formData.append('catatan', catatan);
      formData.append('imageDelete', imageDelete); // boolean
      formData.append('imageJurnal', imageJurnal); // url lama kalau tidak dihapus
      formData.append('idSPKpayment', idSPKpayment || '');

      if (fileToUpload) {
        formData.append('image', fileToUpload);
      }

      const response = await fetch(`${baseUrl}/jurnal/update`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        fetchDataJurnal();
      }
    } catch (e) {
      console.error('Error updating data: ', e);
      message.error('Terjadi kesalahan saat update data.');
    }
  };

  const handleDeleteData = async () => {
    try {
      const res = await fetch(`${baseUrl}/jurnal/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idEditData, idSPKpayment })
      });

      const result = await res.json();

      if (!res.ok) {
        console.error('Error deleting document: ', result.message);
      }
    } catch (e) {
      console.error('Error deleting document: ', e);
    }

    fetchDataJurnal();
  };


  const [isDebitKredit, setIsDebitKredit] = useState(true);
  const [animasiDebitKredit, setAnimasiDebitKredit] = useState(true); // untuk status animasi
  const [animasiDetail, setAnimasiDetail] = useState(false); // untuk status animasi

  useEffect(() => {
    const interval = setInterval(() => {
      if (isDebitKredit) {
        setAnimasiDebitKredit(false);

        setTimeout(() => {
          setIsDebitKredit(false);
        }, 500);

        setTimeout(() => {
          setAnimasiDetail(true);
        }, 550);
      } else {
        setAnimasiDetail(false);

        setTimeout(() => {
          setIsDebitKredit(true);
        }, 500);

        setTimeout(() => {
          setAnimasiDebitKredit(true);
        }, 550);
      }
    }, 3000); // Ubah setiap 3 detik (3000ms)

    return () => clearInterval(interval); // Membersihkan interval saat komponen dibersihkan
  }, [isDebitKredit]);


  const [filters, setFilters] = useState({
    tanggal: null,
    kodeCustomerSupplier: "",
    invoiceSPK: "",
    keterangan: "",
    kodeAkunDebet: "",
    nominalDebet: "",
    kodeAkunKredit: "",
    nominalKredit: "",
  });

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const filteredData = dataJurnal.filter((item) => {

    const matchTanggal = filters.tanggal
      ? item.tanggal.slice(0, 7) === filters.tanggal.format("YYYY-MM") // Membandingkan hanya tahun dan bulan
      : true;

    const matchKodeCustomerSupplier = item.kodeCustomerSupplier.toLowerCase().includes(filters.kodeCustomerSupplier.toLowerCase());
    const matchInvoiceSPK = item.invoiceSPK.toLowerCase().includes(filters.invoiceSPK.toLowerCase());
    const matchKeterangan = item.keterangan.toLowerCase().includes(filters.keterangan.toLowerCase());
    // const matchKodeAkunDebet = item.kodeAkunDebet.toLowerCase().includes(filters.kodeAkunDebet.toLowerCase());
    const matchKodeAkunDebet = filters.kodeAkunDebet ? namaAkun(item.kodeAkunDebet).toLowerCase().includes(filters.kodeAkunDebet.toLowerCase()) : true;
    const matchNominalDebet = filters.nominalDebet ? Number(item.nominalDebet) === Number(filters.nominalDebet) : true;
    // const matchKodeAkunKredit = item.kodeAkunKredit.toLowerCase().includes(filters.kodeAkunKredit.toLowerCase());
    const matchKodeAkunKredit = filters.kodeAkunKredit ? namaAkun(item.kodeAkunKredit).toLowerCase().includes(filters.kodeAkunKredit.toLowerCase()) : true;
    const matchNominalKredit = filters.nominalKredit ? Number(item.nominalKredit) === Number(filters.nominalKredit) : true;

    return (
      matchTanggal &&
      matchKodeCustomerSupplier &&
      matchInvoiceSPK &&
      matchKeterangan &&
      matchKodeAkunDebet &&
      matchNominalDebet &&
      matchKodeAkunKredit &&
      matchNominalKredit
    );
  })
    .sort((a, b) => {
      // Pertama, sortir berdasarkan tanggal jika sortBy bernilai 'tanggal'
      if (sortBy === "tanggal") {
        const dateComparison = new Date(a.tanggal) - new Date(b.tanggal);
        if (dateComparison !== 0) {
          return dateComparison;
        }

        // Jika tanggal sama, urutkan berdasarkan submitDate
        const submitDateA = a.submitDate?.value?._seconds
          ? new Date(a.submitDate.value._seconds * 1000)
          : new Date(0);
        const submitDateB = b.submitDate?.value?._seconds
          ? new Date(b.submitDate.value._seconds * 1000)
          : new Date(0);
        return submitDateA - submitDateB;
      }

      return 0; // Jika sortBy bukan 'tanggal', urutan tidak berubah
    });


  const [currentPage, setCurrentPage] = useState(1);


  // Menghitung data yang ditampilkan berdasarkan halaman dan pageSize
  const startIndex = (currentPage - 1) * 100;

  //tampilan total debet dan kredit
  const totalDebet = filteredData.reduce((total, item) => total + Number(item.nominalDebet || 0), 0);
  const totalKredit = filteredData.reduce((total, item) => total + Number(item.nominalKredit || 0), 0);


  return (
    <>
      {/* <Container> */}
        <div className='mt-4 px-4'>
          <div className='row'>
            <div className='col d-flex justify-content-between'>
              <Dropdown>
                <Dropdown.Toggle variant="light" id="dropdown-basic" className="text-sm px-2 py-1" style={{ border: "1px solid blue", borderRadius: "5px", color: "blue" }}>
                  Jurnal
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
                  <Dropdown.Item as={Link} to="/accounting/jurnal" className="dropdown-link" style={{ color: "blue" }}>
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
                  <Dropdown.Item as={Link} to="/accounting/piutang" className="dropdown-link">
                    Piutang
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/hutang" className="dropdown-link">
                    Hutang
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>

              <div>
                <Pagination
                  size="small"
                  showQuickJumper
                  current={currentPage}
                  total={filteredData.length}
                  onChange={(e) => setCurrentPage(e)}
                  pageSize={100}
                  showSizeChanger={false}
                />
              </div>


              <div>
                <IoMdSearch className='button-effect' style={{ cursor: "pointer", color: showSearch ? "blue" : "black", }} size={25} onClick={toggleSearch} />
                <MdFormatListBulletedAdd className='button-effect' style={{ marginLeft: "8px", cursor: "pointer" }} size={25} onClick={() => { setShowTambahDataModal(true); refreshState(); }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ ...tableContainerStyle, maxHeight: '77vh', overflowY: 'auto', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>No</th>
                <th style={thStyle}>Tanggal</th>
                <th style={thStyle}>Kode Cus/Sup</th>
                <th style={thStyle}>Kode Inv/Spk</th>
                <th style={thStyle}>Keterangan</th>

                {/* Kolom Saldo Awal */}
                {isDebitKredit && (
                  <>
                    <th colSpan={3} style={thStyle}>
                      <div
                        style={{
                          opacity: animasiDebitKredit ? 1 : 0, // Fade-in animasi
                          visibility: animasiDebitKredit ? 'visible' : 'hidden',
                          transition: 'opacity 0.5s ease, visibility 0.5s ease',
                        }}>
                        Debit
                      </div>
                    </th>
                    <th colSpan={3} style={thStyle}>
                      <div
                        style={{
                          opacity: animasiDebitKredit ? 1 : 0, // Fade-in animasi
                          visibility: animasiDebitKredit ? 'visible' : 'hidden',
                          transition: 'opacity 0.5s ease, visibility 0.5s ease',
                        }}>
                        Kredit
                      </div>
                    </th>
                  </>
                )}

                {/* Kolom Debit dan Kredit */}
                {!isDebitKredit && (
                  <>
                    <th style={thStyle}>
                      <div
                        style={{
                          opacity: animasiDetail ? 1 : 0, // Fade-in animasi
                          visibility: animasiDetail ? 'visible' : 'hidden',
                          transition: 'opacity 0.5s ease, visibility 0.5s ease',
                        }}>
                        Kode
                      </div>
                    </th>
                    <th style={thStyle}>
                      <div
                        style={{
                          opacity: animasiDetail ? 1 : 0, // Fade-in animasi
                          visibility: animasiDetail ? 'visible' : 'hidden',
                          transition: 'opacity 0.5s ease, visibility 0.5s ease',
                        }}>
                        Nama
                      </div>
                    </th>
                    <th style={thStyle}>
                      <div
                        style={{
                          opacity: animasiDetail ? 1 : 0, // Fade-in animasi
                          visibility: animasiDetail ? 'visible' : 'hidden',
                          transition: 'opacity 0.5s ease, visibility 0.5s ease',
                        }}>
                        Jumlah
                      </div>
                    </th>
                    <th style={thStyle}>
                      <div
                        style={{
                          opacity: animasiDetail ? 1 : 0, // Fade-in animasi
                          visibility: animasiDetail ? 'visible' : 'hidden',
                          transition: 'opacity 0.5s ease, visibility 0.5s ease',
                        }}>
                        Kode
                      </div>
                    </th>
                    <th style={thStyle}>
                      <div
                        style={{
                          opacity: animasiDetail ? 1 : 0, // Fade-in animasi
                          visibility: animasiDetail ? 'visible' : 'hidden',
                          transition: 'opacity 0.5s ease, visibility 0.5s ease',
                        }}>
                        Nama
                      </div>
                    </th>
                    <th style={thStyle}>
                      <div
                        style={{
                          opacity: animasiDetail ? 1 : 0, // Fade-in animasi
                          visibility: animasiDetail ? 'visible' : 'hidden',
                          transition: 'opacity 0.5s ease, visibility 0.5s ease',
                        }}>
                        Jumlah
                      </div>
                    </th>
                  </>
                )}

                <th style={thStyle}>Catatan</th>
              </tr>

            </thead>
            <tbody>
              {/* Search Row */}
              {showSearch && (
                <tr
                  style={{
                    backgroundColor: '#ffffff',
                    visibility: animateSearch ? "visible" : "hidden", // Kontrol visibilitas
                    opacity: animateSearch ? 1 : 0, // Animasi fade-in/out
                    transform: animateSearch ? "translateY(0)" : "translateY(-5px)", // Pergeseran
                    transition: "opacity 0.3s ease, transform 0.3s ease", // Properti transisi
                    position: 'sticky',
                    top: 35,
                    zIndex: 1
                  }}
                >
                  <td style={thTdStyle}>
                    <Popover
                      placement="leftTop"
                      content={
                        <Radio.Group value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                          <Space direction="vertical">
                            <Radio value="tanggal">Tanggal</Radio>
                            <Radio value="submitDate">Submit Date</Radio>
                          </Space>
                        </Radio.Group>
                      }
                      title="Sort" trigger="click">
                      <BsSortDown style={{ cursor: "pointer" }} size={20} />
                    </Popover>
                  </td>
                  <td style={thTdStyle}>
                    <DatePicker
                      picker="month"
                      style={{ width: "100%" }}
                      size="small"
                      onChange={(date) => { handleFilterChange("tanggal", date); setCurrentPage(1) }}
                    />
                  </td>
                  <td style={thTdStyle}>
                    <Search
                      placeholder="Kode Customer/Supplier"
                      onSearch={(value) => handleFilterChange("kodeCustomerSupplier", value)}
                      onChange={(e) => { handleFilterChange("kodeCustomerSupplier", e.target.value); setCurrentPage(1) }}
                      style={{ width: "100%" }}
                      size="small"
                    />
                  </td>
                  <td style={thTdStyle}>
                    <Search
                      placeholder="Invoice/SPK"
                      onSearch={(value) => handleFilterChange("invoiceSPK", value)}
                      onChange={(e) => { handleFilterChange("invoiceSPK", e.target.value); setCurrentPage(1) }}
                      style={{ width: "100%" }}
                      size="small"
                    />
                  </td>
                  <td style={thTdStyle}>
                    <Search
                      placeholder="Keterangan"
                      onSearch={(value) => handleFilterChange("keterangan", value)}
                      onChange={(e) => { handleFilterChange("keterangan", e.target.value); setCurrentPage(1) }}
                      style={{ width: "100%" }}
                      size="small"
                    />
                  </td>
                  <td style={thTdStyle} colSpan={2}>
                    <Search
                      placeholder="Nama Akun Debet"
                      onSearch={(value) => handleFilterChange("kodeAkunDebet", value)}
                      onChange={(e) => { handleFilterChange("kodeAkunDebet", e.target.value); setCurrentPage(1) }}
                      style={{ width: "100%" }}
                      size="small"
                    />
                  </td>
                  <td style={thTdStyle}>
                    <Search
                      placeholder="Nominal Debet"
                      onSearch={(value) => handleFilterChange("nominalDebet", value)}
                      onChange={(e) => { handleFilterChange("nominalDebet", e.target.value); setCurrentPage(1) }}
                      style={{ width: "100%" }}
                      size="small"
                    />
                  </td>
                  <td style={thTdStyle} colSpan={2}>
                    <Search
                      placeholder="Nama Akun Kredit"
                      onSearch={(value) => handleFilterChange("kodeAkunKredit", value)}
                      onChange={(e) => { handleFilterChange("kodeAkunKredit", e.target.value); setCurrentPage(1) }}
                      style={{ width: "100%" }}
                      size="small"
                    />
                  </td>
                  <td style={thTdStyle}>
                    <Search
                      placeholder="Nominal Kredit"
                      onSearch={(value) => handleFilterChange("nominalKredit", value)}
                      onChange={(e) => { handleFilterChange("nominalKredit", e.target.value); setCurrentPage(1) }}
                      style={{ width: "100%" }}
                      size="small"
                    />
                  </td>
                  <td style={thTdStyle}></td>
                </tr>
              )}

              {/* Filtered Rows */}
              {filteredData.slice(startIndex, startIndex + 100).map((item, index) => (
                <tr key={index} className='tr-hover-effect' style={index % 2 === 0 ? tbodyTrEvenStyle : tbodyTrOddStyle}
                  onClick={() => {
                    if (!item.idInvoice) {
                      handleEditData(item);
                    } else {
                      alert("Data invoice tidak dapat diedit.");
                    }
                  }}
                >
                  <td style={thTdStyle} className='text-center'>{(index + 1) + ((currentPage - 1) * 100)}</td>
                  <td style={thTdStyle}>{new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                  <td style={thTdStyle}>{item.kodeCustomerSupplier}</td>
                  <td style={thTdStyle}>{item.invoiceSPK}</td>
                  <td style={thTdStyle}>{item.keterangan}</td>
                  <td style={thTdStyle}>{'\u00a0\u00a0\u00a0\u00a0'}{item.kodeAkunDebet}{'\u00a0\u00a0\u00a0\u00a0'}</td>
                  <td style={thTdStyle}>{namaAkun(item.kodeAkunDebet)}</td>
                  <td style={thTdStyle}>Rp. {Number(item.nominalDebet).toLocaleString('id-ID')}</td>
                  <td style={thTdStyle}>{'\u00a0\u00a0\u00a0\u00a0'}{item.kodeAkunKredit}{'\u00a0\u00a0\u00a0\u00a0'}</td>
                  <td style={thTdStyle}>{namaAkun(item.kodeAkunKredit)}</td>
                  <td style={thTdStyle}>Rp. {Number(item.nominalKredit).toLocaleString('id-ID')}</td>
                  <td style={thTdStyle}>{item.catatan}</td>
                </tr>
              ))}

              <tr style={{ backgroundColor: '#E7E7E8' }} className='fw-semibold'>
                <td style={thTdStyle} colSpan={5}></td>
                <td style={thTdStyle} colSpan={2}>Total Debit</td>
                <td style={thTdStyle}>Rp. {totalDebet.toLocaleString('id-ID')}</td>
                <td style={thTdStyle} colSpan={2}>Total Kredit</td>
                <td style={thTdStyle}>Rp. {totalKredit.toLocaleString('id-ID')}</td>
                <td style={thTdStyle}></td>
              </tr>

            </tbody>
          </table>
        </div>

        {/* Modal */}
        <Modal
          title={<h5 style={{ textAlign: "center" }}>Tambah Data</h5>}
          style={{ zIndex: 9999 }}
          width={800}
          key={showTambahDataModal}
          open={showTambahDataModal}
          onCancel={() => setShowTambahDataModal(false)}
          footer={[
            <div style={{ marginTop: "30px" }}>
              <Button
                key="submit"
                type="primary"
                onClick={handleSubmitTambahData}
              >
                Submit
              </Button>
            </div>
          ]}
        >

          <div className="row mt-4 mb-1">
            <div className="col-6 d-flex flex-column">
              <label className='mb-1 fw-semibold'>Tanggal :</label>
              <DatePicker
                style={{ width: '100%' }}
                className="date-picker-custom"
                format="DD-MM-YYYY"
                onChange={(date, dateString) => {
                  // Mengonversi dateString (DD-MM-YYYY) ke format YYYY-MM-DD sebelum diset ke state
                  const formattedDate = date ? date.format('YYYY-MM-DD') : '';
                  setTanggal(formattedDate);
                }}
                required
                getPopupContainer={(trigger) => trigger.parentNode}
              />
            </div>

            <div className="col-6 d-flex flex-column">
              <label className='mb-1 fw-semibold'>Keterangan :</label>
              <Input type='text' placeholder='Enter Keterangan' onChange={useCallback(debounce((e) => setKeterangan(e.target.value), 300), [])}></Input>
            </div>
          </div>

          <div className="row mt-3 mb-1">
            <div className="col-6 d-flex flex-column">
              <label className='mb-1 fw-semibold'>Kode Customer / Supplier :</label>
              <Select
                style={{ width: '100%' }}
                placeholder="Select Cus/Sup"
                value={kodeCustomerSupplier}
                onChange={(value) => { setKodeCustomerSupplier(value); }}
                showSearch
                optionFilterProp="children"
                getPopupContainer={trigger => trigger.parentNode}
                allowClear
              >
                <Option key="Customer" value="Customer" disabled style={{ display: searchKodeCustomerSupplier != "" ? "none" : "" }}>Customer</Option>
                {filteredDataKodeCust.map((item, index) => (
                  <Option key={index} value={item.kodeCust}>
                    {item.kodeCust} - {item.namaCust}
                  </Option>
                ))}
                <Option key="Supplier" value="Supplier" disabled style={{ display: searchKodeCustomerSupplier != "" ? "none" : "" }}>Supplier</Option>
                {filteredDataSupplier.map((item, index) => (
                  <Option key={index} value={item.supplierName}>
                    {item.supplierName}
                  </Option>
                ))}
              </Select>

            </div>

            <div className="col-6 d-flex flex-column">
              <label className='mb-1 fw-semibold'>Invoice / SPK :</label>
              <Select
                style={{ width: '100%' }}
                placeholder="Select Inv/SPK"
                value={invoiceSPK}
                onChange={(value) => { setInvoiceSPK(value); }}
                showSearch
                optionFilterProp="children"
                getPopupContainer={trigger => trigger.parentNode}
                allowClear
              >
                <Option key="Invoice" value="Invoice" disabled style={{ display: searchInvoiceSPK != "" || kodeCustomerSupplier != "" ? "none" : "block" }}>Invoice</Option>
                {filteredDataInvoice.map((item, index) => (
                  <Option key={index} value={item.kodeInvoice}>
                    {item.kodeInvoice}
                  </Option>
                ))}
                <Option key="SPK" value="SPK" disabled style={{ display: searchInvoiceSPK != "" || kodeCustomerSupplier != "" ? "none" : "block" }}>SPK</Option>
                {filteredDataSPK.map((item, index) => (
                  <Option key={index} value={item.code}>
                    {item.code}
                  </Option>
                ))}
              </Select>

            </div>
          </div>

          <div className="row mt-3 mb-1">
            <div className="col-12 d-flex flex-column">
              <label className='mb-1 fw-semibold'>Piutang :</label>
              <Select
                style={{ width: '100%' }}
                placeholder="Select Piutang"
                value={selectedPiutang}
                onChange={(value) => { setSelectedPiutang(value); }}
                showSearch
                optionFilterProp="children"
                getPopupContainer={trigger => trigger.parentNode}
                allowClear
              >
                {dataPiutang.map((piutang) => {
                  const [year, month, day] = piutang.tanggal.split("-");

                  return (
                    <Option
                      key={piutang.id}
                      value={piutang.id}
                      label={piutang.nama}
                    >
                      {piutang.nama} : {`${day}-${month}-${year}`}
                    </Option>
                  );
                })}

              </Select>

            </div>
          </div>


          <div className="row mt-3 mb-1">
            <div className="col-6 d-flex flex-column">
              <label className='mb-1 fw-semibold'>Kode Akun Debit :</label>

              <Select
                style={{ width: '100%' }}
                placeholder="Select Akun Debit"
                value={kodeAkunDebet}
                onChange={(value) => { setKodeAkunDebet(value); }}
                showSearch
                optionFilterProp="children"
                getPopupContainer={trigger => trigger.parentNode}
                allowClear
              >
                {dataAkun.map((item, index) => (
                  <Option key={index} value={item.kodeAkun}>
                    {item.kodeAkun} - {item.namaAkun}
                  </Option>
                ))}
              </Select>

              {/* <select
              className="form-control"
              value={kodeAkunDebet}
              onChange={(e) => setKodeAkunDebet(e.target.value)}
            >
              <option value="" disabled selected>Select Akun</option>
              {dataAkun.map((item, index) => (
                <option key={index} value={item.kodeAkun}>
                  {item.kodeAkun} - {item.namaAkun}
                </option>
              ))}
            </select> */}
            </div>

            <div className="col-6 d-flex flex-column">
              <label className='mb-1 fw-semibold'>Kode Akun Kredit :</label>

              <Select
                style={{ width: '100%' }}
                placeholder="Select Akun Kredit"
                value={kodeAkunKredit}
                onChange={(value) => { setKodeAkunKredit(value); }}
                showSearch
                optionFilterProp="children"
                getPopupContainer={trigger => trigger.parentNode}
                allowClear
              >
                {dataAkun.map((item, index) => (
                  <Option key={index} value={item.kodeAkun}>
                    {item.kodeAkun} - {item.namaAkun}
                  </Option>
                ))}
              </Select>

              {/* <select
              className="form-control"
              value={kodeAkunKredit}
              onChange={(e) => setKodeAkunKredit(e.target.value)}
            >
              <option value="" disabled selected>Select Akun</option>
              {dataAkun.map((item, index) => (
                <option key={index} value={item.kodeAkun}>
                  {item.kodeAkun} - {item.namaAkun}
                </option>
              ))}
            </select> */}
            </div>
          </div>

          <div className="row mt-3 mb-1">
            <div className="col-6 d-flex flex-column">
              <label className='mb-1 fw-semibold'>Nominal :</label>
              <InputNumber
                className="w-100"
                formatter={value => `Rp. ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                parser={value => value?.replace(/Rp.\s?|\./g, '')}
                inputMode="numeric"
                onKeyDown={(e) => {
                  if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab') {
                    e.preventDefault();
                  }
                }}
                onChange={useCallback(debounce((value) => {
                  setNominalDebet(value);
                  setNominalKredit(value);
                }, 300), [])}
              />
            </div>

            {/* <input className="form-control" type='number'
            onChange={(e) => {
              setNominalDebet(e.target.value);
              setNominalKredit(e.target.value);
            }}
            onWheel={(e) => e.target.blur()}
            required
          /> */}
            <div className="col-6 d-flex flex-column">
              <label className='mb-1 fw-semibold'>Catatan :</label>
              <Input type='text' placeholder='Enter Catatan' onChange={useCallback(debounce((e) => setCatatan(e.target.value), 300), [])}></Input>
            </div>
          </div>

          <label className='mt-2 mb-1 fw-semibold'>Gambar :</label><br />
          {/* <img className='mt-2' style={{ width: "150px", display: imageDelete ? "none" : "block" }} src={imageJurnal ? imageJurnal.startsWith('/uploads') ? `${baseUrl}${imageJurnal}` : imageJurnal : undefined} onClick={() => setImageDelete(true)} /> */}
          <div className='d-flex'>
            <input className="form-control" type="file"
              style={{
                height: '30px',
                fontSize: '14px'
              }}
              onChange={(e) => {
                const filesEdit = e.target.files;
                setFileToUpload(filesEdit[0]);
              }}
            />
            <Button variant="secondary" className='antd-btn-custom' style={{ marginLeft: "20px", height: "30px", fontSize: '14px' }} onClick={() => pasteImage('imageJurnal')}><FaPaste /></Button>
          </div>
        </Modal>
        {/* End Modal */}

        {/* Modal */}
        <Modal open={showEditDataModal} onCancel={() => setShowEditDataModal(false)}
          key={showEditDataModal}
          style={{ zIndex: 9999 }}
          width={800}
          title={<h5 style={{ textAlign: "center" }}>Edit Data</h5>}
          footer={[
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', marginTop: '30px' }}>
              {/* Tombol Delete di kiri */}

              <Popconfirm
                title="Delete data"
                description="Are you sure you want to delete this data?"
                onConfirm={() => { handleDeleteData(); setShowEditDataModal(false) }}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  key="delete"
                  type="primary"
                  danger // Tombol Delete berwarna merah
                  style={{ marginRight: 'auto' }} // Agar tombol Delete berada di kiri
                // onClick={() => {
                //   setShowDeleteProductModal(true);
                //   setShowEditProductModal(false);
                // }}
                >
                  Delete
                </Button>
              </Popconfirm>


              {/* Tombol Submit di kanan */}
              <Button
                key="submit"
                type="primary"
                onClick={handleSubmitEditData}
              >
                Submit
              </Button>
            </div>
          ]}
        >

          <div className="row mt-4 mb-1">
            <div className="col-6 d-flex flex-column">
              <label className='mt-2 mb-1 fw-semibold'>Tanggal :</label>
              <DatePicker
                style={{ width: '100%' }}
                className="date-picker-custom"
                format="DD-MM-YYYY"
                defaultValue={tanggal ? dayjs(tanggal, 'YYYY-MM-DD') : undefined}
                onChange={(date, dateString) => {
                  // Mengonversi dateString (DD-MM-YYYY) ke format YYYY-MM-DD sebelum diset ke state
                  const formattedDate = date ? date.format('YYYY-MM-DD') : '';
                  setTanggal(formattedDate);
                }}
                required
                getPopupContainer={(trigger) => trigger.parentNode}
              />
            </div>
            <div className="col-6 d-flex flex-column">
              <label className='mt-2 mb-1 fw-semibold'>Keterangan :</label>
              <Input type='text' placeholder='Enter Keterangan' defaultValue={keterangan} onChange={useCallback(debounce((e) => setKeterangan(e.target.value), 300), [])}></Input>
              {/* <input className="form-control" type='text' defaultValue={keterangan} onChange={(e) => setKeterangan(e.target.value)} required></input> */}
            </div>
          </div>
          {/* <input className="form-control" type='date' defaultValue={tanggal} onChange={(e) => setTanggal(e.target.value)} required></input> */}

          <div className="row mt-3 mb-1">
            <div className="col-6 d-flex flex-column">
              <label className='mb-1 fw-semibold'>Kode Customer / Supplier :</label>
              <Select
                style={{ width: '100%' }}
                placeholder="Select Cus/Sup"
                value={kodeCustomerSupplier}
                onChange={(value) => { setKodeCustomerSupplier(value); }}
                showSearch
                optionFilterProp="children"
                getPopupContainer={trigger => trigger.parentNode}
                allowClear
              >
                <Option key="Customer" value="Customer" disabled style={{ display: searchKodeCustomerSupplier != "" ? "none" : "" }}>Customer</Option>
                {filteredDataKodeCust.map((item, index) => (
                  <Option key={index} value={item.kodeCust}>
                    {item.kodeCust} - {item.namaCust}
                  </Option>
                ))}
                <Option key="Supplier" value="Supplier" disabled style={{ display: searchKodeCustomerSupplier != "" ? "none" : "" }}>Supplier</Option>
                {filteredDataSupplier.map((item, index) => (
                  <Option key={index} value={item.supplierName}>
                    {item.supplierName}
                  </Option>
                ))}
              </Select>

              {/* <select
              className="form-control"
              value={kodeCustomerSupplier}
              onChange={(e) => setKodeCustomerSupplier(e.target.value)}
            >
              <option value="" disabled selected>Select Code Customer / Supplier</option>
              <option value="" disabled style={{ display: searchKodeCustomerSupplier != "" ? "none" : "block" }}>Customer</option>
              {filteredDataKodeCust.map((item, index) => (
                <option key={index} value={item.kodeCust}>
                  {item.kodeCust} - {item.namaCust}
                </option>
              ))}
              <option value="" disabled style={{ display: searchKodeCustomerSupplier != "" ? "none" : "block" }}>Supplier</option>
              {filteredDataSupplier.map((item, index) => (
                <option key={index} value={item.supplierName}>
                  {item.supplierName}
                </option>
              ))}
            </select> */}
            </div>

            <div className="col-6 d-flex flex-column">
              <label className='mb-1 fw-semibold'>Invoice / SPK :</label>
              <Select
                style={{ width: '100%' }}
                placeholder="Select Inv/SPK"
                value={invoiceSPK}
                onChange={(value) => { setInvoiceSPK(value); }}
                showSearch
                optionFilterProp="children"
                getPopupContainer={trigger => trigger.parentNode}
                allowClear
              >
                <Option key="Invoice" value="Invoice" disabled style={{ display: searchInvoiceSPK != "" || kodeCustomerSupplier != "" ? "none" : "block" }}>Invoice</Option>
                {filteredDataInvoice.map((item, index) => (
                  <Option key={index} value={item.kodeInvoice}>
                    {item.kodeInvoice}
                  </Option>
                ))}
                <Option key="SPK" value="SPK" disabled style={{ display: searchInvoiceSPK != "" || kodeCustomerSupplier != "" ? "none" : "block" }}>SPK</Option>
                {filteredDataSPK.map((item, index) => (
                  <Option key={index} value={item.code}>
                    {item.code}
                  </Option>
                ))}
              </Select>

              {/* <select
              className="form-control"
              value={invoiceSPK}
              onChange={(e) => setInvoiceSPK(e.target.value)}
            >
              <option value="" disabled selected>Select Invoice / SPK</option>
              <option value="" disabled style={{ display: searchInvoiceSPK != "" || kodeCustomerSupplier != "" ? "none" : "block" }}>Invoice</option>
              {filteredDataInvoice.map((item, index) => (
                <option key={index} value={item.kodeInvoice}>
                  {item.kodeInvoice}
                </option>
              ))}
              <option value="" disabled style={{ display: searchInvoiceSPK != "" || kodeCustomerSupplier != "" ? "none" : "block" }}>SPK</option>
              {filteredDataSPK.map((item, index) => (
                <option key={index} value={item.code}>
                  {item.code}
                </option>
              ))}
            </select> */}
            </div>
          </div>

          <div className="row mt-3 mb-1">
            <div className="col-12 d-flex flex-column">
              <label className='mb-1 fw-semibold'>Piutang :</label>
              <Select
                style={{ width: '100%' }}
                placeholder="Select Piutang"
                value={selectedPiutang}
                onChange={(value) => { setSelectedPiutang(value); }}
                showSearch
                optionFilterProp="children"
                getPopupContainer={trigger => trigger.parentNode}
                allowClear
              >
                {dataPiutang.map((piutang) => {
                  const [year, month, day] = piutang.tanggal.split("-");

                  return (
                    <Option
                      key={piutang.id}
                      value={piutang.id}
                      label={piutang.nama}
                    >
                      {piutang.nama} : {`${day}-${month}-${year}`}
                    </Option>
                  );
                })}

              </Select>

            </div>
          </div>


          <div className="row mt-3 mb-1">
            <div className="col-6 d-flex flex-column">
              <label className='mb-1 fw-semibold'>Kode Akun Debit :</label>
              <Select
                style={{ width: '100%' }}
                placeholder="Select Akun Debit"
                value={kodeAkunDebet}
                onChange={(value) => { setKodeAkunDebet(value); }}
                showSearch
                optionFilterProp="children"
                getPopupContainer={trigger => trigger.parentNode}
                allowClear
              >
                {dataAkun.map((item, index) => (
                  <Option key={index} value={item.kodeAkun}>
                    {item.kodeAkun} - {item.namaAkun}
                  </Option>
                ))}
              </Select>

              {/* <select
              className="form-control"
              value={kodeAkunDebet}
              onChange={(e) => setKodeAkunDebet(e.target.value)}
            >
              <option value="" disabled selected>Select Akun</option>
              {dataAkun.map((item, index) => (
                <option key={index} value={item.kodeAkun}>
                  {item.kodeAkun} - {item.namaAkun}
                </option>
              ))}
            </select> */}
            </div>

            <div className="col-6 d-flex flex-column">
              <label className='mb-1 fw-semibold'>Kode Akun Kredit :</label>

              <Select
                style={{ width: '100%' }}
                placeholder="Select Akun Kredit"
                value={kodeAkunKredit}
                onChange={(value) => { setKodeAkunKredit(value); }}
                showSearch
                optionFilterProp="children"
                getPopupContainer={trigger => trigger.parentNode}
                allowClear
              >
                {dataAkun.map((item, index) => (
                  <Option key={index} value={item.kodeAkun}>
                    {item.kodeAkun} - {item.namaAkun}
                  </Option>
                ))}
              </Select>

              {/* <select
              className="form-control"
              value={kodeAkunKredit}
              onChange={(e) => setKodeAkunKredit(e.target.value)}
            >
              <option value="" disabled selected>Select Akun</option>
              {dataAkun.map((item, index) => (
                <option key={index} value={item.kodeAkun}>
                  {item.kodeAkun} - {item.namaAkun}
                </option>
              ))}
            </select> */}
            </div>
          </div>

          <div className="row mt-3 mb-1">
            <div className="col-6 d-flex flex-column">
              <label className='mb-1 fw-semibold'>Nominal :</label>

              <InputNumber
                className="w-100"
                formatter={value => `Rp. ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                parser={value => value?.replace(/Rp.\s?|\./g, '')}
                inputMode="numeric"
                onKeyDown={(e) => {
                  if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab') {
                    e.preventDefault();
                  }
                }}
                defaultValue={nominalDebet}
                onChange={useCallback(debounce((value) => {
                  setNominalDebet(value);
                  setNominalKredit(value);
                }, 300), [])}
              />

              {/* <input
            className="form-control"
            type='number'
            value={nominalDebet} // atau nominalKredit, karena nilainya akan sama
            onChange={(e) => {
              setNominalDebet(e.target.value); // Update nominalDebet
              setNominalKredit(e.target.value); // Update nominalKredit
            }}
            onWheel={(e) => e.target.blur()} // Menghindari scroll zoom
            required
          /> */}
            </div>

            <div className="col-6 d-flex flex-column">
              <label className='mb-1 fw-semibold'>Catatan :</label>
              <Input type='text' placeholder='Enter Catatan' defaultValue={catatan} onChange={useCallback(debounce((e) => setCatatan(e.target.value), 300), [])}></Input>
              {/* <input className="form-control" type='text' defaultValue={catatan} onChange={(e) => setCatatan(e.target.value)} required></input> */}
            </div>
          </div>

          <label className='mt-2 mb-1 fw-semibold'>Gambar :</label><br />
          {imageJurnal && !imageDelete && (
            <img className='mt-2 mb-3' style={{ width: "100%", display: imageDelete ? "none" : "block" }} src={imageJurnal ? imageJurnal.startsWith('/uploads') ? `${baseUrl}${imageJurnal}` : imageJurnal : undefined}
              onClick={() => {
                if (window.confirm("Hapus gambar ini?")) {
                  setImageDelete(true);
                }
              }}
            />
          )}
          <div className='d-flex'>
            <input className="form-control" type="file"
              style={{
                height: '30px',
                fontSize: '14px'
              }}
              onChange={(e) => {
                const filesEdit = e.target.files;
                setFileToUpload(filesEdit[0]);
              }}
            />
            <Button variant="secondary" className='antd-btn-custom' style={{ marginLeft: "20px", height: "30px", fontSize: '14px' }} onClick={() => pasteImage('imageJurnal')}><FaPaste /></Button>
            {/* <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('imageJurnal')}><FaPaste /></Button> */}
          </div>

        </Modal>
        {/* End Modal */}
      {/* </Container> */}
    </>
  );
};

export default Jurnal;
