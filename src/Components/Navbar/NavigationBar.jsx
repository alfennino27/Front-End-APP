import './navbar.css';
import '../Pekerjaan/table.css';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
// import { useState } from 'react';
import { Col, Container, Modal, Dropdown, Toast, Button } from 'react-bootstrap';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { NavDropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Offcanvas from 'react-bootstrap/Offcanvas';
import { Link, useLocation } from 'react-router-dom';
import { getApiBaseUrl } from '../../Config/APIurl';
import { IoIosNotifications, IoMdNotificationsOutline } from "react-icons/io";
import { MdChair, MdDashboard, MdNotificationImportant, MdNotificationsActive, MdOutlineAccessTimeFilled, MdOutlineCancel, MdUpdate, MdWarehouse } from "react-icons/md";
import { CiLogout } from "react-icons/ci";
import { format } from "date-fns";
import { id } from 'date-fns/locale';
import { Drawer, Divider, Avatar, Switch, Popover, notification } from 'antd';
import { FaChartBar, FaCode, FaFileInvoiceDollar, FaLayerGroup, FaPaintBrush, FaPencilAlt, FaRegCalendarAlt, FaRegFileAlt, FaRegFolderOpen, FaRegIdBadge, FaRegImages } from 'react-icons/fa';
import { BsCashCoin, BsCurrencyDollar, BsFillClipboard2DataFill, BsFillPersonVcardFill, BsPeopleFill } from 'react-icons/bs';
import { LuClipboardList } from "react-icons/lu";
import { SiWikibooks } from "react-icons/si";
import { IoCloseSharp, IoPeople } from 'react-icons/io5';
import klf_logo_navbar_dark from '../../assets/images/klflogo.png';
import klf_logo_navbar_light from '../../assets/images/klflogo-navbar.png';
import { useTheme } from '../../ThemeContext';
import { VscMention } from "react-icons/vsc";
import { CgSmartphoneChip } from "react-icons/cg";
import { ImPriceTags } from "react-icons/im";
import { getImageUrl } from '../../Utils/image';
import { NOTIF_REFRESH_EVENT } from '../../Utils/notifRefresh';
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { GrWorkshop } from "react-icons/gr";
import { GiMoneyStack } from "react-icons/gi";
import { BiArchive } from "react-icons/bi";
import { FaGear } from "react-icons/fa6";
import { motion, AnimatePresence } from "framer-motion";


const NavigationBar = () => {
  const baseUrl = getApiBaseUrl();
  const location = useLocation();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [userDataAvailable, setUserDataAvailable] = useState(false);
  const [userName, setUserName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const isMobile = window.innerWidth <= 768;
  const [notifData, setNotifData] = useState({ items: [], pendingMention: 0, unreadReply: 0 });
  const [dataAlurKerjaNotif, setDataAlurKerjaNotif] = useState([]);

  const [showBoardModal, setShowBoardModal] = useState(false);

  const [myMention, setMyMention] = useState(false);
  const notifPenting = notifData.pendingMention > 0;

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const isHomeActive = location.pathname === '/' || location.pathname === '/home' || location.pathname.startsWith('/productdetail');
  const isSearchActive = location.pathname.startsWith('/search');
  const isPekerjaanActive = location.pathname.startsWith('/pekerjaan');

  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;

  // cek login dan block labib & jastro
  useEffect(() => {
    const cekLogin = () => {
      if (user === null) {
        window.location.replace('/login');
      }
      if (user.uid === "ilWnMSyoNmar1LPbsCGrCQE92V83" || user.uid === "P7YKgj4NBZQFIA8LxVcow5LmYzI2" || user.uid === "bgrij28h3EbkY9RQw3QsuA9Doiw1") {
        handleLogout();
      }
    };
    cekLogin();
  }, []);


  const handleRedirect = (slug, category, id) => {
    window.location.href = `/project/${slug}/${category}/${id}`;
  };



  // useEffect(() => {
  //   const fetchData = async () => {
  //     if (user) {
  //       try {
  //         const res = await fetch(`${baseUrl}/users/profile/get`, {
  //           method: 'POST',
  //           headers: {
  //             'Content-Type': 'application/json',
  //           },
  //           body: JSON.stringify({ uid: user.uid }),
  //         });

  //         if (!res.ok) {
  //           throw new Error('Gagal mengambil data user');
  //         }

  //         const data = await res.json();
  //         setUserName(data.name);
  //         setProfilePicture(data.profilePicture);
  //         setUserDataAvailable(true);
  //       } catch (error) {
  //         console.error('Error saat ambil data user:', error);
  //       }
  //     }
  //   };

  //   fetchData();
  // }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      const userData = localStorage.getItem('user'); // Ambil langsung dari localStorage
      if (userData) {
        const user = JSON.parse(userData);
        try {
          const res = await fetch(`${baseUrl}/users/profile/get`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uid: user.uid }),
          });

          if (!res.ok) {
            throw new Error('Gagal mengambil data user');
          }

          const data = await res.json();
          setUserName(data.name);
          setProfilePicture(data.profilePicture);
          setUserDataAvailable(true);
        } catch (error) {
          console.error('Error saat ambil data user:', error);
        }
      }
    };

    fetchData();
  }, []); // ← hanya dijalankan sekali saat komponen mount

  // Bel notifikasi komentar — aturan & hitungan di server (utils/notifKomentar.js):
  //  • mention @saya → persisten (merah "Important!") sampai saya membalas, maks 30 hari
  //  • balasan orang lain di thread milik saya / yang saya ikut balas → padam saat diklik
  // Selain itu tidak ada notif. Dihitung ulang tiap 30 detik, saat tab kembali
  // aktif, dan LANGSUNG setelah kita kirim/edit/hapus komentar (mintaRefreshNotif).
  const fetchNotifikasi = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const res = await fetch(`${baseUrl}/notif/mine?uid=${encodeURIComponent(user.uid)}`);
      if (!res.ok) return;
      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items : [];
      setNotifData({ items, pendingMention: data.pendingMention || 0, unreadReply: data.unreadReply || 0 });

      // Popup browser hanya untuk notif AKTIF yang belum pernah terlihat.
      // Kunjungan pertama (belum ada daftar tersimpan) cukup dicatat, tanpa popup.
      const aktif = items.filter((n) => n.aktif).map((n) => n.key);
      let seen = null;
      try { seen = JSON.parse(localStorage.getItem('notifSeenKeys') || 'null'); } catch (e) { seen = null; }
      if (Array.isArray(seen) && aktif.some((k) => !seen.includes(k))) showNotification();
      try { localStorage.setItem('notifSeenKeys', JSON.stringify(aktif)); } catch (e) { /* abaikan */ }
    } catch (error) {
      console.error('Gagal mengambil notifikasi:', error);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchNotifikasi();
    const interval = setInterval(fetchNotifikasi, 30000);
    const onVisible = () => { if (document.visibilityState === 'visible') fetchNotifikasi(); };
    window.addEventListener(NOTIF_REFRESH_EVENT, fetchNotifikasi);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      window.removeEventListener(NOTIF_REFRESH_EVENT, fetchNotifikasi);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [fetchNotifikasi]);

  const fetchAlurKerjaNotif = async () => {
    try {
      const res = await fetch(`${baseUrl}/projects/alurkerja/notifications`);
      const data = await res.json();
      setDataAlurKerjaNotif(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Gagal mengambil notif alur kerja:', error);
    }
  };

  useEffect(() => {
    fetchAlurKerjaNotif();
    const interval = setInterval(fetchAlurKerjaNotif, 30000);
    return () => clearInterval(interval);
  }, []);

  const showNotification = async () => {
    // iPhone/iPad Safari (non-PWA) tidak punya Notification API
    if (typeof Notification === 'undefined') return;

    // check notification permission
    if (Notification.permission === 'denied') return;
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
    }

    // create a new notification
    const notification = new Notification('KLF App', {
      body: 'Ada mention atau balasan baru untuk Anda',
      icon: './img/klflogo.png'
    });

    // close the notification after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10 * 1000);

    // navigate to a URL when clicked
    notification.addEventListener('click', () => {

      window.open('https://klf-project-manager.vercel.app/', '_blank');
    });
  }


  // Di HP panel notif dipasang fixed selebar layar tepat di bawah bell (lihat <ul> notif).
  // Posisi otomatis Popper mendorong panel keluar layar ke kiri di layar sempit.
  const [notifTop, setNotifTop] = useState(60);
  const handleNotifClick = (e) => {
    const rect = e?.currentTarget?.getBoundingClientRect?.();
    if (rect) setNotifTop(Math.round(rect.bottom + 8));
    fetchNotifikasi();
  };


  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };


  const [theme, setTheme] = useState('light');
  const [developerMode, setDeveloperMode] = useState('off');
  const [localImageMode, setLocalImageMode] = useState('server');

  // Check localStorage for theme on initial load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      localStorage.setItem('theme', 'light');
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    const savedDeveloperMode = localStorage.getItem('developerMode');
    if (savedDeveloperMode) {
      setDeveloperMode(savedDeveloperMode);
    } else {
      localStorage.setItem('developerMode', 'off');
      setDeveloperMode('off');
    }
  }, []);

  useEffect(() => {
    const savedLocalImageMode = localStorage.getItem('localImageMode');
    if (savedLocalImageMode) {
      setLocalImageMode(savedLocalImageMode);
    } else {
      localStorage.setItem('localImageMode', 'server');
      setLocalImageMode('server');
    }
  }, []);

  const { globalTheme, toggleTheme } = useTheme();
  // Handle theme switch and update localStorage
  const handleThemeChange = (checked) => {
    const selectedTheme = checked ? 'light' : 'dark';
    setTheme(selectedTheme);
    toggleTheme(selectedTheme);

    // Simpan tema ke localStorage
    localStorage.setItem('theme', selectedTheme);

    // Kirim event ke window untuk memperbarui background
    const themeChangeEvent = new CustomEvent('themeChange', { detail: selectedTheme });
    window.dispatchEvent(themeChangeEvent);
  };

  const handleDeveloperModeChange = (checked) => {
    const selectedDeveloperMode = checked ? 'on' : 'off';
    setDeveloperMode(selectedDeveloperMode);

    // Simpan tema ke localStorage
    localStorage.setItem('developerMode', selectedDeveloperMode);
  };

  const handleLocalImageModeChange = (checked) => {
    const selectedLocalImageMode = checked ? 'local' : 'server';
    setLocalImageMode(selectedLocalImageMode);

    // Simpan data ke localStorage
    localStorage.setItem('localImageMode', selectedLocalImageMode);
  };


  const [api, contextHolder] = notification.useNotification();
  const openNotification = (placement) => {
    api.info({
      message: `Notification`,
      description: `Hello, ${userName}! You have messages that require your reply.`,
      placement,
    });
  };


  const [isPrimaryColor, setIsPrimaryColor] = useState(true); // State untuk menentukan warna aktif
  const primaryColor = 'red'; // Warna pertama
  const secondaryColor = 'white'; // Warna kedua

  useEffect(() => {
    const interval = setInterval(() => {
      setIsPrimaryColor((prev) => !prev); // Toggle warna
    }, 500); // Berkedip setiap 500ms

    return () => clearInterval(interval); // Bersihkan interval saat komponen di-unmount
  }, []);

  // Teks tiap notif + urutan tampil: mention yang belum dibalas selalu di atas
  // (supaya yang bikin bel merah gampang ditemukan), sisanya terbaru dulu.
  const notifList = useMemo(() => {
    const pesan = {
      'mention': 'menandai Anda di',
      'reply-mine': 'membalas komentar Anda di',
      'reply-thread': 'ikut membalas diskusi di',
    };
    const list = notifData.items.map((n) => ({ ...n, message: `${pesan[n.kind] || 'membalas di'} "${n.productName || '-'}"` }));
    const pending = list.filter((n) => n.kind === 'mention' && n.aktif);
    const lain = list.filter((n) => !(n.kind === 'mention' && n.aktif));
    return { pending, lain };
  }, [notifData]);


  // Hak akses menu di-cache di localStorage: kalau fetch gagal (sinyal jelek /
  // server lambat) menu tidak ikut hilang seperti sebelumnya.
  const [userAccess, setUserAccess] = useState(() => {
    try {
      const cached = localStorage.getItem('userAccessCache');
      const parsed = cached ? JSON.parse(cached) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });

  const fetchUserAccess = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/useraccess/get`);
      const data = await res.json();
      if (!Array.isArray(data)) return;
      setUserAccess(data);
      // Tidak punya akses menu apa pun → tidak boleh memakai app sama sekali.
      // Hanya diputuskan dari data server yang berhasil diambil (bukan cache / saat offline).
      const SUPER_ADMIN = ['w4M5JJjgGQeHFbS2nkyoCfUBE532', 'fYpdHwXRDLhj5XGxM5FZIAvxp9E2'];
      const uidNow = user?.uid;
      if (uidNow && !SUPER_ADMIN.includes(uidNow)
        && !data.some(a => a.uid === uidNow && (a.value === true || a.value === 'true'))) {
        localStorage.removeItem('user');
        window.location.replace('/login?noaccess=1');
        return;
      }
      try { localStorage.setItem('userAccessCache', JSON.stringify(data)); } catch (e) { /* quota penuh, abaikan */ }
    } catch (err) {
      console.error('Gagal ambil user access:', err);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchUserAccess();
  }, [fetchUserAccess]);

  // Sinkron ulang tiap sidebar dibuka — menu yang baru diaktifkan di User
  // Management langsung muncul tanpa perlu reload/hard refresh.
  useEffect(() => {
    if (showBoardModal) fetchUserAccess();
  }, [showBoardModal, fetchUserAccess]);

  // angka kecil di menu Desain Produk (kurator: menunggu review, desainer: diminta revisi) — bukan notifikasi utama
  const [desainBadge, setDesainBadge] = useState(0);
  useEffect(() => {
    if (!showBoardModal || !user?.uid) return;
    fetch(`${getApiBaseUrl()}/desain/badge?uid=${encodeURIComponent(user.uid)}`).then((r) => r.json()).then((d) => setDesainBadge(d.total || 0)).catch(() => {});
  }, [showBoardModal]);

  const hasMenuAccess = (uid, menu) => {
    return userAccess.some(
      a => a.uid === uid && a.menu === menu && (a.value === true || a.value === 'true')
    );
  };

  const [openGeneral, setOpenGeneral] = useState(false);
  const [openOperations, setOpenOperations] = useState(false);
  const [openFinance, setOpenFinance] = useState(false);
  const [openArchive, setOpenArchive] = useState(false);
  const [openManagement, setOpenManagement] = useState(false);
  const [openSystem, setOpenSystem] = useState(false);
  const [openBeta, setOpenBeta] = useState(false);

  const isActive = (path) =>
    location.pathname.startsWith(path)
      ? { color: "#234dba", fontWeight: 600 }
      : { color: globalTheme === "light" ? "black" : "white" };

  const dividerStyle = {
    borderColor: globalTheme === "light" ? "#bdbdbd" : "#313a51",
  };
  const [showLogsModal, setShowLogsModal] = useState(false);

  // Daftar menu sidebar. `menu` = key di UserAccess (HARUS sama dengan label
  // checkbox di UserManagement.jsx). Item yang tidak boleh diakses disembunyikan.
  const SUPER_ADMIN_UIDS = ['w4M5JJjgGQeHFbS2nkyoCfUBE532', 'fYpdHwXRDLhj5XGxM5FZIAvxp9E2'];
  const DEVELOPER_UID = 'w4M5JJjgGQeHFbS2nkyoCfUBE532';
  const uid = user?.uid;
  const menuItem = (menu, path, label, icon) => ({ key: path, path, label, icon, show: hasMenuAccess(uid, menu) });
  const switchRow = (key, icon, label, control) => ({
    key,
    show: true,
    render: () => (
      <div className="d-flex align-items-center justify-content-between gap-2 py-2 link-hover">
        <div className="d-flex align-items-center gap-2" style={{ color: globalTheme === "light" ? "black" : "white" }}>
          {icon}
          <span className="fw-semibold">{label}</span>
        </div>
        {control}
      </div>
    ),
  });

  const sidebarGroups = [
    {
      key: 'general', label: 'General', icon: <FaLayerGroup />, open: openGeneral, setOpen: setOpenGeneral,
      items: [
        menuItem('Dashboard', '/dashboard', 'Dashboard', <BsFillClipboard2DataFill />),
        menuItem('Calendar', '/calendar', 'Calendar', <FaRegCalendarAlt />),
        menuItem('Notes', '/notes', 'Notes', <FaPencilAlt />),
      ],
    },
    {
      key: 'operations', label: 'Operations', icon: <GrWorkshop />, open: openOperations, setOpen: setOpenOperations,
      items: [
        menuItem('Invoice', '/invoice', 'Invoice', <FaFileInvoiceDollar />),
        menuItem('Quote', '/quote', 'Quote', <span role="img" aria-label="quote">🧾</span>),
        menuItem('Projects', '/project', 'Projects', <MdDashboard />),
        menuItem('Pengiriman', '/pengiriman', 'Pengiriman', <span role="img" aria-label="pengiriman">🚚</span>),
        menuItem('SPK', '/spk', 'SPK', <FaRegFileAlt />),
        menuItem('Category', '/category', 'Category', <SiWikibooks />),
        menuItem('Todo', '/todo', 'To-Do & QC', <LuClipboardList />),
        menuItem('CRM', '/crm', 'CRM', <BsPeopleFill />),
        menuItem('Knowledge', '/knowledge', 'Knowledge Base', <span role="img" aria-label="knowledge">🧠</span>),
      ],
    },
    {
      key: 'finance', label: 'Finance', icon: <GiMoneyStack />, open: openFinance, setOpen: setOpenFinance,
      items: [
        menuItem('Accounting', '/accounting', 'Accounting', <BsCurrencyDollar />),
        menuItem('Stocks', '/stock', 'Stocks', <MdWarehouse />),
        menuItem('Assets', '/assets', 'Assets', <FaChartBar />),
      ],
    },
    {
      key: 'archive', label: 'Archive', icon: <BiArchive />, open: openArchive, setOpen: setOpenArchive,
      items: [
        menuItem('Hasil Produksi', '/hasil-produksi', 'Hasil Produksi', <FaRegFolderOpen />),
        { ...menuItem('Desain Produk', '/desain', 'Desain Produk', <FaPaintBrush />), badge: desainBadge },
        menuItem('Products', '/products', 'Products', <MdChair />),
        menuItem('Price List', '/pricelist', 'Riwayat HPP Produksi', <ImPriceTags />),
        // Testimoni Lama memang tidak punya hak akses — terbuka untuk semua.
        { key: '/testimoni-lama', path: '/testimoni-lama', label: 'Testimoni Lama', icon: <BiArchive />, show: true },
      ],
    },
    {
      key: 'management', label: 'Management', icon: <FaRegIdBadge />, open: openManagement, setOpen: setOpenManagement,
      items: [
        { key: '/user-management', path: '/user-management', label: 'User Management', icon: <IoPeople />, show: SUPER_ADMIN_UIDS.includes(uid) },
        menuItem('Appraisal', '/appraisal', 'Appraisal', <BsFillPersonVcardFill />),
        menuItem('Absensi', '/absensi', 'Absensi', <MdOutlineAccessTimeFilled />),
      ],
    },
    {
      key: 'system', label: 'System', icon: <FaGear />, open: openSystem, setOpen: setOpenSystem,
      items: [
        switchRow('theme', <FaPaintBrush />, 'Theme',
          <Switch checkedChildren="Light" unCheckedChildren="Dark" checked={theme === "light"} onChange={handleThemeChange} size="small" />),
        {
          ...switchRow('devmode', <FaCode />, 'Developer Mode',
            <Switch checkedChildren="On" unCheckedChildren="Off" checked={developerMode === "on"} onChange={handleDeveloperModeChange} size="small" />),
          show: uid === DEVELOPER_UID,
        },
        {
          ...switchRow('imgsrc', <FaRegImages />, 'Image Source',
            <Switch checkedChildren="Local" unCheckedChildren="Server" checked={localImageMode === "local"} onChange={handleLocalImageModeChange} size="small" />),
          show: uid === DEVELOPER_UID,
        },
        {
          key: 'logs',
          show: true,
          render: () => (
            <div className="d-flex align-items-center gap-2 py-2 text-decoration-none link-hover" style={{ cursor: "pointer" }} onClick={() => setShowLogsModal(true)}>
              <MdUpdate />
              <span className="fw-semibold">Update Logs</span>
            </div>
          ),
        },
      ],
    },
  ];

  const updateLogs = [
    { date: "11 November 2025", description: "Telegram Bot" },
    { date: "12 November 2025", description: "Link barang jadi ke website" },
    { date: "21 November 2025", description: "Optimasi paginasi di projects" },
    { date: "25 November 2025", description: "Connect project category ke SPK" },
    { date: "26 November 2025", description: "Fitur upload video di komen & tele" },
    { date: "1 Desember 2025", description: "Thumbnail + optimasi telegram bot" },
  ];

  return (
    <>
      <Navbar expand="lg" id="tidak-tercetak" className="shadow navbar-klf-custom" sticky={isMobile ? undefined : "top"} style={{
        backgroundImage: theme == "light" ? "linear-gradient(to right, #331cff, #1600da)" : "linear-gradient(to right, #1b222c, #192539)",
        backgroundColor: "#192033", // fallback for older browsers
        borderBottom: "1px solid #414141"
      }}>
        {contextHolder}
        <Container>
          <Navbar.Brand>
            <div className="logoDiv logo d-flex align-items-center" style={{ cursor: 'pointer' }} onClick={() => setShowBoardModal(true)}>
              <img src={theme === 'light' ? klf_logo_navbar_light : klf_logo_navbar_dark} style={{ height: "2.5rem", width: "auto", marginRight: "5px", marginTop: "-5px" }} />
              <h3 className="fw-bold">
                KLF App{" "}
                {developerMode === "on" && (
                  <h5 className="d-inline fw-normal fs-6">(Developer Mode)</h5>
                )}
              </h3>
            </div>
          </Navbar.Brand>
          {/* <Navbar.Toggle aria-controls="basic-navbar-nav" onClick={handleShow} className="order-2" /> */}

          <Offcanvas show={show} onHide={handleClose} className="offCanvas">
            <Offcanvas.Header closeButton></Offcanvas.Header>
            <Offcanvas.Body>
              <Nav className="mx-auto navItem">
                <Nav.Link className="navLink border-bottom">
                  <Link to="/home" onClick={() => navigate('/home')}>
                    Home
                  </Link>
                </Nav.Link>
                <Nav.Link className="navLink border-bottom">
                  <Link to="/search" onClick={() => navigate('/search')}>
                    Kategori
                  </Link>
                </Nav.Link>
                <Nav.Link className="navLink border-bottom">
                  <Link to="/pekerjaan">Pekerjaan</Link>
                </Nav.Link>
              </Nav>
              <div className="text-center mt-3 d-flex justify-content-evenly">
                <Link to="/register">
                  <button className="btnDaftar">Daftar</button>
                </Link>
                <Link to="/login">
                  <button className="btnLogin">Login</button>
                </Link>
              </div>
            </Offcanvas.Body>
          </Offcanvas>

          <Nav className="mx-auto text-center navItem d-none d-lg-flex">
            {/* <Nav.Link className="navLink">
            <Link to="/home" onClick={() => navigate('/home')}>
<span style={{ color: isHomeActive ? '#964B00' : 'inherit' }}>Home</span>
            </Link>
          </Nav.Link>
          <Nav.Link className="navLink">
            <Link to="/search" onClick={() => navigate('/search')}>
            <span style={{ color: isSearchActive ? '#964B00' : 'inherit' }}>Kategori</span>
            </Link>
          </Nav.Link>
          <Nav.Link className="navLink">
            <Link to="/pekerjaan">
            <span style={{ color: isPekerjaanActive ? '#964B00' : 'inherit' }}>Pekerjaan</span>
            </Link>
          </Nav.Link> */}
          </Nav>
          {
            userDataAvailable ? (
              <>
                <div className="d-flex align-items-center">

                  {/* Alur Kerja QC Notifications */}
                  <div className="btn-group dropstart me-2">
                    <div
                      style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      className="bell-hover"
                    >
                      <LuClipboardList style={{ fontSize: '22px', color: 'white' }} />
                      {dataAlurKerjaNotif.length > 0 && (
                        <span style={{
                          position: 'absolute', top: '-6px', right: '-6px',
                          backgroundColor: 'red', color: 'white', borderRadius: '50%',
                          width: '15px', height: '15px', fontSize: '9px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                        }}>
                          {dataAlurKerjaNotif.length > 9 ? '9+' : dataAlurKerjaNotif.length}
                        </span>
                      )}
                    </div>

                    <ul className={`dropdown-menu ${theme === 'light' ? 'bg-light' : 'bg-dark'}`}
                      style={{ maxHeight: '500px', width: isMobile ? '270px' : '360px', overflowY: 'auto' }}>

                      <li className={`dropdown-item ${theme === 'light' ? 'bg-light text-dark' : 'bg-dark text-light'}`}
                        style={{ textAlign: 'center', pointerEvents: 'none' }}>
                        <h6 style={{ margin: '0 0 4px 0' }}>QC Alur Kerja</h6>
                        <hr style={{ margin: '4px 0' }} />
                      </li>

                      {dataAlurKerjaNotif.length === 0 && (
                        <li className="dropdown-item text-secondary" style={{ textAlign: 'center', fontSize: '13px' }}>
                          Semua alur kerja sudah OK
                        </li>
                      )}

                      {dataAlurKerjaNotif.map((notif, index) => (
                        <li
                          key={index}
                          className={`dropdown-item ${theme === 'light' ? 'bg-light' : 'bg-dark'} notif-hover-effect`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => { window.location.href = `/project/${notif.slug}/${notif.category}`; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {notif.gambarProduk && (
                              <img
                                src={getImageUrl(notif.gambarProduk)}
                                alt="produk"
                                style={{ width: '38px', height: '38px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #ccc', flexShrink: 0 }}
                              />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{
                                margin: 0, fontWeight: '600', fontSize: '13px',
                                color: theme === 'light' ? 'black' : 'white',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              }}>
                                {notif.namaBarang}
                              </p>
                              <small style={{ color: notif.hasServis ? '#ffc107' : '#dc3545' }}>
                                {notif.category} — {notif.pendingItems.join(', ')}
                              </small>
                            </div>
                          </div>
                          <hr style={{ color: theme === 'light' ? 'black' : 'white', margin: '6px 0 0 0' }} />
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* End Alur Kerja QC Notifications */}

                  <div className="btn-group dropstart">
                    {notifPenting ? (

                      // Popover "Important!" selalu open, jadi panelnya melayang di
                      // bawah bell. Di mobile panel itu menutupi tombol sebelahnya
                      // (search/clipboard) sehingga tidak bisa diklik → di mobile
                      // cukup ikon merah berkedip saja. Desktop tetap pakai popover.
                      isMobile ? (
                        <MdNotificationImportant
                          style={{
                            fontSize: '28px',
                            marginRight: '5px',
                            color: isPrimaryColor ? primaryColor : secondaryColor,
                            transition: 'color 0.5s ease-in-out',
                          }}
                          onClick={handleNotifClick}
                          data-bs-toggle="dropdown"
                          data-bs-display={isMobile ? "static" : undefined}
                          aria-expanded="false"
                          className='bell-hover'
                        />
                      ) : (
                        <Popover content="Important!" open placement="bottom">
                          <MdNotificationImportant
                            style={{
                              fontSize: '28px',
                              marginRight: '5px',
                              color: isPrimaryColor ? primaryColor : secondaryColor, // Ganti warna berdasarkan state
                              transition: 'color 0.5s ease-in-out', // Tambahkan animasi transisi untuk warna
                            }}
                            onClick={handleNotifClick}
                            data-bs-toggle="dropdown"
                            data-bs-display={isMobile ? "static" : undefined}
                            aria-expanded="false"
                            className='bell-hover'
                          />
                        </Popover>
                      )

                    ) : notifData.unreadReply > 0 ? (
                      <MdNotificationsActive
                        style={{ fontSize: '24px', marginRight: '5px', color: 'white' }}
                        onClick={handleNotifClick}
                        data-bs-toggle="dropdown"
                        data-bs-display={isMobile ? "static" : undefined}
                        aria-expanded="false"
                        className='bell-hover'
                      />
                    ) : (
                      <IoMdNotificationsOutline
                        style={{ fontSize: '24px', marginRight: '5px', color: 'white' }}
                        onClick={handleNotifClick}
                        data-bs-toggle="dropdown"
                        data-bs-display={isMobile ? "static" : undefined}
                        aria-expanded="false"
                        className='bell-hover'
                      />
                    )}
                    {!notifPenting && notifData.unreadReply > 0 && (
                      <span style={{ position: 'absolute', top: -4, right: 0, background: '#dc3545', color: 'white', borderRadius: 10, fontSize: 10, fontWeight: 700, minWidth: 16, height: 16, lineHeight: '16px', textAlign: 'center', padding: '0 4px', pointerEvents: 'none' }}>
                        {notifData.unreadReply > 9 ? '9+' : notifData.unreadReply}
                      </span>
                    )}

                    <ul className={`dropdown-menu ${theme === 'light' ? 'bg-light' : 'bg-dark'}`} style={{
                      overflowY: 'auto',
                      ...(isMobile
                        ? { position: 'fixed', left: 8, right: 8, top: notifTop, width: 'auto', margin: 0, maxHeight: `calc(100vh - ${notifTop + 16}px)`, zIndex: 1080 }
                        : { maxHeight: '500px', width: '350px' }),
                    }}>
                      <li
                        className={`dropdown-item ${theme === 'light' ? 'bg-light text-dark' : 'bg-dark text-light'}`}
                        style={{
                          alignItems: 'center',           // Tengah secara vertikal
                          textAlign: 'center',
                        }}
                      >
                        {/* Icon di sisi kiri */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'auto 1fr', // Kolom pertama untuk ikon, kolom kedua untuk teks
                            alignItems: 'center',           // Tengah secara vertikal
                            textAlign: 'center',
                          }}
                        >
                          <VscMention
                            size={25}
                            style={{ color: myMention ? "blue" : "" }}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent dropdown from closing
                              setMyMention((prevState) => !prevState);
                            }}
                            className='bell-hover'
                          />
                          {/* Teks di tengah */}
                          <h6 style={{ margin: "0px 20px 0px 0px" }}>Notifications</h6>
                        </div>

                        <hr />
                      </li>



                      {/* Mention belum dibalas = merah & selalu di atas; padam HANYA kalau dibalas.
                          Balasan lain padam saat diklik. Yang sudah selesai meredup. */}
                      {notifList.pending.length > 0 && (
                        <li className="px-3 pb-1" style={{ fontSize: 12, fontWeight: 700, color: '#dc3545' }}>
                          Perlu dibalas ({notifList.pending.length})
                        </li>
                      )}
                      {[...notifList.pending, ...notifList.lain.filter((n) => !myMention || n.kind === 'mention')].map((notif, index) => {
                        const isMention = notif.kind === 'mention';
                        const selesai = !notif.aktif;
                        const pertamaLain = index === notifList.pending.length && notifList.pending.length > 0;
                        return (
                        <React.Fragment key={notif.key}>
                        {pertamaLain && (
                          <li className="px-3 pb-1 text-secondary" style={{ fontSize: 12, fontWeight: 700 }}>Lainnya</li>
                        )}
                        <li
                          className={`${theme === 'light' ? 'bg-light' : 'bg-dark'} dropdown-item ${selesai ? 'text-secondary' : ''} notif-hover-effect`}
                          style={{ opacity: selesai ? 0.45 : 1, cursor: 'pointer', whiteSpace: 'normal' }}
                          onClick={async () => {
                            // Balasan biasa padam saat diklik; mention tetap nyala sampai dibalas
                            if (!isMention && notif.aktif) {
                              try {
                                await fetch(`${baseUrl}/notif/read`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ uid: user.uid, key: notif.key }),
                                });
                              } catch (error) {
                                console.error('Failed to update notification:', error);
                              }
                            }
                            handleRedirect(notif.idProduct, notif.category, notif.id);
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center' }} className="mb-1">
                            <img
                              src={getImageUrl(notif.profilePicture)}
                              alt="profile"
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                marginRight: '5px',
                                border: '2px solid black',
                              }}
                              className="profile-img"
                            />
                            <p
                              style={{ margin: '0', fontWeight: '600' }}
                              className={theme === 'light' ? 'text-dark' : 'text-light'}
                            >
                              {notif.userName}
                            </p>
                            {notif.aktif && (
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: isMention ? '#dc3545' : '#0d6efd', marginLeft: 6, flexShrink: 0 }} />
                            )}
                            <small
                              style={{ margin: '0', marginLeft: 'auto', paddingLeft: 8 }}
                              className="text-secondary"
                            >
                              {format(new Date(notif.seconds * 1000), 'd MMM yyyy, HH.mm', { locale: id })}
                            </small>
                          </div>
                          <p
                            style={{
                              margin: '0',
                              wordWrap: 'break-word',
                              whiteSpace: 'pre-wrap',
                              fontWeight: notif.aktif ? 600 : 400,
                            }}
                            className={isMention && notif.aktif ? 'text-danger' : theme === 'light' ? 'text-dark' : 'text-light'}
                          >
                            {notif.message}
                          </p>
                          {notif.snippet && (
                            <small className="text-secondary" style={{ display: 'block', wordWrap: 'break-word', whiteSpace: 'normal' }}>
                              “{notif.snippet}”
                            </small>
                          )}
                          <hr style={{ color: theme === 'light' ? 'black' : 'white', margin: '8px 0 0 0' }} />
                        </li>
                        </React.Fragment>
                        );
                      })}
                      {notifData.items.length === 0 && (
                        <li className="px-3 py-2 text-secondary" style={{ fontSize: 13 }}>
                          Belum ada mention atau balasan dalam 30 hari terakhir.
                        </li>
                      )}

                    </ul>
                  </div>


                  <div className="dropdown" style={{ cursor: "pointer" }}>
                    <div data-bs-toggle="dropdown" aria-expanded="false">
                      <div className='logoDiv'>
                        <img src={getImageUrl(profilePicture)} alt="profile" style={{ width: '30px', height: '30px', backgroundColor: 'white', borderRadius: '100%', marginRight: '5px', border: "2px solid white" }} className="profile-img" />
                        <span className="text-light">{userName}</span>
                      </div>
                    </div>
                    <ul className="dropdown-menu bg-dark">
                      <li><a className="dropdown-item text-light" onClick={handleLogout}><CiLogout /> Logout</a></li>
                    </ul>
                  </div>

                </div>

              </>
            ) : (
              <span></span>
            )

          }





        </Container>
      </Navbar >










      <Drawer
        title="Sidebar"
        placement={'left'}
        className="drawer-klf-custom"
        closable={false}
        onClose={() => setShowBoardModal(false)}
        open={showBoardModal}
        key={'left'}
        style={{
          backgroundImage: theme == "light" ? "linear-gradient(to right, #ffffff, #eaeaea)" : "linear-gradient(to right, #192033, #242d39)",
        }}
      >

        <div style={{ position: 'relative', marginTop: "10px" }}>
          <div
            onClick={() => setShowBoardModal(false)}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              zIndex: 1,
              width: '25px',
              height: '25px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <IoCloseSharp style={{ width: '25px', height: '25px', color: theme == "light" ? "black" : "white" }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar size={100} src={getImageUrl(profilePicture)} style={{ border: theme == "light" ? '2px solid black' : '2px solid white' }} />
            <h5 className='fw-semibold' style={{ marginLeft: "15px", color: theme == "light" ? "black" : "white" }}>{userName}</h5>
          </div>
        </div>

        <Divider style={{ borderColor: theme == "light" ? '#bdbdbd' : '#313a51', color: theme == "light" ? '#bdbdbd' : '#313a51' }} />



        {/* Menu sidebar berbasis data: item tanpa akses TIDAK ditampilkan sama sekali
            (dulu tampil abu-abu), grup yang isinya kosong ikut disembunyikan. */}
        {sidebarGroups
          .map((g) => ({ ...g, visible: g.items.filter((it) => it.show) }))
          .filter((g) => g.visible.length > 0)
          .map((g, gi) => (
            <React.Fragment key={g.key}>
              {gi > 0 && (
                <Divider style={{ borderColor: theme == "light" ? '#bdbdbd' : '#313a51', color: theme == "light" ? '#bdbdbd' : '#313a51' }} />
              )}
              <div className="w-100">
                {/* Root Menu */}
                <div
                  className="d-flex align-items-center justify-content-between rounded mb-2 link-hover"
                  role="button"
                  onClick={() => g.setOpen(!g.open)}
                  style={
                    g.visible.some((it) => it.path && location.pathname.startsWith(it.path))
                      ? { color: "#234dba", fontWeight: 600 }
                      : { color: globalTheme === "light" ? "black" : "white" }
                  }
                >
                  <div className="d-flex align-items-center gap-2">
                    {g.icon}
                    <span className="fw-semibold">{g.label}</span>
                    {!g.open && g.visible.some((it) => it.badge > 0) && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e11d48' }} />}
                  </div>
                  {g.open ? <IoIosArrowUp /> : <IoIosArrowDown />}
                </div>

                {/* Isi Dropdown */}
                <AnimatePresence>
                  {g.open && (
                    <motion.div
                      className="ps-3 border-start mt-3"
                      style={{ borderColor: "#bdbdbd50" }}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      {g.visible.map((it, i) => (
                        <React.Fragment key={it.key}>
                          {i > 0 && <hr className="my-1" style={dividerStyle} />}
                          {it.render ? it.render() : (
                            <Link
                              to={it.path}
                              className="d-flex align-items-center gap-2 py-2 text-decoration-none link-hover"
                              style={isActive(it.path)}
                            >
                              {it.icon}
                              <span className="fw-semibold">{it.label}</span>
                              {it.badge > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: '#e11d48', color: '#fff', borderRadius: 999, padding: '1px 7px' }}>{it.badge} baru</span>}
                            </Link>
                          )}
                        </React.Fragment>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </React.Fragment>
          ))}



        <Divider style={{ borderColor: theme == "light" ? '#bdbdbd' : '#313a51', color: theme == "light" ? '#bdbdbd' : '#313a51' }} />

        {/* {hasMenuAccess(user.uid, "Todo") && (
          <>
            <Link to="/todo" style={{ textDecoration: 'none', color: location.pathname.startsWith('/todo') ? '#234dba' : (globalTheme === "light" ? "black" : "white"), display: 'flex', alignItems: 'center' }} className='d-flex mb-4 mt-4 link-hover'>
              <LuClipboardList /> <p className='fw-semibold' style={{ margin: 0, paddingLeft: '10px' }}>To Do</p>
            </Link>
            <Divider style={{ borderColor: theme == "light" ? '#bdbdbd' : '#313a51', color: theme == "light" ? '#bdbdbd' : '#313a51' }} />
          </>
        )}

        {hasMenuAccess(user.uid, "Price List") && (
          <>
            <Link to="/pricelist" style={{ textDecoration: 'none', color: location.pathname.startsWith('/pricelist') ? '#234dba' : (globalTheme === "light" ? "black" : "white"), display: 'flex', alignItems: 'center' }} className='d-flex mb-4 mt-4 link-hover'>
              <ImPriceTags /> <p className='fw-semibold' style={{ margin: 0, paddingLeft: '10px' }}>Riwayat HPP Produksi</p>
            </Link>
            <Divider style={{ borderColor: theme == "light" ? '#bdbdbd' : '#313a51', color: theme == "light" ? '#bdbdbd' : '#313a51' }} />
          </>
        )}

        {hasMenuAccess(user.uid, "Appraisal") && (
          <>
            <Link to="/appraisal" style={{ textDecoration: 'none', color: location.pathname.startsWith('/appraisal') ? '#234dba' : (globalTheme === "light" ? "black" : "white"), display: 'flex', alignItems: 'center' }} className='d-flex mb-4 mt-4 link-hover'>
              <BsFillPersonVcardFill /> <p className='fw-semibold' style={{ margin: 0, paddingLeft: '10px' }}>Appraisal</p>
            </Link>
            <Divider style={{ borderColor: theme == "light" ? '#bdbdbd' : '#313a51', color: theme == "light" ? '#bdbdbd' : '#313a51' }} />
          </>
        )}

        {hasMenuAccess(user.uid, "Calendar") && (
          <>
            <Link to="/calendar" style={{ textDecoration: 'none', color: location.pathname.startsWith('/calendar') ? '#234dba' : (globalTheme === "light" ? "black" : "white"), display: 'flex', alignItems: 'center' }} className='d-flex mb-4 mt-4 link-hover'>
              <FaRegCalendarAlt /> <p className='fw-semibold' style={{ margin: 0, paddingLeft: '10px' }}>Calendar</p>
            </Link>
            <Divider style={{ borderColor: theme == "light" ? '#bdbdbd' : '#313a51', color: theme == "light" ? '#bdbdbd' : '#313a51' }} />
          </>
        )}

        {hasMenuAccess(user.uid, "Notes") && (
          <>
            <Link to="/notes" style={{ textDecoration: 'none', color: location.pathname.startsWith('/notes') ? '#234dba' : (globalTheme === "light" ? "black" : "white"), display: 'flex', alignItems: 'center' }} className='d-flex mb-4 mt-4 link-hover'>
              <FaPencilAlt /> <p className='fw-semibold' style={{ margin: 0, paddingLeft: '10px' }}>Notes</p>
            </Link>
            <Divider style={{ borderColor: theme == "light" ? '#bdbdbd' : '#313a51', color: theme == "light" ? '#bdbdbd' : '#313a51' }} />
          </>
        )}

        {hasMenuAccess(user.uid, "Hasil Produksi") && (
          <>
            <Link to="/hasil-produksi" style={{ textDecoration: 'none', color: location.pathname.startsWith('/hasil-produksi') ? '#234dba' : (globalTheme === "light" ? "black" : "white"), display: 'flex', alignItems: 'center' }} className='d-flex mb-4 mt-4 link-hover'>
              <FaRegFolderOpen /> <p className='fw-semibold' style={{ margin: 0, paddingLeft: '10px' }}>Hasil Produksi</p>
            </Link>
            <Divider style={{ borderColor: theme == "light" ? '#bdbdbd' : '#313a51', color: theme == "light" ? '#bdbdbd' : '#313a51' }} />
          </>
        )}


        {hasMenuAccess(user.uid, "SPK") && (
          <>
            <Link to="/spk" style={{ textDecoration: 'none', color: location.pathname.startsWith('/spk') ? '#234dba' : (globalTheme === "light" ? "black" : "white"), display: 'flex', alignItems: 'center' }} className='d-flex mb-4 link-hover'>
              <FaRegFileAlt /> <p className='fw-semibold' style={{ margin: 0, paddingLeft: '10px' }}>SPK</p>
            </Link>
            <Divider style={{ borderColor: theme == "light" ? '#bdbdbd' : '#313a51', color: theme == "light" ? '#bdbdbd' : '#313a51' }} />
          </>
        )}

        {hasMenuAccess(user.uid, "Accounting") && (
          <>
            <Link to="/accounting" style={{ textDecoration: 'none', color: location.pathname.startsWith('/accounting') ? '#234dba' : (globalTheme === "light" ? "black" : "white"), display: 'flex', alignItems: 'center' }} className='d-flex mb-4 link-hover'>
              <BsCurrencyDollar /> <p className='fw-semibold' style={{ margin: 0, paddingLeft: '10px' }}>Accounting</p>
            </Link>
            <Divider style={{ borderColor: theme == "light" ? '#bdbdbd' : '#313a51', color: theme == "light" ? '#bdbdbd' : '#313a51' }} />
          </>
        )}

        {hasMenuAccess(user.uid, "Stocks") && (
          <>
            <Link to="/stock" style={{ textDecoration: 'none', color: location.pathname.startsWith('/stock') ? '#234dba' : (globalTheme === "light" ? "black" : "white"), display: 'flex', alignItems: 'center' }} className='d-flex mb-4 mt-4 link-hover'>
              <MdWarehouse /> <p className='fw-semibold' style={{ margin: 0, paddingLeft: '10px' }}>Stocks</p>
            </Link>
            <Divider style={{ borderColor: theme == "light" ? '#bdbdbd' : '#313a51', color: theme == "light" ? '#bdbdbd' : '#313a51' }} />
          </>
        )}

        {hasMenuAccess(user.uid, "Assets") && (
          <>
            <Link to="/assets" style={{ textDecoration: 'none', color: location.pathname.startsWith('/assets') ? '#234dba' : (globalTheme === "light" ? "black" : "white"), display: 'flex', alignItems: 'center' }} className='d-flex mb-4 mt-4 link-hover'>
              <FaChartBar /> <p className='fw-semibold' style={{ margin: 0, paddingLeft: '10px' }}>Assets</p>
            </Link>
            <Divider style={{ borderColor: theme == "light" ? '#bdbdbd' : '#313a51', color: theme == "light" ? '#bdbdbd' : '#313a51' }} />
          </>
        )}

        {hasMenuAccess(user.uid, "Products") && (
          <>
            <Link to="/products" style={{ textDecoration: 'none', color: location.pathname.startsWith('/products') ? '#234dba' : (globalTheme === "light" ? "black" : "white"), display: 'flex', alignItems: 'center' }} className='d-flex mb-4 mt-4 link-hover'>
              <MdChair /> <p className='fw-semibold' style={{ margin: 0, paddingLeft: '10px' }}>Products</p>
            </Link>
            <Divider style={{ borderColor: theme == "light" ? '#bdbdbd' : '#313a51', color: theme == "light" ? '#bdbdbd' : '#313a51' }} />
          </>
        )}

        {(
          user.uid === 'w4M5JJjgGQeHFbS2nkyoCfUBE532' ||
          user.uid === 'fYpdHwXRDLhj5XGxM5FZIAvxp9E2'
        ) && (
            <>
              <Link to="/user-management" style={{ textDecoration: 'none', color: location.pathname.startsWith('/user-management') ? '#234dba' : (globalTheme === "light" ? "black" : "white"), display: 'flex', alignItems: 'center' }} className='d-flex mb-4 mt-4 link-hover'>
                <IoPeople /> <p className='fw-semibold' style={{ margin: 0, paddingLeft: '10px' }}>User Management</p>
              </Link>
              <Divider style={{ borderColor: theme == "light" ? '#bdbdbd' : '#313a51', color: theme == "light" ? '#bdbdbd' : '#313a51' }} />
            </>
          )}

        {hasMenuAccess(user.uid, "KLF AI") && (
          <>
            <Link to="/klf-ai"
              style={{
                textDecoration: 'none',
                color: location.pathname.startsWith('/klf-ai') ? '#234dba' : (globalTheme === "light" ? "black" : "white"),
                display: 'flex',
                alignItems: 'center'
              }}
              className='d-flex mb-4 mt-4 link-hover'
            >
              <CgSmartphoneChip />
              <p className='fw-semibold' style={{ margin: 0, paddingLeft: '10px', display: 'flex', alignItems: 'center' }}>
                KLF AI
                <span style={{
                  backgroundColor: '#078fe8',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600',
                  marginLeft: '8px',
                  padding: '2px 6px',
                  borderRadius: '20px'
                }}>
                  Beta
                </span>
              </p>
            </Link>

            <Divider style={{ borderColor: theme == "light" ? '#bdbdbd' : '#313a51', color: theme == "light" ? '#bdbdbd' : '#313a51' }} />
          </>
        )} */}

        {/* Modal */}
        <Modal show={showLogsModal} onHide={() => setShowLogsModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Update Logs</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {updateLogs.map((log, idx) => (
              <div key={idx} className="mb-3">
                <strong>{log.date}</strong>
                <p style={{ margin: 0 }}>{log.description}</p>
                {idx < updateLogs.length - 1 && <hr />}
              </div>
            ))}
          </Modal.Body>

        </Modal>

      </Drawer>
    </>
  );
};

export default NavigationBar;
