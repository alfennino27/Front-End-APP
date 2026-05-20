import { Col, Row, Modal, Button, Container, Tab, Nav } from 'react-bootstrap';
import '../Pekerjaan/pekerjaan.css';
import '../Pekerjaan/table.css';
import { MdOutlineAssignment, MdOutlineLocationOn } from 'react-icons/md';
import { MdAddCircleOutline } from "react-icons/md";
import { Link } from 'react-router-dom';
import dataPekerjaan from '../../assets/data/datapekerjaan';
import { FaPaste, FaSearch } from 'react-icons/fa';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { MdFormatListBulletedAdd, MdAssignment } from 'react-icons/md';
import { BsPrinterFill } from "react-icons/bs";
import { getApiBaseUrl } from '../../Config/APIurl';
import { useNavigate } from 'react-router-dom';
import { FaDisplay } from 'react-icons/fa6';
import { Skeleton, Statistic, Spin, Image, Popconfirm } from 'antd';
import { debounce } from 'lodash';
import { IoSearch } from 'react-icons/io5';
import { useTheme } from '../../ThemeContext';
import { getImageUrl } from '../../Utils/image';
import { RiFileExcel2Line } from "react-icons/ri";

//tes
const Invoice = () => {
  const baseUrl = getApiBaseUrl();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSupplier, setSearchSupplier] = useState('');
  const [filteredData, setFilteredData] = useState([]);

  const [dataInvoiceFromDB, setDataInvoiceFromDB] = useState([]);

  const [dataKodeCustomerFromDB, setDataKodeCustomerFromDB] = useState([]);
  const [searchKodeCustomer, setSearchKodeCustomer] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  const [displayFull, setDisplayFull] = useState(false);
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [kodeCustomer, setKodeCustomer] = useState('');
  const [customer, setCustomer] = useState('');
  const [kodeInvoice, setKodeInvoice] = useState('');
  const [tanggalMulaiInvoice, setTanggalMulaiInvoice] = useState('');
  const [deadlineInvoice, setDeadlineInvoice] = useState('');
  const [ongkirPackingInvoice, setOngkirPackingInvoice] = useState(0);
  const [adminInvoice, setAdminInvoice] = useState(0);
  const [discountInvoice, setDiscountInvoice] = useState(0);
  const [ongkirCustInvoice, setOngkirCustInvoice] = useState(0);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentFileToUpload, setPaymentFileToUpload] = useState(null);
  const [paymentDetail, setPaymentDetail] = useState('');
  const [paymentTanggal, setPaymentTanggal] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentTanggalWD, setPaymentTanggalWD] = useState('');
  const [paymentJumlah, setPaymentJumlah] = useState('');
  const [dataInvoicePaymentFromDB, setDataInvoicePaymentFromDB] = useState([]);

  const [summaryMonth, setSummaryMonth] = useState('');
  const [paymentSummaryMonth, setPaymentSummaryMonth] = useState('');

  const [filteredInvoicePaymentSummary, setFilteredInvoicePaymentSummary] = useState([]);

  const [filterPaymentSummary, setFilterPaymentSummary] = useState('All');


  const [productName, setProductName] = useState('');
  const [spesifikasi, setSpesifikasi] = useState('');

  const [idPengeluaran, setIdPengeluaran] = useState('');

  const [tanggalPengeluaran, setTanggalPengeluaran] = useState('');
  const [kategoriPengeluaran, setKategoriPengeluaran] = useState('');
  const [keteranganPengeluaran, setKeteranganPengeluaran] = useState('');
  const [nominalPengeluaran, setNominalPengeluaran] = useState('');

  const [inputPengrajin, setInputPengrajin] = useState('');
  const [inputTanggalCetak, setInputTanggalCetak] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [showUpdateInvoiceModal, setShowUpdateInvoiceModal] = useState(false);
  const [pengrajin, setPengrajin] = useState('');
  const [tanggalCetak, setTanggalCetak] = useState('');
  const [code, setCode] = useState('');

  const [invoice, setInvoice] = useState([]);
  const [backUpDataInvoice, setBackUpDataInvoice] = useState([]);
  const { slug } = useParams();

  const isMobile = window.innerWidth <= 768;

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [keterangan, setKeterangan] = useState('');
  const [harga, setHarga] = useState('');
  const [qty, setQty] = useState('');
  // const [deadline, setDeadline] = useState('');

  const [dataProductFromDB, setDataProductFromDB] = useState([]);
  const [dataProductExcelFromDB, setDataProductExcelFromDB] = useState([]);

  const [showPengeluaranModal, setShowPengeluaranModal] = useState(false);
  const [dataPengeluaranFromDB, setDataPengeluaranFromDB] = useState([]);

  const [dataSupplierFromDB, setDataSupplierFromDB] = useState([]);

  const [showSearch, setShowSearch] = useState(false);
  const [isIconBlue, setIsIconBlue] = useState(false);

  const handleSearchClick = () => {
    setShowSearch(!showSearch);
    setIsIconBlue(!isIconBlue);
  };

  const [idProductEdit, setIdProductEdit] = useState('');
  const [fileToUploadEdit, setFileToUploadEdit] = useState(null);
  const [spesifikasiEdit, setSpesifikasiEdit] = useState('');
  const [hargaEdit, setHargaEdit] = useState('');
  const [qtyEdit, setQtyEdit] = useState('');
  const [deadlineEdit, setDeadlineEdit] = useState('');
  const [imageEdit, setImageEdit] = useState('');
  const [imageDelete, setImageDelete] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showDeleteProductModal, setShowDeleteProductModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [selectedExcelFile, setSelectedExcelFile] = useState(null);

  const [excelDetailData, setExcelDetailData] = useState(null);
  const [showExcelDetailModal, setShowExcelDetailModal] = useState(false);
  const [imageAssignments, setImageAssignments] = useState({});

  const [selectedVersion, setSelectedVersion] = useState(null);
  const [showVersionModal, setShowVersionModal] = useState(false);

  // ambil semua versi unik
  const versions = [...new Set(dataProductExcelFromDB.map(item => item.version))].sort((a, b) => a - b);
  const modalContainerRef = useRef(null);







  const fetchDataInvoice = async () => {
    try {
      const res = await fetch(`${baseUrl}/invoice/get`);
      const data = await res.json();

      setBackUpDataInvoice(data);
      setInvoice(data);
      setFilteredData(data);
    } catch (error) {
      console.error('Gagal mengambil data invoice:', error);
    }
  };

  useEffect(() => {
    fetchDataInvoice();
  }, []);


  const handleEditProduct = (id, spesifikasi, harga, qty, image) => {
    refreshState();
    setIdProductEdit(id);
    setSpesifikasiEdit(spesifikasi);
    setHargaEdit(harga);
    setQtyEdit(qty);
    setImageEdit(image);
    setImageDelete(false);
    setShowEditProductModal(true);
  };


  const [showEditPengeluaranModal, setShowEditPengeluaranModal] = useState(false);
  const [showDeletePengeluaranModal, setShowDeletePengeluaranModal] = useState(false);
  const handleEditPengeluaran = (id, tanggalPengeluaran, kategoriPengeluaran, keteranganPengeluaran, nominalPengeluaran) => {
    refreshState();
    setIdPengeluaran(id);
    setTanggalPengeluaran(tanggalPengeluaran);
    setKategoriPengeluaran(kategoriPengeluaran);
    setKeteranganPengeluaran(keteranganPengeluaran);
    setNominalPengeluaran(nominalPengeluaran);
    // setPaymentImageDelete(false);
    setShowEditPengeluaranModal(true);
  };

  const handleSubmitInvoice = async () => {
    setShowAddInvoiceModal(false);

    try {
      const res = await fetch(`${baseUrl}/invoice/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kodeCustomer,
          customer,
          kodeInvoice,
          tanggalMulaiInvoice,
          deadlineInvoice,
          ongkirPackingInvoice,
          adminInvoice,
          discountInvoice,
          ongkirCustInvoice
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Gagal menambahkan invoice');
      }

      fetchDataInvoice();
    } catch (e) {
      console.error('Error adding invoice:', e);
    }
  };




  // Efek tambahan untuk memfilter berdasarkan searchSupplier
  useEffect(() => {
    if (searchSupplier === '') {
      setInvoice(backUpDataInvoice);
      setFilteredData(backUpDataInvoice);
    } else {
      const filtered = backUpDataInvoice.filter(item => item.pengrajin === searchSupplier);
      setInvoice(filtered);
      setFilteredData(filtered);
    }
  }, [searchSupplier, backUpDataInvoice]);


  useEffect(() => {
    setFilteredData(invoice.filter((item) => item.customer.toLowerCase().includes(searchTerm.toLowerCase()) || item.kodeInvoice.toLowerCase().includes(searchTerm.toLowerCase())));
  }, [searchTerm, invoice]);

  useEffect(() => {
    const selectedInvoice = backUpDataInvoice.find(item => item.id === slug);

    if (selectedInvoice) {
      setKodeCustomer(selectedInvoice.kodeCustomer);
      setCustomer(selectedInvoice.customer);
      setKodeInvoice(selectedInvoice.kodeInvoice);
      setTanggalMulaiInvoice(selectedInvoice.tanggalMulaiInvoice);
      setDeadlineInvoice(selectedInvoice.deadlineInvoice);
      setOngkirPackingInvoice(selectedInvoice.ongkirPackingInvoice);
      setAdminInvoice(selectedInvoice.adminInvoice);
      setDiscountInvoice(selectedInvoice.discountInvoice);
      setOngkirCustInvoice(selectedInvoice.ongkirCustInvoice);
      setDataInvoiceFromDB([selectedInvoice]);
    }
  }, [slug, backUpDataInvoice, showUpdateInvoiceModal]);


  const fetchDataProduct = async () => {
    if (!kodeInvoice) return;

    try {
      const res = await fetch(`${baseUrl}/invoice/projects/get?kodeInvoice=${kodeInvoice}`);
      const data = await res.json();
      setDataProductFromDB(data);
    } catch (err) {
      console.error('Gagal mengambil data product:', err);
    }
  };

  const fetchDataProductExcel = async () => {
    if (!kodeInvoice) return;

    try {
      const res = await fetch(`${baseUrl}/invoice/products-excel/get?kodeInvoice=${kodeInvoice}`);
      const data = await res.json();
      setDataProductExcelFromDB(data);
    } catch (err) {
      console.error('Gagal mengambil data product:', err);
    }
  };

  const fetchDataPengeluaran = async () => {
    if (!slug) return;

    try {
      const res = await fetch(`${baseUrl}/invoice/pengeluaran/get?idInvoice=${slug}`);
      const data = await res.json();
      setDataPengeluaranFromDB(data);
    } catch (err) {
      console.error('Gagal mengambil data pengeluaran:', err);
    }
  };


  useEffect(() => {
    fetchDataProduct();
    fetchDataProductExcel();
    fetchDataPengeluaran();
  }, [kodeInvoice]);


  const [dataSPKproductFromDB, setDataSPKproductFromDB] = useState([]);

  useEffect(() => {
    const getDataSPKproduct = async () => {
      try {
        const res = await fetch(`${baseUrl}/spkproduct/all/get`);
        const data = await res.json();
        setDataSPKproductFromDB(data);
      } catch (err) {
        console.error('Gagal mengambil data SPKproduct:', err);
      }
    };

    getDataSPKproduct();
  }, []);



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




  const handleSubmitUpdateInvoice = async () => {
    setShowUpdateInvoiceModal(false);

    try {
      const response = await fetch(`${baseUrl}/invoice/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: slug,
          kodeCustomer,
          tanggalMulaiInvoice,
          deadlineInvoice,
          ongkirPackingInvoice,
          adminInvoice,
          discountInvoice,
          ongkirCustInvoice,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal update invoice');
      }

      console.log('Invoice updated:', data);
      fetchDataInvoice();
    } catch (error) {
      console.error('Error updating invoice:', error.message);
    }
  };



  const handleSubmitAddProduct = async () => {
    setShowAddProductModal(false);

    if (!slug || slug === 'undefined') {
      alert('Invoice belum dipilih / invalid');
      return;
    }

    try {
      const formData = new FormData();

      formData.append('idInvoice', slug);
      formData.append('KodeInvoice', kodeInvoice);
      formData.append('Harga', harga);
      formData.append('Qty', qty);
      formData.append('NamaBarang', productName);
      formData.append('Buyer', customer);
      formData.append('Date', tanggalMulaiInvoice);
      formData.append('Deadline', deadlineInvoice);
      formData.append('Spesifikasi', spesifikasi);

      if (fileToUpload) {
        formData.append('image', fileToUpload);
      }

      const res = await fetch(`${baseUrl}/invoiceproduct/create`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Gagal menambahkan produk:', data.message);
        return;
      }

      refreshState();
      fetchDataProduct();
    } catch (e) {
      console.error('Error mengirim data produk:', e);
    }
  };

  const handleSubmitEditProduct = async () => {
    setShowEditProductModal(false);

    try {
      const formData = new FormData();

      formData.append('idProductEdit', idProductEdit);
      formData.append('Spesifikasi', spesifikasiEdit);
      formData.append('Harga', hargaEdit);
      formData.append('Qty', qtyEdit);

      // Hanya kirim gambar baru jika user upload ulang
      if (fileToUploadEdit) {
        formData.append('image', fileToUploadEdit);
      }

      // Kirim flag jika user ingin menghapus gambar
      if (imageDelete) {
        formData.append('deleteImage', 'true');
      }

      const res = await fetch(`${baseUrl}/invoiceproduct/update`, {
        method: 'PUT',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Gagal memperbarui produk:', data.message);
        return;
      }

      refreshState();
      fetchDataProduct();
    } catch (e) {
      console.error('Error mengupdate produk:', e);
    }
  };


  const handleDeleteProduct = async () => {
    setShowDeleteProductModal(false);

    try {
      const res = await fetch(`${baseUrl}/invoiceproduct/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: idProductEdit }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Gagal menghapus produk:', data.message);
        return;
      }

      fetchDataProduct(); // refresh tampilan produk setelah delete
    } catch (err) {
      console.error('Terjadi kesalahan saat menghapus produk:', err);
    }
  };




  const handleSubmitEditPengeluaran = async () => {
    setShowEditPengeluaranModal(false);

    try {
      const response = await fetch(`${baseUrl}/invoice/pengeluaran/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: idPengeluaran, // id dokumen yang mau di-update
          tanggalPengeluaran,
          kategoriPengeluaran,
          keteranganPengeluaran,
          nominalPengeluaran,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal update pengeluaran');
      }

      console.log('Pengeluaran berhasil diupdate:', result);
      fetchDataPengeluaran();
    } catch (e) {
      console.error('Error update pengeluaran:', e.message);
    }
  };


  const handleDeletePengeluaran = async () => {
    setShowDeletePengeluaranModal(false);

    try {
      const response = await fetch(`${baseUrl}/invoice/pengeluaran/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: idPengeluaran }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menghapus pengeluaran');
      }

      console.log('Pengeluaran berhasil dihapus:', result);
      fetchDataPengeluaran();
    } catch (error) {
      console.error('Error saat menghapus pengeluaran:', error.message);
    }
  };


  const handleSubmitPengeluaran = async () => {
    setShowPengeluaranModal(false);

    if (!slug || slug === 'undefined') {
      alert('Invoice belum dipilih / invalid');
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/invoice/pengeluaran/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idInvoice: slug,
          KodeInvoice: kodeInvoice,
          tanggalPengeluaran,
          kategoriPengeluaran,
          keteranganPengeluaran,
          nominalPengeluaran,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menambahkan pengeluaran');
      }

      // Reset form input (jika diperlukan)
      setPaymentDetail('');
      setPaymentTanggal('');
      setPaymentJumlah('');

      // Refresh data pengeluaran setelah submit
      fetchDataPengeluaran();

      console.log('Pengeluaran berhasil ditambahkan:', result);
    } catch (error) {
      console.error('Error submit pengeluaran:', error.message);
    }
  };



  const fetchDataPayment = async () => {
    try {
      const response = await fetch(`${baseUrl}/invoicepayment/get?idInvoice=${slug}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengambil data pembayaran invoice');
      }

      setDataInvoicePaymentFromDB(result); // Fix: langsung result
    } catch (error) {
      console.error('Error fetching data pembayaran invoice:', error.message);
    }
  };

  useEffect(() => {
    fetchDataPayment();
  }, [slug]);

  const handleSubmitPayment = async () => {
    setShowPaymentModal(false);

    if (!slug || slug === 'undefined') {
      alert('Invoice belum dipilih / invalid');
      return;
    }

    try {
      const formData = new FormData();

      formData.append('idInvoice', slug);
      formData.append('KodeInvoice', kodeInvoice);
      formData.append('detail', paymentDetail);
      formData.append('tanggal', paymentTanggal);
      formData.append('tanggalWD', paymentTanggalWD);
      formData.append('status', paymentStatus);
      formData.append('jumlah', paymentJumlah);

      if (paymentFileToUpload) {
        formData.append('image', paymentFileToUpload); // tanpa rename
      }

      const res = await fetch(`${baseUrl}/invoicepayment/create`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Gagal mengirim payment:', errorData.message);
        return;
      }

      setPaymentFileToUpload(null);
      setPaymentDetail('');
      setPaymentTanggal('');
      setPaymentJumlah('');
    } catch (e) {
      console.error('Error mengirim payment:', e);
    }

    fetchDataPayment();
  };


  const [idPaymentEdit, setIdPaymentEdit] = useState('');
  const [fileToUploadPaymentEdit, setFileToUploadPaymentEdit] = useState(null);
  const [detailEdit, setDetailEdit] = useState('');
  const [tanggalEdit, setTanggalEdit] = useState('');
  const [tanggalWDEdit, setTanggalWDEdit] = useState('');
  const [statusEdit, setStatusEdit] = useState('');
  const [jumlahEdit, setJumlahEdit] = useState('');
  const [paymentImageEdit, setPaymentImageEdit] = useState('');
  const [paymentImageDelete, setPaymentImageDelete] = useState(false);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [showDeletePaymentModal, setShowDeletePaymentModal] = useState(false);
  const handleEditPayment = (id, detail, tanggal, tanggalWD, status, jumlah, image) => {
    refreshState();
    setIdPaymentEdit(id);
    setDetailEdit(detail);
    setTanggalEdit(tanggal);
    setTanggalWDEdit(tanggalWD);
    setStatusEdit(status);
    setJumlahEdit(jumlah);
    setPaymentImageEdit(image);
    setPaymentImageDelete(false);
    setShowEditPaymentModal(true);
  };

  const handleSubmitEditPayment = async () => {
    setShowEditPaymentModal(false);

    try {
      const formData = new FormData();

      formData.append('detail', detailEdit);
      formData.append('tanggal', tanggalEdit);
      formData.append('jumlah', jumlahEdit);
      formData.append('status', statusEdit);
      formData.append('tanggalWD', statusEdit === 'Withdraw' ? '' : tanggalWDEdit);
      formData.append('paymentImageDelete', paymentImageDelete ? 'true' : 'false');

      if (fileToUploadPaymentEdit) {
        formData.append('image', fileToUploadPaymentEdit);
      }

      const res = await fetch(`${baseUrl}/invoicepayment/update/${idPaymentEdit}`, {
        method: 'PUT',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        console.log('Update berhasil:', data);
      } else {
        console.error('Update gagal:', data.message);
      }
    } catch (e) {
      console.error('Error saat update payment:', e);
    }

    // Reset form dan fetch ulang
    setFileToUploadPaymentEdit(null);
    setPaymentImageDelete(false);
    setDetailEdit('');
    setTanggalEdit('');
    setJumlahEdit('');
    setTanggalWDEdit('');
    setStatusEdit('');
    fetchDataPayment();
  };



  const handleDeletePayment = async () => {
    setShowDeletePaymentModal(false);

    try {
      const res = await fetch(`${baseUrl}/invoicepayment/delete/${idPaymentEdit}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Gagal menghapus payment:', data.message);
        return;
      }

      // Reset state jika perlu
      setIdPaymentEdit(null);
      fetchDataPayment();
    } catch (e) {
      console.error('Terjadi kesalahan saat menghapus payment:', e);
    }
  };


  const refreshState = () => {
    setFileToUpload(null);
    setProductName('');
    setSpesifikasi('');
    setHarga('');
    setQty('');

    setFileToUploadEdit(null);
    setIdProductEdit('');
    setSpesifikasiEdit('');
    setHargaEdit('');
    setQtyEdit('');
    setImageEdit('');

    setPaymentFileToUpload(null);
    setPaymentDetail('');
    setPaymentTanggal('');
    setPaymentTanggalWD('');
    setPaymentStatus('');
    setPaymentJumlah('');

    setFileToUploadPaymentEdit(null);
    setIdPaymentEdit('');
    setDetailEdit('');
    setTanggalEdit('');
    setTanggalWDEdit('');
    setStatusEdit('');
    setJumlahEdit('');
    setPaymentImageEdit('');

    setIdPengeluaran('');
    setTanggalPengeluaran('');
    setKategoriPengeluaran('');
    setKeteranganPengeluaran('');
    setNominalPengeluaran('');
  }

  const refreshStateInvoice = () => {
    setSearchKodeCustomer('');
    setKodeCustomer('');
    setCustomer('');
    setKodeInvoice('');
    setTanggalMulaiInvoice('');
    setDeadlineInvoice('');
    setOngkirPackingInvoice(0);
    setAdminInvoice(0);
    setDiscountInvoice(0);
    setOngkirCustInvoice(0);
  }



  const [showDeleteInvoiceModal, setShowDeleteInvoiceModal] = useState(false);
  const handleDeleteInvoice = async () => {
    setShowDeleteInvoiceModal(false);

    try {
      const response = await fetch(`${baseUrl}/invoice/delete/${slug}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal menghapus invoice');
      }
      fetchDataInvoice();
      navigate('/invoice');
    } catch (error) {
      console.error('Gagal menghapus invoice:', error.message);
    }
  };



  const [showSummary, setShowSummary] = useState(false);
  const handleShowSummary = async () => {
    setShowSummary(true);
  };


  const handleSearchSupplier = (supplierName, category) => {
    setShowSummary(false);
    setSearchSupplier(supplierName);
    navigate('/spk');
  };

  const handleStopShowSummary = () => {
    setShowSummary(false);
    setSummaryMonth('');
    setPaymentSummaryMonth('');
  };

  const totalNominal = filteredData.reduce((acc, spk) => acc + Number(spk.nominal), 0);
  const totalDP = filteredData.reduce((acc, spk) => acc + Number(spk.dp), 0);

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
          });
        }
      });
    });
  }

  const totalPenjualan = dataProductFromDB.reduce((total, product) => {
    return total + (product.Harga * product.Qty);
  }, 0);


  const pengeluaranLain = dataPengeluaranFromDB.reduce((total, pengeluaran) => {
    return total + Number(pengeluaran.nominalPengeluaran);
  }, 0);

  const [totalProfit, setTotalProfit] = useState(0);
  const [totalStainless, setTotalStainless] = useState(0);
  const [totalBesi, setTotalBesi] = useState(0);
  const [totalKayu, setTotalKayu] = useState(0);
  const [totalJok, setTotalJok] = useState(0);
  const [totalRotan, setTotalRotan] = useState(0);
  const [totalFinishing, setTotalFinishing] = useState(0);
  const [totalMarmer, setTotalMarmer] = useState(0);
  const [totalFiber, setTotalFiber] = useState(0);
  const [totalVeneer, setTotalVeneer] = useState(0);
  const [editingEstimasi, setEditingEstimasi] = useState(null);
  const [estimasiInputValue, setEstimasiInputValue] = useState('');

  const getEffectiveCategory = (spkTotal, product, category) => {
    const estimasiValue = Number(product[`estimasi${category}`] || 0);
    const hasSpk = spkTotal > 0;
    return {
      value: hasSpk ? spkTotal : estimasiValue,
      isEstimasi: !hasSpk && estimasiValue > 0,
    };
  };

  const saveEstimasi = async (productId, category, value) => {
    try {
      await fetch(`${baseUrl}/invoiceproduct/estimasi`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idProduct: productId, category, value: parseFloat(value) || 0 }),
      });
      fetchDataProduct();
    } catch (err) {
      console.error('Gagal menyimpan estimasi:', err);
    }
    setEditingEstimasi(null);
  };

  useEffect(() => {
    calculateGrossProfit();
  }, [dataProductFromDB, dataSPKproductFromDB, dataPengeluaranFromDB]);

  const calculateGrossProfit = () => {
    const totalProfit = dataProductFromDB.reduce((sum, product) => {
      const spkStainless = dataSPKproductFromDB.filter(item => item.idProduct === product.id && item.category === "Stainless").reduce((s, i) => s + Number(i.harga), 0);
      const spkBesi = dataSPKproductFromDB.filter(item => item.idProduct === product.id && item.category === "Besi").reduce((s, i) => s + Number(i.harga), 0);
      const spkKayu = dataSPKproductFromDB.filter(item => item.idProduct === product.id && item.category === "Kayu").reduce((s, i) => s + Number(i.harga), 0);
      const spkJok = dataSPKproductFromDB.filter(item => item.idProduct === product.id && item.category === "Jok").reduce((s, i) => s + Number(i.harga), 0);
      const spkRotan = dataSPKproductFromDB.filter(item => item.idProduct === product.id && item.category === "Rotan").reduce((s, i) => s + Number(i.harga), 0);
      const spkFinishing = dataSPKproductFromDB.filter(item => item.idProduct === product.id && item.category === "Finishing").reduce((s, i) => s + Number(i.harga), 0);
      const spkMarmer = dataSPKproductFromDB.filter(item => item.idProduct === product.id && item.category === "Marmer").reduce((s, i) => s + Number(i.harga), 0);
      const spkFiber = dataSPKproductFromDB.filter(item => item.idProduct === product.id && item.category === "Fiber").reduce((s, i) => s + Number(i.harga), 0);
      const spkVeneer = dataSPKproductFromDB.filter(item => item.idProduct === product.id && item.category === "Veneer").reduce((s, i) => s + Number(i.harga), 0);

      const hpp =
        (spkStainless || Number(product.estimasiStainless || 0)) +
        (spkBesi || Number(product.estimasiBesi || 0)) +
        (spkKayu || Number(product.estimasiKayu || 0)) +
        (spkJok || Number(product.estimasiJok || 0)) +
        (spkRotan || Number(product.estimasiRotan || 0)) +
        (spkFinishing || Number(product.estimasiFinishing || 0)) +
        (spkMarmer || Number(product.estimasiMarmer || 0)) +
        (spkFiber || Number(product.estimasiFiber || 0)) +
        (spkVeneer || Number(product.estimasiVeneer || 0));

      const profit = (product.Harga - hpp) * product.Qty;
      return sum + profit;
    }, 0);

    setTotalProfit(totalProfit - pengeluaranLain);
  };

  const getSpkTotal = (productId, category) =>
    dataSPKproductFromDB.filter(item => item.idProduct === productId && item.category === category).reduce((s, i) => s + Number(i.harga), 0);

  const getEffectiveTotal = (product, category) => {
    const spk = getSpkTotal(product.id, category);
    return spk || Number(product[`estimasi${category}`] || 0);
  };

  useEffect(() => {
    setTotalStainless(dataProductFromDB.reduce((sum, p) => sum + getEffectiveTotal(p, 'Stainless') * p.Qty, 0));
  }, [dataProductFromDB, dataSPKproductFromDB]);

  useEffect(() => {
    setTotalBesi(dataProductFromDB.reduce((sum, p) => sum + getEffectiveTotal(p, 'Besi') * p.Qty, 0));
  }, [dataProductFromDB, dataSPKproductFromDB]);

  useEffect(() => {
    setTotalKayu(dataProductFromDB.reduce((sum, p) => sum + getEffectiveTotal(p, 'Kayu') * p.Qty, 0));
  }, [dataProductFromDB, dataSPKproductFromDB]);

  useEffect(() => {
    setTotalJok(dataProductFromDB.reduce((sum, p) => sum + getEffectiveTotal(p, 'Jok') * p.Qty, 0));
  }, [dataProductFromDB, dataSPKproductFromDB]);

  useEffect(() => {
    setTotalRotan(dataProductFromDB.reduce((sum, p) => sum + getEffectiveTotal(p, 'Rotan') * p.Qty, 0));
  }, [dataProductFromDB, dataSPKproductFromDB]);

  useEffect(() => {
    setTotalFinishing(dataProductFromDB.reduce((sum, p) => sum + getEffectiveTotal(p, 'Finishing') * p.Qty, 0));
  }, [dataProductFromDB, dataSPKproductFromDB]);

  useEffect(() => {
    setTotalMarmer(dataProductFromDB.reduce((sum, p) => sum + getEffectiveTotal(p, 'Marmer') * p.Qty, 0));
  }, [dataProductFromDB, dataSPKproductFromDB]);

  useEffect(() => {
    setTotalFiber(dataProductFromDB.reduce((sum, p) => sum + getEffectiveTotal(p, 'Fiber') * p.Qty, 0));
  }, [dataProductFromDB, dataSPKproductFromDB]);

  useEffect(() => {
    setTotalVeneer(dataProductFromDB.reduce((sum, p) => sum + getEffectiveTotal(p, 'Veneer') * p.Qty, 0));
  }, [dataProductFromDB, dataSPKproductFromDB]);

  const DpMasuk = dataInvoicePaymentFromDB.reduce((total, payment) => {
    return total + Number(payment.jumlah);
  }, 0);


  //summary

  const [dataAllProductFromDB, setDataAllProductFromDB] = useState([]);
  const [dataAllInvoicePaymentFromDB, setDataAllInvoicePaymentFromDB] = useState([]);
  const [dataAllPengeluaranFromDB, setDataAllPengeluaranFromDB] = useState([]);

  const fetchDataAllProduct = async () => {
    try {
      const res = await fetch(`${baseUrl}/invoiceproduct/all/get`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      setDataAllProductFromDB(result);
    } catch (err) {
      console.error('Gagal ambil data project:', err.message);
    }
  };

  const fetchDataAllPayment = async () => {
    try {
      const res = await fetch(`${baseUrl}/invoicepayment/all/get`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      setDataAllInvoicePaymentFromDB(result);
    } catch (err) {
      console.error('Gagal ambil data invoice payment:', err.message);
    }
  };

  const fetchDataAllPengeluaran = async () => {
    try {
      const res = await fetch(`${baseUrl}/invoice/pengeluaran/all/get`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      setDataAllPengeluaranFromDB(result);
    } catch (err) {
      console.error('Gagal ambil data invoice pengeluaran:', err.message);
    }
  };


  useEffect(() => {
    fetchDataAllProduct();
    fetchDataAllPayment();
    fetchDataAllPengeluaran();
  }, [summaryMonth]);

  const indexedSPKProducts = dataSPKproductFromDB.reduce((acc, item) => {
    if (!acc[item.idProduct]) acc[item.idProduct] = [];
    acc[item.idProduct].push(item);
    return acc;
  }, {});

  const calculateGrossProfitSummary = (idInvoice) => {
    const products = dataAllProductFromDB.filter(product => product.idInvoice === idInvoice);
    let totalProfit = 0;

    products.forEach(product => {
      const spkItems = indexedSPKProducts[product.id] || [];

      const categoryTotals = spkItems.reduce((totals, item) => {
        if (!totals[item.category]) totals[item.category] = 0;
        totals[item.category] += Number(item.harga);
        return totals;
      }, {});

      const hpp = ["Stainless", "Besi", "Kayu", "Jok", "Rotan", "Finishing", "Marmer", "Fiber", "Veneer"]
        .map(cat => categoryTotals[cat] || Number(product[`estimasi${cat}`] || 0))
        .reduce((sum, price) => sum + price, 0);

      totalProfit += (product.Harga - hpp) * product.Qty;
    });

    return totalProfit;
  };

  const calculateSummary = (data, idInvoice, field) =>
    data
      .filter(item => item.idInvoice === idInvoice)
      .reduce((total, item) => total + parseFloat(item[field] || 0), 0);

  const nilaiOrderSummary = (idInvoice) =>
    dataAllProductFromDB
      .filter(product => product.idInvoice === idInvoice)
      .reduce((total, product) => total + parseFloat(product.Harga * product.Qty), 0);

  const DpMasukSummary = (idInvoice) =>
    calculateSummary(dataAllInvoicePaymentFromDB, idInvoice, "jumlah");

  const pengeluaranLainSummary = (idInvoice) =>
    calculateSummary(dataAllPengeluaranFromDB, idInvoice, "nominalPengeluaran");



  let totalNilaiOrder = 0;
  let totalKekurangan = 0;
  let totalGrossProfit = 0;
  let totalGrossProfitPaymentSummary = 0;

  const nilaiOrderTotal = () => {
    // Ambil semua ID dari backUpDataInvoice dalam bentuk array
    const invoiceIds = backUpDataInvoice.map(invoice => invoice.id);

    return dataAllProductFromDB
      .filter(product => invoiceIds.includes(product.idInvoice)) // Filter berdasarkan idInvoice yang ada di backUpDataInvoice
      .reduce((total, product) => {
        const harga = parseFloat(product.Harga);
        const qty = parseFloat(product.Qty);

        if (isNaN(harga) || isNaN(qty)) {
          return total;
        }

        return total + harga * qty;
      }, 0);
  };




  const nilaiOngkirTotal = () => {
    return backUpDataInvoice
      .reduce((total, item) => {
        const ongkirCustInvoice = parseFloat(item.ongkirCustInvoice);

        // Check if harga and qty are valid numbers
        if (isNaN(ongkirCustInvoice)) {
          // console.error(`Invalid data for item: ${JSON.stringify(item)}`);
          return total;
        }

        return total + ongkirCustInvoice;
      }, 0);
  };

  const nilaiDiscountTotal = () => {
    return backUpDataInvoice
      .reduce((total, item) => {
        const discountInvoice = parseFloat(item.discountInvoice);

        // Check if harga and qty are valid numbers
        if (isNaN(discountInvoice)) {
          // console.error(`Invalid data for item: ${JSON.stringify(item)}`);
          return total;
        }

        return total + discountInvoice;
      }, 0);
  };


  const nilaiPaymentTotal = () => {
    let total = 0;

    backUpDataInvoice.forEach((invoice) => {
      const matchingPayments = dataAllInvoicePaymentFromDB.filter(
        (payment) => payment.idInvoice === invoice.id
      );

      matchingPayments.forEach((payment) => {
        const jumlah = parseFloat(payment.jumlah);
        if (!isNaN(jumlah)) {
          total += jumlah;
        } else {
          // console.error(`Invalid jumlah for payment: ${JSON.stringify(payment)}`);
        }
      });
    });

    return total;
  };

  const nilaiPaymentHoldTotal = () => {
    let total = 0;

    backUpDataInvoice.forEach((invoice) => {
      const matchingPayments = dataAllInvoicePaymentFromDB.filter(
        (payment) => payment.idInvoice === invoice.id && payment.status === 'Hold'
      );

      matchingPayments.forEach((payment) => {
        const jumlah = parseFloat(payment.jumlah);
        if (!isNaN(jumlah)) {
          total += jumlah;
        } else {
          // console.error(`Invalid jumlah for payment: ${JSON.stringify(payment)}`);
        }
      });
    });

    return total;
  };


  const [invoicePaymentSummary, setInvoicePaymentSummary] = useState([]);

  useEffect(() => {
    const fetchInvoicePayments = async () => {
      try {
        const response = await fetch(`${baseUrl}/invoicepayment/summary/get`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoiceIds: backUpDataInvoice.map(invoice => invoice.id),
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Gagal mengambil data pembayaran invoice');
        }

        setInvoicePaymentSummary(result.payments);
      } catch (error) {
        console.error('Error saat fetch summary pembayaran:', error.message);
      }
    };

    if (backUpDataInvoice.length > 0) {
      fetchInvoicePayments();
    }
  }, [backUpDataInvoice]);


  const filteredPayments = filteredInvoicePaymentSummary.filter(item => {
    if (item.status === 'Direct') {
      return item.tanggal.startsWith(paymentSummaryMonth);
    } else if (item.status === 'Withdraw') {
      return item.tanggalWD.startsWith(paymentSummaryMonth);
    }
    return false;
  });

  const totalUangMasuk = filteredPayments.reduce((total, item) => total + Number(item.jumlah), 0);


  useEffect(() => {
    const getDataKodeCustomer = async () => {
      try {
        const response = await fetch(`${baseUrl}/accounting/cust/get`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Gagal mengambil data customer');
        }

        setDataKodeCustomerFromDB(data);
      } catch (error) {
        console.error('Error saat mengambil data kode customer:', error.message);
      }
    };

    getDataKodeCustomer();
  }, []);


  useEffect(() => {
    setFilteredCustomers(
      dataKodeCustomerFromDB.filter(customer =>
        customer.kodeCust.toLowerCase().includes(searchKodeCustomer.toLowerCase()) ||
        customer.namaCust.toLowerCase().includes(searchKodeCustomer.toLowerCase())
      )
    );
  }, [searchKodeCustomer, dataKodeCustomerFromDB]);


  useEffect(() => {
    setFilteredInvoicePaymentSummary(invoicePaymentSummary.filter((item) => item.KodeInvoice.toLowerCase().includes(searchTerm.toLowerCase())));
  }, [searchTerm, paymentSummaryMonth, filterPaymentSummary, invoicePaymentSummary]);


  const [isScrolled, setIsScrolled] = useState(false);
  const scrollableElementRef = useRef(null); // Mengacu ke elemen yang di-scroll

  useEffect(() => {
    const handleScroll = () => {
      if (scrollableElementRef.current) {
        const scrollTop = scrollableElementRef.current.scrollTop;
        setIsScrolled(scrollTop > 50); // Cek jika elemen yang di-scroll melebihi 50px
      }
    };

    const element = scrollableElementRef.current;

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

  const [isScrolled2, setIsScrolled2] = useState(false);
  const scrollableElementRef2 = useRef(null); // Mengacu ke elemen yang di-scroll

  useEffect(() => {
    const handleScroll2 = () => {
      if (scrollableElementRef2.current) {
        const scrollTop = scrollableElementRef2.current.scrollTop;
        setIsScrolled2(scrollTop > 50); // Cek jika elemen yang di-scroll melebihi 50px
      }
    };

    const element = scrollableElementRef2.current;

    // Tambahkan event listener untuk elemen yang di-scroll
    if (element) {
      element.addEventListener("scroll", handleScroll2);
    }

    // Hapus event listener ketika komponen di-unmount
    return () => {
      if (element) {
        element.removeEventListener("scroll", handleScroll2);
      }
    };
  }, []);

  const [isElementVisiblePengeluaran, setIsElementVisiblePengeluaran] = useState(false);
  const targetElementRefPengeluaran = useRef(null); // Referensi ke elemen yang diinginkan

  useEffect(() => {
    const handleScroll = () => {
      if (targetElementRefPengeluaran.current) {
        const rect = targetElementRefPengeluaran.current.getBoundingClientRect();
        const vh = window.innerHeight;

        // Cek apakah elemen telah terlihat + 20vh
        const isVisible = rect.top >= 0 && rect.top <= (vh * 0.2);
        setIsElementVisiblePengeluaran(isVisible);
      }
    };

    const element = scrollableElementRef2.current;

    if (element) {
      element.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (element) {
        element.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);




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

  // untuk payment summary
  const [isScrolledPaymentSummary, setIsScrolledPaymentSummary] = useState(false);
  const scrollableElementRefPaymentSummary = useRef(null); // Mengacu ke elemen yang di-scroll

  useEffect(() => {
    const handleScroll = () => {
      if (scrollableElementRefPaymentSummary.current) {
        const scrollTop = scrollableElementRefPaymentSummary.current.scrollTop;
        setIsScrolledPaymentSummary(scrollTop > 50); // Cek jika elemen yang di-scroll melebihi 50px
      }
    };

    const element = scrollableElementRefPaymentSummary.current;

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

  const { globalTheme } = useTheme();


  //optimasi payment summary
  // Preprocess data
  const invoiceMap = new Map(backUpDataInvoice.map(inv => [inv.id, inv]));
  const filteredDataMap = new Map(filteredData.map(inv => [inv.id, inv]));
  const paymentGroupedByInvoice = invoicePaymentSummary.reduce((acc, payment) => {
    if (!acc[payment.idInvoice]) acc[payment.idInvoice] = [];
    acc[payment.idInvoice].push(payment);
    return acc;
  }, {});

  // Calculate nilaiOrder for each invoice in advance
  const nilaiOrderCache = new Map();
  filteredInvoicePaymentSummary.forEach(item => {
    if (!nilaiOrderCache.has(item.idInvoice)) {
      const invoice = invoiceMap.get(item.idInvoice) || {};
      const nilaiOrder = Number(nilaiOrderSummary(item.idInvoice)) +
        (invoice.ongkirCustInvoice ? Number(invoice.ongkirCustInvoice) : 0) -
        (invoice.discountInvoice ? Number(invoice.discountInvoice) : 0);
      nilaiOrderCache.set(item.idInvoice, nilaiOrder);
    }
  });

  const handleSubmitExcelDetails = async () => {
    try {
      // mapping: index produk -> array URL gambar
      const mappedImages = {};
      Object.keys(imageAssignments).forEach((imgIndex) => {
        const productIndex = imageAssignments[imgIndex]; // "0" atau "1"
        const imageUrl = excelDetailData.images[imgIndex]; // URL asli dari daftar gambar

        if (!mappedImages[productIndex]) {
          mappedImages[productIndex] = [];
        }
        mappedImages[productIndex].push(imageUrl);
      });

      const payload = {
        idInvoice: slug,
        KodeInvoice: kodeInvoice,
        Buyer: customer,
        Date: tanggalMulaiInvoice instanceof Date
          ? tanggalMulaiInvoice.toISOString().split('T')[0]
          : tanggalMulaiInvoice,
        Deadline: deadlineInvoice instanceof Date
          ? deadlineInvoice.toISOString().split('T')[0]
          : deadlineInvoice,
        products: excelDetailData.products,
        imageAssignments: mappedImages, // kirim URL gambar, bukan angka
        version:
          dataProductExcelFromDB.length > 0
            ? Math.max(...dataProductExcelFromDB.map(item => item.version || 1)) + 1
            : 1 // kalau belum ada, mulai dari 1
      };

      console.log("Data yang dikirim ke API:", payload);

      const res = await fetch(`${baseUrl}/invoice/save-excel-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Gagal menyimpan data");
      setShowExcelDetailModal(false);
      fetchDataProduct();
      fetchDataProductExcel();
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menyimpan data");
    }
  };



  const useDebouncedNamaBarangExcelChange = (updateFn) => {
    return useCallback(
      debounce((i, value, products, setExcelDetailData) => {
        const updatedProducts = [...products];
        updatedProducts[i] = { ...updatedProducts[i], namaBarang: value };
        setExcelDetailData(prev => ({ ...prev, products: updatedProducts }));
      }, 300),
      []
    );
  };

  const debouncedNamaBarangExcelChange = useDebouncedNamaBarangExcelChange();


  return (
    <>
      <Container style={{ display: summaryMonth || paymentSummaryMonth ? "none" : "block" }}>
        <Row className="">
          <Col md={4} className='lowonganPekerjaan overflow-auto pekerjaan' style={{ display: isMobile && slug || displayFull ? 'none' : '' }} ref={scrollableElementRef}>


            <h4
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                ...(isMobile ? { top: -1 } : { top: 0 }),
                zIndex: 1,
                padding: '10px',
                backgroundColor: isScrolled ? (globalTheme === "light" ? "#f3f3f3" : "#151515") : "transparent",
                borderRadius: "30px",
                border: isScrolled ? (globalTheme === "light" ? "1px solid #5f5f5f" : "1px solid white") : "1px solid transparent",
                transition: "background-color 1s ease, border 1s ease",
              }}
            >
              <span style={{ display: showSearch ? "none" : "block", color: globalTheme == "light" ? "#000000" : "#ffffff" }}>List Invoice</span>
              <input type="text" placeholder="Search..." defaultValue={searchTerm} onChange={useCallback(debounce((e) => setSearchTerm(e.target.value), 300), [])} style={{ fontSize: '12px', borderRadius: '20px', padding: '5px', display: showSearch ? 'block' : 'none' }} />
              <div>
                <span style={{ fontSize: '25px', cursor: "pointer", color: isIconBlue ? 'blue' : 'inherit' }} onClick={handleSearchClick}>
                  <IoSearch className='button-effect' style={{ color: globalTheme == "light" ? "#000000" : "#ffffff" }} />
                </span>
                <span style={{ fontSize: "25px", cursor: "pointer", marginLeft: "5px" }} onClick={handleShowSummary} >
                  <MdOutlineAssignment className='button-effect' style={{ color: globalTheme == "light" ? "#000000" : "#ffffff" }} />
                </span>
                <MdFormatListBulletedAdd className='button-effect' style={{ marginLeft: "5px", cursor: "pointer", color: globalTheme == "light" ? "#000000" : "#ffffff" }} onClick={() => { setShowAddInvoiceModal(true); refreshStateInvoice(); }} />
              </div>
            </h4>

            {filteredData.length === 0 ? (
              // Show skeletons while loading
              [...Array(20)].map((_, index) => (
                <Row key={index}>
                  <Col>
                    <div className="listSPK d-flex position-relative mb-1 shadow" style={{ backgroundImage: globalTheme === "light" ? "linear-gradient(to right, #ffffff, #e7e7e7)" : "linear-gradient(to right, #151515, #252525)", border: globalTheme === "light" ? "2px solid #d2d2d2" : "2px solid #7a7a7a" }}>
                      <div style={{ width: '100%', height: '100%' }}>
                        <Skeleton active />
                      </div>
                    </div>
                  </Col>
                </Row>
              ))
            ) : null}

            {filteredData.map((invoice, index) => (
              <Row key={index}>
                <Col>
                  <Link to={`/invoice/${invoice.id}`}>
                    <div className={`listSPK d-flex position-relative mb-1 shadow tema-${globalTheme} ${invoice.id === slug ? `selected` : ""}`} style={{ backgroundImage: invoice.id === slug ? (globalTheme === "light" ? "linear-gradient(to right, #cbcbcb, #e7e7e7)" : "linear-gradient(to right, #404040, #252525)") : (globalTheme === "light" ? "linear-gradient(to right, #ffffff, #e7e7e7)" : "linear-gradient(to right, #151515, #252525)"), border: invoice.id === slug ? (globalTheme === "light" ? "2px solid #c1c1c1" : "2px solid #8e8e8e") : (globalTheme === "light" ? "2px solid rgb(163, 163, 163)" : "2px solid #7a7a7a") }}>
                      <h6 style={{ color: globalTheme == "light" ? "black" : "white" }}>{invoice.customer}</h6>
                      <small className="position-absolute bottom-0 start-0 p-3" style={{ color: globalTheme == "light" ? "black" : "#e9e9e9" }}>{invoice.kodeInvoice}</small>
                    </div>
                  </Link>
                </Col>
              </Row>
            ))}
          </Col>
          <Col md={displayFull ? 12 : 8} ref={scrollableElementRef2} className='lowonganPekerjaan overflow-auto pekerjaan' style={{ display: isMobile && !slug ? 'none' : '' }}>


            <h4
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px',
                color: globalTheme == "light" ? "#000000" : "#ffffff",
              }}
            >
              <span>Detail Invoice</span>
              <Button className='button-effect2' style={{ marginBottom: "-5px", marginTop: "-5px", display: slug ? 'block' : 'none' }} variant="secondary" onClick={() => setDisplayFull((prevDisplayFull) => !prevDisplayFull)}><FaDisplay /> {displayFull ? "Split" : "Full"}</Button>
            </h4>



            {/* detail Invoice */}
            <div className={`SPK mb-1 shadow tema-${globalTheme}`} style={{ display: searchSupplier !== '' && !slug ? 'none' : '', backgroundImage: globalTheme === "light" ? "linear-gradient(to right, #ffffff, #e7e7e7)" : "linear-gradient(to right, #151515, #303030)", border: globalTheme === "light" ? "2px solid rgb(163, 163, 163)" : "2px solid #7a7a7a" }}>

              <div className='overflow-auto'>
                <div className={`${isMobile ? '' : 'd-flex justify-content-between'}`} onClick={() => { setShowUpdateInvoiceModal(true); setSearchKodeCustomer(''); }} style={{ cursor: "pointer" }}>

                  <div className={`p-2 ${globalTheme === 'light' ? 'text-dark' : 'text-light'} hover-effect fw-semibold`}>
                    <table>
                      <tbody>
                        <tr>
                          <td><small style={{ marginRight: '10px' }}>Customer</small></td>
                          <td><small>: {dataInvoiceFromDB.length > 0 ? dataInvoiceFromDB[0].customer : ''}</small></td>
                          <td><small style={{ marginRight: '50px' }}></small></td>
                          <td><small style={{ marginRight: '10px' }}>Total Besi</small></td>
                          <td><small>: Rp. {Number(totalBesi).toLocaleString('id-ID')}</small></td>
                          <td><small style={{ marginRight: '50px' }}></small></td>
                          <td><small style={{ marginRight: '10px' }}>Admin</small></td>
                          <td><small>: Rp. {Number(adminInvoice).toLocaleString('id-ID')}</small></td>
                        </tr>
                        <tr>
                          <td><small style={{ marginRight: '10px' }}>Kode Customer</small></td>
                          <td><small>: {kodeCustomer}</small></td>
                          <td><small style={{ marginRight: '50px' }}></small></td>
                          <td><small style={{ marginRight: '10px' }}>Total Kayu</small></td>
                          <td><small>: Rp. {Number(totalKayu).toLocaleString('id-ID')}</small></td>
                          <td><small style={{ marginRight: '50px' }}></small></td>
                          <td><small style={{ marginRight: '10px' }}>Pengeluaran Lain</small></td>
                          <td><small>: Rp. {Number(pengeluaranLain).toLocaleString('id-ID')}</small></td>
                        </tr>
                        <tr>
                          <td><small style={{ marginRight: '10px' }}>Kode Invoice</small></td>
                          <td><small>: {dataInvoiceFromDB.length > 0 ? dataInvoiceFromDB[0].kodeInvoice : ''}</small></td>
                          <td><small style={{ marginRight: '50px' }}></small></td>
                          <td><small style={{ marginRight: '10px' }}>Total Jok</small></td>
                          <td><small>: Rp. {Number(totalJok).toLocaleString('id-ID')}</small></td>
                          <td><small style={{ marginRight: '50px' }}></small></td>
                          <td><small style={{ marginRight: '10px' }}>Discount</small></td>
                          <td><small>: Rp. {Number(discountInvoice).toLocaleString('id-ID')}</small></td>
                        </tr>
                        <tr>
                          <td><small style={{ marginRight: '10px' }}>Tanggal Mulai</small></td>
                          <td><small>: {dataInvoiceFromDB.length > 0 ? new Date(dataInvoiceFromDB[0].tanggalMulaiInvoice).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</small></td>
                          <td><small style={{ marginRight: '50px' }}></small></td>
                          <td><small style={{ marginRight: '10px' }}>Total Rotan</small></td>
                          <td><small>: Rp. {Number(totalRotan).toLocaleString('id-ID')}</small></td>
                          <td><small style={{ marginRight: '50px' }}></small></td>
                          <td><small style={{ marginRight: '10px' }}>Ongkir Cust</small></td>
                          <td><small>: Rp. {Number(ongkirCustInvoice).toLocaleString('id-ID')}</small></td>
                        </tr>
                        <tr>
                          <td><small style={{ marginRight: '10px' }}>Deadline</small></td>
                          <td><small>: {dataInvoiceFromDB.length > 0 ? new Date(dataInvoiceFromDB[0].deadlineInvoice).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</small></td>
                          <td><small style={{ marginRight: '50px' }}></small></td>
                          <td><small style={{ marginRight: '10px' }}>Total Finishing</small></td>
                          <td><small>: Rp. {Number(totalFinishing).toLocaleString('id-ID')}</small></td>
                          <td><small style={{ marginRight: '50px' }}></small></td>
                          <td><small style={{ marginRight: '10px' }}>DP Masuk</small></td>
                          <td><small>: Rp. {Number(DpMasuk).toLocaleString('id-ID')}</small></td>
                        </tr>
                        <tr>
                          <td><small style={{ marginRight: '10px' }}>Total Penjualan</small></td>
                          <td><small>: Rp. {(Number(totalPenjualan) + Number(ongkirCustInvoice) - Number(discountInvoice)).toLocaleString('id-ID')}</small></td>
                          <td><small style={{ marginRight: '50px' }}></small></td>
                          <td><small style={{ marginRight: '10px' }}>Total Marmer</small></td>
                          <td><small>: Rp. {Number(totalMarmer).toLocaleString('id-ID')}</small></td>
                          <td><small style={{ marginRight: '50px' }}></small></td>
                          <td><small style={{ marginRight: '10px' }}>Kekurangan</small></td>
                          <td><small>: Rp. {(Number(totalPenjualan) + Number(ongkirCustInvoice) - Number(discountInvoice) - Number(DpMasuk)).toLocaleString('id-ID')}</small></td>
                        </tr>

                        <tr>
                          <td><small style={{ marginRight: '10px' }}>Gross Profit</small></td>
                          <td><small>: Rp. {(Number(totalProfit) + Number(ongkirCustInvoice) - Number(ongkirPackingInvoice) - Number(adminInvoice) - Number(discountInvoice)).toLocaleString('id-ID')}</small></td>
                          <td></td>
                          <td><small style={{ marginRight: '10px' }}>Total Fiber</small></td>
                          <td><small>: Rp. {Number(totalFiber).toLocaleString('id-ID')}</small></td>
                          <td></td>
                          <td><small style={{ marginRight: '10px' }}>Ongkir & Packing</small></td>
                          <td><small>: Rp. {Number(ongkirPackingInvoice).toLocaleString('id-ID')}</small></td>
                        </tr>

                        <tr>
                          <td><small style={{ marginRight: '10px' }}>Total Stainless</small></td>
                          <td><small>: Rp. {Number(totalStainless).toLocaleString('id-ID')}</small></td>
                          <td></td>
                          <td><small style={{ marginRight: '10px' }}>Total Veneer</small></td>
                          <td><small>: Rp. {Number(totalVeneer).toLocaleString('id-ID')}</small></td>
                          <td></td>
                          <td><small style={{ marginRight: '10px' }}></small></td>
                          <td><small></small></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>



                </div>

                {slug && (
                  <div className='px-2'>
                    <button
                      className="btn btn-success btn-sm d-flex align-items-center gap-1"
                      onClick={() => {
                        setSelectedExcelFile(null);
                        setShowExcelModal(true);
                      }}
                    >
                      <RiFileExcel2Line size={16} />
                      Excel
                    </button>

                  </div>
                )}



                {/* Modal */}
                <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showExcelModal} onHide={() => setShowExcelModal(false)}>
                  <Modal.Header closeButton>
                    <Modal.Title>Excel</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <div className="d-flex flex-wrap gap-2">
                      {versions.length > 0 ? (
                        versions.map(v => (
                          <button
                            key={v}
                            className={`btn btn-success btn-sm`}
                            onClick={() => {
                              setSelectedVersion(v);
                              setShowExcelModal(false);
                              setShowVersionModal(true);
                            }}
                          >
                            Versi {v}
                          </button>
                        ))
                      ) : (
                        <p className="text-muted">Belum ada data excel.</p>
                      )}
                    </div>
                  </Modal.Body>
                  <Modal.Footer className="w-100">
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      className="form-control w-100"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;

                        setSelectedExcelFile(file);

                        try {
                          const formData = new FormData();
                          formData.append("file", file);

                          const res = await fetch(`${baseUrl}/invoice/upload-excel`, {
                            method: "POST",
                            body: formData,
                          });

                          if (!res.ok) {
                            throw new Error("Upload gagal");
                          }

                          const data = await res.json();
                          console.log("Response dari server:", data);

                          // Simpan data untuk modal detail
                          setExcelDetailData(data);
                          setShowExcelModal(false);
                          setShowExcelDetailModal(true);
                          setImageAssignments({});
                        } catch (error) {
                          console.error("Error upload Excel:", error);
                          alert("Gagal upload file");
                        }
                      }}
                    />
                  </Modal.Footer>

                </Modal>
                {/* End Modal */}

                <Modal
                  show={showVersionModal}
                  onHide={() => setShowVersionModal(false)}
                  size="xl"
                >
                  <Modal.Header closeButton>
                    <Modal.Title>Data Versi {selectedVersion}</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <div ref={modalContainerRef}>
                      <div className="table-responsive mb-3">
                        <table className="table table-hover table-striped align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>No</th>
                              <th>Gambar</th>
                              <th>Nama Barang</th>
                              <th>Detail</th>
                              <th>Harga</th>
                              <th>Qty</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dataProductExcelFromDB
                              .filter(item => item.version === selectedVersion)
                              .map((p, i) => {
                                let imageUrl = "";
                                for (let j = 1; j <= 10; j++) {
                                  if (p[`image${j}`]) {
                                    imageUrl = p[`image${j}`];
                                    break;
                                  }
                                }

                                return (
                                  <tr key={i}>
                                    <td>{i + 1}</td>
                                    <td style={{ width: "80px" }}>
                                      {imageUrl ? (
                                        <Image
                                          width={100}
                                          height={100}
                                          style={{ objectFit: "cover", borderRadius: "8px" }}
                                          src={getImageUrl(imageUrl)}
                                          preview={{
                                            getContainer: () => modalContainerRef.current,
                                          }}
                                        />
                                      ) : (
                                        <span className="text-muted">No image</span>
                                      )}
                                    </td>
                                    <td style={{ width: "150px" }}>{p.NamaBarang}</td>
                                    <td style={{ whiteSpace: 'pre-line' }}>{p.Spesifikasi}</td>
                                    <td>{`Rp ${p.Harga.toLocaleString('id-ID')}`}</td>
                                    <td>{p.Qty}</td>
                                    <td>{`Rp ${(p.Harga * p.Qty).toLocaleString('id-ID')}`}</td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </Modal.Body>
                </Modal>



                <Modal
                  size="xl"
                  centered
                  show={showExcelDetailModal}
                  onHide={() => setShowExcelDetailModal(false)}
                  className="modern-modal"
                >
                  <Modal.Header closeButton>
                    <Modal.Title className="fw-bold text-success">
                      Detail Excel
                    </Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    {excelDetailData ? (
                      <>
                        <h5 className="mb-3 text-muted">{excelDetailData.filename}</h5>
                        <Tab.Container defaultActiveKey="products">
                          <Nav variant="tabs" className="mb-3">
                            <Nav.Item>
                              <Nav.Link eventKey="products">Produk</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                              <Nav.Link eventKey="images">Gambar</Nav.Link>
                            </Nav.Item>
                          </Nav>
                          <Tab.Content>
                            <Tab.Pane eventKey="products">
                              <div className="table-responsive">
                                <table className="table table-hover table-striped align-middle">
                                  <thead className="table-light">
                                    <tr>
                                      <th>No</th>
                                      <th>Nama Barang</th>
                                      <th>Produk</th>
                                      <th>Detail</th>
                                      <th>Harga</th>
                                      <th>Qty</th>
                                      <th>Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {excelDetailData.products.map((p, i) => (
                                      <tr key={i}>
                                        <td>{i + 1}</td>
                                        <td style={{ width: "150px" }}>
                                          <input
                                            type="text"
                                            className="form-control form-control-sm w-100"
                                            defaultValue={p.namaBarang || ""}
                                            onChange={(e) =>
                                              debouncedNamaBarangExcelChange(i, e.target.value, excelDetailData.products, setExcelDetailData)
                                            }
                                          />
                                        </td>
                                        <td style={{ width: "200px" }}>
                                          <select
                                            className="form-select form-select-sm"
                                            value={p.selectedExistingId || ""} // simpan id produk lama kalau dipilih
                                            onChange={(e) => {
                                              const newProducts = [...excelDetailData.products];
                                              newProducts[i].selectedExistingId = e.target.value;
                                              setExcelDetailData({ ...excelDetailData, products: newProducts });
                                            }}
                                          >
                                            <option value="">Produk Baru</option>
                                            {dataProductFromDB.map((prod) => (
                                              <option key={prod._id} value={prod._id}>
                                                {prod.NamaBarang}
                                              </option>
                                            ))}
                                          </select>
                                        </td>
                                        <td style={{ whiteSpace: 'pre-line' }}>{p.detail}</td>
                                        <td>{p.price}</td>
                                        <td>{p.quantity}</td>
                                        <td>{p.total}</td>
                                      </tr>
                                    ))}
                                  </tbody>



                                </table>
                              </div>
                            </Tab.Pane>
                            <Tab.Pane eventKey="images">
                              <div className="row g-3">
                                {excelDetailData.images.length > 0 ? (
                                  excelDetailData.images.map((img, i) => (
                                    <div className="col-6 col-md-2" key={i}>
                                      <div className="card shadow-sm border-0 p-2">
                                        <img
                                          src={getImageUrl(img)}
                                          alt={img}
                                          className="card-img-top rounded mb-2"
                                          style={{
                                            aspectRatio: "1 / 1",
                                            width: "100%",
                                            objectFit: "cover"
                                          }}
                                        />

                                        <select
                                          className="form-select form-select-sm"
                                          value={imageAssignments[i] || ""}
                                          onChange={(e) =>
                                            setImageAssignments((prev) => ({
                                              ...prev,
                                              [i]: e.target.value,
                                            }))
                                          }
                                        >
                                          <option value="">None</option>
                                          {excelDetailData.products.map((p, idx) => (
                                            <option key={idx} value={idx}>
                                              Produk {idx + 1} - {p.detail.slice(0, 20)}...
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-muted">Tidak ada gambar ditemukan.</p>
                                )}
                              </div>
                            </Tab.Pane>

                          </Tab.Content>
                        </Tab.Container>
                      </>
                    ) : (
                      <p className="text-muted">Tidak ada data.</p>
                    )}
                  </Modal.Body>
                  <Modal.Footer>
                    <button
                      className="btn btn-primary"
                      onClick={handleSubmitExcelDetails}
                    >
                      Submit
                    </button>
                  </Modal.Footer>

                </Modal>







                <div className={`p-2 ${globalTheme === 'light' ? 'text-dark' : 'text-light'}`}>
                  <table>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                      <tr>
                        <th className='tableStyle text-center' style={{ position: 'sticky', top: 0, backgroundColor: globalTheme === 'light' ? '#f8f9fa' : '#2a2a2a' }}>No</th>
                        <th className='tableStyle text-center' style={{ position: 'sticky', top: 0, backgroundColor: globalTheme === 'light' ? '#f8f9fa' : '#2a2a2a' }}>Gambar</th>
                        <th className='tableStyle text-center' style={{ position: 'sticky', top: 0, backgroundColor: globalTheme === 'light' ? '#f8f9fa' : '#2a2a2a' }}>Nama</th>
                        <th className='tableStyle text-center' style={{ position: 'sticky', top: 0, backgroundColor: globalTheme === 'light' ? '#f8f9fa' : '#2a2a2a' }}>Dimensi</th>
                        <th className='tableStyle text-center' style={{ position: 'sticky', top: 0, backgroundColor: globalTheme === 'light' ? '#f8f9fa' : '#2a2a2a' }}>Stainless</th>
                        <th className='tableStyle text-center' style={{ position: 'sticky', top: 0, backgroundColor: globalTheme === 'light' ? '#f8f9fa' : '#2a2a2a' }}>Besi</th>
                        <th className='tableStyle text-center' style={{ position: 'sticky', top: 0, backgroundColor: globalTheme === 'light' ? '#f8f9fa' : '#2a2a2a' }}>Kayu</th>
                        <th className='tableStyle text-center' style={{ position: 'sticky', top: 0, backgroundColor: globalTheme === 'light' ? '#f8f9fa' : '#2a2a2a' }}>Jok</th>
                        <th className='tableStyle text-center' style={{ position: 'sticky', top: 0, backgroundColor: globalTheme === 'light' ? '#f8f9fa' : '#2a2a2a' }}>Rotan</th>
                        <th className='tableStyle text-center' style={{ position: 'sticky', top: 0, backgroundColor: globalTheme === 'light' ? '#f8f9fa' : '#2a2a2a' }}>Finishing</th>
                        <th className='tableStyle text-center' style={{ position: 'sticky', top: 0, backgroundColor: globalTheme === 'light' ? '#f8f9fa' : '#2a2a2a' }}>Marmer</th>
                        <th className='tableStyle text-center' style={{ position: 'sticky', top: 0, backgroundColor: globalTheme === 'light' ? '#f8f9fa' : '#2a2a2a' }}>Fiber</th>
                        <th className='tableStyle text-center' style={{ position: 'sticky', top: 0, backgroundColor: globalTheme === 'light' ? '#f8f9fa' : '#2a2a2a' }}>Veneer</th>
                        <th className='tableStyle text-center' style={{ position: 'sticky', top: 0, backgroundColor: globalTheme === 'light' ? '#f8f9fa' : '#2a2a2a' }}>HPP</th>
                        <th className='tableStyle text-center' style={{ position: 'sticky', top: 0, backgroundColor: globalTheme === 'light' ? '#f8f9fa' : '#2a2a2a' }}>Jual</th>
                        <th className='tableStyle text-center' style={{ position: 'sticky', top: 0, backgroundColor: globalTheme === 'light' ? '#f8f9fa' : '#2a2a2a' }}>Qty</th>
                        <th className='tableStyle text-center' style={{ position: 'sticky', top: 0, backgroundColor: globalTheme === 'light' ? '#f8f9fa' : '#2a2a2a' }}>Gross Profit</th>
                        <th className='tableStyle text-center' style={{ position: 'sticky', top: 0, backgroundColor: globalTheme === 'light' ? '#f8f9fa' : '#2a2a2a' }}>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataProductFromDB.map((product, index) => {
                        const categories = ["Stainless", "Besi", "Kayu", "Jok", "Rotan", "Finishing", "Marmer", "Fiber", "Veneer"];

                        const spkTotals = {};
                        categories.forEach(cat => {
                          spkTotals[cat] = dataSPKproductFromDB
                            .filter(item => item.idProduct === product.id && item.category === cat)
                            .reduce((s, i) => s + Number(i.harga), 0);
                        });

                        const effectiveValues = {};
                        categories.forEach(cat => {
                          const spk = spkTotals[cat];
                          const est = Number(product[`estimasi${cat}`] || 0);
                          effectiveValues[cat] = { value: spk || est, isEstimasi: !spk && est > 0 };
                        });

                        const hpp = categories.reduce((sum, cat) => sum + effectiveValues[cat].value, 0);
                        const profit = (product.Harga - hpp) * product.Qty;

                        const renderCategoryCell = (cat) => {
                          const { value, isEstimasi } = effectiveValues[cat];
                          const isEditing = editingEstimasi?.productId === product.id && editingEstimasi?.category === cat;
                          const hasSpk = spkTotals[cat] > 0;

                          if (isEditing) {
                            return (
                              <td key={cat} className='tableStyle text-center' style={{ backgroundColor: '#fffde7', padding: '2px' }}>
                                <input
                                  autoFocus
                                  type="number"
                                  style={{ width: '90px', textAlign: 'center', border: '1px solid #f0c000', borderRadius: '4px', padding: '2px 4px' }}
                                  value={estimasiInputValue}
                                  onChange={(e) => setEstimasiInputValue(e.target.value)}
                                  onBlur={() => saveEstimasi(product.id, cat, estimasiInputValue)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEstimasi(product.id, cat, estimasiInputValue);
                                    if (e.key === 'Escape') setEditingEstimasi(null);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </td>
                            );
                          }

                          return (
                            <td
                              key={cat}
                              className='tableStyle text-center'
                              style={{
                                backgroundColor: isEstimasi ? '#fffde7' : '',
                                cursor: hasSpk ? 'default' : 'text',
                                color: isEstimasi ? '#b8860b' : '',
                              }}
                              title={isEstimasi ? 'Estimasi (klik untuk edit)' : hasSpk ? 'Nilai dari SPK' : 'Klik untuk input estimasi'}
                              onClick={(e) => {
                                if (hasSpk) return;
                                e.stopPropagation();
                                setEditingEstimasi({ productId: product.id, category: cat });
                                setEstimasiInputValue(value || '');
                              }}
                            >
                              {value ? `Rp. ${value.toLocaleString('id-ID')}` : '-'}
                            </td>
                          );
                        };

                        return (
                          <tr key={index} className={`tr-hover-effect tema-${globalTheme}`} onClick={() => handleEditProduct(product.id, product.Spesifikasi, product.Harga, product.Qty, product.image1)} style={{ cursor: "pointer" }}>
                            <td className='tableStyle text-center'>{index + 1}</td>
                            <td className='tableStyle text-center'>
                              <span onClick={(e) => { e.stopPropagation(); }}>
                                <Image width={100} height={'auto'} style={{ borderRadius: "10px" }} src={getImageUrl(product.image1)} />
                              </span>
                            </td>
                            <td className='tableStyle text-center'>{product.NamaBarang}</td>
                            <td className='tableStyle text-center' style={{ whiteSpace: 'pre-line' }}>{product.Spesifikasi}</td>
                            {categories.map(cat => renderCategoryCell(cat))}
                            <td className='tableStyle text-center'>Rp. {hpp.toLocaleString('id-ID')}</td>
                            <td className='tableStyle text-center'>Rp. {Number(product.Harga).toLocaleString('id-ID')}</td>
                            <td className='tableStyle text-center'>{product.Qty}</td>
                            <td className='tableStyle text-center'>Rp. {(Number(product.Harga) - hpp).toLocaleString('id-ID')}</td>
                            <td className='tableStyle text-center'>{((Number(product.Harga) - hpp) / Number(product.Harga)).toLocaleString('id-ID')}%</td>
                          </tr>
                        );
                      })}

                    </tbody>
                  </table>


                </div>
              </div>


            </div>
            <div style={{ display: searchSupplier !== '' && !slug ? 'none' : '' }}>
              <div className="mt-4" ref={targetElementRefPengeluaran}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  position: "sticky",
                  padding: "7px",
                  margin: "5px 5px 20px 5px",
                  ...(isMobile ? { top: -1 } : { top: 2 }),
                  zIndex: 1,
                  backgroundColor: isElementVisiblePengeluaran ? (globalTheme === "light" ? "#f3f3f3" : "#151515") : "transparent",
                  borderRadius: "30px",
                  border: "1px solid transparent",
                  transition: "background-color 0.3s ease",

                }}>
                <h4 style={{ color: globalTheme == "light" ? "#000000" : "#ffffff", marginTop: "0px", marginBottom: "0px" }}>Jurnal Pengeluaran Order</h4>
                <button className="btnKomentar button-effect2" style={{ marginRight: '0.5vh' }} onClick={() => { setShowPengeluaranModal(true); refreshState(); }}>+ Pengeluaran</button>
              </div>

              <div className='SPK mt-1 shadow' style={{ backgroundImage: globalTheme === "light" ? "linear-gradient(to right, #ffffff, #e7e7e7)" : "linear-gradient(to right, #151515, #303030)", border: globalTheme === "light" ? "2px solid rgb(163, 163, 163)" : "2px solid #7a7a7a" }}>
                <div className={`p-2 ${globalTheme === 'light' ? 'text-dark' : 'text-light'}`}>
                  <table>
                    <thead>
                      <tr>
                        <th className='tableStyle text-center'>No</th>
                        <th className='tableStyle text-center'>Tanggal</th>
                        <th className='tableStyle text-center'>Kategori</th>
                        <th className='tableStyle text-center'>Keterangan</th>
                        <th className='tableStyle text-center'>Nominal</th>
                      </tr>
                    </thead>
                    <tbody>

                      {dataPengeluaranFromDB.map((pengeluaran, index) => (
                        <tr key={index} style={{ cursor: "pointer" }} className={`tr-hover-effect tema-${globalTheme}`} onClick={() => handleEditPengeluaran(pengeluaran.id, pengeluaran.tanggalPengeluaran, pengeluaran.kategoriPengeluaran, pengeluaran.keteranganPengeluaran, pengeluaran.nominalPengeluaran)}>
                          <td className='tableStyle text-center'>{index + 1}</td>
                          <td className='tableStyle text-center'>{new Date(pengeluaran.tanggalPengeluaran).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                          <td className='tableStyle text-center'>{pengeluaran.kategoriPengeluaran}</td>
                          <td className='tableStyle text-center'>{pengeluaran.keteranganPengeluaran}</td>
                          <td className='tableStyle text-center'>Rp. {Number(pengeluaran.nominalPengeluaran).toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>


            <div style={{ display: searchSupplier !== '' && !slug ? 'none' : '' }}>
              <div className="mt-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: "sticky", ...(isMobile ? { top: -1 } : { top: 0 }), zIndex: 1 }}>
                <h4 style={{ color: globalTheme == "light" ? "#000000" : "#ffffff", padding: "10px" }}>Payment History</h4>
                <button className="btnKomentar button-effect2" style={{ marginRight: '2.5vh' }} onClick={() => { setShowPaymentModal(true); refreshState(); }}>+ Payment</button>
              </div>

              <div className='SPK shadow mt-1' style={{ backgroundImage: globalTheme === "light" ? "linear-gradient(to right, #ffffff, #e7e7e7)" : "linear-gradient(to right, #151515, #303030)", border: globalTheme === "light" ? "2px solid rgb(163, 163, 163)" : "2px solid #7a7a7a" }}>
                <div className='p-2'>
                  <table className={`${globalTheme === 'light' ? 'text-dark' : 'text-light'}`}>
                    <thead>
                      <tr>
                        <th className='tableStyle text-center'>No</th>
                        <th className='tableStyle text-center'>Gambar</th>
                        <th className='tableStyle text-center'>Detail</th>
                        <th className='tableStyle text-center'>Status</th>
                        <th className='tableStyle text-center'>Tanggal</th>
                        <th className='tableStyle text-center'>Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>

                      {dataInvoicePaymentFromDB.map((payment, index) => (
                        <tr key={index} className={`tr-hover-effect tema-${globalTheme}`} style={{ cursor: "pointer" }} onClick={() => handleEditPayment(payment.id, payment.detail, payment.tanggal, payment.tanggalWD, payment.status, payment.jumlah, payment.image)}>
                          <td className='tableStyle text-center'>{index + 1}</td>
                          <td className='tableStyle text-center'>
                            <span onClick={(e) => { e.stopPropagation(); }}>
                              <Image width={100} height={'auto'} style={{ borderRadius: "10px" }} src={getImageUrl(payment.image)} />
                            </span>
                          </td>
                          <td className='tableStyle text-center'>{payment.detail}</td>
                          <td className='tableStyle text-center'>{payment.status}</td>
                          <td className='tableStyle text-center'>
                            <span style={{ display: payment.status == "Withdraw" ? "none" : "block" }}>
                              {payment.tanggal}
                            </span>
                            <span style={{ display: payment.status == "Withdraw" ? "block" : "none" }}>
                              {payment.tanggal} (Hold)<br />
                              {payment.tanggalWD} (WD)
                            </span>
                          </td>
                          <td className='tableStyle text-center'>Rp. {Number(payment.jumlah).toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </Col>
        </Row>

        {/* Modal */}
        <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showAddInvoiceModal} onHide={() => setShowAddInvoiceModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Add Invoice</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Your comment form here */}
            <label className='mt-2'>Search Kode Customer :</label>
            <input
              className="form-control"
              type='text'
              defaultValue={searchKodeCustomer}
              onChange={useCallback(debounce((e) => setSearchKodeCustomer(e.target.value), 300), [])}
            />

            <div>
              <label className='mt-2'>Kode Customer :</label>
              <select
                className="form-control"
                value={kodeCustomer}
                onChange={(e) => setKodeCustomer(e.target.value)}
              >
                <option value="" disabled selected>Select Code Customer</option>
                {filteredCustomers.map((customer, index) => (
                  <option key={index} value={customer.kodeCust}>
                    {customer.kodeCust} - {customer.namaCust}
                  </option>
                ))}
              </select>
            </div>
            <label className='mt-2'>Customer :</label>
            <input className="form-control" type='text' onChange={useCallback(debounce((e) => setCustomer(e.target.value), 300), [])}></input>
            <label className='mt-2'>Kode Invoice :</label>
            <input className="form-control" type='text' onChange={useCallback(debounce((e) => setKodeInvoice(e.target.value), 300), [])}></input>
            <label className='mt-2'>Tanggal Mulai :</label>
            <input className="form-control" type='date' onChange={useCallback(debounce((e) => setTanggalMulaiInvoice(e.target.value), 300), [])}></input>
            <label className='mt-2'>Deadline :</label>
            <input className="form-control" type='date' onChange={useCallback(debounce((e) => setDeadlineInvoice(e.target.value), 300), [])}></input>
            <label className='mt-2'>Ongkir & Packing :</label>
            <input className="form-control" type='number' onChange={useCallback(debounce((e) => setOngkirPackingInvoice(e.target.value), 300), [])}></input>
            <label className='mt-2'>Admin :</label>
            <input className="form-control" type='number' onChange={useCallback(debounce((e) => setAdminInvoice(e.target.value), 300), [])}></input>
            <label className='mt-2'>Discount :</label>
            <input className="form-control" type='number' onChange={useCallback(debounce((e) => setDiscountInvoice(e.target.value), 300), [])}></input>
            <label className='mt-2'>Ongkir Cust :</label>
            <input className="form-control" type='number' onChange={useCallback(debounce((e) => setOngkirCustInvoice(e.target.value), 300), [])}></input>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={handleSubmitInvoice}>Submit</Button>
          </Modal.Footer>
        </Modal>
        {/* End Modal */}

        {/* Modal */}
        <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showUpdateInvoiceModal} onHide={() => setShowUpdateInvoiceModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Update Invoice</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Your comment form here */}
            <label className='mt-2'>Search Kode Customer :</label>
            <input
              className="form-control"
              type='text'
              defaultValue={searchKodeCustomer}
              onChange={useCallback(debounce((e) => setSearchKodeCustomer(e.target.value), 300), [])}
            />
            <div>
              <label className='mt-2'>Kode Customer :</label>
              <select
                className="form-control"
                value={kodeCustomer}
                onChange={(e) => setKodeCustomer(e.target.value)}
              >
                <option value="" disabled selected>Select Code Customer</option>
                {filteredCustomers.map((customer, index) => (
                  <option key={index} value={customer.kodeCust}>
                    {customer.kodeCust} - {customer.namaCust}
                  </option>
                ))}
              </select>
            </div>
            <label className='mt-2'>Customer :</label>
            <input className="form-control" type='text' value={customer} disabled></input>
            <label className='mt-2'>Kode Invoice :</label>
            <input className="form-control" type='text' value={kodeInvoice} disabled></input>
            <label className='mt-2'>Tanggal Mulai :</label>
            <input className="form-control" type='date' defaultValue={tanggalMulaiInvoice} onChange={useCallback(debounce((e) => setTanggalMulaiInvoice(e.target.value), 300), [])}></input>
            <label className='mt-2'>Deadline :</label>
            <input className="form-control" type='date' defaultValue={deadlineInvoice} onChange={useCallback(debounce((e) => setDeadlineInvoice(e.target.value), 300), [])}></input>
            <label className='mt-2'>Ongkir & Packing :</label>
            <input className="form-control" type='number' defaultValue={ongkirPackingInvoice} onChange={useCallback(debounce((e) => setOngkirPackingInvoice(e.target.value), 300), [])}></input>
            <label className='mt-2'>Admin :</label>
            <input className="form-control" type='number' defaultValue={adminInvoice} onChange={useCallback(debounce((e) => setAdminInvoice(e.target.value), 300), [])}></input>
            <label className='mt-2'>Discount :</label>
            <input className="form-control" type='number' defaultValue={discountInvoice} onChange={useCallback(debounce((e) => setDiscountInvoice(e.target.value), 300), [])}></input>
            <label className='mt-2'>Ongkir Cust :</label>
            <input className="form-control" type='number' defaultValue={ongkirCustInvoice} onChange={useCallback(debounce((e) => setOngkirCustInvoice(e.target.value), 300), [])}></input>


          </Modal.Body>
          <Modal.Footer>
            <div className="d-flex justify-content-between w-100">
              <Button
                variant="success"
                onClick={() => {
                  setShowAddProductModal(true);
                  setShowUpdateInvoiceModal(false);
                  refreshState();
                }}
              >
                Add Product
              </Button>

              <div className="d-flex gap-2">
                <Button
                  variant="danger"
                  onClick={() => {
                    setShowDeleteInvoiceModal(true);
                    setShowUpdateInvoiceModal(false);
                  }}
                >
                  Delete
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmitUpdateInvoice}
                >
                  Submit
                </Button>
              </div>
            </div>
          </Modal.Footer>

        </Modal>
        {/* End Modal */}

        {/* Modal */}
        <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showAddProductModal} onHide={() => setShowAddProductModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Add Product</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Your comment form here */}
            <label className='mt-2'>Gambar :</label>
            <div className='d-flex'>
              <input className="form-control" type="file"
                onChange={(e) => {
                  const files = e.target.files;
                  setFileToUpload(files[0]);
                }}
              />
              <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('addProduct')}><FaPaste /></Button>
            </div>

            <label className='mt-2'>Product Name :</label>
            <input className="form-control" type='text' onChange={useCallback(debounce((e) => setProductName(e.target.value), 300), [])}></input>
            <label className='mt-2'>Harga :</label>
            <input className="form-control" type='number' onChange={useCallback(debounce((e) => setHarga(e.target.value), 300), [])}></input>
            <label className='mt-2'>Qty :</label>
            <input className="form-control" type='number' onChange={useCallback(debounce((e) => setQty(e.target.value), 300), [])}></input>
            <label className='mt-2'>Keterangan :</label>
            <textarea className="form-control" rows="5" type='text' onChange={useCallback(debounce((e) => setSpesifikasi(e.target.value), 300), [])}></textarea>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={handleSubmitAddProduct} style={{ marginLeft: "150px" }}>Submit</Button>
          </Modal.Footer>
        </Modal>
        {/* End Modal */}

        {/* Modal */}
        <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showEditProductModal} onHide={() => setShowEditProductModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Product</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Your comment form here */}
            <label className='mt-2'>Gambar :</label><br />
            {getImageUrl(imageEdit) && !imageDelete && (
              <div className="mt-2 mb-4">
                <Popconfirm
                  title="Hapus gambar?"
                  description="Gambar ini akan dihapus saat Anda menekan Submit."
                  onConfirm={() => {
                    setImageDelete(true);
                    message.info("Gambar ditandai untuk dihapus.");
                  }}
                  okText="Ya, hapus"
                  cancelText="Batal"
                >
                  <img
                    src={getImageUrl(imageEdit)}
                    style={{
                      width: '150px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      transition: 'transform 0.2s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                </Popconfirm>
              </div>
            )}

            {imageDelete && (
              <div
                className="mt-2"
                style={{
                  fontSize: '14px',
                  color: '#d46b08',
                  background: '#fff7e6',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ffe58f',
                  width: 'fit-content',
                }}
              >
                Gambar akan dihapus saat Anda menekan <b>Submit</b>.
              </div>
            )}

            <div className='d-flex'>
              <input className="form-control" type="file"
                onChange={(e) => {
                  const filesEdit = e.target.files;
                  setFileToUploadEdit(filesEdit[0]);
                }}
              />
              <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editProduct')}><FaPaste /></Button>
            </div>

            <label className='mt-2'>Spesifikasi :</label>
            <textarea className="form-control" rows="5" type='text' defaultValue={spesifikasiEdit} onChange={useCallback(debounce((e) => setSpesifikasiEdit(e.target.value), 300), [])}></textarea>
            <label className='mt-2'>Harga :</label>
            <input className="form-control" type='number' defaultValue={hargaEdit} onChange={useCallback(debounce((e) => setHargaEdit(e.target.value), 300), [])}></input>
            <label className='mt-2'>Qty :</label>
            <input className="form-control" type='number' defaultValue={qtyEdit} onChange={useCallback(debounce((e) => setQtyEdit(e.target.value), 300), [])}></input>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="danger" onClick={() => { setShowDeleteProductModal(true); setShowEditProductModal(false) }}>Delete</Button>
            <Button variant="primary" onClick={handleSubmitEditProduct} style={{ marginLeft: "290px" }}>Submit</Button>
          </Modal.Footer>
        </Modal>
        {/* End Modal */}


        {/* Modal */}
        <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showPengeluaranModal} onHide={() => setShowPengeluaranModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Tambah Pengeluaran</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Your comment form here */}

            <label className='mt-2'>Tanggal :</label>
            <input className="form-control" type='date' onChange={useCallback(debounce((e) => setTanggalPengeluaran(e.target.value), 300), [])}></input>
            <label className='mt-2'>Kategori :</label>
            <input className="form-control" type='text' onChange={useCallback(debounce((e) => setKategoriPengeluaran(e.target.value), 300), [])}></input>
            <label className='mt-2'>Keterangan :</label>
            <input className="form-control" type='text' onChange={useCallback(debounce((e) => setKeteranganPengeluaran(e.target.value), 300), [])}></input>
            <label className='mt-2'>Nominal :</label>
            <input className="form-control" type='number' onChange={useCallback(debounce((e) => setNominalPengeluaran(e.target.value), 300), [])}></input>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={handleSubmitPengeluaran} style={{ marginLeft: "150px" }}>Submit</Button>
          </Modal.Footer>
        </Modal>
        {/* End Modal */}

        <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showDeleteProductModal} onHide={() => setShowDeleteProductModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>Are you sure you want to delete this product?</Modal.Body>
          <Modal.Footer>
            <Button variant="danger" onClick={handleDeleteProduct}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal */}
        <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showEditPengeluaranModal} onHide={() => setShowEditPengeluaranModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Pengeluaran</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <label className='mt-2'>Tanggal :</label>
            <input className="form-control" type='date' defaultValue={tanggalPengeluaran} onChange={useCallback(debounce((e) => setTanggalPengeluaran(e.target.value), 300), [])}></input>
            <label className='mt-2'>Kategori :</label>
            <input className="form-control" type='text' defaultValue={kategoriPengeluaran} onChange={useCallback(debounce((e) => setKategoriPengeluaran(e.target.value), 300), [])}></input>
            <label className='mt-2'>Keterangan :</label>
            <input className="form-control" type='text' defaultValue={keteranganPengeluaran} onChange={useCallback(debounce((e) => setKeteranganPengeluaran(e.target.value), 300), [])}></input>
            <label className='mt-2'>Nominal :</label>
            <input className="form-control" type='number' defaultValue={nominalPengeluaran} onChange={useCallback(debounce((e) => setNominalPengeluaran(e.target.value), 300), [])}></input>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="danger" onClick={() => { setShowDeletePengeluaranModal(true); setShowEditPengeluaranModal(false) }}>Delete</Button>
            <Button variant="primary" onClick={handleSubmitEditPengeluaran} style={{ marginLeft: "290px" }}>Submit</Button>
          </Modal.Footer>
        </Modal>
        {/* End Modal */}

        <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showDeletePengeluaranModal} onHide={() => setShowDeletePengeluaranModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>Are you sure you want to delete this Pengeluaran?</Modal.Body>
          <Modal.Footer>
            <Button variant="danger" onClick={handleDeletePengeluaran}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showDeleteInvoiceModal} onHide={() => setShowDeleteInvoiceModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>Are you sure you want to delete this Invoice?</Modal.Body>
          <Modal.Footer>
            <Button variant="danger" onClick={handleDeleteInvoice}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>


        {/* Modal */}
        <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showSummary} onHide={() => setShowSummary(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Summary</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Your comment form here */}
            {/* <p className='fw-semibold'>Sisa Saldo / Outstanding : Rp. {(Number(nilaiOrderTotal()) + Number(nilaiOngkirTotal()) - Number(nilaiDiscountTotal()) - Number(nilaiPaymentTotal())).toLocaleString('id-ID')}</p>
            <p className='fw-semibold'>Sisa Saldo (Hold) : Rp. {Number(nilaiPaymentHoldTotal()).toLocaleString('id-ID')}</p> */}

            <div className='d-flex justify-content-center align-items-center'>
              <div className='card shadow p-4 m-2 bg-dark border border-light'>
                <Statistic title="Sisa Saldo / Outstanding" value={(Number(nilaiOrderTotal()) + Number(nilaiOngkirTotal()) - Number(nilaiDiscountTotal()) - Number(nilaiPaymentTotal())).toLocaleString('id-ID')} />
              </div>
              <div className='card shadow p-4 m-2 bg-dark border border-light'>
                <Statistic title="Sisa Saldo (Hold)" value={Number(nilaiPaymentHoldTotal()).toLocaleString('id-ID')} />
              </div>
            </div>



            <p className='fw-semibold mt-4'>Invoice Summary Filter :</p>
            <input className="form-control" type="month" value={summaryMonth} onChange={(e) => { setSummaryMonth(e.target.value); setShowSummary(false); setPaymentSummaryMonth('') }}></input>
            <p className='fw-semibold mt-4'>Payment Summary Filter :</p>
            <input className="form-control" type="month" value={paymentSummaryMonth} onChange={(e) => { setPaymentSummaryMonth(e.target.value); setShowSummary(false); setSummaryMonth('') }}></input>

          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={handleStopShowSummary}>Refresh</Button>
          </Modal.Footer>
        </Modal>
        {/* End Modal */}

        {/* Modal */}
        <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showPaymentModal} onHide={() => setShowPaymentModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Payment</Modal.Title>
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
            <label className='mt-2'>Status :</label>
            <select className="form-control" onChange={(e) => setPaymentStatus(e.target.value)} required>
              <option value="" disabled selected>Select Status</option>
              <option value="Direct">Direct</option>
              <option value="Hold">Hold</option>
              <option value="Withdraw">Withdraw</option>
            </select>
            <div style={{ display: paymentStatus == 'Withdraw' ? "block" : "none" }}>
              <label className='mt-2'>Tanggal Withdraw :</label>
              <input className="form-control" type='date' onChange={(e) => setPaymentTanggalWD(e.target.value)} required></input>
            </div>

            <label className='mt-2'>Jumlah :</label>
            <input className="form-control" type='number' onChange={useCallback(debounce((e) => setPaymentJumlah(e.target.value), 300), [])}></input>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={handleSubmitPayment} style={{ marginLeft: "150px" }}>Submit</Button>
          </Modal.Footer>
        </Modal>
        {/* End Modal */}

        {/* Modal */}
        <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showEditPaymentModal} onHide={() => setShowEditPaymentModal(false)}>
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
            <label className='mt-2'>Status :</label>
            <select className="form-control" defaultValue={statusEdit} onChange={(e) => setStatusEdit(e.target.value)} required>
              <option value="" disabled selected>Select Status</option>
              <option value="Direct">Direct</option>
              <option value="Hold">Hold</option>
              <option value="Withdraw">Withdraw</option>
            </select>
            <div style={{ display: statusEdit == "Withdraw" ? "block" : "none" }}>
              <label className='mt-2'>Tanggal WD :</label>
              <input className="form-control" type='date' defaultValue={tanggalWDEdit} onChange={(e) => setTanggalWDEdit(e.target.value)} required></input>
            </div>
            <label className='mt-2'>Jumlah :</label>
            <input className="form-control" type='number' defaultValue={jumlahEdit} onChange={useCallback(debounce((e) => setJumlahEdit(e.target.value), 300), [])}></input>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="danger" onClick={() => { setShowDeletePaymentModal(true); setShowEditPaymentModal(false) }}>Delete</Button>
            <Button variant="primary" onClick={handleSubmitEditPayment} style={{ marginLeft: "290px" }}>Submit</Button>
          </Modal.Footer>
        </Modal>
        {/* End Modal */}

        <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showDeletePaymentModal} onHide={() => setShowDeletePaymentModal(false)}>
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

      {/* invoice summary */}

      <Container style={{ display: summaryMonth ? "block" : "none" }}>
        <Row className="">
          <Col md={12} className='lowonganPekerjaan overflow-auto pekerjaan' ref={scrollableElementRefInvoiceSummary} style={{ display: isMobile && slug || displayFull ? 'none' : '' }}>


            <h4
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                ...(isMobile ? { top: -1 } : { top: 0 }),
                backgroundColor: isScrolledInvoiceSummary ? (globalTheme === "light" ? "rgba(243, 243, 243, 0.7)" : "rgba(21, 21, 21, 0.7)") : "transparent",
                color: globalTheme === "light" ? "black" : 'white',
                zIndex: 1,
                padding: '10px',
                transition: "background-color 1s ease",
              }}
            >
              <span style={{ display: showSearch ? "none" : "block" }}>Invoice Summary - {new Date(summaryMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ fontSize: '12px', borderRadius: '20px', padding: '5px', display: showSearch ? 'block' : 'none' }} />
              <div>
                {/* <span style={{ fontSize: '20px', color: isIconBlue ? 'blue' : 'inherit' }} onClick={handleSearchClick}>
                  <FaSearch />
                </span> */}
                <span style={{ fontSize: "25px", marginLeft: "10px", color: 'blue', cursor: 'pointer', }} onClick={handleShowSummary} ><MdOutlineAssignment className='button-effect2' /></span>
              </div>
            </h4>




            <div className="SPK mb-1 shadow" style={{ backgroundImage: globalTheme === "light" ? "linear-gradient(to right, #ffffff, #e7e7e7)" : "linear-gradient(to right, #151515, #303030)", border: globalTheme === "light" ? "2px solid #d2d2d2" : "2px solid #7a7a7a" }}>
              <table className="table table-bordered table-hover table-striped">
                <thead className={`${globalTheme === 'light' ? 'table-primary' : 'table-dark'}`}>
                  <tr>
                    <th className="text-center">No</th>
                    <th className="text-center">Invoice</th>
                    <th className="text-center">Nilai Order</th>
                    <th className="text-center">DP Masuk</th>
                    <th className="text-center">Kekurangan</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Gross Profit</th>
                    <th className="text-center">%</th>
                  </tr>
                </thead>
                <tbody className="{`${globalTheme === 'light' ? 'table-light' : 'table-secondary'}`}">
                  {filteredData.filter(invoice => invoice.tanggalMulaiInvoice.startsWith(summaryMonth)).map((invoice, index) => {
                    const nilaiOrder =
                      Number(nilaiOrderSummary(invoice.id)) +
                      Number(invoice.ongkirCustInvoice) -
                      Number(invoice.discountInvoice);
                    const dpMasuk = Number(DpMasukSummary(invoice.id));
                    const grossProfit =
                      Number(calculateGrossProfitSummary(invoice.id)) -
                      Number(pengeluaranLainSummary(invoice.id)) +
                      Number(invoice.ongkirCustInvoice) -
                      Number(invoice.ongkirPackingInvoice) -
                      Number(invoice.adminInvoice) -
                      Number(invoice.discountInvoice);
                    const status = (nilaiOrder - dpMasuk) === 0 ? "Lunas" : "Belum Lunas";
                    const grossProfitPercentage = ((grossProfit / nilaiOrder) * 100).toFixed(2);

                    // Accumulate totals
                    totalNilaiOrder += nilaiOrder;
                    totalKekurangan += (nilaiOrder - dpMasuk);
                    totalGrossProfit += grossProfit;

                    // Cek apakah ada data status == "Hold"
                    const isHold = dataAllInvoicePaymentFromDB.some(
                      (item) => item.idInvoice === invoice.id && item.status === "Hold"
                    );

                    const statusDisplay = isHold ? `${status} (Hold)` : status;

                    return (
                      <tr key={index}>
                        <td className="text-center">{index + 1}</td>
                        <td className="text-center text-primary" style={{ cursor: 'pointer' }} onClick={() => { window.open(`/invoice/${invoice.id}`, '_blank'); }}>
                          {invoice.kodeInvoice}
                        </td>
                        <td className="text-center">Rp. {nilaiOrder.toLocaleString('id-ID')}</td>
                        <td className="text-center">Rp. {dpMasuk.toLocaleString('id-ID')}</td>
                        <td className="text-center">Rp. {(nilaiOrder - dpMasuk).toLocaleString('id-ID')}</td>
                        <td className="text-center">{statusDisplay}</td>
                        <td className="text-center">Rp. {grossProfit.toLocaleString('id-ID')}</td>
                        <td className="text-center">{grossProfitPercentage}%</td>
                      </tr>
                    );
                  })}


                  <tr>
                    <td className="text-center"></td>
                    <td className="text-center fw-semibold">Total Nilai Order :</td>
                    <td className="text-center fw-semibold">Rp. {totalNilaiOrder.toLocaleString('id-ID')}</td>
                    <td className="text-center fw-semibold">Total Kekurangan :</td>
                    <td className="text-center fw-semibold">Rp. {totalKekurangan.toLocaleString('id-ID')}</td>
                    <td className="text-center fw-semibold">Total Gross Profit :</td>
                    <td className="text-center fw-semibold">Rp. {totalGrossProfit.toLocaleString('id-ID')}</td>
                    <td className="text-center"></td>
                  </tr>
                </tbody>
              </table>

            </div>


          </Col>
        </Row>




      </Container>


      {/* payment summary */}

      <Container style={{ display: paymentSummaryMonth ? "block" : "none" }}>
        <Row className="">
          <Col md={12} className='lowonganPekerjaan overflow-auto pekerjaan' ref={scrollableElementRefPaymentSummary} style={{ display: isMobile && slug || displayFull ? 'none' : '' }}>


            <h4
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                ...(isMobile ? { top: -1 } : { top: 0 }),
                backgroundColor: isScrolledPaymentSummary ? (globalTheme === "light" ? "rgba(243, 243, 243, 0.7)" : "rgba(21, 21, 21, 0.7)") : "transparent",
                color: globalTheme === "light" ? "black" : 'white',
                zIndex: 1,
                padding: '10px',
                transition: "background-color 1s ease",
              }}
            >
              <span style={{ display: showSearch ? "none" : "block" }}>Payment Summary - {new Date(paymentSummaryMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ fontSize: '12px', borderRadius: '20px', padding: '5px', display: showSearch ? 'block' : 'none' }} />
              <div>
                <select style={{
                  fontSize: '16px', padding: '0px 12px', borderRadius: '10px',
                  border: '1px solid #ccc',
                  outline: 'none',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  backgroundColor: '#fff',
                }} value={filterPaymentSummary} onChange={(e) => setFilterPaymentSummary(e.target.value)} className='button-effect3'>
                  <option value="All">All</option>
                  <option value="DP">DP</option>
                  <option value="Pelunasan">Pelunasan</option>
                </select>
                <span style={{ fontSize: '20px', marginLeft: "10px", color: isIconBlue ? 'blue' : 'inherit' }} onClick={handleSearchClick}>
                  <FaSearch className='button-effect' />
                </span>
                <span style={{ fontSize: "25px", marginLeft: "10px", color: 'blue' }} onClick={handleShowSummary} ><MdAssignment className='button-effect' /></span>
              </div>
            </h4>




            <div className="SPK mb-1 shadow" style={{ backgroundImage: globalTheme === "light" ? "linear-gradient(to right, #ffffff, #e7e7e7)" : "linear-gradient(to right, #151515, #303030)", border: globalTheme === "light" ? "2px solid #d2d2d2" : "2px solid #7a7a7a" }}>
              <table className="table table-bordered table-hover table-striped">
                <thead className={`${globalTheme === 'light' ? 'table-primary' : 'table-dark'}`}>
                  <tr>
                    <th className="text-center">No</th>
                    <th className="text-center">Invoice</th>
                    <th className="text-center">Jumlah</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Tanggal</th>
                    {/* <th className="text-center">Total</th>
                    <th className="text-center">Total DP</th>
                    <th className="text-center">type</th> */}
                  </tr>
                </thead>
                <tbody className={`${globalTheme === 'light' ? 'table-light' : 'table-secondary'}`}>

                  {filteredInvoicePaymentSummary.length === 0 ? (
                    <>
                      {[...Array(5)].map((_, index) => (
                        <tr key={index}>
                          <td className="text-center">{index + 1}</td>
                          <td className="text-center text-primary">
                            <Spin size="small" />
                          </td>
                          <td className="text-center"><Spin size="small" /></td>
                          <td className="text-center"><Spin size="small" /></td>
                          <td className="text-center"><Spin size="small" /></td>
                        </tr>
                      ))}
                      <tr>
                        <td className="text-center">...</td>
                        <td className="text-center text-primary">
                          <Spin size="small" />
                        </td>
                        <td className="text-center"><Spin size="small" /></td>
                        <td className="text-center"><Spin size="small" /></td>
                        <td className="text-center"><Spin size="small" /></td>
                      </tr>
                    </>
                  ) : null}




                  {filteredInvoicePaymentSummary
                    .filter(item => {
                      if (item.status === 'Direct') {
                        return item.tanggal.startsWith(paymentSummaryMonth);
                      } else if (item.status === 'Withdraw') {
                        return item.tanggalWD.startsWith(paymentSummaryMonth);
                      }
                      return false;
                    })
                    .map((item, index) => {
                      const invoice = invoiceMap.get(item.idInvoice) || {};
                      const nilaiOrder = nilaiOrderCache.get(item.idInvoice) || 0;

                      // Pre-filtered and sorted payments for the invoice
                      const payments = (paymentGroupedByInvoice[item.idInvoice] || []).filter(payment =>
                        payment.tanggal <= item.tanggal &&
                        (item.status === 'Withdraw' || item.status === 'Direct') &&
                        (payment.tanggal !== item.tanggal || payment.submitDate <= item.submitDate)
                      );

                      const totalDP = payments.reduce((acc, payment) => acc + Number(payment.jumlah), 0);
                      let status = totalDP >= nilaiOrder ? "Pelunasan" : "DP";

                      const filteredInvoice = filteredDataMap.get(item.idInvoice) || {};
                      const ongkirCustInvoices = Number(filteredInvoice.ongkirCustInvoice) || 0;
                      const ongkirPackings = Number(filteredInvoice.ongkirPackingInvoice) || 0;
                      const adminInvoices = Number(filteredInvoice.adminInvoice) || 0;
                      const discountInvoices = Number(filteredInvoice.discountInvoice) || 0;

                      const grossProfits = Number(calculateGrossProfitSummary(item.idInvoice)) - Number(pengeluaranLainSummary(item.idInvoice)) + ongkirCustInvoices - ongkirPackings - adminInvoices - discountInvoices;

                      if (status === "Pelunasan") {
                        totalGrossProfitPaymentSummary += grossProfits;
                      }

                      return (
                        <tr key={index} style={{ display: filterPaymentSummary === "All" ? "" : (status === filterPaymentSummary ? "" : "none") }}>
                          <td className="text-center">{index + 1}</td>
                          <td className="text-center text-primary" style={{ cursor: 'pointer' }} onClick={() => { window.open(`/invoice/${item.idInvoice}`, '_blank'); }}>
                            {item.KodeInvoice}
                          </td>
                          <td className="text-center">Rp. {Number(item.jumlah).toLocaleString('id-ID')}</td>
                          <td className="text-center">{status}</td>
                          <td className="text-center">{new Date(item.status === 'Withdraw' ? item.tanggalWD : item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                        </tr>
                      );
                    })}
                  <tr>
                    <td className="text-center"></td>
                    <td className="text-center fw-semibold">Total Uang Masuk :</td>
                    <td className="text-center fw-semibold" style={{ display: filterPaymentSummary == "All" ? "" : "none" }}>Rp. {totalUangMasuk.toLocaleString('id-ID')}</td>
                    <td className="text-center fw-semibold" style={{ display: filterPaymentSummary == "All" ? "none" : "" }}>Rp. {filteredInvoicePaymentSummary
                      .filter(item => {
                        if (item.status === 'Direct') {
                          return item.tanggal.startsWith(paymentSummaryMonth);
                        } else if (item.status === 'Withdraw') {
                          return item.tanggalWD.startsWith(paymentSummaryMonth);
                        }
                        return false;
                      })
                      .filter(item => {
                        const invoice = backUpDataInvoice.find(inv => inv.id === item.idInvoice);
                        const nilaiOrder = Number(nilaiOrderSummary(item.idInvoice))
                          + (invoice ? Number(invoice.ongkirCustInvoice) : 0)
                          - (invoice ? Number(invoice.discountInvoice) : 0);

                        const totalDP = invoicePaymentSummary
                          .filter(payment =>
                            payment.idInvoice === item.idInvoice &&
                            payment.tanggal <= item.tanggal &&
                            (item.status === 'Withdraw' || item.status === 'Direct') &&
                            (payment.tanggal !== item.tanggal || payment.submitDate <= item.submitDate)
                          )
                          .reduce((acc, payment) => acc + Number(payment.jumlah), 0);

                        let status = "DP";
                        if (totalDP >= nilaiOrder) {
                          status = "Pelunasan";
                        }
                        return status === filterPaymentSummary;
                      })
                      .reduce((total, item) => total + Number(item.jumlah), 0).toLocaleString('id-ID')}</td>
                    <td className="text-center"></td>
                    <td className="text-center"></td>
                  </tr>
                  <tr>
                    <td className="text-center"></td>
                    <td className="text-center fw-semibold">Total Gross Profit Pelunasan :</td>
                    <td className="text-center fw-semibold" style={{ display: filterPaymentSummary == "DP" ? "none" : "" }}>Rp. {totalGrossProfitPaymentSummary.toLocaleString('id-ID')}</td>
                    <td className="text-center fw-semibold" style={{ display: filterPaymentSummary == "DP" ? "" : "none" }}>Rp. 0</td>
                    <td className="text-center"></td>
                    <td className="text-center"></td>
                  </tr>
                </tbody>
              </table>

            </div>


          </Col>
        </Row>




      </Container>


    </>
  );
};

export default Invoice;
