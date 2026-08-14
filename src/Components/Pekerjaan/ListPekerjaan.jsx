import { Col, Row, Modal, Button, Container, Dropdown, Form } from 'react-bootstrap';
import '../Pekerjaan/pekerjaan.css';
import { MdFilterList, MdOutlineAssignment, MdOutlineLocationOn } from 'react-icons/md';
import { MdAssignment } from "react-icons/md";
import { Link } from 'react-router-dom';
import dataPekerjaan from '../../assets/data/datapekerjaan';
import { FaSearch } from "react-icons/fa";
import { FaRegFilePdf } from "react-icons/fa6";
import { FaFilePdf } from "react-icons/fa6";
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MdFormatListBulletedAdd } from "react-icons/md";
import { getApiBaseUrl } from '../../Config/APIurl';
import { useParams, useNavigate } from 'react-router-dom';
import { Skeleton, Spin, Popover, Radio, DatePicker, Divider, Space, Modal as AntModal, Statistic } from 'antd';
import { IoSearch } from 'react-icons/io5';
import { useTheme } from '../../ThemeContext';
import { getImageUrl } from '../../Utils/image';
import { TbTruckDelivery } from 'react-icons/tb';
import dayjs from 'dayjs';

//tes

// Deadline sering kosong/tidak valid di data lama → jangan tampilkan "Invalid Date".
const formatDeadline = (v) => {
  if (!v) return '-';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

// Hanya uid ini yang boleh melihat status SPK di kartu daftar project.
const BOLEH_LIHAT_STATUS_SPK = [
  'fYpdHwXRDLhj5XGxM5FZIAvxp9E2', 'w4M5JJjgGQeHFbS2nkyoCfUBE532', '4WGPaHicKWYr0Ny84IUh8xb9Bo62',
  'ANGTwgX8KxXQy5Ww3cwpLrG0tFT2', 'gwsOqUgVXSPyWFMMHr4bJteBoYs1', '6D4XVa5BSSOl1ugUlkDlTea2COX2',
  'MjOCxfNdGtf0q12BPzj0EYAcVJD3', 'knydS6fIBdOwHS37dDm3ZDNQXKQ2', 'Q3LWLX4D7Ye8hMnQVF9fa7SZb953',
];

// Filter daftar project disimpan supaya tidak hilang saat user buka detail lalu back.
// Di mobile ListPekerjaan di-unmount total waktu buka detail (lihat Pekerjaan.jsx),
// jadi tanpa ini semua filter balik ke awal dan user harus memfilter ulang.
const FILTER_STORAGE_KEY = 'projectListFilters';

const loadSavedFilters = () => {
  try {
    const raw = localStorage.getItem(FILTER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) || {}) : {};
  } catch {
    return {};
  }
};

const ListPekerjaan = () => {
  const baseUrl = getApiBaseUrl();
  const { slug } = useParams();
  const [savedFilters] = useState(loadSavedFilters); // dibaca sekali saat mount
  const [showCompleted, setShowCompleted] = useState(!!savedFilters.showCompleted);
  const [searchTerm, setSearchTerm] = useState(savedFilters.searchTerm || '');
  // kolom search dibuka kembali kalau kata kuncinya masih aktif — biar kelihatan & mudah dihapus
  const [showSearch, setShowSearch] = useState(!!savedFilters.searchTerm);
  const [isIconBlue, setIsIconBlue] = useState(!!savedFilters.searchTerm);
  const [showModal, setShowModal] = useState(false);
  const [Projects, setProjects] = useState([]);
  const [ProjectsCopy, setProjectsCopy] = useState([]);
  const [dataSupplierFromDB, setDataSupplierFromDB] = useState([]);
  const [showSupplier, setShowSupplier] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const [showAddLabel, setShowAddLabel] = useState(false);
  // fallback ke key lama supaya sesi yang sudah punya filter tersimpan tetap kebaca
  const [searchSupplier, setSearchSupplier] = useState(
    savedFilters.searchSupplier ?? (localStorage.getItem('searchSupplierLocalStorage') || '')
  );
  const [searchSupplierCategory, setSearchSupplierCategory] = useState(
    savedFilters.searchSupplierCategory ?? (localStorage.getItem('searchSupplierCategoryLocalStorage') || '')
  );

  const [masterDataFalse, setMasterDataFalse] = useState([]);
  const [masterDataTrue, setMasterDataTrue] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false); // beda "masih loading" vs "hasil filter kosong"


  const isMobile = window.innerWidth <= 768;

  const [searchProduct, setSearchProduct] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('Select Product');
  const [idProject, setIdProject] = useState('');
  const [productProject, setProductProject] = useState('');
  const [buyerProject, setBuyerProject] = useState('');
  const [teleponProject, setTeleponProject] = useState('');
  const [alamatProject, setAlamatProject] = useState('');
  const [imageProject, setImageProject] = useState('');
  const [ukuranProject, setUkuranProject] = useState('');
  const [finishingProject, setFinishingProject] = useState('');
  const [jenisMarmerProject, setJenisMarmerProject] = useState('');
  const [jenisKainProject, setJenisKainProject] = useState('');
  const [qtyProject, setQtyProject] = useState('');
  const [jumlahPrint, setJumlahPrint] = useState(''); // berapa lembar label mau dicetak (bebas)
  const [labelProducts, setLabelProducts] = useState([]); // produk dari invoice yg BELUM LUNAS (sumber dropdown label)

  const [sortOrder, setSortOrder] = useState(savedFilters.sortOrder || 'oldest');
  const [selectedMonth, setSelectedMonth] = useState(savedFilters.selectedMonth || null);

  // Delivery Tracker
  const [deliveryView, setDeliveryView] = useState(savedFilters.deliveryView || 'all'); // 'all' | 'thisWeek' | 'nextWeek' | 'weekAfterNext' | 'overdue'
  const [deliveryData, setDeliveryData] = useState(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [showPelunasanModal, setShowPelunasanModal] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false); // panel filter versi mobile
  const [showAllMonths, setShowAllMonths] = useState(false);     // data lama punya puluhan bulan
  const [userAccess, setUserAccess] = useState([]);

  const [cetakLabel, setCetakLabel] = useState([]);
  const [tipeLabel, setTipeLabel] = useState('Pengiriman');
  const [pdfSupplierCategory, setPdfSupplierCategory] = useState('Besi');
  const [pdfSupplierName, setPdfSupplierName] = useState('');
  const [pdfTargetKirimFilter, setPdfTargetKirimFilter] = useState('semua'); // 'semua' | 'thisWeek' | 'nextWeek' | 'weekAfterNext'
  const [pdfFilterBasis, setPdfFilterBasis] = useState('customer'); // 'customer' (TargetKirim) | 'supplier' (DeadlineSupplier<cat>)

  const handleSearchClick = () => {
    // menutup kolom search = hapus kata kuncinya, biar tidak ada filter tersembunyi
    if (showSearch) setSearchTerm('');
    setShowSearch(!showSearch);
    setIsIconBlue(!isIconBlue);
  };



  const handleSearchSupplier = (supplierName, category) => {
    setShowSupplier(false);
    setSearchSupplier(supplierName);
    setSearchSupplierCategory(category);
  };

  const handleStopSearchSupplier = () => {
    setShowSupplier(false);
    setSearchSupplier('');
    setSearchSupplierCategory('');
  };

  // Reset semua filter sekaligus (tombol "Reset" di baris chip)
  const handleResetAllFilters = () => {
    setSearchSupplier('');
    setSearchSupplierCategory('');
    setSearchTerm('');
    setShowSearch(false);
    setIsIconBlue(false);
    setSelectedMonth(null);
    setDeliveryView('all');
    setSortOrder('oldest');
    setShowCompleted(false);
  };

  // Simpan filter tiap kali berubah. Key lama tetap ditulis karena masih dipakai
  // checkSPKProduct() dan dibersihkan saat login.
  useEffect(() => {
    try {
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({
        showCompleted, searchTerm, searchSupplier, searchSupplierCategory,
        sortOrder, selectedMonth, deliveryView,
      }));
    } catch { /* storage penuh / private mode — filter cukup jalan di sesi ini */ }

    if (searchSupplier) {
      localStorage.setItem('searchSupplierLocalStorage', searchSupplier);
      localStorage.setItem('searchSupplierCategoryLocalStorage', searchSupplierCategory);
    } else {
      localStorage.removeItem('searchSupplierLocalStorage');
      localStorage.removeItem('searchSupplierCategoryLocalStorage');
    }
  }, [showCompleted, searchTerm, searchSupplier, searchSupplierCategory, sortOrder, selectedMonth, deliveryView]);

  // useEffect(() => {
  //   const fetchProjectsFromServer = async () => {
  //     const supplier = localStorage.getItem('searchSupplierLocalStorage') || '';
  //     const category = localStorage.getItem('searchSupplierCategoryLocalStorage') || '';

  //     setSearchSupplier(supplier); // tetap set biar sinkron dengan state

  //     try {
  //       const res = await fetch(`${baseUrl}/projects/list`, {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json'
  //         },
  //         body: JSON.stringify({
  //           showCompleted,
  //           searchSupplier: supplier,
  //           searchSupplierCategory: category
  //         })
  //       });

  //       if (!res.ok) throw new Error('Gagal ambil data project');

  //       const data = await res.json();
  //       setProjects(data);
  //       setFilteredData(data);
  //     } catch (err) {
  //       console.error('Error fetching projects:', err);
  //     }
  //   };

  //   fetchProjectsFromServer();
  // }, [showCompleted, searchSupplier]);



  // filteredData tidak diset di sini — dia diturunkan (useMemo) dari masterData* +
  // tab yang sedang aktif. Kalau di-set di sini, refetch saat tab Completed aktif
  // akan melempar user balik ke daftar Ongoing.
  const fetchAllProjects = useCallback(async () => {
    try {
      // fetch showCompleted = false
      const resFalse = await fetch(`${baseUrl}/projects/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showCompleted: false })
      });
      const dataFalse = await resFalse.json();
      console.log("barang ongoing :", dataFalse);
      setMasterDataFalse(dataFalse);

      // fetch showCompleted = true
      const resTrue = await fetch(`${baseUrl}/projects/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showCompleted: true })
      });
      const dataTrue = await resTrue.json();
      setMasterDataTrue(dataTrue);

      setProjects(dataFalse);
      setDataLoaded(true);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchAllProjects();
  }, [fetchAllProjects]);

  // Status project diubah dari modal Information di panel detail (Ongoing <-> Completed).
  // Item harus pindah daftar, dan field lain (nama, deadline, percentage) bisa ikut
  // berubah di modal yang sama — jadi ambil ulang kedua daftar, bukan tambal manual.
  useEffect(() => {
    const onProjectUpdated = () => { fetchAllProjects(); };
    window.addEventListener('projectStatusChanged', onProjectUpdated);
    return () => window.removeEventListener('projectStatusChanged', onProjectUpdated);
  }, [fetchAllProjects]);

  // Status kategori diubah dari panel detail → tambal data di sini juga supaya
  // badge di kartu langsung berubah tanpa reload. masterData* yang ditambal
  // (bukan filteredData) karena filteredData diturunkan darinya.
  useEffect(() => {
    const onStatusChanged = (e) => {
      const { projectId, category, status } = e.detail || {};
      if (!projectId || !category) return;
      const tambal = (arr) => {
        if (!Array.isArray(arr)) return arr;
        let berubah = false;
        const next = arr.map((p) => {
          if (p.id !== projectId) return p;
          berubah = true;
          return { ...p, [`CategoryStatus${category}`]: status };
        });
        return berubah ? next : arr; // jangan bikin array baru kalau tidak perlu
      };
      setMasterDataFalse((prev) => tambal(prev));
      setMasterDataTrue((prev) => tambal(prev));
    };

    window.addEventListener('categoryStatusChanged', onStatusChanged);
    return () => window.removeEventListener('categoryStatusChanged', onStatusChanged);
  }, []);

  // SATU sumber kebenaran untuk daftar yang tampil. Dulu ada dua useEffect yang
  // sama-sama menulis filteredData (satu untuk supplier, satu untuk search term),
  // dan yang belakangan menimpa filter supplier tiap data selesai di-fetch —
  // itu sebabnya filter "hilang" begitu halaman di-mount ulang (back dari detail).
  const filteredData = React.useMemo(() => {
    let data = showCompleted ? masterDataTrue : masterDataFalse;

    if (searchSupplier) {
      const categoryKey = `Supplier${searchSupplierCategory}`;
      const kategoriUmum = [
        'Stainless', 'Besi', 'Kayu', 'Jok', 'Rotan',
        'Marmer', 'Kaca', 'Kain', 'Fiber', 'Veneer',
        'Finishing', 'Hardware', 'BarangJadi'
      ];

      data = data.filter(p => {
        if (kategoriUmum.includes(searchSupplier)) {
          return p[categoryKey] && p[categoryKey] !== '';
        } else {
          return p[categoryKey] === searchSupplier;
        }
      });
    }

    const keyword = searchTerm.trim().toLowerCase();
    if (keyword) {
      data = data.filter(item =>
        (item.NamaBarang?.toLowerCase() || '').includes(keyword) ||
        (item.Buyer?.toLowerCase() || '').includes(keyword)
      );
    }

    return data;
  }, [showCompleted, masterDataFalse, masterDataTrue, searchSupplier, searchSupplierCategory, searchTerm]);






  const supplierData = async () => {
    try {
      const res = await fetch(`${baseUrl}/supplier/list`);
      const data = await res.json();
      setDataSupplierFromDB(data);
    } catch (error) {
      console.error('Gagal mengambil data supplier:', error);
    }
  };


  const handleShowSupplier = () => {
    supplierData();
    setShowSupplier(true);
  };

  const handleShowLabel = async () => {
    setShowLabel(true);
    setSearchProduct('');
    supplierData();
    setSelectedProduct('Select Product');
    setIdProject('');
    setProductProject('');
    setBuyerProject('');
    setTeleponProject('');
    setAlamatProject('');
    setImageProject('');
    setUkuranProject('');
    setFinishingProject('');
    setJenisMarmerProject('');
    setJenisKainProject('');
    setQtyProject('');
    setJumlahPrint('');

    // Sumber dropdown label = semua produk dari invoice yang BELUM LUNAS
    // (termasuk produk yang statusnya sudah Completed). Diambil fresh dari server
    // supaya perubahan (mis. alamat) & status lunas langsung nampil tanpa reload.
    try {
      const res = await fetch(`${baseUrl}/projects/label-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const freshData = await res.json();
      const arr = Array.isArray(freshData) ? freshData : [];
      setLabelProducts(arr);
      setProjectsCopy(arr);
    } catch (err) {
      console.error('Error fetching label products:', err);
      setLabelProducts([]);
      setProjectsCopy([]);
    }
  };

  // useEffect(() => {
  //   setFilteredData(
  //     Projects.filter((item) =>
  //       item.NamaBarang.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //       item.Buyer.toLowerCase().includes(searchTerm.toLowerCase())
  //     )
  //   );
  // }, [searchTerm]);

  // (filter search term sudah ikut dihitung di useMemo filteredData di atas)





  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;

  useEffect(() => {
    const cekLogin = () => {
      if (user == null) {
        window.location.replace('/login');
      }
      setTimeout(() => {
        const targetElement = document.getElementById(localStorage.getItem('lastSlug'));
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      }, 500);
    };

    cekLogin();
  }, [filteredData]);



  // Fetch delivery tracker data
  const fetchDeliveryTracker = async () => {
    setDeliveryLoading(true);
    try {
      const res = await fetch(`${baseUrl}/projects/delivery-tracker`);
      const data = await res.json();
      setDeliveryData(data);
    } catch (e) { console.error('Failed to fetch delivery tracker:', e); }
    setDeliveryLoading(false);
  };

  // Fetch user access for "Delivery Tracker" permission
  const fetchUserAccess = async () => {
    try {
      const res = await fetch(`${baseUrl}/useraccess/get`);
      const data = await res.json();
      setUserAccess(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchDeliveryTracker();
    fetchUserAccess();
  }, []);

  const hasAccess = (menu) => userAccess.some(a => a.uid === user?.uid && a.menu === menu && a.value === true);

  // Get project IDs for active delivery view (used to filter the list)
  const deliveryProjectIds = React.useMemo(() => {
    if (deliveryView === 'all' || !deliveryData) return null;
    const items = deliveryView === 'thisWeek' ? deliveryData.thisWeek
      : deliveryView === 'nextWeek' ? deliveryData.nextWeek
      : deliveryView === 'weekAfterNext' ? deliveryData.weekAfterNext
      : deliveryData.overdue;
    return new Set((items || []).map(i => i.id));
  }, [deliveryView, deliveryData]);

  // Daftar yang benar-benar tampil: filteredData + filter target kirim + filter
  // bulan + urutan. Dipakai juga untuk hitungan di panel filter mobile.
  const displayedData = React.useMemo(() => {
    return filteredData
      .filter(p => (deliveryProjectIds ? deliveryProjectIds.has(p.id) : true))
      .filter(p => {
        if (!selectedMonth) return true;
        const sec = p.submitDate?.value?._seconds;
        if (!sec) return false;
        const date = new Date(sec * 1000);
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return yearMonth === selectedMonth;
      })
      .sort((a, b) => {
        const secA = a.submitDate?.value?._seconds || 0;
        const secB = b.submitDate?.value?._seconds || 0;
        return sortOrder === 'newest' ? secB - secA : secA - secB;
      });
  }, [filteredData, deliveryProjectIds, selectedMonth, sortOrder]);

  const [dataAllSPKproductFromDB, setDataAllSPKproductFromDB] = useState([]);
  const [dataAllSPKFromDB, setDataAllSPKFromDB] = useState([]);

  useEffect(() => {
    getDataAllSPKproduct();
    getDataAllSPK();
  }, []);

  const getDataAllSPKproduct = async () => {
    try {
      const res = await fetch(`${baseUrl}/spkproduct/all/get`);
      const data = await res.json();
      setDataAllSPKproductFromDB(data);
    } catch (error) {
      console.error('Gagal mengambil data SPKproduct:', error);
    }
  };


  const getDataAllSPK = async () => {
    try {
      const res = await fetch(`${baseUrl}/spk/get`);
      const data = await res.json();
      setDataAllSPKFromDB(data);
    } catch (error) {
      console.error('Gagal mengambil data SPK:', error);
    }
  };


  const checkSPKProduct = (projectId) => {
    const supplierSearchCategory = localStorage.getItem('searchSupplierCategoryLocalStorage');
    const filteredProducts = dataAllSPKproductFromDB.filter(product => product.idProduct === projectId && product.category === supplierSearchCategory);

    if (filteredProducts.length === 1) {
      const product = filteredProducts[0];
      const spk = dataAllSPKFromDB.find(spk => spk.id === product.idSPK);
      return { status: spk ? spk.status : 'Status not found', found: true, spkIds: spk ? [spk.id] : [] };
    } else if (filteredProducts.length > 1) {
      const spkIds = filteredProducts.map(product => product.idSPK);
      return { status: 'Double', found: true, spkIds: spkIds };
    } else {
      return { status: 'No', found: false, spkIds: [] };
    }
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'Acc':
      case 'Acc Harga':
      case 'Acc Keterangan':
        return 'text-success';
      case 'Draft':
        return 'text-danger';
      case 'Revisi':
        return 'text-primary';
      default:
        return '';
    }
  }

  const handleClick = (e, spkIds) => {
    // e.preventDefault();
    // e.stopPropagation();
    if (spkIds.length > 0) {
      spkIds.forEach(spkId => {
        window.open(`/spk/${spkId}`, '_blank');
      });
    }
  }

  const renderStatus = (projectId) => {
    const { status, found, spkIds } = checkSPKProduct(projectId);
    if (!found) return null;

    return (
      <span
        className={`${getStatusClass(status)} fw-semibold`}
        style={{ cursor: spkIds.length > 0 ? 'pointer' : 'default' }}
        onClick={(e) => handleClick(e, spkIds)}
      >
        SPK : {status}
      </span>
    );
  }

  useEffect(() => {
    setProjectsCopy(
      labelProducts.filter((item) =>
        (item.NamaBarang && item.NamaBarang.toLowerCase().includes(searchProduct.toLowerCase())) ||
        (item.Buyer && item.Buyer.toLowerCase().includes(searchProduct.toLowerCase()))
      )
    );
  }, [searchProduct, labelProducts]);

  const submitLabel = () => {
    const newLabel = {
      buyer: buyerProject,
      telephone: teleponProject,
      address: alamatProject,
      image: imageProject,
      productName: productProject,
      ukuranQC: ukuranProject,
      finishingQC: finishingProject,
      jenisMarmerQC: jenisMarmerProject,
      jenisKainQC: jenisKainProject,
      quantity: qtyProject,       // Quantity Product (dari invoice) — tampil di label
      jumlahPrint: jumlahPrint,   // berapa lembar label dicetak
    };
    setCetakLabel([...cetakLabel, newLabel]);
    // Reset form fields after submission if needed
    setSelectedProduct('Select Product');
    setIdProject('');
    setProductProject('');
    setBuyerProject('');
    setTeleponProject('');
    setAlamatProject('');
    setImageProject('');
    setUkuranProject('');
    setFinishingProject('');
    setJenisMarmerProject('');
    setJenisKainProject('');
    setQtyProject('');
    setJumlahPrint('');

    setShowAddLabel(false);
    setShowLabel(true);
  };

  const handlePrint = () => {
    if (tipeLabel === 'PDF Supplier') {
      // Helper: get week boundaries
      const getWeekBounds = (offsetWeeks = 0) => {
        const now = new Date();
        const day = now.getDay();
        const mondayOffset = day === 0 ? -6 : 1 - day;
        const start = new Date(now);
        start.setDate(now.getDate() + mondayOffset + offsetWeeks * 7);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      };

      const supplierKey = `Supplier${pdfSupplierCategory}`;
      let filtered = pdfSupplierName === ''
        ? masterDataFalse.filter(p => p[supplierKey] && p[supplierKey] !== '').sort((a, b) => (a[supplierKey] || '').localeCompare(b[supplierKey] || ''))
        : masterDataFalse.filter(p => p[supplierKey] === pdfSupplierName);

      if (pdfTargetKirimFilter !== 'semua') {
        // Tiap opsi = 1 minggu penuh (Senin–Minggu): thisWeek offset 0, nextWeek +1, weekAfterNext +2.
        const offset = pdfTargetKirimFilter === 'nextWeek' ? 1 : pdfTargetKirimFilter === 'weekAfterNext' ? 2 : 0;
        const { start, end } = getWeekBounds(offset);
        filtered = filtered.filter(p => {
          // Basis 'supplier' = deadline SPK per item (DeadlineSupplier<cat>); 'customer' = target kirim ke customer.
          const dateStr = pdfFilterBasis === 'supplier'
            ? p[`DeadlineSupplier${pdfSupplierCategory}`]
            : (p.TargetKirim || p.Deadline);
          if (!dateStr) return false;
          const d = new Date(dateStr);
          return d >= start && d <= end;
        });
      }
      sessionStorage.setItem('cetakLabelSupplier', JSON.stringify({
        items: filtered,
        category: pdfSupplierCategory,
        supplier: pdfSupplierName,
      }));
      window.open('/cetakLabelSupplier', '_blank');
      return;
    }
    sessionStorage.setItem('cetakLabel', JSON.stringify(cetakLabel));
    if (tipeLabel == "Pengiriman") {
      window.open(`/cetakLabel`, '_blank');
    } else {
      window.open(`/cetakLabelQC`, '_blank');
    }
  };

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


  const { globalTheme } = useTheme();





  const [visibleCount, setVisibleCount] = useState(50); // jumlah awal item yang ditampilkan

  useEffect(() => {
    const scrollableEl = scrollableElementRef.current;
    if (!scrollableEl) return;

    const handleScroll = () => {
      // cek apakah user sudah scroll mendekati bawah div
      if (scrollableEl.scrollTop + scrollableEl.clientHeight >= scrollableEl.scrollHeight - 100) {
        setVisibleCount(prev => Math.min(prev + 50, displayedData.length));
      }
    };

    scrollableEl.addEventListener("scroll", handleScroll);
    return () => scrollableEl.removeEventListener("scroll", handleScroll);
  }, [displayedData.length]);



  const handleSortChange = (value) => {
    setSortOrder(value);
    console.log("Sort set to:", value);
  };

  const handleMonthChange = (date, dateString) => {
    // Jika user menghapus pilihan bulan, dateString akan kosong ""
    setSelectedMonth(dateString || null);
    console.log("Filter Month set to:", dateString);
  };


  // Daftar filter yang sedang aktif → dipakai untuk baris chip di atas daftar.
  const deliveryViewLabel = {
    thisWeek: 'Kirim: Minggu Ini', nextWeek: 'Kirim: Minggu Depan',
    weekAfterNext: 'Kirim: 2 Minggu Lagi', overdue: 'Kirim: Overdue',
  };

  const activeFilters = [];
  if (searchSupplier) {
    activeFilters.push({
      key: 'supplier',
      label: searchSupplier === searchSupplierCategory ? searchSupplier : `${searchSupplier} (${searchSupplierCategory})`,
      onRemove: handleStopSearchSupplier,
    });
  }
  if (searchTerm.trim()) {
    activeFilters.push({
      key: 'search',
      label: `"${searchTerm.trim()}"`,
      onRemove: () => { setSearchTerm(''); setShowSearch(false); setIsIconBlue(false); },
    });
  }
  if (showCompleted) {
    activeFilters.push({ key: 'completed', label: 'Completed', onRemove: () => setShowCompleted(false) });
  }
  if (selectedMonth) {
    activeFilters.push({ key: 'month', label: selectedMonth, onRemove: () => setSelectedMonth(null) });
  }
  if (deliveryView !== 'all') {
    activeFilters.push({
      key: 'delivery',
      label: deliveryViewLabel[deliveryView] || deliveryView,
      onRemove: () => setDeliveryView('all'),
    });
  }
  if (sortOrder !== 'oldest') {
    activeFilters.push({ key: 'sort', label: 'Urut: Terbaru', onRemove: () => setSortOrder('oldest') });
  }

  // Opsi target kirim (dipakai popover desktop & panel filter mobile)
  const deliveryOptions = [
    { value: 'all', label: 'Semua', count: null },
    { value: 'thisWeek', label: 'Minggu Ini', count: deliveryData?.thisWeek?.length || 0 },
    { value: 'nextWeek', label: 'Minggu Depan', count: deliveryData?.nextWeek?.length || 0 },
    { value: 'weekAfterNext', label: '2 Minggu Lagi', count: deliveryData?.weekAfterNext?.length || 0 },
    { value: 'overdue', label: 'Overdue', count: deliveryData?.overdue?.length || 0, danger: true },
  ];

  // filter yang diatur lewat panel ini (untuk mewarnai ikon filter di header)
  const sheetFilterActive = deliveryView !== 'all' || !!selectedMonth || sortOrder !== 'oldest';

  // Bulan yang benar-benar ada datanya → dipakai sebagai chip di panel mobile
  // (lebih enak ditekan di HP daripada kalender popup yang menutupi panel).
  const NAMA_BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const labelBulan = (ym) => {
    const [y, m] = (ym || '').split('-');
    return `${NAMA_BULAN[Number(m) - 1] || m} ${y}`;
  };
  const monthOptions = React.useMemo(() => {
    const set = new Set();
    [...masterDataFalse, ...masterDataTrue].forEach((p) => {
      const sec = p.submitDate?.value?._seconds;
      if (!sec) return;
      const d = new Date(sec * 1000);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    if (selectedMonth) set.add(selectedMonth); // jangan hilang kalau data belum termuat
    return Array.from(set).sort().reverse();
  }, [masterDataFalse, masterDataTrue, selectedMonth]);

  const content = (
    <div style={{ minWidth: '220px' }}>
      <div style={{ marginBottom: '10px' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Sort By Date</p>
        <Radio.Group
          onChange={(e) => handleSortChange(e.target.value)}
          value={sortOrder}
        >
          <Space direction="vertical">
            <Radio value="oldest">Terlama</Radio>
            <Radio value="newest">Terbaru</Radio>
          </Space>
        </Radio.Group>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      <div>
        <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Filter Month</p>
        <DatePicker
          onChange={handleMonthChange}
          picker="month"
          style={{ width: '100%' }}
          placeholder="Pilih bulan"
          value={selectedMonth ? dayjs(selectedMonth, 'YYYY-MM') : null}
        />
      </div>

      <Divider style={{ margin: '12px 0' }} />

      <div>
        <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>
          <TbTruckDelivery style={{ marginRight: 4 }} /> Delivery View
        </p>
        <Radio.Group
          onChange={(e) => { setDeliveryView(e.target.value); setShowCompleted(false); }}
          value={deliveryView}
        >
          <Space direction="vertical">
            {deliveryOptions.map((o) => (
              <Radio key={o.value} value={o.value}>
                {o.label}{' '}
                {o.count !== null && deliveryData && (
                  <span style={{ fontSize: 11, fontWeight: o.danger && o.count > 0 ? 600 : 400, color: o.danger && o.count > 0 ? '#e74c3c' : '#888' }}>({o.count})</span>
                )}
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      </div>
    </div>
  );

  return (
    <Col md={4} className="lowonganPekerjaan overflow-auto" ref={scrollableElementRef}>

      {/* buat nutupin shadow */}
      {/* <div style={{ position: "absolute", zIndex: "2", height: "60px", top: "65px", left: "0px", backgroundColor: "white", width: "34.5%" }}></div> */}
      <h4
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: "sticky",
          ...(isMobile ? { top: 0 } : { top: 0 }),
          // backgroundColor: "white",
          color: globalTheme == "light" ? "#000000" : "#ffffff",
          zIndex: 3,
          padding: "10px",
          cursor: "pointer",
          backgroundColor: isScrolled
            ? (globalTheme === "light" ? "#f3f3f3" : "#151515")
            : "transparent",
          borderRadius: "30px",
          border: isScrolled ? (globalTheme === "light" ? "1px solid #5f5f5f" : "1px solid white") : "1px solid transparent",
          transition: "background-color 1s ease, border 1s ease",
        }}
      >
        {isMobile ? (
          <>
            <span onClick={() => setShowCompleted(!showCompleted)} style={{ display: showSearch ? "none" : "block", fontSize: "18px" }}>  {searchSupplier ? (showCompleted ? `${searchSupplier} (Comp)` : `${searchSupplier} (Ong)`) : (showCompleted ? "Completed Projects" : "Ongoing Projects")}</span>
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ backgroundColor: globalTheme == "light" ? "#ffffff" : "#262626", color: globalTheme == "light" ? "black" : "white", border: "2px solid 7a7a7a", fontSize: "12px", borderRadius: "20px", padding: "5px", display: showSearch ? "block" : "none" }} />
            <div>
              <span style={{ fontSize: "25px", color: isIconBlue ? 'blue' : 'inherit' }} onClick={handleSearchClick}><IoSearch size={18} /></span>
              <span style={{ fontSize: "25px", marginLeft: "15px", color: searchSupplier != '' ? 'blue' : 'inherit' }} onClick={handleShowSupplier}><MdOutlineAssignment size={18} /></span>
              {/* Filter (target kirim, bulan, urutan) — di mobile dibuka sebagai panel bawah */}
              <span
                style={{ fontSize: "25px", marginLeft: "15px", color: sheetFilterActive ? 'blue' : 'inherit' }}
                onClick={() => setShowFilterSheet(true)}
              ><MdFilterList size={18} /></span>
              {/* <span style={{ fontSize: "25px", marginLeft: "15px" }} onClick={handleShowModal}><MdFormatListBulletedAdd size={18} /></span> */}
            </div>
          </>
        ) : (
          <>
            <span onClick={() => setShowCompleted(!showCompleted)} style={{ display: showSearch ? "none" : "block" }}>{searchSupplier ? (showCompleted ? `${searchSupplier} (Comp)` : `${searchSupplier} (Ong)`) : (showCompleted ? "Completed Projects" : "Ongoing Projects")}</span>
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ backgroundColor: globalTheme == "light" ? "#ffffff" : "#262626", color: globalTheme == "light" ? "black" : "white", border: "2px solid 7a7a7a", fontSize: "12px", borderRadius: "20px", padding: "5px", display: showSearch ? "block" : "none" }} />
            <div>
              <span style={{ fontSize: "25px", color: isIconBlue ? 'blue' : 'inherit' }} onClick={handleSearchClick}><IoSearch className='button-effect' /></span>
              <span style={{ fontSize: "25px", marginLeft: "5px", color: searchSupplier != '' ? 'blue' : 'inherit' }} onClick={handleShowSupplier} ><MdOutlineAssignment className='button-effect' /></span>
              <span style={{ fontSize: "20px", marginLeft: "8px" }} onClick={handleShowLabel} ><FaRegFilePdf className='button-effect' /></span>
              {/* <span style={{ fontSize: "25px", marginLeft: "5px" }} onClick={handleShowModal}><MdFormatListBulletedAdd /></span> */}

              <Popover content={content} trigger="click" placement="bottomRight">
                <span
                  style={{ fontSize: "25px", marginLeft: "5px", cursor: "pointer" }}
                // onClick={handleSortClick} // Pastikan kamu membuat fungsi handleSortClick
                >
                  <MdFilterList className='button-effect' />
                </span>
              </Popover>

            </div>
          </>
        )}


      </h4>

      {/* Baris filter aktif — filter bertahan saat back dari detail, jadi harus
          kelihatan jelas dan bisa dihapus satu-satu (✕) atau sekaligus (Reset). */}
      {activeFilters.length > 0 && (
        <div
          style={{
            position: 'sticky', top: '48px', zIndex: 2,
            display: 'flex', alignItems: 'center', gap: '6px',
            margin: '0 8px 8px 8px', padding: '6px 8px',
            borderRadius: '10px',
            overflowX: 'auto', whiteSpace: 'nowrap',
            background: globalTheme === 'light' ? '#f3f3f3' : '#1c1c1c',
            border: `1px solid ${globalTheme === 'light' ? '#d9d9d9' : '#3a3a3a'}`,
          }}
        >
          {activeFilters.map((f) => (
            <span
              key={f.key}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0,
                padding: '4px 6px 4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
                background: globalTheme === 'light' ? '#e3edff' : '#1a2744',
                color: globalTheme === 'light' ? '#013175' : '#6fa8ff',
                border: `1px solid ${globalTheme === 'light' ? '#b8d4fe' : '#2d4a7a'}`,
              }}
            >
              {f.label}
              <span
                onClick={f.onRemove}
                role="button"
                aria-label={`Hapus filter ${f.label}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '20px', height: '20px', borderRadius: '50%', cursor: 'pointer',
                  fontSize: '13px', lineHeight: 1,
                  background: globalTheme === 'light' ? '#ffffff' : '#0f1a2e',
                }}
              >×</span>
            </span>
          ))}
          <span
            onClick={handleResetAllFilters}
            role="button"
            style={{
              flexShrink: 0, marginLeft: 'auto', padding: '5px 12px', borderRadius: '999px',
              fontSize: '12px', fontWeight: 700, cursor: 'pointer',
              color: '#c0392b',
              background: globalTheme === 'light' ? '#ffffff' : '#2a1414',
              border: '1px solid #e6b0aa',
            }}
          >Reset</span>
        </div>
      )}

      {/* Delivery Tracker Banner — only for users with Delivery Tracker access */}
      {deliveryView !== 'all' && hasAccess('Delivery Tracker') && deliveryData && (
        <div
          onClick={() => setShowPelunasanModal(true)}
          style={{
            // baris chip pasti tampil kalau banner ini tampil (deliveryView ≠ all) → geser ke bawahnya
            position: 'sticky', top: '96px', zIndex: 2,
            margin: '0 8px 8px 8px', padding: '8px 12px',
            borderRadius: '10px', cursor: 'pointer',
            background: globalTheme === 'light' ? '#eef4ff' : '#1a2744',
            border: `1px solid ${globalTheme === 'light' ? '#b8d4fe' : '#2d4a7a'}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}
        >
          <div>
            <small style={{ color: globalTheme === 'light' ? '#013175' : '#6fa8ff', fontWeight: 600 }}>
              <TbTruckDelivery style={{ marginRight: 4 }} />
              {deliveryView === 'thisWeek' ? 'Pelunasan Minggu Ini' : deliveryView === 'nextWeek' ? 'Pelunasan Minggu Depan' : deliveryView === 'weekAfterNext' ? 'Pelunasan 2 Minggu Lagi' : 'Pelunasan Overdue'}
            </small>
          </div>
          <div style={{ fontWeight: 700, fontSize: '14px', color: globalTheme === 'light' ? '#013175' : '#6fa8ff' }}>
            Rp {(deliveryData.totals?.[deliveryView] || 0).toLocaleString('id-ID')}
          </div>
        </div>
      )}

      {/* Panel Filter (mobile) — bottom sheet. Popover desktop terlalu sempit &
          tap target-nya kecil di HP, jadi di mobile pakai panel bawah dengan
          baris yang lebar dan hitungan hasil langsung di tombolnya. */}
      {isMobile && showFilterSheet && (() => {
        const panelBg = globalTheme === 'light' ? '#ffffff' : '#1c1c1c';
        const panelText = globalTheme === 'light' ? '#1a1a1a' : '#f0f0f0';
        const panelBorder = globalTheme === 'light' ? '#e2e2e2' : '#3a3a3a';
        const panelMuted = globalTheme === 'light' ? '#666' : '#aaa';
        const rowStyle = (active, danger) => ({
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 10, width: '100%', minHeight: 48, padding: '12px 14px',
          borderRadius: 12, marginBottom: 8, cursor: 'pointer', textAlign: 'left',
          fontSize: 15, fontWeight: active ? 700 : 500,
          color: active ? (globalTheme === 'light' ? '#013175' : '#6fa8ff') : (danger ? '#e74c3c' : panelText),
          background: active ? (globalTheme === 'light' ? '#e3edff' : '#1a2744') : (globalTheme === 'light' ? '#f6f7f9' : '#262626'),
          border: `1px solid ${active ? (globalTheme === 'light' ? '#b8d4fe' : '#2d4a7a') : panelBorder}`,
        });
        const sectionTitle = { fontSize: 13, fontWeight: 700, color: panelMuted, margin: '4px 0 10px' };
        // default 12 bulan terakhir; bulan yang sedang dipilih selalu ikut tampil
        const visibleMonths = showAllMonths
          ? monthOptions
          : monthOptions.slice(0, 12).concat(
            selectedMonth && !monthOptions.slice(0, 12).includes(selectedMonth) ? [selectedMonth] : []);

        return (
          <>
            <div
              onClick={() => setShowFilterSheet(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1200 }}
            />
            <div style={{
              position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1201,
              background: panelBg, color: panelText,
              borderRadius: '18px 18px 0 0', boxShadow: '0 -6px 24px rgba(0,0,0,0.3)',
              maxHeight: '85vh', display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ width: 42, height: 5, borderRadius: 3, background: panelBorder, margin: '10px auto 4px' }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 16px 10px', borderBottom: `1px solid ${panelBorder}` }}>
                <span style={{ fontSize: 17, fontWeight: 700 }}>Filter</span>
                <span
                  onClick={() => { setSortOrder('oldest'); setSelectedMonth(null); setDeliveryView('all'); }}
                  style={{ fontSize: 14, fontWeight: 700, color: sheetFilterActive ? '#c0392b' : panelMuted, cursor: 'pointer', padding: '4px 8px' }}
                >Reset</span>
              </div>

              <div style={{ padding: '14px 16px', overflowY: 'auto', flex: 1 }}>
                <div style={sectionTitle}>
                  <TbTruckDelivery style={{ marginRight: 5, verticalAlign: -2, fontSize: 15 }} />
                  TARGET KIRIM
                </div>
                {deliveryOptions.map((o) => {
                  const active = deliveryView === o.value;
                  return (
                    <div key={o.value} style={rowStyle(active, o.danger && o.count > 0)}
                      onClick={() => { setDeliveryView(o.value); if (o.value !== 'all') setShowCompleted(false); }}>
                      <span>{o.label}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {o.count !== null && (
                          <span style={{ fontSize: 13, fontWeight: 600, color: o.danger && o.count > 0 ? '#e74c3c' : panelMuted }}>{o.count}</span>
                        )}
                        {active && <span style={{ fontSize: 16 }}>✓</span>}
                      </span>
                    </div>
                  );
                })}

                <div style={{ ...sectionTitle, marginTop: 18 }}>BULAN MASUK</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[null, ...visibleMonths].map((m) => {
                    const active = (selectedMonth || null) === m;
                    return (
                      <div key={m || 'all'}
                        onClick={() => setSelectedMonth(m)}
                        style={{
                          padding: '10px 14px', minHeight: 42, display: 'flex', alignItems: 'center',
                          borderRadius: 999, fontSize: 14, cursor: 'pointer',
                          fontWeight: active ? 700 : 500,
                          color: active ? (globalTheme === 'light' ? '#013175' : '#6fa8ff') : panelText,
                          background: active ? (globalTheme === 'light' ? '#e3edff' : '#1a2744') : (globalTheme === 'light' ? '#f6f7f9' : '#262626'),
                          border: `1px solid ${active ? (globalTheme === 'light' ? '#b8d4fe' : '#2d4a7a') : panelBorder}`,
                        }}>
                        {m ? labelBulan(m) : 'Semua'}
                      </div>
                    );
                  })}
                  {monthOptions.length > visibleMonths.length && (
                    <div onClick={() => setShowAllMonths(true)}
                      style={{
                        padding: '10px 14px', minHeight: 42, display: 'flex', alignItems: 'center',
                        borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                        color: panelMuted, background: 'transparent', border: `1px dashed ${panelBorder}`,
                      }}>
                      + {monthOptions.length - visibleMonths.length} bulan lain
                    </div>
                  )}
                </div>

                <div style={{ ...sectionTitle, marginTop: 18 }}>URUTKAN</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['oldest', 'Terlama'], ['newest', 'Terbaru']].map(([v, l]) => (
                    <div key={v} style={{ ...rowStyle(sortOrder === v), flex: 1, justifyContent: 'center', marginBottom: 0 }}
                      onClick={() => setSortOrder(v)}>{l}</div>
                  ))}
                </div>
              </div>

              <div style={{ padding: '12px 16px calc(12px + env(safe-area-inset-bottom))', borderTop: `1px solid ${panelBorder}` }}>
                <Button variant="primary" style={{ width: '100%', height: 46, fontWeight: 700, borderRadius: 12 }}
                  onClick={() => setShowFilterSheet(false)}>
                  Lihat {displayedData.length} Project
                </Button>
              </div>
            </div>
          </>
        );
      })()}

      {/* Pelunasan Detail Modal */}
      <AntModal
        title={
          <span style={{ fontWeight: 700 }}>
            <TbTruckDelivery style={{ marginRight: 6 }} />
            Detail Pelunasan — {deliveryView === 'thisWeek' ? 'Minggu Ini' : deliveryView === 'nextWeek' ? 'Minggu Depan' : deliveryView === 'weekAfterNext' ? '2 Minggu Lagi' : 'Overdue'}
          </span>
        }
        open={showPelunasanModal}
        onCancel={() => setShowPelunasanModal(false)}
        footer={null}
        width={700}
      >
        {deliveryData && (() => {
          const items = deliveryView === 'thisWeek' ? deliveryData.thisWeek
            : deliveryView === 'nextWeek' ? deliveryData.nextWeek
            : deliveryView === 'weekAfterNext' ? deliveryData.weekAfterNext
            : deliveryData.overdue;
          if (!items || items.length === 0) return <p style={{ textAlign: 'center', color: '#999' }}>Tidak ada data.</p>;

          // Group by invoice to avoid duplicate rows
          const seen = new Set();
          const invoiceRows = [];
          for (const item of items) {
            if (!item.idInvoice || seen.has(item.idInvoice)) continue;
            seen.add(item.idInvoice);
            const pel = deliveryData.pelunasanMap?.[item.idInvoice];
            if (pel) invoiceRows.push({ ...pel, Buyer: item.Buyer, NamaBarang: item.NamaBarang, Deadline: item.Deadline, TargetKirim: item.TargetKirim, delayDays: item.delayDays || 0, overdueDays: item.overdueDays });
          }

          // Also list items without invoice
          const noInvoice = items.filter(i => !i.idInvoice);

          return (
            <div>
              <div style={{ display: 'flex', gap: 20, marginBottom: 16, padding: '12px 16px', background: '#f0f5ff', borderRadius: 8, border: '1px solid #d0e0ff' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Total Pelunasan</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#013175' }}>
                    Rp {(deliveryData.totals?.[deliveryView] || 0).toLocaleString('id-ID')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Jumlah Item</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#333' }}>
                    {items.length}
                  </div>
                </div>
              </div>

              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px' }}>Customer</th>
                    <th style={{ padding: '6px 8px' }}>Kode Invoice</th>
                    <th style={{ padding: '6px 8px' }}>Deadline</th>
                    <th style={{ padding: '6px 8px' }}>Target Kirim</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Nilai Order</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>DP Masuk</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Kekurangan</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceRows.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '6px 8px' }}>
                        {row.customer || row.Buyer}
                        {row.overdueDays > 0 && <span style={{ color: '#e74c3c', fontSize: 10, marginLeft: 4 }}>⚠ {row.overdueDays}h overdue</span>}
                      </td>
                      <td style={{ padding: '6px 8px', color: '#013175' }}>{row.kodeInvoice}</td>
                      <td style={{ padding: '6px 8px', color: '#666' }}>
                        {row.Deadline ? new Date(row.Deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        {row.TargetKirim
                          ? <span>
                              {new Date(row.TargetKirim).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              {row.delayDays > 0 && <span style={{ color: '#e74c3c', fontSize: 10, marginLeft: 4 }}>+{row.delayDays}h terlambat</span>}
                              {row.delayDays < 0 && <span style={{ color: '#27ae60', fontSize: 10, marginLeft: 4 }}>{Math.abs(row.delayDays)}h lebih awal</span>}
                            </span>
                          : <span style={{ color: '#aaa' }}>-</span>
                        }
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>Rp {row.nilaiOrder?.toLocaleString('id-ID')}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>Rp {row.dpMasuk?.toLocaleString('id-ID')}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: row.kekurangan > 0 ? '#e74c3c' : '#27ae60' }}>
                        Rp {row.kekurangan?.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                  {noInvoice.length > 0 && noInvoice.map((item, i) => (
                    <tr key={`no-inv-${i}`} style={{ borderBottom: '1px solid #eee', color: '#999' }}>
                      <td style={{ padding: '6px 8px' }}>
                        {item.Buyer} — {item.NamaBarang}
                        {item.overdueDays && <span style={{ color: '#e74c3c', fontSize: 10, marginLeft: 4 }}>({item.overdueDays} hari)</span>}
                      </td>
                      <td style={{ padding: '6px 8px', fontStyle: 'italic' }}>Belum ada invoice</td>
                      <td style={{ padding: '6px 8px' }}>{item.Deadline ? new Date(item.Deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}</td>
                      <td colSpan={3} style={{ padding: '6px 8px', textAlign: 'center', fontStyle: 'italic' }}>-</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </AntModal>

      {/* Modal */}
      <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showSupplier} onHide={() => setShowSupplier(false)}>
        <Modal.Header closeButton >
          <Modal.Title>Supplier</Modal.Title>
        </Modal.Header>
        <Modal.Body >
          {/* Your comment form here */}
          <div className="d-flex justify-content-between align-items-center">
            <p className="fw-semibold" style={{ cursor: 'pointer' }} onClick={() => handleSearchSupplier('Stainless', 'Stainless')}>Supplier Stainless :</p>
          </div>
          <ul>
            {dataSupplierFromDB.map((supplier, index) => {
              if (supplier.category == 'Stainless') {
                return (
                  <div className="d-flex justify-content-between align-items-center">
                    <li style={{ cursor: 'pointer' }} key={index} onClick={() => handleSearchSupplier(supplier.supplierName, 'Stainless')}>{supplier.supplierName}</li>
                  </div>
                )
              }

            })}
          </ul>

          <div className="d-flex justify-content-between align-items-center">
            <p className="fw-semibold" style={{ cursor: 'pointer' }} onClick={() => handleSearchSupplier('Besi', 'Besi')}>Supplier Besi :</p>
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

          <div className="d-flex justify-content-between align-items-center">
            <p className="fw-semibold" style={{ cursor: 'pointer' }} onClick={() => handleSearchSupplier('Kayu', 'Kayu')}>Supplier Kayu :</p>
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

          <div className="d-flex justify-content-between align-items-center">
            <p className="fw-semibold" style={{ cursor: 'pointer' }} onClick={() => handleSearchSupplier('Jok', 'Jok')}>Supplier Jok :</p>
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

          <div className="d-flex justify-content-between align-items-center">
            <p className="fw-semibold" style={{ cursor: 'pointer' }} onClick={() => handleSearchSupplier('Rotan', 'Rotan')}>Supplier Rotan :</p>
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

          <div className="d-flex justify-content-between align-items-center">
            <p className="fw-semibold" style={{ cursor: 'pointer' }} onClick={() => handleSearchSupplier('Marmer', 'Marmer')}>Supplier Marmer :</p>
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

          <div className="d-flex justify-content-between align-items-center">
            <p className="fw-semibold" style={{ cursor: 'pointer' }} onClick={() => handleSearchSupplier('Kaca', 'Kaca')}>Supplier Kaca :</p>
          </div>
          <ul>
            {dataSupplierFromDB.map((supplier, index) => {
              if (supplier.category == 'Kaca') {
                return (
                  <div className="d-flex justify-content-between align-items-center">
                    <li style={{ cursor: 'pointer' }} key={index} onClick={() => handleSearchSupplier(supplier.supplierName, 'Kaca')}>{supplier.supplierName}</li>
                  </div>
                )
              }

            })}
          </ul>

          <div className="d-flex justify-content-between align-items-center">
            <p className="fw-semibold" style={{ cursor: 'pointer' }} onClick={() => handleSearchSupplier('Kain', 'Kain')}>Supplier Kain :</p>
          </div>
          <ul>
            {dataSupplierFromDB.map((supplier, index) => {
              if (supplier.category == 'Kain') {
                return (
                  <div className="d-flex justify-content-between align-items-center">
                    <li style={{ cursor: 'pointer' }} key={index} onClick={() => handleSearchSupplier(supplier.supplierName, 'Kain')}>{supplier.supplierName}</li>
                  </div>
                )
              }

            })}
          </ul>

          <div className="d-flex justify-content-between align-items-center">
            <p className="fw-semibold" style={{ cursor: 'pointer' }} onClick={() => handleSearchSupplier('Fiber', 'Fiber')}>Supplier Fiber :</p>
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

          <div className="d-flex justify-content-between align-items-center">
            <p className="fw-semibold" style={{ cursor: 'pointer' }} onClick={() => handleSearchSupplier('Veneer', 'Veneer')}>Supplier Veneer :</p>
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

          <div className="d-flex justify-content-between align-items-center">
            <p className="fw-semibold" style={{ cursor: 'pointer' }} onClick={() => handleSearchSupplier('Finishing', 'Finishing')}>Supplier Finishing :</p>
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

          <div className="d-flex justify-content-between align-items-center">
            <p className="fw-semibold" style={{ cursor: 'pointer' }} onClick={() => handleSearchSupplier('Hardware', 'Hardware')}>Supplier Hardware :</p>
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

          <div className="d-flex justify-content-between align-items-center">
            <p className="fw-semibold" style={{ cursor: 'pointer' }} onClick={() => handleSearchSupplier('BarangJadi', 'BarangJadi')}>Supplier Barang Jadi :</p>
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

        </Modal.Body>
        <Modal.Footer >
          {searchSupplier && (
            <span style={{ marginRight: 'auto', fontSize: 13, fontWeight: 600 }}>
              Filter aktif: {searchSupplier}
            </span>
          )}
          <Button variant="outline-danger" onClick={handleStopSearchSupplier} disabled={!searchSupplier}>Hapus Filter</Button>
          <Button variant="secondary" onClick={() => setShowSupplier(false)}>Tutup</Button>
        </Modal.Footer>
      </Modal>
      {/* End Modal */}




      {/* Modal */}
      <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showLabel} onHide={() => setShowLabel(false)}>
        <Modal.Header closeButton >
          <Modal.Title>Cetak Label</Modal.Title>
        </Modal.Header>
        <Modal.Body >

          <Form.Group controlId="selectPengirimanQC" className="mb-3">
            <Form.Label>Tipe Cetak</Form.Label>
            <Form.Select
              aria-label="Pilih Tipe Cetak"
              value={tipeLabel}
              onChange={(e) => setTipeLabel(e.target.value)}
            >
              <option value="Pengiriman">Pengiriman</option>
              <option value="QC">QC</option>
              <option value="PDF Supplier">PDF Supplier</option>
            </Form.Select>
          </Form.Group>

          {tipeLabel === 'PDF Supplier' && (
            <>
              <Form.Group className="mb-2">
                <Form.Label>Category</Form.Label>
                <Form.Select value={pdfSupplierCategory} onChange={(e) => { setPdfSupplierCategory(e.target.value); setPdfSupplierName(''); }}>
                  {['Stainless','Besi','Kayu','Jok','Rotan','Marmer','Kaca','Kain','Fiber','Veneer','Finishing','Hardware'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Supplier</Form.Label>
                <Form.Select value={pdfSupplierName} onChange={(e) => setPdfSupplierName(e.target.value)}>
                  <option value="">Semua Supplier</option>
                  {dataSupplierFromDB.filter(s => s.category === pdfSupplierCategory).map((s, i) => (
                    <option key={i} value={s.supplierName}>{s.supplierName}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Filter Berdasarkan</Form.Label>
                <Form.Select value={pdfFilterBasis} onChange={(e) => setPdfFilterBasis(e.target.value)}>
                  <option value="customer">Target Kirim Customer</option>
                  <option value="supplier">Target Selesai Supplier</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Periode ({pdfFilterBasis === 'supplier' ? 'Deadline SPK' : 'Target Kirim'})</Form.Label>
                <Form.Select value={pdfTargetKirimFilter} onChange={(e) => setPdfTargetKirimFilter(e.target.value)}>
                  <option value="semua">Semua</option>
                  <option value="thisWeek">Minggu Ini</option>
                  <option value="nextWeek">Minggu Depan</option>
                  <option value="weekAfterNext">2 Minggu Lagi</option>
                </Form.Select>
              </Form.Group>
            </>
          )}

          {cetakLabel.map((item, index) => (
            <div key={index}>
              <p>{index + 1}. {item.productName} (Qty: {item.quantity}, Print: {item.jumlahPrint ?? item.quantity})</p>
            </div>
          ))}

        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <Button variant="danger" onClick={() => setCetakLabel([])}>Reset</Button>
          <div>
            <Button variant="secondary" onClick={handlePrint}>Print</Button>
            <Button variant="primary" style={{ marginLeft: "5px" }} onClick={() => { setShowAddLabel(true); setShowLabel(false); }}>Add Label</Button>
          </div>
        </Modal.Footer>
      </Modal>
      {/* End Modal */}

      {/* Modal */}
      {/* backdrop static + keyboard false: form ini gampang ke-dismiss tidak sengaja
          (klik meleset di luar modal / ESC) dan semua isian ikut hilang. Tutup
          hanya lewat tombol X atau Submit. */}
      <Modal
        className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`}
        show={showAddLabel}
        onHide={() => setShowAddLabel(false)}
        backdrop="static"
        keyboard={false}
        data-tutup-luar="off"
      >
        <Modal.Header closeButton >
          <Modal.Title>Tambah Label</Modal.Title>
        </Modal.Header>
        <Modal.Body >

          <Form.Group controlId="selectPengirimanQC" className="mb-2">
            <Form.Label>Tipe Cetak</Form.Label>
            <Form.Select
              aria-label="Pilih Tipe Cetak"
              value={tipeLabel}
              onChange={(e) => setTipeLabel(e.target.value)}
            >
              <option value="Pengiriman">Pengiriman</option>
              <option value="QC">QC</option>
            </Form.Select>
          </Form.Group>

          <label className='mt-2'>Select Product :</label>
          <input className="form-control mb-1" type='text' placeholder='Search' onChange={(e) => setSearchProduct(e.target.value)}></input>
          <div>
            <Dropdown>
              <Dropdown.Toggle variant={`${globalTheme === 'light' ? 'light' : 'dark'}`} id="dropdown-basic">
                {selectedProduct}
              </Dropdown.Toggle>



              <Dropdown.Menu variant={`${globalTheme === 'light' ? 'light' : 'dark'}`} style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {ProjectsCopy.map((item, index) => {
                  return (
                    <Dropdown.Item
                      key={index}
                      onClick={() => { setIdProject(item.id); setSelectedProduct(item.NamaBarang); setProductProject(item.NamaBarang); setBuyerProject(item.Buyer); setTeleponProject(''); setAlamatProject(item.Lokasi); setImageProject(item.image1); setUkuranProject(item.UkuranQC); setFinishingProject(item.FinishingQC); setJenisMarmerProject(item.JenisMarmerQC); setJenisKainProject(item.JenisKainQC); setQtyProject(item.Qty); setJumlahPrint(item.Qty); }}
                    >
                      <img
                        src={getImageUrl(item.image1)}
                        style={{ width: '30px', marginRight: '10px' }}
                      />
                      {item.NamaBarang}
                    </Dropdown.Item>
                  );
                })}
              </Dropdown.Menu>
            </Dropdown>
          </div>
          <div style={{ display: tipeLabel == "Pengiriman" ? "" : "none" }}>
            <label className='mt-2'>Buyer :</label>
            <input className="form-control mb-1" type='text' defaultValue={buyerProject} onChange={(e) => setBuyerProject(e.target.value)}></input>
            <label className='mt-2'>Telephone :</label>
            <input className="form-control mb-1" type='text' defaultValue={teleponProject} onChange={(e) => setTeleponProject(e.target.value)}></input>
            <label className='mt-2'>Address :</label>
            <input className="form-control mb-1" type='text' defaultValue={alamatProject} onChange={(e) => setAlamatProject(e.target.value)}></input>
            <label className='mt-2'>Product Name :</label>
            <input className="form-control mb-1" type='text' defaultValue={productProject} onChange={(e) => setProductProject(e.target.value)}></input>
          </div>
          <label className='mt-2'>Quantity Product :</label>
          <input className="form-control mb-1" type='number' value={qtyProject} onChange={(e) => setQtyProject(e.target.value)} onWheel={(e) => e.target.blur()}></input>
          <label className='mt-2'>Jumlah Print :</label>
          <input className="form-control mb-1" type='number' value={jumlahPrint} onChange={(e) => setJumlahPrint(e.target.value)} onWheel={(e) => e.target.blur()}></input>
        </Modal.Body>
        <Modal.Footer >
          <Button variant="primary" onClick={submitLabel}>Submit</Button>
        </Modal.Footer>
      </Modal>
      {/* End Modal */}


      {/* Data sudah masuk tapi hasil filter kosong → jangan tampilkan skeleton
          (dulu kelihatan seperti loading yang tidak selesai). */}
      {dataLoaded && displayedData.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: globalTheme === 'light' ? '#666' : '#aaa' }}>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>Tidak ada project yang cocok</div>
          {activeFilters.length > 0 && (
            <Button variant="outline-danger" size="sm" style={{ marginTop: 12 }} onClick={handleResetAllFilters}>
              Reset Filter
            </Button>
          )}
        </div>
      )}

      {!dataLoaded && filteredData.length === 0 ? (
        // Show skeletons while loading
        [...Array(5)].map((_, index) => (
          <Row key={index}>
            <Col>
              <div className="listPekerjaan d-flex position-relative mb-1 shadow" style={{ backgroundImage: globalTheme === "light" ? "linear-gradient(to right, #ffffff, #e7e7e7)" : "linear-gradient(to right, #151515, #252525)", border: globalTheme === "light" ? "2px solid #d2d2d2" : "2px solid #7a7a7a" }}>
                <div className="me-3">
                  <Spin size="large" />
                </div>
                <div style={{ width: '100%', height: '100%' }}>
                  <Skeleton active />
                </div>
              </div>
            </Col>
          </Row>
        ))
      ) : null}



      {/* filter target kirim + bulan + urutan sudah dihitung di displayedData */}
      {displayedData
        .slice(0, showCompleted ? visibleCount : undefined)

        // 4. Map ke UI
        .map((project, index) => (
          <Row key={index} id={project.id}>
            <Col>
              <Link to={`/project/${project.id}`}>
                <div className={`listPekerjaan d-flex flex-column position-relative mb-1 shadow tema-${globalTheme} ${project.id === slug ? `selected` : ""}`} style={{ backgroundImage: project.id === slug ? (globalTheme === "light" ? "linear-gradient(to right, #cbcbcb, #e7e7e7)" : "linear-gradient(to right, #404040, #252525)") : (globalTheme === "light" ? "linear-gradient(to right, #ffffff, #e7e7e7)" : "linear-gradient(to right, #151515, #252525)"), border: project.id === slug ? (globalTheme === "light" ? "2px solid #c1c1c1" : "2px solid #8e8e8e") : (globalTheme === "light" ? "2px solid rgb(163, 163, 163)" : "2px solid #7a7a7a") }}>
                  <div className="d-flex" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                  <div className="me-3">
                    <img src={getImageUrl(project.image1)} alt=""
                      loading="lazy"
                      style={{
                        width: isMobile ? "20vw" : "5vw",
                        height: isMobile ? "20vw" : "5vw",
                        borderRadius: "10px",
                        objectFit: "cover",  // Gambar tidak akan ter-stretch dan terpotong jika terlalu besar
                      }} />
                  </div>
                  {/* minWidth:0 wajib pada flex item: tanpa ini progress bar
                      (width 100%) ikut melar mengikuti judul panjang sehingga
                      jebol keluar kartu di lebar window tertentu. */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h5 style={{ color: globalTheme == "light" ? "black" : "white" }}>{project.NamaBarang}</h5>
                    <h6 style={{ color: globalTheme == "light" ? "#292929" : "#c0c0c0" }}>{project.Buyer}</h6>
                    <small>
                      <div className="progress" role="progressbar" style={{ backgroundColor: '#4c4c4c', height: "15px", width: '100%' }}>
                        <div className="progress-bar" style={{ width: `${Math.min(100, Math.max(0, Number(project.Percentage) || 0))}%`, background: globalTheme == "light" ? `linear-gradient(to left, #007EFF, #14C2F6)` : `linear-gradient(to left, #003797, #00c6ff)` }}>{project.Percentage}%</div>
                      </div>
                    </small>
                  </div>
                </div>

                {/* Baris bawah: status kategori · status SPK · deadline.
                    Dulu ketiganya position-absolute di titik yang sama (bottom-0
                    start-0) sehingga saling menimpa, dan status SPK digeser paksa
                    dengan marginLeft 100px yang meleset di lebar lain. Sekarang
                    satu baris flex — tidak mungkin tumpang tindih lagi. */}
                <div className="d-flex align-items-center flex-wrap" style={{ gap: '2px 12px', fontSize: '0.75rem', lineHeight: 1.4 }}>
                  {searchSupplier && (
                    <span style={{
                      color: {
                        'Belum Proses': 'rgba(255, 0, 0, 0.6)',
                        'Proses': 'rgba(196, 199, 0, 0.8)',
                        'QC Pass': 'rgba(0, 0, 255, 0.6)',
                        'Servis': 'rgba(255, 165, 0, 0.6)',
                        'Selesai': 'rgba(0, 255, 0, 0.6)',
                        'Ready Stock': 'rgba(128, 128, 128, 0.6)',
                      }[project[`CategoryStatus${localStorage.getItem('searchSupplierCategoryLocalStorage')}`]] || 'rgba(0, 0, 0, 0.6)',
                    }} className='fw-semibold'>
                      {project[`CategoryStatus${localStorage.getItem('searchSupplierCategoryLocalStorage')}`]}
                    </span>
                  )}

                  {searchSupplier && BOLEH_LIHAT_STATUS_SPK.includes(user.uid) && renderStatus(project.id)}

                  <span style={{ marginLeft: 'auto', color: globalTheme == "light" ? "black" : "white", whiteSpace: 'nowrap' }}>
                    Deadline : {formatDeadline(project.Deadline)}
                  </span>
                </div>
                </div>
              </Link>
            </Col>
          </Row>
        ))}

    </Col>
  );
};




export default ListPekerjaan;
