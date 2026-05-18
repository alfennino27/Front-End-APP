import React, { useRef, useEffect, useState } from 'react';
import { Col, Row, Modal, Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useNavigate } from 'react-router-dom';
import { MdFolderCopy } from 'react-icons/md';

import Box from '@mui/material/Box';
import Backdrop from '@mui/material/Backdrop';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import FileCopyIcon from '@mui/icons-material/FileCopyOutlined';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import ShareIcon from '@mui/icons-material/Share';
import { CancelOutlined, Delete, DeleteOutline, FileOpen, FileUpload, FolderOpen } from '@mui/icons-material';
import { Card, Image } from 'antd';
const { Meta } = Card;
import { format } from "date-fns";
import { id } from 'date-fns/locale';
import { FaPaste } from 'react-icons/fa';
import { useTheme } from '../../ThemeContext';

const Storage = () => {
  const baseUrl = getApiBaseUrl();
  const { globalTheme } = useTheme();
  const { slug } = useParams();
  const [folderOpen, setFolderOpen] = useState('');
  const [folderOpenName, setFolderOpenName] = useState('');

  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [folderNameInput, setFolderNameInput] = useState('');
  const [dataStorageFolderFromDB, setDataStorageFolderFromDB] = useState([]);
  const [storageFolderDelete, setStorageFolderDelete] = useState(false);
  const [showConfirmDeleteFolder, setShowConfirmDeleteFolder] = useState(false);
  const [folderNameDelete, setFolderNameDelete] = useState('');
  const [folderIdDelete, setFolderIdDelete] = useState('');

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

  const actions = [
    { icon: <Delete />, name: 'Delete Folder', onClick: () => { setStorageFolderDelete(true); } },
    { icon: <FolderOpen />, name: 'New Folder', onClick: () => { setShowAddFolderModal(true); setOpen(false); setFolderNameInput(''); } },
  ];


  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);



  const handleSubmitAddFolder = async () => {
    setShowAddFolderModal(false);

    try {
      const res = await fetch(`${baseUrl}/storagefolder/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: folderNameInput }),
      });

      const data = await res.json();

      if (res.ok) {
        console.log('Folder berhasil ditambahkan dengan ID:', data.id);
        fetchDataStorageFolder(); // refresh data folder
      } else {
        console.error('Gagal menambahkan folder:', data.message);
      }
    } catch (error) {
      console.error('Terjadi kesalahan saat menambahkan folder:', error);
    }
  };


  const fetchDataStorageFolder = async () => {
    const folderRes = await fetch(`${baseUrl}/storagefolder/get`);
    const folderData = await folderRes.json();
    setDataStorageFolderFromDB(folderData);
  }


  useEffect(() => {
    fetchDataStorageFolder();
  }, []);


  const handleDeleteFolder = async () => {
    setStorageFolderDelete(false);
    setShowConfirmDeleteFolder(false);

    try {
      const res = await fetch(`${baseUrl}/storagefolder/delete/${folderIdDelete}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        console.log('Folder berhasil dihapus');
        fetchDataStorageFolder(); // refresh data folder
      } else {
        console.error('Gagal menghapus folder:', data.message);
      }
    } catch (error) {
      console.error('Terjadi kesalahan saat menghapus folder:', error);
    }
  };


  useEffect(() => {
    if (slug != null) {
      setFolderOpen(slug);
      const folder = dataStorageFolderFromDB.find(item => item.id === slug);
      setFolderOpenName(folder ? folder.name : '');
    } else {
      setFolderOpen('');
      setFolderOpenName('');
    }
  }, [slug]);

  return (
    <>
      <h1 className="text-center mb-4 mt-4 fw-bold" style={{ color: globalTheme == "light" ? "black" : "white" }}>{folderOpenName ? `${folderOpenName}` : 'Catalog'}</h1>
      <div
        className="container"
        style={{
          display: folderOpen != "" ? "none" : "",
          maxHeight: "75vh",
          overflowY: "auto"
        }}
      >
        <div className="row row-cols-1 row-cols-md-3 g-4">
          {dataStorageFolderFromDB.map((item, index) => (
            <div className="col position-relative" key={index}>
              <Link
                to={storageFolderDelete ? "#" : `/catalog/${item.id}`}
                className="btn d-block text-start py-4 position-relative folder-card"
                style={{
                  backgroundColor: storageFolderDelete
                    ? "rgba(0, 0, 0, 0.2)"
                    : globalTheme === "light"
                      ? "#ffffff"
                      : "#191919",
                  color: globalTheme === "light" ? "#000000" : "#ffffff",
                  border: "1px solid",
                  borderColor: globalTheme === "light" ? "#c4c4c4" : "#444",
                  borderRadius: "12px",
                  transition: "all 0.3s ease",
                }}
              >
                <MdFolderCopy style={{ margin: "0px 10px" }} /> {item.name}
              </Link>

              <DeleteOutline
                style={{
                  display: storageFolderDelete == true ? "block" : "none",
                  color: "red",
                  position: "absolute",
                  top: "10px",
                  right: "20px",
                  cursor: "pointer"
                }}
                onClick={() => { setShowConfirmDeleteFolder(true); setFolderNameDelete(item.name); setFolderIdDelete(item.id); }}
              />
            </div>
          ))}
        </div>
      </div>


      <button
        className='btn btn-danger'
        onClick={() => { setStorageFolderDelete(false) }}
        style={{
          display: storageFolderDelete === true ? "block" : "none",
          position: "fixed", // Mengubah 'absolute' menjadi 'fixed'
          bottom: "40px",
          right: "80px",
          cursor: "pointer"
        }}
      >
        Cancel
      </button>



      <Box sx={{ height: 200, transform: 'translateZ(0px)', flexGrow: 1, position: 'fixed', bottom: 16, right: 16 }}>
        <SpeedDial
          ariaLabel="SpeedDial tooltip example"
          icon={<SpeedDialIcon />}
          onClose={handleClose}
          onOpen={handleOpen}
          open={open}
        >
          {actions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.onClick}
              tooltipOpen
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                '& .MuiSpeedDialAction-staticTooltipLabel': {
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  minWidth: '160px', // Adjust this to ensure enough space for text
                  whiteSpace: 'nowrap',
                },
              }}
            />
          ))}
        </SpeedDial>
      </Box>

      {/* Modal */}
      <Modal show={showAddFolderModal} onHide={() => { setShowAddFolderModal(false) }}>
        <Modal.Header closeButton>
          <Modal.Title>Add Folder</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Your comment form here */}
          <label className='mt-2'>Folder Name :</label>
          <input className="form-control" type='text' value={folderNameInput} onChange={(e) => setFolderNameInput(e.target.value)} required></input>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleSubmitAddFolder}>Submit</Button>
        </Modal.Footer>
      </Modal>
      {/* End Modal */}

      <Modal show={showConfirmDeleteFolder} onHide={() => setShowConfirmDeleteFolder(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this folder ({folderNameDelete})?</Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={handleDeleteFolder}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>



    </>
  );
};



export default Storage;
