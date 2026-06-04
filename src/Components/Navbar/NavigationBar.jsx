import './navbar.css';
import '../Pekerjaan/table.css';
import React, { useEffect, useState, useMemo } from 'react';
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
import { MdChair, MdDashboard, MdNotificationImportant, MdNotificationsActive, MdOutlineCancel, MdUpdate, MdWarehouse } from "react-icons/md";
import { CiLogout } from "react-icons/ci";
import { format } from "date-fns";
import { id } from 'date-fns/locale';
import { Drawer, Divider, Avatar, Switch, Popover, notification } from 'antd';
import { FaChartBar, FaCode, FaFileInvoiceDollar, FaLayerGroup, FaPaintBrush, FaPencilAlt, FaRegCalendarAlt, FaRegFileAlt, FaRegFolderOpen, FaRegIdBadge, FaRegImages } from 'react-icons/fa';
import { BsBook, BsCashCoin, BsCurrencyDollar, BsFillClipboard2DataFill, BsFillPersonVcardFill } from 'react-icons/bs';
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
  const [dataNotifFromDB, setDataNotifFromDB] = useState([]);
  const [dataUserFromDB, setDataUserFromDB] = useState([]);
  const [dataProductFromDB, setDataProductFromDB] = useState([]);
  const [dataAlurKerjaNotif, setDataAlurKerjaNotif] = useState([]);
  let [notifStatus, setNotifStatus] = useState(localStorage.getItem('notifStatus'));

  const [showBoardModal, setShowBoardModal] = useState(false);

  const [myMention, setMyMention] = useState(false);
  const [notifPenting, setNotifPenting] = useState(false);

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

  const fetchNotifikasi = async () => {
    try {
      const res = await fetch(`${baseUrl}/notif/get`);
      const data = await res.json();

      setDataNotifFromDB(data);

      // Cek notifikasi pertama dan simpan status
      if (data.length > 0 && localStorage.getItem('firstNotif') !== data[0]?.id) {
        localStorage.setItem('firstNotif', data[0]?.id);
        localStorage.setItem('notifStatus', 'on');
        setNotifStatus('on');
        showNotification();
      }
    } catch (error) {
      console.error('Gagal mengambil notifikasi:', error);
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchNotifikasi, 30000); // Panggil tiap 30 detik

    return () => clearInterval(interval); // Hentikan saat unmount
  }, []);

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

  useEffect(() => {
    // fetchNotifikasi(); // Panggilan pertama saat komponen mount

    const timeout = setTimeout(() => {
      fetchNotifikasi(); // Panggilan kedua setelah 5 detik
    }, 2000); // 5000ms = 5 detik

    return () => clearTimeout(timeout); // Bersihkan timeout saat unmount
  }, []);



  let granted = false;
  const showNotification = async () => {

    // check notification permission
    if (Notification.permission === 'granted') {
      granted = true;
    } else if (Notification.permission !== 'denied') {
      let permission = await Notification.requestPermission();
      granted = permission === 'granted' ? true : false;
    }


    // create a new notification
    const notification = new Notification('KLF App', {
      body: "Hey there! You've got a new comment or reply on your project",
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


  const handleNotifClick = () => {
    localStorage.removeItem('notifStatus');
    setNotifStatus(localStorage.getItem('notifStatus'));
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${baseUrl}/users/all/get`, {
          method: 'GET',
        });

        if (!res.ok) throw new Error('Gagal ambil data user');

        const data = await res.json();
        setDataUserFromDB(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    const fetchProjects = async () => {
      try {
        const res = await fetch(`${baseUrl}/projects/get`, {
          method: 'GET',
        });

        if (!res.ok) throw new Error('Gagal ambil data project');

        const data = await res.json();
        setDataProductFromDB(data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchUsers();
    fetchProjects();
  }, []);


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


  useEffect(() => {
    // Inisialisasi flag
    let hasImportantNotif = false;

    dataNotifFromDB.forEach(notif => {
      if (notif.text && notif.text.includes(`@${userName}`)) {
        // Cek jika notifikasi tipe "comment"
        if (notif.type === "comment" || notif.type === "EditComment") {
          const hasReply = dataNotifFromDB.some(otherNotif =>
            (otherNotif.type === "reply" || otherNotif.type === "EditReply") &&
            otherNotif.user === user.uid &&
            otherNotif.date.value._seconds > notif.date.value._seconds &&
            otherNotif.commentId === notif.id
          );

          if (!hasReply) {
            hasImportantNotif = true;
          }
        }

        dataNotifFromDB.forEach(notif => {
          if (notif.text && notif.text.includes(`@${userName}`)) {
            // Cek jika notifikasi tipe "comment"
            if (notif.type === "reply" || notif.type === "EditReply") {
              const hasReply = dataNotifFromDB.some(otherNotif =>
                (otherNotif.type === "reply" || otherNotif.type === "EditReply") &&
                otherNotif.user === user.uid &&
                otherNotif.date.value._seconds > notif.date.value._seconds &&
                otherNotif.commentId === notif.commentId
              );

              if (!hasReply) {
                hasImportantNotif = true;
              }
            }
          }
        });

      }
    });

    // Update state hanya sekali setelah loop selesai
    setNotifPenting(hasImportantNotif);
  }, [dataNotifFromDB, user.uid]);

  useEffect(() => {
    if (notifPenting) {
      // openNotification('topLeft')
    }
  }, [notifPenting]);

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

  const processedNotifications = useMemo(() => {
    // Buat map untuk data user dan produk
    const userMap = dataUserFromDB.reduce((acc, user) => {
      acc[user.uid] = user;
      return acc;
    }, {});

    const productMap = dataProductFromDB.reduce((acc, product) => {
      acc[product.id] = product;
      return acc;
    }, {});

    // Buat map untuk mengecek balasan
    const replyMap = dataNotifFromDB.reduce((acc, notif) => {
      if (notif.type === 'reply' || notif.type === 'EditReply') {
        if (!acc[notif.commentId]) {
          acc[notif.commentId] = [];
        }
        acc[notif.commentId].push(notif);
      }
      return acc;
    }, {});

    // Proses notifikasi
    return dataNotifFromDB.map((notif) => {
      const notifUserName = userMap[notif.user]?.name || 'Unknown';
      const UserProfilePicture = userMap[notif.user]?.profilePicture || 'Unknown';
      const productName = productMap[notif.idProduct]?.NamaBarang || 'Unknown';

      let message = '';
      let isTagged = false;

      if (notif.text && notif.text.includes(`@${userName}`)) {
        message = `tagged you on "${productName}"`;
        isTagged = true;
      } else if (notif.type === 'comment') {
        message = `added a comment on "${productName}"`;
      } else if (notif.type === 'reply') {
        message = `replied to a comment on "${productName}"`;
      } else if (notif.type === 'EditComment') {
        message = `edited their comment on "${productName}"`;
      } else if (notif.type === 'EditReply') {
        message = `edited their reply on "${productName}"`;
      } else if (notif.type === 'DeleteComment') {
        message = `deleted a comment on "${productName}"`;
      } else if (notif.type === 'DeleteReply') {
        message = `deleted a reply on "${productName}"`;
      }

      // Cek apakah komentar atau balasan sudah di-reply
      let isReplied = false;
      if (notif.type === 'comment' || notif.type === 'EditComment') {
        isReplied = (replyMap[notif.id] || []).some(
          (reply) => reply.user === user.uid && reply.date.value._seconds > notif.date.value._seconds
        );
      } else if (notif.type === 'reply' || notif.type === 'EditReply') {
        isReplied = (replyMap[notif.commentId] || []).some(
          (reply) => reply.user === user.uid && reply.date.value._seconds > notif.date.value._seconds
        );
      }

      return { ...notif, notifUserName, productName, UserProfilePicture, isTagged, message, isReplied };
    });
  }, [dataNotifFromDB, dataUserFromDB, dataProductFromDB, userName]);


  const [userAccess, setUserAccess] = useState([]);

  useEffect(() => {
    const fetchUserAccess = async () => {
      const res = await fetch(`${baseUrl}/useraccess/get`);
      const data = await res.json();
      setUserAccess(data);
    };

    fetchUserAccess();
  }, []);

  const hasMenuAccess = (uid, menu) => {
    return userAccess.some(a => a.uid === uid && a.menu === menu && a.value === true);
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
      <Navbar expand="lg" id="tidak-tercetak" className="shadow navbar-klf-custom" sticky="top" style={{
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
                          aria-expanded="false"
                          className='bell-hover'
                        />
                      </Popover>


                    ) : notifStatus === 'on' ? (
                      <MdNotificationsActive
                        style={{ fontSize: '24px', marginRight: '5px', color: 'white' }}
                        onClick={handleNotifClick}
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        className='bell-hover'
                      />
                    ) : (
                      <IoMdNotificationsOutline
                        style={{ fontSize: '24px', marginRight: '5px', color: 'white' }}
                        onClick={handleNotifClick}
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        className='bell-hover'
                      />
                    )}

                    <ul className={`dropdown-menu ${theme === 'light' ? 'bg-light' : 'bg-dark'}`} style={{ maxHeight: '500px', ...(isMobile ? { width: '250px' } : { width: '350px' }), overflowY: 'auto' }}>
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



                      {processedNotifications.map((notif, index) => (
                        <li
                          key={index}
                          className={`${theme === 'light' ? 'bg-light' : 'bg-dark'} dropdown-item ${(notif[`user${user.uid}`] === 'true' && !notif.isTagged) || notif.isReplied ? 'text-secondary' : ''} notif-hover-effect`}
                          style={{ opacity: (notif[`user${user.uid}`] === 'true' && !notif.isTagged) || notif.isReplied ? 0.4 : 1, display: myMention && !notif.isTagged ? "none" : "" }}
                          onClick={async () => {
                            // Memanggil API untuk update status notif
                            try {
                              const res = await fetch(`${baseUrl}/notif/update`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  notifId: notif.idNotif,
                                  userId: user.uid,
                                }),
                              });
                              if (res.ok) {
                                handleRedirect(notif.idProduct, notif.category, notif.id);
                              }
                            } catch (error) {
                              console.error('Failed to update notification:', error);
                            }
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center' }} className="mb-2">
                            <img
                              src={getImageUrl(notif.UserProfilePicture)}
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
                              {notif.notifUserName}
                            </p>
                            <small
                              style={{ margin: '0', marginLeft: 'auto' }}
                              className="text-secondary"
                            >
                              {format(new Date(notif.date.value._seconds * 1000), 'd MMMM yyyy, HH.mm', { locale: id })}
                            </small>
                          </div>
                          <p
                            style={{
                              margin: '0',
                              wordWrap: 'break-word',
                              whiteSpace: 'pre-wrap',
                            }}
                            className={notif.isTagged ? 'text-danger' : theme === 'light' ? 'text-dark' : 'text-light'}
                          >
                            {notif.message}
                          </p>
                          <hr style={{ color: theme === 'light' ? 'black' : 'white' }} />
                        </li>
                      ))}

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



        <div className="w-100">
          {/* Root Menu */}
          <div
            className="d-flex align-items-center justify-content-between rounded mb-2 link-hover"
            role="button"
            onClick={() => setOpenGeneral(!openGeneral)}
            style={
              ["/dashboard", "/calendar", "/notes"].some((path) => location.pathname.startsWith(path))
                ? { color: "#234dba", fontWeight: 600 }
                : { color: globalTheme === "light" ? "black" : "white" }
            }

          >
            <div className="d-flex align-items-center gap-2">
              <FaLayerGroup />
              <span className="fw-semibold">General</span>
            </div>
            {openGeneral ? <IoIosArrowUp /> : <IoIosArrowDown />}
          </div>

          {/* Isi Dropdown */}
          <AnimatePresence>
            {openGeneral && (
              <motion.div
                className="ps-3 border-start mt-3"
                style={{ borderColor: "#bdbdbd50" }}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <Link
                  to={hasMenuAccess(user.uid, "Dashboard") ? "/dashboard" : "#"}
                  className={`d-flex align-items-center gap-2 py-2 text-decoration-none link-hover ${!hasMenuAccess(user.uid, "Dashboard") ? "disabled-link" : ""
                    }`}
                  style={isActive("/dashboard")}
                  onClick={(e) => {
                    if (!hasMenuAccess(user.uid, "Dashboard")) e.preventDefault();
                  }}
                >
                  <BsFillClipboard2DataFill />
                  <span className="fw-semibold">Dashboard</span>
                </Link>
                <hr className="my-1" style={dividerStyle} />

                <Link
                  to={hasMenuAccess(user.uid, "Calendar") ? "/calendar" : "#"}
                  className={`d-flex align-items-center gap-2 py-2 text-decoration-none link-hover ${!hasMenuAccess(user.uid, "Calendar") ? "disabled-link" : ""
                    }`}
                  style={isActive("/calendar")}
                  onClick={(e) => {
                    if (!hasMenuAccess(user.uid, "Calendar")) e.preventDefault();
                  }}
                >
                  <FaRegCalendarAlt />
                  <span className="fw-semibold">Calendar</span>
                </Link>
                <hr className="my-1" style={dividerStyle} />

                <Link
                  to={hasMenuAccess(user.uid, "Notes") ? "/notes" : "#"}
                  className={`d-flex align-items-center gap-2 py-2 text-decoration-none link-hover ${!hasMenuAccess(user.uid, "Notes") ? "disabled-link" : ""
                    }`}
                  style={isActive("/notes")}
                  onClick={(e) => {
                    if (!hasMenuAccess(user.uid, "Notes")) e.preventDefault();
                  }}
                >
                  <FaPencilAlt />
                  <span className="fw-semibold">Notes</span>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        <Divider style={{ borderColor: theme == "light" ? '#bdbdbd' : '#313a51', color: theme == "light" ? '#bdbdbd' : '#313a51' }} />

        <div className="w-100">
          {/* Root Menu */}
          <div
            className="d-flex align-items-center justify-content-between rounded mb-2 link-hover"
            role="button"
            onClick={() => setOpenOperations(!openOperations)}
            style={
              ["/invoice", "/project", "/spk", "/category", "/todo", "/books"].some((path) => location.pathname.startsWith(path))
                ? { color: "#234dba", fontWeight: 600 }
                : { color: globalTheme === "light" ? "black" : "white" }
            }
          >
            <div className="d-flex align-items-center gap-2">
              <GrWorkshop />
              <span className="fw-semibold">Operations</span>
            </div>
            {openOperations ? <IoIosArrowUp /> : <IoIosArrowDown />}
          </div>

          {/* Isi Dropdown */}
          <AnimatePresence>
            {openOperations && (
              <motion.div
                className="ps-3 border-start mt-3"
                style={{ borderColor: "#bdbdbd50" }}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >

                <Link
                  to={hasMenuAccess(user.uid, "Invoice") ? "/invoice" : "#"}
                  className={`d-flex align-items-center gap-2 py-2 text-decoration-none link-hover ${!hasMenuAccess(user.uid, "Invoice") ? "disabled-link" : ""
                    }`}
                  style={isActive("/invoice")}
                  onClick={(e) => {
                    if (!hasMenuAccess(user.uid, "Invoice")) e.preventDefault();
                  }}
                >
                  <FaFileInvoiceDollar />
                  <span className="fw-semibold">Invoice</span>
                </Link>
                <hr className="my-1" style={dividerStyle} />

                <Link
                  to={hasMenuAccess(user.uid, "Projects") ? "/project" : "#"}
                  className={`d-flex align-items-center gap-2 py-2 text-decoration-none link-hover ${!hasMenuAccess(user.uid, "Projects") ? "disabled-link" : ""
                    }`}
                  style={isActive("/project")}
                  onClick={(e) => {
                    if (!hasMenuAccess(user.uid, "Projects")) e.preventDefault();
                  }}
                >
                  <MdDashboard />
                  <span className="fw-semibold">Projects</span>
                </Link>
                <hr className="my-1" style={dividerStyle} />

                <Link
                  to={hasMenuAccess(user.uid, "SPK") ? "/spk" : "#"}
                  className={`d-flex align-items-center gap-2 py-2 text-decoration-none link-hover ${!hasMenuAccess(user.uid, "SPK") ? "disabled-link" : ""
                    }`}
                  style={isActive("/spk")}
                  onClick={(e) => {
                    if (!hasMenuAccess(user.uid, "SPK")) e.preventDefault();
                  }}
                >
                  <FaRegFileAlt />
                  <span className="fw-semibold">SPK</span>
                </Link>
                <hr className="my-1" style={dividerStyle} />

                <Link
                  to={hasMenuAccess(user.uid, "Category") ? "/category" : "#"}
                  className={`d-flex align-items-center gap-2 py-2 text-decoration-none link-hover ${!hasMenuAccess(user.uid, "Category") ? "disabled-link" : ""
                    }`}
                  style={isActive("/category")}
                  onClick={(e) => {
                    if (!hasMenuAccess(user.uid, "Category")) e.preventDefault();
                  }}
                >
                  <SiWikibooks />
                  <span className="fw-semibold">Category</span>
                </Link>
                <hr className="my-1" style={dividerStyle} />

                <Link
                  to={hasMenuAccess(user.uid, "Todo") ? "/todo" : "#"}
                  className={`d-flex align-items-center gap-2 py-2 text-decoration-none link-hover ${!hasMenuAccess(user.uid, "Todo") ? "disabled-link" : ""
                    }`}
                  style={isActive("/todo")}
                  onClick={(e) => {
                    if (!hasMenuAccess(user.uid, "Todo")) e.preventDefault();
                  }}
                >
                  <LuClipboardList />
                  <span className="fw-semibold">To Do</span>
                </Link>
                <hr className="my-1" style={dividerStyle} />

                <Link
                  to={hasMenuAccess(user.uid, "Books") ? "/books" : "#"}
                  className={`d-flex align-items-center gap-2 py-2 text-decoration-none link-hover ${!hasMenuAccess(user.uid, "Books") ? "disabled-link" : ""
                    }`}
                  style={isActive("/books")}
                  onClick={(e) => {
                    if (!hasMenuAccess(user.uid, "Books")) e.preventDefault();
                  }}
                >
                  <BsBook />
                  <span className="fw-semibold">Books</span>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Divider style={{ borderColor: theme == "light" ? '#bdbdbd' : '#313a51', color: theme == "light" ? '#bdbdbd' : '#313a51' }} />

        <div className="w-100">
          {/* Root Menu */}
          <div
            className="d-flex align-items-center justify-content-between rounded mb-2 link-hover"
            role="button"
            onClick={() => setOpenFinance(!openFinance)}
            style={
              ["/accounting", "/stock", "/assets"].some((path) => location.pathname.startsWith(path))
                ? { color: "#234dba", fontWeight: 600 }
                : { color: globalTheme === "light" ? "black" : "white" }
            }
          >
            <div className="d-flex align-items-center gap-2">
              <GiMoneyStack />
              <span className="fw-semibold">Finance</span>
            </div>
            {openFinance ? <IoIosArrowUp /> : <IoIosArrowDown />}
          </div>

          {/* Isi Dropdown */}
          <AnimatePresence>
            {openFinance && (
              <motion.div
                className="ps-3 border-start mt-3"
                style={{ borderColor: "#bdbdbd50" }}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <Link
                  to={hasMenuAccess(user.uid, "Accounting") ? "/accounting" : "#"}
                  className={`d-flex align-items-center gap-2 py-2 text-decoration-none link-hover ${!hasMenuAccess(user.uid, "Accounting") ? "disabled-link" : ""
                    }`}
                  style={isActive("/accounting")}
                  onClick={(e) => {
                    if (!hasMenuAccess(user.uid, "Accounting")) e.preventDefault();
                  }}
                >
                  <BsCurrencyDollar />
                  <span className="fw-semibold">Accounting</span>
                </Link>
                <hr className="my-1" style={dividerStyle} />

                <Link
                  to={hasMenuAccess(user.uid, "Stocks") ? "/stock" : "#"}
                  className={`d-flex align-items-center gap-2 py-2 text-decoration-none link-hover ${!hasMenuAccess(user.uid, "Stocks") ? "disabled-link" : ""
                    }`}
                  style={isActive("/stock")}
                  onClick={(e) => {
                    if (!hasMenuAccess(user.uid, "Stocks")) e.preventDefault();
                  }}
                >
                  <MdWarehouse />
                  <span className="fw-semibold">Stocks</span>
                </Link>
                <hr className="my-1" style={dividerStyle} />

                <Link
                  to={hasMenuAccess(user.uid, "Assets") ? "/assets" : "#"}
                  className={`d-flex align-items-center gap-2 py-2 text-decoration-none link-hover ${!hasMenuAccess(user.uid, "Assets") ? "disabled-link" : ""
                    }`}
                  style={isActive("/assets")}
                  onClick={(e) => {
                    if (!hasMenuAccess(user.uid, "Assets")) e.preventDefault();
                  }}
                >
                  <FaChartBar />
                  <span className="fw-semibold">Assets</span>
                </Link>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Divider style={{ borderColor: theme == "light" ? '#bdbdbd' : '#313a51', color: theme == "light" ? '#bdbdbd' : '#313a51' }} />

        <div className="w-100">
          {/* Root Menu */}
          <div
            className="d-flex align-items-center justify-content-between rounded mb-2 link-hover"
            role="button"
            onClick={() => setOpenArchive(!openArchive)}
            style={
              ["/catalog", "/products", "/pricelist"].some((path) => location.pathname.startsWith(path))
                ? { color: "#234dba", fontWeight: 600 }
                : { color: globalTheme === "light" ? "black" : "white" }
            }
          >
            <div className="d-flex align-items-center gap-2">
              <BiArchive />
              <span className="fw-semibold">Archive</span>
            </div>
            {openArchive ? <IoIosArrowUp /> : <IoIosArrowDown />}
          </div>

          {/* Isi Dropdown */}
          <AnimatePresence>
            {openArchive && (
              <motion.div
                className="ps-3 border-start mt-3"
                style={{ borderColor: "#bdbdbd50" }}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <Link
                  to={hasMenuAccess(user.uid, "Catalog") ? "/catalog" : "#"}
                  className={`d-flex align-items-center gap-2 py-2 text-decoration-none link-hover ${!hasMenuAccess(user.uid, "Catalog") ? "disabled-link" : ""
                    }`}
                  style={isActive("/catalog")}
                  onClick={(e) => {
                    if (!hasMenuAccess(user.uid, "Catalog")) e.preventDefault();
                  }}
                >
                  <FaRegFolderOpen />
                  <span className="fw-semibold">Catalog</span>
                </Link>
                <hr className="my-1" style={dividerStyle} />

                <Link
                  to={hasMenuAccess(user.uid, "Products") ? "/products" : "#"}
                  className={`d-flex align-items-center gap-2 py-2 text-decoration-none link-hover ${!hasMenuAccess(user.uid, "Products") ? "disabled-link" : ""
                    }`}
                  style={isActive("/products")}
                  onClick={(e) => {
                    if (!hasMenuAccess(user.uid, "Products")) e.preventDefault();
                  }}
                >
                  <MdChair />
                  <span className="fw-semibold">Products</span>
                </Link>
                <hr className="my-1" style={dividerStyle} />

                <Link
                  to={hasMenuAccess(user.uid, "Price List") ? "/pricelist" : "#"}
                  className={`d-flex align-items-center gap-2 py-2 text-decoration-none link-hover ${!hasMenuAccess(user.uid, "Price List") ? "disabled-link" : ""
                    }`}
                  style={isActive("/pricelist")}
                  onClick={(e) => {
                    if (!hasMenuAccess(user.uid, "Price List")) e.preventDefault();
                  }}
                >
                  <ImPriceTags />
                  <span className="fw-semibold">Price List</span>
                </Link>
                <hr className="my-1" style={dividerStyle} />

                <Link
                  to="/testimoni-lama"
                  className="d-flex align-items-center gap-2 py-2 text-decoration-none link-hover"
                  style={isActive("/testimoni-lama")}
                >
                  <BiArchive />
                  <span className="fw-semibold">Testimoni Lama</span>
                </Link>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Divider style={{ borderColor: theme == "light" ? '#bdbdbd' : '#313a51', color: theme == "light" ? '#bdbdbd' : '#313a51' }} />

        <div className="w-100">
          {/* Root Menu */}
          <div
            className="d-flex align-items-center justify-content-between rounded mb-2 link-hover"
            role="button"
            onClick={() => setOpenManagement(!openManagement)}
            style={
              ["/user-management", "/appraisal"].some((path) => location.pathname.startsWith(path))
                ? { color: "#234dba", fontWeight: 600 }
                : { color: globalTheme === "light" ? "black" : "white" }
            }
          >
            <div className="d-flex align-items-center gap-2">
              <FaRegIdBadge />
              <span className="fw-semibold">Management</span>
            </div>
            {openManagement ? <IoIosArrowUp /> : <IoIosArrowDown />}
          </div>

          {/* Isi Dropdown */}
          <AnimatePresence>
            {openManagement && (
              <motion.div
                className="ps-3 border-start mt-3"
                style={{ borderColor: "#bdbdbd50" }}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <Link
                  to={
                    user.uid === 'w4M5JJjgGQeHFbS2nkyoCfUBE532' ||
                      user.uid === 'fYpdHwXRDLhj5XGxM5FZIAvxp9E2'
                      ? "/user-management"
                      : "#"
                  }
                  className={`d-flex align-items-center gap-2 py-2 text-decoration-none link-hover ${!(user.uid === 'w4M5JJjgGQeHFbS2nkyoCfUBE532' ||
                    user.uid === 'fYpdHwXRDLhj5XGxM5FZIAvxp9E2')
                    ? "disabled-link"
                    : ""
                    }`}
                  style={isActive("/user-management")}
                  onClick={(e) => {
                    if (!(
                      user.uid === 'w4M5JJjgGQeHFbS2nkyoCfUBE532' ||
                      user.uid === 'fYpdHwXRDLhj5XGxM5FZIAvxp9E2'
                    )) e.preventDefault();
                  }}
                >
                  <IoPeople />
                  <span className="fw-semibold">User Management</span>
                </Link>
                <hr className="my-1" style={dividerStyle} />

                <Link
                  to={hasMenuAccess(user.uid, "Appraisal") ? "/appraisal" : "#"}
                  className={`d-flex align-items-center gap-2 py-2 text-decoration-none link-hover ${!hasMenuAccess(user.uid, "Appraisal") ? "disabled-link" : ""
                    }`}
                  style={isActive("/appraisal")}
                  onClick={(e) => {
                    if (!hasMenuAccess(user.uid, "Appraisal")) e.preventDefault();
                  }}
                >
                  <BsFillPersonVcardFill />
                  <span className="fw-semibold">Appraisal</span>
                </Link>


              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Divider style={{ borderColor: theme == "light" ? '#bdbdbd' : '#313a51', color: theme == "light" ? '#bdbdbd' : '#313a51' }} />

        <div className="w-100">
          {/* Root Menu */}
          <div
            className="d-flex align-items-center justify-content-between rounded mb-2 link-hover"
            role="button"
            onClick={() => setOpenSystem(!openSystem)}
            style={{
              color: globalTheme === "light" ? "black" : "white",
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <FaGear />
              <span className="fw-semibold">System</span>
            </div>
            {openSystem ? <IoIosArrowUp /> : <IoIosArrowDown />}
          </div>

          {/* Isi Dropdown */}
          <AnimatePresence>
            {openSystem && (
              <motion.div
                className="ps-3 border-start mt-3"
                style={{ borderColor: "#bdbdbd50" }}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {/* THEME */}
                <div className="d-flex align-items-center justify-content-between gap-2 py-2 link-hover">
                  <div className="d-flex align-items-center gap-2" style={{ color: globalTheme === "light" ? "black" : "white" }}>
                    <FaPaintBrush />
                    <span className="fw-semibold">Theme</span>
                  </div>
                  <Switch
                    checkedChildren="Light"
                    unCheckedChildren="Dark"
                    checked={theme === "light"}
                    onChange={handleThemeChange}
                    size="small"
                  />
                </div>
                <hr className="my-1" style={dividerStyle} />

                {/* DEVELOPER MODE */}
                <div
                  className={`d-flex align-items-center justify-content-between gap-2 py-2 link-hover ${user.uid !== "w4M5JJjgGQeHFbS2nkyoCfUBE532" ? "disabled-link" : ""
                    }`}
                >
                  <div className="d-flex align-items-center gap-2" style={{ color: globalTheme === "light" ? "black" : "white" }}>
                    <FaCode />
                    <span className="fw-semibold">Developer Mode</span>
                  </div>
                  <Switch
                    checkedChildren="On"
                    unCheckedChildren="Off"
                    checked={developerMode === "on"}
                    onChange={handleDeveloperModeChange}
                    size="small"
                    disabled={user.uid !== "w4M5JJjgGQeHFbS2nkyoCfUBE532"}
                  />
                </div>
                <hr className="my-1" style={dividerStyle} />

                {/* IMAGE SOURCE */}
                <div
                  className={`d-flex align-items-center justify-content-between gap-2 py-2 link-hover ${user.uid !== "w4M5JJjgGQeHFbS2nkyoCfUBE532" ? "disabled-link" : ""
                    }`}
                >
                  <div className="d-flex align-items-center gap-2" style={{ color: globalTheme === "light" ? "black" : "white" }}>
                    <FaRegImages />
                    <span className="fw-semibold">Image Source</span>
                  </div>
                  <Switch
                    checkedChildren="Local"
                    unCheckedChildren="Server"
                    checked={localImageMode === "local"}
                    onChange={handleLocalImageModeChange}
                    size="small"
                    disabled={user.uid !== "w4M5JJjgGQeHFbS2nkyoCfUBE532"}
                  />
                </div>
                <hr className="my-1" style={dividerStyle} />

                <div
                  className="d-flex align-items-center gap-2 py-2 text-decoration-none link-hover"
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowLogsModal(true)}
                >
                  <MdUpdate />
                  <span className="fw-semibold">Update Logs</span>
                </div>


              </motion.div>
            )}
          </AnimatePresence>
        </div>



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
              <ImPriceTags /> <p className='fw-semibold' style={{ margin: 0, paddingLeft: '10px' }}>Price List</p>
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

        {hasMenuAccess(user.uid, "Catalog") && (
          <>
            <Link to="/catalog" style={{ textDecoration: 'none', color: location.pathname.startsWith('/catalog') ? '#234dba' : (globalTheme === "light" ? "black" : "white"), display: 'flex', alignItems: 'center' }} className='d-flex mb-4 mt-4 link-hover'>
              <FaRegFolderOpen /> <p className='fw-semibold' style={{ margin: 0, paddingLeft: '10px' }}>Catalog</p>
            </Link>
            <Divider style={{ borderColor: theme == "light" ? '#bdbdbd' : '#313a51', color: theme == "light" ? '#bdbdbd' : '#313a51' }} />
          </>
        )}


        {hasMenuAccess(user.uid, "Books") && (
          <>
            <Link to="/books" style={{ textDecoration: 'none', color: location.pathname.startsWith('/books') ? '#234dba' : (globalTheme === "light" ? "black" : "white"), display: 'flex', alignItems: 'center' }} className='d-flex mb-4 link-hover'>
              <BsBook /> <p className='fw-semibold' style={{ margin: 0, paddingLeft: '10px' }}>Books</p>
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
