import React, { useRef, useEffect, useState } from 'react';
import { Col, Row, Modal, Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { getApiBaseUrl } from '../../Config/APIurl';

import { Card, Image, Popconfirm, Empty } from 'antd';

import { useTheme } from '../../ThemeContext';
import { getImageUrl } from '../../Utils/image';

const Storage = () => {
  const baseUrl = getApiBaseUrl();
  const { globalTheme } = useTheme();
  const { slug } = useParams();



  const [dataProject, setDataProject] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedData, setSelectedData] = useState([]);
  const [reminderName, setReminderName] = useState("");
  const [dataSupplier, setDataSupplier] = useState([]);

  const [supplier, setSupplier] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [todo, setTodo] = useState('');
  const [categoryStatus, setCategoryStatus] = useState('');

  const isMobile = window.innerWidth <= 768;

  const supplierData = async () => {
    try {
      const res = await fetch(`${baseUrl}/supplier/list`);
      const data = await res.json();
      setDataSupplier(data);
    } catch (error) {
      console.error('Gagal mengambil data supplier:', error);
    }
  };

  // const userData = localStorage.getItem('user');
  // const user = userData ? JSON.parse(userData) : null;
  // useEffect(() => {
  //   const cekLogin = () => {
  //     if (user == null) {
  //       window.location.replace('/login');
  //     }
  //     if (user.uid === 'fYpdHwXRDLhj5XGxM5FZIAvxp9E2' || user.uid === 'w4M5JJjgGQeHFbS2nkyoCfUBE532' || user.uid === '4WGPaHicKWYr0Ny84IUh8xb9Bo62' || user.uid === 'ANGTwgX8KxXQy5Ww3cwpLrG0tFT2' || user.uid === 'gwsOqUgVXSPyWFMMHr4bJteBoYs1' || user.uid === '6D4XVa5BSSOl1ugUlkDlTea2COX2' || user.uid === 'MjOCxfNdGtf0q12BPzj0EYAcVJD3' || user.uid === 'knydS6fIBdOwHS37dDm3ZDNQXKQ2' || user.uid === 'Q3LWLX4D7Ye8hMnQVF9fa7SZb953') {
  //       console.log('success');
  //     } else {
  //       window.location.replace('/accounting');
  //     }
  //   };

  //   cekLogin();
  // }, []);





  const fetchProject = async () => {

    try {
      const res = await fetch(`${baseUrl}/projects/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          showCompleted: false,
          searchSupplier: '',
          searchSupplierCategory: ''
        })
      });

      if (!res.ok) throw new Error('Gagal ambil data project');

      const data = await res.json();
      console.log('Fetched projects:', data);
      setDataProject(data);
      // setFilteredData(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };




  useEffect(() => {
    fetchProject();
    supplierData();
  }, []);




  const handleChangeCheckbox = async (id, value, name) => {
    console.log('Changing checkbox:', name, 'to', value);
    try {
      const res = await fetch(`${baseUrl}/projects/checkbox`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: id,
          name,
          value,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        console.error('Gagal update checkbox:', result.message);
        return;
      }

      fetchProject();
    } catch (error) {
      console.error('Error updating checkbox:', error);
    }
  };

  useEffect(() => {
    if (!selectedData || reminderName === '') return;

    // set semua state form
    setSupplier(selectedData[`Supplier${reminderName}`] || '');
    setOrderDate(selectedData[`OrderDate${reminderName}`] || '');
    setDeadline(selectedData[`DeadlineSupplier${reminderName}`] || '');
    setDescription(selectedData[`Description${reminderName}`] || '');
    setTodo(selectedData[`Todo${reminderName}`] || '');
    setCategoryStatus(selectedData[`CategoryStatus${reminderName}`] || '');

    // baru buka modal setelah state siap
    setShowCategoryModal(true);
  }, [selectedData, reminderName]);


  const fillFormFromData = (item, reminderName) => {
    setSelectedData(item);
    setReminderName(reminderName);
    setSupplier(item[`Supplier${reminderName}`] || '');
    setOrderDate(item[`OrderDate${reminderName}`] || '');
    setDeadline(item[`DeadlineSupplier${reminderName}`] || '');
    setDescription(item[`Description${reminderName}`] || '');
    setTodo(item[`Todo${reminderName}`] || '');
    setCategoryStatus(item[`CategoryStatus${reminderName}`] || '');



    setShowCategoryModal(true);
  };


  const handleSubmit = async () => {
    setShowCategoryModal(false);


    try {
      const response = await fetch(`${baseUrl}/projects/update/category`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: selectedData.id,
          category: reminderName,
          supplier,
          orderDate: orderDate || null,
          deadline,
          description,
          categoryStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Gagal update supplier:', result.message);
        return;
      }

      console.log('Update supplier berhasil');
      await fetchProject(); // refresh data dari server
    } catch (error) {
      console.error('Terjadi kesalahan:', error);
    }
  };



  const cards = dataProject.flatMap((item) => {
    // Ambil semua field Reminder yang true
    const activeReminders = Object.keys(item).filter(
      (key) => key.endsWith("Reminder") && item[key] === true
    );

    if (activeReminders.length === 0) return [];

    return activeReminders
      .filter((reminderKey) => {
        const reminderName = reminderKey.replace("Reminder", "");
        const statusField = `CategoryStatus${reminderName}`;
        const statusValue = item[statusField];
        // Tampilkan hanya jika statusField kosong, undefined, atau ""
        return !statusValue;
      })
      .map((reminderKey) => {
        const reminderName = reminderKey.replace("Reminder", "");

        return (
          <div
            key={`${item.id}-${reminderKey}`}
            id={item.id}
            className="col"
            style={{ cursor: "pointer" }}
            onClick={() => fillFormFromData(item, reminderName)}
          >
            <div
              className={`listPekerjaan d-flex position-relative mb-1 shadow tema-${globalTheme} ${item.id === slug ? `selected` : ""
                }`}
              style={{
                backgroundImage:
                  item.id === slug
                    ? globalTheme === "light"
                      ? "linear-gradient(to right, #cbcbcb, #e7e7e7)"
                      : "linear-gradient(to right, #404040, #252525)"
                    : globalTheme === "light"
                      ? "linear-gradient(to right, #ffffff, #e7e7e7)"
                      : "linear-gradient(to right, #151515, #252525)",
                border:
                  item.id === slug
                    ? globalTheme === "light"
                      ? "2px solid #c1c1c1"
                      : "2px solid #8e8e8e"
                    : globalTheme === "light"
                      ? "2px solid rgb(163, 163, 163)"
                      : "2px solid #7a7a7a",
              }}
            >
              {/* Checkbox kanan atas */}
              {/* <div onClick={(e) => e.stopPropagation()}>
              <Popconfirm
                title={`Apakah Anda yakin?`}
                onConfirm={() =>
                  handleChangeCheckbox(item.id, !item[reminderKey], reminderKey)
                }
                okText="Ya"
                cancelText="Batal"
              >
                <label
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    border: "2px solid #2563EB",
                    backgroundColor: "white",
                    cursor: "pointer",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {item[reminderKey] && (
                    <span
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        backgroundColor: "#2563EB",
                      }}
                    />
                  )}

                  <input
                    type="checkbox"
                    checked={item[reminderKey] || false}
                    readOnly
                    style={{
                      opacity: 0,
                      width: "100%",
                      height: "100%",
                      margin: 0,
                      position: "absolute",
                      left: 0,
                      top: 0,
                      cursor: "inherit",
                    }}
                  />
                </label>
              </Popconfirm>
            </div> */}

              {/* Nama Reminder */}
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  left: "10px",
                  backgroundColor: "#2563EB",
                  color: "white",
                  padding: "2px 6px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                {reminderName}
              </div>

              <div className="me-3">
                <img
                  src={getImageUrl(item.image1)}
                  alt=""
                  style={{
                    width: isMobile ? "20vw" : "5vw",
                    height: isMobile ? "20vw" : "5vw",
                    borderRadius: "10px",
                    objectFit: "cover",
                  }}
                />
              </div>

              <div>
                <h5 style={{ color: globalTheme === "light" ? "black" : "white" }}>
                  {item.NamaBarang}
                </h5>
                <h6 style={{ color: globalTheme === "light" ? "#292929" : "#c0c0c0" }}>
                  {item.Buyer}
                </h6>
                <small>
                  <div
                    className="progress"
                    role="progressbar"
                    style={{ backgroundColor: "#4c4c4c", height: "15px" }}
                  >
                    <div
                      className="progress-bar"
                      style={{
                        width: `${item.Percentage}%`,
                        background:
                          globalTheme === "light"
                            ? `linear-gradient(to left, #007EFF, #14C2F6)`
                            : `linear-gradient(to left, #003797, #00c6ff)`,
                      }}
                    >
                      {item.Percentage}%
                    </div>
                  </div>
                </small>
              </div>

              <small className="position-absolute bottom-0 start-0 p-3">
                <span
                  style={{
                    color:
                      {
                        "Belum Proses": "rgba(255, 0, 0, 0.6)",
                        Proses: "rgba(196, 199, 0, 0.8)",
                        "QC Pass": "rgba(0, 0, 255, 0.6)",
                        Servis: "rgba(255, 165, 0, 0.6)",
                        Selesai: "rgba(0, 255, 0, 0.6)",
                        "Ready Stock": "rgba(128, 128, 128, 0.6)",
                      }[item[`CategoryStatus${reminderName}`]] || "rgba(0, 0, 0, 0.6)",
                  }}
                  className="fw-semibold"
                >
                  {item[`CategoryStatus${reminderName}`]}
                </span>
              </small>

              <small
                className="position-absolute bottom-0 end-0 p-3"
                style={{ color: globalTheme === "light" ? "black" : "white" }}
              >
                Deadline :{" "}
                {new Date(item.Deadline).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </small>
            </div>
          </div>
        );
      });
  });

  return (
    <>
      <h3 className="mt-4 fw-semibold container" style={{ color: globalTheme == "light" ? "black" : "white" }}>Category</h3>

      <div
        className="container mt-2"
        style={{
          maxHeight: "80vh",
          overflowY: "auto"
        }}
      >

        <div className="row row-cols-1 row-cols-md-3 g-4 p-1">
          {cards.length > 0 ? (
            cards
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                minHeight: "50vh", // tinggi minimal mengikuti viewport
                padding: "20px",    // optional, biar ada jarak dikit
                boxSizing: "border-box",
              }}
            >
              <Empty description="Tidak ada data" />
            </div>

          )}

        </div>
      </div>



      {/* Modal */}
      <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showCategoryModal} onHide={() => setShowCategoryModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Category ({reminderName.split(/(?=[A-Z])/).join(' ')})</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Your comment form here */}
          <label className='mt-2'>Supplier :</label>

          <select className="form-control" value={supplier || ""} onChange={(e) => setSupplier(e.target.value)} required>
            <option style={{ color: "#aaa" }} value="" disabled>Select Supplier</option>
            {dataSupplier.map((supplier, index) => {
              if (supplier.category == reminderName) {
                return (
                  <option value={supplier.supplierName}>{supplier.supplierName}</option>
                )
              }
            })}
            <option value="Undecided">Undecided</option>
          </select>

          <label className='mt-2'>Order Date :</label><br />
          <input className="form-control" type='date' value={orderDate} onChange={(e) => setOrderDate(e.target.value)}></input>
          <label className='mt-2'>Deadline :</label><br />
          <input className="form-control" type='date' value={deadline} onChange={(e) => setDeadline(e.target.value)}></input>
          <label className='mt-2'>Description :</label><br />
          <textarea className="form-control" type='text' rows="5" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>

          <label className='mt-2'>Status :</label><br />
          <select className="form-control" value={categoryStatus || ""} onChange={(e) => setCategoryStatus(e.target.value)}>
            <option style={{ color: "#aaa" }} value="" disabled>Select Status</option>
            <option value="Belum Proses">Belum Proses</option>
            <option value="Proses">Proses</option>
            <option value="QC Pass">QC Pass</option>
            <option value="Servis">Servis</option>
            <option value="Selesai">Selesai</option>
            <option value="Ready Stock">Ready Stock</option>
          </select>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary"
            onClick={handleSubmit}
          >Submit</Button>
        </Modal.Footer>
      </Modal>
      {/* End Modal */}



    </>
  );
};



export default Storage;
