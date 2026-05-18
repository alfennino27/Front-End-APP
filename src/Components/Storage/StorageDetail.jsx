import { Col, Row, Modal, Button, Container, Dropdown, Form } from 'react-bootstrap';
import '../Pekerjaan/pekerjaan.css';
import { Link } from 'react-router-dom';
import React, { useRef, useEffect, useState } from 'react';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useParams } from 'react-router-dom';
import { Skeleton, Spin, Image } from 'antd';
import '../Pekerjaan/pekerjaan.css';
import '../Pekerjaan/table.css';
import { MdDelete, MdFolderCopy, MdOutlineDescription, MdOutlineLocationOn } from 'react-icons/md';

import Box from '@mui/material/Box';
import Backdrop from '@mui/material/Backdrop';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import { useTheme } from '../../ThemeContext';
import { CancelOutlined, Delete, DeleteOutline, FileOpen, FileUpload, FolderOpen } from '@mui/icons-material';
import { FaImage, FaPlus } from "react-icons/fa";
import { FaPaste } from "react-icons/fa";
import { getImageUrl } from '../../Utils/image';
const pdfLogoImg = 'https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3'

const StorageDetail = () => {
  const { globalTheme } = useTheme();
  const baseUrl = getApiBaseUrl();
  const { slug } = useParams();
  const { projectSlug } = useParams();
  const isMobile = window.innerWidth <= 768;

  const [dataProjectsFromDB, setDataProjectsFromDB] = useState([]);
  const [dataProjectFromDB, setDataProjectFromDB] = useState([]);
  const [dataStorageFromDB, setDataStorageFromDB] = useState([]);
  const [folderOpen, setFolderOpen] = useState('');
  const [showMenuModal, setShowMenuModal] = useState(false);

  const [showAddProductModal, setShowAddProductModal] = useState(false);

  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');

  const [fileToUpload, setFileToUpload] = useState(null);
  const [fileToUpload2, setFileToUpload2] = useState(null);
  const [fileToUpload3, setFileToUpload3] = useState(null);
  const [fileToUpload4, setFileToUpload4] = useState(null);
  const [fileToUpload5, setFileToUpload5] = useState(null);
  const [fileToUpload6, setFileToUpload6] = useState(null);
  const [fileToUpload7, setFileToUpload7] = useState(null);
  const [fileToUpload8, setFileToUpload8] = useState(null);
  const [fileToUpload9, setFileToUpload9] = useState(null);
  const [fileToUpload10, setFileToUpload10] = useState(null);

  const [showInformationModal, setShowInformationModal] = useState(false);
  const [showDeleteProductModal, setShowDeleteProductModal] = useState(false);

  const [showImageEdit, setShowImageEdit] = useState(false);

  const [fileToUploadEdit, setFileToUploadEdit] = useState(null);
  const [fileToUploadEdit2, setFileToUploadEdit2] = useState(null);
  const [fileToUploadEdit3, setFileToUploadEdit3] = useState(null);
  const [fileToUploadEdit4, setFileToUploadEdit4] = useState(null);
  const [fileToUploadEdit5, setFileToUploadEdit5] = useState(null);
  const [fileToUploadEdit6, setFileToUploadEdit6] = useState(null);
  const [fileToUploadEdit7, setFileToUploadEdit7] = useState(null);
  const [fileToUploadEdit8, setFileToUploadEdit8] = useState(null);
  const [fileToUploadEdit9, setFileToUploadEdit9] = useState(null);
  const [fileToUploadEdit10, setFileToUploadEdit10] = useState(null);

  const [fileToUploadEditRender, setFileToUploadEditRender] = useState(null);
  const [fileToUploadEditRender2, setFileToUploadEditRender2] = useState(null);
  const [fileToUploadEditRender3, setFileToUploadEditRender3] = useState(null);
  const [fileToUploadEditRender4, setFileToUploadEditRender4] = useState(null);
  const [fileToUploadEditRender5, setFileToUploadEditRender5] = useState(null);
  const [fileToUploadEditRender6, setFileToUploadEditRender6] = useState(null);
  const [fileToUploadEditRender7, setFileToUploadEditRender7] = useState(null);
  const [fileToUploadEditRender8, setFileToUploadEditRender8] = useState(null);
  const [fileToUploadEditRender9, setFileToUploadEditRender9] = useState(null);
  const [fileToUploadEditRender10, setFileToUploadEditRender10] = useState(null);

  const [showConfirmDeleteImage, setShowConfirmDeleteImage] = useState(false);
  const [imageDeleteNumber, setImageDeleteNumber] = useState('');

  const refreshState = () => {
    setProductName('');
    setDescription('');
    setFileToUpload(null);
    setFileToUpload2(null);
    setFileToUpload3(null);
    setFileToUpload4(null);
    setFileToUpload5(null);
    setFileToUpload6(null);
    setFileToUpload7(null);
    setFileToUpload8(null);
    setFileToUpload9(null);
    setFileToUpload10(null);
    setFileToUploadEdit(null);
    setFileToUploadEdit2(null);
    setFileToUploadEdit3(null);
    setFileToUploadEdit4(null);
    setFileToUploadEdit5(null);
    setFileToUploadEdit6(null);
    setFileToUploadEdit7(null);
    setFileToUploadEdit8(null);
    setFileToUploadEdit9(null);
    setFileToUploadEdit10(null);
    setFileToUploadEditRender(null);
    setFileToUploadEditRender2(null);
    setFileToUploadEditRender3(null);
    setFileToUploadEditRender4(null);
    setFileToUploadEditRender5(null);
    setFileToUploadEditRender6(null);
    setFileToUploadEditRender7(null);
    setFileToUploadEditRender8(null);
    setFileToUploadEditRender9(null);
    setFileToUploadEditRender10(null);
  };

  const getDataProjects = async () => {
    try {
      const res = await fetch(`${baseUrl}/storage/projects/get?slug=${slug}`);

      if (!res.ok) {
        throw new Error('Gagal mengambil data projects');
      }

      const result = await res.json();

      if (result.success) {
        setDataProjectsFromDB(result.data);
        setDataProjectFromDB([]); // reset jika kamu memang perlu
      } else {
        console.error('API gagal:', result.message);
      }
    } catch (error) {
      console.error('Error saat fetch data projects:', error);
    }
  };


  useEffect(() => {
    getDataProjects();
  }, [slug]);


  const getDataProject = async () => {
    try {
      const res = await fetch(`${baseUrl}/storage/project/one/get?id=${projectSlug}`);

      if (!res.ok) {
        throw new Error('Gagal mengambil data project');
      }

      const result = await res.json();

      if (result.success) {
        setDataProjectFromDB([result.data]); // bentuk array agar tetap cocok dengan format lama
      } else {
        console.error('API gagal:', result.message);
      }
    } catch (error) {
      console.error('Error saat fetch data project:', error);
    }
  };


  useEffect(() => {
    getDataProject();
  }, [projectSlug]);

  useEffect(() => {
    const getStorageData = async () => {
      try {
        const res = await fetch(`${baseUrl}/storagefolder/get`);

        if (!res.ok) {
          throw new Error('Gagal fetch data folder');
        }

        const dataStorageFromDB = await res.json();
        setDataStorageFromDB(dataStorageFromDB);
      } catch (error) {
        console.error('Error ambil data storage folder:', error);
      }
    };

    getStorageData();
  }, []);


  useEffect(() => {
    if (dataStorageFromDB.length > 0) {
      // Cari data berdasarkan id yang sesuai dengan slug
      const matchedFolder = dataStorageFromDB.find(folder => folder.id === slug);

      if (matchedFolder) {
        setFolderOpen(matchedFolder.name);
      }
    }
  }, [slug, dataStorageFromDB]);

  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const actions = !projectSlug
    ? [
      { icon: <Delete style={{ color: '#e5e5e5' }} />, name: <span style={{ color: '#e5e5e5' }}>Delete Product</span> },
      { icon: <FaImage style={{ color: '#e5e5e5' }} />, name: <span style={{ color: '#e5e5e5' }}>Edit Image</span> },
      { icon: <MdOutlineDescription style={{ color: '#e5e5e5' }} />, name: <span style={{ color: '#e5e5e5' }}>Edit Description</span> },
      { icon: <FaPlus />, name: <span>New Product</span>, onClick: () => { setShowAddProductModal(true); refreshState() } },
    ]
    : [
      { icon: <Delete style={{ color: (dataProjectFromDB && dataProjectFromDB.length > 0 && dataProjectFromDB[0].Status !== "Catalog") ? '#e5e5e5' : '' }} />, name: <span style={{ color: (dataProjectFromDB && dataProjectFromDB.length > 0 && dataProjectFromDB[0].Status !== "Catalog") ? '#e5e5e5' : '' }}>Delete Product</span>, onClick: () => { if (dataProjectFromDB[0].Status === "Catalog") { setShowDeleteProductModal(true); setProductName(dataProjectFromDB[0].NamaBarang); } } },
      { icon: <FaImage />, name: <span>Edit Image</span>, onClick: () => { setShowImageEdit(true); refreshState(); } },
      { icon: <MdOutlineDescription />, name: <span>Edit Description</span>, onClick: () => { setShowInformationModal(true); setProductName(dataProjectFromDB[0].NamaBarang); setDescription(dataProjectFromDB[0].Spesifikasi) } },
      { icon: <FaPlus />, name: <span>New Product</span>, onClick: () => { setShowAddProductModal(true); refreshState() } },
    ];

  const handleSubmitAddProduct = async () => {
    setShowAddProductModal(false);

    const formData = new FormData();
    formData.append('productName', productName);
    formData.append('description', description);
    formData.append('slug', slug);

    // Masukkan file jika ada
    if (fileToUpload) formData.append('image1', fileToUpload);
    if (fileToUpload2) formData.append('image2', fileToUpload2);
    if (fileToUpload3) formData.append('image3', fileToUpload3);
    if (fileToUpload4) formData.append('image4', fileToUpload4);
    if (fileToUpload5) formData.append('image5', fileToUpload5);
    if (fileToUpload6) formData.append('image6', fileToUpload6);
    if (fileToUpload7) formData.append('image7', fileToUpload7);
    if (fileToUpload8) formData.append('image8', fileToUpload8);
    if (fileToUpload9) formData.append('image9', fileToUpload9);
    if (fileToUpload10) formData.append('image10', fileToUpload10);

    try {
      const response = await fetch(`${baseUrl}/storage/project/create`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Project berhasil ditambahkan:', result);
        getDataProjects(); // refresh list project
      } else {
        console.error('Gagal:', result.message);
      }
    } catch (error) {
      console.error('Error saat kirim ke server:', error);
    }
  };


  const handleSubmitInformation = async () => {
    setShowInformationModal(false);

    try {
      const res = await fetch(`${baseUrl}/storage/project/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: projectSlug,
          NamaBarang: productName,
          Spesifikasi: description,
        }),
      });

      if (!res.ok) {
        throw new Error('Gagal update project');
      }

      const result = await res.json();
      console.log(result.message);

      refreshState();
      getDataProject();
    } catch (e) {
      console.error('Error saat update project:', e);
    }
  };


  const handleDeleteProductConfirm = async () => {
    setShowDeleteProductModal(false);

    try {
      const response = await fetch(`${baseUrl}/storage/project/delete/${projectSlug}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Project berhasil dihapus:', result.message);
        getDataProjects(); // refresh list project
      } else {
        console.error('Gagal menghapus project:', result.message);
      }
    } catch (error) {
      console.error('Error saat hapus project:', error);
    }
  };


  const handleSubmitImageEdit = async () => {
    setShowImageEdit(false);

    const formData = new FormData();

    // Pastikan untuk mengirimkan id proyek yang sesuai
    const projectId = projectSlug; // id proyek yang akan diupdate

    // Menambahkan id proyek ke formData
    formData.append('id', projectId);

    // Tambahkan file gambar yang di-upload ke FormData
    if (fileToUploadEdit) formData.append('image1', fileToUploadEdit);
    if (fileToUploadEdit2) formData.append('image2', fileToUploadEdit2);
    if (fileToUploadEdit3) formData.append('image3', fileToUploadEdit3);
    if (fileToUploadEdit4) formData.append('image4', fileToUploadEdit4);
    if (fileToUploadEdit5) formData.append('image5', fileToUploadEdit5);
    if (fileToUploadEdit6) formData.append('image6', fileToUploadEdit6);
    if (fileToUploadEdit7) formData.append('image7', fileToUploadEdit7);
    if (fileToUploadEdit8) formData.append('image8', fileToUploadEdit8);
    if (fileToUploadEdit9) formData.append('image9', fileToUploadEdit9);
    if (fileToUploadEdit10) formData.append('image10', fileToUploadEdit10);
    if (fileToUploadEditRender) formData.append('imageRender1', fileToUploadEditRender);
    if (fileToUploadEditRender2) formData.append('imageRender2', fileToUploadEditRender2);
    if (fileToUploadEditRender3) formData.append('imageRender3', fileToUploadEditRender3);
    if (fileToUploadEditRender4) formData.append('imageRender4', fileToUploadEditRender4);
    if (fileToUploadEditRender5) formData.append('imageRender5', fileToUploadEditRender5);
    if (fileToUploadEditRender6) formData.append('imageRender6', fileToUploadEditRender6);
    if (fileToUploadEditRender7) formData.append('imageRender7', fileToUploadEditRender7);
    if (fileToUploadEditRender8) formData.append('imageRender8', fileToUploadEditRender8);
    if (fileToUploadEditRender9) formData.append('imageRender9', fileToUploadEditRender9);
    if (fileToUploadEditRender10) formData.append('imageRender10', fileToUploadEditRender10);

    try {
      // Kirim FormData ke API untuk update gambar
      const response = await fetch(`${baseUrl}/storage/project/update-images`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Gambar berhasil diupdate', result);
        getDataProject(); // Setelah berhasil, ambil data proyek terbaru
        refreshState();  // Refresh state UI jika diperlukan
      } else {
        console.error('Gagal mengupdate gambar:', result.message);
      }
    } catch (e) {
      console.error('Error during image update:', e);
    }
  };


  function pasteImage(modal) {
    navigator.clipboard.read().then(clipboardItems => {
      clipboardItems.forEach(item => {
        const imageType = item.types.includes('image/png') ? 'image/png' : item.types.includes('image/jpeg') ? 'image/jpeg' : '';
        if (imageType) {
          item.getType(imageType).then(blob => {
            const file = new File([blob], `pasted-image.${imageType.split('/')[1]}`, { type: imageType });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);

            let inputElement;
            if (modal === "editImage1") {
              inputElement = document.querySelector('input[data-id="editImage1"]');
              setFileToUploadEdit(new File([blob], 'pasted-image1.png', { type: imageType }));
            } else if (modal === "editImage2") {
              inputElement = document.querySelector('input[data-id="editImage2"]');
              setFileToUploadEdit2(new File([blob], 'pasted-image2.png', { type: imageType }));
            } else if (modal === "editImage3") {
              inputElement = document.querySelector('input[data-id="editImage3"]');
              setFileToUploadEdit3(new File([blob], 'pasted-image3.png', { type: imageType }));
            } else if (modal === "editImage4") {
              inputElement = document.querySelector('input[data-id="editImage4"]');
              setFileToUploadEdit4(new File([blob], 'pasted-image4.png', { type: imageType }));
            } else if (modal === "editImage5") {
              inputElement = document.querySelector('input[data-id="editImage5"]');
              setFileToUploadEdit5(new File([blob], 'pasted-image5.png', { type: imageType }));
            } else if (modal === "editImage6") {
              inputElement = document.querySelector('input[data-id="editImage6"]');
              setFileToUploadEdit6(new File([blob], 'pasted-image6.png', { type: imageType }));
            } else if (modal === "editImage7") {
              inputElement = document.querySelector('input[data-id="editImage7"]');
              setFileToUploadEdit7(new File([blob], 'pasted-image7.png', { type: imageType }));
            } else if (modal === "editImage8") {
              inputElement = document.querySelector('input[data-id="editImage8"]');
              setFileToUploadEdit8(new File([blob], 'pasted-image8.png', { type: imageType }));
            } else if (modal === "editImage9") {
              inputElement = document.querySelector('input[data-id="editImage9"]');
              setFileToUploadEdit9(new File([blob], 'pasted-image9.png', { type: imageType }));
            } else if (modal === "editImage10") {
              inputElement = document.querySelector('input[data-id="editImage10"]');
              setFileToUploadEdit10(new File([blob], 'pasted-image10.png', { type: imageType }));
            } else if (modal === "editImageRender1") {
              inputElement = document.querySelector('input[data-id="editImageRender1"]');
              setFileToUploadEditRender(new File([blob], 'pasted-imageRender1.png', { type: imageType }));
            } else if (modal === "editImageRender2") {
              inputElement = document.querySelector('input[data-id="editImageRender2"]');
              setFileToUploadEditRender2(new File([blob], 'pasted-imageRender2.png', { type: imageType }));
            } else if (modal === "editImageRender3") {
              inputElement = document.querySelector('input[data-id="editImageRender3"]');
              setFileToUploadEditRender3(new File([blob], 'pasted-imageRender3.png', { type: imageType }));
            } else if (modal === "editImageRender4") {
              inputElement = document.querySelector('input[data-id="editImageRender4"]');
              setFileToUploadEditRender4(new File([blob], 'pasted-imageRender4.png', { type: imageType }));
            } else if (modal === "editImageRender5") {
              inputElement = document.querySelector('input[data-id="editImageRender5"]');
              setFileToUploadEditRender5(new File([blob], 'pasted-imageRender5.png', { type: imageType }));
            } else if (modal === "editImageRender6") {
              inputElement = document.querySelector('input[data-id="editImageRender6"]');
              setFileToUploadEditRender6(new File([blob], 'pasted-imageRender6.png', { type: imageType }));
            } else if (modal === "editImageRender7") {
              inputElement = document.querySelector('input[data-id="editImageRender7"]');
              setFileToUploadEditRender7(new File([blob], 'pasted-imageRender7.png', { type: imageType }));
            } else if (modal === "editImageRender8") {
              inputElement = document.querySelector('input[data-id="editImageRender8"]');
              setFileToUploadEditRender8(new File([blob], 'pasted-imageRender8.png', { type: imageType }));
            } else if (modal === "editImageRender9") {
              inputElement = document.querySelector('input[data-id="editImageRender9"]');
              setFileToUploadEditRender9(new File([blob], 'pasted-imageRender9.png', { type: imageType }));
            } else if (modal === "editImageRender10") {
              inputElement = document.querySelector('input[data-id="editImageRender10"]');
              setFileToUploadEditRender10(new File([blob], 'pasted-imageRender10.png', { type: imageType }));
            }

            if (inputElement) {
              inputElement.files = dataTransfer.files;
            }
          });
        }
      });
    });
  }

  const handleDeleteImageConfirm = async () => {
    setShowConfirmDeleteImage(false);

    try {
      const response = await fetch(`${baseUrl}/storage/project/delete-image`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: projectSlug,        // ID dokumen project
          imageField: imageDeleteNumber // nama field gambar yang mau dihapus, misalnya 'image1'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Image field updated successfully');
      } else {
        console.error('Error updating image field:', result.message);
      }
    } catch (error) {
      console.error('Error updating image field:', error);
    }

    getDataProject();  // refresh data setelah field diupdate
    refreshState();    // reset state local jika perlu
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

  const [isScrolled2, setIsScrolled2] = useState(false);
  const scrollableElementRef2 = useRef(null); // Mengacu ke elemen yang di-scroll

  useEffect(() => {
    const handleScroll = () => {
      if (scrollableElementRef2.current) {
        const scrollTop = scrollableElementRef2.current.scrollTop;
        setIsScrolled2(scrollTop > 50); // Cek jika elemen yang di-scroll melebihi 50px
      }
    };

    const element = scrollableElementRef2.current;

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

  return (
    <>
      <Container>
        <Row className="mt-2 pekerjaan">
          <Col md={4} className="lowonganPekerjaan overflow-auto" style={{ display: isMobile && projectSlug ? "none" : "" }} ref={scrollableElementRef}>
            <h4
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: "sticky",
                ...(isMobile ? { top: -1 } : { top: 0 }),
                color: globalTheme === "light" ? "#000000" : "#ffffff",
                backgroundColor: isScrolled
                  ? (globalTheme === "light" ? "#f3f3f3" : "#151515")
                  : "transparent",
                borderRadius: "30px",
                border: isScrolled
                  ? (globalTheme === "light" ? "1px solid #5f5f5f" : "1px solid white")
                  : "1px solid transparent",
                zIndex: 3,
                padding: "10px",
                cursor: "pointer",
                transition: "background-color 1s ease, border 1s ease",
              }}
              onClick={() => setShowMenuModal(true)}
            >
              {folderOpen}
            </h4>


            {dataProjectsFromDB.map((project, index) => (
              <Row key={index} id={project.id}>
                <Col>
                  <Link to={`/catalog/${slug}/${project.id}`}>
                    <div
                      className={`listPekerjaan listCatalog d-flex position-relative mb-1 shadow tema-${globalTheme} ${project.id === projectSlug ? "selected" : ""}`}
                      style={{
                        backgroundImage:
                          project.id === projectSlug
                            ? globalTheme === "light"
                              ? "linear-gradient(to right, #cbcbcb, #e7e7e7)"
                              : "linear-gradient(to right, #404040, #252525)"
                            : globalTheme === "light"
                              ? "linear-gradient(to right, #ffffff, #e7e7e7)"
                              : "linear-gradient(to right, #151515, #252525)",
                        border:
                          project.id === projectSlug
                            ? globalTheme === "light"
                              ? "2px solid #c1c1c1"
                              : "2px solid #8e8e8e"
                            : globalTheme === "light"
                              ? "2px solid rgb(163, 163, 163)"
                              : "2px solid #7a7a7a",
                        borderRadius: "10px",
                        padding: "10px",
                      }}
                    >
                      <div className="me-3">
                        <img
                          src={getImageUrl(
                            project.image1 ||
                            "https://firebasestorage.googleapis.com/v0/b/klf-project-manager-b97dc.appspot.com/o/images%2Funknown-logo.png?alt=media&token=ff697c36-6f87-4aa7-9fe1-edc1c0a624b1"
                          )}
                          alt=""
                          style={{
                            width: isMobile ? "18vw" : "4vw",
                            height: isMobile ? "18vw" : "4vw",
                            borderRadius: "10px",
                            objectFit: "cover",  // Gambar tidak akan ter-stretch dan terpotong jika terlalu besar
                          }}
                        />
                      </div>

                      <div>
                        <h5 style={{ color: globalTheme === "light" ? "black" : "white" }}>
                          {project.NamaBarang}
                        </h5>
                        <h6 style={{ color: globalTheme === "light" ? "#292929" : "#c0c0c0" }}>
                          {project.Buyer}
                        </h6>
                      </div>
                    </div>
                  </Link>
                </Col>
              </Row>
            ))}



          </Col>




          <Col className="lowonganPekerjaan overflow-auto" style={{ display: isMobile && !projectSlug ? "none" : "" }} ref={scrollableElementRef2}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "sticky",
                ...(isMobile ? { top: 0 } : { top: 0 }),
                zIndex: 1,
                padding: "10px 15px 0px 15px",
                marginBottom: "10px",
                color: globalTheme === "light" ? "#000000" : "#ffffff",
                backgroundColor: isScrolled2
                  ? globalTheme === "light"
                    ? "#f3f3f3"
                    : "#151515"
                  : "transparent",
                borderRadius: "30px",
                border: isScrolled2
                  ? globalTheme === "light"
                    ? "1px solid #5f5f5f"
                    : "1px solid white"
                  : "1px solid transparent",
                transition: "background-color 1s ease, border 1s ease",
              }}
            >
              <h4>Information</h4>
            </div>


            <div className="deskripsiPekerjaan p-3 position-relative shadow" style={{ backgroundImage: globalTheme === "light" ? "linear-gradient(to right, #ffffff, #e7e7e7)" : "linear-gradient(to right, #151515, #303030)", border: globalTheme === "light" ? "2px solid rgb(163, 163, 163)" : "2px solid #7a7a7a" }}>
              <div>
                <div>
                  <h5 className="fw-bold" style={{ color: globalTheme == "light" ? "black" : "white" }}>{dataProjectFromDB.length > 0 ? dataProjectFromDB[0].NamaBarang : ''}</h5>
                  <h6 style={{ color: globalTheme == "light" ? "black" : "white" }}>{dataProjectFromDB.length > 0 ? dataProjectFromDB[0].Buyer : ''}</h6>
                  <small style={{ color: globalTheme == "light" ? "black" : "white" }}>
                    <MdOutlineLocationOn /> {dataProjectFromDB.length > 0 ? dataProjectFromDB[0].Lokasi : ''}
                  </small>
                  <br />
                  <h6 className='mt-4' style={{ color: globalTheme == "light" ? "black" : "white" }}>Gambar Produk</h6>
                </div>



                <div className="me-3">

                  <Image.PreviewGroup
                    preview={{
                      onChange: (current, prev) => console.log(`current index: ${current}, prev index: ${prev}`),
                    }}
                  >

                    {dataProjectFromDB.length > 0 && dataProjectFromDB[0].image1 && (
                      dataProjectFromDB[0].image1.includes('.pdf?') ? (
                        <a
                          href={dataProjectFromDB[0].image1}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.stopPropagation(); }}
                        >
                          <img
                            src='https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3'
                            style={{ height: "11vh" }}
                            alt="PDF Logo"
                          />
                        </a>
                      ) : (
                        <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                          <Image width={'auto'} height={'11vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].image1 || "https://firebasestorage.googleapis.com/v0/b/klf-project-manager-b97dc.appspot.com/o/images%2Funknown-logo.png?alt=media&token=ff697c36-6f87-4aa7-9fe1-edc1c0a624b1")} />
                        </span>
                      )
                    )}
                    {dataProjectFromDB.length > 0 && dataProjectFromDB[0].image2 && (
                      dataProjectFromDB[0].image2.includes('.pdf?') ? (
                        <a
                          href={dataProjectFromDB[0].image2}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.stopPropagation(); }}
                        >
                          <img
                            src='https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3'
                            style={{ height: "11vh" }}
                            alt="PDF Logo"
                          />
                        </a>
                      ) : (
                        <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                          <Image width={'auto'} height={'11vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].image2)} />
                        </span>
                      )
                    )}
                    {dataProjectFromDB.length > 0 && dataProjectFromDB[0].image3 && (
                      dataProjectFromDB[0].image3.includes('.pdf?') ? (
                        <a
                          href={dataProjectFromDB[0].image3}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.stopPropagation(); }}
                        >
                          <img
                            src='https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3'
                            style={{ height: "11vh" }}
                            alt="PDF Logo"
                          />
                        </a>
                      ) : (
                        <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                          <Image width={'auto'} height={'11vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].image3)} />
                        </span>
                      )
                    )}
                    {dataProjectFromDB.length > 0 && dataProjectFromDB[0].image4 && (
                      dataProjectFromDB[0].image4.includes('.pdf?') ? (
                        <a
                          href={dataProjectFromDB[0].image4}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.stopPropagation(); }}
                        >
                          <img
                            src='https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3'
                            style={{ height: "11vh" }}
                            alt="PDF Logo"
                          />
                        </a>
                      ) : (
                        <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                          <Image width={'auto'} height={'11vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].image4)} />
                        </span>
                      )
                    )}
                    {dataProjectFromDB.length > 0 && dataProjectFromDB[0].image5 && (
                      dataProjectFromDB[0].image5.includes('.pdf?') ? (
                        <a
                          href={dataProjectFromDB[0].image5}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.stopPropagation(); }}
                        >
                          <img
                            src='https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3'
                            style={{ height: "11vh" }}
                            alt="PDF Logo"
                          />
                        </a>
                      ) : (
                        <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                          <Image width={'auto'} height={'11vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].image5)} />
                        </span>
                      )
                    )}
                    {dataProjectFromDB.length > 0 && dataProjectFromDB[0].image6 && (
                      dataProjectFromDB[0].image6.includes('.pdf?') ? (
                        <a
                          href={dataProjectFromDB[0].image6}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.stopPropagation(); }}
                        >
                          <img
                            src='https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3'
                            style={{ height: "11vh" }}
                            alt="PDF Logo"
                          />
                        </a>
                      ) : (
                        <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                          <Image width={'auto'} height={'11vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].image6)} />
                        </span>
                      )
                    )}
                    {dataProjectFromDB.length > 0 && dataProjectFromDB[0].image7 && (
                      dataProjectFromDB[0].image7.includes('.pdf?') ? (
                        <a
                          href={dataProjectFromDB[0].image7}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.stopPropagation(); }}
                        >
                          <img
                            src='https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3'
                            style={{ height: "11vh" }}
                            alt="PDF Logo"
                          />
                        </a>
                      ) : (
                        <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                          <Image width={'auto'} height={'11vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].image7)} />
                        </span>
                      )
                    )}
                    {dataProjectFromDB.length > 0 && dataProjectFromDB[0].image8 && (
                      dataProjectFromDB[0].image8.includes('.pdf?') ? (
                        <a
                          href={dataProjectFromDB[0].image8}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.stopPropagation(); }}
                        >
                          <img
                            src='https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3'
                            style={{ height: "11vh" }}
                            alt="PDF Logo"
                          />
                        </a>
                      ) : (
                        <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                          <Image width={'auto'} height={'11vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].image8)} />
                        </span>
                      )
                    )}
                    {dataProjectFromDB.length > 0 && dataProjectFromDB[0].image9 && (
                      dataProjectFromDB[0].image9.includes('.pdf?') ? (
                        <a
                          href={dataProjectFromDB[0].image9}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.stopPropagation(); }}
                        >
                          <img
                            src='https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3'
                            style={{ height: "11vh" }}
                            alt="PDF Logo"
                          />
                        </a>
                      ) : (
                        <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                          <Image width={'auto'} height={'11vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].image9)} />
                        </span>
                      )
                    )}
                    {dataProjectFromDB.length > 0 && dataProjectFromDB[0].image10 && (
                      dataProjectFromDB[0].image10.includes('.pdf?') ? (
                        <a
                          href={dataProjectFromDB[0].image10}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.stopPropagation(); }}
                        >
                          <img
                            src='https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3'
                            style={{ height: "11vh" }}
                            alt="PDF Logo"
                          />
                        </a>
                      ) : (
                        <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                          <Image width={'auto'} height={'11vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].image10)} />
                        </span>
                      )
                    )}
                  </Image.PreviewGroup>
                </div>

                <h6 className='mt-4' style={{ color: globalTheme == "light" ? "black" : "white" }}>Gambar Render</h6>

                <div className="me-3">

                  <Image.PreviewGroup
                    preview={{
                      onChange: (current, prev) => console.log(`current index: ${current}, prev index: ${prev}`),
                    }}
                  >

                    {dataProjectFromDB.length > 0 && dataProjectFromDB[0].imageRender1 && (
                      dataProjectFromDB[0].imageRender1.includes('.pdf?') ? (
                        <a
                          href={dataProjectFromDB[0].imageRender1}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.stopPropagation(); }}
                        >
                          <img
                            src='https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3'
                            style={{ height: "11vh" }}
                            alt="PDF Logo"
                          />
                        </a>
                      ) : (
                        <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                          <Image width={'auto'} height={'11vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].imageRender1 || "https://firebasestorage.googleapis.com/v0/b/klf-project-manager-b97dc.appspot.com/o/images%2Funknown-logo.png?alt=media&token=ff697c36-6f87-4aa7-9fe1-edc1c0a624b1")} />
                        </span>
                      )
                    )}
                    {dataProjectFromDB.length > 0 && dataProjectFromDB[0].imageRender2 && (
                      dataProjectFromDB[0].imageRender2.includes('.pdf?') ? (
                        <a
                          href={dataProjectFromDB[0].imageRender2}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.stopPropagation(); }}
                        >
                          <img
                            src='https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3'
                            style={{ height: "11vh" }}
                            alt="PDF Logo"
                          />
                        </a>
                      ) : (
                        <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                          <Image width={'auto'} height={'11vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].imageRender2)} />
                        </span>
                      )
                    )}
                    {dataProjectFromDB.length > 0 && dataProjectFromDB[0].imageRender3 && (
                      dataProjectFromDB[0].imageRender3.includes('.pdf?') ? (
                        <a
                          href={dataProjectFromDB[0].imageRender3}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.stopPropagation(); }}
                        >
                          <img
                            src='https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3'
                            style={{ height: "11vh" }}
                            alt="PDF Logo"
                          />
                        </a>
                      ) : (
                        <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                          <Image width={'auto'} height={'11vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].imageRender3)} />
                        </span>
                      )
                    )}
                    {dataProjectFromDB.length > 0 && dataProjectFromDB[0].imageRender4 && (
                      dataProjectFromDB[0].imageRender4.includes('.pdf?') ? (
                        <a
                          href={dataProjectFromDB[0].imageRender4}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.stopPropagation(); }}
                        >
                          <img
                            src='https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3'
                            style={{ height: "11vh" }}
                            alt="PDF Logo"
                          />
                        </a>
                      ) : (
                        <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                          <Image width={'auto'} height={'11vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].imageRender4)} />
                        </span>
                      )
                    )}
                    {dataProjectFromDB.length > 0 && dataProjectFromDB[0].imageRender5 && (
                      dataProjectFromDB[0].imageRender5.includes('.pdf?') ? (
                        <a
                          href={dataProjectFromDB[0].imageRender5}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.stopPropagation(); }}
                        >
                          <img
                            src='https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3'
                            style={{ height: "11vh" }}
                            alt="PDF Logo"
                          />
                        </a>
                      ) : (
                        <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                          <Image width={'auto'} height={'11vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].imageRender5)} />
                        </span>
                      )
                    )}
                    {dataProjectFromDB.length > 0 && dataProjectFromDB[0].imageRender6 && (
                      dataProjectFromDB[0].imageRender6.includes('.pdf?') ? (
                        <a
                          href={dataProjectFromDB[0].imageRender6}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.stopPropagation(); }}
                        >
                          <img
                            src='https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3'
                            style={{ height: "11vh" }}
                            alt="PDF Logo"
                          />
                        </a>
                      ) : (
                        <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                          <Image width={'auto'} height={'11vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].imageRender6)} />
                        </span>
                      )
                    )}
                    {dataProjectFromDB.length > 0 && dataProjectFromDB[0].imageRender7 && (
                      dataProjectFromDB[0].imageRender7.includes('.pdf?') ? (
                        <a
                          href={dataProjectFromDB[0].imageRender7}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.stopPropagation(); }}
                        >
                          <img
                            src='https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3'
                            style={{ height: "11vh" }}
                            alt="PDF Logo"
                          />
                        </a>
                      ) : (
                        <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                          <Image width={'auto'} height={'11vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].imageRender7)} />
                        </span>
                      )
                    )}
                    {dataProjectFromDB.length > 0 && dataProjectFromDB[0].imageRender8 && (
                      dataProjectFromDB[0].imageRender8.includes('.pdf?') ? (
                        <a
                          href={dataProjectFromDB[0].imageRender8}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.stopPropagation(); }}
                        >
                          <img
                            src='https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3'
                            style={{ height: "11vh" }}
                            alt="PDF Logo"
                          />
                        </a>
                      ) : (
                        <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                          <Image width={'auto'} height={'11vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].imageRender8)} />
                        </span>
                      )
                    )}
                    {dataProjectFromDB.length > 0 && dataProjectFromDB[0].imageRender9 && (
                      dataProjectFromDB[0].imageRender9.includes('.pdf?') ? (
                        <a
                          href={dataProjectFromDB[0].imageRender9}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.stopPropagation(); }}
                        >
                          <img
                            src='https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3'
                            style={{ height: "11vh" }}
                            alt="PDF Logo"
                          />
                        </a>
                      ) : (
                        <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                          <Image width={'auto'} height={'11vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].imageRender9)} />
                        </span>
                      )
                    )}
                    {dataProjectFromDB.length > 0 && dataProjectFromDB[0].imageRender10 && (
                      dataProjectFromDB[0].imageRender10.includes('.pdf?') ? (
                        <a
                          href={dataProjectFromDB[0].imageRender10}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.stopPropagation(); }}
                        >
                          <img
                            src='https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3'
                            style={{ height: "11vh" }}
                            alt="PDF Logo"
                          />
                        </a>
                      ) : (
                        <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                          <Image width={'auto'} height={'11vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].imageRender10)} />
                        </span>
                      )
                    )}
                  </Image.PreviewGroup>
                </div>

                <div>
                  <h6 className='mt-4' style={{ color: globalTheme == "light" ? "black" : "white" }}>Deskripsi Produk</h6>
                  <p style={{ whiteSpace: 'pre-line', color: globalTheme == "light" ? "black" : "white" }}>{dataProjectFromDB.length > 0 ? dataProjectFromDB[0].Spesifikasi : ''}</p>
                </div>

              </div>
            </div></Col>




        </Row>
      </Container>


      {/* Modal */}
      <Modal show={showMenuModal} onHide={() => setShowMenuModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Catalog</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {dataStorageFromDB.map((item, index) => (
            <div className="col position-relative mb-2" key={index}>
              <Link to={`/catalog/${item.id}`} className="btn btn-light border d-block text-start py-4 position-relative">
                < MdFolderCopy style={{ margin: "0px 10px" }} /> {item.name}
              </Link>
            </div>
          ))}
        </Modal.Body>
      </Modal>
      {/* End Modal */}

      {/* Modal */}
      <Modal show={showAddProductModal} onHide={() => setShowAddProductModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Your comment form here */}
          <label>Image :</label><br />
          <input
            className="form-control"
            type="file"
            multiple
            onChange={(e) => {
              const files = e.target.files;
              setFileToUpload(files[0]);
              setFileToUpload2(files[1]);
              setFileToUpload3(files[2]);
              setFileToUpload4(files[3]);
              setFileToUpload5(files[4]);
              setFileToUpload6(files[5]);
              setFileToUpload7(files[6]);
              setFileToUpload8(files[7]);
              setFileToUpload9(files[8]);
              setFileToUpload10(files[9]);
            }}
          />


          <label className='mt-2'>Product Name :</label>
          <input className="form-control" type='text' value={productName} onChange={(e) => setProductName(e.target.value)} required></input>
          <label className='mt-2'>Description :</label>
          <textarea className="form-control" type='text' rows="5" value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleSubmitAddProduct}>Submit</Button>
        </Modal.Footer>
      </Modal>
      {/* End Modal */}

      {/* Modal */}
      <Modal show={showInformationModal} onHide={() => setShowInformationModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Information</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Your comment form here */}
          <label className='mt-2 fw-semibold'>Product Name :</label>
          <input className="form-control" type='text' value={productName} onChange={(e) => setProductName(e.target.value)} required></input>
          <label className='mt-3 fw-semibold'>Description :</label>
          <textarea className="form-control" type='text' rows="5" value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleSubmitInformation}>Submit</Button>
        </Modal.Footer>
      </Modal>
      {/* End Modal */}


      {/* Modal */}
      <Modal show={showDeleteProductModal} onHide={() => setShowDeleteProductModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this product ({productName})?</Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={handleDeleteProductConfirm}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
      {/* End Modal */}

      <Modal show={showImageEdit} onHide={() => setShowImageEdit(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Image</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5 className='fw-semibold'>Gambar Produk</h5>
          <div className='mb-3'>
            <p className='mb-1 fw-semibold'>Image 1</p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {dataProjectFromDB.length > 0 && dataProjectFromDB[0].image1 ? (
                <>
                  <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                    <img width={'auto'} height={'100vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].image1.includes('.pdf?') ? pdfLogoImg : dataProjectFromDB[0].image1)} />
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: "1vh" }}>
                    <button className='btn btn-danger mb-1' onClick={() => { setShowConfirmDeleteImage(true); setShowImageEdit(false); setImageDeleteNumber('image1'); }}><MdDelete /></button>
                    <div className='d-flex'>
                      <input className="form-control" type="file" data-id="editImage1"
                        onChange={(e) => {
                          const files = e.target.files;
                          setFileToUploadEdit(files[0]);
                        }}
                      />
                      <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImage1')}><FaPaste /></Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className='d-flex'>
                  <input className="form-control" type="file" data-id="editImage1"
                    onChange={(e) => {
                      const files = e.target.files;
                      setFileToUploadEdit(files[0]);
                    }}
                  />
                  <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImage1')}><FaPaste /></Button>
                </div>
              )}
            </div>
          </div>


          <div className='mb-3'>
            <p className='mb-1 fw-semibold'>Image 2</p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {dataProjectFromDB.length > 0 && dataProjectFromDB[0].image2 ? (
                <>
                  <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                    <img width={'auto'} height={'100vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].image2.includes('.pdf?') ? pdfLogoImg : dataProjectFromDB[0].image2)} />
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: "1vh" }}>
                    <button className='btn btn-danger mb-1' onClick={() => { setShowConfirmDeleteImage(true); setShowImageEdit(false); setImageDeleteNumber('image2'); }}><MdDelete /></button>
                    <div className='d-flex'>
                      <input className="form-control" type="file" data-id="editImage2"
                        onChange={(e) => {
                          const files = e.target.files;
                          setFileToUploadEdit2(files[0]);
                        }}
                      />
                      <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImage2')}><FaPaste /></Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className='d-flex'>
                  <input className="form-control" type="file" data-id="editImage2"
                    onChange={(e) => {
                      const files = e.target.files;
                      setFileToUploadEdit2(files[0]);
                    }}
                  />
                  <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImage2')}><FaPaste /></Button>
                </div>
              )}
            </div>
          </div>


          <div className='mb-3'>
            <p className='mb-1 fw-semibold'>Image 3</p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {dataProjectFromDB.length > 0 && dataProjectFromDB[0].image3 ? (
                <>
                  <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                    <img width={'auto'} height={'100vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].image3.includes('.pdf?') ? pdfLogoImg : dataProjectFromDB[0].image3)} />
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: "1vh" }}>
                    <button className='btn btn-danger mb-1' onClick={() => { setShowConfirmDeleteImage(true); setShowImageEdit(false); setImageDeleteNumber('image3'); }}><MdDelete /></button>
                    <div className='d-flex'>
                      <input className="form-control" type="file" data-id="editImage3"
                        onChange={(e) => {
                          const files = e.target.files;
                          setFileToUploadEdit3(files[0]);
                        }}
                      />
                      <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImage3')}><FaPaste /></Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className='d-flex'>
                  <input className="form-control" type="file" data-id="editImage3"
                    onChange={(e) => {
                      const files = e.target.files;
                      setFileToUploadEdit3(files[0]);
                    }}
                  />
                  <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImage3')}><FaPaste /></Button>
                </div>
              )}
            </div>
          </div>


          <div className='mb-3'>
            <p className='mb-1 fw-semibold'>Image 4</p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {dataProjectFromDB.length > 0 && dataProjectFromDB[0].image4 ? (
                <>
                  <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                    <img width={'auto'} height={'100vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].image4.includes('.pdf?') ? pdfLogoImg : dataProjectFromDB[0].image4)} />
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: "1vh" }}>
                    <button className='btn btn-danger mb-1' onClick={() => { setShowConfirmDeleteImage(true); setShowImageEdit(false); setImageDeleteNumber('image4'); }}><MdDelete /></button>
                    <div className='d-flex'>
                      <input className="form-control" type="file" data-id="editImage4"
                        onChange={(e) => {
                          const files = e.target.files;
                          setFileToUploadEdit4(files[0]);
                        }}
                      />
                      <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImage4')}><FaPaste /></Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className='d-flex'>
                  <input className="form-control" type="file" data-id="editImage4"
                    onChange={(e) => {
                      const files = e.target.files;
                      setFileToUploadEdit4(files[0]);
                    }}
                  />
                  <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImage4')}><FaPaste /></Button>
                </div>
              )}
            </div>
          </div>


          <div className='mb-3'>
            <p className='mb-1 fw-semibold'>Image 5</p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {dataProjectFromDB.length > 0 && dataProjectFromDB[0].image5 ? (
                <>
                  <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                    <img width={'auto'} height={'100vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].image5.includes('.pdf?') ? pdfLogoImg : dataProjectFromDB[0].image5)} />
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: "1vh" }}>
                    <button className='btn btn-danger mb-1' onClick={() => { setShowConfirmDeleteImage(true); setShowImageEdit(false); setImageDeleteNumber('image5'); }}><MdDelete /></button>
                    <div className='d-flex'>
                      <input className="form-control" type="file" data-id="editImage5"
                        onChange={(e) => {
                          const files = e.target.files;
                          setFileToUploadEdit5(files[0]);
                        }}
                      />
                      <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImage5')}><FaPaste /></Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className='d-flex'>
                  <input className="form-control" type="file" data-id="editImage5"
                    onChange={(e) => {
                      const files = e.target.files;
                      setFileToUploadEdit5(files[0]);
                    }}
                  />
                  <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImage5')}><FaPaste /></Button>
                </div>
              )}
            </div>
          </div>

          <div className='mb-3'>
            <p className='mb-1 fw-semibold'>Image 6</p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {dataProjectFromDB.length > 0 && dataProjectFromDB[0].image6 ? (
                <>
                  <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                    <img width={'auto'} height={'100vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].image6.includes('.pdf?') ? pdfLogoImg : dataProjectFromDB[0].image6)} />
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: "1vh" }}>
                    <button className='btn btn-danger mb-1' onClick={() => { setShowConfirmDeleteImage(true); setShowImageEdit(false); setImageDeleteNumber('image6'); }}><MdDelete /></button>
                    <div className='d-flex'>
                      <input className="form-control" type="file" data-id="editImage6"
                        onChange={(e) => {
                          const files = e.target.files;
                          setFileToUploadEdit6(files[0]);
                        }}
                      />
                      <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImage6')}><FaPaste /></Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className='d-flex'>
                  <input className="form-control" type="file" data-id="editImage6"
                    onChange={(e) => {
                      const files = e.target.files;
                      setFileToUploadEdit6(files[0]);
                    }}
                  />
                  <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImage6')}><FaPaste /></Button>
                </div>
              )}
            </div>
          </div>

          <div className='mb-3'>
            <p className='mb-1 fw-semibold'>Image 7</p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {dataProjectFromDB.length > 0 && dataProjectFromDB[0].image7 ? (
                <>
                  <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                    <img width={'auto'} height={'100vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].image7.includes('.pdf?') ? pdfLogoImg : dataProjectFromDB[0].image7)} />
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: "1vh" }}>
                    <button className='btn btn-danger mb-1' onClick={() => { setShowConfirmDeleteImage(true); setShowImageEdit(false); setImageDeleteNumber('image7'); }}><MdDelete /></button>
                    <div className='d-flex'>
                      <input className="form-control" type="file" data-id="editImage7"
                        onChange={(e) => {
                          const files = e.target.files;
                          setFileToUploadEdit7(files[0]);
                        }}
                      />
                      <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImage7')}><FaPaste /></Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className='d-flex'>
                  <input className="form-control" type="file" data-id="editImage7"
                    onChange={(e) => {
                      const files = e.target.files;
                      setFileToUploadEdit7(files[0]);
                    }}
                  />
                  <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImage7')}><FaPaste /></Button>
                </div>
              )}
            </div>
          </div>

          <div className='mb-3'>
            <p className='mb-1 fw-semibold'>Image 8</p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {dataProjectFromDB.length > 0 && dataProjectFromDB[0].image8 ? (
                <>
                  <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                    <img width={'auto'} height={'100vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].image8.includes('.pdf?') ? pdfLogoImg : dataProjectFromDB[0].image8)} />
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: "1vh" }}>
                    <button className='btn btn-danger mb-1' onClick={() => { setShowConfirmDeleteImage(true); setShowImageEdit(false); setImageDeleteNumber('image8'); }}><MdDelete /></button>
                    <div className='d-flex'>
                      <input className="form-control" type="file" data-id="editImage8"
                        onChange={(e) => {
                          const files = e.target.files;
                          setFileToUploadEdit8(files[0]);
                        }}
                      />
                      <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImage8')}><FaPaste /></Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className='d-flex'>
                  <input className="form-control" type="file" data-id="editImage8"
                    onChange={(e) => {
                      const files = e.target.files;
                      setFileToUploadEdit8(files[0]);
                    }}
                  />
                  <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImage8')}><FaPaste /></Button>
                </div>
              )}
            </div>
          </div>

          <div className='mb-3'>
            <p className='mb-1 fw-semibold'>Image 9</p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {dataProjectFromDB.length > 0 && dataProjectFromDB[0].image9 ? (
                <>
                  <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                    <img width={'auto'} height={'100vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].image9.includes('.pdf?') ? pdfLogoImg : dataProjectFromDB[0].image9)} />
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: "1vh" }}>
                    <button className='btn btn-danger mb-1' onClick={() => { setShowConfirmDeleteImage(true); setShowImageEdit(false); setImageDeleteNumber('image9'); }}><MdDelete /></button>
                    <div className='d-flex'>
                      <input className="form-control" type="file" data-id="editImage9"
                        onChange={(e) => {
                          const files = e.target.files;
                          setFileToUploadEdit9(files[0]);
                        }}
                      />
                      <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImage9')}><FaPaste /></Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className='d-flex'>
                  <input className="form-control" type="file" data-id="editImage9"
                    onChange={(e) => {
                      const files = e.target.files;
                      setFileToUploadEdit9(files[0]);
                    }}
                  />
                  <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImage9')}><FaPaste /></Button>
                </div>
              )}
            </div>
          </div>


          <div className='mb-3'>
            <p className='mb-1 fw-semibold'>Image 10</p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {dataProjectFromDB.length > 0 && dataProjectFromDB[0].image10 ? (
                <>
                  <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                    <img width={'auto'} height={'100vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].image10.includes('.pdf?') ? pdfLogoImg : dataProjectFromDB[0].image10)} />
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: "1vh" }}>
                    <button className='btn btn-danger mb-1' onClick={() => { setShowConfirmDeleteImage(true); setShowImageEdit(false); setImageDeleteNumber('image10'); }}><MdDelete /></button>
                    <div className='d-flex'>
                      <input className="form-control" type="file" data-id="editImage10"
                        onChange={(e) => {
                          const files = e.target.files;
                          setFileToUploadEdit10(files[0]);
                        }}
                      />
                      <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImage10')}><FaPaste /></Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className='d-flex'>
                  <input className="form-control" type="file" data-id="editImage10"
                    onChange={(e) => {
                      const files = e.target.files;
                      setFileToUploadEdit10(files[0]);
                    }}
                  />
                  <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImage10')}><FaPaste /></Button>
                </div>
              )}
            </div>
          </div>

          <h5 className='fw-semibold'>Gambar Render</h5>
          <div className='mb-3'>
            <p className='mb-1 fw-semibold'>Image Render 1</p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {dataProjectFromDB.length > 0 && dataProjectFromDB[0].imageRender1 ? (
                <>
                  <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                    <img width={'auto'} height={'100vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].imageRender1.includes('.pdf?') ? pdfLogoImg : dataProjectFromDB[0].imageRender1)} />
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: "1vh" }}>
                    <button className='btn btn-danger mb-1' onClick={() => { setShowConfirmDeleteImage(true); setShowImageEdit(false); setImageDeleteNumber('imageRender1'); }}><MdDelete /></button>
                    <div className='d-flex'>
                      <input className="form-control" type="file" data-id="editImageRender1"
                        onChange={(e) => {
                          const files = e.target.files;
                          setFileToUploadEditRender(files[0]);
                        }}
                      />
                      <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImageRender1')}><FaPaste /></Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className='d-flex'>
                  <input className="form-control" type="file" data-id="editImageRender1"
                    onChange={(e) => {
                      const files = e.target.files;
                      setFileToUploadEditRender(files[0]);
                    }}
                  />
                  <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImageRender1')}><FaPaste /></Button>
                </div>
              )}
            </div>
          </div>


          <div className='mb-3'>
            <p className='mb-1 fw-semibold'>Image Render 2</p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {dataProjectFromDB.length > 0 && dataProjectFromDB[0].imageRender2 ? (
                <>
                  <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                    <img width={'auto'} height={'100vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].imageRender2.includes('.pdf?') ? pdfLogoImg : dataProjectFromDB[0].imageRender2)} />
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: "1vh" }}>
                    <button className='btn btn-danger mb-1' onClick={() => { setShowConfirmDeleteImage(true); setShowImageEdit(false); setImageDeleteNumber('imageRender2'); }}><MdDelete /></button>
                    <div className='d-flex'>
                      <input className="form-control" type="file" data-id="editImageRender2"
                        onChange={(e) => {
                          const files = e.target.files;
                          setFileToUploadEditRender2(files[0]);
                        }}
                      />
                      <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImageRender2')}><FaPaste /></Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className='d-flex'>
                  <input className="form-control" type="file" data-id="editImageRender2"
                    onChange={(e) => {
                      const files = e.target.files;
                      setFileToUploadEditRender2(files[0]);
                    }}
                  />
                  <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImageRender2')}><FaPaste /></Button>
                </div>
              )}
            </div>
          </div>


          <div className='mb-3'>
            <p className='mb-1 fw-semibold'>Image Render 3</p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {dataProjectFromDB.length > 0 && dataProjectFromDB[0].imageRender3 ? (
                <>
                  <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                    <img width={'auto'} height={'100vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].imageRender3.includes('.pdf?') ? pdfLogoImg : dataProjectFromDB[0].imageRender3)} />
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: "1vh" }}>
                    <button className='btn btn-danger mb-1' onClick={() => { setShowConfirmDeleteImage(true); setShowImageEdit(false); setImageDeleteNumber('imageRender3'); }}><MdDelete /></button>
                    <div className='d-flex'>
                      <input className="form-control" type="file" data-id="editImageRender3"
                        onChange={(e) => {
                          const files = e.target.files;
                          setFileToUploadEditRender3(files[0]);
                        }}
                      />
                      <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImageRender3')}><FaPaste /></Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className='d-flex'>
                  <input className="form-control" type="file" data-id="editImageRender3"
                    onChange={(e) => {
                      const files = e.target.files;
                      setFileToUploadEditRender3(files[0]);
                    }}
                  />
                  <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImageRender3')}><FaPaste /></Button>
                </div>
              )}
            </div>
          </div>


          <div className='mb-3'>
            <p className='mb-1 fw-semibold'>Image Render 4</p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {dataProjectFromDB.length > 0 && dataProjectFromDB[0].imageRender4 ? (
                <>
                  <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                    <img width={'auto'} height={'100vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].imageRender4.includes('.pdf?') ? pdfLogoImg : dataProjectFromDB[0].imageRender4)} />
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: "1vh" }}>
                    <button className='btn btn-danger mb-1' onClick={() => { setShowConfirmDeleteImage(true); setShowImageEdit(false); setImageDeleteNumber('imageRender4'); }}><MdDelete /></button>
                    <div className='d-flex'>
                      <input className="form-control" type="file" data-id="editImageRender4"
                        onChange={(e) => {
                          const files = e.target.files;
                          setFileToUploadEditRender4(files[0]);
                        }}
                      />
                      <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImageRender4')}><FaPaste /></Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className='d-flex'>
                  <input className="form-control" type="file" data-id="editImageRender4"
                    onChange={(e) => {
                      const files = e.target.files;
                      setFileToUploadEditRender4(files[0]);
                    }}
                  />
                  <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImageRender4')}><FaPaste /></Button>
                </div>
              )}
            </div>
          </div>


          <div className='mb-3'>
            <p className='mb-1 fw-semibold'>Image Render 5</p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {dataProjectFromDB.length > 0 && dataProjectFromDB[0].imageRender5 ? (
                <>
                  <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                    <img width={'auto'} height={'100vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].imageRender5.includes('.pdf?') ? pdfLogoImg : dataProjectFromDB[0].imageRender5)} />
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: "1vh" }}>
                    <button className='btn btn-danger mb-1' onClick={() => { setShowConfirmDeleteImage(true); setShowImageEdit(false); setImageDeleteNumber('imageRender5'); }}><MdDelete /></button>
                    <div className='d-flex'>
                      <input className="form-control" type="file" data-id="editImageRender5"
                        onChange={(e) => {
                          const files = e.target.files;
                          setFileToUploadEditRender5(files[0]);
                        }}
                      />
                      <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImageRender5')}><FaPaste /></Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className='d-flex'>
                  <input className="form-control" type="file" data-id="editImageRender5"
                    onChange={(e) => {
                      const files = e.target.files;
                      setFileToUploadEditRender5(files[0]);
                    }}
                  />
                  <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImageRender5')}><FaPaste /></Button>
                </div>
              )}
            </div>
          </div>

          <div className='mb-3'>
            <p className='mb-1 fw-semibold'>Image Render 6</p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {dataProjectFromDB.length > 0 && dataProjectFromDB[0].imageRender6 ? (
                <>
                  <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                    <img width={'auto'} height={'100vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].imageRender6.includes('.pdf?') ? pdfLogoImg : dataProjectFromDB[0].imageRender6)} />
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: "1vh" }}>
                    <button className='btn btn-danger mb-1' onClick={() => { setShowConfirmDeleteImage(true); setShowImageEdit(false); setImageDeleteNumber('imageRender6'); }}><MdDelete /></button>
                    <div className='d-flex'>
                      <input className="form-control" type="file" data-id="editImageRender6"
                        onChange={(e) => {
                          const files = e.target.files;
                          setFileToUploadEditRender6(files[0]);
                        }}
                      />
                      <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImageRender6')}><FaPaste /></Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className='d-flex'>
                  <input className="form-control" type="file" data-id="editImageRender6"
                    onChange={(e) => {
                      const files = e.target.files;
                      setFileToUploadEditRender6(files[0]);
                    }}
                  />
                  <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImageRender6')}><FaPaste /></Button>
                </div>
              )}
            </div>
          </div>

          <div className='mb-3'>
            <p className='mb-1 fw-semibold'>Image Render 7</p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {dataProjectFromDB.length > 0 && dataProjectFromDB[0].imageRender7 ? (
                <>
                  <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                    <img width={'auto'} height={'100vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].imageRender7.includes('.pdf?') ? pdfLogoImg : dataProjectFromDB[0].imageRender7)} />
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: "1vh" }}>
                    <button className='btn btn-danger mb-1' onClick={() => { setShowConfirmDeleteImage(true); setShowImageEdit(false); setImageDeleteNumber('imageRender7'); }}><MdDelete /></button>
                    <div className='d-flex'>
                      <input className="form-control" type="file" data-id="editImageRender7"
                        onChange={(e) => {
                          const files = e.target.files;
                          setFileToUploadEditRender7(files[0]);
                        }}
                      />
                      <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImageRender7')}><FaPaste /></Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className='d-flex'>
                  <input className="form-control" type="file" data-id="editImageRender7"
                    onChange={(e) => {
                      const files = e.target.files;
                      setFileToUploadEditRender7(files[0]);
                    }}
                  />
                  <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImageRender7')}><FaPaste /></Button>
                </div>
              )}
            </div>
          </div>

          <div className='mb-3'>
            <p className='mb-1 fw-semibold'>Image Render 8</p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {dataProjectFromDB.length > 0 && dataProjectFromDB[0].imageRender8 ? (
                <>
                  <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                    <img width={'auto'} height={'100vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].imageRender8.includes('.pdf?') ? pdfLogoImg : dataProjectFromDB[0].imageRender8)} />
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: "1vh" }}>
                    <button className='btn btn-danger mb-1' onClick={() => { setShowConfirmDeleteImage(true); setShowImageEdit(false); setImageDeleteNumber('imageRender8'); }}><MdDelete /></button>
                    <div className='d-flex'>
                      <input className="form-control" type="file" data-id="editImageRender8"
                        onChange={(e) => {
                          const files = e.target.files;
                          setFileToUploadEditRender8(files[0]);
                        }}
                      />
                      <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImageRender8')}><FaPaste /></Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className='d-flex'>
                  <input className="form-control" type="file" data-id="editImageRender8"
                    onChange={(e) => {
                      const files = e.target.files;
                      setFileToUploadEditRender8(files[0]);
                    }}
                  />
                  <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImageRender8')}><FaPaste /></Button>
                </div>
              )}
            </div>
          </div>

          <div className='mb-3'>
            <p className='mb-1 fw-semibold'>Image Render 9</p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {dataProjectFromDB.length > 0 && dataProjectFromDB[0].imageRender9 ? (
                <>
                  <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                    <img width={'auto'} height={'100vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].imageRender9.includes('.pdf?') ? pdfLogoImg : dataProjectFromDB[0].imageRender9)} />
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: "1vh" }}>
                    <button className='btn btn-danger mb-1' onClick={() => { setShowConfirmDeleteImage(true); setShowImageEdit(false); setImageDeleteNumber('imageRender9'); }}><MdDelete /></button>
                    <div className='d-flex'>
                      <input className="form-control" type="file" data-id="editImageRender9"
                        onChange={(e) => {
                          const files = e.target.files;
                          setFileToUploadEditRender9(files[0]);
                        }}
                      />
                      <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImageRender9')}><FaPaste /></Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className='d-flex'>
                  <input className="form-control" type="file" data-id="editImageRender9"
                    onChange={(e) => {
                      const files = e.target.files;
                      setFileToUploadEditRender9(files[0]);
                    }}
                  />
                  <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImageRender9')}><FaPaste /></Button>
                </div>
              )}
            </div>
          </div>


          <div className='mb-3'>
            <p className='mb-1 fw-semibold'>Image Render 10</p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {dataProjectFromDB.length > 0 && dataProjectFromDB[0].imageRender10 ? (
                <>
                  <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
                    <img width={'auto'} height={'100vh'} style={{ borderRadius: "10px" }} src={getImageUrl(dataProjectFromDB[0].imageRender10.includes('.pdf?') ? pdfLogoImg : dataProjectFromDB[0].imageRender10)} />
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: "1vh" }}>
                    <button className='btn btn-danger mb-1' onClick={() => { setShowConfirmDeleteImage(true); setShowImageEdit(false); setImageDeleteNumber('imageRender10'); }}><MdDelete /></button>
                    <div className='d-flex'>
                      <input className="form-control" type="file" data-id="editImageRender10"
                        onChange={(e) => {
                          const files = e.target.files;
                          setFileToUploadEditRender10(files[0]);
                        }}
                      />
                      <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImageRender10')}><FaPaste /></Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className='d-flex'>
                  <input className="form-control" type="file" data-id="editImageRender10"
                    onChange={(e) => {
                      const files = e.target.files;
                      setFileToUploadEditRender10(files[0]);
                    }}
                  />
                  <Button variant="secondary" style={{ marginLeft: "20px", height: "40px", marginTop: "10px" }} onClick={() => pasteImage('editImageRender10')}><FaPaste /></Button>
                </div>
              )}
            </div>
          </div>




        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleSubmitImageEdit}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showConfirmDeleteImage} onHide={() => { setShowConfirmDeleteImage(false); setShowImageEdit(true); }}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this image?</Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={handleDeleteImageConfirm}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>


      <Box sx={{ height: 320, transform: 'translateZ(0px)', flexGrow: 1, position: 'fixed', bottom: 16, right: 16 }}>
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

    </>
  );
};



export default StorageDetail;
