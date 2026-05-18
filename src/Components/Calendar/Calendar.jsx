import React, { useEffect, useState } from 'react';
import { Col, Row, Container } from 'react-bootstrap';
import { Badge, Calendar, Modal, Spin } from 'antd';
// import '../Calendar/Calendar.css';
import { useTheme } from '../../ThemeContext';
import { getApiBaseUrl } from '../../Config/APIurl';

const ProjectCalendar = () => {
    const baseUrl = getApiBaseUrl();

    const { globalTheme } = useTheme();
    useEffect(() => {
        if (globalTheme === "dark") {
            import('../Calendar/Calendar.css');
        } else {
            import('../Calendar/Calendar.css');
        }
    }, [globalTheme]);

    const [dataProjectFromDB, setDataProjectFromDB] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalData, setModalData] = useState([]);
    const [loading, setLoading] = useState(true); // State untuk loading

    const fetchDataProjects = async () => {
        setLoading(true); // Mulai loading
        try {
            const res = await fetch(`${baseUrl}/calendar/project/get`);
            const json = await res.json();

            if (json.success) {
                setDataProjectFromDB(json.data);
            } else {
                console.error("Gagal ambil data project:", json.error);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false); // Selesai loading
        }
    };


    useEffect(() => {
        fetchDataProjects();
    }, []);

    const getListData = (value) => {
        let listData = [];
        const dateString = value.format('YYYY-MM-DD'); // Format tanggal yang dirender

        // Cek setiap project untuk melihat apakah Deadline cocok
        dataProjectFromDB.forEach(project => {
            if (project.Deadline === dateString) {
                const type = project.Status === 'Completed' ? 'success' : 'warning'; // Tentukan type berdasarkan Status
                listData.push({
                    type: type,
                    content: project.NamaBarang,
                    projectData: project // Simpan data proyek lengkap
                });
            }
        });

        return listData || [];
    };

    const showModal = (date) => {
        const dateString = date.format('YYYY-MM-DD');
        const projectsOnDate = dataProjectFromDB.filter(project => project.Deadline === dateString);
        setModalData(projectsOnDate);
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const showMonthModal = (value) => {
        const startOfMonth = value.startOf('month').format('YYYY-MM-DD');
        const endOfMonth = value.endOf('month').format('YYYY-MM-DD');

        // Filter data proyek berdasarkan bulan dan status
        const projectsInMonth = dataProjectFromDB.filter(project => {
            const deadlineDate = project.Deadline;
            return deadlineDate >= startOfMonth && deadlineDate <= endOfMonth;
        });

        setModalData(projectsInMonth);
        setIsModalVisible(true);
    };

    const monthCellRender = (value) => {
        const itemCount = getCountOfProjectsInMonth(value);
        const ongoingCount = getCountOfProjectsInMonthByStatus(value, 'Ongoing');
        const completedCount = getCountOfProjectsInMonthByStatus(value, 'Completed');

        return (
            <div className="notes-month" onClick={() => showMonthModal(value)} style={{ cursor: 'pointer' }}>
                <section><strong>Total :</strong> {itemCount} barang</section>
                <section><strong style={{ color: "orange" }}>Ongoing :</strong> {ongoingCount} barang</section>
                <section><strong style={{ color: "green" }}>Completed :</strong> {completedCount} barang</section>
            </div>
        );
    };

    const getCountOfProjectsInMonth = (value) => {
        const startOfMonth = value.startOf('month').format('YYYY-MM-DD');
        const endOfMonth = value.endOf('month').format('YYYY-MM-DD');

        return dataProjectFromDB.filter(project => {
            const deadlineDate = project.Deadline;
            return deadlineDate >= startOfMonth && deadlineDate <= endOfMonth;
        }).length;
    };

    const getCountOfProjectsInMonthByStatus = (value, status) => {
        const startOfMonth = value.startOf('month').format('YYYY-MM-DD');
        const endOfMonth = value.endOf('month').format('YYYY-MM-DD');

        return dataProjectFromDB.filter(project => {
            const deadlineDate = project.Deadline;
            return deadlineDate >= startOfMonth && deadlineDate <= endOfMonth && project.Status === status;
        }).length;
    };

    const truncateText = (text, length) => {
        return text.length > length ? text.substring(0, length) + '...' : text;
    };

    const dateCellRender = (value) => {
        const listData = getListData(value);
        return (
            <ul className="events" onClick={() => showModal(value)}>
                {loading ? ( // Menampilkan spinner saat loading
                    <Spin size="medium" />
                ) : (
                    listData.map((item) => (
                        <li key={item.projectData.id}>
                            <Badge status={item.type} text={truncateText(item.content, 15)} />
                        </li>
                    ))
                )}
            </ul>
        );
    };


    const cellRender = (current, info) => {
        if (info.type === 'date') return dateCellRender(current);
        if (info.type === 'month') return monthCellRender(current);
        return info.originNode;
    };

    return (
        <>
            <Container>
                <Row>
                    <Col md={12} className='lowonganPekerjaan overflow-auto pekerjaan'>
                        <Calendar cellRender={cellRender} />
                    </Col>
                </Row>
            </Container>

            <Modal
                title="Barang Deadline"
                visible={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                style={{ maxHeight: '70vh' }} // Set maxHeight for the modal
            >
                <div style={{ maxHeight: '70vh', overflowY: 'auto' }}> {/* Add this div for scrolling */}
                    {modalData.length > 0 ? (
                        modalData.map((project) => (
                            <div key={project.id} style={{ display: 'flex', alignItems: 'center', marginTop: "20px", cursor: "pointer" }} onClick={() => window.open(`/project/${project.id}`, '_blank')}>
                                <img
                                    src={project.image1}
                                    alt={project.NamaBarang}
                                    style={{ width: '100px', height: '100px', marginRight: '10px' }}
                                />
                                <div>
                                    <span><strong>Nama Barang:</strong> {project.NamaBarang}</span><br />
                                    <span><strong>Buyer:</strong> {project.Buyer}</span><br />
                                    <span><strong>Deadline:</strong> {new Date(project.Deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span><br />
                                    <span><strong>Status:</strong> <span style={{ color: project.Status === "Completed" ? "green" : "orange" }}>{project.Status}</span><span style={{ display: project.Status == "Completed" ? "none" : "" }}> ({project.Percentage}%)</span></span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>Tidak ada barang.</p>
                    )}
                </div>
            </Modal>


        </>
    );
};

export default ProjectCalendar;
