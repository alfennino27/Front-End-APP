import { Col, Row, Modal, Button, Container, Dropdown, Form } from 'react-bootstrap';
import '../Pekerjaan/pekerjaan.css';
import { MdFilterList, MdOutlineAssignment, MdOutlineLocationOn } from 'react-icons/md';
import { MdAssignment } from "react-icons/md";
import { Link } from 'react-router-dom';
import dataPekerjaan from '../../assets/data/datapekerjaan';
import { FaSearch } from "react-icons/fa";
import { FaRegFilePdf } from "react-icons/fa6";
import { FaFilePdf } from "react-icons/fa6";
import React, { useRef, useEffect, useState } from 'react';
import { MdFormatListBulletedAdd } from "react-icons/md";
import { getApiBaseUrl } from '../../Config/APIurl';
import { useParams, useNavigate } from 'react-router-dom';
import { Skeleton, Spin, Popover, Radio, DatePicker, Divider, Space, Modal as AntModal, Statistic } from 'antd';
import { IoSearch } from 'react-icons/io5';
import { useTheme } from '../../ThemeContext';
import { getImageUrl } from '../../Utils/image';
import { TbTruckDelivery } from 'react-icons/tb';

//tes
const ListPekerjaan = () => {
  const baseUrl = getApiBaseUrl();
  const { slug } = useParams();
  const [showCompleted, setShowCompleted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isIconBlue, setIsIconBlue] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [Projects, setProjects] = useState([]);
  const [ProjectsCopy, setProjectsCopy] = useState([]);
  const [dataSupplierFromDB, setDataSupplierFromDB] = useState([]);
  const [showSupplier, setShowSupplier] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const [showAddLabel, setShowAddLabel] = useState(false);
  const [searchSupplier, setSearchSupplier] = useState('');

  const [masterDataFalse, setMasterDataFalse] = useState([]);
  const [masterDataTrue, setMasterDataTrue] = useState([]);
  const [filteredData, setFilteredData] = useState([]);


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

  const [sortOrder, setSortOrder] = useState('oldest');
  const [selectedMonth, setSelectedMonth] = useState(null);

  // Delivery Tracker
  const [deliveryView, setDeliveryView] = useState('all'); // 'all' | 'thisWeek' | 'nextWeek' | 'weekAfterNext' | 'overdue'
  const [deliveryData, setDeliveryData] = useState(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [showPelunasanModal, setShowPelunasanModal] = useState(false);
  const [userAccess, setUserAccess] = useState([]);

  const [cetakLabel, setCetakLabel] = useState([]);
  const [tipeLabel, setTipeLabel] = useState('Pengiriman');
  const [pdfSupplierCategory, setPdfSupplierCategory] = useState('Besi');
  const [pdfSupplierName, setPdfSupplierName] = useState('');
  const [pdfTargetKirimFilter, setPdfTargetKirimFilter] = useState('semua'); // 'semua' | 'thisWeek' | 'nextWeek' | 'weekAfterNext'

  const handleSearchClick = () => {
    setShowSearch(!showSearch);
    setIsIconBlue(!isIconBlue);
  };



  const handleSearchSupplier = (supplierName, category) => {
    localStorage.setItem('searchSupplierLocalStorage', supplierName);
    localStorage.setItem('searchSupplierCategoryLocalStorage', category);
    setShowSupplier(false);
    setSearchSupplier(supplierName);
  };

  const handleStopSearchSupplier = () => {
    setShowSupplier(false);
    localStorage.removeItem('searchSupplierLocalStorage');
    localStorage.removeItem('searchSupplierCategoryLocalStorage');
    setSearchSupplier('');
  };

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



  useEffect(() => {
    const fetchAllProjects = async () => {
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

        // default filteredData sesuai showCompleted saat ini
        setFilteredData(dataFalse);
      } catch (err) {
        console.error('Error fetching projects:', err);
      }
    };

    fetchAllProjects();
  }, []);

  useEffect(() => {
    const searchSupplier = localStorage.getItem('searchSupplierLocalStorage') || '';
    const searchSupplierCategory = localStorage.getItem('searchSupplierCategoryLocalStorage') || '';

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

    setFilteredData(data);
  }, [showCompleted, masterDataFalse, masterDataTrue, searchSupplier]);






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

    // Ambil data project terbaru dari server supaya perubahan (mis. alamat) langsung nampil tanpa reload
    try {
      const res = await fetch(`${baseUrl}/projects/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showCompleted })
      });
      const freshData = await res.json();

      if (showCompleted) {
        setMasterDataTrue(freshData);
      } else {
        setMasterDataFalse(freshData);
      }
      setProjectsCopy([...freshData]);
    } catch (err) {
      console.error('Error refetching projects for label:', err);
      setProjectsCopy([...Projects]);
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

  useEffect(() => {
    const currentMasterData = showCompleted ? masterDataTrue : masterDataFalse;

    const filtered = currentMasterData.filter(item =>
      (item.NamaBarang?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (item.Buyer?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );

    setFilteredData(filtered);
  }, [searchTerm, showCompleted, masterDataFalse, masterDataTrue]);





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
        style={{ marginLeft: "100px", cursor: spkIds.length > 0 ? 'pointer' : 'default' }}
        onClick={(e) => handleClick(e, spkIds)}
      >
        SPK : {status}
      </span>
    );
  }

  useEffect(() => {
    setProjectsCopy(
      Projects.filter((item) =>
        (item.NamaBarang && item.NamaBarang.toLowerCase().includes(searchProduct.toLowerCase())) ||
        (item.Buyer && item.Buyer.toLowerCase().includes(searchProduct.toLowerCase()))
      )
    );
  }, [searchProduct]);

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
      quantity: qtyProject,
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
          const dateStr = p.TargetKirim || p.Deadline;
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
        setVisibleCount(prev => Math.min(prev + 50, filteredData.length));
      }
    };

    scrollableEl.addEventListener("scroll", handleScroll);
    return () => scrollableEl.removeEventListener("scroll", handleScroll);
  }, [filteredData.length]);



  const handleSortChange = (value) => {
    setSortOrder(value);
    console.log("Sort set to:", value);
  };

  const handleMonthChange = (date, dateString) => {
    // Jika user menghapus pilihan bulan, dateString akan kosong ""
    setSelectedMonth(dateString || null);
    console.log("Filter Month set to:", dateString);
  };


  const content = (
    <div style={{ minWidth: '220px' }}>
      <div style={{ marginBottom: '10px' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Sort By Date</p>
        <Radio.Group
          onChange={(e) => handleSortChange(e.target.value)}
          defaultValue="oldest"
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
            <Radio value="all">Semua</Radio>
            <Radio value="thisWeek">
              Minggu Ini {deliveryData ? <span style={{ color: '#888', fontSize: 11 }}>({deliveryData.thisWeek?.length || 0})</span> : null}
            </Radio>
            <Radio value="nextWeek">
              Minggu Depan {deliveryData ? <span style={{ color: '#888', fontSize: 11 }}>({deliveryData.nextWeek?.length || 0})</span> : null}
            </Radio>
            <Radio value="weekAfterNext">
              2 Minggu Lagi {deliveryData ? <span style={{ color: '#888', fontSize: 11 }}>({deliveryData.weekAfterNext?.length || 0})</span> : null}
            </Radio>
            <Radio value="overdue">
              Overdue {deliveryData?.overdue?.length > 0 ? <span style={{ color: '#e74c3c', fontSize: 11, fontWeight: 600 }}>({deliveryData.overdue.length})</span> : <span style={{ color: '#888', fontSize: 11 }}>(0)</span>}
            </Radio>
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

      {/* Delivery Tracker Banner — only for users with Delivery Tracker access */}
      {deliveryView !== 'all' && hasAccess('Delivery Tracker') && deliveryData && (
        <div
          onClick={() => setShowPelunasanModal(true)}
          style={{
            position: 'sticky', top: '48px', zIndex: 2,
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
          <Button variant="primary" onClick={handleStopSearchSupplier}>Refresh</Button>
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
                <Form.Label>Target Kirim</Form.Label>
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
              <p>{index + 1}. {item.productName} ({item.quantity})</p>
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
      <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showAddLabel} onHide={() => setShowAddLabel(false)}>
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
                      onClick={() => { setIdProject(item.id); setSelectedProduct(item.NamaBarang); setProductProject(item.NamaBarang); setBuyerProject(item.Buyer); setTeleponProject(''); setAlamatProject(item.Lokasi); setImageProject(item.image1); setUkuranProject(item.UkuranQC); setFinishingProject(item.FinishingQC); setJenisMarmerProject(item.JenisMarmerQC); setJenisKainProject(item.JenisKainQC); setQtyProject(item.Qty); }}
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
          <label className='mt-2'>Quantity :</label>
          <input className="form-control mb-1" type='number' defaultValue={qtyProject} onChange={(e) => setQtyProject(e.target.value)} onWheel={(e) => e.target.blur()}></input>
        </Modal.Body>
        <Modal.Footer >
          <Button variant="primary" onClick={submitLabel}>Submit</Button>
        </Modal.Footer>
      </Modal>
      {/* End Modal */}


      {filteredData.length === 0 ? (
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



      {filteredData
        // 0. Filter Delivery View (if active)
        .filter(p => {
          if (!deliveryProjectIds) return true;
          return deliveryProjectIds.has(p.id);
        })

        // 1. Filter Bulan (berdasarkan submitDate)
        .filter(p => {
          if (!selectedMonth) return true;
          // Ubah seconds ke format YYYY-MM untuk dicocokkan
          const date = new Date(p.submitDate.value._seconds * 1000);
          const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          return yearMonth === selectedMonth;
        })

        // 2. Sortir (berdasarkan submitDate._seconds)
        .sort((a, b) => {
          const secA = a.submitDate?.value?._seconds || 0;
          const secB = b.submitDate?.value?._seconds || 0;
          return sortOrder === 'newest' ? secB - secA : secA - secB;
        })

        // 3. Slice Logic
        .slice(0, showCompleted ? visibleCount : undefined)

        // 4. Map ke UI
        .map((project, index) => (
          <Row key={index} id={project.id}>
            <Col>
              <Link to={`/project/${project.id}`}>
                <div className={`listPekerjaan d-flex position-relative mb-1 shadow tema-${globalTheme} ${project.id === slug ? `selected` : ""}`} style={{ backgroundImage: project.id === slug ? (globalTheme === "light" ? "linear-gradient(to right, #cbcbcb, #e7e7e7)" : "linear-gradient(to right, #404040, #252525)") : (globalTheme === "light" ? "linear-gradient(to right, #ffffff, #e7e7e7)" : "linear-gradient(to right, #151515, #252525)"), border: project.id === slug ? (globalTheme === "light" ? "2px solid #c1c1c1" : "2px solid #8e8e8e") : (globalTheme === "light" ? "2px solid rgb(163, 163, 163)" : "2px solid #7a7a7a") }}>
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
                  <div>
                    <h5 style={{ color: globalTheme == "light" ? "black" : "white" }}>{project.NamaBarang}</h5>
                    <h6 style={{ color: globalTheme == "light" ? "#292929" : "#c0c0c0" }}>{project.Buyer}</h6>
                    <small>
                      <div className="progress" role="progressbar" style={{ backgroundColor: '#4c4c4c', height: "15px" }}>
                        <div className="progress-bar" style={{ width: `${project.Percentage}%`, background: globalTheme == "light" ? `linear-gradient(to left, #007EFF, #14C2F6)` : `linear-gradient(to left, #003797, #00c6ff)` }}>{project.Percentage}%</div>
                      </div>
                    </small>
                  </div>
                  <small className="position-absolute bottom-0 start-0 p-3" style={{ display: searchSupplier ? "block" : "none" }}>
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
                  </small>

                  <small className="position-absolute bottom-0 start-0 p-3" style={{ display: searchSupplier && (user.uid === 'fYpdHwXRDLhj5XGxM5FZIAvxp9E2' || user.uid === 'w4M5JJjgGQeHFbS2nkyoCfUBE532' || user.uid === '4WGPaHicKWYr0Ny84IUh8xb9Bo62' || user.uid === 'ANGTwgX8KxXQy5Ww3cwpLrG0tFT2' || user.uid === 'gwsOqUgVXSPyWFMMHr4bJteBoYs1' || user.uid === '6D4XVa5BSSOl1ugUlkDlTea2COX2' || user.uid === 'MjOCxfNdGtf0q12BPzj0EYAcVJD3' || user.uid === 'knydS6fIBdOwHS37dDm3ZDNQXKQ2' || user.uid === 'Q3LWLX4D7Ye8hMnQVF9fa7SZb953') ? "block" : "none" }}>
                    {renderStatus(project.id)}
                  </small>
                  <small className="position-absolute bottom-0 end-0 p-3" style={{ color: globalTheme == "light" ? "black" : "white" }}>Deadline : {new Date(project.Deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</small>
                </div>
              </Link>
            </Col>
          </Row>
        ))}

    </Col>
  );
};




export default ListPekerjaan;
