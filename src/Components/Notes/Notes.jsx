import React, { useRef, useEffect, useState } from 'react';
import { Segmented, Collapse, Empty } from 'antd';
import { Col, Row, Modal, Button, Container, Dropdown } from 'react-bootstrap';
import { getApiBaseUrl } from '../../Config/APIurl';
import '../Pekerjaan/pekerjaan.css';
import { useTheme } from '../../ThemeContext';
import ReactQuill from 'react-quill';
import '../../../node_modules/react-quill/dist/quill.snow.css';

const Notes = () => {
  const baseUrl = getApiBaseUrl();
  const { globalTheme } = useTheme();
  const [selectedNote, setSelectedNote] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showAddNoteItemModal, setShowAddNoteItemModal] = useState(false);
  const [showEditNoteItemModal, setShowEditNoteItemModal] = useState(false);
  const [showConfirmDeleteNoteItem, setShowConfirmDeleteNoteItem] = useState(false);
  const [showConfirmDeleteNote, setShowConfirmDeleteNote] = useState(false);
  const [noteNameInput, setNoteNameInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [detailInput, setDetailInput] = useState('');
  const [idEdit, setIdEdit] = useState('');
  // const [idNoteDelete, setIdNoteDelete] = useState('');
  const [noteNameDelete, setNoteNameDelete] = useState('');
  const [dataNotesFromDB, setDataNotesFromDB] = useState([]);
  const [dataNotesItemFromDB, setDataNotesItemFromDB] = useState([]);

  useEffect(() => {
    if (selectedNote === "+") {
      setNoteNameInput('');
      setShowNoteModal(true);
    }
  }, [selectedNote]);



  const refreshState = () => {
    setTitleInput('');
    setDetailInput('');
  }

  const handleSubmitAddNote = async () => {
    setShowNoteModal(false);

    try {
      const res = await fetch(`${baseUrl}/notes/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          noteName: noteNameInput,
          submitDate: new Date(),
        }),
      });

      if (!res.ok) throw new Error('Gagal menambahkan note');

      const result = await res.json();
      console.log('Note berhasil ditambahkan dengan ID:', result.insertedId);

      fetchDataNotes(); // refresh data setelah menambahkan
    } catch (e) {
      console.error('Error adding note:', e);
    }
  };


  const handleSubmitAddNoteItem = async () => {
    setShowAddNoteItemModal(false);

    try {
      const res = await fetch(`${baseUrl}/notesItem/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: titleInput,
          detail: detailInput,
          note: selectedNote,
          submitDate: new Date(),
        }),
      });

      if (!res.ok) throw new Error('Gagal menambahkan Note Item');

      const result = await res.json();
      console.log('Note Item berhasil ditambahkan dengan ID:', result.insertedId);

      fetchDataNotesItem(); // refresh data setelah menambahkan
    } catch (e) {
      console.error('Error adding Note Item:', e);
    }
  };


  const handleSubmitEditNoteItem = async () => {
    setShowEditNoteItemModal(false);

    try {
      const res = await fetch(`${baseUrl}/notesItem/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: idEdit,
          title: titleInput,
          detail: detailInput,
        }),
      });

      if (!res.ok) throw new Error('Gagal mengedit Note Item');

      const result = await res.json();
      console.log('Note Item berhasil diupdate:', result);

      fetchDataNotesItem();
    } catch (e) {
      console.error('Error updating Note Item:', e);
    }
  };


  const fetchDataNotes = async () => {
    try {
      const res = await fetch(`${baseUrl}/notes/get`);
      if (!res.ok) throw new Error("Gagal fetch data Notes");
      const data = await res.json();
      console.log("success ambil data notes", data)
      setDataNotesFromDB(data); // asumsi respons API punya format { data: [...] }
    } catch (error) {
      console.error("Error fetching Notes:", error);
    }
  };

  const fetchDataNotesItem = async () => {
    try {
      const res = await fetch(`${baseUrl}/notesItem/get`);
      if (!res.ok) throw new Error("Gagal fetch data NotesItem");
      const data = await res.json();
      setDataNotesItemFromDB(data); // asumsi respons API punya format { data: [...] }
    } catch (error) {
      console.error("Error fetching NotesItem:", error);
    }
  };

  useEffect(() => {
    fetchDataNotes();
    fetchDataNotesItem();
  }, []);


  const options = dataNotesFromDB.map(note => note.noteName || '');
  options.push('+');

  const items = dataNotesItemFromDB
    .filter(item => item.note === selectedNote) // Filter items where 'note' matches 'selectedNote'
    .map((item, index) => ({
      key: (index + 1).toString(),
      label: <p className={`fw-semibold ${globalTheme === 'light' ? 'text-dark' : 'text-light'}`}>{item.title}</p>,
      children: (
        <div
          onClick={() => {
            setShowEditNoteItemModal(true);
            setIdEdit(item.id);
            setTitleInput(item.title);
            setDetailInput(item.detail);
          }}
          style={{
            whiteSpace: 'pre-line',
            cursor: 'pointer',
            padding: '5px 0px',
            color: globalTheme === 'light' ? 'black' : 'white',
          }}
          dangerouslySetInnerHTML={{ __html: item.detail }} // Render HTML dari item.detail
        />
      ),
    }));


  const handleDeleteNote = async () => {
    setShowConfirmDeleteNote(false);

    try {
      const res = await fetch(`${baseUrl}/notes/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ noteName: noteNameDelete }),
      });

      if (!res.ok) throw new Error('Gagal menghapus data');

      // Reset selectedNote jika perlu
      if (noteNameDelete === selectedNote) {
        setSelectedNote('');
      }

      // Perbarui data
      fetchDataNotes();
    } catch (error) {
      console.error('Gagal delete note:', error);
    }
  };


  const handleDeleteNoteItem = async () => {
    setShowConfirmDeleteNoteItem(false);

    try {
      const res = await fetch(`${baseUrl}/notesItem/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: idEdit,
        }),
      });

      if (!res.ok) throw new Error('Gagal menghapus Note Item');

      console.log('Note Item berhasil dihapus');
      fetchDataNotesItem();
    } catch (e) {
      console.error('Error deleting Note Item:', e);
    }
  };


  let holdTimeout;

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }], // Header
      ['bold', 'italic', 'underline', 'strike'], // Gaya teks
      [{ color: [] }, { background: [] }], // Warna teks & latar belakang
      [{ list: 'ordered' }, { list: 'bullet' }], // List
      [{ align: [] }], // Perataan teks
      ['link', 'image'], // Tautan dan gambar
      ['clean'], // Hapus format
    ],
  };

  return (
    <>

      <Segmented
        style={{
          position: "fixed",
          bottom: 0,
          zIndex: 1,
          backgroundColor: globalTheme == "light" ? "" : "#262626",
          border: "1px solid #585858",
          overflowX: "auto",
          whiteSpace: "nowrap",
          maxWidth: "100%",
        }}
        options={options.map(option => ({
          label: <span style={{ color: selectedNote === option ? (globalTheme === "light" ? "black" : "#585858") : (globalTheme === "light" ? "#505050" : "white"), fontWeight: selectedNote === option ? 'bold' : 'normal' }}>{option}</span>,
          value: option,
        }))}
        onChange={(value) => {
          setSelectedNote(value);
          refreshState();
        }}
        onMouseDown={(e) => {
          const clickedOption = options.find(option => option === e.target.innerText);
          if (clickedOption) {
            holdTimeout = setTimeout(() => {
              setShowConfirmDeleteNote(true);
              setNoteNameDelete(clickedOption); // Menggunakan nilai yang ditemukan
            }, 500); // Menunggu 500ms
          }
        }}
        onMouseUp={() => {
          clearTimeout(holdTimeout); // Membatalkan jika dilepas sebelum 500ms
        }}
        onMouseLeave={() => {
          clearTimeout(holdTimeout); // Membatalkan jika kursor keluar dari tombol
        }}
        value={selectedNote}
        className="segmented-custom"
      />

      <Container>
        <Row className="">
          <Col md={12} className='lowonganPekerjaan overflow-auto pekerjaan'>




            <div style={{ display: selectedNote == "" ? '' : 'none', paddingTop: "30vh" }}>
              <Empty />
            </div>
            <div className='p-4 mb-4' style={{ display: selectedNote != "+" && selectedNote != "" ? '' : 'none', position: 'relative' }}>
              <h4 className={`fw-bold text-center text-uppercase mb-4 ${globalTheme === 'light' ? 'text-dark' : 'text-light'}`}>{selectedNote}</h4>
              <button
                className='btn btn-primary'
                style={{ position: 'absolute', right: 25, top: 20 }}
                onClick={() => { setShowAddNoteItemModal(true); refreshState(); }}
              >
                + Add
              </button>
              <Collapse className={`${globalTheme === 'light' ? 'custom-collapse-light' : 'custom-collapse'}`} items={items} />
            </div>



            {/* Modal */}
            <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showNoteModal} onHide={() => setShowNoteModal(false)}>
              <Modal.Header closeButton>
                <Modal.Title>Add Note</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {/* Your comment form here */}
                <label className='mt-2'>Note Name :</label>
                <input className="form-control" type='text' value={noteNameInput} onChange={(e) => setNoteNameInput(e.target.value)} required></input>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="primary" onClick={handleSubmitAddNote}>Submit</Button>
              </Modal.Footer>
            </Modal>
            {/* End Modal */}

            {/* Modal */}
            <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showAddNoteItemModal} size="lg" onHide={() => setShowAddNoteItemModal(false)}>
              <Modal.Header closeButton>
                <Modal.Title>Add Item</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {/* Your comment form here */}
                <label className='mt-2'>Title :</label>
                <input className="form-control" type='text' value={titleInput} onChange={(e) => setTitleInput(e.target.value)} required></input>
                <label className='mt-2'>Detail :</label>
                <ReactQuill
                  theme="snow"
                  value={detailInput}
                  onChange={setDetailInput}
                  modules={modules}
                  style={{
                    border: "1px solid black", // Warna border abu-abu
                    borderRadius: "8px", // Radius untuk membuat sudut melengkung
                    backgroundColor: 'white', // Background putih
                    color: 'black', // Teks hitam
                    padding: '5px', // Tambahkan padding untuk estetika
                  }}
                />

              </Modal.Body>
              <Modal.Footer>
                <Button variant="primary" onClick={handleSubmitAddNoteItem}>Submit</Button>
              </Modal.Footer>
            </Modal>
            {/* End Modal */}

            {/* Modal */}
            <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showEditNoteItemModal} size="lg" onHide={() => setShowEditNoteItemModal(false)}>
              <Modal.Header closeButton>
                <Modal.Title>Edit Item</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {/* Your comment form here */}
                <label className='mt-2'>Title :</label>
                <input className="form-control" type='text' value={titleInput} onChange={(e) => setTitleInput(e.target.value)} required></input>
                <label className='mt-2'>Detail :</label>
                {/* <textarea className="form-control" type='text' rows="10" value={detailInput} onChange={(e) => setDetailInput(e.target.value)} required></textarea> */}
                <ReactQuill
                  theme="snow"
                  value={detailInput}
                  onChange={setDetailInput}
                  modules={modules}
                  style={{
                    border: "1px solid black", // Warna border abu-abu
                    borderRadius: "8px", // Radius untuk membuat sudut melengkung
                    backgroundColor: 'white', // Background putih
                    color: 'black', // Teks hitam
                    padding: '5px', // Tambahkan padding untuk estetika
                  }}
                />
              </Modal.Body>
              <Modal.Footer>
                <Button variant="danger" onClick={() => { setShowConfirmDeleteNoteItem(true); setShowEditNoteItemModal(false) }} className="me-auto">Delete</Button>
                <Button variant="primary" onClick={handleSubmitEditNoteItem}>Submit</Button>
              </Modal.Footer>
            </Modal>
            {/* End Modal */}

            <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showConfirmDeleteNoteItem} onHide={() => setShowConfirmDeleteNoteItem(false)}>
              <Modal.Header closeButton>
                <Modal.Title>Confirm Delete</Modal.Title>
              </Modal.Header>
              <Modal.Body>Are you sure you want to delete this item?</Modal.Body>
              <Modal.Footer>
                <Button variant="danger" onClick={handleDeleteNoteItem}>
                  Delete
                </Button>
              </Modal.Footer>
            </Modal>

            <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showConfirmDeleteNote} onHide={() => setShowConfirmDeleteNote(false)}>
              <Modal.Header closeButton>
                <Modal.Title>Confirm Delete</Modal.Title>
              </Modal.Header>
              <Modal.Body>Are you sure you want to delete this note ({noteNameDelete})?</Modal.Body>
              <Modal.Footer>
                <Button variant="danger" onClick={handleDeleteNote}>
                  Delete
                </Button>
              </Modal.Footer>
            </Modal>



          </Col>
        </Row>
      </Container>






    </>
  );
};



export default Notes;
