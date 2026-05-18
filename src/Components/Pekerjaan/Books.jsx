import { Col, Row, Modal, Button, Container } from 'react-bootstrap';
import '../Pekerjaan/pekerjaan.css';
import { MdOutlineLocationOn } from 'react-icons/md';
import { Link } from 'react-router-dom';
import dataPekerjaan from '../../assets/data/datapekerjaan';
import { FaSearch } from 'react-icons/fa';
import React, { useRef, useEffect, useState } from 'react';
import { MdFormatListBulletedAdd } from 'react-icons/md';
import { getApiBaseUrl } from '../../Config/APIurl';

const Books = () => {
  const baseUrl = getApiBaseUrl();
  const [showCompleted, setShowCompleted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isIconBlue, setIsIconBlue] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [columnText, setColumnText] = useState('');
  const [textData, setTextData] = useState('');
  const [Projects, setProjects] = useState([]);
  const [filteredData, setFilteredData] = useState([]);


  const isMobile = window.innerWidth <= 768;

  const handleSearchClick = () => {
    setShowSearch(!showSearch);
    setIsIconBlue(!isIconBlue);
  };

  const handleShowTextModal = (projectName, projectId, columnText, textData) => {
    setProjectName(projectName);
    setProjectId(projectId);
    setColumnText(columnText);
    setTextData(textData);
    setShowTextModal(true);
  };

  const handleCloseTextModal = () => {
    setShowTextModal(false);
  };

  const handleSubmitTextModal = async () => {
    setShowTextModal(false);

    try {
      const response = await fetch(`${baseUrl}/books/project/todo/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          columnText,
          textData,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error("Gagal update:", result.error);
        return;
      }

      console.log("Berhasil update:", result.message);
      fetchFilteredProjects();
    } catch (e) {
      console.error("Error updating project todo:", e);
    }
  };


  const fetchFilteredProjects = async () => {
    const statusFilter = showCompleted ? "Completed" : "Ongoing";
    try {
      const res = await fetch(`${baseUrl}/books/project/status/get?status=${statusFilter}`);
      if (!res.ok) throw new Error("Gagal fetch data");
      const data = await res.json();

      setProjects(data);
      setFilteredData(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  useEffect(() => {
    fetchFilteredProjects();
  }, [showCompleted]);


  useEffect(() => {
    setFilteredData(Projects.filter((item) => item.NamaBarang.toLowerCase().includes(searchTerm.toLowerCase()) || item.Buyer.toLowerCase().includes(searchTerm.toLowerCase())));
  }, [searchTerm]);

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

  return (
    <>
      <Container id="tidak-tercetak">
        <Row className="lowonganPekerjaan overflow-scroll pekerjaan">
          <Col md={4} style={{ position: 'sticky', top: 0, left: 0, zIndex: 2, backgroundColor: "#FFFFFF" }}>
            <h4
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                ...(isMobile ? { top: -1 } : { top: 0 }),
                backgroundColor: 'white',
                zIndex: 1,
                padding: '10px',
                cursor: 'pointer',
              }}
            >
              <span onClick={() => setShowCompleted(!showCompleted)} style={{ display: showSearch ? 'none' : 'block' }}>
                {showCompleted ? 'Completed Projects' : 'Ongoing Projects'}
              </span>
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ fontSize: '12px', borderRadius: '20px', padding: '5px', display: showSearch ? 'block' : 'none' }} />
              <div>
                <span style={{ fontSize: '20px', color: isIconBlue ? 'blue' : 'inherit' }} onClick={handleSearchClick}>
                  <FaSearch />
                </span>

              </div>
            </h4>



            {filteredData.map((project, index) => (
              <Row key={index}>
                <Col>
                  <Link to={`/project/${project.id}`}>
                    <div className="listPekerjaan d-flex position-relative mb-1 shadow">
                      <div className="me-3">
                        <img src={project.image1} alt="" style={{ width: '11vh', height: 'auto', borderRadius: '10px' }} />
                      </div>
                      <div>
                        <h5>{project.NamaBarang}</h5>
                        <h6>{project.Buyer}</h6>
                        <small>
                          <div className="progress" role="progressbar">
                            <div className="progress-bar" style={{ width: `${project.Percentage}%`, background: `linear-gradient(to left, #007bff, #00c6ff)` }}>
                              {project.Percentage}%
                            </div>
                          </div>
                        </small>
                      </div>
                      <small className="position-absolute bottom-0 end-0 p-3">Deadline : {new Date(project.Deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</small>
                    </div>
                  </Link>
                </Col>
              </Row>
            ))}
          </Col>
          <Col md={8} className="">
            <div className=" ">
              <div
                className="flex"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  position: 'sticky',
                  ...(isMobile ? { top: -1 } : { top: 0 }),
                  backgroundColor: 'white',
                  zIndex: 1,
                  cursor: 'pointer',
                  width: '3300px',
                  paddingTop: '10px',
                }}
              >
                <div className="d-flex gap-3 text-center">
                  <div style={{ width: '200px' }}>
                    <h4>Keterangan </h4>
                  </div>
                  <div style={{ width: '200px' }}>
                    <h4>Note Stainless</h4>
                  </div>
                  <div style={{ width: '200px' }}>
                    <h4>Note Besi</h4>
                  </div>
                  <div style={{ width: '200px' }}>
                    <h4>Note Kayu</h4>
                  </div>
                  <div style={{ width: '200px' }}>
                    <h4>Note Jok</h4>
                  </div>
                  <div style={{ width: '200px' }}>
                    <h4>Note Marmer</h4>
                  </div>
                  <div style={{ width: '200px' }}>
                    <h4>Note Kaca</h4>
                  </div>
                  <div style={{ width: '200px' }}>
                    <h4>Note Finishing</h4>
                  </div>
                  <div style={{ width: '200px' }}>
                    <h4>Note Rotan</h4>
                  </div>
                  <div style={{ width: '200px' }}>
                    <h4>Note Kain</h4>
                  </div>
                  <div style={{ width: '200px' }}>
                    <h4>Note Fiber</h4>
                  </div>
                  <div style={{ width: '200px' }}>
                    <h4>Note Veneer</h4>
                  </div>
                  <div style={{ width: '200px' }}>
                    <h4>Note Hardware</h4>
                  </div>
                  <div style={{ width: '200px' }}>
                    <h4>DL Asli</h4>
                  </div>
                  <div style={{ width: '200px' }}>
                    <h4>DL Susulan</h4>
                  </div>
                  <div style={{ width: '200px' }}>
                    <h4>Prio</h4>
                  </div>
                  <div style={{ width: '200px' }}>
                    <h4>Terkirim</h4>
                  </div>
                  <div style={{ width: '200px' }}>
                    <h4>Tgl Kirim</h4>
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: '10px' }}>
                {/* jangan dihapus, buat ngepasin ukuran */}
              </div>

              {filteredData.map((project, index) => (
                <div className="d-flex gap-3" style={{ width: '3300px' }} key={index}>
                  <div className="listPekerjaan d-flex align-items-center position-relative mb-1 overflow-auto shadow" style={{ width: '200px', textDecoration: 'none', backgroundColor: 'rgba(255, 255, 255, 1)' }} >
                    <small style={{ whiteSpace: 'pre-line', fontSize: '10px' }}><br />{project.Spesifikasi}<br /></small>
                  </div>
                  <div className="listPekerjaan d-flex align-items-center position-relative mb-1 overflow-auto shadow" onClick={() => handleShowTextModal(project.NamaBarang, project.id, 'Stainless', project.TodoStainless)} style={{ width: '200px', textDecoration: 'none', backgroundColor: project.CategoryStatusStainless === 'Belum Proses' ? 'rgba(255, 0, 0, 0.6)' : project.CategoryStatusStainless === 'Selesai' ? 'rgba(0, 255, 0, 0.6)' : project.CategoryStatusStainless === 'QC Pass' ? 'rgba(0, 0, 255, 0.6)' : project.CategoryStatusStainless === 'Proses' ? 'rgba(255, 255, 0, 0.6)' : project.CategoryStatusStainless === 'Ready Stock' ? 'rgba(128, 128, 128, 0.6)' : project.CategoryStatusStainless === 'Servis' ? 'rgba(255, 165, 0, 0.6)' : 'rgba(255, 255, 255, 1)' }}>
                    <small style={{ whiteSpace: 'pre-line', fontSize: '10px' }}><br />{project.TodoStainless}<br /></small>
                  </div>
                  <div className="listPekerjaan d-flex align-items-center position-relative mb-1 overflow-auto shadow" onClick={() => handleShowTextModal(project.NamaBarang, project.id, 'Besi', project.TodoBesi)} style={{ width: '200px', textDecoration: 'none', backgroundColor: project.CategoryStatusBesi === 'Belum Proses' ? 'rgba(255, 0, 0, 0.6)' : project.CategoryStatusBesi === 'Selesai' ? 'rgba(0, 255, 0, 0.6)' : project.CategoryStatusBesi === 'QC Pass' ? 'rgba(0, 0, 255, 0.6)' : project.CategoryStatusBesi === 'Proses' ? 'rgba(255, 255, 0, 0.6)' : project.CategoryStatusBesi === 'Ready Stock' ? 'rgba(128, 128, 128, 0.6)' : project.CategoryStatusBesi === 'Servis' ? 'rgba(255, 165, 0, 0.6)' : 'rgba(255, 255, 255, 1)' }}>
                    <small style={{ whiteSpace: 'pre-line', fontSize: '10px' }}><br />{project.TodoBesi}<br /></small>
                  </div>
                  <div className="listPekerjaan d-flex align-items-center position-relative mb-1 overflow-auto shadow" onClick={() => handleShowTextModal(project.NamaBarang, project.id, 'Kayu', project.TodoKayu)} style={{ width: '200px', textDecoration: 'none', backgroundColor: project.CategoryStatusKayu === 'Belum Proses' ? 'rgba(255, 0, 0, 0.6)' : project.CategoryStatusKayu === 'Selesai' ? 'rgba(0, 255, 0, 0.6)' : project.CategoryStatusKayu === 'QC Pass' ? 'rgba(0, 0, 255, 0.6)' : project.CategoryStatusKayu === 'Proses' ? 'rgba(255, 255, 0, 0.6)' : project.CategoryStatusKayu === 'Ready Stock' ? 'rgba(128, 128, 128, 0.6)' : project.CategoryStatusKayu === 'Servis' ? 'rgba(255, 165, 0, 0.6)' : 'rgba(255, 255, 255, 1)' }}>
                    <small style={{ whiteSpace: 'pre-line', fontSize: '10px' }}><br />{project.TodoKayu}<br /></small>
                  </div>
                  <div className="listPekerjaan d-flex align-items-center position-relative mb-1 overflow-auto shadow" onClick={() => handleShowTextModal(project.NamaBarang, project.id, 'Jok', project.TodoJok)} style={{ width: '200px', textDecoration: 'none', backgroundColor: project.CategoryStatusJok === 'Belum Proses' ? 'rgba(255, 0, 0, 0.6)' : project.CategoryStatusJok === 'Selesai' ? 'rgba(0, 255, 0, 0.6)' : project.CategoryStatusJok === 'QC Pass' ? 'rgba(0, 0, 255, 0.6)' : project.CategoryStatusJok === 'Proses' ? 'rgba(255, 255, 0, 0.6)' : project.CategoryStatusJok === 'Ready Stock' ? 'rgba(128, 128, 128, 0.6)' : project.CategoryStatusJok === 'Servis' ? 'rgba(255, 165, 0, 0.6)' : 'rgba(255, 255, 255, 1)' }}>
                    <small style={{ whiteSpace: 'pre-line', fontSize: '10px' }}><br />{project.TodoJok}<br /></small>
                  </div>
                  <div className="listPekerjaan d-flex align-items-center position-relative mb-1 overflow-auto shadow" onClick={() => handleShowTextModal(project.NamaBarang, project.id, 'Marmer', project.TodoMarmer)} style={{ width: '200px', textDecoration: 'none', backgroundColor: project.CategoryStatusMarmer === 'Belum Proses' ? 'rgba(255, 0, 0, 0.6)' : project.CategoryStatusMarmer === 'Selesai' ? 'rgba(0, 255, 0, 0.6)' : project.CategoryStatusMarmer === 'QC Pass' ? 'rgba(0, 0, 255, 0.6)' : project.CategoryStatusMarmer === 'Proses' ? 'rgba(255, 255, 0, 0.6)' : project.CategoryStatusMarmer === 'Ready Stock' ? 'rgba(128, 128, 128, 0.6)' : project.CategoryStatusMarmer === 'Servis' ? 'rgba(255, 165, 0, 0.6)' : 'rgba(255, 255, 255, 1)' }}>
                    <small style={{ whiteSpace: 'pre-line', fontSize: '10px' }}><br />{project.TodoMarmer}<br /></small>
                  </div>
                  <div className="listPekerjaan d-flex align-items-center position-relative mb-1 overflow-auto shadow" onClick={() => handleShowTextModal(project.NamaBarang, project.id, 'Kaca', project.TodoKaca)} style={{ width: '200px', textDecoration: 'none', backgroundColor: project.CategoryStatusKaca === 'Belum Proses' ? 'rgba(255, 0, 0, 0.6)' : project.CategoryStatusKaca === 'Selesai' ? 'rgba(0, 255, 0, 0.6)' : project.CategoryStatusKaca === 'QC Pass' ? 'rgba(0, 0, 255, 0.6)' : project.CategoryStatusKaca === 'Proses' ? 'rgba(255, 255, 0, 0.6)' : project.CategoryStatusKaca === 'Ready Stock' ? 'rgba(128, 128, 128, 0.6)' : project.CategoryStatusKaca === 'Servis' ? 'rgba(255, 165, 0, 0.6)' : 'rgba(255, 255, 255, 1)' }}>
                    <small style={{ whiteSpace: 'pre-line', fontSize: '10px' }}><br />{project.TodoKaca}<br /></small>
                  </div>
                  <div className="listPekerjaan d-flex align-items-center position-relative mb-1 overflow-auto shadow" onClick={() => handleShowTextModal(project.NamaBarang, project.id, 'Finishing', project.TodoFinishing)} style={{ width: '200px', textDecoration: 'none', backgroundColor: project.CategoryStatusFinishing === 'Belum Proses' ? 'rgba(255, 0, 0, 0.6)' : project.CategoryStatusFinishing === 'Selesai' ? 'rgba(0, 255, 0, 0.6)' : project.CategoryStatusFinishing === 'QC Pass' ? 'rgba(0, 0, 255, 0.6)' : project.CategoryStatusFinishing === 'Proses' ? 'rgba(255, 255, 0, 0.6)' : project.CategoryStatusFinishing === 'Ready Stock' ? 'rgba(128, 128, 128, 0.6)' : project.CategoryStatusFinishing === 'Servis' ? 'rgba(255, 165, 0, 0.6)' : 'rgba(255, 255, 255, 1)' }}>
                    <small style={{ whiteSpace: 'pre-line', fontSize: '10px' }}><br />{project.TodoFinishing}<br /></small>
                  </div>
                  <div className="listPekerjaan d-flex align-items-center position-relative mb-1 overflow-auto shadow" onClick={() => handleShowTextModal(project.NamaBarang, project.id, 'Rotan', project.TodoRotan)} style={{ width: '200px', textDecoration: 'none', backgroundColor: project.CategoryStatusRotan === 'Belum Proses' ? 'rgba(255, 0, 0, 0.6)' : project.CategoryStatusRotan === 'Selesai' ? 'rgba(0, 255, 0, 0.6)' : project.CategoryStatusRotan === 'QC Pass' ? 'rgba(0, 0, 255, 0.6)' : project.CategoryStatusRotan === 'Proses' ? 'rgba(255, 255, 0, 0.6)' : project.CategoryStatusRotan === 'Ready Stock' ? 'rgba(128, 128, 128, 0.6)' : project.CategoryStatusRotan === 'Servis' ? 'rgba(255, 165, 0, 0.6)' : 'rgba(255, 255, 255, 1)' }}>
                    <small style={{ whiteSpace: 'pre-line', fontSize: '10px' }}><br />{project.TodoRotan}<br /></small>
                  </div>
                  <div className="listPekerjaan d-flex align-items-center position-relative mb-1 overflow-auto shadow" onClick={() => handleShowTextModal(project.NamaBarang, project.id, 'Kain', project.TodoKain)} style={{ width: '200px', textDecoration: 'none', backgroundColor: project.CategoryStatusKain === 'Belum Proses' ? 'rgba(255, 0, 0, 0.6)' : project.CategoryStatusKain === 'Selesai' ? 'rgba(0, 255, 0, 0.6)' : project.CategoryStatusKain === 'QC Pass' ? 'rgba(0, 0, 255, 0.6)' : project.CategoryStatusKain === 'Proses' ? 'rgba(255, 255, 0, 0.6)' : project.CategoryStatusKain === 'Ready Stock' ? 'rgba(128, 128, 128, 0.6)' : project.CategoryStatusKain === 'Servis' ? 'rgba(255, 165, 0, 0.6)' : 'rgba(255, 255, 255, 1)' }}>
                    <small style={{ whiteSpace: 'pre-line', fontSize: '10px' }}><br />{project.TodoKain}<br /></small>
                  </div>
                  <div className="listPekerjaan d-flex align-items-center position-relative mb-1 overflow-auto shadow" onClick={() => handleShowTextModal(project.NamaBarang, project.id, 'Fiber', project.TodoFiber)} style={{ width: '200px', textDecoration: 'none', backgroundColor: project.CategoryStatusFiber === 'Belum Proses' ? 'rgba(255, 0, 0, 0.6)' : project.CategoryStatusFiber === 'Selesai' ? 'rgba(0, 255, 0, 0.6)' : project.CategoryStatusFiber === 'QC Pass' ? 'rgba(0, 0, 255, 0.6)' : project.CategoryStatusFiber === 'Proses' ? 'rgba(255, 255, 0, 0.6)' : project.CategoryStatusFiber === 'Ready Stock' ? 'rgba(128, 128, 128, 0.6)' : project.CategoryStatusFiber === 'Servis' ? 'rgba(255, 165, 0, 0.6)' : 'rgba(255, 255, 255, 1)' }}>
                    <small style={{ whiteSpace: 'pre-line', fontSize: '10px' }}><br />{project.TodoFiber}<br /></small>
                  </div>
                  <div className="listPekerjaan d-flex align-items-center position-relative mb-1 overflow-auto shadow" onClick={() => handleShowTextModal(project.NamaBarang, project.id, 'Veneer', project.TodoVeneer)} style={{ width: '200px', textDecoration: 'none', backgroundColor: project.CategoryStatusVeneer === 'Belum Proses' ? 'rgba(255, 0, 0, 0.6)' : project.CategoryStatusVeneer === 'Selesai' ? 'rgba(0, 255, 0, 0.6)' : project.CategoryStatusVeneer === 'QC Pass' ? 'rgba(0, 0, 255, 0.6)' : project.CategoryStatusVeneer === 'Proses' ? 'rgba(255, 255, 0, 0.6)' : project.CategoryStatusVeneer === 'Ready Stock' ? 'rgba(128, 128, 128, 0.6)' : project.CategoryStatusVeneer === 'Servis' ? 'rgba(255, 165, 0, 0.6)' : 'rgba(255, 255, 255, 1)' }}>
                    <small style={{ whiteSpace: 'pre-line', fontSize: '10px' }}><br />{project.TodoVeneer}<br /></small>
                  </div>
                  <div className="listPekerjaan d-flex align-items-center position-relative mb-1 overflow-auto shadow" onClick={() => handleShowTextModal(project.NamaBarang, project.id, 'Hardware', project.TodoHardware)} style={{ width: '200px', textDecoration: 'none', backgroundColor: project.CategoryStatusHardware === 'Belum Proses' ? 'rgba(255, 0, 0, 0.6)' : project.CategoryStatusHardware === 'Selesai' ? 'rgba(0, 255, 0, 0.6)' : project.CategoryStatusHardware === 'QC Pass' ? 'rgba(0, 0, 255, 0.6)' : project.CategoryStatusHardware === 'Proses' ? 'rgba(255, 255, 0, 0.6)' : project.CategoryStatusHardware === 'Ready Stock' ? 'rgba(128, 128, 128, 0.6)' : project.CategoryStatusHardware === 'Servis' ? 'rgba(255, 165, 0, 0.6)' : 'rgba(255, 255, 255, 1)' }}>
                    <small style={{ whiteSpace: 'pre-line', fontSize: '10px' }}><br />{project.TodoHardware}<br /></small>
                  </div>
                  <div className="listPekerjaan d-flex align-items-center position-relative mb-1 overflow-auto shadow" onClick={() => handleShowTextModal(project.NamaBarang, project.id, 'DlAsli', project.TodoDlAsli)} style={{ width: '200px', textDecoration: 'none', backgroundColor: 'rgba(255, 255, 255, 1)' }}>
                    <small style={{ whiteSpace: 'pre-line', fontSize: '10px' }}><br />{project.TodoDlAsli}<br /></small>
                  </div>
                  <div className="listPekerjaan d-flex align-items-center position-relative mb-1 overflow-auto shadow" onClick={() => handleShowTextModal(project.NamaBarang, project.id, 'DlSusulan', project.TodoDlSusulan)} style={{ width: '200px', textDecoration: 'none', backgroundColor: 'rgba(255, 255, 255, 1)' }}>
                    <small style={{ whiteSpace: 'pre-line', fontSize: '10px' }}><br />{project.TodoDlSusulan}<br /></small>
                  </div>
                  <div className="listPekerjaan d-flex align-items-center position-relative mb-1 overflow-auto shadow" onClick={() => handleShowTextModal(project.NamaBarang, project.id, 'Prio', project.TodoPrio)} style={{ width: '200px', textDecoration: 'none', backgroundColor: 'rgba(255, 255, 255, 1)' }}>
                    <small style={{ whiteSpace: 'pre-line', fontSize: '10px' }}><br />{project.TodoPrio}<br /></small>
                  </div>
                  <div className="listPekerjaan d-flex align-items-center position-relative mb-1 overflow-auto shadow" onClick={() => handleShowTextModal(project.NamaBarang, project.id, 'Terkirim', project.TodoTerkirim)} style={{ width: '200px', textDecoration: 'none', backgroundColor: 'rgba(255, 255, 255, 1)' }}>
                    <small style={{ whiteSpace: 'pre-line', fontSize: '10px' }}><br />{project.TodoTerkirim}<br /></small>
                  </div>
                  <div className="listPekerjaan d-flex align-items-center position-relative mb-1 overflow-auto shadow" onClick={() => handleShowTextModal(project.NamaBarang, project.id, 'TglKirim', project.TodoTglKirim)} style={{ width: '200px', textDecoration: 'none', backgroundColor: 'rgba(255, 255, 255, 1)' }}>
                    <small style={{ whiteSpace: 'pre-line', fontSize: '10px' }}><br />{project.TodoTglKirim}<br /></small>
                  </div>
                </div>
              ))}

              {/* Modal */}
              <Modal show={showTextModal} onHide={handleCloseTextModal}>
                <Modal.Header closeButton>
                  <Modal.Title>{projectName} - {columnText.split(/(?=[A-Z])/).join(' ')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  {/* Your comment form here */}
                  <label className='mt-2'>Text:</label><br />
                  <textarea className="form-control" rows="5" type='text' value={textData} onChange={(e) => setTextData(e.target.value)}></textarea>

                </Modal.Body>
                <Modal.Footer>
                  <Button variant="primary" onClick={handleSubmitTextModal}>Submit</Button>
                </Modal.Footer>
              </Modal>
              {/* End Modal */}



            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Books;
