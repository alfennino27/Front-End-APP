import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Col, Row, Modal, Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useNavigate } from 'react-router-dom';
import { heicToJpeg } from '../../Utils/heic';
import '../Pekerjaan/pekerjaan.css';
import 'antd/dist/reset.css';
import { MdDelete, MdFormatListBulletedAdd, MdOutlineEditNote } from 'react-icons/md';
import { debounce } from 'lodash';
import { FaFileInvoice, FaPaste, FaRegImages, FaSearch } from 'react-icons/fa';
import { CiEdit } from 'react-icons/ci';
import { Image, Select, Popconfirm, InputNumber, message, Divider, Input, Space } from 'antd';
import { useTheme } from '../../ThemeContext';
import { getImageUrl } from '../../Utils/image';
import { FiEdit, FiMinus, FiPlus } from "react-icons/fi";
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { NumericFormat } from 'react-number-format';

const { Option } = Select;

const Products = () => {
  const baseUrl = getApiBaseUrl();
  const { globalTheme } = useTheme();
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

  const isMobile = window.innerWidth <= 768;

  const [showTambahDataModal, setShowTambahDataModal] = useState(false);
  const [showEditDataModal, setShowEditDataModal] = useState(false);
  const [showGambarDataModal, setShowGambarDataModal] = useState(false);
  const [showDetailDataModal, setShowDetailDataModal] = useState(false);
  const [showTambahVarianModal, setShowTambahVarianModal] = useState(false);
  const [showEditVarianModal, setShowEditVarianModal] = useState(false);
  const [showEditGambarModal, setShowEditGambarModal] = useState(false);
  const [jumlahImageEdit, setJumlahImageEdit] = useState(10);
  const [showConfirmDeleteImage, setShowConfirmDeleteImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selected3DModelFile, setSelected3DModelFile] = useState(null);
  const [model3dUrl, setModel3dUrl] = useState("");


  const [idProductEdit, setIdProductEdit] = useState("");
  const [idVarianEdit, setIdVarianEdit] = useState("");
  const [linkVideo1, setLinkVideo1] = useState("");
  const [linkVideo2, setLinkVideo2] = useState("");
  const [linkVideo3, setLinkVideo3] = useState("");
  const [judul, setJudul] = useState("");
  const [varian, setVarian] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [category, setCategory] = useState("");
  const [stainless, setStainless] = useState("");
  const [besi, setBesi] = useState("");
  const [kayu, setKayu] = useState("");
  const [jok, setJok] = useState("");
  const [rotan, setRotan] = useState("");
  const [finishing, setFinishing] = useState("");
  const [marmer, setMarmer] = useState("");
  const [fiber, setFiber] = useState("");
  const [veneer, setVeneer] = useState("");
  const [jual, setJual] = useState("");
  const [imageVarianUrl, setImageVarianUrl] = useState("");

  //mulai:
  const [dataProducts, setDataProducts] = useState([]);
  const [dataVarian, setDataVarian] = useState([]);
  const [dataCategory, setDataCategory] = useState([]);
  const [selectedDataProduct, setSelectedDataProduct] = useState({});
  const [imageDeleteNumber, setImageDeleteNumber] = useState('');
  const [dataProjects, setDataProjects] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [filteredDataProducts, setFilteredDataProducts] = useState([]);
  const [filterCategory, setFilterCategory] = useState(null);

  const [productChanges, setProductChanges] = useState({});
  const handleChangeProduct = (productId, field, value) => {
    setProductChanges(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || { id: productId }),
        [field]: value,
      }
    }));
  };


  const [variantChanges, setVariantChanges] = useState({});
  const handleChangeVarian = (varianId, field, value) => {
    setVariantChanges(prev => ({
      ...prev,
      [varianId]: {
        ...(prev[varianId] || { id: varianId }),
        [field]: field === 'varian' ? value : Number(value),
      }
    }));
  };

  // ref untuk mencegah interval mengirim request pertama sebelum data siap
  const isMounted = useRef(false);

  // fungsi autosave: kirim bulk edit apabila ada perubahan
  const autoSave = async () => {
    try {
      // products
      const prodUpdates = Object.values(productChanges);
      if (prodUpdates.length > 0) {
        const resProd = await fetch(`${baseUrl}/products/edit-bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates: prodUpdates }),
        });
        if (!resProd.ok) throw new Error('Products: ' + await resProd.text());
        setProductChanges({});
      }

      // variants
      const varUpdates = Object.values(variantChanges);
      if (varUpdates.length > 0) {
        const resVar = await fetch(`${baseUrl}/products/varian/edit-bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates: varUpdates }),
        });
        if (!resVar.ok) throw new Error('Variants: ' + await resVar.text());
        setVariantChanges({});
      }

      // jika setidaknya satu tipe update dijalankan:
      if (prodUpdates.length > 0 || varUpdates.length > 0) {
        message.success('Auto-save successful');
        // reload data jika perlu
        fetchDataProducts();
        fetchDataVarian();
      }
    } catch (err) {
      console.error('Auto-save error:', err);
      message.error(`Auto-save failed: ${err.message}`);
    }
  };

  // Atur interval autoSave setiap 60000 ms = 1 menit
  useEffect(() => {
    // supaya interval tidak langsung jalan sebelum komponen mount
    isMounted.current = true;
    const id = setInterval(() => {
      if (isMounted.current) {
        autoSave();
      }
    }, 5000);

    return () => {
      clearInterval(id);
      isMounted.current = false;
    };
  }, [productChanges, variantChanges]);


  const [fileToUploadEdit, setFileToUploadEdit] = useState({});
  const handleFileChange = async (index, file) => {
    const conv = await heicToJpeg(file); // HEIC iPhone → JPEG
    setFileToUploadEdit((prev) => ({
      ...prev,
      [index]: conv
    }));
  };

  function pasteImage(modal) {
    console.log("Trying to paste to:", modal);
    const input = document.querySelector(`input[data-id="${modal}"]`);
    console.log("Found input:", input);
    if (!input) {
      alert(`Input tidak ditemukan: ${modal}`);
      return;
    }

    navigator.clipboard.read().then(clipboardItems => {
      console.log('clipboardItems:', clipboardItems);
      clipboardItems.forEach(item => {
        const imageType = item.types.includes('image/png')
          ? 'image/png'
          : item.types.includes('image/jpeg')
            ? 'image/jpeg'
            : '';

        if (imageType) {
          item.getType(imageType).then(blob => {
            const extension = imageType.split('/')[1];
            const file = new File([blob], `pasted-image.${extension}`, { type: imageType });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);

            let inputElement = document.querySelector(`input[data-id="${modal}"]`);

            if (modal.startsWith("editImage")) {
              // Tangani editImage1 sampai 50
              const index = parseInt(modal.replace("editImage", ""));
              if (!isNaN(index)) {
                setFileToUploadEdit(prev => ({
                  ...prev,
                  [index]: new File([blob], `pasted-image${index}.${extension}`, { type: imageType })
                }));
              }
            }

            if (inputElement) {
              inputElement.files = dataTransfer.files;
            }
          });
        }
      });
    });
  }



  const fetchDataProducts = async () => {
    try {
      const res = await fetch(`${baseUrl}/products/get`);
      const data = await res.json();
      setDataProducts(data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const fetchDataVarian = async () => {
    try {
      const res = await fetch(`${baseUrl}/products/varian/get`);
      const data = await res.json();
      setDataVarian(data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const fetchDataCategory = async () => {
    try {
      const res = await fetch(`${baseUrl}/products/category/get`);
      const data = await res.json();
      setDataCategory(data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const fetchProjects = async () => {
    try {
      // Request Completed
      const resCompleted = await fetch(`${baseUrl}/projects/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showCompleted: true })
      });
      const dataCompleted = await resCompleted.json();

      // Request Ongoing
      const resOngoing = await fetch(`${baseUrl}/projects/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showCompleted: false })
      });
      const dataOngoing = await resOngoing.json();

      // Gabungkan hasil
      const allProjects = [...dataCompleted, ...dataOngoing];
      setDataProjects(allProjects);
      console.log('Fetched projects:', allProjects);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };


  useEffect(() => {
    fetchDataProducts();
    fetchDataVarian();
    fetchDataCategory();
    fetchProjects();
  }, []);

  useEffect(() => {
    if (filterCategory !== '') {
      const filtered = dataProducts.filter(
        (product) => product.category === filterCategory
      );
      setFilteredDataProducts(filtered);
    }
  }, [filterCategory, dataProducts]);


  const refreshData = () => {
    setIdProductEdit("");
    setJudul("");
    setLinkVideo1("");
    setLinkVideo2("");
    setLinkVideo3("");
    setDeskripsi("");
    setCategory("");
    setSelected3DModelFile(null);
  }

  const refreshDataVarian = () => {
    setVarian("");
    setStainless("");
    setBesi("");
    setKayu("");
    setJok("");
    setRotan("");
    setFinishing("");
    setMarmer("");
    setFiber("");
    setVeneer("");
    setJual("");
    setSelectedImageFile(null);
    setImageVarianUrl("");
  }

  const handleSubmitData = async () => {
    setShowTambahDataModal(false);

    try {
      const formData = new FormData();
      formData.append("judul", judul);
      formData.append("category", category);
      formData.append("linkVideo1", linkVideo1);
      formData.append("linkVideo2", linkVideo2);
      formData.append("linkVideo3", linkVideo3);
      formData.append("deskripsi", deskripsi);

      if (selected3DModelFile) {
        formData.append("model3d", selected3DModelFile);
      }

      const res = await fetch(`${baseUrl}/products/create`, {
        method: "POST",
        body: formData, // biarkan browser set Content-Type
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal menambahkan data");
      }

      const result = await res.json();
      console.log("Data berhasil ditambahkan:", result);
      fetchDataProducts();
    } catch (e) {
      console.error("Error menambahkan data:", e.message);
    }
  };


  const handleEditVarian = (item) => {
    console.log(item);
    setIdVarianEdit(item.id);
    setVarian(item.varian);
    setStainless(item.stainless);
    setBesi(item.besi);
    setKayu(item.kayu);
    setJok(item.jok);
    setRotan(item.rotan);
    setFinishing(item.finishing);
    setMarmer(item.marmer);
    setFiber(item.fiber);
    setVeneer(item.veneer);
    setJual(item.jual);
    setImageVarianUrl(item.image);
    setSelectedImageFile(null);
    setShowEditVarianModal(true);
  };

  const handleSubmitEditData = async () => {
    setShowEditDataModal(false);
    console.log("selected3DModelFile:", selected3DModelFile);
    try {
      const formData = new FormData();
      formData.append("id", idProductEdit);
      formData.append("judul", judul);
      formData.append("category", category);
      formData.append("linkVideo1", linkVideo1);
      formData.append("linkVideo2", linkVideo2);
      formData.append("linkVideo3", linkVideo3);
      formData.append("deskripsi", deskripsi);

      if (selected3DModelFile) {
        formData.append("model3d", selected3DModelFile);
      }

      formData.append("linkProject", JSON.stringify(selectedProjects));


      console.log("linkProject to send:", selectedProjects);

      const res = await fetch(`${baseUrl}/products/edit`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal mengedit data");
      }

      const result = await res.json();
      console.log("data berhasil diedit:", result);
      fetchDataProducts();
    } catch (e) {
      console.error("Error mengedit data:", e.message);
    }
  };


  const handleDeleteProduk = async () => {
    try {
      const res = await fetch(`${baseUrl}/products/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: idProductEdit }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal menghapus data");
      }

      const result = await res.json();
      console.log("Produk berhasil dihapus:", result);
      fetchDataProducts();
      setShowEditDataModal(false);
    } catch (e) {
      console.error("Error menghapus data:", e.message);
    }
  };






  const handleSubmitVarian = async () => {
    setShowTambahVarianModal(false);

    try {
      const formData = new FormData();
      formData.append("idProduct", idProductEdit);
      formData.append("varian", varian);
      formData.append("stainless", stainless);
      formData.append("besi", besi);
      formData.append("kayu", kayu);
      formData.append("jok", jok);
      formData.append("rotan", rotan);
      formData.append("finishing", finishing);
      formData.append("marmer", marmer);
      formData.append("fiber", fiber);
      formData.append("veneer", veneer);
      formData.append("jual", jual);

      if (selectedImageFile) {
        formData.append("image", selectedImageFile);
      }

      const res = await fetch(`${baseUrl}/products/varian/create`, {
        method: "POST",
        body: formData, // multipart/form-data
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal menambahkan data");
      }

      const result = await res.json();
      console.log("Data berhasil ditambahkan:", result);
      fetchDataVarian();
    } catch (e) {
      console.error("Error menambahkan data:", e.message);
    }
  };

  const handleSubmitEditVarian = async () => {
    setShowEditVarianModal(false);

    try {
      const formData = new FormData();
      formData.append("id", idVarianEdit);
      formData.append("varian", varian);
      formData.append("stainless", stainless);
      formData.append("besi", besi);
      formData.append("kayu", kayu);
      formData.append("jok", jok);
      formData.append("rotan", rotan);
      formData.append("finishing", finishing);
      formData.append("marmer", marmer);
      formData.append("fiber", fiber);
      formData.append("veneer", veneer);
      formData.append("jual", jual);

      if (selectedImageFile) {
        formData.append("image", selectedImageFile);
      }

      const res = await fetch(`${baseUrl}/products/varian/edit`, {
        method: "POST",
        body: formData, // tanpa Content-Type, fetch otomatis set multipart/form-data
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal mengedit data");
      }

      const result = await res.json();
      console.log("data berhasil diedit:", result);
      fetchDataVarian();
    } catch (e) {
      console.error("Error mengedit data:", e.message);
    }
  };




  const handleDeleteVarian = async () => {
    try {
      const res = await fetch(`${baseUrl}/products/varian/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: idVarianEdit }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal menghapus data");
      }

      const result = await res.json();
      console.log("Produk berhasil dihapus:", result);
      fetchDataVarian();
      setShowEditVarianModal(false);
    } catch (e) {
      console.error("Error menghapus data:", e.message);
    }
  };


  const handleSubmitImageEdit = async () => {
    setShowEditGambarModal(false);
    const formData = new FormData();

    for (let i = 1; i <= jumlahImageEdit; i++) {
      const file = fileToUploadEdit[i];
      if (file) {
        formData.append(`image${i}`, file);
      }
    }

    try {
      const res = await fetch(`${baseUrl}/products/images/update/${idProductEdit}`, {
        method: 'PUT',
        body: formData,
      });

      const result = await res.json();
      console.log('Upload result:', result);
      fetchDataProducts();
    } catch (err) {
      console.error('Upload gagal:', err);
    }
  };

  const handleDeleteImageConfirm = async () => {
    setShowConfirmDeleteImage(false);


    try {
      const res = await fetch(`${baseUrl}/products/images/delete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idProductEdit,
          imageDeleteNumber,
        }),
      });

      if (!res.ok) throw new Error('Gagal mengedit Note Item');

      await res.json();
      console.log('Image deleted successfully:');

      await fetchDataProducts();

    } catch (e) {
      console.error('Error updating Note Item:', e);
    }
  };




  const inputStyle = {
    width: '180px',
    padding: '4px 6px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '4px',
  };

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [deleteMode, setDeleteMode] = useState(false);
  const inputRef = useRef(null);




  const onNameChange = (event) => {
    setName(event.target.value);
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await fetch(`${baseUrl}/products/category/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) throw new Error('Gagal menambahkan kategori');

      const result = await res.json();

      // Tambahkan ke local state setelah berhasil simpan ke DB
      setDataCategory([
        ...dataCategory,
        { id: result.insertedId, name },
      ]);
      setName('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    } catch (err) {
      console.error('Error menambahkan kategori:', err);
      alert('Gagal menambahkan kategori.');
    }
  };



  const toggleDeleteMode = () => {
    setDeleteMode(!deleteMode);
  };


  const handleClickItem = async (item) => {
    if (deleteMode) {
      if (window.confirm(`Yakin ingin hapus item "${item.name}"?`)) {
        try {
          const res = await fetch(`${baseUrl}/products/category/delete/${item.id}`, {
            method: 'DELETE',
          });

          if (!res.ok) throw new Error('Gagal menghapus kategori');

          // Hapus dari local state juga
          setDataCategory(dataCategory.filter(i => i.id !== item.id));
          setDeleteMode(false);
        } catch (err) {
          console.error('Error menghapus kategori:', err);
          alert('Gagal menghapus kategori.');
        }
      }
    } else {
      setFilterCategory(item.name);
      setOpen(false); // tutup dropdown setelah pilih
    }
  };


  const [selectedProjects, setSelectedProjects] = useState([""]); // default 1 select

  const handleChange = (index, value) => {
    const updated = [...selectedProjects];
    const selectedItem = dataProjects.find(item => item.id === value);
    if (selectedItem) {
      updated[index] = selectedItem.id;
      setSelectedProjects(updated);
    }
  };

  const addSelect = () => setSelectedProjects([...selectedProjects, ""]);
  const removeSelect = (index) =>
    setSelectedProjects(selectedProjects.filter((_, i) => i !== index));

  return (
    <>
      <Container>
        <Col md={12} className='lowonganPekerjaan overflow-auto pekerjaan px-2'>


          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            ...(isMobile ? { top: -1 } : { top: 0 }),
            zIndex: 1,
            padding: '10px',
            backgroundColor: "transparent",
            color: globalTheme === "light" ? "black" : 'white',
            transition: "background-color 1s ease",
          }}>
            <h4 style={{ margin: 0 }}>Products</h4>

            <div>

              <Select
                onDropdownVisibleChange={(visible) => { setOpen(visible); setDeleteMode(false); }}
                style={{ width: 250 }}
                placeholder={deleteMode ? 'Click item to delete' : 'Select item'}
                open={open}
                value={filterCategory}
                onChange={setFilterCategory}
                dropdownRender={() => (
                  <>
                    <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                      {dataCategory.map(item => (
                        <div
                          key={item.id}
                          onClick={() => handleClickItem(item)}
                          style={{
                            padding: '5px 12px',
                            cursor: 'pointer',
                            color: deleteMode ? 'red' : 'inherit',
                            backgroundColor: deleteMode ? '#fff1f0' : 'white',
                          }}
                        >
                          {item.name}
                        </div>
                      ))}

                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <Space style={{ padding: '0 8px 4px' }}>
                      <Input
                        placeholder="Please enter item"
                        ref={inputRef}
                        value={name}
                        onChange={onNameChange}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                      <Button type="text" className='btn-sm' onClick={addItem}>
                        <FiPlus />
                      </Button>
                      <Button
                        danger
                        onClick={toggleDeleteMode}
                        className='btn-sm btn-danger'
                      >
                        <FiMinus />
                      </Button>
                    </Space>
                  </>
                )}
                options={[]} // tetap dikosongkan karena kita handle sendiri rendernya
              />


              <MdFormatListBulletedAdd style={{ marginLeft: "10px", marginBottom: "3px", cursor: "pointer" }} size={25} onClick={() => { setShowTambahDataModal(true); refreshData(); }} />
              <FiEdit
                style={{
                  marginLeft: "10px",
                  marginBottom: "3px",
                  cursor: "pointer",
                  color: isEditing ? "blue" : "inherit", // warna biru jika isEditing true
                }}
                size={23}
                onClick={() => setIsEditing(prev => !prev)} // toggle nilai isEditing
              />

            </div>
          </div>


          <div style={{ backgroundColor: "white", borderRadius: '15px', paddingTop: "6px", paddingLeft: "6px", boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)', border: '1px solid #ddd' }}>
            <div
              style={{
                maxHeight: '77vh',
                overflow: 'auto', // SCROLL VERTIKAL & HORIZONTAL
                borderRadius: '12px',
                backgroundColor: 'white',
              }}
            >
              {isEditing ? (
                // === EDIT MODE: tabel baru khusus input ===
                <table
                  className="table table-striped"
                  style={{
                    borderCollapse: 'collapse',
                    width: 'max-content',
                    minWidth: '100%',
                  }}
                >
                  <thead style={{
                    position: 'sticky',
                    top: 0,
                    backgroundColor: '#f8f9fa',
                    zIndex: 1,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                  }}>
                    <tr>
                      {[
                        'No', 'Gambar', 'Judul', 'Deskripsi', 'Display',
                        'Varian', 'Stainless', 'Besi', 'Kayu', 'Jok',
                        'Rotan', 'Finishing', 'Marmer', 'Fiber', 'Veneer', 'HPP', 'Jual'
                      ].map((col, i) => (
                        <th
                          key={i}
                          style={{
                            padding: '10px',
                            textAlign: 'left',
                            color: '#354985',
                            borderBottom: '1px solid #ccc',
                            backgroundColor: '#f8f9fa',
                          }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filterCategory === "" && (
                      <tr>
                        <td colSpan="100%" className="text-center text-gray-500 py-4">
                          Please select a category first
                        </td>
                      </tr>
                    )}

                    {filteredDataProducts.map((item, index) => {
                      8
                      const itemVarian = dataVarian.filter(v => v.idProduct === item.id);

                      return (
                        <tr key={index}>
                          {/* No */}
                          <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{index + 1}</td>

                          {/* Gambar */}
                          <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                            <Image
                              src={getImageUrl(item.image1 || '')}
                              alt="Preview"
                              width={100}
                              height={100}
                              style={{ objectFit: 'cover', borderRadius: 4 }}
                              preview={true}
                            />
                          </td>

                          {/* Judul */}
                          <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                            <input
                              type="text"
                              defaultValue={item.judul}
                              placeholder="Judul"
                              style={inputStyle}
                              onChange={e => handleChangeProduct(item.id, 'judul', e.target.value)}
                            />
                          </td>

                          {/* Deskripsi */}
                          <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                            <textarea
                              defaultValue={item.deskripsi}
                              placeholder="Deskripsi"
                              style={{
                                ...inputStyle,
                                width: '300px', // ubah sesuai kebutuhan
                                height: '100px', // tinggi juga bisa diatur
                                resize: 'vertical', // atau 'none' jika tidak ingin bisa diubah ukurannya
                              }}
                              onChange={e => handleChangeProduct(item.id, 'deskripsi', e.target.value)}
                            />
                          </td>

                          {/* Switch On/Off */}
                          <td style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                            <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px' }}>
                              <input
                                type="checkbox"
                                checked={item.isDisplay || false}
                                onChange={e => {
                                  const newValue = e.target.checked;

                                  // 1. Update UI langsung (optimistic update)
                                  setFilteredDataProducts(prev =>
                                    prev.map(p => (p.id === item.id ? { ...p, isDisplay: newValue } : p))
                                  );

                                  // 2. Simpan perubahan untuk autoSave
                                  handleChangeProduct(item.id, 'isDisplay', newValue);
                                }}

                                style={{ opacity: 0, width: 0, height: 0 }}
                              />
                              <span
                                style={{
                                  position: 'absolute',
                                  cursor: 'pointer',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  backgroundColor: item.isDisplay ? '#2c76ffff' : '#ccc',
                                  transition: '.4s',
                                  borderRadius: '34px',
                                }}
                              />
                              <span
                                style={{
                                  position: 'absolute',
                                  content: '""',
                                  height: '14px',
                                  width: '14px',
                                  left: item.isDisplay ? '22px' : '4px',
                                  bottom: '3px',
                                  backgroundColor: 'white',
                                  transition: '.4s',
                                  borderRadius: '50%',
                                }}
                              />
                            </label>
                          </td>


                          {/* Varian - Semua ditampilkan vertikal */}
                          {['varian', 'stainless', 'besi', 'kayu', 'jok', 'rotan', 'finishing', 'marmer', 'fiber', 'veneer', 'hpp', 'jual'].map((field, i) => (
                            <td key={i} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                              {itemVarian.map(v => {
                                const jualName = `jual-${v.id}`;
                                const formatRp = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

                                const calcHpp = () => {
                                  const total =
                                    (Number(v.stainless) || 0) +
                                    (Number(v.besi) || 0) +
                                    (Number(v.kayu) || 0) +
                                    (Number(v.jok) || 0) +
                                    (Number(v.rotan) || 0) +
                                    (Number(v.finishing) || 0) +
                                    (Number(v.marmer) || 0) +
                                    (Number(v.fiber) || 0) +
                                    (Number(v.veneer) || 0);
                                  return total;
                                };

                                const calcRekom = rowEl => {
                                  const getVal = name => {
                                    const inp = rowEl.querySelector(`input[name="${name}-${v.id}"]`);
                                    return inp ? Number(inp.value.replace(/\./g, "")) || 0 : 0; // hapus titik sebelum parse
                                  };
                                  const total =
                                    getVal('stainless') +
                                    getVal('besi') +
                                    getVal('kayu') +
                                    getVal('jok') +
                                    getVal('rotan') +
                                    getVal('finishing') +
                                    getVal('marmer') +
                                    getVal('fiber') +
                                    getVal('veneer');
                                  return Math.round(total / 0.7);
                                };

                                return (
                                  <div key={v.id} style={{ marginBottom: 6 }}>
                                    {field === 'varian' ? (
                                      <input
                                        name={`${field}-${v.id}`}
                                        type="text"
                                        defaultValue={v[field] ?? ''}
                                        placeholder={field}
                                        style={{
                                          ...inputStyle,
                                          width: 150,
                                        }}
                                        onChange={e => handleChangeVarian(v.id, field, e.target.value)}
                                      />
                                    ) : field === 'hpp' ? (
                                      <NumericFormat
                                        name={`hpp-${v.id}`}
                                        value={calcHpp()}
                                        thousandSeparator="."
                                        decimalSeparator=","
                                        disabled
                                        style={{ ...inputStyle, width: 120, backgroundColor: '#f5f5f5' }}
                                      />
                                    ) : (
                                      <NumericFormat
                                        name={`${field}-${v.id}`}
                                        value={v[field] ?? ''}
                                        thousandSeparator="."
                                        decimalSeparator=","
                                        placeholder={field === 'jual'
                                          ? `Min : Rp. ${formatRp(Math.round(
                                            ((v.stainless || 0) + (v.besi || 0) + (v.kayu || 0) + (v.jok || 0) + (v.rotan || 0) + (v.finishing || 0) + (v.marmer || 0) + (v.fiber || 0) + (v.veneer || 0)) / 0.7
                                          ))}`
                                          : field
                                        }
                                        style={{
                                          ...inputStyle,
                                          width: field === 'jual' ? 150 : 100,
                                        }}
                                        onValueChange={(values) => {
                                          handleChangeVarian(v.id, field, values.value); // values.value = angka murni tanpa titik

                                          if (field !== 'jual') {
                                            const rowEl = document.querySelector(`input[name="${field}-${v.id}"]`)?.closest('tr');
                                            if (!rowEl) return;
                                            const rekom = calcRekom(rowEl);
                                            const jualInput = rowEl.querySelector(`input[name="jual-${v.id}"]`);
                                            if (jualInput) {
                                              jualInput.placeholder = `Min : Rp. ${formatRp(rekom)}`;
                                            }
                                          }
                                        }}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </td>
                          ))}




                        </tr>
                      );
                    })}


                  </tbody>




                </table>
              ) : (
                // === VIEW MODE: tabel dataProducts asli ===
                <table
                  className="table table-striped table-hover"
                  style={{
                    borderCollapse: 'collapse',
                    width: 'max-content', // supaya auto scroll kanan jika kolom banyak
                    minWidth: '100%',
                  }}
                >
                  <thead
                    style={{
                      position: 'sticky',
                      top: 0,
                      backgroundColor: '#f8f9fa',
                      zIndex: 1,
                      boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    }}
                  >
                    <tr>
                      {[
                        'No', 'Gambar', 'Detail', 'Varian',
                        'HPP', 'Jual', 'GPM', 'GP'
                      ].map((title, i) => (
                        <th
                          key={i}
                          style={{
                            padding: '10px',
                            textAlign: 'left',
                            color: '#354985',
                            borderBottom: '1px solid #ccc',
                            backgroundColor: '#f8f9fa',
                          }}
                        >
                          {title}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {filterCategory === "" && (
                      <tr>
                        <td colSpan="100%" className="text-center text-gray-500 py-4">
                          Please select a category first
                        </td>
                      </tr>
                    )}


                    {filteredDataProducts.map((item, index) => {
                      const itemVarian = dataVarian.filter(v => v.idProduct === item.id);

                      return (
                        <tr key={index} style={{ cursor: "pointer" }}>
                          {/* No */}
                          <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{index + 1}</td>

                          {/* Gambar */}
                          <td
                            style={{ padding: '10px', borderBottom: '1px solid #eee' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowGambarDataModal(true);
                              setIdProductEdit(item.id);
                              setSelectedDataProduct(item);
                            }}
                          >
                            {(() => {
                              const imageKey = Array.from({ length: 50 }, (_, i) => `image${i + 1}`).find(
                                (key) => item[key]
                              );
                              return imageKey ? (
                                <Image
                                  src={getImageUrl(item[imageKey])}
                                  alt="Gambar Produk"
                                  width={100}
                                  height={100}
                                  style={{ objectFit: 'cover', borderRadius: 4 }}
                                  preview={false}
                                />
                              ) : (
                                null
                              );
                            })()}
                          </td>


                          {/* Judul */}
                          <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setIdProductEdit(item.id);
                              setJudul(item.judul);
                              setDeskripsi(item.deskripsi);
                              setCategory(item.category);
                              setLinkVideo1(item.linkVideo1);
                              setLinkVideo2(item.linkVideo2);
                              setLinkVideo3(item.linkVideo3);
                              setModel3dUrl(item.model3d);
                              setSelectedProjects(item.linkProject || []);
                              setShowDetailDataModal(true);
                            }}
                          >
                            {item.judul.length > 20 ? item.judul.slice(0, 20) + '...' : item.judul}
                          </td>

                          {/* Varian, HPP, Jual, GPM, GP */}
                          {['varian', 'hpp', 'jual', 'gpm', 'gp'].map((field, idx) => (
                            <td key={idx} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                              {itemVarian.map((v, vi) => {
                                const hpp = Number(v.stainless || 0) + Number(v.besi || 0) + Number(v.kayu || 0) + Number(v.jok || 0) +
                                  Number(v.rotan || 0) + Number(v.finishing || 0) + Number(v.marmer || 0) + Number(v.fiber || 0) + Number(v.veneer || 0);
                                const jual = Number(v.jual || 0);
                                const gp = jual - hpp;
                                const gpm = jual ? ((gp / jual) * 100).toFixed(2) : '0.00';

                                let content = '';
                                switch (field) {
                                  case 'varian': content = v.varian; break;
                                  case 'hpp': content = `Rp ${hpp.toLocaleString()}`; break;
                                  case 'jual': content = `Rp ${jual.toLocaleString()}`; break;
                                  case 'gp': content = `Rp ${gp.toLocaleString()}`; break;
                                  case 'gpm': content = `${gpm}%`; break;
                                }

                                return (
                                  <div
                                    key={vi}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditVarian(v);
                                    }}
                                    style={{
                                      padding: '3px 0',
                                      cursor: 'pointer',
                                      borderRadius: '4px',
                                      transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                  >
                                    {content}
                                  </div>
                                );
                              })}
                            </td>
                          ))}
                        </tr>
                      );
                    })}




                  </tbody>

                </table>
              )}

            </div>
          </div>







        </Col>
      </Container>

      {/* Modal */}
      <Modal show={showTambahDataModal} onHide={() => setShowTambahDataModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Tambah Data</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Your comment form here */}
          <label className='mt-2'>Judul :</label>
          <input className="form-control" type='text' onChange={useCallback(debounce((e) => setJudul(e.target.value), 300), [])}></input>
          <label className='mt-2'>Deskripsi :</label>
          <textarea className="form-control" rows="5" type='text' onChange={useCallback(debounce((e) => setDeskripsi(e.target.value), 300), [])}></textarea>
          <label className="mt-2">Kategori :</label>
          <select
            className="form-control"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="" disabled>
              Pilih kategori
            </option>
            {dataCategory.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          <label className="mt-2">Link Video :</label>
          <div className="d-flex flex-column gap-2">
            <input
              className="form-control"
              type="text"
              placeholder="Link Video 1"
              onChange={useCallback(debounce((e) => setLinkVideo1(e.target.value), 300), [])}
            />
            <input
              className="form-control"
              type="text"
              placeholder="Link Video 2"
              onChange={useCallback(debounce((e) => setLinkVideo2(e.target.value), 300), [])}
            />
            <input
              className="form-control"
              type="text"
              placeholder="Link Video 3"
              onChange={useCallback(debounce((e) => setLinkVideo3(e.target.value), 300), [])}
            />
          </div>

          {/* Input Model 3D */}
          <label className="mt-3">3D Model (.glb):</label>
          <input
            type="file"
            accept=".glb"
            className="form-control"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setSelected3DModelFile(file);
            }}
          />


        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" style={{ marginLeft: "290px" }} onClick={handleSubmitData}>Submit</Button>
        </Modal.Footer>
      </Modal>
      {/* End Modal */}

      <Modal show={showEditDataModal} onHide={() => setShowEditDataModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Data</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Your comment form here */}
          <label className='mt-2'>Judul :</label>
          <input className="form-control" type='text' defaultValue={judul} onChange={useCallback(debounce((e) => setJudul(e.target.value), 300), [])}></input>
          <label className='mt-2'>Deskripsi :</label>
          <textarea className="form-control" rows="5" type='text' defaultValue={deskripsi} onChange={useCallback(debounce((e) => setDeskripsi(e.target.value), 300), [])}></textarea>
          <label className="mt-2">Kategori :</label>
          <select
            className="form-control"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="" disabled>
              Pilih kategori
            </option>
            {dataCategory.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          <label className="mt-2">Link Video :</label>
          <div className="d-flex flex-column gap-2">
            <input
              className="form-control"
              type="text"
              placeholder="Link Video 1"
              defaultValue={linkVideo1}
              onChange={useCallback(debounce((e) => setLinkVideo1(e.target.value), 300), [])}
            />
            <input
              className="form-control"
              type="text"
              placeholder="Link Video 2"
              defaultValue={linkVideo2}
              onChange={useCallback(debounce((e) => setLinkVideo2(e.target.value), 300), [])}
            />
            <input
              className="form-control"
              type="text"
              placeholder="Link Video 3"
              defaultValue={linkVideo3}
              onChange={useCallback(debounce((e) => setLinkVideo3(e.target.value), 300), [])}
            />
          </div>

          <label className="mt-3">Ganti Model 3D (.glb) :</label>
          <input
            type="file"
            accept=".glb"
            className="form-control"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setSelected3DModelFile(file);
            }}
          />

          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
              className="mt-3 mb-1"
            >
              <label>Project Link :</label>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={addSelect}
                style={{ border: "1px solid #ccc" }}
              >
                + Tambah Project
              </Button>
            </div>

            {selectedProjects.map((val, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginBottom: "8px",
                }}
              >
                <Select
                  showSearch
                  placeholder="Pilih Project"
                  value={val || undefined}
                  optionFilterProp="data-label"
                  getPopupContainer={(trigger) => trigger.parentNode}
                  style={{ flex: 1, minWidth: 250, height: 40 }}
                  onChange={(value) => handleChange(index, value)}
                >
                  {dataProjects.map((item) => (
                    <Option key={item.id} value={item.id} data-label={item.NamaBarang}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {item.image1 && (
                          <img
                            src={getImageUrl ? getImageUrl(item.image1) : item.image1}
                            alt={item.NamaBarang}
                            style={{ width: 30, marginRight: 10 }}
                          />
                        )}
                        {item.NamaBarang}
                      </div>
                    </Option>
                  ))}
                </Select>

                {selectedProjects.length > 1 && (
                  <Button
                    variant="danger"
                    style={{ height: "40px" }}
                    onClick={() => removeSelect(index)}
                  >
                    -
                  </Button>
                )}
              </div>
            ))}
          </div>




        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-between w-100">
            <Popconfirm
              title="Delete Product"
              description="Are you sure you want to delete this product?"
              onConfirm={handleDeleteProduk}
              // onCancel={() => message.info("Batal menghapus")}
              okText="Yes"
              cancelText="No"
            >
              <Button variant="danger">Delete</Button>
            </Popconfirm>
            <Button variant="primary" onClick={handleSubmitEditData}>Submit</Button>
          </div>
        </Modal.Footer>


      </Modal>

      <Modal show={showGambarDataModal} onHide={() => setShowGambarDataModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Gambar Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {Array.from({ length: 50 }, (_, i) => `image${i + 1}`)
              .filter((key) => selectedDataProduct?.[key])
              .map((key, idx) => (
                <Image
                  key={idx}
                  src={getImageUrl(selectedDataProduct[key])}
                  alt={`Gambar ${key}`}
                  width={120}
                  height={120}
                  style={{ objectFit: 'cover', borderRadius: 6 }}
                  preview={{
                    getContainer: () => document.body, // pastikan di-render di body, bukan dalam modal
                    zIndex: 2000, // lebih tinggi dari modal Bootstrap (biasanya z-index 1050–1100)
                  }}
                />
              ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => { setFileToUploadEdit({}); setShowEditGambarModal(true); setShowGambarDataModal(false); }}>
            Edit
          </Button>
        </Modal.Footer>
      </Modal>


      <Modal show={showDetailDataModal} onHide={() => setShowDetailDataModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Detail Data</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="mb-3">
            <p className="mb-1 fw-semibold">{judul}</p>
            <small className="text-muted" style={{ whiteSpace: 'pre-line' }}>{deskripsi}</small>
          </div>


          <div className="mb-3">
            <small className="fw-semibold mb-0">Video</small>
            <ul className="ps-3 mb-0">
              {linkVideo1 && (
                <li>
                  <a href={linkVideo1} target="_blank" rel="noopener noreferrer">
                    <small>{linkVideo1.length > 30 ? linkVideo1.slice(0, 30) + '...' : linkVideo1}</small>
                  </a>
                </li>
              )}
              {linkVideo2 && (
                <li>
                  <a href={linkVideo2} target="_blank" rel="noopener noreferrer">
                    <small>{linkVideo2.length > 30 ? linkVideo2.slice(0, 30) + '...' : linkVideo2}</small>
                  </a>
                </li>
              )}
              {linkVideo3 && (
                <li>
                  <a href={linkVideo3} target="_blank" rel="noopener noreferrer">
                    <small>{linkVideo3.length > 30 ? linkVideo3.slice(0, 30) + '...' : linkVideo3}</small>
                  </a>
                </li>
              )}
            </ul>

          </div>

          <div className="mb-3">
            <p className="mb-1 fw-semibold">Model 3D:</p>
            <small className="text-muted" style={{ whiteSpace: 'pre-line' }}>
              {model3dUrl ? model3dUrl.split('/').pop() : 'Belum ada file'}
            </small>
          </div>

          <div className="mb-3">
            <p className="mb-1 fw-semibold">Project Terkait:</p>

            {Array.isArray(selectedProjects) && selectedProjects.length > 0 ? (
              <ul className="ps-3 mb-0">
                {selectedProjects.map((projId, idx) => {
                  // cari nama project berdasarkan id
                  const projectData = dataProjects.find((p) => p.id === projId);
                  const namaProject = projectData ? projectData.NamaBarang : "Unknown Project";

                  return (
                    <li key={idx}>
                      <small>{namaProject}</small>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <small className="text-muted">Tidak ada project terkait</small>
            )}
          </div>


        </Modal.Body>

        <Modal.Footer className="d-flex justify-content-between">
          <Button variant="success" onClick={() => { setShowTambahVarianModal(true); refreshDataVarian(); setShowDetailDataModal(false) }}>
            + Varian
          </Button>

          <Button variant="primary" onClick={() => {
            setShowEditDataModal(true);
            setShowDetailDataModal(false);
          }}>
            Edit
          </Button>
        </Modal.Footer>

      </Modal>

      {/* Modal */}
      <Modal show={showTambahVarianModal} onHide={() => setShowTambahVarianModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Tambah Varian</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Your comment form here */}
          <label className='mt-2'>Varian :</label>
          <input className="form-control" type='text' onChange={useCallback(debounce((e) => setVarian(e.target.value), 300), [])}></input>
          <label className='mt-2'>Stainless :</label>
          <NumericFormat className="form-control" thousandSeparator="." decimalSeparator="," onValueChange={(values) => { setStainless(values.value); }}></NumericFormat>
          <label className='mt-2'>Besi :</label>
          <NumericFormat className="form-control" thousandSeparator="." decimalSeparator="," onValueChange={(values) => { setBesi(values.value); }}></NumericFormat>
          <label className='mt-2'>Kayu :</label>
          <NumericFormat className="form-control" thousandSeparator="." decimalSeparator="," onValueChange={(values) => { setKayu(values.value); }}></NumericFormat>
          <label className='mt-2'>Jok :</label>
          <NumericFormat className="form-control" thousandSeparator="." decimalSeparator="," onValueChange={(values) => { setJok(values.value); }}></NumericFormat>
          <label className='mt-2'>Rotan :</label>
          <NumericFormat className="form-control" thousandSeparator="." decimalSeparator="," onValueChange={(values) => { setRotan(values.value); }}></NumericFormat>
          <label className='mt-2'>Finishing :</label>
          <NumericFormat className="form-control" thousandSeparator="." decimalSeparator="," onValueChange={(values) => { setFinishing(values.value); }}></NumericFormat>
          <label className='mt-2'>Marmer :</label>
          <NumericFormat className="form-control" thousandSeparator="." decimalSeparator="," onValueChange={(values) => { setMarmer(values.value); }}></NumericFormat>
          <label className='mt-2'>Fiber :</label>
          <NumericFormat className="form-control" thousandSeparator="." decimalSeparator="," onValueChange={(values) => { setFiber(values.value); }}></NumericFormat>
          <label className='mt-2'>Veneer :</label>
          <NumericFormat className="form-control" thousandSeparator="." decimalSeparator="," onValueChange={(values) => { setVeneer(values.value); }}></NumericFormat>
          <label className='mt-2'>Jual :</label>
          <NumericFormat className="form-control" thousandSeparator="." decimalSeparator="," onValueChange={(values) => { setJual(values.value); }}></NumericFormat>
          <label className="mt-3">Gambar Varian:</label>
          <input
            type="file"
            accept="image/*,.heic,.heif"
            className="form-control"
            onChange={async (e) => {
              const file = await heicToJpeg(e.target.files?.[0]);
              if (file) setSelectedImageFile(file);
            }}
          />

          {/* Pratinjau jika sudah dipilih */}
          {selectedImageFile && (
            <div className="mt-2">
              <label className="block mb-1">Preview Gambar:</label>
              <img
                src={URL.createObjectURL(selectedImageFile)}
                alt="Preview"
                style={{ maxHeight: 100, borderRadius: 8 }}
              />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" style={{ marginLeft: "290px" }} onClick={handleSubmitVarian}>Submit</Button>
        </Modal.Footer>
      </Modal>
      {/* End Modal */}

      <Modal show={showEditVarianModal} onHide={() => setShowEditVarianModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Varian</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Your comment form here */}
          <label className='mt-2'>Varian :</label>
          <input className="form-control" type='text' defaultValue={varian} onChange={useCallback(debounce((e) => setVarian(e.target.value), 300), [])}></input>

          <label className='mt-2'>Stainless :</label>
          <NumericFormat
            className="form-control"
            thousandSeparator="."
            decimalSeparator=","
            value={stainless}
            onValueChange={(values) => {
              setStainless(values.value); // angka murni tanpa titik
            }}
          />

          <label className='mt-2'>Besi :</label>
          <NumericFormat
            className="form-control"
            thousandSeparator="."
            decimalSeparator=","
            value={besi}
            onValueChange={(values) => {
              setBesi(values.value); // angka murni tanpa titik
            }}
          />

          <label className='mt-2'>Kayu :</label>
          <NumericFormat
            className="form-control"
            thousandSeparator="."
            decimalSeparator=","
            value={kayu}
            onValueChange={(values) => {
              setKayu(values.value); // angka murni tanpa titik
            }}
          />

          <label className='mt-2'>Jok :</label>
          <NumericFormat
            className="form-control"
            thousandSeparator="."
            decimalSeparator=","
            value={jok}
            onValueChange={(values) => {
              setJok(values.value); // angka murni tanpa titik
            }}
          />

          <label className='mt-2'>Rotan :</label>
          <NumericFormat
            className="form-control"
            thousandSeparator="."
            decimalSeparator=","
            value={rotan}
            onValueChange={(values) => {
              setRotan(values.value); // angka murni tanpa titik
            }}
          />

          <label className='mt-2'>Finishing :</label>
          <NumericFormat
            className="form-control"
            thousandSeparator="."
            decimalSeparator=","
            value={finishing}
            onValueChange={(values) => {
              setFinishing(values.value); // angka murni tanpa titik
            }}
          />

          <label className='mt-2'>Marmer :</label>
          <NumericFormat
            className="form-control"
            thousandSeparator="."
            decimalSeparator=","
            value={marmer}
            onValueChange={(values) => {
              setMarmer(values.value); // angka murni tanpa titik
            }}
          />

          <label className='mt-2'>Fiber :</label>
          <NumericFormat
            className="form-control"
            thousandSeparator="."
            decimalSeparator=","
            value={fiber}
            onValueChange={(values) => {
              setFiber(values.value); // angka murni tanpa titik
            }}
          />

          <label className='mt-2'>Veneer :</label>
          <NumericFormat
            className="form-control"
            thousandSeparator="."
            decimalSeparator=","
            value={veneer}
            onValueChange={(values) => {
              setVeneer(values.value); // angka murni tanpa titik
            }}
          />

          <label className='mt-2'>
            Jual :{" "}
            <small className="text-muted">
              (HPP: Rp{" "}
              {(
                Number(stainless || 0) +
                Number(besi || 0) +
                Number(kayu || 0) +
                Number(jok || 0) +
                Number(rotan || 0) +
                Number(finishing || 0) +
                Number(marmer || 0) +
                Number(fiber || 0) +
                Number(veneer || 0)
              ).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
              )
            </small>
          </label>
          <NumericFormat
            className="form-control"
            thousandSeparator="."
            decimalSeparator=","
            value={jual}
            onValueChange={(values) => {
              setJual(values.value); // angka murni tanpa titik
            }}
          />


          {/* Input Gambar */}
          <label className="mt-3">Gambar Varian:</label>
          <input
            type="file"
            accept="image/*,.heic,.heif"
            className="form-control"
            onChange={async (e) => {
              const file = await heicToJpeg(e.target.files?.[0]);
              if (file) setSelectedImageFile(file);
            }}
          />

          {/* Pratinjau gambar default jika ada */}
          {imageVarianUrl && (
            <div className="mt-2" style={{ display: 'block' }}>
              <div style={{ display: 'block' }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Preview Gambar:</label>
                <img
                  src={getImageUrl(imageVarianUrl)}
                  alt="Varian"
                  style={{ display: 'block', maxHeight: 100, borderRadius: 8 }}
                />
              </div>
            </div>
          )}

        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-between w-100">
            <Popconfirm
              title="Delete Data"
              description="Are you sure you want to delete this data?"
              onConfirm={handleDeleteVarian}
              // onCancel={() => message.info("Batal menghapus")}
              okText="Yes"
              cancelText="No"
            >
              <Button variant="danger">Delete</Button>
            </Popconfirm>
            <Button variant="primary" onClick={handleSubmitEditVarian}>Submit</Button>
          </div>
        </Modal.Footer>


      </Modal>

      <Modal show={showEditGambarModal} onHide={() => setShowEditGambarModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2">
            Edit Image
            <InputNumber
              min={1}
              value={jumlahImageEdit}
              onChange={(val) => {
                // Validasi input agar tidak lebih dari 50
                const parsedValue = Number(val);
                if (!isNaN(parsedValue)) {
                  const boundedValue = Math.max(1, Math.min(50, parsedValue));
                  setJumlahImageEdit(boundedValue);
                }
              }}
              placeholder="Jumlah"
              style={{ width: 80 }}
            />


          </Modal.Title>
        </Modal.Header>

        <Modal.Body>



          {[...Array(jumlahImageEdit)].map((_, i) => {
            const index = i + 1;
            const imageKey = `image${index}`;
            const dataImage = selectedDataProduct?.[imageKey];


            return (
              <div key={index} className='mb-3'>
                <p className='mb-1 fw-semibold'>Image {index}</p>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {dataImage ? (
                    <>
                      <span style={{ marginRight: "1vh" }} onClick={(e) => e.stopPropagation()}>
                        <img
                          width='auto'
                          height='100vh'
                          style={{ borderRadius: "10px" }}
                          src={getImageUrl(dataImage.includes('.pdf') ? pdfLogoImg : dataImage)}
                        />
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: "1vh" }}>
                        <button
                          className='btn btn-danger mb-1'
                          onClick={() => {
                            setShowConfirmDeleteImage(true);
                            setShowEditGambarModal(false);
                            setImageDeleteNumber(imageKey);
                          }}
                        >
                          <MdDelete />
                        </button>
                        <div className='d-flex'>
                          <input
                            className="form-control"
                            type="file"
                            data-id={`editImage${index}`}
                            style={{ height: '30px', fontSize: '14px' }}
                            onChange={(e) => {
                              handleFileChange(index, e.target.files[0]);
                            }}
                          />
                          <Button
                            variant="secondary"
                            className='antd-btn-custom'
                            style={{ marginLeft: "20px", height: "30px", fontSize: '14px' }}
                            onClick={() => pasteImage(`editImage${index}`)}
                          >
                            <FaPaste />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className='d-flex'>
                      <input
                        className="form-control"
                        type="file"
                        data-id={`editImage${index}`}
                        style={{ height: '30px', fontSize: '14px' }}
                        onChange={(e) => {
                          handleFileChange(index, e.target.files[0]);
                        }}
                      />
                      <Button
                        variant="secondary"
                        className='antd-btn-custom'
                        style={{ marginLeft: "20px", height: "30px", fontSize: '14px' }}
                        onClick={() => pasteImage(`editImage${index}`)}
                      >
                        <FaPaste />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleSubmitImageEdit}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showConfirmDeleteImage} onHide={() => { setShowConfirmDeleteImage(false); }}>
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

    </>
  );
};





export default Products;
