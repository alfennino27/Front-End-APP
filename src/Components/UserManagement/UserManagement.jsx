import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Col, Row, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useNavigate } from 'react-router-dom';
import '../Pekerjaan/pekerjaan.css';
import { MdFormatListBulletedAdd } from 'react-icons/md';
import { debounce } from 'lodash';
import { FaFileInvoice, FaPaste, FaSearch } from 'react-icons/fa';
import { CiEdit } from 'react-icons/ci';
import { Modal, Input, Select, Button, Image, Form, Typography, Space, Checkbox } from "antd";
const { Title } = Typography;
import { useTheme } from '../../ThemeContext';
import { getImageUrl } from '../../Utils/image';

const UserManagement = () => {
    const baseUrl = getApiBaseUrl();
    const { globalTheme } = useTheme();
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    useEffect(() => {
        const cekLogin = () => {
            if (user == null) {
                window.location.replace('/login');
            }
            if (user.uid === 'fYpdHwXRDLhj5XGxM5FZIAvxp9E2' || user.uid === 'w4M5JJjgGQeHFbS2nkyoCfUBE532') {
                console.log('success');
            } else {
                window.location.replace('/project');
            }
        };

        cekLogin();
    }, []);

    const isMobile = window.innerWidth <= 768;

    const [dataUsers, setDataUsers] = useState(null);
    const [showTambahUsersModal, setShowTambahUsersModal] = useState(null);
    const [showEditUsersModal, setShowEditUsersModal] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [userAccess, setUserAccess] = useState([]);


    // function pasteImage(modal) {
    //   navigator.clipboard.read().then(clipboardItems => {
    //     clipboardItems.forEach(item => {
    //       if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
    //         item.getType('image/png').then(blob => {
    //           const file = new File([blob], 'pasted-image.png', { type: 'image/png' });
    //           const dataTransfer = new DataTransfer();
    //           dataTransfer.items.add(new File([blob], 'pasted-image.png', { type: 'image/png' }));
    //           const inputElement = document.querySelector('input[type="file"]');
    //           inputElement.files = dataTransfer.files;
    //           if (modal == "addProduct") {
    //             setGambar(file);
    //           }
    //         });
    //       }
    //     });
    //   });
    // }

    const fetchDataUsers = async () => {
        try {
            const res = await fetch(`${baseUrl}/users/all/get`);
            if (!res.ok) throw new Error('Gagal mengambil data user');

            const data = await res.json();
            setDataUsers(data);
            // console.log(data);
        } catch (err) {
            console.error('Error saat mengambil data user:', err.message);
        }
    };


    useEffect(() => {
        fetchDataUsers();
    }, []);


    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        profilePicture: ""
    });

    const [formRegister, setFormRegister] = useState({ name: "", email: "", password: "", profilePicture: "" });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };


    const handleSubmit = () => {
        console.log("User registered: ", formData);
        setShowTambahUsersModal(false);
    };

    // const handleDelete = () => {
    //   console.log("User deleted");
    //   setShowTambahUsersModal(false);
    // };

    const handleRegister = async (e) => {
        e.preventDefault();
        setShowTambahUsersModal(false);

        const formData = new FormData();
        formData.append('name', formRegister.name);
        formData.append('email', formRegister.email);
        formData.append('password', formRegister.password);
        if (formRegister.profilePicture) {
            formData.append('profilePicture', formRegister.profilePicture);
        }

        try {
            const res = await fetch(`${baseUrl}/register`, {
                method: 'POST',
                body: formData
            });

            const result = await res.json();
            if (res.ok) {
                alert('Register berhasil!');
                console.log(result);
                fetchDataUsers();
            } else {
                alert(result.message || 'Gagal register');
            }
        } catch (err) {
            console.error('Error saat register:', err);
            alert('Terjadi kesalahan');
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('id', formData.id);
            formDataToSend.append('name', formData.name);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('password', formData.password);

            if (formData.profilePicture) {
                formDataToSend.append('profilePicture', formData.profilePicture);
            }

            const response = await fetch(`${baseUrl}/user/update`, {
                method: 'POST',
                body: formDataToSend,
            });

            if (!response.ok) throw new Error('Gagal update user');

            const data = await response.json();
            console.log('User updated:', data);

            setShowEditUsersModal(false);
            fetchDataUsers(); // refresh list
        } catch (err) {
            console.error('Error updating user:', err);
        }
    };

    const handleDeleteUser = async () => {
        if (!formData.id) return alert("ID user tidak ditemukan");

        const confirmDelete = window.confirm("Apakah kamu yakin ingin menghapus user ini?");
        if (!confirmDelete) return;

        try {
            const response = await fetch(`${baseUrl}/user/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: formData.id }),
            });

            if (!response.ok) throw new Error('Gagal hapus user');

            const data = await response.json();
            console.log('User deleted:', data);

            setShowEditUsersModal(false);
            fetchDataUsers(); // refresh list
        } catch (err) {
            console.error('Error deleting user:', err);
        }
    };

    const handleCheckboxChange = async (uid, menu, value) => {
        try {
            const res = await fetch(`${baseUrl}/useraccess/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid, menu, value }),
            });

            if (!res.ok) throw new Error('Gagal update akses');

            const data = await res.json();
            fetchDataUsers();
            console.log('Akses berhasil diupdate:', data);
        } catch (err) {
            console.error('Error update akses:', err);
        }
    };



    const fetchUserAccess = async () => {
        try {
            const res = await fetch(`${baseUrl}/useraccess/get`);
            const data = await res.json();
            setUserAccess(data);
        } catch (err) {
            console.error('Error fetching appraisal:', err);
        }
    };

    useEffect(() => {
        fetchUserAccess();
    }, [dataUsers]);

    const getCheckboxState = (uid, menu) => {
        const access = userAccess.find(a => a.uid === uid && a.menu === menu);
        return access ? access.value : false;
    };


    return (
        <>
            <Container>
                <Col md={12} className='lowonganPekerjaan  pekerjaan px-2'>


                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        position: 'sticky',
                        ...(isMobile ? { top: -1 } : { top: 0 }),
                        zIndex: 1,
                        padding: '10px',
                        color: globalTheme === "light" ? "black" : 'white',
                        transition: "background-color 1s ease",
                    }}>
                        <h4 style={{ margin: 0 }}>User Management</h4>


                        <MdFormatListBulletedAdd style={{ marginLeft: "10px", marginBottom: "3px", cursor: "pointer" }} size={25} onClick={() => { setShowTambahUsersModal(true); }}
                        />
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
                                    <th style={{ paddingY: '12px', color: "#354985" }}>Name</th>
                                    <th style={{ paddingY: '12px', color: "#354985" }}>Profile Picture</th>
                                    <th style={{ paddingY: '12px', color: "#354985" }}>Access</th>
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
                                {Array.isArray(dataUsers) && dataUsers.length > 0 ? (
                                    <>
                                        {dataUsers.map((item, index) => {
                                            return (
                                                <tr key={index}
                                                    style={{
                                                        borderBottom: '1px solid #eee',
                                                        transition: 'background 0.2s',
                                                        cursor: 'pointer',
                                                        display: 'table',
                                                        width: '100%',
                                                        tableLayout: 'fixed'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f3f5'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    onClick={() => {
                                                        setFormData({
                                                            name: item.name || '',
                                                            email: item.email || '',
                                                            password: '', // kosongkan biar gak autofill password lama
                                                            profilePicture: null, // kosongkan input file (gak bisa pre-fill file input)
                                                            id: item.id || item._id || '', // kalau kamu pakai ID
                                                        });
                                                        setShowEditUsersModal(true);
                                                    }}

                                                >
                                                    <td style={{ padding: '12px' }}>{index + 1}</td>
                                                    <td>{item.name}</td>
                                                    <td>
                                                        {item.profilePicture && (
                                                            <span onClick={(e) => { e.stopPropagation(); }}>
                                                                <Image
                                                                    width={100}
                                                                    height={100}
                                                                    src={getImageUrl(item.profilePicture)}
                                                                    style={{ borderRadius: '6px', objectFit: 'cover' }}
                                                                />
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td onClick={(e) => e.stopPropagation()}>
                                                        <div style={{ maxHeight: '15vh', overflowY: 'auto' }}>
                                                            <Checkbox
                                                                checked={getCheckboxState(item.uid, "Dashboard")}
                                                                onChange={(e) => handleCheckboxChange(item.uid, "Dashboard", e.target.checked)}
                                                            >Dashboard</Checkbox><br />
                                                            <Checkbox
                                                                checked={getCheckboxState(item.uid, "Invoice")}
                                                                onChange={(e) => handleCheckboxChange(item.uid, "Invoice", e.target.checked)}
                                                            >Invoice</Checkbox><br />
                                                            <Checkbox
                                                                checked={getCheckboxState(item.uid, "Projects")}
                                                                onChange={(e) => handleCheckboxChange(item.uid, "Projects", e.target.checked)}
                                                            >Projects</Checkbox><br />
                                                            <Checkbox
                                                                checked={getCheckboxState(item.uid, "Category")}
                                                                onChange={(e) => handleCheckboxChange(item.uid, "Category", e.target.checked)}
                                                            >Category</Checkbox><br />
                                                            <Checkbox
                                                                checked={getCheckboxState(item.uid, "Todo")}
                                                                onChange={(e) => handleCheckboxChange(item.uid, "Todo", e.target.checked)}
                                                            >To Do</Checkbox><br />
                                                            <Checkbox
                                                                checked={getCheckboxState(item.uid, "Price List")}
                                                                onChange={(e) => handleCheckboxChange(item.uid, "Price List", e.target.checked)}
                                                            >Price List</Checkbox><br />
                                                            <Checkbox
                                                                checked={getCheckboxState(item.uid, "Appraisal")}
                                                                onChange={(e) => handleCheckboxChange(item.uid, "Appraisal", e.target.checked)}
                                                            >Appraisal</Checkbox><br />
                                                            <Checkbox
                                                                checked={getCheckboxState(item.uid, "Calendar")}
                                                                onChange={(e) => handleCheckboxChange(item.uid, "Calendar", e.target.checked)}
                                                            >Calendar</Checkbox><br />
                                                            <Checkbox
                                                                checked={getCheckboxState(item.uid, "Notes")}
                                                                onChange={(e) => handleCheckboxChange(item.uid, "Notes", e.target.checked)}
                                                            >Notes</Checkbox><br />
                                                            <Checkbox
                                                                checked={getCheckboxState(item.uid, "Catalog")}
                                                                onChange={(e) => handleCheckboxChange(item.uid, "Catalog", e.target.checked)}
                                                            >Catalog</Checkbox><br />
                                                            <Checkbox
                                                                checked={getCheckboxState(item.uid, "Books")}
                                                                onChange={(e) => handleCheckboxChange(item.uid, "Books", e.target.checked)}
                                                            >Books</Checkbox><br />
                                                            <Checkbox
                                                                checked={getCheckboxState(item.uid, "CRM")}
                                                                onChange={(e) => handleCheckboxChange(item.uid, "CRM", e.target.checked)}
                                                            >CRM</Checkbox><br />
                                                            <Checkbox
                                                                checked={getCheckboxState(item.uid, "Knowledge")}
                                                                onChange={(e) => handleCheckboxChange(item.uid, "Knowledge", e.target.checked)}
                                                            >Knowledge Base</Checkbox><br />
                                                            <Checkbox
                                                                checked={getCheckboxState(item.uid, "SPK")}
                                                                onChange={(e) => handleCheckboxChange(item.uid, "SPK", e.target.checked)}
                                                            >SPK</Checkbox><br />
                                                            <Checkbox
                                                                checked={getCheckboxState(item.uid, "Accounting")}
                                                                onChange={(e) => handleCheckboxChange(item.uid, "Accounting", e.target.checked)}
                                                            >Accounting</Checkbox><br />
                                                            <Checkbox
                                                                checked={getCheckboxState(item.uid, "Stocks")}
                                                                onChange={(e) => handleCheckboxChange(item.uid, "Stocks", e.target.checked)}
                                                            >Stocks</Checkbox><br />
                                                            <Checkbox
                                                                checked={getCheckboxState(item.uid, "Assets")}
                                                                onChange={(e) => handleCheckboxChange(item.uid, "Assets", e.target.checked)}
                                                            >Assets</Checkbox><br />
                                                            <Checkbox
                                                                checked={getCheckboxState(item.uid, "Products")}
                                                                onChange={(e) => handleCheckboxChange(item.uid, "Products", e.target.checked)}
                                                            >Products</Checkbox><br />
                                                            <Checkbox
                                                                checked={getCheckboxState(item.uid, "KLF AI")}
                                                                onChange={(e) => handleCheckboxChange(item.uid, "KLF AI", e.target.checked)}
                                                            >KLF AI</Checkbox><br />
                                                            <Checkbox
                                                                checked={getCheckboxState(item.uid, "Delivery Tracker")}
                                                                onChange={(e) => handleCheckboxChange(item.uid, "Delivery Tracker", e.target.checked)}
                                                            >Delivery Tracker</Checkbox><br />
                                                            <Checkbox
                                                                disabled
                                                                checked={["fYpdHwXRDLhj5XGxM5FZIAvxp9E2", "w4M5JJjgGQeHFbS2nkyoCfUBE532"].includes(item.uid)}
                                                            >
                                                                User Management
                                                            </Checkbox>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </>
                                ) : (
                                    <tr style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No data available</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>










                </Col>
            </Container>


            <Modal
                title={<Title level={3} style={{ textAlign: "center" }}>Register User</Title>}
                open={showTambahUsersModal}
                onCancel={() => setShowTambahUsersModal(false)}
                centered
                width={400}
                footer={null}
            >


                <form onSubmit={handleRegister}>
                    <div className='mb-4'>
                        <label className="mb-1">Name</label>
                        <Input
                            type="text"
                            name="name"
                            placeholder="Enter your name"
                            value={formRegister.name}
                            onChange={(e) => setFormRegister({ ...formRegister, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className='mb-4'>
                        <label className="mb-1">Email</label>
                        <Input
                            type="text"
                            name="email"
                            placeholder="Enter your email"
                            value={formRegister.email}
                            onChange={(e) => setFormRegister({ ...formRegister, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className='mb-4'>
                        <label className="mb-1">Password</label>
                        <Input
                            type="password"
                            name="password"
                            placeholder="Enter your password"
                            value={formRegister.password}
                            onChange={(e) => setFormRegister({ ...formRegister, password: e.target.value })}
                            required
                        />
                    </div>
                    <div className='mb-4'>
                        <label className="mb-1">Foto Profil</label>
                        <Input
                            type="file"
                            name="profilePicture"
                            accept="image/*"
                            onChange={(e) => setFormRegister({ ...formRegister, profilePicture: e.target.files[0] })}
                        />
                    </div>


                    <div className="d-flex justify-content-between mt-3">
                        <Button type="primary" danger>Delete</Button>
                        <Button type="primary" htmlType="submit">Submit</Button>
                    </div>
                </form>


            </Modal>

            <Modal
                title={<Title level={3} style={{ textAlign: "center" }}>Edit User</Title>}
                open={showEditUsersModal}
                onCancel={() => setShowEditUsersModal(false)}
                width={400}
                footer={null}
                centered
            >
                <form onSubmit={handleUpdateUser}>
                    <div className='mb-4'>
                        <label className="mb-1">Name</label>
                        <Input
                            type="text"
                            name="name"
                            placeholder="Enter your name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className='mb-4'>
                        <label className="mb-1">Email</label>
                        <Input
                            type="text"
                            name="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className='mb-4'>
                        <label className="mb-1">Password</label>
                        <Input
                            type="password"
                            name="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <div className='mb-4'>
                        <label className="mb-1">Foto Profil</label>
                        <Input
                            type="file"
                            name="profilePicture"
                            accept="image/*"
                            onChange={(e) => setFormData({ ...formData, profilePicture: e.target.files[0] })}
                        />
                    </div>


                    <div className="d-flex justify-content-between mt-3">
                        <Button type="primary" danger onClick={handleDeleteUser}>Delete</Button>
                        <Button type="primary" htmlType="submit">Submit</Button>
                    </div>
                </form>
            </Modal>

        </>
    );
};



export default UserManagement;