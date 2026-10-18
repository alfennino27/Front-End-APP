import { Col, Row, Container, Dropdown } from 'react-bootstrap';
import { labelKategori } from '../../Utils/kategori';
import '../Pekerjaan/pekerjaan.css';
import '../Pekerjaan/table.css';
import { MdOutlineAssignment, MdOutlineChair, MdOutlineLocationOn, MdOutlinePendingActions } from 'react-icons/md';
import { MdAddCircleOutline } from "react-icons/md";
import { Link } from 'react-router-dom';
import dataPekerjaan from '../../assets/data/datapekerjaan';
import { FaFileInvoice, FaPaste, FaSearch } from 'react-icons/fa';
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { MdFormatListBulletedAdd, MdAssignment } from 'react-icons/md';
import { BsPrinterFill } from "react-icons/bs";
import { getApiBaseUrl } from '../../Config/APIurl';
import { useNavigate } from 'react-router-dom';
import { Skeleton, Image, Switch, Select, Input, InputNumber, DatePicker, Modal, Button, Popconfirm } from 'antd';
import { debounce } from 'lodash';
import { IoSearch } from 'react-icons/io5';
import { useTheme } from '../../ThemeContext';
import { getImageUrl } from '../../Utils/image';
import { getSPKFromIndexedDB, saveSPKToIndexedDB } from '../../Helpers/spkStorage';
import dayjs from 'dayjs';
import useIsMobile from '../../Utils/useIsMobile';
import { iconBtn as spkIconBtn, fieldStyle as spkField, kartuStyle } from '../../Utils/mobileUi';

const { Option } = Select;
const { TextArea } = Input;

//tes
// Rekening pembayar supplier (mirror REKENING_PEMBAYAR di server utils/jurnalPembayaran.js).
const REKENING_PEMBAYAR = { '1120': 'BCA (a.n. Alfennino)', '1125': 'Rek CV Karya Logam Furindo' };

const Spk = () => {
  const baseUrl = getApiBaseUrl();
  const { globalTheme } = useTheme();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSupplier, setSearchSupplier] = useState(() => localStorage.getItem('spkSearchSupplier') || '');
  const [filteredData, setFilteredData] = useState([]);
  // const [pendingData, setPendingData] = useState([]);
  const [filteredProjectData, setFilteredProjectData] = useState([]);
  const [filteredSPKData, setFilteredSPKData] = useState([]);
  const [showProduct, setShowProduct] = useState(false);
  const [isLinked, setIsLinked] = useState(false);


  const [dataSPKFromDB, setDataSPKFromDB] = useState([]);
  const [showAddSpkModal, setShowAddSpkModal] = useState(false);
  const [inputPengrajin, setInputPengrajin] = useState('');
  const [inputTanggalCetak, setInputTanggalCetak] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [showUpdateSPKModal, setShowUpdateSPKModal] = useState(false);
  const [pengrajin, setPengrajin] = useState('');
  const [tanggalCetak, setTanggalCetak] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');

  const [SPK, setSPK] = useState([]);
  const { slug } = useParams();

  const isMobile = useIsMobile();
  const [searchProduct, setSearchProduct] = useState('');
  const [searchSPK, setSearchSPK] = useState('');

  const [dataAllSPKproductFromDB, setDataAllSPKproductFromDB] = useState([]);
  const [dataProjectFromDB, setDataProjectFromDB] = useState([]);
  const [idProject, setIdProject] = useState('');
  const [imageProject, setImageProject] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('Select Product');
  const [selectedSPK, setSelectedSPK] = useState('Select SPK');
  const [category, setCategory] = useState('');

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [keterangan, setKeterangan] = useState('');
  const [harga, setHarga] = useState('');
  const [qty, setQty] = useState('');
  const [deadline, setDeadline] = useState('');

  const [dataSPKproductFromDB, setDataSPKproductFromDB] = useState([]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentFileToUpload, setPaymentFileToUpload] = useState(null);
  const [paymentDetail, setPaymentDetail] = useState('');
  const [paymentTanggal, setPaymentTanggal] = useState('');
  const [paymentJumlah, setPaymentJumlah] = useState('');
  // Jurnal otomatis pembayaran SPK: Dr Beban SUP-supplier / Cr rekening pembayar (server).
  const [paymentAkunSumber, setPaymentAkunSumber] = useState('');
  const [paymentAkunBeban, setPaymentAkunBeban] = useState('');
  const [opsiAkunBeban, setOpsiAkunBeban] = useState([]); // diisi kalau server tidak bisa menebak akun beban
  const [dataSPKpaymentFromDB, setDataSPKpaymentFromDB] = useState([]);

  const [dataSupplierFromDB, setDataSupplierFromDB] = useState([]);

  const [showPending, setShowPending] = useState(false);

  const [showSearch, setShowSearch] = useState(false);
  const [isIconBlue, setIsIconBlue] = useState(false);

  const handleSearchClick = () => {
    setShowSearch(!showSearch);
    setIsIconBlue(!isIconBlue);
  };

  const [idProductEdit, setIdProductEdit] = useState('');
  const [idSpkEdit, setIdSpkEdit] = useState('');
  const [fileToUploadEdit, setFileToUploadEdit] = useState(null);
  const [keteranganEdit, setKeteranganEdit] = useState('');
  const [hargaEdit, setHargaEdit] = useState('');
  const [budgetEdit, setBudgetEdit] = useState(0);
  const [qtyEdit, setQtyEdit] = useState('');
  const [deadlineEdit, setDeadlineEdit] = useState('');
  const [statusEdit, setStatusEdit] = useState('');
  const [imageEdit, setImageEdit] = useState('');
  const [imageDelete, setImageDelete] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [costingProduk, setCostingProduk] = useState(null); // popup costing view-only (klik thumbnail)
  const [showDeleteProductModal, setShowDeleteProductModal] = useState(false);
  const handleEditProduct = (id, idSPK, keterangan, harga, qty, deadline, status, image, idProduct, idProductBackUp, namaBarang) => {
    refreshState();
    setIdProductEdit(id);
    const kodeSPK = filteredData.find(item => item.id === idSPK);

    setSelectedSPK(kodeSPK.code);

    setIdSpkEdit(idSPK);

    setKeteranganEdit(keterangan);
    setHargaEdit(harga);
    setQtyEdit(qty);
    setDeadlineEdit(deadline);
    setStatusEdit(status);
    // setImageEdit(image);
    setImageDelete(false);
    setIdProject(idProduct === "" ? idProductBackUp : idProduct);
    setImageProject(image);
    setSelectedProduct(namaBarang);
    setIsLinked((idProduct && idProduct !== ''));
    setShowEditProductModal(true);
  };


  const [idPaymentEdit, setIdPaymentEdit] = useState('');
  const [fileToUploadPaymentEdit, setFileToUploadPaymentEdit] = useState(null);
  const [detailEdit, setDetailEdit] = useState('');
  const [tanggalEdit, setTanggalEdit] = useState('');
  const [jumlahEdit, setJumlahEdit] = useState('');
  const [akunSumberEdit, setAkunSumberEdit] = useState('');
  const [jurnalOtomatisEdit, setJurnalOtomatisEdit] = useState(false);
  const [paymentImageEdit, setPaymentImageEdit] = useState('');
  const [paymentImageDelete, setPaymentImageDelete] = useState(false);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [showDeletePaymentModal, setShowDeletePaymentModal] = useState(false);
  const handleEditPayment = (id, detail, tanggal, jumlah, image, akunSumber, jurnalOtomatis) => {
    refreshState();
    setIdPaymentEdit(id);
    setDetailEdit(detail);
    setTanggalEdit(tanggal);
    setJumlahEdit(jumlah);
    setAkunSumberEdit(akunSumber || '');
    setJurnalOtomatisEdit(!!jurnalOtomatis);
    setPaymentImageEdit(image);
    setPaymentImageDelete(false);
    setShowEditPaymentModal(true);
  };

  const handleSubmitSpk = async () => {
    setShowAddSpkModal(false);

    try {
      const res = await fetch(`${baseUrl}/spk/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pengrajin: inputPengrajin,
          tanggalCetak: inputTanggalCetak,
          code: inputCode,
          status: "Draft",
        }),
      });

      if (!res.ok) throw new Error('Gagal menambahkan spk');

      const result = await res.json();
      console.log('spk berhasil ditambahkan dengan ID:', result.insertedId);

      fetchDataSPK(); // refresh data setelah menambahkan
    } catch (e) {
      console.error('Error adding spk:', e);
    }
  };






  const [suppliers, setSuppliers] = useState([]);

  const kategoriSupplier = ['Besi', 'Kayu', 'Jok', 'Rotan', 'Marmer', 'Fiber', 'Veneer', 'Finishing', 'Hardware', 'Barang Jadi'];

  // Get semua Supplier sekali saat load halaman
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await fetch(`${baseUrl}/supplier/get`);
        const data = await res.json();
        setSuppliers(data);
      } catch (err) {
        console.error('Error fetching SPK:', err);
      }
    };

    fetchSuppliers();
  }, []);



  // const handleGetPendingData = async () => {
  //   try {
  //     const res = await fetch(`${baseUrl}/supplier/pending`);
  //     if (!res.ok) throw new Error("Gagal mengambil data supplier");

  //     const data = await res.json();

  //     // Tetapkan tanggal tetap 1 Januari 2000
  //     const tanggalCetak = "2000-01-01";
  //     const seconds = Math.floor(new Date(tanggalCetak).getTime() / 1000);

  //     // Bentuk data pending sesuai format SPK
  //     const pending = data.map((item) => ({
  //       _id: item._id,
  //       pengrajin: item.supplierName,
  //       tanggalCetak,
  //       code: `Pending ${item.supplierName}`,
  //       status: "Draft",
  //       submitDate: {
  //         value: {
  //           _seconds: seconds,
  //           _nanoseconds: 0,
  //         },
  //       },
  //       id: item._id,
  //       isPending: true, // ✅ tambahan: tandai ini data pending
  //     }));

  //     console.log("Pending data dari server:", pending);

  //     // Sinkronkan dengan data SPK lama
  //     setSPK((prevSPK) => {
  //       // ✅ Ambil hanya data SPK non-pending dari sebelumnya
  //       const nonPending = prevSPK.filter((spk) => !spk.isPending);

  //       // ✅ Gabungkan dengan pending terbaru
  //       const combined = [...nonPending, ...pending];

  //       // ✅ Simpan hasil kombinasi ke IndexedDB agar tetap sinkron
  //       saveSPKToIndexedDB(combined);

  //       console.log(
  //         `SPK sinkron: ${nonPending.length} data non-pending + ${pending.length} pending`
  //       );

  //       return combined;
  //     });
  //   } catch (err) {
  //     console.error("Error saat mengambil pending data:", err);
  //   }
  // };


  // useEffect(() => {
  //   handleGetPendingData();
  // }, []);

  // const fetchDataSPK = async () => {
  //   try {
  //     const res = await fetch(`${baseUrl}/spk/get`);
  //     const data = await res.json();
  //     setSPK(data);
  //   } catch (err) {
  //     console.error('Error fetching SPK:', err);
  //   }
  // };

  // useEffect(() => {
  //   fetchDataSPK();
  // }, []);

  // const fetchDataSPK = async () => {
  //   try {
  //     const res = await fetch(`${baseUrl}/spk/get`);
  //     const data = await res.json();
  //     setSPK(data);
  //     localStorage.setItem('cachedSPK', JSON.stringify(data)); // simpan ke localStorage
  //   } catch (err) {
  //     console.error('Error fetching SPK:', err);
  //   }
  // };

  // useEffect(() => {
  //   // Ambil data dari localStorage dulu
  //   const cachedData = localStorage.getItem('cachedSPK');
  //   if (cachedData) {
  //     setSPK(JSON.parse(cachedData)); // tampilkan data lama dulu
  //   }

  //   // Ambil data terbaru dari server
  //   fetchDataSPK();
  // }, []);


const fetchDataSPK = async () => {
  try {
    const res = await fetch(`${baseUrl}/spk/get`);
    const dataSPK = await res.json();

    // Dapatkan data pending terbaru juga
    const pendingRes = await fetch(`${baseUrl}/supplier/pending`);
    const dataPending = await pendingRes.json();

    // Format pending ke bentuk SPK
    const tanggalCetak = "2000-01-01";
    const seconds = Math.floor(new Date(tanggalCetak).getTime() / 1000);
    const formattedPending = dataPending.map((item) => ({
      _id: item._id,
      pengrajin: item.supplierName,
      tanggalCetak,
      code: `Pending ${item.supplierName}`,
      status: "Draft",
      submitDate: {
        value: {
          _seconds: seconds,
          _nanoseconds: 0,
        },
      },
      id: item._id,
    }));

    // Gabungkan SPK asli + pending (tidak duplikat)
    const combined = [...dataSPK];

    formattedPending.forEach((pending) => {
      if (!combined.some((spk) => spk.id === pending.id)) {
        combined.push(pending);
      }
    });

    // 💡 Di sini kita tidak simpan prevSPK, tapi hasil final yang disinkronkan
    setSPK(combined);
    saveSPKToIndexedDB(combined);

  } catch (err) {
    console.error("Error sinkronisasi SPK:", err);
  }
};



useEffect(() => {
  getSPKFromIndexedDB().then((cachedData) => {
    if (cachedData) {
      setSPK(cachedData);
    }
    fetchDataSPK(); // ambil data terbaru
  });
}, []);







  useEffect(() => {
    localStorage.setItem('spkSearchSupplier', searchSupplier);
  }, [searchSupplier]);

  // Filter lokal
  useEffect(() => {
    if (searchSupplier === '') {
      setFilteredData(SPK);
    } else if (kategoriSupplier.includes(searchSupplier)) {
      const supplierNames = suppliers
        .filter(supplier => supplier.category === searchSupplier)
        .map(supplier => supplier.supplierName);

      const filtered = SPK.filter(item => supplierNames.includes(item.pengrajin));
      setFilteredData(filtered);
    } else {
      const filtered = SPK.filter(item => item.pengrajin === searchSupplier);
      setFilteredData(filtered);
    }
  }, [searchSupplier, SPK, suppliers]);


  // ── Filter & cari daftar SPK (status, bulan cetak, pembayaran, urutan) ──
  // Cari juga mencocokkan nama barang di dalam SPK (dari /spk/ringkasan).
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  const [filterBayar, setFilterBayar] = useState('');
  const [urutan, setUrutan] = useState(() => localStorage.getItem('spkUrutan') || 'baru');
  const [ringkasan, setRingkasan] = useState({});
  useEffect(() => { localStorage.setItem('spkUrutan', urutan); }, [urutan]);
  useEffect(() => {
    let batal = false;
    fetch(`${baseUrl}/spk/ringkasan`).then((r) => r.json()).then((d) => { if (!batal && d && typeof d === 'object') setRingkasan(d); }).catch(() => {});
    return () => { batal = true; };
  }, [baseUrl, slug, SPK]);

  const bulanOpsi = useMemo(() => {
    const set = new Set(SPK.map((x) => String(x.tanggalCetak || '').slice(0, 7)).filter((b) => /^\d{4}-\d{2}$/.test(b) && b > '2001'));
    return [...set].sort().reverse();
  }, [SPK]);

  const daftarSPK = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const hasil = filteredData.filter((spk) => {
      const pending = String(spk.code || '').startsWith('Pending');
      if (showPending ? !pending : pending) return false;
      if (showPending) return !q || String(spk.pengrajin || '').toLowerCase().includes(q);
      if (filterStatus) {
        const st = spk.status || 'Draft';
        if (filterStatus === 'Acc' ? !st.startsWith('Acc') : st !== filterStatus) return false;
      }
      if (filterBulan && String(spk.tanggalCetak || '').slice(0, 7) !== filterBulan) return false;
      const rk = ringkasan[spk.id];
      if (filterBayar && rk) {
        const lunas = rk.total > 0 && rk.dibayar >= rk.total;
        if (filterBayar === 'lunas' ? !lunas : lunas) return false;
      }
      if (!q) return true;
      return [spk.code, spk.pengrajin, spk.status, rk?.barang].filter(Boolean).join(' ').toLowerCase().includes(q);
    });
    const tgl = (x) => String(x.tanggalCetak || '');
    return hasil.sort((a, b) => (urutan === 'lama' ? tgl(a).localeCompare(tgl(b)) : tgl(b).localeCompare(tgl(a))));
  }, [filteredData, showPending, filterStatus, filterBulan, filterBayar, searchTerm, ringkasan, urutan]);
  const adaFilter = !!(searchTerm || filterStatus || filterBulan || filterBayar || searchSupplier);
  const resetFilter = () => { setSearchTerm(''); setFilterStatus(''); setFilterBulan(''); setFilterBayar(''); setSearchSupplier(''); };

  useEffect(() => {
    if (!SPK || SPK.length === 0) return;

    const selectedSPK = SPK.find(item => item.id === slug);
    if (!selectedSPK) return;

    setDataSPKFromDB([selectedSPK]);
    setPengrajin(selectedSPK.pengrajin);
    setTanggalCetak(selectedSPK.tanggalCetak);
    setCode(selectedSPK.code);
    setStatus(selectedSPK.status);
  }, [slug, showUpdateSPKModal, SPK]);


  useEffect(() => {
    const getCategory = async () => {
      if (pengrajin) {
        const res = await fetch(`${baseUrl}/supplier/category?supplierName=${encodeURIComponent(pengrajin)}`);
        if (res.ok) {
          const data = await res.json();
          setCategory(data.category);
        }
      }
    };
    getCategory();
  }, [pengrajin]);


  const fetchDataProduct = async () => {
    try {
      const res = await fetch(`${baseUrl}/spkproduct/get?idSPK=${slug}`);
      const data = await res.json();
      setDataSPKproductFromDB(data);
    } catch (err) {
      console.error('Error fetching SPK:', err);
    }
  };

  const fetchDataPayment = async () => {
    try {
      const res = await fetch(`${baseUrl}/spkpayment/get?idSPK=${slug}`);
      const data = await res.json();
      setDataSPKpaymentFromDB(data);
    } catch (err) {
      console.error('Error fetching SPK:', err);
    }
  };

  const [dataPaymentRekap, setDataPaymentRekap] = useState([]);

  const fetchDataPaymentRekap = async () => {
    if (!filteredData || filteredData.length === 0) {
      console.log('filteredData is empty or undefined');
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/spkpayment/rekap/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filteredData }),
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil data pembayaran');
      }

      const data = await response.json();
      console.log('paymentData', data);
      setDataPaymentRekap(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };




  const [dataProductRekap, setDataProductRekap] = useState([]);

  const fetchDataProductRekap = async () => {
    if (!filteredData || filteredData.length === 0) {
      console.log('filteredData is empty or undefined');
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/spkproduct/rekap/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filteredData }),
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil data produk');
      }

      const data = await response.json();
      console.log('productData', data);
      setDataProductRekap(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };


  // DEBOUNCE: filteredData berubah tiap ketikan search → dulu memicu 2 POST rekap
  // berat per-keystroke (kirim seluruh list). Sekarang ditunda 400ms sampai user
  // berhenti mengetik/memfilter → jauh lebih ringan di tablet & hemat beban server.
  useEffect(() => {
    if (!(filteredData && filteredData.length > 0)) return;
    const t = setTimeout(() => {
      fetchDataPaymentRekap();
      fetchDataProductRekap();
    }, 400);
    return () => clearTimeout(t);
  }, [filteredData]);


  useEffect(() => {
    fetchDataProduct();
    fetchDataPayment();
  }, [slug]);


  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;

  useEffect(() => {
    const cekLogin = () => {
      if (user == null) {
        window.location.replace('/login');
      }
      if (user.uid === 'fYpdHwXRDLhj5XGxM5FZIAvxp9E2' || user.uid === 'w4M5JJjgGQeHFbS2nkyoCfUBE532' || user.uid === '4WGPaHicKWYr0Ny84IUh8xb9Bo62' || user.uid === 'ANGTwgX8KxXQy5Ww3cwpLrG0tFT2' || user.uid === 'gwsOqUgVXSPyWFMMHr4bJteBoYs1' || user.uid === '6D4XVa5BSSOl1ugUlkDlTea2COX2' || user.uid === 'MjOCxfNdGtf0q12BPzj0EYAcVJD3' || user.uid === 'knydS6fIBdOwHS37dDm3ZDNQXKQ2' || user.uid === 'Q3LWLX4D7Ye8hMnQVF9fa7SZb953' || user.uid === 'V3ICmELKIAPhThELJHIvTXqrhjP2' || user.uid === 'ep15dsFMceTBAyZvpZDiAJ4kMME3') {
        console.log('success');
      } else {
        window.location.replace('/project');
      }
    };

    cekLogin();
  }, []);


  const handleSubmitUpdateSpk = async () => {
    setShowUpdateSPKModal(false);
    try {
      const updateData = {
        id: slug, // slug dianggap sebagai id dokumen SPK
        pengrajin,
        tanggalCetak,
        code,
        status
      };

      const response = await fetch(`${baseUrl}/spk/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Documents updated successfully:', result.message);
        fetchDataSPK();
      } else {
        console.error('Gagal update:', result.message);
      }
    } catch (error) {
      console.error('Error saat update SPK:', error);
    }
  };



  const handleSubmitAddProduct = async () => {
    setShowAddProductModal(false);

    const formData = new FormData();
    formData.append('idSPK', slug);
    formData.append('idProduct', idProject);
    formData.append('namaBarang', selectedProduct);
    formData.append('keterangan', keterangan);
    formData.append('harga', harga);
    formData.append('qty', qty);
    formData.append('deadline', deadline);
    formData.append('category', category);
    formData.append('isLinked', isLinked);
    formData.append('imageProject', imageProject); // fallback url
    formData.append('uid', user?.uid || ''); // riwayat deskripsi project
    if (fileToUpload) {
      formData.append('image', fileToUpload);
    }

    try {
      const res = await fetch(`${baseUrl}/spkproduct/create`, {
        method: 'POST',
        body: formData
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      refreshState();
      fetchDataProduct();
      getDataAllSPKproduct();
    } catch (error) {
      console.error('Gagal tambah product:', error.message);
    }
  };


  const handleSubmitEditProduct = async () => {
    setShowEditProductModal(false);

    const formData = new FormData();
    formData.append('idProductEdit', idProductEdit);
    formData.append('idSpkEdit', idSpkEdit);
    formData.append('keteranganEdit', keteranganEdit);
    formData.append('hargaEdit', hargaEdit);
    formData.append('qtyEdit', qtyEdit);
    formData.append('deadlineEdit', deadlineEdit);
    formData.append('statusEdit', statusEdit || 'ongoing');
    formData.append('category', category);
    formData.append('isLinked', isLinked);
    formData.append('imageProject', imageProject);
    formData.append('uid', user?.uid || ''); // riwayat deskripsi project
    if (idProject !== undefined) {
      formData.append('idProject', idProject);
      formData.append('namaBarang', selectedProduct);
    }
    if (fileToUploadEdit) {
      formData.append('image', fileToUploadEdit);
    }

    try {
      const res = await fetch(`${baseUrl}/spkproduct/update`, {
        method: 'PUT',
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      refreshState();
      fetchDataProduct();
      getDataAllSPKproduct();
      // handleGetPendingData();
      fetchDataSPK();
    } catch (err) {
      console.error('Gagal update product:', err.message);
    }
  };


  const handleDeleteProduct = async () => {
    setShowDeleteProductModal(false);

    try {
      const res = await fetch(`${baseUrl}/spkproduct/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: idProductEdit }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      fetchDataProduct();
    } catch (err) {
      console.error('Gagal menghapus produk:', err.message);
    }
  };


  // Enter = Submit di modal Edit Product. Harga/qty/keterangan di-debounce 300ms,
  // jadi submit ditunda sebentar & lewat ref supaya memakai nilai terbaru.
  const submitEditProductRef = useRef(handleSubmitEditProduct);
  submitEditProductRef.current = handleSubmitEditProduct;
  useEffect(() => {
    if (!showEditProductModal) return;
    const onKey = (e) => {
      if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
      const t = e.target;
      // textarea = baris baru; select/datepicker/popconfirm = Enter milik komponen itu
      if (t && (t.tagName === 'TEXTAREA' || t.closest?.('.ant-select, .ant-picker, .ant-popover, button'))) return;
      e.preventDefault();
      setTimeout(() => submitEditProductRef.current(), 350);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showEditProductModal]);

  const handleSubmitEditPayment = async () => {
    setShowEditPaymentModal(false);

    try {
      const formData = new FormData();
      formData.append('detail', detailEdit);
      formData.append('tanggal', tanggalEdit);
      formData.append('jumlah', jumlahEdit);
      if (jurnalOtomatisEdit && akunSumberEdit) formData.append('akunSumber', akunSumberEdit);
      formData.append('paymentImageDelete', paymentImageDelete ? 'true' : 'false');

      if (fileToUploadPaymentEdit) {
        formData.append('image', fileToUploadPaymentEdit);
      }

      const res = await fetch(`${baseUrl}/spkpayment/update/${idPaymentEdit}`, {
        method: 'PUT',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        console.log('Update berhasil:', data);
      } else {
        console.error('Update gagal:', data.message);
        alert(`Gagal update payment: ${data.message}`);
      }
    } catch (e) {
      console.error('Error submitting update:', e);
    }

    fetchDataPayment();
  };


  const handleDeletePayment = async () => {
    setShowDeletePaymentModal(false);

    try {
      const res = await fetch(`${baseUrl}/spkpayment/delete/${idPaymentEdit}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        console.log('Berhasil dihapus:', data.message);
      } else {
        console.error('Gagal hapus:', data.message);
      }
    } catch (error) {
      console.error('Error saat menghapus:', error);
    }

    fetchDataPayment();
  };


  const handleSubmitPayment = async () => {
    if (!paymentAkunSumber) {
      alert('Pilih rekening pembayar (BCA / Rek CV) — dipakai untuk jurnal otomatis');
      return;
    }
    setShowPaymentModal(false);

    try {
      const formData = new FormData();

      // Tambahkan semua data
      formData.append('idSPK', slug);
      formData.append('detail', paymentDetail);
      formData.append('tanggal', paymentTanggal);
      formData.append('jumlah', paymentJumlah);
      formData.append('akunSumber', paymentAkunSumber);
      if (paymentAkunBeban) formData.append('akunBeban', paymentAkunBeban);

      // Tambahkan file jika ada
      if (paymentFileToUpload) {
        formData.append('image', paymentFileToUpload);
      }

      // Kirim ke backend
      const response = await fetch(`${baseUrl}/spkpayment/create`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        // Akun beban supplier tidak bisa ditebak otomatis → minta user memilih lalu submit ulang.
        if (Array.isArray(data.candidates) && data.candidates.length) {
          setOpsiAkunBeban(data.candidates);
          setShowPaymentModal(true);
        }
        alert(`Gagal menyimpan payment: ${data.message}`);
        return;
      }
      // Pembayaran sudah tercatat dari mutasi bank (Jurnal Assistant) → server hanya menempel bukti.
      if (data.buktiDitempel) alert(data.message);
      // Transfer sudah dijurnal dari sisi bank (mis. bon 1132) → jurnal itu ditautkan & dikoreksi, bukan jurnal baru.
      if (data.jurnalDitautkan) alert(data.message);
      console.log('Berhasil:', data);

      // Reset state
      setPaymentFileToUpload(null);
      setPaymentDetail('');
      setPaymentTanggal('');
      setPaymentJumlah('');
      setPaymentAkunSumber('');
      setPaymentAkunBeban('');
      setOpsiAkunBeban([]);

      fetchDataPayment(); // refresh data
    } catch (err) {
      console.error('Error:', err);
    }
  };


  const refreshState = () => {
    setFileToUpload(null);
    setKeterangan('');
    setHarga('');
    setQty('');
    setDeadline('');

    setFileToUploadEdit(null);
    setIdProductEdit('');
    setKeteranganEdit('');
    setHargaEdit('');
    setQtyEdit('');
    setDeadlineEdit('');
    setStatusEdit('');
    setImageEdit('');

    setPaymentFileToUpload(null);
    setPaymentDetail('');
    setPaymentTanggal('');
    setPaymentJumlah('');

    setFileToUploadPaymentEdit(null);
    setIdPaymentEdit('');
    setDetailEdit('');
    setTanggalEdit('');
    setJumlahEdit('');
    setPaymentImageEdit('');

    setIdProject('');
    setImageProject('');
    setSelectedProduct('Select Product');

    setIdSpkEdit('');

    setSearchProduct('');
    setSearchSPK('');
  }


  const totalData = dataSPKproductFromDB.reduce((acc, product) => acc + (product.harga * product.qty), 0);
  const totalDataPayment = dataSPKpaymentFromDB.reduce((total, payment) => total + Number(payment.jumlah), 0);
  const totalSelesai = dataSPKproductFromDB
    .filter(product => product.status === "Completed")
    .reduce((acc, product) => acc + (product.harga * product.qty), 0);




  const handleChangeCategory = async (category) => {
    console.log(category);
    try {
      const res = await fetch(`${baseUrl}/supplier/by-category?category=${encodeURIComponent(category)}`);
      if (!res.ok) {
        throw new Error('Gagal mengambil data supplier');
      }

      const data = await res.json();
      setDataSupplierFromDB(data);
      console.log(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };


  const [showDeleteSpkModal, setShowDeleteSpkModal] = useState(false);
  const handleDeleteSPK = async () => {
    // setShowDeleteSpkModal(false);

    try {
      const response = await fetch(`${baseUrl}/spk/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: slug }) // slug adalah ID SPK
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Gagal menghapus SPK:', result.message);
        return;
      }
      fetchDataSPK();
      console.log(result.message); // Sukses
      navigate('/spk'); // Kembali ke halaman SPK
    } catch (error) {
      console.error('Error saat menghapus SPK:', error);
    }
  };


  const [showSupplier, setShowSupplier] = useState(false);
  const handleShowSupplier = async () => {
    try {
      const res = await fetch(`${baseUrl}/supplier/list`);
      if (!res.ok) throw new Error('Gagal mengambil data supplier');

      const data = await res.json();
      setDataSupplierFromDB(data);
      setShowSupplier(true);
    } catch (err) {
      console.error('Error:', err);
    }
  };



  const handleSearchSupplier = (supplierName, category) => {
    setShowSupplier(false);
    setSearchSupplier(supplierName);
    navigate('/spk');
  };

  const handleStopSearchSupplier = () => {
    setShowSupplier(false);
    setSearchSupplier('');
  };


  const totalNominal = dataProductRekap.reduce((acc, product) =>
    acc + (Number(product.harga) * Number(product.qty)), 0
  );

  const totalDP = dataPaymentRekap.reduce((acc, payment) =>
    acc + Number(payment.jumlah), 0
  );


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




  // LAZY: /projects/get (semua project) hanya dipakai dropdown "tambah produk"
  // di dalam SPK (butuh saat slug dibuka atau mode product). Dulu di-fetch saat
  // mount → berat di tablet. Sekarang di-fetch sekali saat pertama dibutuhkan.
  const projectsLoadedRef = useRef(false);
  useEffect(() => {
    if (!(slug || showProduct) || projectsLoadedRef.current) return;
    projectsLoadedRef.current = true;
    (async () => {
      try {
        const res = await fetch(`${baseUrl}/projects/get`);
        if (!res.ok) throw new Error('Gagal mengambil data');
        const data = await res.json();
        setDataProjectFromDB(data);
      } catch (err) {
        projectsLoadedRef.current = false; // biar bisa dicoba lagi
        console.error('Error:', err);
      }
    })();
  }, [slug, showProduct]);


  useEffect(() => {
    setFilteredProjectData(
      dataProjectFromDB.filter((item) =>
        (item.NamaBarang && item.NamaBarang.toLowerCase().includes(searchProduct.toLowerCase())) ||
        (item.Buyer && item.Buyer.toLowerCase().includes(searchProduct.toLowerCase()))
      )
    );
  }, [searchProduct, dataProjectFromDB]);

  useEffect(() => {
    // Dropdown "pindah SPK" di Edit Product hanya menampilkan SPK milik supplier
    // yang sama dengan SPK yang sedang dibuka (dataSPKFromDB[0].pengrajin).
    // Dulu semua SPK muncul, jadi harus ketik dulu untuk mempersempit. Produk
    // memang cuma dipindah antar SPK supplier yang sama, jadi difilter di sini.
    const currentSupplier = (dataSPKFromDB[0]?.pengrajin || '').trim().toLowerCase();
    setFilteredSPKData(
      SPK.filter((item) => {
        const cocokSupplier = !currentSupplier
          ? true
          : (item.pengrajin || '').trim().toLowerCase() === currentSupplier;
        const cocokCari = item.code && item.code.toLowerCase().includes(searchSPK.toLowerCase());
        return cocokSupplier && cocokCari;
      })
    );
  }, [searchSPK, SPK, dataSPKFromDB]);

  // OPTIMASI: dulu fetch /spkproduct/all/get (SEMUA item SPK) saat mount & tiap
  // create/update produk — hasilnya (dataAllSPKproductFromDB) TIDAK dipakai di
  // mana pun. Fetch besar sia-sia yang bikin halaman berat di tablet. Dijadikan
  // no-op supaya pemanggil (create/update produk) tetap aman tanpa beban fetch.
  const getDataAllSPKproduct = () => {};


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
    const handleScroll = () => {
      if (scrollableElementRef2.current) {
        const scrollTop = scrollableElementRef2.current.scrollTop;
        setIsScrolled2(scrollTop > 50); // Cek jika elemen yang di-scroll melebihi 50px
      }
    };

    const element = scrollableElementRef2.current;

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


  const [isElementVisibleRekapPayment, setIsElementVisibleRekapPayment] = useState(false);
  const targetElementRefRekapPayment = useRef(null); // Referensi ke elemen yang diinginkan

  useEffect(() => {
    const handleScroll = () => {
      if (targetElementRefRekapPayment.current) {
        const rect = targetElementRefRekapPayment.current.getBoundingClientRect();
        const vh = window.innerHeight;

        // Cek apakah elemen telah terlihat + 20vh
        const isVisible = rect.top >= 0 && rect.top <= (vh * 0.2);
        setIsElementVisibleRekapPayment(isVisible);
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

  const [isElementVisiblePayment, setIsElementVisiblePayment] = useState(false);
  const targetElementRefPayment = useRef(null); // Referensi ke elemen yang diinginkan

  useEffect(() => {
    const handleScroll = () => {
      if (targetElementRefPayment.current) {
        const rect = targetElementRefPayment.current.getBoundingClientRect();
        const vh = window.innerHeight;

        // Cek apakah elemen telah terlihat + 20vh
        const isVisible = rect.top >= 0 && rect.top <= (vh * 0.2);
        setIsElementVisiblePayment(isVisible);
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





  // Klik produk di detail SPK → modal edit (hanya Draft/Revisi atau user tertentu)
  const bukaEditProdukSPK = (product) => {
    const status = dataSPKFromDB[0]?.status;
    if (status === 'Draft' || status === 'Revisi' || user.uid === "w4M5JJjgGQeHFbS2nkyoCfUBE532" || user.uid === "4WGPaHicKWYr0Ny84IUh8xb9Bo62" || user.uid === "fYpdHwXRDLhj5XGxM5FZIAvxp9E2") {
      setBudgetEdit(Number(product.budget) || 0);
      handleEditProduct(product.id, product.idSPK, product.keterangan, product.harga, product.qty, product.deadline, product.status, product.image, product.idProduct, product.idProductBackUp, product.namaBarang);
    }
  };
  const kartuMobile = kartuStyle(globalTheme);
  const rpSPK = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

  return (
    <>
      <Container id="tidak-tercetak">
        <Row className="">
          <Col md={4} ref={scrollableElementRef} className='lowonganPekerjaan overflow-auto pekerjaan' style={{ display: isMobile && slug ? 'none' : '' }}>


            {/* Kepala daftar + cari & filter (selalu tampil — dulu tersembunyi di ikon) */}
            <div style={{
              position: 'sticky', top: 0, zIndex: 2, padding: '8px 4px 10px',
              background: globalTheme === 'light' ? '#f3f3f3' : '#151515',
              borderBottom: `1px solid ${globalTheme === 'light' ? '#ddd' : '#333'}`, marginBottom: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: globalTheme === 'light' ? '#000' : '#fff' }}>
                <h4 style={{ margin: 0, flex: 1, fontWeight: 700, fontSize: isMobile ? 20 : 22 }}>{showPending ? 'Pending' : 'List SPK'}</h4>
                <button type="button" title="Tampilkan pending" onClick={() => setShowPending((prev) => !prev)} style={spkIconBtn(showPending, globalTheme)}>
                  <MdOutlinePendingActions />
                </button>
                <button type="button" title="Filter supplier" onClick={handleShowSupplier} style={spkIconBtn(searchSupplier !== '', globalTheme)}>
                  <MdOutlineAssignment />
                </button>
                <button type="button" title="Tambah SPK" onClick={() => { setShowAddSpkModal(true); setInputPengrajin(''); setInputTanggalCetak(''); setInputCode(''); }}
                  style={{ ...spkIconBtn(false, globalTheme), background: '#234dba', color: '#fff', borderColor: '#234dba' }}>
                  <MdFormatListBulletedAdd />
                </button>
              </div>

              <div style={{ position: 'relative', marginTop: 8 }}>
                <IoSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: 18 }} />
                <input type="search" placeholder="Cari kode, supplier, nama barang…" value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ ...spkField(globalTheme), width: '100%', paddingLeft: 38 }} />
              </div>

              {!showPending && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6, marginTop: 6 }}>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={spkField(globalTheme, !!filterStatus)}>
                    <option value="">Semua status</option>
                    <option value="Draft">Draft</option>
                    <option value="Revisi">Revisi</option>
                    <option value="Acc">Acc (semua)</option>
                    <option value="Acc Harga">Acc Harga</option>
                    <option value="Acc Keterangan">Acc Keterangan</option>
                  </select>
                  <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} style={spkField(globalTheme, !!filterBulan)}>
                    <option value="">Semua bulan</option>
                    {bulanOpsi.map((b) => <option key={b} value={b}>{dayjs(b + '-01').format('MMM YYYY')}</option>)}
                  </select>
                  <select value={filterBayar} onChange={(e) => setFilterBayar(e.target.value)} style={spkField(globalTheme, !!filterBayar)}>
                    <option value="">Semua pembayaran</option>
                    <option value="belum">Belum lunas</option>
                    <option value="lunas">Lunas</option>
                  </select>
                  <select value={urutan} onChange={(e) => setUrutan(e.target.value)} style={spkField(globalTheme)}>
                    <option value="baru">Terbaru dulu</option>
                    <option value="lama">Terlama dulu</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 6, fontSize: 13, color: '#888' }}>
                {searchSupplier !== '' && (
                  <span style={{ background: '#234dba', color: '#fff', borderRadius: 16, padding: '4px 6px 4px 12px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    Supplier: <b>{searchSupplier}</b>
                    <button type="button" onClick={() => setSearchSupplier('')} aria-label="Hapus filter supplier"
                      style={{ border: 'none', background: 'rgba(255,255,255,.25)', color: '#fff', borderRadius: 12, width: 24, height: 24, padding: 0, lineHeight: '24px' }}>×</button>
                  </span>
                )}
                <span style={{ flex: 1 }}>{SPK.length ? `${daftarSPK.length} SPK` : 'Memuat…'}</span>
                {adaFilter && (
                  <button type="button" onClick={resetFilter}
                    style={{ border: '1px solid #c62828', color: '#c62828', background: 'transparent', borderRadius: 16, padding: '4px 12px', fontSize: 13, minHeight: 32 }}>Reset filter</button>
                )}
              </div>
            </div>

            {SPK.length === 0 ? (
              // Show skeletons while loading
              [...Array(8)].map((_, index) => (
                <div key={index} className="listSPK d-flex position-relative mb-1 shadow" style={{ height: 'auto', backgroundImage: globalTheme === "light" ? "linear-gradient(to right, #ffffff, #e7e7e7)" : "linear-gradient(to right, #151515, #252525)", border: globalTheme === "light" ? "2px solid #d2d2d2" : "2px solid #7a7a7a" }}>
                  <div style={{ width: '100%' }}><Skeleton active /></div>
                </div>
              ))
            ) : null}

            {SPK.length > 0 && daftarSPK.length === 0 && (
              <div style={{ textAlign: 'center', color: '#888', padding: '30px 10px' }}>Tidak ada SPK yang cocok dengan filter.</div>
            )}

            {daftarSPK.map((spk) => {
              const rk = ringkasan[spk.id];
              const sisa = rk ? rk.total - rk.dibayar : null;
              const lunas = rk && rk.total > 0 && sisa <= 0;
              const st = spk.status || 'Draft';
              const warnaSt = st.startsWith('Acc') ? '#15803d' : st === 'Revisi' ? '#2563eb' : '#dc2626';
              const dipilih = spk.id === slug;
              const light = globalTheme === 'light';
              return (
                <Link key={spk.id} to={`/spk/${spk.id}`}>
                  <div className={`listSPK mb-2 shadow-sm tema-${globalTheme} ${dipilih ? 'selected' : ''} ${light ? 'text-dark' : 'text-light'}`}
                    style={{
                      height: 'auto', padding: '10px 12px',
                      backgroundImage: dipilih ? (light ? 'linear-gradient(to right, #cbcbcb, #e7e7e7)' : 'linear-gradient(to right, #404040, #252525)') : (light ? 'linear-gradient(to right, #ffffff, #f1f1f1)' : 'linear-gradient(to right, #151515, #252525)'),
                      border: dipilih ? (light ? '2px solid #234dba' : '2px solid #4da3ff') : (light ? '1px solid #c8c8c8' : '1px solid #555'),
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, minWidth: 0, overflowWrap: 'anywhere' }}>
                        {showPending ? `Pending ${spk.pengrajin}` : spk.pengrajin}
                      </div>
                      {!showPending && (
                        <span style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 700, color: warnaSt, border: `1px solid ${warnaSt}`, borderRadius: 12, padding: '1px 8px' }}>{st}</span>
                      )}
                    </div>
                    {!showPending && (
                      <>
                        <div style={{ fontSize: 12.5, opacity: 0.75, overflowWrap: 'anywhere' }}>{spk.code}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', fontSize: 12.5, marginTop: 4 }}>
                          <span style={{ opacity: 0.8 }}>{spk.tanggalCetak ? dayjs(spk.tanggalCetak).format('D MMM YYYY') : '-'}{rk ? ` · ${rk.jumlahItem} item` : ''}</span>
                          {rk && rk.total > 0 && (
                            <span style={{ fontWeight: 600 }}>
                              Rp {rk.total.toLocaleString('id-ID')}
                              {lunas
                                ? <span style={{ color: '#15803d' }}> · LUNAS</span>
                                : <span style={{ color: '#c2410c' }}> · sisa {sisa.toLocaleString('id-ID')}</span>}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </Link>
              );
            })}

          </Col>
          <Col md={8} ref={scrollableElementRef2} className='lowonganPekerjaan overflow-auto pekerjaan' style={{ display: isMobile && !slug ? 'none' : '' }}>


            <h4
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                ...(isMobile ? { top: -1 } : { top: 0 }),
                color: globalTheme == "light" ? "#000000" : "#ffffff",
                zIndex: 1,
                padding: '10px',
                backgroundColor: isScrolled2 ? (globalTheme === "light" ? "#f3f3f3" : "#151515") : "transparent",
                borderRadius: "30px",
                border: isScrolled2 ? (globalTheme === "light" ? "1px solid #5f5f5f" : "1px solid white") : "1px solid transparent",
                transition: "background-color 1s ease, border 1s ease",
              }}
            >
              {isMobile && slug ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button type="button" onClick={() => navigate('/spk')} aria-label="Kembali ke daftar SPK"
                    style={{ ...spkIconBtn(false, globalTheme), fontSize: 18, width: 'auto', padding: '0 12px', gap: 4 }}>← Daftar</button>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>Detail SPK</span>
                </span>
              ) : (
                <span>SPK Pengrajin Karya Logam Furniture</span>
              )}
              <Button style={{ marginBottom: "-5px", marginTop: "-5px", display: slug && (dataSPKFromDB[0]?.status == 'Acc' || dataSPKFromDB[0]?.status == 'Acc Harga' || dataSPKFromDB[0]?.status == 'Acc Keterangan') ? 'block' : 'none' }} variant="secondary" onClick={() => window.print()}><BsPrinterFill /> Print</Button>
              <Button style={{ marginBottom: "-5px", marginTop: "-5px", display: searchSupplier !== '' && !slug && !showProduct ? 'block' : 'none' }} variant="primary" onClick={() => setShowProduct(true)}><MdOutlineChair /> Product</Button>
              <Button style={{ marginBottom: "-5px", marginTop: "-5px", display: searchSupplier !== '' && !slug && showProduct ? 'block' : 'none' }} variant="primary" onClick={() => setShowProduct(false)}><FaFileInvoice /> SPK</Button>
            </h4>

            {/* rekap spk */}
            <div className="SPK mb-1 shadow" style={{ display: searchSupplier !== '' && !slug && !showProduct ? 'block' : 'none', backgroundImage: globalTheme === "light" ? "linear-gradient(to right, #ffffff, #e7e7e7)" : "linear-gradient(to right, #151515, #303030)", border: globalTheme === "light" ? "2px solid rgb(163, 163, 163)" : "2px solid #7a7a7a" }}>

              <div>
                <div className={isMobile ? '' : 'd-flex justify-content-between'}>

                  <div className={`p-2 ${globalTheme === 'light' ? 'text-dark' : 'text-light'}`}>
                    <table>
                      <tbody>
                        <tr>
                          <td><h6 style={{ marginRight: '10px' }}>Pengrajin</h6></td>
                          <td><h6>: {searchSupplier}</h6></td>
                        </tr>

                      </tbody>
                    </table>
                  </div>

                  <div className={`p-2 ${globalTheme === 'light' ? 'text-dark' : 'text-light'}`}>
                    <table>
                      <tbody>
                        <tr>
                          <td><h6 style={{ marginRight: '10px' }}>Total</h6></td>
                          <td><h6>: Rp. {totalNominal.toLocaleString('id-ID')}</h6></td>
                        </tr>
                        <tr>
                          <td><h6 style={{ marginRight: '10px' }}>DP</h6></td>
                          <td><h6>: Rp. {totalDP.toLocaleString('id-ID')}</h6></td>
                        </tr>
                        <tr>
                          <td><h6 style={{ marginRight: '10px' }}>Kekurangan</h6></td>
                          <td><h6>: Rp. {(totalNominal - totalDP).toLocaleString('id-ID')}</h6></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                </div>

                <div className={`p-2 overflow-auto ${globalTheme === 'light' ? 'text-dark' : 'text-light'}`}>
                  <table>
                    <thead>
                      <tr>
                        <th className='tableStyle text-center'>No</th>
                        <th className='tableStyle text-center'>SPK</th>
                        <th className='tableStyle text-center'>Nominal</th>
                        <th className='tableStyle text-center'>DP</th>
                        <th className='tableStyle text-center'>Status</th>
                      </tr>
                    </thead>
                    <tbody>

                      {filteredData.map((spk, index) => {
                        const totalNominal = dataProductRekap
                          .filter(product => product.idSPK === spk.id)
                          .reduce((acc, product) => acc + (Number(product.harga) * Number(product.qty)), 0);

                        const totalDP = dataPaymentRekap
                          .filter(payment => payment.idSPK === spk.id)
                          .reduce((acc, payment) => acc + Number(payment.jumlah), 0);

                        return (
                          <tr key={index} className={`tr-hover-effect tema-${globalTheme}`}>
                            <td className='tableStyle text-center'>{index + 1}</td>
                            <td className='tableStyle text-center'>
                              <Link to={`/spk/${spk.id}`} style={{ color: globalTheme === "light" ? "black" : "white" }}>
                                {spk.code}
                              </Link>
                            </td>
                            <td className='tableStyle text-center'>Rp. {Number(totalNominal).toLocaleString('id-ID')}</td>
                            <td className='tableStyle text-center'>Rp. {Number(totalDP).toLocaleString('id-ID')}</td>
                            <td className='tableStyle text-center'>
                              {totalNominal - totalDP === 0 ? 'Lunas' : 'Belum Lunas'}
                            </td>
                          </tr>
                        );
                      })}




                    </tbody>
                  </table>
                </div>
              </div>


            </div>

            <div style={{ display: searchSupplier !== '' && !slug && !showProduct ? 'block' : 'none' }}>
              <div className="mt-4"
                ref={targetElementRefRekapPayment}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  position: "sticky",
                  ...(isMobile ? { top: -1 } : { top: 3 }), zIndex: 1,
                  backgroundColor: isElementVisibleRekapPayment ? (globalTheme === "light" ? "#f3f3f3" : "#151515") : "transparent",
                  margin: "5px 5px 5px 5px",
                  padding: "3px",
                  borderRadius: "30px",
                  border: "1px solid transparent",
                  transition: "background-color 1s ease, border 1s ease",
                }}>
                <h4 style={{ color: globalTheme == "light" ? "#000000" : "#ffffff", marginTop: "3px", marginBottom: "5px" }}>Payment History</h4>
              </div>

              <div className='SPK shadow mt-1' style={{ backgroundImage: globalTheme === "light" ? "linear-gradient(to right, #ffffff, #e7e7e7)" : "linear-gradient(to right, #151515, #303030)", border: globalTheme === "light" ? "2px solid rgb(163, 163, 163)" : "2px solid #7a7a7a" }}>
                <div className={`p-2 ${globalTheme === 'light' ? 'text-dark' : 'text-light'}`}>
                  <table>
                    <thead>
                      <tr>
                        <th className='tableStyle text-center'>No</th>
                        <th className='tableStyle text-center'>Gambar</th>
                        <th className='tableStyle text-center'>Detail</th>
                        <th className='tableStyle text-center'>Tanggal</th>
                        <th className='tableStyle text-center'>Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>

                      {dataPaymentRekap.map((payment, index) => (
                        <tr key={index} className={`tr-hover-effect tema-${globalTheme}`} onClick={() => navigate(`/spk/${payment.idSPK}`)}>
                          <td className='tableStyle text-center'>{index + 1}</td>
                          <td className='tableStyle text-center'>
                            <span onClick={(e) => { e.stopPropagation(); }}>
                              <Image width={100} height={'auto'} style={{ borderRadius: "10px" }} src={getImageUrl(payment.image)} />
                            </span>
                          </td>
                          <td className='tableStyle text-center'>{payment.detail}</td>
                          <td className='tableStyle text-center'>{payment.tanggal ? dayjs(payment.tanggal, 'YYYY-MM-DD').format('DD-MM-YYYY') : ''}</td>
                          <td className='tableStyle text-center'>Rp. {Number(payment.jumlah).toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>


            {/* rekap product */}
            <div className="SPK mb-1 shadow" style={{ display: searchSupplier !== '' && !slug && showProduct ? 'block' : 'none', backgroundImage: globalTheme === "light" ? "linear-gradient(to right, #ffffff, #e7e7e7)" : "linear-gradient(to right, #151515, #303030)", border: globalTheme === "light" ? "2px solid #d2d2d2" : "2px solid #7a7a7a" }}>

              <div>
                <div className={isMobile ? '' : 'd-flex justify-content-between'} onClick={() => setShowUpdateSPKModal(true)}>
                  <div className={`p-2 ${globalTheme === 'light' ? 'text-dark' : 'text-light'}`}>
                    <h6>Rekap Produk {searchSupplier}</h6>
                  </div>


                </div>

                <div className={`p-2 overflow-auto ${globalTheme === 'light' ? 'text-dark' : 'text-light'}`}>
                  <table>
                    <thead>
                      <tr>
                        <th className='tableStyle text-center'>No</th>
                        <th className='tableStyle text-center'>Gambar</th>
                        <th className='tableStyle text-center'>Keterangan</th>
                        <th className='tableStyle text-center'>Harga</th>
                        <th className='tableStyle text-center'>Qty</th>
                        <th className='tableStyle text-center'>Total</th>
                        <th className='tableStyle text-center'>Deadline</th>
                      </tr>
                    </thead>
                    <tbody>

                      {dataProductRekap.map((product, index) => (
                        <tr key={index} onClick={() => navigate(`/spk/${product.idSPK}`)}>
                          <td className='tableStyle text-center'>{index + 1}</td>
                          <td className='tableStyle text-center'>
                            <img style={{ width: "100px" }} src={getImageUrl(product.image)} />
                          </td>
                          <td className='tableStyle text-center' style={{ whiteSpace: 'pre-line' }}>{product.keterangan}</td>
                          <td className='tableStyle text-center'>Rp. {Number(product.harga).toLocaleString('id-ID')}</td>
                          <td className='tableStyle text-center'>{product.qty}</td>
                          <td className='tableStyle text-center'>Rp. {Number(product.harga * product.qty).toLocaleString('id-ID')}</td>
                          {product.status === "Completed" ? (
                            <td className='tableStyle text-center'>Completed</td>
                          ) : (
                            <td className='tableStyle text-center'>{new Date(product.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                          )}
                        </tr>
                      ))}



                    </tbody>
                  </table>
                </div>
              </div>


            </div>




            {/* detail spk */}
            <div className="SPK mb-1 shadow" style={{ display: searchSupplier !== '' && !slug ? 'none' : '', backgroundImage: globalTheme === "light" ? "linear-gradient(to right, #ffffff, #e7e7e7)" : "linear-gradient(to right, #151515, #303030)", border: globalTheme === "light" ? "2px solid rgb(163, 163, 163)" : "2px solid #7a7a7a" }}>
              <div>
                <div className={isMobile ? '' : 'd-flex justify-content-between hover-effect'}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    const status = dataSPKFromDB[0]?.status;
                    if ((status === 'Draft' || status === 'Revisi' || user.uid === "w4M5JJjgGQeHFbS2nkyoCfUBE532" || user.uid === "4WGPaHicKWYr0Ny84IUh8xb9Bo62" || user.uid === "fYpdHwXRDLhj5XGxM5FZIAvxp9E2") && !showPending) {
                      setShowUpdateSPKModal(true);
                    }
                  }}
                >
                  {isMobile ? (
                    <div style={{ padding: 10, color: globalTheme === 'light' ? '#111' : '#eee' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 17, fontWeight: 700, overflowWrap: 'anywhere' }}>{dataSPKFromDB[0]?.pengrajin || ''}</div>
                          <div style={{ fontSize: 13, opacity: 0.75, overflowWrap: 'anywhere' }}>{dataSPKFromDB[0]?.code || ''}</div>
                          <div style={{ fontSize: 13, opacity: 0.75 }}>{dataSPKFromDB[0]?.tanggalCetak ? new Date(dataSPKFromDB[0].tanggalCetak).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</div>
                        </div>
                        {dataSPKFromDB[0]?.status && (() => {
                          const st = dataSPKFromDB[0].status;
                          const w = st.startsWith('Acc') ? '#15803d' : st === 'Revisi' ? '#2563eb' : '#dc2626';
                          return <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 700, color: w, border: `1.5px solid ${w}`, borderRadius: 14, padding: '2px 10px' }}>{st}</span>;
                        })()}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10 }}>
                        {[
                          ['Total', totalData, null],
                          ['DP / Dibayar', totalDataPayment, '#15803d'],
                          ['Kekurangan', totalData - totalDataPayment, totalData - totalDataPayment > 0 ? '#c2410c' : '#15803d'],
                          ['Selesai', totalSelesai, null],
                        ].map(([l, v, w]) => (
                          <div key={l} style={{ background: globalTheme === 'light' ? 'rgba(0,0,0,.04)' : 'rgba(255,255,255,.06)', borderRadius: 8, padding: '6px 8px' }}>
                            <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase' }}>{l}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: w || undefined }}>{rpSPK(v)}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 11.5, opacity: 0.6, marginTop: 6 }}>Ketuk kotak ini untuk ubah SPK / tambah produk</div>
                    </div>
                  ) : (
                  <>

                  <div className={`p-2 ${globalTheme === 'light' ? 'text-dark' : 'text-light'}`}>
                    <table>
                      <tbody>
                        <tr>
                          <td><h6 style={{ marginRight: '10px' }}>Pengrajin</h6></td>
                          <td><h6>: {dataSPKFromDB.length > 0 ? dataSPKFromDB[0].pengrajin : ''}</h6></td>
                        </tr>
                        <tr>
                          <td><h6 style={{ marginRight: '10px' }}>Tanggal Cetak</h6></td>
                          <td><h6>: {dataSPKFromDB.length > 0 ? new Date(dataSPKFromDB[0].tanggalCetak).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</h6></td>
                        </tr>
                        <tr>
                          <td><h6 style={{ marginRight: '10px' }}>Code</h6></td>
                          <td><h6>: {dataSPKFromDB.length > 0 ? dataSPKFromDB[0].code : ''}</h6></td>
                        </tr>
                        {/* <tr>
                          <td>
                            <h6 style={{ marginRight: '10px' }}>Status</h6>
                          </td>
                          <td>
                            <h6>: <span style={{color: dataSPKFromDB[0]?.status === 'Acc' ? 'green' : dataSPKFromDB[0]?.status === 'Revisi' ? 'blue' : dataSPKFromDB[0]?.status === 'Draft' ? 'red' : 'black' }}>{dataSPKFromDB.length > 0 ? dataSPKFromDB[0].status : '-'}</span>
                            </h6>
                          </td>
                        </tr> */}

                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h1 style={{ color: dataSPKFromDB[0]?.status === 'Acc' ? 'rgba(45, 255, 0, 0.5)' : dataSPKFromDB[0]?.status === 'Acc Keterangan' ? 'rgba(45, 255, 0, 0.5)' : dataSPKFromDB[0]?.status === 'Acc Harga' ? 'rgba(45, 255, 0, 0.5)' : dataSPKFromDB[0]?.status === 'Revisi' ? 'rgba(0, 23, 255, 0.4)' : dataSPKFromDB[0]?.status === 'Draft' ? 'rgba(255, 0, 0, 0.4)' : 'black' }}>{dataSPKFromDB.length > 0 ? dataSPKFromDB[0].status : ''}</h1>
                  </div>

                  <div className={`p-2 ${globalTheme === 'light' ? 'text-dark' : 'text-light'}`}>
                    <table>
                      <tbody>
                        <tr>
                          <td><h6 style={{ marginRight: '10px' }}>Total</h6></td>
                          <td><h6>: Rp. {totalData.toLocaleString('id-ID')}</h6></td>
                        </tr>
                        <tr>
                          <td><h6 style={{ marginRight: '10px' }}>DP</h6></td>
                          <td><h6>: Rp. {totalDataPayment.toLocaleString('id-ID')}</h6></td>
                        </tr>
                        <tr>
                          <td><h6 style={{ marginRight: '10px' }}>Kekurangan</h6></td>
                          <td><h6>: Rp. {(totalData - totalDataPayment).toLocaleString('id-ID')}</h6></td>
                        </tr>
                        <tr>
                          <td><h6 style={{ marginRight: '10px' }}>Selesai</h6></td>
                          <td><h6>: Rp. {(totalSelesai).toLocaleString('id-ID')}</h6></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  </>
                  )}

                </div>

                {isMobile ? (
                  <div style={{ padding: '0 8px 8px' }}>
                    {dataSPKproductFromDB.length === 0 && <div style={{ textAlign: 'center', opacity: 0.6, padding: 16 }}>Belum ada produk di SPK ini.</div>}
                    {dataSPKproductFromDB.map((product, index) => (
                      <div key={product.id || index} style={{ ...kartuMobile, display: 'flex', gap: 10, cursor: 'pointer' }} onClick={() => bukaEditProdukSPK(product)}>
                        <span onClick={(e) => { e.stopPropagation(); setCostingProduk(product); }} style={{ flexShrink: 0 }}>
                          <img alt="" style={{ width: 84, height: 84, borderRadius: 8, objectFit: 'cover', display: 'block' }} src={getImageUrl(product.image)} />
                        </span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, overflowWrap: 'anywhere' }}>{index + 1}. {product.namaBarang || '-'}</div>
                          {product.keterangan && <div style={{ fontSize: 12.5, opacity: 0.8, whiteSpace: 'pre-line', overflowWrap: 'anywhere', marginTop: 2 }}>{product.keterangan}</div>}
                          <div style={{ fontSize: 13, marginTop: 4 }}>
                            {rpSPK(product.harga)} × {product.qty} = <b>{rpSPK(product.harga * product.qty)}</b>
                          </div>
                          <BudgetBadge budget={product.budget} harga={product.harga} dariQuote={product.budgetDariQuote} />
                          <div style={{ fontSize: 12, marginTop: 2, color: product.status === 'Completed' ? '#15803d' : undefined, opacity: product.status === 'Completed' ? 1 : 0.75 }}>
                            {product.status === 'Completed' ? '✓ Completed' : `Deadline: ${product.deadline ? new Date(product.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                <div className={`p-2 overflow-auto ${globalTheme === 'light' ? 'text-dark' : 'text-light'}`}>
                  <table>
                    <thead>
                      <tr>
                        <th className='tableStyle text-center'>No</th>
                        <th className='tableStyle text-center'>Gambar</th>
                        <th className='tableStyle text-center'>Keterangan</th>
                        <th className='tableStyle text-center'>Harga</th>
                        <th className='tableStyle text-center'>Qty</th>
                        <th className='tableStyle text-center'>Total</th>
                        <th className='tableStyle text-center'>Deadline</th>
                      </tr>
                    </thead>
                    <tbody>

                      {dataSPKproductFromDB.map((product, index) => (
                        <tr key={index} className={`tr-hover-effect tema-${globalTheme}`} style={{ cursor: "pointer" }} onClick={() => bukaEditProdukSPK(product)}>
                          <td className='tableStyle text-center'>{index + 1}</td>
                          <td className='tableStyle text-center'>
                            {/* <img style={{ width: "100px" }} src={product.image} /> */}
                            <span onClick={(e) => { e.stopPropagation(); setCostingProduk(product); }} title="Lihat costing produk">
                              <img alt="" style={{ width: 100, borderRadius: 10 }} src={getImageUrl(product.image)} />
                            </span>
                          </td>
                          <td className='tableStyle text-center' style={{ whiteSpace: 'pre-line' }}><span className='fw-semibold text-muted'>{product.namaBarang}</span><hr/>{product.keterangan}</td>
                          <td className='tableStyle text-center'>
                            Rp. {Number(product.harga).toLocaleString('id-ID')}
                            <BudgetBadge budget={product.budget} harga={product.harga} dariQuote={product.budgetDariQuote} />
                          </td>
                          <td className='tableStyle text-center'>{product.qty}</td>
                          <td className='tableStyle text-center'>Rp. {Number(product.harga * product.qty).toLocaleString('id-ID')}</td>
                          {product.status === "Completed" ? (
                            <td className='tableStyle text-center'>Completed</td>
                          ) : (
                            <td className='tableStyle text-center'>{new Date(product.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                          )}
                        </tr>
                      ))}

                      {dataSPKpaymentFromDB.map((payment, index) => (
                        <tr key={index}>
                          <td className='tableStyle text-center' colSpan="4">{payment.detail}</td>
                          <td className='tableStyle text-center' colSpan="1">{payment.tanggal ? dayjs(payment.tanggal, 'YYYY-MM-DD').format('DD-MM-YYYY') : ''}</td>
                          <td className='tableStyle text-center' colSpan="2">Rp. {Number(payment.jumlah).toLocaleString('id-ID')}</td>
                        </tr>
                      ))}


                    </tbody>
                  </table>
                </div>
                )}
              </div>


            </div>
            <div
              style={{
                display:
                  showPending || (searchSupplier !== '' && !slug) ? 'none' : '',
              }}>
              <div className="mt-4"
                ref={targetElementRefPayment}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  position: "sticky",
                  ...(isMobile ? { top: -1 } : { top: 3 }),
                  zIndex: 1,
                  backgroundColor: isElementVisiblePayment ? (globalTheme === "light" ? "#f3f3f3" : "#151515") : "transparent",
                  margin: "5px 5px 5px 5px",
                  padding: "3px",
                  borderRadius: "30px",
                  border: "1px solid transparent",
                  transition: "background-color 1s ease, border 1s ease",
                }}>
                <h4 style={{ color: globalTheme == "light" ? "#000000" : "#ffffff", marginTop: "3px", marginBottom: "5px" }}>Payment History</h4>
                <button className="btnKomentar" style={{ marginRight: '0.5vh' }} onClick={() => { setShowPaymentModal(true); refreshState(); }}>Payment</button>
              </div>

              {isMobile ? (
                <div style={{ padding: '4px 4px 16px' }}>
                  {dataSPKpaymentFromDB.length === 0 && <div style={{ textAlign: 'center', opacity: 0.6, padding: 16, color: globalTheme === 'light' ? '#111' : '#eee' }}>Belum ada pembayaran.</div>}
                  {dataSPKpaymentFromDB.map((payment, index) => (
                    <div key={payment.id || index} style={{ ...kartuMobile, display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => handleEditPayment(payment.id, payment.detail, payment.tanggal, payment.jumlah, payment.image, payment.akunSumber, payment.jurnalOtomatis)}>
                      <span onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
                        <Image width={60} height={60} style={{ borderRadius: 8, objectFit: 'cover' }} src={getImageUrl(payment.image)} />
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{rpSPK(payment.jumlah)}</div>
                        <div style={{ fontSize: 12.5, opacity: 0.8, overflowWrap: 'anywhere' }}>{payment.detail}</div>
                        <div style={{ fontSize: 12, opacity: 0.65 }}>{payment.tanggal ? dayjs(payment.tanggal, 'YYYY-MM-DD').format('DD-MM-YYYY') : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
              <div className='SPK shadow mt-1' style={{ backgroundImage: globalTheme === "light" ? "linear-gradient(to right, #ffffff, #e7e7e7)" : "linear-gradient(to right, #151515, #303030)", border: globalTheme === "light" ? "2px solid rgb(163, 163, 163)" : "2px solid #7a7a7a" }}>
                <div className={`p-2 ${globalTheme === 'light' ? 'text-dark' : 'text-light'}`}>
                  <table>
                    <thead>
                      <tr>
                        <th className='tableStyle text-center'>No</th>
                        <th className='tableStyle text-center'>Gambar</th>
                        <th className='tableStyle text-center'>Detail</th>
                        <th className='tableStyle text-center'>Tanggal</th>
                        <th className='tableStyle text-center'>Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>

                      {dataSPKpaymentFromDB.map((payment, index) => (
                        <tr className={`tr-hover-effect tema-${globalTheme}`} key={index} onClick={() => handleEditPayment(payment.id, payment.detail, payment.tanggal, payment.jumlah, payment.image, payment.akunSumber, payment.jurnalOtomatis)}>
                          <td className='tableStyle text-center'>{index + 1}</td>
                          <td className='tableStyle text-center'>
                            {/* <img style={{ width: "100px" }} src={payment.image} /> */}
                            <span onClick={(e) => { e.stopPropagation(); }}>
                              <Image width={100} height={'auto'} style={{ borderRadius: "10px" }} src={getImageUrl(payment.image)} />
                            </span>
                          </td>
                          <td className='tableStyle text-center'>{payment.detail}</td>
                          <td className='tableStyle text-center'>{payment.tanggal ? dayjs(payment.tanggal, 'YYYY-MM-DD').format('DD-MM-YYYY') : ''}</td>
                          <td className='tableStyle text-center'>Rp. {Number(payment.jumlah).toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              )}
            </div>

          </Col>
        </Row>

        {/* Modal */}
        <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} open={showAddSpkModal} onCancel={() => setShowAddSpkModal(false)}
          key={showAddSpkModal}
          style={{ zIndex: 9999 }}
          width={400}
          title={<h5 style={{ textAlign: "center" }}>Add SPK</h5>}
          footer={[
            <div style={{ marginTop: '30px' }}>
              <Button
                key="submit"
                type="primary"
                onClick={handleSubmitSpk}
              >
                Submit
              </Button>
            </div>
          ]}
        >
          {/* Your comment form here */}
          <label className='mt-2 mb-1 fw-semibold'>Category :</label>
          <Select
            style={{ width: '100%' }}
            showSearch
            placeholder="Select Category"
            defaultValue=""
            // onChange={(e) => { handleChangeCategory(e.target.value); setInputPengrajin('') }}
            onChange={(value) => { handleChangeCategory(value); setInputPengrajin('') }}
            options={[
              { value: 'Besi', label: 'Besi' },
              { value: 'Kayu', label: 'Kayu' },
              { value: 'Jok', label: 'Jok' },
              { value: 'Rotan', label: 'Rotan' },
              { value: 'Marmer', label: 'Marmer & Kaca' },
              { value: 'Fiber', label: 'Fiber' },
              { value: 'Veneer', label: 'Veneer' },
              { value: 'Finishing', label: 'Finishing' },
              { value: 'Hardware', label: 'Hardware' },
              { value: 'BarangJadi', label: 'Barang Jadi' },
            ]}
          />

          <label className='mt-2 mb-1 fw-semibold'>Pengrajin :</label>

          <Select
            style={{ width: '100%' }}
            placeholder="Select Supplier"
            value={inputPengrajin}
            onChange={(value) => setInputPengrajin(value)}
            showSearch
            optionFilterProp="children"
            getPopupContainer={trigger => trigger.parentNode}
          >
            {dataSupplierFromDB.map((item, index) => (
              <Option key={index} value={item.supplierName}>
                {item.supplierName}
              </Option>
            ))}
          </Select>

          <div className="row mt-1 mb-1">
            <div className="col-6 d-flex flex-column">
              <label className='mt-2 mb-1 fw-semibold'>Tanggal Cetak :</label>
              <DatePicker
                className="date-picker-custom"
                format="DD-MM-YYYY"
                defaultValue={inputTanggalCetak ? dayjs(inputTanggalCetak, 'YYYY-MM-DD') : undefined}
                onChange={(date, dateString) => {
                  // Mengonversi dateString (DD-MM-YYYY) ke format YYYY-MM-DD sebelum diset ke state
                  const formattedDate = date ? date.format('YYYY-MM-DD') : '';
                  setInputTanggalCetak(formattedDate);
                }}
                required
                getPopupContainer={(trigger) => trigger.parentNode}
              />
            </div>

            <div className="col-6 d-flex flex-column">
              <label className='mt-2 mb-1 fw-semibold'>Code :</label>
              <Input
                style={{ width: '100%' }}
                defaultValue={inputCode}
                onChange={useCallback(debounce((e) => setInputCode(e.target.value), 300), [])}
              />
            </div>
          </div>
        </Modal>
        {/* End Modal */}

        {/* Modal */}
        <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`}
          key={showUpdateSPKModal}
          style={{ zIndex: 9999 }}
          width={400}
          open={showUpdateSPKModal}
          onCancel={() => setShowUpdateSPKModal(false)}
          title={<h5 style={{ textAlign: "center" }}>Update SPK</h5>}
          footer={[
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', marginTop: '30px' }}>
              {/* Tombol Delete di kiri */}
              <Popconfirm
                title="Delete data"
                description="Are you sure you want to delete this data?"
                onConfirm={() => { handleDeleteSPK(); setShowUpdateSPKModal(false) }}
                // onCancel={cancel}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  key="delete"
                  type="primary"
                  danger // Tombol Delete berwarna merah
                  style={{ marginRight: 'auto' }} // Agar tombol Delete berada di kiri
                // onClick={() => { setShowDeleteSpkModal(true); setShowUpdateSPKModal(false); }}
                >
                  Delete
                </Button>
              </Popconfirm>

              {/* Tombol Submit di kanan */}
              <div>
                <Button
                  style={{ marginRight: '5px' }}
                  key="submit"
                  type="default"
                  primary
                  onClick={() => { setShowAddProductModal(true); setShowUpdateSPKModal(false); refreshState(); setIsLinked(false) }}
                >
                  Add Product
                </Button>
                <Button
                  key="submit"
                  type="primary"
                  onClick={handleSubmitUpdateSpk}
                >
                  Submit
                </Button>
              </div>
            </div>
          ]}
        >


          <div className="row mt-1 mb-1">
            <div className="col-6 d-flex flex-column">
              <label className='mt-2 fw-semibold'>Pengrajin :</label>
              <Input type='text' value={pengrajin} onChange={(e) => setPengrajin(e.target.value)} disabled style={{ backgroundColor: '#f5f5f5', color: '#aaa', cursor: 'not-allowed' }}></Input>
            </div>

            <div className="col-6 d-flex flex-column">
              <label className='mt-2 fw-semibold'>Code :</label>
              <Input type='text' defaultValue={code} onChange={useCallback(debounce((e) => setCode(e.target.value), 300), [])} disabled style={{ backgroundColor: '#f5f5f5', color: '#aaa', cursor: 'not-allowed' }}></Input>
            </div>
          </div>

          <div className="row mt-1 mb-1">
            <div className="col-6 d-flex flex-column">
              <label className='mt-2 fw-semibold'>Tanggal Cetak :</label>

              <DatePicker
                className="date-picker-custom"
                format="DD-MM-YYYY"
                defaultValue={tanggalCetak ? dayjs(tanggalCetak, 'YYYY-MM-DD') : undefined}
                onChange={(date, dateString) => {
                  // Mengonversi dateString (DD-MM-YYYY) ke format YYYY-MM-DD sebelum diset ke state
                  const formattedDate = date ? date.format('YYYY-MM-DD') : '';
                  setTanggalCetak(formattedDate);
                }}
                required
                getPopupContainer={(trigger) => trigger.parentNode}
              />
            </div>

            <div className="col-6 d-flex flex-column">
              {user.uid === "w4M5JJjgGQeHFbS2nkyoCfUBE532" || user.uid === "4WGPaHicKWYr0Ny84IUh8xb9Bo62" || user.uid === "fYpdHwXRDLhj5XGxM5FZIAvxp9E2" ? (
                <div>
                  <label className='mt-2 fw-semibold'>Status :</label>

                  <Select
                    style={{ width: '100%' }}
                    showSearch
                    placeholder="Select Status"
                    value={status || ""}
                    onChange={(value) => { setStatus(value); }}
                    options={[
                      { value: 'Draft', label: 'Draft' },
                      { value: 'Revisi', label: 'Revisi' },
                      { value: 'Acc', label: 'Acc' },
                      { value: 'Acc Keterangan', label: 'Acc Keterangan' },
                      { value: 'Acc Harga', label: 'Acc Harga' },
                    ]}
                  />
                </div>
              ) : null}
            </div>
          </div>


        </Modal>
        {/* End Modal */}

        {/* Modal */}
        <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`}
          style={{ zIndex: 9999 }}
          width={400}
          title={<h5 style={{ textAlign: "center" }}>Add Product</h5>}
          key={showAddProductModal}
          open={showAddProductModal}
          onCancel={() => setShowAddProductModal(false)}
          footer={[
            <div >
              <Button
                key="submit"
                type="primary"
                onClick={handleSubmitAddProduct}
              >
                Submit
              </Button>
            </div>
          ]}
        >



          <label class="mt-3 mb-1 fw-semibold">Product :</label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Select
              style={{ width: '60%' }}
              showSearch
              placeholder="Pilih Produk"
              value={selectedProduct}
              optionFilterProp="data-label" // <== penting
              onChange={(value, option) => {
                const selectedItem = filteredProjectData.find(item => item.id === value);
                if (selectedItem) {
                  setIdProject(selectedItem.id);
                  setSelectedProduct(selectedItem.NamaBarang);
                  setImageProject(selectedItem.image1);
                  setIsLinked(true);
                }
              }}
              getPopupContainer={trigger => trigger.parentNode}
            >
              {filteredProjectData.map(item => (
                <Option
                  key={item.id}
                  value={item.id}
                  data-label={item.NamaBarang} // <== ini buat search
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img
                      src={getImageUrl(item.image1)}
                      alt={item.NamaBarang}
                      style={{ width: 30, marginRight: 10 }}
                    />
                    {item.NamaBarang}
                  </div>
                </Option>
              ))}
            </Select>





            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ margin: 0 }}>Link :</label>
              <Switch
                checked={isLinked}
                onChange={(checked) => setIsLinked(checked)}
                checkedChildren="On"
                unCheckedChildren="Off"
              />

            </div>
          </div>



          <label class="mt-2 mb-1 fw-semibold">Gambar :</label>
          <div className='d-flex'>
            <input className="form-control" type="file"
              style={{
                height: '30px',
                fontSize: '14px'
              }}
              onChange={(e) => {
                const files = e.target.files;
                setFileToUpload(files[0]);
              }}
            />
            <Button variant="secondary" className='antd-btn-custom' style={{ marginLeft: "20px", height: "30px", fontSize: '14px' }} onClick={() => pasteImage('addProduct')}><FaPaste /></Button>
          </div>


          <label class="mt-3 mb-1 fw-semibold">Keterangan :</label>
          <TextArea rows={5} type='text' onChange={useCallback(debounce((e) => setKeterangan(e.target.value), 300), [])} />

          <div className="row mt-3 mb-1">
            <div className="col-9 d-flex flex-column">
              <label class="mb-1 fw-semibold">Harga :</label>
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
                onChange={useCallback(debounce((value) => setHarga(value), 300), [])}
              />
            </div>

            <div className="col-3 d-flex flex-column">
              <label class="mb-1 fw-semibold">Qty :</label>
              <InputNumber
                className="w-100"
                type="number"
                onChange={useCallback(debounce((value) => setQty(value), 300), [])}
              />
            </div>
          </div>

          <div className="row mt-3 mb-1">
            <div className="col-6 d-flex flex-column">
              <label class="mb-1 fw-semibold">Deadline :</label>

              <DatePicker
                className="date-picker-custom"
                format="DD-MM-YYYY"
                onChange={(date, dateString) => {
                  // Mengonversi dateString (DD-MM-YYYY) ke format YYYY-MM-DD sebelum diset ke state
                  const formattedDate = date ? date.format('YYYY-MM-DD') : '';
                  setDeadline(formattedDate);
                }}
                required
                getPopupContainer={(trigger) => trigger.parentNode}
              />

            </div>

          </div>

        </Modal>
        {/* End Modal */}

        {/* Modal */}
        <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`}
          key={showEditProductModal}
          style={{ zIndex: 9999 }}
          width={450}
          title={<h5 style={{ textAlign: "center" }}>Edit Product</h5>}
          open={showEditProductModal}
          onCancel={() => setShowEditProductModal(false)}
          footer={[
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', marginTop: '30px' }}>
              {/* Tombol Delete di kiri */}

              <Popconfirm
                title="Delete data"
                description="Are you sure you want to delete this data?"
                onConfirm={() => { handleDeleteProduct(); setShowEditProductModal(false) }}
                // onCancel={cancel}
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
                onClick={handleSubmitEditProduct}
              >
                Submit
              </Button>
            </div>
          ]}
        >

          <label class="mt-2 mb-1 fw-semibold">SPK :</label>
          <div>

            <Select
              style={{ width: '70%' }}
              placeholder="Pilih SPK"
              value={selectedSPK}
              onChange={(value) => {
                const selectedItem = filteredSPKData.find(item => item.id === value);
                if (selectedItem) {
                  setIdSpkEdit(selectedItem.id);
                  setSelectedSPK(selectedItem.code);
                }
              }}
              showSearch
              optionFilterProp="children"
              getPopupContainer={trigger => trigger.parentNode}
            >
              {filteredSPKData.map((item, index) => (
                <Option key={index} value={item.id}>
                  {item.code}
                </Option>
              ))}
            </Select>

          </div>

          <label class="mt-3 mb-1 fw-semibold">Product :</label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Select
              style={{ width: '70%' }}
              showSearch
              placeholder="Pilih Produk"
              value={selectedProduct}
              optionFilterProp="data-label" // <== penting
              onChange={(value, option) => {
                const selectedItem = filteredProjectData.find(item => item.id === value);
                if (selectedItem) {
                  setIdProject(selectedItem.id);
                  setSelectedProduct(selectedItem.NamaBarang);
                  setImageProject(selectedItem.image1);
                  setIsLinked(true);
                }
              }}
              getPopupContainer={trigger => trigger.parentNode}
            >
              {filteredProjectData.map(item => (
                <Option
                  key={item.id}
                  value={item.id}
                  data-label={item.NamaBarang} // <== ini buat search
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img
                      src={getImageUrl(item.image1)}
                      alt={item.NamaBarang}
                      style={{ width: 30, marginRight: 10 }}
                    />
                    {item.NamaBarang}
                  </div>
                </Option>
              ))}
            </Select>





            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ margin: 0 }}>Link :</label>
              <Switch
                checked={isLinked}
                onChange={(checked) => setIsLinked(checked)}
                checkedChildren="On"
                unCheckedChildren="Off"
              />

            </div>
          </div>

          <label class="mt-3 mb-1 fw-semibold">Gambar :</label>
          <div className='d-flex'>
            <input className="form-control" type="file"
              style={{
                height: '30px',
                fontSize: '14px'
              }}
              onChange={(e) => {
                const files = e.target.files;
                setFileToUploadEdit(files[0]);
              }}
            />
            <Button variant="secondary" className='antd-btn-custom' style={{ marginLeft: "20px", height: "30px", fontSize: '14px' }} onClick={() => pasteImage('editProduct')}><FaPaste /></Button>
          </div>

          <label class="mt-3 mb-1 fw-semibold">Keterangan :</label>
          <TextArea rows={5} type='text' defaultValue={keteranganEdit} onChange={useCallback(debounce((e) => setKeteranganEdit(e.target.value), 300), [])} />

          <div className="row mt-3 mb-1">
            <div className="col-9 d-flex flex-column">
              <label class="mb-1 fw-semibold">Harga :</label>
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
                defaultValue={hargaEdit}
                onChange={useCallback(debounce((value) => setHargaEdit(value), 300), [])}
              />
              {budgetEdit > 0 && (
                <div className="mt-1" style={{ fontSize: 13, color: budgetWarna.teks }}>
                  Budget / unit: <b>Rp. {budgetEdit.toLocaleString('id-ID')}</b>
                </div>
              )}
            </div>

            <div className="col-3 d-flex flex-column">
              <label class="mb-1 fw-semibold">Qty :</label>
              <InputNumber
                className="w-100"
                type="number"
                defaultValue={qtyEdit}
                onChange={useCallback(debounce((value) => setQtyEdit(value), 300), [])}
              />
            </div>
          </div>

          <div className="row mt-3 mb-1">
            <div className="col-6 d-flex flex-column">
              <label class="mb-1 fw-semibold">Deadline :</label>
              <DatePicker
                className="date-picker-custom"
                format="DD-MM-YYYY"
                defaultValue={deadlineEdit ? dayjs(deadlineEdit, 'YYYY-MM-DD') : undefined}
                onChange={(date, dateString) => {
                  // Mengonversi dateString (DD-MM-YYYY) ke format YYYY-MM-DD sebelum diset ke state
                  const formattedDate = date ? date.format('YYYY-MM-DD') : '';
                  setDeadlineEdit(formattedDate);
                }}
                required
                getPopupContainer={(trigger) => trigger.parentNode}
              />
            </div>
            <div className="col-6 d-flex flex-column">
              <label class="mb-1 fw-semibold">Status :</label>
              <Select
                value={statusEdit || ""}
                onChange={(value) => {
                  setStatusEdit(value);
                  console.log("Status baru:", value);
                }}
                options={[
                  { value: 'Ongoing', label: 'Ongoing' },
                  { value: 'Completed', label: 'Completed' },
                ]}
              />


            </div>
          </div>
        </Modal>
        {/* End Modal */}


        {/* Modal */}
        <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`}
          key={showPaymentModal}
          style={{ zIndex: 9999 }}
          width={400}
          title={<h5 style={{ textAlign: "center" }}>Add Payment</h5>}
          open={showPaymentModal}
          onCancel={() => setShowPaymentModal(false)}
          footer={[
            <div style={{ marginTop: "30px" }}>
              <Button
                key="submit"
                type="primary"
                onClick={handleSubmitPayment}
              >
                Submit
              </Button>
            </div>
          ]}
        >

          <label class="mt-3 mb-1 fw-semibold">Gambar :</label>
          <div className='d-flex'>
            <input className="form-control" type="file"
              style={{
                height: '30px',
                fontSize: '14px'
              }}
              onChange={(e) => {
                const paymentFiles = e.target.files;
                setPaymentFileToUpload(paymentFiles[0]);
              }}
            />
            <Button variant="secondary" className='antd-btn-custom' style={{ marginLeft: "20px", height: "30px", fontSize: '14px' }} onClick={() => pasteImage('addPayment')}><FaPaste /></Button>
          </div>
          <label className='mt-2 mb-1 fw-semibold'>Detail :</label>
          <Input type='text' onChange={useCallback(debounce((e) => setPaymentDetail(e.target.value), 300), [])}></Input>
          <div className="row mt-2 mb-1">
            <div className="col-6 d-flex flex-column">
              <label className='mb-1 fw-semibold'>Tanggal :</label>
              <DatePicker
                className="date-picker-custom"
                format="DD-MM-YYYY"
                onChange={(date, dateString) => {
                  // Mengonversi dateString (DD-MM-YYYY) ke format YYYY-MM-DD sebelum diset ke state
                  const formattedDate = date ? date.format('YYYY-MM-DD') : '';
                  setPaymentTanggal(formattedDate);
                }}
                required
                getPopupContainer={(trigger) => trigger.parentNode}
              />
            </div>
            <div className="col-6 d-flex flex-column">
              <label className='mb-1 fw-semibold'>Jumlah :</label>
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
                onChange={useCallback(debounce((value) => setPaymentJumlah(value), 300), [])}
              />
            </div>
          </div>
          <label className='mt-2 mb-1 fw-semibold'>Dibayar dari :</label>
          <Select className='w-100' placeholder='Pilih rekening pembayar' value={paymentAkunSumber || undefined}
            onChange={setPaymentAkunSumber} getPopupContainer={(trigger) => trigger.parentNode}
            options={Object.entries(REKENING_PEMBAYAR).map(([value, label]) => ({ value, label }))} />
          {opsiAkunBeban.length > 0 && (
            <>
              <label className='mt-2 mb-1 fw-semibold'>Akun beban supplier :</label>
              <Select className='w-100' placeholder='Pilih akun beban' value={paymentAkunBeban || undefined}
                onChange={setPaymentAkunBeban} getPopupContainer={(trigger) => trigger.parentNode} showSearch optionFilterProp='label'
                options={opsiAkunBeban.map((a) => ({ value: a.kodeAkun, label: `${a.kodeAkun} ${a.namaAkun}` }))} />
            </>
          )}
          <small className='d-block mt-1' style={{ opacity: 0.7 }}>Jurnal (Dr Beban supplier / Cr rekening) dibuat otomatis — tidak perlu input jurnal manual.</small>

        </Modal>
        {/* End Modal */}


        {/* Modal */}
        <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`}
          key={showEditPaymentModal}
          width={400}
          style={{ zIndex: 9999 }}
          title={<h5 style={{ textAlign: "center" }}>Edit Payment</h5>}
          open={showEditPaymentModal}
          onCancel={() => setShowEditPaymentModal(false)}
          footer={[
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', marginTop: '30px' }}>
              {/* Tombol Delete di kiri */}

              <Popconfirm
                title="Delete data"
                description="Are you sure you want to delete this data?"
                onConfirm={() => { handleDeletePayment(); setShowEditPaymentModal(false) }}
                // onCancel={cancel}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  key="delete"
                  type="primary"
                  danger // Tombol Delete berwarna merah
                  style={{ marginRight: 'auto' }} // Agar tombol Delete berada di kiri
                // onClick={() => { setShowDeletePaymentModal(true); setShowEditPaymentModal(false) }}
                >
                  Delete
                </Button>
              </Popconfirm>




              {/* Tombol Submit di kanan */}
              <Button
                key="submit"
                type="primary"
                onClick={handleSubmitEditPayment}
              >
                Submit
              </Button>
            </div>
          ]}
        >
          {/* Your comment form here */}

          <label className='mt-2 fw-semibold'>Gambar :</label>
          <img className='mt-2' style={{ width: "150px", display: paymentImageDelete ? "none" : "block", borderRadius: "10px", marginBottom: "10px" }} src={getImageUrl(paymentImageEdit)} onClick={() => setPaymentImageDelete(true)} />
          <div className='d-flex'>
            <input className="form-control" type="file"
              style={{
                height: '30px',
                fontSize: '14px'
              }}
              onChange={(e) => {
                const filesPaymentEdit = e.target.files;
                setFileToUploadPaymentEdit(filesPaymentEdit[0]);
              }}
            />
            <Button variant="secondary" className='antd-btn-custom' style={{ marginLeft: "20px", height: "30px", fontSize: '14px' }} onClick={() => pasteImage('editPayment')}><FaPaste /></Button>
          </div>


          <label className='mt-2 mb-1 fw-semibold'>Detail :</label>
          <Input type='text' defaultValue={detailEdit} onChange={useCallback(debounce((e) => setDetailEdit(e.target.value), 300), [])}></Input>
          <div className="row mt-2 mb-1">
            <div className="col-6 d-flex flex-column">
              <label className='mb-1 fw-semibold'>Tanggal :</label>
              <DatePicker
                className="date-picker-custom"
                format="DD-MM-YYYY"
                defaultValue={tanggalEdit ? dayjs(tanggalEdit, 'YYYY-MM-DD') : undefined}
                onChange={(date, dateString) => {
                  // Mengonversi dateString (DD-MM-YYYY) ke format YYYY-MM-DD sebelum diset ke state
                  const formattedDate = date ? date.format('YYYY-MM-DD') : '';
                  setTanggalEdit(formattedDate);
                }}
                required
                getPopupContainer={(trigger) => trigger.parentNode}
              />
            </div>
            <div className="col-6 d-flex flex-column">
              <label className='mb-1 fw-semibold'>Jumlah :</label>
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
                defaultValue={jumlahEdit}
                onChange={useCallback(debounce((value) => setJumlahEdit(value), 300), [])}
              />
            </div>
          </div>
          {jurnalOtomatisEdit && (
            <>
              <label className='mt-2 mb-1 fw-semibold'>Dibayar dari :</label>
              <Select className='w-100' value={akunSumberEdit || undefined} onChange={setAkunSumberEdit}
                getPopupContainer={(trigger) => trigger.parentNode}
                options={Object.entries(REKENING_PEMBAYAR).map(([value, label]) => ({ value, label }))} />
              <small className='d-block mt-1' style={{ opacity: 0.7 }}>Jurnal otomatis ikut diperbarui.</small>
            </>
          )}
        </Modal>
        {/* End Modal */}



        {/* Modal */}
        <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} open={showSupplier} onCancel={() => setShowSupplier(false)}
          style={{ zIndex: 9999 }}
          width={400}
          title={<h5 style={{ textAlign: "center" }}>Supplier</h5>}
          footer={[
            <div>

              {/* Tombol Submit di kanan */}
              <Button
                key="submit"
                type="primary"
                onClick={handleStopSearchSupplier}
              >
                Refresh
              </Button>
            </div>
          ]}
        >
          {/* Your comment form here */}

          <div className="d-flex justify-content-between align-items-center" onClick={() => handleSearchSupplier('Besi', 'Besi')}>
            <p style={{ cursor: 'pointer' }} className="fw-semibold">Supplier Besi :</p>
          </div>
          <ul>
            {dataSupplierFromDB.map((supplier, index) => {
              if (supplier.category == 'Besi') {
                return (
                  <div className="d-flex justify-content-between align-items-center">
                    <li style={{ cursor: 'pointer' }} key={index} onClick={() => handleSearchSupplier(supplier.supplierName, 'Besi')}>{supplier.supplierName}</li>
                  </div>
                )
              }

            })}
          </ul>

          <div className="d-flex justify-content-between align-items-center" onClick={() => handleSearchSupplier('Kayu', 'Kayu')}>
            <p style={{ cursor: 'pointer' }} className="fw-semibold">Supplier Kayu :</p>
          </div>
          <ul>
            {dataSupplierFromDB.map((supplier, index) => {
              if (supplier.category == 'Kayu') {
                return (
                  <div className="d-flex justify-content-between align-items-center">
                    <li style={{ cursor: 'pointer' }} key={index} onClick={() => handleSearchSupplier(supplier.supplierName, 'Kayu')}>{supplier.supplierName}</li>
                  </div>
                )
              }

            })}
          </ul>

          <div className="d-flex justify-content-between align-items-center" onClick={() => handleSearchSupplier('Jok', 'Jok')}>
            <p style={{ cursor: 'pointer' }} className="fw-semibold">Supplier Jok :</p>
          </div>
          <ul>
            {dataSupplierFromDB.map((supplier, index) => {
              if (supplier.category == 'Jok') {
                return (
                  <div className="d-flex justify-content-between align-items-center">
                    <li style={{ cursor: 'pointer' }} key={index} onClick={() => handleSearchSupplier(supplier.supplierName, 'Jok')}>{supplier.supplierName}</li>
                  </div>
                )
              }

            })}
          </ul>

          <div className="d-flex justify-content-between align-items-center" onClick={() => handleSearchSupplier('Rotan', 'Rotan')}>
            <p style={{ cursor: 'pointer' }} className="fw-semibold">Supplier Rotan :</p>
          </div>
          <ul>
            {dataSupplierFromDB.map((supplier, index) => {
              if (supplier.category == 'Rotan') {
                return (
                  <div className="d-flex justify-content-between align-items-center">
                    <li style={{ cursor: 'pointer' }} key={index} onClick={() => handleSearchSupplier(supplier.supplierName, 'Rotan')}>{supplier.supplierName}</li>
                  </div>
                )
              }

            })}
          </ul>

          <div className="d-flex justify-content-between align-items-center" onClick={() => handleSearchSupplier('Marmer', 'Marmer')}>
            <p style={{ cursor: 'pointer' }} className="fw-semibold">Supplier Marmer &amp; Kaca :</p>
          </div>
          <ul>
            {dataSupplierFromDB.map((supplier, index) => {
              if (supplier.category == 'Marmer') {
                return (
                  <div className="d-flex justify-content-between align-items-center">
                    <li style={{ cursor: 'pointer' }} key={index} onClick={() => handleSearchSupplier(supplier.supplierName, 'Marmer')}>{supplier.supplierName}</li>
                  </div>
                )
              }

            })}
          </ul>

          <div className="d-flex justify-content-between align-items-center" onClick={() => handleSearchSupplier('Fiber', 'Fiber')}>
            <p style={{ cursor: 'pointer' }} className="fw-semibold">Supplier Fiber :</p>
          </div>
          <ul>
            {dataSupplierFromDB.map((supplier, index) => {
              if (supplier.category == 'Fiber') {
                return (
                  <div className="d-flex justify-content-between align-items-center">
                    <li style={{ cursor: 'pointer' }} key={index} onClick={() => handleSearchSupplier(supplier.supplierName, 'Fiber')}>{supplier.supplierName}</li>
                  </div>
                )
              }

            })}
          </ul>

          <div className="d-flex justify-content-between align-items-center" onClick={() => handleSearchSupplier('Veneer', 'Veneer')}>
            <p style={{ cursor: 'pointer' }} className="fw-semibold">Supplier Veneer :</p>
          </div>
          <ul>
            {dataSupplierFromDB.map((supplier, index) => {
              if (supplier.category == 'Veneer') {
                return (
                  <div className="d-flex justify-content-between align-items-center">
                    <li style={{ cursor: 'pointer' }} key={index} onClick={() => handleSearchSupplier(supplier.supplierName, 'Veneer')}>{supplier.supplierName}</li>
                  </div>
                )
              }

            })}
          </ul>

          <div className="d-flex justify-content-between align-items-center" onClick={() => handleSearchSupplier('Finishing', 'Finishing')}>
            <p style={{ cursor: 'pointer' }} className="fw-semibold">Supplier Finishing :</p>
          </div>
          <ul>
            {dataSupplierFromDB.map((supplier, index) => {
              if (supplier.category == 'Finishing') {
                return (
                  <div className="d-flex justify-content-between align-items-center">
                    <li style={{ cursor: 'pointer' }} key={index} onClick={() => handleSearchSupplier(supplier.supplierName, 'Finishing')}>{supplier.supplierName}</li>
                  </div>
                )
              }

            })}
          </ul>

          <div className="d-flex justify-content-between align-items-center" onClick={() => handleSearchSupplier('Hardware', 'Hardware')}>
            <p style={{ cursor: 'pointer' }} className="fw-semibold">Supplier Hardware :</p>
          </div>
          <ul>
            {dataSupplierFromDB.map((supplier, index) => {
              if (supplier.category == 'Hardware') {
                return (
                  <div className="d-flex justify-content-between align-items-center">
                    <li style={{ cursor: 'pointer' }} key={index} onClick={() => handleSearchSupplier(supplier.supplierName, 'Hardware')}>{supplier.supplierName}</li>
                  </div>
                )
              }

            })}
          </ul>

          <div className="d-flex justify-content-between align-items-center" onClick={() => handleSearchSupplier('Barang Jadi', 'Barang Jadi')}>
            <p style={{ cursor: 'pointer' }} className="fw-semibold">Supplier Barang Jadi :</p>
          </div>
          <ul>
            {dataSupplierFromDB.map((supplier, index) => {
              if (supplier.category == 'BarangJadi') {
                return (
                  <div className="d-flex justify-content-between align-items-center">
                    <li style={{ cursor: 'pointer' }} key={index} onClick={() => handleSearchSupplier(supplier.supplierName, 'BarangJadi')}>{supplier.supplierName}</li>
                  </div>
                )
              }

            })}
          </ul>
        </Modal>
        {/* End Modal */}

      </Container >

      {/* print detail spk */}
      < div id="tercetak" >
        <h4 className='text-center' style={{ backgroundColor: "yellow" }}>SPK Pengrajin Karya Logam Furniture</h4>
        <div className="SPK mb-1" style={{ display: searchSupplier !== '' && !slug ? 'none' : '' }}>

          <div>
            <div className={isMobile ? '' : 'd-flex justify-content-between'}>

              <div className='p-2'>
                <table>
                  <tbody>
                    <tr>
                      <td><h6 style={{ marginRight: '10px' }}>Pengrajin</h6></td>
                      <td><h6>: {dataSPKFromDB.length > 0 ? dataSPKFromDB[0].pengrajin : ''}</h6></td>
                    </tr>
                    <tr>
                      <td><h6 style={{ marginRight: '10px' }}>Tanggal Cetak</h6></td>
                      <td><h6>: {dataSPKFromDB.length > 0 ? new Date(dataSPKFromDB[0].tanggalCetak).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</h6></td>
                    </tr>
                    <tr>
                      <td><h6 style={{ marginRight: '10px' }}>Code</h6></td>
                      <td><h6>: {dataSPKFromDB.length > 0 ? dataSPKFromDB[0].code : ''}</h6></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className='p-2'>
                <table>
                  <tbody>
                    <tr>
                      <td><h6 style={{ marginRight: '10px' }}>Total</h6></td>
                      <td><h6>: Rp. {totalData.toLocaleString('id-ID')}</h6></td>
                    </tr>
                    <tr>
                      <td><h6 style={{ marginRight: '10px' }}>DP</h6></td>
                      <td><h6>: Rp. {totalDataPayment.toLocaleString('id-ID')}</h6></td>
                    </tr>
                    <tr>
                      <td><h6 style={{ marginRight: '10px' }}>Kekurangan</h6></td>
                      <td><h6>: Rp. {(totalData - totalDataPayment).toLocaleString('id-ID')}</h6></td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>

            <div className='p-2 overflow-auto'>
              <table>
                <thead>
                  <tr>
                    <th className='tableStyle text-center'>No</th>
                    <th className='tableStyle text-center'>Gambar</th>
                    <th className='tableStyle text-center'>Keterangan</th>
                    <th className='tableStyle text-center'>Harga</th>
                    <th className='tableStyle text-center'>Qty</th>
                    <th className='tableStyle text-center'>Total</th>
                    <th className='tableStyle text-center'>Deadline</th>
                  </tr>
                </thead>
                <tbody>

                  {dataSPKproductFromDB.map((product, index) => (
                    <tr key={index} class="no-page-break-inside">
                      <td className='tableStyle text-center'>{index + 1}</td>
                      <td className='tableStyle text-center'>
                        <img style={{ width: "100px" }} src={getImageUrl(product.image)} />
                      </td>
                      <td className='tableStyle text-center' style={{ whiteSpace: 'pre-line' }}><span className='fw-semibold text-muted'>{product.namaBarang}</span><hr/>{product.keterangan}</td>
                      <td className='tableStyle text-center'>Rp. {Number(product.harga).toLocaleString('id-ID')}</td>
                      <td className='tableStyle text-center'>{product.qty}</td>
                      <td className='tableStyle text-center'>Rp. {Number(product.harga * product.qty).toLocaleString('id-ID')}</td>
                      <td className='tableStyle text-center'>{new Date(product.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                    </tr>
                  ))}

                  {/* {dataSPKpaymentFromDB.map((payment, index) => (
                    <tr key={index}>
                      <td className='tableStyle text-center' colSpan="5">{payment.detail}</td>
                      <td className='tableStyle text-center' colSpan="2">Rp. {Number(payment.jumlah).toLocaleString('id-ID')}</td>
                    </tr>
                  ))} */}


                </tbody>
              </table>
              <table>
                <tbody class="no-page-break-inside">
                  {dataSPKpaymentFromDB.map((payment, index) => (
                    <tr key={index}>
                      <td className='tableStyle text-center' colSpan="5">{payment.detail}</td>
                      <td className='tableStyle text-center' colSpan="2">Rp. {Number(payment.jumlah).toLocaleString('id-ID')}</td>
                    </tr>
                  ))}


                </tbody>
              </table>
            </div>
          </div>


        </div>

      </div >


      <CostingPopup
        product={costingProduk}
        onClose={() => setCostingProduk(null)}
        onEdit={(p) => { setCostingProduk(null); bukaEditProdukSPK(p); }}
        onQuote={(qid) => navigate(`/quote/${qid}`)}
        isMobile={isMobile}
        dark={globalTheme === 'dark'}
      />
    </>
  );
};

export default Spk;

// Popup view-only: gambar besar + costing semua kategori (budget vs real) + harga jual & margin.
// Ubah angka lewat Edit item SPK atau Quote — sengaja tidak bisa diedit di sini.
const rpC = (n) => 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID');
function CostingPopup({ product, onClose, onEdit, onQuote, isMobile, dark }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const idProduct = product && product.idProduct;
  useEffect(() => {
    if (!idProduct) return;
    let batal = false;
    setData(null); setErr('');
    fetch(`${getApiBaseUrl()}/spkproduct/costing/${encodeURIComponent(idProduct)}`)
      .then((r) => r.json().then((j) => (r.ok ? j : Promise.reject(new Error(j.message || 'Gagal')))))
      .then((j) => { if (!batal) setData(j); })
      .catch((e) => { if (!batal) setErr(e.message); });
    return () => { batal = true; };
  }, [idProduct]);

  const muted = dark ? 'rgba(255,255,255,0.6)' : '#64748b';
  const garis = dark ? 'rgba(255,255,255,0.12)' : '#e2e8f0';
  const panel = dark ? 'rgba(255,255,255,0.05)' : '#f1f5f9';
  const img = (product && product.image) || (data && data.image);
  const marginUnit = data ? data.harga - data.hppUnit : 0;
  const pct = data && data.harga > 0 ? (marginUnit / data.harga) * 100 : 0;
  const warnaMargin = pct >= 25 ? '#16a34a' : pct >= 15 ? '#d97706' : '#dc2626';
  const stat = (label, nilai, sub, warna) => (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11.5, color: muted }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 15, color: warna }}>{nilai}</div>
      {sub && <div style={{ fontSize: 11, color: muted }}>{sub}</div>}
    </div>
  );

  return (
    <Modal open={!!product} onCancel={onClose} footer={null} centered={!isMobile} width={isMobile ? '100%' : 620}
      style={isMobile ? { top: 8, maxWidth: 'calc(100vw - 16px)', margin: '0 auto' } : undefined}
      title={<span style={{ overflowWrap: 'anywhere' }}>{(data && data.namaBarang) || (product && product.namaBarang) || 'Costing produk'}</span>}>
      {product && (
        <div>
          {img && (
            <Image src={getImageUrl(img)} width="100%" style={{ maxHeight: isMobile ? 300 : 360, objectFit: 'contain', borderRadius: 10, background: panel }} />
          )}
          {data && (
            <div style={{ fontSize: 12.5, color: muted, margin: '8px 0 10px' }}>
              {data.kodeInvoice || '-'}{data.buyer ? ` · ${data.buyer}` : ''} · Qty {data.qty}
            </div>
          )}
          {err && <div style={{ color: '#dc2626', padding: 8 }}>{err}</div>}
          {!data && !err && <Skeleton active paragraph={{ rows: 4 }} />}
          {data && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10, background: panel, borderRadius: 10, padding: 12 }}>
                {stat('Harga jual / unit', rpC(data.harga), `Total ${rpC(data.harga * data.qty)}`)}
                {stat('HPP / unit', rpC(data.hppUnit), data.budgetUnit !== data.hppUnit ? `Budget ${rpC(data.budgetUnit)}` : 'sesuai budget')}
                {stat('Margin / unit', rpC(marginUnit), `${pct.toFixed(1)}%`, warnaMargin)}
                {stat('Total margin', rpC(marginUnit * data.qty), `× ${data.qty} unit`, warnaMargin)}
              </div>

              <div style={{ marginTop: 12, fontSize: 13 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0 12px', fontSize: 11.5, color: muted, padding: '0 2px 4px', borderBottom: `1px solid ${garis}` }}>
                  <span>Kategori</span><span style={{ textAlign: 'right' }}>Budget</span><span style={{ textAlign: 'right', minWidth: 92 }}>Real</span>
                </div>
                {data.categories.length === 0 && <div style={{ padding: 10, color: muted, textAlign: 'center' }}>Belum ada costing.</div>}
                {data.categories.map((c) => {
                  const selisih = c.real - c.estimasi;
                  const aktif = c.category === product.category;
                  return (
                    <div key={c.category} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0 12px', alignItems: 'center', padding: '7px 4px', borderBottom: `1px solid ${garis}`, background: aktif ? budgetWarna.bg : undefined, borderRadius: aktif ? 6 : 0 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600 }}>{labelKategori(c.category)}{aktif && <span style={{ fontSize: 11, color: budgetWarna.teks, marginLeft: 6 }}>• SPK ini</span>}</div>
                        <div style={{ fontSize: 11, color: muted, overflowWrap: 'anywhere' }}>
                          {c.source === 'spk' ? `SPK${c.supplier ? ' ' + c.supplier : ''}` : c.source === 'tenaga' ? `borong tenaga${c.supplier ? ' ' + c.supplier : ''}` : 'masih estimasi'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', color: budgetWarna.teks }}>{c.estimasi > 0 ? rpC(c.estimasi) : '-'}</div>
                      <div style={{ textAlign: 'right', minWidth: 92 }}>
                        <div style={{ fontWeight: 600 }}>{rpC(c.real)}</div>
                        {c.estimasi > 0 && selisih !== 0 && (
                          <div style={{ fontSize: 11, fontWeight: 600, color: selisih > 0 ? '#dc2626' : '#16a34a' }}>{selisih > 0 ? '▲' : '▼'} {rpC(Math.abs(selisih))}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0 12px', padding: '8px 4px', fontWeight: 700 }}>
                  <span>Total / unit</span>
                  <span style={{ textAlign: 'right', color: budgetWarna.teks }}>{rpC(data.budgetUnit)}</span>
                  <span style={{ textAlign: 'right', minWidth: 92 }}>{rpC(data.hppUnit)}</span>
                </div>
              </div>

              <div style={{ fontSize: 11.5, color: muted, marginTop: 4 }}>
                Harga rekomendasi 30%: <b>{rpC(data.hppUnit / 0.7)}</b> · Real = harga SPK kalau sudah ada, selain itu estimasi. View only — ubah lewat Edit SPK atau Quote.
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <Button size="large" style={{ flex: 1 }} onClick={() => onEdit(product)}>Edit item SPK</Button>
                {data.fromQuoteId && <Button size="large" style={{ flex: 1 }} onClick={() => onQuote(data.fromQuoteId)}>Buka Quote</Button>}
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}

// Budget (estimasi project = budget costing Quote) — warna ungu supaya beda dari harga SPK.
const budgetWarna = { teks: '#7c3aed', bg: 'rgba(124, 58, 237, 0.10)', border: 'rgba(124, 58, 237, 0.45)' };

function BudgetBadge({ budget, harga, dariQuote }) {
  const b = Number(budget) || 0;
  if (b <= 0) return null;
  const h = Number(harga) || 0;
  const selisih = h > 0 ? h - b : 0;
  return (
    <div
      title={dariQuote ? 'Budget costing dari Quote' : 'Estimasi di Invoice (order lama tanpa Quote)'}
      style={{ marginTop: 6, padding: '3px 8px', borderRadius: 8, fontSize: 12, lineHeight: 1.35, whiteSpace: 'nowrap', color: budgetWarna.teks, background: budgetWarna.bg, border: `1px dashed ${budgetWarna.border}` }}
    >
      Budget Rp. {b.toLocaleString('id-ID')}
      {selisih !== 0 && (
        <div style={{ fontWeight: 600, color: selisih > 0 ? '#dc2626' : '#16a34a' }}>
          {selisih > 0 ? '▲ lebih' : '▼ hemat'} Rp. {Math.abs(selisih).toLocaleString('id-ID')}
        </div>
      )}
    </div>
  );
}


