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
import ImageUploadZone from '../Pekerjaan/ImageUploadZone';

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

      // segarkan list + produk yang sedang dibuka di modal foto
      const r2 = await fetch(`${baseUrl}/products/get`);
      const all = await r2.json();
      setDataProducts(all);
      const fresh = all.find((p) => p.id === idProductEdit);
      if (fresh) setSelectedDataProduct(fresh);

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

  // ================= Katalog: state tampilan baru (grid + panel detail) =================
  const [viewMode, setViewMode] = useState('grid');          // 'grid' | 'table' (edit massal lama)
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');   // all | display | hidden | nohpp
  const [pageSize, setPageSize] = useState(() => Number(localStorage.getItem('products.pageSize')) || 20);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(() => new URLSearchParams(window.location.search).get('id') || null);

  const hppOf = (v) => ['stainless', 'besi', 'kayu', 'jok', 'rotan', 'finishing', 'marmer', 'fiber', 'veneer']
    .reduce((a, k) => a + (Number(v[k]) || 0), 0);
  const rp = (n) => `Rp ${Math.round(Number(n) || 0).toLocaleString('id-ID')}`;
  const rpShort = (n) => {
    const x = Number(n) || 0;
    if (x >= 1e6) return `${(x / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
    if (x >= 1e3) return `${Math.round(x / 1e3)} rb`;
    return String(x);
  };
  const firstImage = (item) => {
    const key = Array.from({ length: 50 }, (_, i) => `image${i + 1}`).find((k) => item[k]);
    return key ? getImageUrl(item[key]) : '';
  };

  // Ringkasan per produk (varian, rentang harga, jumlah varian tanpa HPP) — dihitung sekali per render
  const enriched = React.useMemo(() => dataProducts.map((item) => {
    const varians = dataVarian.filter((v) => v.idProduct === item.id);
    const juals = varians.map((v) => Number(v.jual) || 0).filter((x) => x > 0);
    const noHpp = varians.filter((v) => hppOf(v) <= 0).length;
    return {
      ...item,
      _varians: varians,
      _jualMin: juals.length ? Math.min(...juals) : 0,
      _jualMax: juals.length ? Math.max(...juals) : 0,
      _noHpp: noHpp,
    };
  }), [dataProducts, dataVarian]);

  const filteredList = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter((p) => {
      if (filterCategory && p.category !== filterCategory) return false;
      if (filterStatus === 'display' && !p.isDisplay) return false;
      if (filterStatus === 'hidden' && p.isDisplay) return false;
      if (filterStatus === 'nohpp' && !(p._noHpp > 0 || p._varians.length === 0)) return false;
      if (q && !String(p.judul || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [enriched, filterCategory, filterStatus, search]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = filteredList.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);
  useEffect(() => { setPage(1); }, [search, filterCategory, filterStatus, pageSize]);
  useEffect(() => { localStorage.setItem('products.pageSize', String(pageSize)); }, [pageSize]);

  const selected = enriched.find((p) => p.id === selectedId) || null;

  // ---- Draft produk baru (autosave dari /products/new) ----
  const [drafts, setDrafts] = useState([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const fetchDrafts = () => fetch(`${baseUrl}/products/drafts/get`).then((r) => r.json()).then((d) => setDrafts(Array.isArray(d) ? d : [])).catch(() => {});
  useEffect(() => {
    fetchDrafts();
    const onFocus = () => { fetchDrafts(); fetchDataProducts(); fetchDataVarian(); }; // balik dari tab tambah produk → segarkan
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);
  const deleteDraft = async (id) => {
    try { await fetch(`${baseUrl}/products/drafts/delete/${id}`, { method: 'DELETE' }); } catch (e) { /* abaikan */ }
    fetchDrafts();
  };

  // ---- Label produk (ongkir wajib + label per kategori) — master di koleksi ProductLabels ----
  const [labelMaster, setLabelMaster] = useState({ defaultOngkir: 'Gratis ongkir', labels: [] });
  const [showLabelMgr, setShowLabelMgr] = useState(false);
  const [labelMgrCat, setLabelMgrCat] = useState('');
  const [labelNew, setLabelNew] = useState({ ongkir: '', label: '' });
  const fetchLabels = async () => {
    try {
      const r = await fetch(`${baseUrl}/products/labels/get`);
      const d = await r.json();
      if (d && d.labels) setLabelMaster(d);
    } catch (e) { console.error('labels', e); }
  };
  useEffect(() => { fetchLabels(); }, []);
  const ongkirOptions = labelMaster.labels.filter((l) => l.type === 'ongkir');
  const labelOptionsFor = (cat) => labelMaster.labels.filter((l) => l.type === 'label' && l.category === cat);

  const saveTags = async (item, patch) => {
    setDataProducts((prev) => prev.map((p) => (p.id === item.id ? { ...p, ...patch } : p)));
    try {
      const r = await fetch(`${baseUrl}/products/tags/update`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, ...patch }),
      });
      if (!r.ok) throw new Error((await r.json()).message);
    } catch (e) { message.error(`Gagal simpan tag: ${e.message}`); fetchDataProducts(); }
  };
  const labelApi = async (method, path, body) => {
    const r = await fetch(`${baseUrl}${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { message.error(d.message || 'Gagal'); return false; }
    await fetchLabels(); await fetchDataProducts();
    return true;
  };

  // ---- Upload foto produk: drag & drop / pilih file / paste (ImageUploadZone) → isi slot imageN berikutnya ----
  const [newPhotos, setNewPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const uploadNewPhotos = async () => {
    if (!newPhotos.length || !selectedDataProduct) return;
    let max = 0;
    for (let i = 1; i <= 50; i++) if (selectedDataProduct[`image${i}`]) max = i;
    if (max + newPhotos.length > 50) { message.error('Maksimal 50 foto per produk'); return; }
    const fd = new FormData();
    newPhotos.forEach((f, i) => fd.append(`image${max + i + 1}`, f));
    setUploadingPhotos(true);
    try {
      const r = await fetch(`${baseUrl}/products/images/update/${selectedDataProduct.id}`, { method: 'PUT', body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Upload gagal');
      message.success(`${newPhotos.length} foto diupload`);
      setNewPhotos([]);
      // segarkan produk terpilih di modal
      const res = await fetch(`${baseUrl}/products/get`);
      const all = await res.json();
      setDataProducts(all);
      const fresh = all.find((p) => p.id === selectedDataProduct.id);
      if (fresh) setSelectedDataProduct(fresh);
    } catch (e) { message.error(e.message); }
    finally { setUploadingPhotos(false); }
  };

  // toggle tampil dari panel — optimistic + autosave (edit-bulk) seperti sebelumnya
  const toggleDisplay = (item) => {
    const next = !item.isDisplay;
    setDataProducts((prev) => prev.map((p) => (p.id === item.id ? { ...p, isDisplay: next } : p)));
    handleChangeProduct(item.id, 'isDisplay', next);
  };

  const openDetailModal = (item) => {
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
  };

  const dark = globalTheme !== 'light';
  const cardBg = dark ? '#1e1e2d' : '#fff';
  const cardBorder = dark ? '#333' : '#e3e3e3';
  const textMuted = dark ? '#9aa0a6' : '#6b7280';
  const textMain = dark ? '#fff' : '#1f2937';
  const chip = (bg, fg) => ({ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: bg, color: fg, whiteSpace: 'nowrap' });
  const toolbarBtn = (active) => ({
    padding: '6px 12px', borderRadius: 8, border: `1px solid ${active ? '#013175' : cardBorder}`,
    background: active ? '#013175' : cardBg, color: active ? '#fff' : textMain, cursor: 'pointer', fontSize: 13,
  });

  return (
    <>
      <Container fluid style={{ maxWidth: 1500 }}>
        <Col md={12} className='lowonganPekerjaan overflow-auto pekerjaan px-2'>

          {/* ===== Toolbar ===== */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
            position: 'sticky', top: isMobile ? -1 : 0, zIndex: 2, padding: '10px 4px',
            color: textMain, background: dark ? '#14141f' : 'transparent',
          }}>
            <h4 style={{ margin: 0, marginRight: 6 }}>Products</h4>
            <Input
              allowClear
              prefix={<FaSearch style={{ color: '#999' }} />}
              placeholder="Cari nama produk…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 240 }}
            />
            <div>
              <Select
                onDropdownVisibleChange={(visible) => { setOpen(visible); setDeleteMode(false); }}
                style={{ width: 220 }}
                allowClear
                onClear={() => setFilterCategory(null)}
                placeholder={deleteMode ? 'Klik item untuk hapus' : 'Semua kategori'}
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
            </div>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 190 }}
              options={[
                { value: 'all', label: 'Semua status' },
                { value: 'display', label: '● Tampil di website' },
                { value: 'hidden', label: '○ Hidden' },
                { value: 'nohpp', label: '⚠ HPP belum diisi' },
              ]}
            />
            <Select
              value={pageSize}
              onChange={setPageSize}
              style={{ width: 130 }}
              options={[20, 40, 80].map((n) => ({ value: n, label: `${n} / halaman` }))}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              <button style={toolbarBtn(viewMode === 'grid')} onClick={() => setViewMode('grid')}>Grid</button>
              <button style={toolbarBtn(viewMode === 'table')} onClick={() => setViewMode('table')}>Tabel</button>
              {viewMode === 'table' && (
                <button style={toolbarBtn(isEditing)} onClick={() => setIsEditing((v) => !v)} title="Mode edit massal (HPP per kategori, judul, deskripsi)"><FiEdit /></button>
              )}
            </div>
            <button style={{ ...toolbarBtn(false), marginLeft: 'auto' }} onClick={() => { setLabelMgrCat(filterCategory || (dataCategory[0] && dataCategory[0].name) || ''); setShowLabelMgr(true); }} title="Kelola tag ongkir & label produk">
              ⚙ Label
            </button>
            {drafts.length > 0 && (
              <button style={{ ...toolbarBtn(false), borderColor: '#e08a2f', color: '#e08a2f' }} onClick={() => setShowDrafts(true)} title="Produk yang belum selesai diisi">
                ✎ Draft ({drafts.length})
              </button>
            )}
            <button
              style={{ ...toolbarBtn(true), fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => window.open('/products/new', '_blank')}
              title="Buka halaman tambah produk (tab baru)"
            >
              <FiPlus /> Produk Baru
            </button>
          </div>

          <div style={{ fontSize: 12, color: textMuted, padding: '0 4px 8px' }}>
            {filteredList.length} produk{filterCategory ? ` · ${filterCategory}` : ''}
            {filterStatus === 'nohpp' ? ' · HPP belum diisi' : ''}
            {' · '}halaman {pageSafe}/{totalPages}
          </div>

          {viewMode === 'table' ? (
            /* ===== Mode Tabel: tabel lama; ikon pensil → mode edit massal ===== */
            <div style={{ backgroundColor: 'white', borderRadius: 15, padding: 6, boxShadow: '0 4px 8px rgba(0,0,0,0.05)', border: '1px solid #ddd' }}>
              <div style={{ maxHeight: '77vh', overflow: 'auto', borderRadius: 12, backgroundColor: 'white' }}>
                {isEditing ? (
                  // === EDIT MODE: tabel input massal (HPP per kategori, judul, deskripsi, display) ===
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
                    {pageItems.map((item, index) => {
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
                                  setDataProducts(prev =>
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
                  // === VIEW MODE: tabel ringkas seperti semula (klik gambar → foto, judul → detail, varian → edit) ===
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
                    {pageItems.map((item, index) => {
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
          ) : (
            /* ===== Mode Grid: kartu ringkas + panel detail ===== */
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
                  {pageItems.map((item) => {
                    const active = item.id === selectedId;
                    const img = firstImage(item);
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        style={{
                          background: cardBg, border: `2px solid ${active ? '#013175' : cardBorder}`, borderRadius: 12,
                          overflow: 'hidden', cursor: 'pointer', opacity: item.isDisplay ? 1 : 0.75,
                          boxShadow: active ? '0 4px 14px rgba(1,49,117,0.25)' : '0 1px 4px rgba(0,0,0,0.06)',
                          transition: 'box-shadow .15s, border-color .15s',
                        }}
                      >
                        <div style={{ position: 'relative', aspectRatio: '1 / 1', background: dark ? '#2a2a3a' : '#f3f4f6' }}>
                          {img ? (
                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: item.isDisplay ? 'none' : 'grayscale(0.6)' }} loading="lazy" />
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: textMuted }}><FaRegImages size={28} /></div>
                          )}
                          <span style={{ ...chip(item.isDisplay ? '#dcfce7' : '#e5e7eb', item.isDisplay ? '#166534' : '#374151'), position: 'absolute', top: 8, left: 8 }}>
                            {item.isDisplay ? 'Tampil' : 'Hidden'}
                          </span>
                          {(item._noHpp > 0 || item._varians.length === 0) && (
                            <span style={{ ...chip('#fee2e2', '#b91c1c'), position: 'absolute', top: 8, right: 8 }} title="Ada varian yang HPP-nya masih 0">
                              {item._varians.length === 0 ? 'Belum ada varian' : `HPP kosong ${item._noHpp}/${item._varians.length}`}
                            </span>
                          )}
                        </div>
                        <div style={{ padding: '8px 10px 10px' }}>
                          <div style={{ fontSize: 11, color: textMuted, textTransform: 'uppercase', letterSpacing: .3 }}>{item.category || '-'}</div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: textMain, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 34 }} title={item.judul}>
                            {item.judul || 'Produk tanpa judul'}
                          </div>
                          <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>
                            {item._varians.length} varian
                            {item._jualMax > 0 && (
                              <> · <span style={{ color: textMain, fontWeight: 600 }}>
                                {item._jualMin === item._jualMax ? rpShort(item._jualMin) : `${rpShort(item._jualMin)}–${rpShort(item._jualMax)}`}
                              </span></>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {pageItems.length === 0 && (
                  <div style={{ padding: 40, textAlign: 'center', color: textMuted }}>Tidak ada produk yang cocok.</div>
                )}
                {/* pagination */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center', padding: '16px 0' }}>
                    <button style={toolbarBtn(false)} disabled={pageSafe <= 1} onClick={() => setPage(pageSafe - 1)}>‹</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((n) => n === 1 || n === totalPages || Math.abs(n - pageSafe) <= 2)
                      .reduce((acc, n, i, arr) => { if (i && n - arr[i - 1] > 1) acc.push('…'); acc.push(n); return acc; }, [])
                      .map((n, i) => n === '…'
                        ? <span key={`e${i}`} style={{ color: textMuted }}>…</span>
                        : <button key={n} style={toolbarBtn(n === pageSafe)} onClick={() => setPage(n)}>{n}</button>)}
                    <button style={toolbarBtn(false)} disabled={pageSafe >= totalPages} onClick={() => setPage(pageSafe + 1)}>›</button>
                  </div>
                )}
              </div>

              {/* ===== Panel detail produk terpilih ===== */}
              <div style={{
                width: 420, flexShrink: 0, position: 'sticky', top: 64, maxHeight: 'calc(100vh - 90px)', overflow: 'auto',
                background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: 14, color: textMain,
              }}>
                {!selected ? (
                  <div style={{ color: textMuted, textAlign: 'center', padding: '60px 10px', fontSize: 13 }}>
                    Klik salah satu produk untuk melihat & mengedit varian, HPP, harga jual, foto, dan status tampil.
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div
                        onClick={() => { setShowGambarDataModal(true); setIdProductEdit(selected.id); setSelectedDataProduct(selected); }}
                        title="Kelola foto"
                        style={{ width: 96, height: 96, borderRadius: 10, overflow: 'hidden', background: dark ? '#2a2a3a' : '#f3f4f6', cursor: 'pointer', flexShrink: 0 }}
                      >
                        {firstImage(selected)
                          ? <img src={firstImage(selected)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: textMuted }}><FaRegImages /></div>}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 11, color: textMuted, textTransform: 'uppercase' }}>{selected.category || '-'}</div>
                        <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>{selected.judul}</div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, cursor: 'pointer', fontSize: 13 }}>
                          <input type="checkbox" checked={!!selected.isDisplay} onChange={() => toggleDisplay(selected)} />
                          <span style={chip(selected.isDisplay ? '#dcfce7' : '#e5e7eb', selected.isDisplay ? '#166534' : '#374151')}>
                            {selected.isDisplay ? 'Tampil di website' : 'Hidden'}
                          </span>
                        </label>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                      <button style={toolbarBtn(false)} onClick={() => openDetailModal(selected)}><MdOutlineEditNote /> Detail / Edit</button>
                      <button style={toolbarBtn(false)} onClick={() => { setShowGambarDataModal(true); setIdProductEdit(selected.id); setSelectedDataProduct(selected); }}><FaRegImages /> Foto</button>
                      <button style={toolbarBtn(false)} onClick={() => { setIdProductEdit(selected.id); refreshDataVarian(); setShowTambahVarianModal(true); }}><FiPlus /> Varian</button>
                      <a href={`https://karyalogamfurniture.com/category/detail?id=${selected._id || selected.id}`} target="_blank" rel="noreferrer" style={{ ...toolbarBtn(false), textDecoration: 'none' }}>Lihat di website ↗</a>
                    </div>

                    {/* tag ongkir (wajib) & label produk per kategori — tersimpan langsung, tampil di website */}
                    <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 12, color: textMuted, marginBottom: 4 }}>Ongkir</div>
                        <Select
                          size="small"
                          style={{ width: '100%' }}
                          value={selected.ongkirTag || labelMaster.defaultOngkir}
                          getPopupContainer={(node) => node.parentNode}
                          onChange={(v) => saveTags(selected, { ongkirTag: v })}
                          options={ongkirOptions.map((o) => ({ value: o.name, label: o.name }))}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: textMuted, marginBottom: 4 }}>Label ({selected.category || '-'})</div>
                        <Select
                          size="small"
                          mode="multiple"
                          style={{ width: '100%' }}
                          placeholder={labelOptionsFor(selected.category).length ? 'Pilih label' : 'Belum ada label untuk kategori ini'}
                          value={selected.labels || []}
                          getPopupContainer={(node) => node.parentNode}
                          onChange={(v) => saveTags(selected, { labels: v })}
                          options={labelOptionsFor(selected.category).map((o) => ({ value: o.name, label: o.name }))}
                          maxTagCount="responsive"
                        />
                      </div>
                    </div>

                    {/* semua foto produk — klik untuk preview besar; "Kelola foto" untuk ganti/hapus */}
                    {(() => {
                      const imgs = Array.from({ length: 50 }, (_, i) => selected[`image${i + 1}`]).filter(Boolean);
                      return (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: textMuted, marginBottom: 6 }}>
                            <span>Foto ({imgs.length})</span>
                            <span onClick={() => { setShowGambarDataModal(true); setIdProductEdit(selected.id); setSelectedDataProduct(selected); }} style={{ cursor: 'pointer', color: '#013175' }}>Kelola foto ›</span>
                          </div>
                          {imgs.length === 0 ? (
                            <div style={{ fontSize: 12, color: textMuted }}>Belum ada foto.</div>
                          ) : (
                            <Image.PreviewGroup>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                                {imgs.map((src, i) => (
                                  <div key={i} style={{ aspectRatio: '1 / 1', borderRadius: 8, overflow: 'hidden', border: `1px solid ${cardBorder}`, background: dark ? '#2a2a3a' : '#f3f4f6' }}>
                                    <Image src={getImageUrl(src)} alt="" width="100%" height="100%" style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                                  </div>
                                ))}
                              </div>
                            </Image.PreviewGroup>
                          )}
                        </div>
                      );
                    })()}

                    {/* tabel varian: Jual bisa diedit langsung (autosave); klik nama varian → modal HPP per kategori */}
                    <table style={{ width: '100%', marginTop: 14, fontSize: 13, borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ color: '#354985', fontSize: 12 }}>
                          <th style={{ textAlign: 'left', padding: '6px 4px', borderBottom: `1px solid ${cardBorder}` }}>Varian</th>
                          <th style={{ textAlign: 'right', padding: '6px 4px', borderBottom: `1px solid ${cardBorder}` }}>HPP</th>
                          <th style={{ textAlign: 'right', padding: '6px 4px', borderBottom: `1px solid ${cardBorder}` }}>Jual</th>
                          <th style={{ textAlign: 'right', padding: '6px 4px', borderBottom: `1px solid ${cardBorder}` }}>GPM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected._varians.length === 0 && (
                          <tr><td colSpan={4} style={{ padding: 12, color: textMuted, textAlign: 'center' }}>Belum ada varian — klik "+ Varian".</td></tr>
                        )}
                        {selected._varians.map((v) => {
                          const hpp = hppOf(v);
                          const pending = variantChanges[v.id] && variantChanges[v.id].jual !== undefined ? Number(variantChanges[v.id].jual) : null;
                          const jual = pending !== null ? pending : (Number(v.jual) || 0);
                          const gpm = jual > 0 ? ((jual - hpp) / jual) * 100 : null;
                          const gpmColor = gpm === null ? textMuted : gpm < 30 ? '#c0392b' : '#1e7b34';
                          return (
                            <tr key={v.id}>
                              <td style={{ padding: '6px 4px', borderBottom: `1px solid ${cardBorder}` }}>
                                <span onClick={() => handleEditVarian(v)} style={{ cursor: 'pointer', textDecoration: 'underline dotted', textUnderlineOffset: 3 }} title="Edit varian & HPP per kategori">
                                  {v.varian || '-'}
                                </span>
                              </td>
                              <td style={{ padding: '6px 4px', textAlign: 'right', borderBottom: `1px solid ${cardBorder}`, color: hpp > 0 ? textMain : '#b91c1c', cursor: 'pointer' }} onClick={() => handleEditVarian(v)} title="Klik untuk isi HPP per kategori">
                                {hpp > 0 ? rp(hpp) : 'belum diisi'}
                              </td>
                              <td style={{ padding: '4px', textAlign: 'right', borderBottom: `1px solid ${cardBorder}` }}>
                                <NumericFormat
                                  value={jual || ''}
                                  thousandSeparator="."
                                  decimalSeparator=","
                                  prefix="Rp "
                                  placeholder={hpp > 0 ? `min ${rp(Math.round(hpp / 0.7))}` : 'Rp'}
                                  style={{ ...inputStyle, width: 130, textAlign: 'right', padding: '4px 6px', background: pending !== null ? '#fffbe6' : undefined }}
                                  onValueChange={(values) => handleChangeVarian(v.id, 'jual', values.value)}
                                />
                              </td>
                              <td style={{ padding: '6px 4px', textAlign: 'right', borderBottom: `1px solid ${cardBorder}`, color: gpmColor, fontWeight: 600 }}>
                                {gpm === null ? '—' : `${gpm.toFixed(1)}%`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div style={{ fontSize: 11, color: textMuted, marginTop: 8 }}>
                      Harga jual tersimpan otomatis beberapa detik setelah diketik. Klik nama varian / HPP untuk isi biaya per kategori.
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
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
                <div key={idx} style={{ position: 'relative' }}>
                  <Image
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
                  <button
                    title="Hapus foto"
                    onClick={() => { setShowConfirmDeleteImage(true); setImageDeleteNumber(key); }}
                    style={{ position: 'absolute', top: 4, right: 4, border: 'none', borderRadius: '50%', width: 24, height: 24, background: 'rgba(220,38,38,.9)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  ><MdDelete size={14} /></button>
                  {idx === 0 && <span style={{ position: 'absolute', bottom: 4, left: 4, fontSize: 10, background: 'rgba(1,49,117,.85)', color: '#fff', padding: '1px 6px', borderRadius: 999 }}>Utama</span>}
                </div>
              ))}
          </div>
          {/* Tambah foto: drag & drop / pilih file / paste — sama seperti komentar project */}
          <div style={{ marginTop: 16 }}>
            <div className="fw-semibold mb-1" style={{ fontSize: 13 }}>Tambah foto</div>
            <ImageUploadZone images={newPhotos} onChange={setNewPhotos} max={50} theme={globalTheme} />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setFileToUploadEdit({}); setShowEditGambarModal(true); setShowGambarDataModal(false); }}>
            Ganti per slot
          </Button>
          <Button variant="primary" disabled={!newPhotos.length || uploadingPhotos} onClick={uploadNewPhotos}>
            {uploadingPhotos ? 'Mengupload…' : `Upload ${newPhotos.length ? `(${newPhotos.length})` : ''}`}
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

      {/* ===== Modal daftar draft produk baru ===== */}
      <Modal show={showDrafts} onHide={() => setShowDrafts(false)} centered>
        <Modal.Header closeButton><Modal.Title style={{ fontSize: 17 }}>Draft Produk Baru</Modal.Title></Modal.Header>
        <Modal.Body>
          {drafts.length === 0 && <div className="text-muted">Tidak ada draft.</div>}
          {drafts.map((d) => (
            <div key={d.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${cardBorder}` }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: '#eee', overflow: 'hidden', flexShrink: 0 }}>
                {d.photos && d.photos[0] && <img src={getImageUrl(d.photos[0])} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(d.data && d.data.judul) || '(tanpa judul)'}</div>
                <div style={{ fontSize: 11, color: textMuted }}>
                  {(d.data && d.data.category) || '-'} · {(d.photos || []).length} foto · {(d.data && d.data.varians ? d.data.varians.length : 0)} varian · {d.updated_at ? new Date(d.updated_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
              <button className="btn btn-sm btn-primary" onClick={() => { window.open(`/products/new?draft=${d.id}`, '_blank'); setShowDrafts(false); }}>Lanjutkan</button>
              <Popconfirm title="Buang draft ini?" onConfirm={() => deleteDraft(d.id)} okText="Buang" cancelText="Batal">
                <button className="btn btn-sm btn-outline-danger"><MdDelete /></button>
              </Popconfirm>
            </div>
          ))}
        </Modal.Body>
      </Modal>

      {/* ===== Modal kelola label: tag ongkir (global) & label produk per kategori ===== */}
      <Modal show={showLabelMgr} onHide={() => setShowLabelMgr(false)} centered backdrop="static">
        <Modal.Header closeButton><Modal.Title style={{ fontSize: 17 }}>Kelola Label Produk</Modal.Title></Modal.Header>
        <Modal.Body>
          {[
            { type: 'ongkir', title: 'Tag Ongkir', hint: 'Wajib untuk semua produk. Default: ' + labelMaster.defaultOngkir, rows: ongkirOptions },
            { type: 'label', title: 'Label Produk per Kategori', hint: 'Bisa difilter customer di website. Tiap kategori punya label sendiri.', rows: labelOptionsFor(labelMgrCat) },
          ].map((sec) => (
            <div key={sec.type} className="mb-4">
              <div className="fw-semibold">{sec.title}</div>
              <div className="text-muted" style={{ fontSize: 12 }}>{sec.hint}</div>
              {sec.type === 'label' && (
                <Select
                  size="small" style={{ width: '100%', marginTop: 6 }} value={labelMgrCat || undefined} placeholder="Pilih kategori"
                  showSearch optionFilterProp="label"
                  getPopupContainer={(node) => node.parentNode}
                  onChange={setLabelMgrCat}
                  options={dataCategory.map((c) => ({ value: c.name, label: c.name }))}
                />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                {sec.rows.length === 0 && <div className="text-muted" style={{ fontSize: 12 }}>Belum ada.</div>}
                {sec.rows.map((l) => (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      className="form-control form-control-sm"
                      defaultValue={l.name}
                      onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== l.name) labelApi('PUT', `/products/labels/update/${l.id}`, { name: v }); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                    />
                    <Popconfirm title="Hapus label ini? Akan dilepas dari semua produk." onConfirm={() => labelApi('DELETE', `/products/labels/delete/${l.id}`)} okText="Hapus" cancelText="Batal">
                      <button className="btn btn-sm btn-outline-danger" disabled={sec.type === 'ongkir' && l.name === labelMaster.defaultOngkir}><MdDelete /></button>
                    </Popconfirm>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    className="form-control form-control-sm"
                    placeholder={sec.type === 'ongkir' ? 'Tag ongkir baru…' : `Label baru untuk ${labelMgrCat || 'kategori'}…`}
                    value={labelNew[sec.type]}
                    disabled={sec.type === 'label' && !labelMgrCat}
                    onChange={(e) => setLabelNew((n) => ({ ...n, [sec.type]: e.target.value }))}
                    onKeyDown={async (e) => {
                      if (e.key !== 'Enter' || !labelNew[sec.type].trim()) return;
                      if (await labelApi('POST', '/products/labels/create', { type: sec.type, category: labelMgrCat, name: labelNew[sec.type] })) setLabelNew((n) => ({ ...n, [sec.type]: '' }));
                    }}
                  />
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={!labelNew[sec.type].trim() || (sec.type === 'label' && !labelMgrCat)}
                    onClick={async () => { if (await labelApi('POST', '/products/labels/create', { type: sec.type, category: labelMgrCat, name: labelNew[sec.type] })) setLabelNew((n) => ({ ...n, [sec.type]: '' })); }}
                  ><FiPlus /></button>
                </div>
              </div>
            </div>
          ))}
          <div className="text-muted" style={{ fontSize: 11 }}>Ubah nama: edit lalu klik di luar / Enter — produk yang memakainya ikut berubah.</div>
        </Modal.Body>
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
