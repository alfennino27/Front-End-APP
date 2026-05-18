import React, { useRef, useEffect, useState } from 'react';
import { Col, Row, Modal, Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { getApiBaseUrl } from '../../Config/APIurl';

import { Card, Image, Popconfirm, Empty } from 'antd';

import { useTheme } from '../../ThemeContext';
import { getImageUrl } from '../../Utils/image';
import { useNavigate } from "react-router-dom";


const Storage = () => {
  const navigate = useNavigate();

  const baseUrl = getApiBaseUrl();
  const { globalTheme } = useTheme();
  const { slug } = useParams();



  const [dataProject, setDataProject] = useState([]);
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [selectedData, setSelectedData] = useState([]);
  const [categoryName, setCategoryName] = useState("");


  const [supplier, setSupplier] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [todo, setTodo] = useState([]);
  const [categoryStatus, setCategoryStatus] = useState('');

  const isMobile = window.innerWidth <= 768;



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
    if (!selectedData || categoryName === '') return;

    // set semua state form
    setSupplier(selectedData[`Supplier${categoryName}`] || '');
    setOrderDate(selectedData[`OrderDate${categoryName}`] || '');
    setDeadline(selectedData[`DeadlineSupplier${categoryName}`] || '');
    setDescription(selectedData[`Description${categoryName}`] || '');
    setTodo(selectedData[`Todo${categoryName}`] || '');
    setCategoryStatus(selectedData[`CategoryStatus${categoryName}`] || '');

    // baru buka modal setelah state siap
    setShowTodoModal(true);
  }, [selectedData, categoryName]);


  const fillFormFromData = (item, categoryName) => {
    setSelectedData(item);
    setCategoryName(categoryName);

    const todosFromDB = item[`Todo${categoryName}`];

    const todos = Array.isArray(todosFromDB)
      ? todosFromDB.map(t => ({
        text: typeof t === "string" ? t : t.text || "",
        done: typeof t === "object" ? !!t.done : false,
      }))
      : [{ text: "", done: false }];

    setTodo(todos);



    setShowTodoModal(true);
  };



  const handleSubmitToDoList = async () => {
    try {
      setShowTodoModal(false);

      const formattedTodos = Array.isArray(todo)
        ? todo.map(t => ({ text: t.text || "", done: !!t.done }))
        : [];

      const response = await fetch(`${baseUrl}/projects/update/todo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: selectedData.id,
          category: categoryName,
          todo: formattedTodos,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Gagal update To-Do List:", result.message);
        return;
      }

      console.log("To-Do List berhasil diperbarui");
      await fetchProject();
    } catch (error) {
      console.error("Terjadi kesalahan saat update To-Do List:", error);
    }
  };



  const cards = dataProject.flatMap((item) => {
    // Ambil semua field Todo yang berisi array dan tidak kosong
    const todoFields = Object.keys(item).filter(
      (key) =>
        key.startsWith("Todo") &&
        Array.isArray(item[key]) &&
        item[key].length > 0
    );

    if (todoFields.length === 0) return [];

    return todoFields
      .filter((todoKey) => {
        const todos = item[todoKey];
        // Hanya tampilkan kalau masih ada yang belum done (false)
        return todos.some((t) => !t.done);
      })
      .map((todoKey) => {
        const categoryName = todoKey.replace("Todo", "");

        return (
          <div
            key={`${item.id}-${todoKey}`}
            id={item.id}
            className="col"
            style={{ cursor: "pointer" }}
            onClick={() => fillFormFromData(item, categoryName)}
          >
            <div
              className={`listPekerjaan d-flex position-relative mb-1 shadow tema-${globalTheme} ${item.id === slug ? "selected" : ""
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
              {/* Nama Todo category */}
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
                {categoryName}
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

              {/* Deadline atau status */}
              <small className="position-absolute bottom-0 end-0 p-3" style={{ color: globalTheme === "light" ? "black" : "white" }}>
                Deadline: {item.Deadline ? new Date(item.Deadline).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
              </small>
            </div>
          </div>
        );
      });
  });




  const SPKcards = dataProject.flatMap((item) => {
    // Ambil semua field Supplier yang ada dan tidak kosong
    const supplierFields = Object.keys(item).filter(
      (key) =>
        key.startsWith("Supplier") &&
        item[key] && // ada isinya
        (
          Array.isArray(item[key]) ? item[key].length > 0 : true
        )
    );

    if (supplierFields.length === 0) return [];

    return supplierFields
      .filter((supplierKey) => {
        const categoryName = supplierKey.replace("Supplier", "");
        const spkKey = `SPK${categoryName}`;

        const spkValue = item[spkKey];

        // Tampilkan jika SPK belum ada / kosong
        if (!spkValue) return true;
        if (Array.isArray(spkValue) && spkValue.length === 0) return true;

        return false;
      })
      .map((supplierKey) => {
        const categoryName = supplierKey.replace("Supplier", "");

        // Jangan render Kain & Hardware
        if (categoryName === "Kain" || categoryName === "Hardware") {
          return null;
        }

        return (
          <div
            key={`${item.id}-${categoryName}`}
            id={item.id}
            className="col"
            style={{ cursor: "pointer" }}
            onClick={() => {
              window.open(`/project/${item.id}/${categoryName}/divCategory`, "_blank");
            }}
          >
            <div
              className={`listPekerjaan d-flex position-relative mb-1 shadow tema-${globalTheme} ${item.id === slug ? "selected" : ""
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
              {/* Badge Category */}
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  left: "10px",
                  backgroundColor: "#eb2525ff",
                  color: "white",
                  padding: "2px 6px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                {categoryName} (SPK)
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
                            ? "linear-gradient(to left, #007EFF, #14C2F6)"
                            : "linear-gradient(to left, #003797, #00c6ff)",
                      }}
                    >
                      {item.Percentage}%
                    </div>
                  </div>
                </small>
              </div>

              <small
                className="position-absolute bottom-0 end-0 p-3"
                style={{ color: globalTheme === "light" ? "black" : "white" }}
              >
                Deadline:{" "}
                {item.Deadline
                  ? new Date(item.Deadline).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                  : "-"}
              </small>
            </div>
          </div>
        );
      });
  });


  return (
    <>
      <h3 className="mt-4 fw-semibold container" style={{ color: globalTheme == "light" ? "black" : "white" }}>To Do</h3>

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

          {SPKcards.length > 0 && SPKcards}


        </div>
      </div>



      {/* Modal */}
      <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showTodoModal} onHide={() => setShowTodoModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>To Do ({categoryName.split(/(?=[A-Z])/).join(' ')})</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {todo && todo.length > 0 ? (
            todo.map((t, index) => (
              <div className="mb-2 d-flex align-items-center" key={index}>
                <input
                  type="checkbox"
                  className="me-2"
                  style={{ accentColor: '#0d6efd' }}
                  checked={t.done}
                  onChange={(e) => {
                    const newTodo = [...todo];
                    newTodo[index].done = e.target.checked;
                    setTodo(newTodo);
                  }}
                />
                <input
                  className="form-control"
                  type="text"
                  value={t.text}
                  onChange={(e) => {
                    const newTodo = [...todo];
                    newTodo[index].text = e.target.value;
                    setTodo(newTodo);
                  }}
                  placeholder={`To Do #${index + 1}`}
                />
              </div>
            ))
          ) : (
            <div className="text-muted">Belum ada To Do</div>
          )}


        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between w-100">
          <Button
            variant="success"
            onClick={() => setTodo([...todo, { text: "", done: false }])}
          >
            Tambah
          </Button>
          <Button variant="primary" onClick={handleSubmitToDoList}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>
      {/* End Modal */}



    </>
  );
};



export default Storage;
