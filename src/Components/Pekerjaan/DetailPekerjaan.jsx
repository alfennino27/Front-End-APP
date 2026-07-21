import React, { useState, useEffect, useRef } from 'react';
import { Col, Container, Modal, Button, Dropdown, Toast } from 'react-bootstrap';
import '../Pekerjaan/pekerjaan.css';
import { MdDelete, MdOutlineLocationOn } from 'react-icons/md';
import { MdAssignment } from "react-icons/md";
import { MdAddCircleOutline } from "react-icons/md";
import { HiOutlineMinusCircle, HiTemplate } from "react-icons/hi";
import { useParams } from 'react-router-dom';
import klftoast from '../../assets/images/klflogo.png';
import { FaPaste, FaRegCommentDots } from "react-icons/fa";
import { BsReply } from "react-icons/bs";
import { MdAccessTime } from "react-icons/md";
import { IoCalendarNumberOutline, IoNewspaperOutline } from "react-icons/io5";
import { AiOutlinePrinter } from "react-icons/ai";
import { getApiBaseUrl } from '../../Config/APIurl';
import ConsistencyCheck from '../AI/ConsistencyCheck';
import SPKPrecheckModal from '../AI/SPKPrecheckModal';
import SPKLayoutModal from './SPKLayoutModal';
import ImageUploadZone from './ImageUploadZone';
import { format } from "date-fns";
import { id } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Image, Progress, Form, Mentions, Space, InputNumber, Select, Popconfirm } from 'antd';
import { Link } from 'react-router-dom';
import { useTheme } from '../../ThemeContext';
import { getImageUrl } from '../../Utils/image';
import noImageAvailable from '../../assets/images/noImageAvailable.png';
import glbLogoImg from '../../assets/images/glbLogo.webp';

const { Option } = Select;

const DetailPekerjaan = () => {
  const baseUrl = getApiBaseUrl();
  const { slug, categorySearch, idSearch } = useParams();
  const [showModal, setShowModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showInformationModal, setShowInformationModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showToDoListModal, setShowToDoListModal] = useState(false);
  const [showSupplier, setShowSupplier] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [supplierCategory, setSupplierCategory] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [dataSupplierFromDB, setDataSupplierFromDB] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [showConfirmDeleteSupplier, setShowConfirmDeleteSupplier] = useState(false);
  const [showImageEdit, setShowImageEdit] = useState(false);
  const [showImageRenderEdit, setShowImageRenderEdit] = useState(false);
  const [showConfirmDeleteImage, setShowConfirmDeleteImage] = useState(false);
  const [imageDeleteNumber, setImageDeleteNumber] = useState('');

  const [showModalEditComment, setShowModalEditComment] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showConfirmInformationDelete, setShowConfirmInformationDelete] = useState(false);
  const [editCommentText, setEditCommentText] = useState('');
  const [editCommentId, setEditCommentId] = useState('');
  const [editCommentType, setEditCommentType] = useState('');
  // Gambar yang sudah ada (dari server) — { key: 'image1', url }. Dihapus dari sini = ditandai untuk dihapus.
  const [editExistingImages, setEditExistingImages] = useState([]);
  const [editRemoveKeys, setEditRemoveKeys] = useState([]);
  // Gambar baru yang mau ditambahkan (File[]), dipilih via ImageUploadZone.
  const [editNewImages, setEditNewImages] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [showToast2, setShowToast2] = useState(false);
  const [newCommentClass, setNewCommentClass] = useState('');
  const [newReplyClass, setNewReplyClass] = useState('');
  const isMobile = window.innerWidth <= 768;

  const [dataSPKFromDB, setDataSPKFromDB] = useState([]);
  const [selectedSPKCode, setSelectedSPKCode] = useState('');
  const [selectedSPKId, setSelectedSPKId] = useState('');

  const [supplierBesi, setSupplierBesi] = useState('');
  const [supplierKayu, setSupplierKayu] = useState('');
  const [supplierJok, setSupplierJok] = useState('');
  const [supplierRotan, setSupplierRotan] = useState('');
  const [supplierMarmer, setSupplierMarmer] = useState('');
  const [supplierKaca, setSupplierKaca] = useState('');
  const [supplierKain, setSupplierKain] = useState('');
  const [supplierFiber, setSupplierFiber] = useState('');
  const [supplierStainless, setSupplierStainless] = useState('');
  const [supplierVeneer, setSupplierVeneer] = useState('');
  const [supplierFinishing, setSupplierFinishing] = useState('');
  const [supplierHardware, setSupplierHardware] = useState('');
  const [supplierBarangJadi, setSupplierBarangJadi] = useState('');
  const [supplierPengiriman, setSupplierPengiriman] = useState('');
  const [supplierTestimoni, setSupplierTestimoni] = useState('');

  const [productNameInformation, setProductNameInformation] = useState('');
  const [buyerNameInformation, setBuyerNameInformation] = useState('');
  const [buyerLocationInformation, setBuyerLocationInformation] = useState('');
  const [orderDateInformation, setOrderDateInformation] = useState('');
  const [deadlineInformation, setDeadlineInformation] = useState('');
  const [targetKirimInformation, setTargetKirimInformation] = useState('');
  const [descriptionInformation, setDescriptionInformation] = useState('');
  const [ukuranQC, setUkuranQC] = useState('');
  const [finishingQC, setFinishingQC] = useState('');
  const [jenisMarmerQC, setJenisMarmerQC] = useState('');
  const [jenisKainQC, setJenisKainQC] = useState('');
  const [percentageInformation, setPercentageInformation] = useState('');
  const [statusInformation, setStatusInformation] = useState('');

  const [jumlahImageEdit, setJumlahImageEdit] = useState(10);
  const [jumlahImageCategory, setJumlahImageCategory] = useState(10);
  const [jumlahImageRenderEdit, setJumlahImageRenderEdit] = useState(10);
  const [fileToUploadEdit, setFileToUploadEdit] = useState({});
  const handleFileChange = (index, file) => {
    setFileToUploadEdit((prev) => ({
      ...prev,
      [index]: file
    }));
  };

  const [fileToUploadCategoryEdit, setFileToUploadCategoryEdit] = useState({});
  const handleFileChangeCategoryEdit = (index, file) => {
    setFileToUploadCategoryEdit((prev) => ({
      ...prev,
      [index]: file
    }));
  };

  const [fileToUploadRenderEdit, setFileToUploadRenderEdit] = useState({});
  const handleFileRenderChange = (index, file) => {
    setFileToUploadRenderEdit((prev) => ({
      ...prev,
      [index]: file
    }));
  };


  // const [fileToUploadEdit, setFileToUploadEdit] = useState(null);
  const [fileToUploadEdit2, setFileToUploadEdit2] = useState(null);
  const [fileToUploadEdit3, setFileToUploadEdit3] = useState(null);
  const [fileToUploadEdit4, setFileToUploadEdit4] = useState(null);
  const [fileToUploadEdit5, setFileToUploadEdit5] = useState(null);
  const [fileToUploadEdit6, setFileToUploadEdit6] = useState(null);
  const [fileToUploadEdit7, setFileToUploadEdit7] = useState(null);
  const [fileToUploadEdit8, setFileToUploadEdit8] = useState(null);
  const [fileToUploadEdit9, setFileToUploadEdit9] = useState(null);
  const [fileToUploadEdit10, setFileToUploadEdit10] = useState(null);

  // const [fileToUploadCategoryEdit, setFileToUploadCategoryEdit] = useState(null);
  const [fileToUploadCategoryEdit2, setFileToUploadCategoryEdit2] = useState(null);
  const [fileToUploadCategoryEdit3, setFileToUploadCategoryEdit3] = useState(null);
  const [fileToUploadCategoryEdit4, setFileToUploadCategoryEdit4] = useState(null);
  const [fileToUploadCategoryEdit5, setFileToUploadCategoryEdit5] = useState(null);
  const [fileToUploadCategoryEdit6, setFileToUploadCategoryEdit6] = useState(null);
  const [fileToUploadCategoryEdit7, setFileToUploadCategoryEdit7] = useState(null);
  const [fileToUploadCategoryEdit8, setFileToUploadCategoryEdit8] = useState(null);
  const [fileToUploadCategoryEdit9, setFileToUploadCategoryEdit9] = useState(null);
  const [fileToUploadCategoryEdit10, setFileToUploadCategoryEdit10] = useState(null);

  const [kodeInvoiceInformation, setKodeInvoiceInformation] = useState('');
  const [hargaInformation, setHargaInformation] = useState('');
  const [qtyInformation, setQtyInformation] = useState('');

  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [showEvaluationEditModal, setShowEvaluationEditModal] = useState(false);
  const [evaluation, setEvaluation] = useState('');

  const [dataProjectFromDB, setDataProjectFromDB] = useState([]);
  const [dataCommentsFromDB, setDataCommentsFromDB] = useState([]);
  const [dataRepliesFromDB, setDataRepliesFromDB] = useState([]);
  const [dataUserFromDB, setDataUserFromDB] = useState([]);
  // Item SPK milik project ini (untuk tampilkan harga SPK per kategori)
  const [spkProductList, setSpkProductList] = useState([]);
  const [category, setCategory] = useState('');
  const [lastReply, setLastReply] = useState('');

  const [supplier, setSupplier] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  // Riwayat perubahan (versioning) deskripsi
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyTitle, setHistoryTitle] = useState('');
  const [showConfirmCategoryModal, setShowConfirmCategoryModal] = useState(false);
  const [showSPKImagePicker, setShowSPKImagePicker] = useState(false);
  const [showSpkPrecheck, setShowSpkPrecheck] = useState(false);
  const [spkImages, setSpkImages] = useState([]);
  const [alurKerjaModalOpen, setAlurKerjaModalOpen] = useState(false);
  const [alurKerjaCurrentVal, setAlurKerjaCurrentVal] = useState(null);
  const [alurKerjaField, setAlurKerjaField] = useState('');
  const [alurKerjaLabel, setAlurKerjaLabel] = useState('');
  const [alurKerjaStep, setAlurKerjaStep] = useState('choose');
  const [alurKerjaKeterangan, setAlurKerjaKeterangan] = useState('');
  const [todo, setTodo] = useState([]);
  const [categoryStatus, setCategoryStatus] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  const [dataStorageFromDB, setDataStorageFromDB] = useState([]);
  const [storageFolder, setStorageFolder] = useState('');

  const [textComment, setTextComment] = useState('');
  // Daftar gambar untuk komentar & reply (maks 10). Diisi via ImageUploadZone:
  // drag & drop, paste banyak gambar, atau pilih file.
  const [commentImages, setCommentImages] = useState([]);
  const [replyImages, setReplyImages] = useState([]);
  const [submittingComment, setSubmittingComment] = useState(false);

  const [showImageCategoryEdit, setShowImageCategoryEdit] = useState(false);

  const [commentId, setCommentId] = useState('');
  const [textReply, setTextReply] = useState('');
  const [indexComment, setIndexComment] = useState('');

  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;
  const bottomRef = useRef(null);

  const [canSeeTelepon, setCanSeeTelepon] = useState(false);
  useEffect(() => {
    if (!user?.uid) return;
    fetch(`${baseUrl}/useraccess/get`)
      .then(r => r.json())
      .then(data => {
        const has = data.some(a => a.uid === user.uid && a.menu === 'Lihat Telepon' && a.value === true);
        setCanSeeTelepon(has);
      })
      .catch(() => {});
  }, []);
  const refs = useRef([]);


  const handleShowModal = () => {
    if (category == "") {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } else {
      setCommentImages([]);
      setTextComment('');
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleShowReplyModal = () => {
    setReplyImages([]);
    setTextReply('');
    setShowReplyModal(true);
  };

  const handleCloseReplyModal = () => {
    setShowReplyModal(false);
  };

  function handleShowCategoryModal() {
    setShowCategoryModal(true);
  }

  function handleCloseCategoryModal() {
    setShowCategoryModal(false);
  }

  function handleShowInformationModal() {
    //biar mad sama udin ga bisa ngedit
    if (user.uid === "rYN2eFpFqVU5jSYRrwyioAi33xD3" || user.uid === "qd2gyCyknDVZYUfA6IkiQv3jGTI3") {
      console.log('anda tidak punya izin');
    } else {
      setSearchInvoice('');
      setShowInformationModal(true);
    }
  }

  function handleCloseInformationModal() {
    setShowInformationModal(false);
  }

  // const handleDeleteInformation = () => {
  //   setShowConfirmInformationDelete(true);
  //   setShowInformationModal(false);
  // };

  // const handleDeleteInformationCancel = () => {
  //   setShowConfirmInformationDelete(false);
  // };

  // const navigate = useNavigate();

  // const handleDeleteInformationConfirm = async () => {
  //   setShowConfirmInformationDelete(false);
  //   //hapus data
  //   await deleteDoc(doc(db, 'Projects', slug));
  //   navigate('/project');
  // };



  const handleDeleteImageConfirm = async () => {
    setShowConfirmDeleteImage(false);

    try {
      const res = await fetch(`${baseUrl}/projects/images/delete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug,
          imageDeleteNumber,
        }),
      });

      if (!res.ok) throw new Error('Gagal mengedit Note Item');

      await res.json();
      console.log('Image deleted successfully:');

      if (['image1', 'image2', 'image3', 'image4', 'image5', 'image6', 'image7', 'image8', 'image9', 'image10'].includes(imageDeleteNumber)) {
        setShowImageEdit(true);
      } else {
        setShowImageCategoryEdit(true);
      }

      refreshData();
    } catch (e) {
      console.error('Error updating Note Item:', e);
    }
  };


  function handleShowEditCategoryModal() {
    if (category == "") {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } else {
      if (user.uid === "rYN2eFpFqVU5jSYRrwyioAi33xD3" || user.uid === "qd2gyCyknDVZYUfA6IkiQv3jGTI3") {
        console.log('anda tidak punya izin');
      } else {
        supplierData();
        setShowEditCategoryModal(true);
      }
    }
  }

  function handleShowToDoListModal(e) {
    e.stopPropagation();
    if (category == "") {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } else {
      if (user.uid === "rYN2eFpFqVU5jSYRrwyioAi33xD3" || user.uid === "qd2gyCyknDVZYUfA6IkiQv3jGTI3") {
        console.log('anda tidak punya izin');
      } else {
        setShowToDoListModal(true);
      }
    }
  }

  const supplierData = async () => {
    try {
      const res = await fetch(`${baseUrl}/supplier/list`);
      const data = await res.json();
      setDataSupplierFromDB(data);
    } catch (error) {
      console.error('Gagal mengambil data supplier:', error);
    }
  };

  const handleShowSupplierModal = () => {
    setShowEditCategoryModal(false);
    setShowSupplier(true);
  };

  const handleCloseSupplierModal = () => {
    setShowSupplier(false);
  };

  const handleAddSupplierModal = (supplierCategory) => {
    setSupplierCategory(supplierCategory);
    setShowSupplier(false);
    setShowAddSupplier(true);
  };

  const handleCloseAddSupplierModal = () => {
    setShowAddSupplier(false);
    setShowSupplier(true);
  };

  const handleDeleteSupplierClick = (supplierId) => {
    setSupplierId(supplierId);
    setShowSupplier(false);
    setShowConfirmDeleteSupplier(true);
  };

  const handleDeleteSupplierCancel = () => {
    setShowConfirmDeleteSupplier(false);
    setShowSupplier(true);
  };

  const handleDeleteSupplierConfirm = async () => {
    setShowConfirmDeleteSupplier(false);

    try {
      const response = await fetch(`${baseUrl}/supplier/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: supplierId }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Gagal menghapus supplier:', result.message);
        return;
      }

      console.log('Supplier berhasil dihapus');
      supplierData();       // Refresh list supplier
      setShowSupplier(true); // Tampilkan tabel/modal supplier lagi

    } catch (error) {
      console.error('Terjadi kesalahan saat menghapus supplier:', error);
    }
  };


  function handleCloseEditCategoryModal() {
    setShowEditCategoryModal(false);
  }

  function handleCategoryChange(eventKey) {
    setCategory(eventKey);
    setShowCategoryModal(false);
  }

  function handleCommentIdChange(id, index) {
    setCommentId(id);
    setIndexComment(index);
    handleShowReplyModal();
  }

  const handleEditComment = (id, comment, type, fullObj) => {
    setEditCommentType(type);
    setEditCommentId(id);
    setEditCommentText(comment);
    const existingImages = Array.from({ length: 10 }, (_, i) => `image${i + 1}`)
      .filter((key) => fullObj && fullObj[key])
      .map((key) => ({ key, url: fullObj[key] }));
    setEditExistingImages(existingImages);
    setEditRemoveKeys([]);
    setEditNewImages([]);
    setShowModalEditComment(true);
  };
  const handleCloseEditComment = () => {
    setShowModalEditComment(false);
  };

  const handleRemoveExistingEditImage = (key) => {
    setEditExistingImages((prev) => prev.filter((img) => img.key !== key));
    setEditRemoveKeys((prev) => [...prev, key]);
  };

  const handleDeleteClick = () => {
    setShowConfirm(true);
    setShowModalEditComment(false);
  };


  const handleDeleteConfirm = async () => {
    setShowConfirm(false);

    try {
      const payload = {
        type: editCommentType, // 'Comment' atau 'Reply'
        id: editCommentId,
        user: user.uid,
        idProduct: slug,
        category: category,
      };

      if (editCommentType === 'Reply') {
        payload.commentId = commentId;
      }

      const response = await fetch(`${baseUrl}/comments/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Gagal menghapus komentar:', result.message);
        return;
      }

      console.log('Komentar berhasil dihapus:', result.message);
    } catch (error) {
      console.error('Terjadi kesalahan saat menghapus komentar:', error.message);
    }

    commentsData(); // Refresh data komentar
  };


  const handleDeleteCancel = () => {
    setShowConfirm(false);
  };

  const openModalImg = (imageSrc) => {
    setSelectedImage(imageSrc);
  };

  const closeModalImg = () => {
    setSelectedImage(null);
  };

  // Buka modal riwayat perubahan deskripsi (urut terbaru di atas)
  const openHistory = (history, title) => {
    const list = Array.isArray(history) ? [...history] : [];
    // Beri nomor versi berdasarkan urutan insert (index awal = V1)
    // sebelum diurutkan untuk tampilan, supaya V1 selalu = yang pertama masuk
    const withVersions = list.map((entry, i) => ({ ...entry, versionNum: i + 1 }));
    withVersions.sort((a, b) => new Date(b.ts) - new Date(a.ts));
    setHistoryData(withVersions);
    setHistoryTitle(title);
    setShowHistoryModal(true);
  };

  const formatHistoryDate = (ts) => {
    if (!ts) return '-';
    try {
      return new Date(ts).toLocaleString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch (e) {
      return '-';
    }
  };

  const historySourceLabel = (source) => {
    switch (source) {
      case 'projects': return 'Projects';
      case 'invoice': return 'Invoice';
      case 'image': return 'Gambar';
      case 'baseline': return 'Data awal';
      default: return source || '-';
    }
  };

  useEffect(() => {
    // console.log(category);
    commentsData();
  }, [category]);

  useEffect(() => {
    // console.log(commentId);
  }, [commentId]);

  const handleResetCategory = async () => {
    setShowEditCategoryModal(false);
    try {
      const response = await fetch(`${baseUrl}/projects/update/category`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          category,
          supplier: '',
          orderDate: null,
          deadline: '',
          description: '',
          categoryStatus: null,
          selectedSPKId: null,
          uid: user?.uid || ''
        }),
      });
      if (response.ok) await refreshData();
    } catch (error) {
      console.error('Gagal reset kategori:', error);
    }
  };

  const handleSubmit = async () => {
    setShowEditCategoryModal(false);

    // let formattedOrderDate = orderDate;
    // const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    // if (!dateRegex.test(orderDate)) {
    //   formattedOrderDate = '2024-04-19'; // default date
    // }

    try {
      const response = await fetch(`${baseUrl}/projects/update/category`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug,
          category,
          supplier,
          orderDate: orderDate || null,
          deadline,
          description,
          categoryStatus,
          selectedSPKId,
          uid: user?.uid || ''
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Gagal update supplier:', result.message);
        return;
      }

      console.log('Update supplier berhasil');
      await refreshData(); // refresh data dari server
    } catch (error) {
      console.error('Terjadi kesalahan:', error);
    }
  };


  // Ubah status category langsung dari list picker (desktop/tablet) — tidak buka modal edit penuh.
  // Optimistic update: badge berubah seketika, baru sinkron ke server di background.
  const handleQuickStatusChange = async (cat, newStatus) => {
    const prevValue = dataProjectFromDB[0]?.[`CategoryStatus${cat}`] ?? null;
    if (prevValue === newStatus) return;

    setDataProjectFromDB((prev) => {
      if (!prev || prev.length === 0) return prev;
      const updated = { ...prev[0], [`CategoryStatus${cat}`]: newStatus };
      return [updated, ...prev.slice(1)];
    });

    try {
      const response = await fetch(`${baseUrl}/projects/update/category-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, category: cat, categoryStatus: newStatus }),
      });
      if (!response.ok) throw new Error('Gagal update status');
    } catch (error) {
      console.error('Gagal update status category:', error);
      // Revert kalau gagal
      setDataProjectFromDB((prev) => {
        if (!prev || prev.length === 0) return prev;
        const reverted = { ...prev[0], [`CategoryStatus${cat}`]: prevValue };
        return [reverted, ...prev.slice(1)];
      });
      alert('Gagal menyimpan status. Coba lagi.');
    }
  };

  const handleSubmitToDoList = async () => {
    try {
      setShowToDoListModal(false);

      const formattedTodos = Array.isArray(todo)
        ? todo.map(t => ({ text: t.text || "", done: !!t.done }))
        : [];

      const response = await fetch(`${baseUrl}/projects/update/todo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug,
          category,
          todo: formattedTodos,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Gagal update To-Do List:", result.message);
        return;
      }

      console.log("To-Do List berhasil diperbarui");
      await refreshData();
    } catch (error) {
      console.error("Terjadi kesalahan saat update To-Do List:", error);
    }
  };



  const handleSubmitInformation = async () => {
    setShowInformationModal(false);

    const updatedIdInvoice = idInvoice === undefined ? '' : idInvoice;
    const updatedKodeInvoiceInformation = kodeInvoiceInformation === undefined ? '' : kodeInvoiceInformation;

    const updatedHargaInformation = hargaInformation === undefined ? '0' : hargaInformation;
    const updatedQtyInformation = qtyInformation === undefined ? '0' : qtyInformation;

    const updatedUkuranQC = ukuranQC === undefined ? '' : ukuranQC;
    const updatedFinishingQC = finishingQC === undefined ? '' : finishingQC;
    const updatedJenisMarmerQC = jenisMarmerQC === undefined ? '' : jenisMarmerQC;
    const updatedJenisKainQC = jenisKainQC === undefined ? '' : jenisKainQC;

    const updatedStorageFolder = storageFolder === undefined ? '' : storageFolder;

    try {
      const res = await fetch(`${baseUrl}/projects/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: slug,
          NamaBarang: productNameInformation,
          Buyer: buyerNameInformation,
          Lokasi: buyerLocationInformation,
          Date: orderDateInformation,
          Deadline: deadlineInformation,
          TargetKirim: targetKirimInformation || '',
          Percentage: percentageInformation,
          Status: statusInformation,
          Spesifikasi: descriptionInformation,
          KodeInvoice: updatedKodeInvoiceInformation,
          idInvoice: updatedIdInvoice,
          Harga: updatedHargaInformation,
          Qty: updatedQtyInformation,
          UkuranQC: updatedUkuranQC,
          FinishingQC: updatedFinishingQC,
          JenisMarmerQC: updatedJenisMarmerQC,
          JenisKainQC: updatedJenisKainQC,
          StorageFolder: updatedStorageFolder,
          uid: user?.uid || '',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Gagal update project:', errorData.message);
        return;
      }

      await refreshData(); // fungsi untuk ambil ulang data dari API
    } catch (e) {
      console.error('Error update project:', e);
    }
  };


  const handleSubmitImageEdit = async () => {
    setShowImageEdit(false);
    const formData = new FormData();
    formData.append('uid', user?.uid || '');

    for (let i = 1; i <= jumlahImageEdit; i++) {
      const file = fileToUploadEdit[i];
      if (file) {
        formData.append(`image${i}`, file);
      }
    }

    try {
      const res = await fetch(`${baseUrl}/projects/images/update/${slug}`, {
        method: 'PUT',
        body: formData,
      });

      const result = await res.json();
      console.log('Upload result:', result);
      await refreshData();
    } catch (err) {
      console.error('Upload gagal:', err);
    }
  };


  const handleSubmitImageCategoryEdit = async () => {
    setShowImageCategoryEdit(false);

    try {
      const formData = new FormData();
      formData.append('category', category); // contoh: 'furniture'
      formData.append('uid', user?.uid || '');

      for (let i = 1; i <= jumlahImageCategory; i++) {
        const file = fileToUploadCategoryEdit[i];
        if (file) {
          formData.append(`image${i}`, file);
        }
      }

      const res = await fetch(`${baseUrl}/projects/images/category/${slug}`, {
        method: 'PUT',
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        console.log('Gambar kategori berhasil diperbarui:', result);

        if (category === 'BarangJadi') {
          const uploaderName = dataUserFromDB.find(u => u.uid === user?.uid)?.name || 'User';
          const commentData = new FormData();
          commentData.append('user', user.uid);
          commentData.append('idProduct', slug);
          commentData.append('category', category);
          commentData.append('text', `${uploaderName} tolong cek @Alfen @P. Dhe`);
          await fetch(`${baseUrl}/comments/create`, { method: 'POST', body: commentData });
        }

        await refreshData();
      } else {
        console.error('Gagal memperbarui gambar kategori:', result.message);
      }
    } catch (error) {
      console.error('Terjadi kesalahan saat mengunggah gambar kategori:', error);
    }
  };

  const handleSubmitImageRenderEdit = async () => {
    setShowImageRenderEdit(false);
    const formData = new FormData();

    for (let i = 1; i <= jumlahImageRenderEdit; i++) {
      const file = fileToUploadRenderEdit[i];
      if (file) {
        formData.append(`imageRender${i}`, file);
      }
    }

    try {
      const res = await fetch(`${baseUrl}/projects/images/render/${slug}`, {
        method: 'PUT',
        body: formData,
      });

      const result = await res.json();
      console.log('Upload result:', result);
      await refreshData();
    } catch (err) {
      console.error('Upload gagal:', err);
    }
  };




  const refreshImageEditInput = () => {
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

    setFileToUploadCategoryEdit(null);
    setFileToUploadCategoryEdit2(null);
    setFileToUploadCategoryEdit3(null);
    setFileToUploadCategoryEdit4(null);
    setFileToUploadCategoryEdit5(null);
    setFileToUploadCategoryEdit6(null);
    setFileToUploadCategoryEdit7(null);
    setFileToUploadCategoryEdit8(null);
    setFileToUploadCategoryEdit9(null);
    setFileToUploadCategoryEdit10(null);

    setImageDeleteNumber('');
  };

  const handleSubmitAddSupplier = async () => {
    setShowAddSupplier(false);

    try {
      const response = await fetch(`${baseUrl}/supplier/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplierName,
          category: supplierCategory,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Gagal menambahkan supplier:', result.message);
        return;
      }

      console.log('Supplier berhasil ditambahkan:', result.insertedId);

      supplierData();       // Refresh data supplier
      setShowSupplier(true); // Tampilkan kembali tabel/modal supplier

    } catch (error) {
      console.error('Terjadi kesalahan saat menambahkan supplier:', error);
    }
  };



  // POST FormData dengan retry — untuk kondisi sinyal lapangan yang naik-turun.
  const postWithRetry = async (url, formData, retries = 2) => {
    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, { method: 'POST', body: formData });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res;
      } catch (err) {
        lastErr = err;
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 1500 * (attempt + 1))); // backoff
        }
      }
    }
    throw lastErr;
  };

  const handleSubmitComment = async () => {
    if (submittingComment) return; // cegah double-submit
    setSubmittingComment(true);
    try {
      const formData = new FormData();
      formData.append('user', user.uid);
      formData.append('idProduct', slug);
      formData.append('category', category);
      formData.append('text', textComment);

      commentImages.forEach((file) => {
        if (file) {
          formData.append('images', file);
        }
      });

      // Retry untuk sinyal lapangan yang jelek: coba beberapa kali sebelum menyerah.
      await postWithRetry(`${baseUrl}/comments/create`, formData);

      // Sukses → baru tutup & bersihkan (gambar tidak hilang kalau tadi gagal).
      setShowModal(false);
      setCommentImages([]);
      setTextComment('');

      await commentsData();
      setTimeout(() => {
        setNewCommentClass('newComment');
        bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 300);
    } catch (e) {
      console.error('Error adding comment: ', e);
      alert('Gagal mengirim komentar (sinyal kurang bagus). Foto masih tersimpan — coba Submit lagi.');
    } finally {
      setSubmittingComment(false);
    }
  };


  const handleSubmitReply = async () => {
    try {
      setShowReplyModal(false);

      const formData = new FormData();
      formData.append('user', user.uid);
      formData.append('idProduct', slug);
      formData.append('category', category);
      formData.append('text', textReply);
      formData.append('commentId', commentId);

      // Upload maksimal 10 file gambar
      replyImages.forEach((file) => {
        if (file) {
          formData.append('images', file);
        }
      });

      const res = await fetch(`${baseUrl}/replies/create`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengirim reply');
      }

      await commentsData(); // refresh komentar
      setTimeout(() => {
        setNewReplyClass('newComment');
        refs.current[indexComment].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    } catch (e) {
      console.error('Error submit reply:', e);
    }
  };


  const handleSubmitEditComment = async () => {
    setShowModalEditComment(false);

    try {
      const formData = new FormData();
      formData.append('type', editCommentType); // 'Comment' atau 'Reply'
      formData.append('id', editCommentId);
      formData.append('text', editCommentText);
      formData.append('user', user.uid);
      formData.append('idProduct', slug);
      formData.append('category', category);
      formData.append('removeImages', JSON.stringify(editRemoveKeys));

      if (editCommentType === "Reply") {
        formData.append('commentId', commentId);
      }

      editNewImages.forEach((file) => {
        if (file) formData.append('images', file);
      });

      const response = await fetch(`${baseUrl}/comments/edit`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Gagal update komentar:', result.message);
        return;
      }

      console.log('Komentar berhasil diupdate:', result.message);
    } catch (error) {
      console.error('Terjadi kesalahan:', error.message);
    }

    commentsData(); // Refresh data komentar
  };

  const refreshData = async () => {
    try {
      const res = await fetch(`${baseUrl}/projects/detail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ slug })
      });

      if (!res.ok) throw new Error('Gagal mengambil data project');

      const data = await res.json();

      setSupplierBesi(data.SupplierBesi);
      setSupplierKayu(data.SupplierKayu);
      setSupplierJok(data.SupplierJok);
      setSupplierRotan(data.SupplierRotan);
      setSupplierMarmer(data.SupplierMarmer);
      setSupplierKaca(data.SupplierKaca);
      setSupplierKain(data.SupplierKain);
      setSupplierFiber(data.SupplierFiber);
      setSupplierStainless(data.SupplierStainless);
      setSupplierVeneer(data.SupplierVeneer);
      setSupplierFinishing(data.SupplierFinishing);
      setSupplierHardware(data.SupplierHardware);
      setSupplierBarangJadi(data.SupplierBarangJadi);
      setSupplierPengiriman(data.SupplierPengiriman);
      setSupplierTestimoni(data.SupplierTestimoni);

      setDataProjectFromDB([data]); // karena sebelumnya berbentuk array
    } catch (err) {
      console.error('Error saat refresh data:', err.message);
    }
  };

  // Ambil semua item SPK milik project ini (untuk harga SPK per kategori)
  const fetchSpkProducts = async () => {
    if (!slug || slug === 'salah') return;
    try {
      const res = await fetch(`${baseUrl}/spkproduct/byproduct/get?idProduct=${encodeURIComponent(slug)}`);
      if (!res.ok) return;
      const data = await res.json();
      setSpkProductList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error ambil SPKproduct:', err.message);
    }
  };

  useEffect(() => {
    fetchSpkProducts();
  }, [slug]);


  const commentsData = async () => {
    try {
      if (!slug || !category) {
        return;
      }

      const res = await fetch(`${baseUrl}/comments/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          slug,
          category
        })
      });

      if (!res.ok) throw new Error('Gagal mengambil komentar');

      const data = await res.json();
      console.log("data :", data);
      setDataCommentsFromDB(data);
      repliesData(); // lanjut ambil replies
    } catch (err) {
      console.error('Error saat mengambil komentar:', err.message);
    }
  };



  const repliesData = async () => {
    try {
      if (!slug || !category) {
        return;
      }

      const res = await fetch(`${baseUrl}/replies/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          slug,
          category
        })
      });

      if (!res.ok) throw new Error('Gagal mengambil balasan');

      const data = await res.json();
      setDataRepliesFromDB(data);
    } catch (err) {
      console.error('Error saat mengambil balasan:', err.message);
    }
  };



  useEffect(() => {
    localStorage.setItem('lastSlug', slug);

    const fetchData = async () => {
      if (slug === 'salah') return;

      try {
        const res = await fetch(`${baseUrl}/projects/detail`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Gagal mengambil data');

        setDataProjectFromDB([data]);

        setProductNameInformation(data.NamaBarang);
        setBuyerNameInformation(data.Buyer);
        setBuyerLocationInformation(data.Lokasi);
        setOrderDateInformation(data.Date);
        setDeadlineInformation(data.Deadline);
        setTargetKirimInformation(data.TargetKirim || '');
        setDescriptionInformation(data.Spesifikasi);
        setUkuranQC(data.UkuranQC);
        setFinishingQC(data.FinishingQC);
        setJenisMarmerQC(data.JenisMarmerQC);
        setJenisKainQC(data.JenisKainQC);
        setPercentageInformation(data.Percentage);
        setStatusInformation(data.Status);
        setStorageFolder(data.StorageFolder);

        setKodeInvoiceInformation(data.KodeInvoice);
        setHargaInformation(data.Harga);
        setQtyInformation(data.Qty);
        setIdInvoice(data.idInvoice);

        setEvaluation(data.Evaluation);

        setSupplierBesi(data.SupplierBesi);
        setSupplierKayu(data.SupplierKayu);
        setSupplierJok(data.SupplierJok);
        setSupplierRotan(data.SupplierRotan);
        setSupplierMarmer(data.SupplierMarmer);
        setSupplierKaca(data.SupplierKaca);
        setSupplierKain(data.SupplierKain);
        setSupplierFiber(data.SupplierFiber);
        setSupplierStainless(data.SupplierStainless);
        setSupplierVeneer(data.SupplierVeneer);
        setSupplierFinishing(data.SupplierFinishing);
        setSupplierHardware(data.SupplierHardware);
        setSupplierBarangJadi(data.SupplierBarangJadi);
        setSupplierPengiriman(data.SupplierPengiriman);
        setSupplierTestimoni(data.SupplierTestimoni);

        if (categorySearch) {
          setCategory(categorySearch);

          // KONDISI 1: idSearch tidak dicantumkan (redirect dari todo spk)
          if (!idSearch) return;

          let attempt = 0;
          const maxAttempt = 10; // 10 detik
          const interval = 1000; // 1 detik

          const checker = setInterval(() => {
            attempt++;

            const targetElement = document.getElementById(idSearch);

            // KETEMU
            if (targetElement) {
              targetElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });

              clearInterval(checker);
              window.history.replaceState({}, "", `/project/${slug}`);
              return;
            }

            // GAGAL setelah 10 detik
            if (attempt >= maxAttempt) {
              clearInterval(checker);

              setShowToast2(true);
              setTimeout(() => setShowToast2(false), 3000);

              window.history.replaceState({}, "", `/project/${slug}`);
            }
          }, interval);
        }


      } catch (err) {
        console.error('Error:', err.message);
      }
    };

    fetchData();
    commentsData();

    const storedCategory = localStorage.getItem('searchSupplierCategoryLocalStorage');
    if (storedCategory) {
      setCategory(storedCategory);
    }
  }, [slug]);


  useEffect(() => {
    const categoryData = async () => {
      if (category != '') {
        setSupplier(dataProjectFromDB[0][`Supplier${category}`]);
        setOrderDate(dataProjectFromDB[0][`OrderDate${category}`]);
        setDeadline(dataProjectFromDB[0][`DeadlineSupplier${category}`]);
        setDescription(dataProjectFromDB[0][`Description${category}`]);

        const spkIdFromProject = dataProjectFromDB[0][`SPK${category}`];
        setSelectedSPKId(spkIdFromProject);

        // 🔍 Cari SPK code dari dataSPKFromDB berdasarkan ID
        if (spkIdFromProject) {
          const foundSPK = dataSPKFromDB.find(item => item.id === spkIdFromProject);

          if (foundSPK) {
            setSelectedSPKCode(foundSPK.code);
          } else {
            setSelectedSPKCode(''); // kalau tidak ketemu
          }
        } else {
          setSelectedSPKCode(''); // kalau SPKcategory tidak ada datanya
        }
        const todosFromDB = dataProjectFromDB[0][`Todo${category}`];

        const todos = Array.isArray(todosFromDB)
          ? todosFromDB.map(t => ({
            text: typeof t === "string" ? t : t.text || "",
            done: typeof t === "object" ? !!t.done : false,
          }))
          : [{ text: "", done: false }];

        setTodo(todos);
        setCategoryStatus(dataProjectFromDB[0][`CategoryStatus${category}`]);
      }
    };
    categoryData();
  }, [category, dataProjectFromDB]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch(`${baseUrl}/users/all/get`);
        if (!res.ok) throw new Error('Gagal mengambil data user');

        const data = await res.json();
        setDataUserFromDB(data);
        // console.log(data);
      } catch (err) {
        console.error('Error saat mengambil data user:', err.message);
      }
    };

    fetchUserData();
  }, []);


  useEffect(() => {
    const timer = setTimeout(() => {
      // Menghapus kelas newComment setelah 2 detik
      // Disarankan untuk memastikan elemen tersebut masih ada di dalam DOM
      // Sebelum mencoba menghapus kelas tersebut
      const element = document.querySelector(`.deskripsiPekerjaan.newComment`);
      if (element) {
        element.classList.remove('newComment');
      }
      setNewCommentClass('');
      setNewReplyClass('');
    }, 2000);

    // Membersihkan timer saat komponen tidak lagi dirender
    return () => clearTimeout(timer);
  }, [category, slug, dataCommentsFromDB]);

  const ALUR_KERJA_AUTHORIZED_UIDS = [
    'w4M5JJjgGQeHFbS2nkyoCfUBE532',
    'fYpdHwXRDLhj5XGxM5FZIAvxp9E2', // Alfen
    '4WGPaHicKWYr0Ny84IUh8xb9Bo62', // P. Dhe
    '6D4XVa5BSSOl1ugUlkDlTea2COX2', // Azwad
  ];

  // Harga SPK per kategori hanya tampil untuk user & kategori tertentu
  const SPK_PRICE_AUTHORIZED_UIDS = [
    'fYpdHwXRDLhj5XGxM5FZIAvxp9E2', // Alfen
    '4WGPaHicKWYr0Ny84IUh8xb9Bo62', // P. Dhe
  ];
  const SPK_PRICE_CATEGORIES = ['Kayu', 'Besi', 'Marmer'];

  // Nilai biaya kategori (mirror logic Invoice: SPK<cat> total || estimasi<cat>).
  // Jika ada nilai SPK → biaya asli (label "SPK"); jika belum → biaya sementara (label "budget").
  const spkCategoryTotal = spkProductList
    .filter((s) => s.category === category)
    .reduce((sum, s) => sum + (Number(s.harga) || 0), 0);
  const estimasiCategory = Number(dataProjectFromDB[0]?.[`estimasi${category}`] || 0);
  const usingSpkValue = spkCategoryTotal > 0;
  const categoryCostValue = usingSpkValue ? spkCategoryTotal : estimasiCategory;
  const categoryCostLabel = usingSpkValue ? 'SPK' : 'budget';
  const showSpkPrice =
    SPK_PRICE_AUTHORIZED_UIDS.includes(user?.uid) &&
    SPK_PRICE_CATEGORIES.includes(category);

  const handlePrintSPK = () => {
    const project = dataProjectFromDB[0];
    if (!project) return;
    const imgs = [];
    for (let i = 1; i <= 50; i++) {
      const val = project[`image${category}${i}`];
      if (val && !val.includes('.pdf')) imgs.push(val);
    }
    setSpkImages(imgs);
    setShowSPKImagePicker(true);
  };

  const handleConfirmPrintSPK = ({ coverImage, pages }) => {
    const project = dataProjectFromDB[0];
    const spkData = {
      project,
      category,
      spkCode: selectedSPKCode || '-',
      coverImage,
      pages,
      printDate: new Date().toISOString(),
    };
    setShowSPKImagePicker(false);
    sessionStorage.setItem('cetakSPK', JSON.stringify(spkData));
    window.open('/cetakSPK', '_blank');
  };

  const handleAlurKerjaClick = (fieldName, label, currentVal) => {
    if (!ALUR_KERJA_AUTHORIZED_UIDS.includes(user?.uid)) return;
    setAlurKerjaField(fieldName);
    setAlurKerjaLabel(label);
    setAlurKerjaCurrentVal(currentVal ?? null);
    setAlurKerjaStep('choose');
    setAlurKerjaKeterangan('');
    setAlurKerjaModalOpen(true);
  };

  const handleAlurKerjaSubmit = async (state, keterangan) => {
    const displayName = user?.displayName || 'User';
    const apiState = state === 'reset' ? null : state;
    const commentText = state === 'ok'
      ? `${displayName} sudah cek ${category} — ${alurKerjaLabel} dan sudah ok${keterangan ? `. Keterangan: ${keterangan}` : ''}`
      : state === 'reset'
        ? `${displayName} mereset status ${alurKerjaLabel} (${category}) kembali ke belum dicek`
        : `${displayName} sudah cek ${category} — ${alurKerjaLabel} dan perlu servis / cek lebih lanjut. Keterangan: ${keterangan}`;

    try {
      await fetch(`${baseUrl}/projects/alurkerja`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, fieldName: alurKerjaField, state: apiState, category }),
      });

      const formData = new FormData();
      formData.append('user', user.uid);
      formData.append('idProduct', slug);
      formData.append('category', category);
      formData.append('text', commentText);
      await fetch(`${baseUrl}/comments/create`, { method: 'POST', body: formData });

      setAlurKerjaModalOpen(false);
      refreshData();
    } catch (error) {
      console.error('Error simpan alur kerja:', error);
    }
  };

  const renderAlurItem = (fieldName, label) => {
    const val = dataProjectFromDB[0]?.[fieldName];
    const isOk = val === 'ok';
    const isServis = val === 'servis';
    const isAuthorized = ALUR_KERJA_AUTHORIZED_UIDS.includes(user?.uid);
    const textColor = isOk ? '#28a745' : isServis ? '#ffc107' : (globalTheme === 'light' ? '#333' : '#ccc');
    return (
      <div
        key={fieldName}
        style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', cursor: isAuthorized ? 'pointer' : 'default' }}
        onClick={() => isAuthorized && handleAlurKerjaClick(fieldName, label, val)}
        className="no-active"
      >
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '16px', height: '16px', borderRadius: '3px', marginRight: '6px', flexShrink: 0,
          backgroundColor: isOk ? '#28a745' : isServis ? '#ffc107' : 'transparent',
          border: `2px solid ${isOk ? '#28a745' : isServis ? '#ffc107' : '#888'}`,
          color: 'white', fontSize: '10px', fontWeight: 'bold',
        }}>
          {isOk ? '✓' : isServis ? '!' : ''}
        </span>
        <small style={{ color: textColor }}>{label}</small>
      </div>
    );
  };

  const handleChangeCheckbox = async (value, name) => {
    try {
      const res = await fetch(`${baseUrl}/projects/checkbox`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          name,
          value,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        console.error('Gagal update checkbox:', result.message);
        return;
      }

      refreshData();
    } catch (error) {
      console.error('Error updating checkbox:', error);
    }
  };



  // sementara aja buat pindah ke invoice
  const [searchInvoice, setSearchInvoice] = useState('');
  const [filteredInvoiceData, setFilteredInvoiceData] = useState([]);

  const [dataInvoiceFromDB, setDataInvoiceFromDB] = useState([]);
  const [idInvoice, setIdInvoice] = useState('');

  useEffect(() => {
    const getDataInvoice = async () => {
      try {
        const res = await fetch(`${baseUrl}/invoice/get`);
        const data = await res.json();

        if (!res.ok) {
          console.error('Gagal mengambil data invoice:', data.message);
          return;
        }

        setDataInvoiceFromDB(data);
        console.log('dataInvoiceFromDB');
        console.log(data);
      } catch (error) {
        console.error('Terjadi kesalahan saat mengambil data invoice:', error);
      }
    };

    getDataInvoice();
  }, []);


  useEffect(() => {
    setFilteredInvoiceData(
      dataInvoiceFromDB.filter((item) =>
        (item.kodeInvoice && item.kodeInvoice.toLowerCase().includes(searchInvoice.toLowerCase())) ||
        (item.customer && item.customer.toLowerCase().includes(searchInvoice.toLowerCase()))
      )
    );
  }, [searchInvoice, dataInvoiceFromDB]);

  function pasteImage(modal) {
    console.log("Trying to paste to:", modal);
    const input = document.querySelector(`input[data-id="${modal}"]`);
    console.log("Found input:", input);
    if (!input) {
      alert(`Input tidak ditemukan: ${modal}`);
      return;
    }

    navigator.clipboard.read().catch(err => {
      alert('Gagal akses clipboard. Pastikan:\n1. Izin clipboard sudah diaktifkan di browser\n2. Aplikasi diakses via HTTPS\n\nError: ' + err.message);
    }).then(clipboardItems => {
      if (!clipboardItems) return;
      console.log('clipboardItems:', clipboardItems);
      clipboardItems.forEach(item => {
        const imageType = item.types.includes('image/png')
          ? 'image/png'
          : item.types.includes('image/jpeg')
            ? 'image/jpeg'
            : item.types.includes('image/webp')
              ? 'image/webp'
              : '';

        if (imageType) {
          item.getType(imageType).then(blob => {
            const extension = imageType.split('/')[1];
            const file = new File([blob], `pasted-image.${extension}`, { type: imageType });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);

            let inputElement = document.querySelector(`input[data-id="${modal}"]`);

            if (modal.startsWith("editImageCategory")) {
              // Tangani editImageCategory1 sampai 50
              const index = parseInt(modal.replace("editImageCategory", ""));
              if (!isNaN(index)) {
                setFileToUploadCategoryEdit(prev => ({
                  ...prev,
                  [index]: new File([blob], `pasted-image${index}.${extension}`, { type: imageType })
                }));
              }
            } else if (modal.startsWith("editImageRender")) {
              // Tangani editImageRender1 sampai 50
              const index = parseInt(modal.replace("editImageRender", ""));
              if (!isNaN(index)) {
                setFileToUploadRenderEdit(prev => ({
                  ...prev,
                  [index]: new File([blob], `pasted-image${index}.${extension}`, { type: imageType })
                }));
              }
            } else if (modal.startsWith("editImage")) {
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




  const handleSubmitEvaluation = async () => {
    setShowEvaluationEditModal(false);
    setShowEvaluationModal(true);

    try {
      const res = await fetch(`${baseUrl}/projects/evaluation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idProject: slug,
          evaluation: evaluation,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        console.error('Gagal menyimpan evaluation:', result.message);
        return;
      }

      await refreshData(); // Refresh data lokal setelah update
    } catch (error) {
      console.error('Error submitting evaluation:', error);
    }
  };


  const pdfLogoImg = 'https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3'

  useEffect(() => {
    const getStorageData = async () => {
      try {
        const res = await fetch(`${baseUrl}/storage/get`);
        const dataStorageFromDB = await res.json();

        if (!res.ok) {
          console.error('Gagal mengambil data storage:', dataStorageFromDB.message);
          return;
        }

        setDataStorageFromDB(dataStorageFromDB); // Set data storage ke state
      } catch (error) {
        console.error('Error fetching storage data:', error);
      }
    };

    getStorageData();
  }, []);


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

  const [isElementVisibleCategory, setIsElementVisibleCategory] = useState(false);
  const targetElementRefCategory = useRef(null); // Referensi ke elemen yang diinginkan

  useEffect(() => {
    const handleScroll = () => {
      if (targetElementRefCategory.current) {
        const rect = targetElementRefCategory.current.getBoundingClientRect();
        const vh = window.innerHeight;

        // Cek apakah elemen telah terlihat + 20vh
        const isVisible = rect.top >= 0 && rect.top <= (vh * 0.2);
        setIsElementVisibleCategory(isVisible);
      }
    };

    const element = scrollableElementRef.current;

    if (element) {
      element.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (element) {
        element.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const [isElementVisibleComment, setIsElementVisibleComment] = useState(false);
  const targetElementRefComment = useRef(null); // Referensi ke elemen yang diinginkan

  useEffect(() => {
    const handleScroll = () => {
      if (targetElementRefComment.current) {
        const rect = targetElementRefComment.current.getBoundingClientRect();
        const vh = window.innerHeight;

        // Cek apakah elemen telah terlihat + 20vh
        const isVisible = rect.top >= 0 && rect.top <= (vh * 0.2);
        setIsElementVisibleComment(isVisible);
      }
    };

    const element = scrollableElementRef.current;

    if (element) {
      element.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (element) {
        element.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const { globalTheme } = useTheme();




  const HighlightMentions = ({ text }) => {
    const mentionNames = ["@Alfen", "@Azwad", "@Lina", "@Mad", "@P. Dhe", "@Rakev", "@Resti", "@Udin", "@Xena"];
    const regex = new RegExp(`(${mentionNames.join("|")})`, "g");

    // Ganti teks mention dengan span berwarna biru
    const processedText = text.replace(regex, (match) => `<span style="color: blue;">${match}</span>`);

    return (
      <p
        className="mt-2"
        style={{
          whiteSpace: "pre-line",
          color: globalTheme === "light" ? "black" : "white",
        }}
        dangerouslySetInnerHTML={{ __html: processedText }} // Render HTML
      />
    );
  };

  const getFullUrl = (url, baseUrl) => {
    if (!url) return '';
    return url.startsWith('http://') || url.startsWith('https://') ? url : `${baseUrl}${url}`;
  };

  const renderFileLink = (url, baseUrl) => {
    const finalUrl = getFullUrl(url, baseUrl);

    if (url.toLowerCase().includes('.pdf')) {
      return (
        <a
          href={finalUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => { e.stopPropagation(); }}
        >
          <img
            src="https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3"
            style={{ height: "11vh" }}
            alt="PDF Logo"
          />
        </a>
      );
    } else {
      return (
        <span style={{ marginRight: "1vh" }} onClick={(e) => { e.stopPropagation(); }}>
          <Image
            width="auto"
            height="11vh"
            style={{ borderRadius: "10px" }}
            src={getImageUrl(url)}
          />
        </span>
      );
    }
  };





  const fetchSPK = async () => {
    try {
      const res = await fetch(`${baseUrl}/spk/get`);
      if (!res.ok) throw new Error(`Gagal ambil data SPK, status: ${res.status}`);

      const data = await res.json();
      setDataSPKFromDB(data);
    } catch (err) {
      console.error("Error fetching SPK:", err);
    }
  };


  useEffect(() => {
    fetchSPK();
  }, []);

  const [searchSPK, setSearchSPK] = useState('');

  // useEffect(() => {
  //   console.log(searchSPK);
  // }, [searchSPK]);


  const handleCreateSPK = async ({ searchSPK, supplier, orderDate }) => {
    if (!searchSPK) {
      alert("SPK Code wajib diisi!");
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/spk/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pengrajin: supplier || '',
          tanggalCetak: orderDate || '',
          code: searchSPK,
          status: 'Draft', // bisa diubah sesuai kebutuhan
        }),
      });

      const data = await response.json();

      if (response.ok) {
        //  ambil ID dari API dan simpan
        if (data.insertedId) {
          console.log("New SPK ID:", data.insertedId);
          setSelectedSPKId(data.insertedId);
        }

        // optional: reset state
        setSearchSPK('');
        setSelectedSPKCode(searchSPK);
        fetchSPK();
      } else {
        alert(`Gagal membuat SPK: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat membuat SPK');
    }
  };



  return (
    <Col className="lowonganPekerjaan overflow-auto" ref={scrollableElementRef} style={isMobile ? { paddingBottom: 110 } : undefined}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", ...(isMobile ? { top: 0 } : { top: 0 }), zIndex: 1, padding: "10px 15px 0px 15px", marginBottom: "10px", color: globalTheme == "light" ? "#000000" : "#ffffff", backgroundColor: isScrolled ? (globalTheme === "light" ? "#f3f3f3" : "#151515") : "transparent", borderRadius: "30px", border: isScrolled ? (globalTheme === "light" ? "1px solid #5f5f5f" : "1px solid white") : "1px solid transparent", transition: "background-color 1s ease, border 1s ease", }}>
        <h4>Information</h4>
        <IoNewspaperOutline className='button-effect' size={20} style={{ marginTop: "-7px" }} onClick={() => setShowEvaluationModal(true)} />
      </div>

      <div className="deskripsiPekerjaan p-3 position-relative shadow" style={{ backgroundImage: globalTheme === "light" ? "linear-gradient(to right, #ffffff, #e7e7e7)" : "linear-gradient(to right, #151515, #303030)", border: globalTheme === "light" ? "2px solid rgb(163, 163, 163)" : "2px solid #7a7a7a" }} onClick={handleShowInformationModal}>
        <div className='hover-effect'>
          <div>
            <h5 className="fw-bold" style={{ color: globalTheme == "light" ? "black" : "white" }}>{dataProjectFromDB.length > 0 ? dataProjectFromDB[0].NamaBarang : ''}</h5>
            <h6 style={{ color: globalTheme == "light" ? "black" : "white" }}>{dataProjectFromDB.length > 0 ? dataProjectFromDB[0].Buyer : ''}</h6>
            {canSeeTelepon && (
              <small style={{ color: globalTheme == "light" ? "black" : "white" }}>
                <MdOutlineLocationOn /> {dataProjectFromDB.length > 0 ? dataProjectFromDB[0].Lokasi : ''}
              </small>
            )}
            <br />
            <small style={{ color: globalTheme == "light" ? "black" : "white" }}>
              <MdAccessTime /> Deadline : {dataProjectFromDB.length > 0 ? new Date(dataProjectFromDB[0].Deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            </small>
            {dataProjectFromDB[0]?.TargetKirim && (
              <><br /><small style={{ color: '#e67e22', fontWeight: 600 }}>
                🚚 Target Kirim : {new Date(dataProjectFromDB[0].TargetKirim).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                {(() => {
                  const d = new Date(dataProjectFromDB[0].Deadline);
                  const t = new Date(dataProjectFromDB[0].TargetKirim);
                  const diff = Math.ceil((t - d) / (1000 * 60 * 60 * 24));
                  if (diff > 0) return <span style={{ color: '#e74c3c', marginLeft: 6 }}>({diff} hari terlambat)</span>;
                  if (diff < 0) return <span style={{ color: '#27ae60', marginLeft: 6 }}>({Math.abs(diff)} hari lebih awal)</span>;
                  return null;
                })()}
              </small></>
            )}
            <h6 className='mt-4' style={{ color: globalTheme == "light" ? "black" : "white" }}>Gambar Produk</h6>
          </div>



          <div className="me-3 no-active" onClick={(e) => { e.stopPropagation(); if (user.uid === "rYN2eFpFqVU5jSYRrwyioAi33xD3" || user.uid === "qd2gyCyknDVZYUfA6IkiQv3jGTI3") { console.log('anda tidak punya izin'); } else { setShowImageEdit(true); refreshImageEditInput(); } }}>
            {dataProjectFromDB.length > 0 ? (() => {
              const images = [];

              for (let i = 1; i <= 50; i++) {
                const key = `image${i}`;
                const imageUrl = dataProjectFromDB[0][key];
                if (!imageUrl) continue;

                const isPDF = imageUrl.includes('.pdf');
                const isFirebasePDF = isPDF && imageUrl.includes('firebasestorage.googleapis.com');
                const pdfLink = isFirebasePDF ? imageUrl : `${baseUrl}${imageUrl}`;

                const isGLB = imageUrl.includes('.glb');

                const content = isPDF ? (
                  <a
                    key={key}
                    href={pdfLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => { e.stopPropagation(); }}
                  >
                    <img
                      src="https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3"
                      style={{ height: "11vh", marginRight: "1vh" }}
                      alt="PDF Logo"
                    />
                  </a>
                ) : isGLB ? (
                  <a
                    key={key}
                    href={`https://product.karyalogamfurniture.com/glbviewer?model=${encodeURIComponent(imageUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img
                      src={glbLogoImg}
                      style={{ height: "11vh", marginRight: "1vh" }}
                      alt="GLB Logo"
                    />
                  </a>
                ) : (
                  <span
                    key={key}
                    style={{ marginRight: "1vh" }}
                    onClick={(e) => { e.stopPropagation(); }}
                  >
                    <Image
                      width={'auto'}
                      height={'11vh'}
                      style={{ borderRadius: "10px" }}
                      src={getImageUrl(imageUrl)}
                      alt={`image-${i}`}
                    />
                  </span>
                );

                images.push(content);
              }

              return images.length > 0 ? images : (
                <img
                  src={noImageAvailable}
                  alt="No Image Available"
                  style={{ height: "11vh", borderRadius: "10px" }}
                />
              );
            })() : null}


          </div>

          {slug && dataProjectFromDB.length > 0 && (
            <ConsistencyCheck projectId={slug} itemName={dataProjectFromDB[0]?.NamaBarang} />
          )}

          <div onClick={handleShowInformationModal}>
            <div className='mt-4 d-flex align-items-center' style={{ gap: '8px' }}>
              <h6 className='mb-0' style={{ color: globalTheme == "light" ? "black" : "white" }}>Deskripsi Produk</h6>
              <span
                onClick={(e) => { e.stopPropagation(); openHistory(dataProjectFromDB[0]?.SpesifikasiHistory, 'Riwayat Deskripsi Produk'); }}
                title="Lihat riwayat perubahan"
                style={{ cursor: 'pointer', fontSize: '11px', padding: '1px 8px', borderRadius: '12px', border: `1px solid ${globalTheme == "light" ? "#ced4da" : "#6c757d"}`, color: globalTheme == "light" ? "#495057" : "#dee2e6", whiteSpace: 'nowrap' }}
              >
                🕘 Riwayat ({dataProjectFromDB[0]?.SpesifikasiHistory?.length || 0})
              </span>
            </div>
            <p style={{ whiteSpace: 'pre-line', color: globalTheme == "light" ? "black" : "white" }}>{dataProjectFromDB.length > 0 ? dataProjectFromDB[0].Spesifikasi : ''}</p>
            <small style={{ color: globalTheme == "light" ? "black" : "white" }}>
              <HiTemplate /> Quantity : {dataProjectFromDB.length > 0 ? dataProjectFromDB[0].Qty : ''}
            </small>

            <small style={{ color: globalTheme == "light" ? "black" : "white" }} className="position-absolute top-0 end-0 p-3">{dataProjectFromDB.length > 0 ? new Date(dataProjectFromDB[0].Date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</small>
            <Progress className="position-absolute top-0 end-0 p-3" trailColor='#e9e9e9' size={50} style={{ marginTop: "30px" }} type="circle" percent={dataProjectFromDB.length > 0 ? dataProjectFromDB[0].Percentage : ''} format={percent => <span style={{ color: globalTheme == "light" ? "black" : "white" }}>{percent}%</span>} />
          </div>

        </div>
      </div>


      {/* SPKPrecheckModal sengaja dirender DI LUAR card deskripsiPekerjaan (yang punya
          onClick=handleShowInformationModal). React-Bootstrap Modal pakai portal, tapi
          event sintetis React tetap merambat lewat React tree — kalau modal ini anak dari
          card ber-onClick, tiap klik di dalam modal (pilih verdict / Kirim jawaban) ikut
          memicu handleShowInformationModal → modal Information muncul terus. */}
      <SPKPrecheckModal
        show={showSpkPrecheck}
        projectId={slug}
        category={category}
        onClose={() => setShowSpkPrecheck(false)}
        onProceed={() => { setShowSpkPrecheck(false); handlePrintSPK(); }}
      />

      {/* Modal */}
      <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showInformationModal} onHide={handleCloseInformationModal}>
        <Modal.Header closeButton>
          <Modal.Title>Information</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Your comment form here */}


          <label className='mt-2 fw-semibold'>Product Name :</label>
          <input className="form-control" type='text' value={productNameInformation} onChange={(e) => setProductNameInformation(e.target.value)} required></input>
          <label className='mt-3 fw-semibold'>Buyer :</label>
          <input className="form-control" type='text' value={buyerNameInformation} onChange={(e) => setBuyerNameInformation(e.target.value)} required></input>
          <label className='mt-3 fw-semibold'>Location :</label>
          <input className="form-control" type='text' value={buyerLocationInformation} onChange={(e) => setBuyerLocationInformation(e.target.value)} required></input>
          <label className='mt-3 fw-semibold'>Order Date :</label>
          <input className="form-control" type='date' value={orderDateInformation} onChange={(e) => setOrderDateInformation(e.target.value)} required></input>
          <label className='mt-3 fw-semibold'>Deadline :</label>
          <input className="form-control" type='date' value={deadlineInformation} onChange={(e) => setDeadlineInformation(e.target.value)} required></input>
          <label className='mt-3 fw-semibold'>Target Kirim :</label>
          <small style={{ color: '#888', display: 'block', marginBottom: 4 }}>Tanggal pengiriman yang direncanakan (untuk tracking)</small>
          <input className="form-control" type='date' value={targetKirimInformation} onChange={(e) => setTargetKirimInformation(e.target.value)}></input>
          <label className='mt-3 fw-semibold'>Percentage :</label>
          <input className="form-control" type='number' value={percentageInformation} onChange={(e) => setPercentageInformation(e.target.value)} required></input>
          <label className='mt-3 fw-semibold'>Description :</label>
          <textarea className="form-control" type='text' rows="5" value={descriptionInformation} onChange={(e) => setDescriptionInformation(e.target.value)} required></textarea>
          <label className='mt-3 fw-semibold'>Ukuran :</label>
          <input className="form-control" type='text' value={ukuranQC} onChange={(e) => setUkuranQC(e.target.value)} required></input>
          <label className='mt-3 fw-semibold'>Finishing :</label>
          <input className="form-control" type='text' value={finishingQC} onChange={(e) => setFinishingQC(e.target.value)} required></input>
          <label className='mt-3 fw-semibold'>Jenis Marmer :</label>
          <input className="form-control" type='text' value={jenisMarmerQC} onChange={(e) => setJenisMarmerQC(e.target.value)} required></input>
          <label className='mt-3 fw-semibold'>Jenis Kain :</label>
          <input className="form-control" type='text' value={jenisKainQC} onChange={(e) => setJenisKainQC(e.target.value)} required></input>
          <label className='mt-3 fw-semibold'>Status :</label>
          <select className="form-control" value={statusInformation} onChange={(e) => setStatusInformation(e.target.value)} required>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
          </select>



          <label className='mt-3 fw-semibold'>Catalog :</label>
          <Select
            showSearch
            placeholder="Select Folder"
            style={{ width: '100%' }}
            onChange={(value) => setStorageFolder(value)}
            value={storageFolder || undefined}
            optionFilterProp="label"
            options={
              dataStorageFromDB?.length
                ? dataStorageFromDB.map(item => ({
                  value: item.id,
                  label: item.name,
                }))
                : []
            }
            dropdownStyle={{ zIndex: 9999 }} // <— ini buat pastiin dropdown-nya di atas
            getPopupContainer={() => document.body} // <— ini bantu juga kalau dropdown ketutupan
          />


        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleSubmitInformation}>Submit</Button>
        </Modal.Footer>
      </Modal>
      {/* End Modal */}


      <h4
        className="mt-4"
        ref={targetElementRefCategory}
        onClick={handleShowCategoryModal}
        style={{
          position: "sticky",
          cursor: "pointer",
          top: isMobile ? 1 : 3,
          color: globalTheme == "light" ? "#000000" : "#ffffff",
          zIndex: 1,
          padding: "7px",
          margin: "0 10px 20px 10px",
          backgroundColor: isElementVisibleCategory ? (globalTheme === "light" ? "#f3f3f3" : "#151515") : "transparent", // Background berubah saat sticky
          borderRadius: "30px",
          border: "1px solid transparent",
          transition: "background-color 0.3s ease", // Animasi perubahan warna
        }}
      >
        Category ({category ? category.split(/(?=[A-Z])/).join(" ") : "Select Category"})
      </h4>
      {/* Modal */}
      <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showCategoryModal} onHide={handleCloseCategoryModal}>
        <Modal.Header closeButton>
          <Modal.Title>Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Your comment form here */}




          {["Stainless", "Besi", "Kayu", "Jok", "Rotan", "Marmer", "Kaca", "Kain", "Fiber", "Veneer", "Finishing", "Hardware", "BarangJadi", "Pengiriman", "Testimoni"].map((category) => {
            const supplier = eval(`supplier${category}`);
            const status = dataProjectFromDB[0]?.[`CategoryStatus${category}`];
            const azwad = dataProjectFromDB[0]?.[`${category}Azwad`];
            const pakde = dataProjectFromDB[0]?.[`${category}Pakde`];

            const getStatusBadge = () => {
              switch (status) {
                case "Belum Proses":
                  return <div className='text-center text-light' style={{ backgroundColor: "rgba(255, 0, 0, 0.6)", width: "150px", height: "20px", borderRadius: "20px" }}>Belum Proses</div>;
                case "Proses":
                  return <div className="text-center text-dark" style={{ backgroundColor: "rgba(255, 255, 0, 0.6)", width: "100px", height: "20px", borderRadius: "20px" }}>Proses</div>;
                case "QC Pass":
                  return (
                    <>
                      <div className='text-center text-light' style={{ backgroundColor: "rgba(0, 255, 0, 0.6)", width: "100px", height: "20px", borderRadius: "20px", marginRight: "5px" }}>Selesai</div>
                      <div className='text-center text-light' style={{ backgroundColor: "rgba(0, 0, 255, 0.6)", width: "100px", height: "20px", borderRadius: "20px" }}>QC Pass</div>
                    </>
                  );
                case "Servis":
                  return <div className="text-center text-light" style={{ backgroundColor: "rgba(255, 165, 0, 0.6)", width: "100px", height: "20px", borderRadius: "20px" }}>Servis</div>;
                case "Selesai":
                  return <div className='text-center text-light' style={{ backgroundColor: "rgba(0, 255, 0, 0.6)", width: "100px", height: "20px", borderRadius: "20px" }}>Selesai</div>;
                case "Ready Stock":
                  return <div className="text-center text-light" style={{ backgroundColor: "rgba(128, 128, 128, 0.6)", width: "150px", height: "20px", borderRadius: "20px" }}>Ready Stock</div>;
                default:
                  return null;
              }
            };

            // Warna latar dropdown status inline (desktop/tablet), selaras dengan getStatusBadge().
            const statusSelectColors = {
              "": { bg: "#e9ecef", fg: "#000" },
              "Belum Proses": { bg: "rgba(255, 0, 0, 0.6)", fg: "#fff" },
              "Proses": { bg: "rgba(255, 255, 0, 0.6)", fg: "#000" },
              "QC Pass": { bg: "rgba(0, 0, 255, 0.6)", fg: "#fff" },
              "Servis": { bg: "rgba(255, 165, 0, 0.6)", fg: "#fff" },
              "Selesai": { bg: "rgba(0, 255, 0, 0.6)", fg: "#fff" },
              "Ready Stock": { bg: "rgba(128, 128, 128, 0.6)", fg: "#fff" },
            };
            const selectColor = statusSelectColors[status || ""] || statusSelectColors[""];

            const getWorkerBadge = () => {
              if (azwad) return <div className="text-center text-light" style={{ backgroundColor: "green", width: "20px", height: "20px", borderRadius: "20px" }}>II</div>;
              if (pakde) return <div className="text-center text-light" style={{ backgroundColor: "blue", width: "20px", height: "20px", borderRadius: "20px" }}>I</div>;
              return null;
            };

            return (
              <div
                key={category}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px',
                  borderRadius: '10px',
                  marginBottom: '10px',
                  backgroundColor: globalTheme === 'light' ? '#f8f9fa' : '#212529'
                }}
              >
                {/* Bagian list yang bisa diklik */}
                <span
                  style={{ marginRight: '15px', cursor: 'pointer', flex: 1 }}
                  onClick={() => handleCategoryChange(category)}
                >
                  {supplier !== undefined ? <span>&#9679;</span> : <span>&#9675;</span>} {category}
                </span>

                {/* Bagian status, worker badge, dan checkbox */}
                <div className="d-flex align-items-center gap-2">
                  {dataProjectFromDB.length > 0 && (
                    <>
                      {isMobile ? (
                        getStatusBadge()
                      ) : (
                        <select
                          value={status || ""}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleQuickStatusChange(category, e.target.value || null)}
                          title="Ubah status cepat"
                          style={{
                            backgroundColor: selectColor.bg,
                            color: selectColor.fg,
                            border: "none",
                            borderRadius: "20px",
                            padding: "2px 10px",
                            fontSize: "13px",
                            fontWeight: 500,
                            cursor: "pointer",
                            minWidth: "110px",
                          }}
                        >
                          <option value="">— Tidak ada —</option>
                          <option value="Belum Proses">Belum Proses</option>
                          <option value="Proses">Proses</option>
                          <option value="QC Pass">QC Pass</option>
                          <option value="Servis">Servis</option>
                          <option value="Selesai">Selesai</option>
                          <option value="Ready Stock">Ready Stock</option>
                        </select>
                      )}
                      {getWorkerBadge()}
                    </>
                  )}
                  {/* Checkbox diluar list, klik tidak memicu onClick list */}
                  <label
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'inline-block',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: '2px solid #2563EB',
                      backgroundColor: 'white', // background luar tetap putih
                      cursor: ["4WGPaHicKWYr0Ny84IUh8xb9Bo62", "w4M5JJjgGQeHFbS2nkyoCfUBE532"].includes(user.uid) ? 'pointer' : 'not-allowed',
                      position: 'relative',
                    }}
                  >
                    {/* Dot tengah untuk state aktif */}
                    {dataProjectFromDB[0]?.[`${category}Reminder`] && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: '#2563EB',
                        }}
                      />
                    )}

                    {/* Checkbox asli, transparan tapi tetap fungsional */}
                    <input
                      type="checkbox"
                      onClick={(e) => e.stopPropagation()}
                      checked={dataProjectFromDB[0]?.[`${category}Reminder`] === true}
                      disabled={
                        !["4WGPaHicKWYr0Ny84IUh8xb9Bo62", "w4M5JJjgGQeHFbS2nkyoCfUBE532"].includes(user.uid)
                      }
                      onChange={(e) =>
                        handleChangeCheckbox(!dataProjectFromDB[0]?.[`${category}Reminder`], `${category}Reminder`)
                      }
                      style={{
                        opacity: 0,
                        width: '100%',
                        height: '100%',
                        margin: 0,
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        cursor: 'inherit',
                      }}
                    />
                  </label>


                </div>
              </div>
            );
          })}



        </Modal.Body>
        <Modal.Footer>
          {/* <Button variant="primary" onClick={handleCloseCategoryModal}>Submit</Button> */}
        </Modal.Footer>
      </Modal>
      {/* End Modal */}



      <div id='divCategory' className="deskripsiPekerjaan p-3 position-relative shadow" style={{ backgroundImage: globalTheme === "light" ? "linear-gradient(to right, #ffffff, #e7e7e7)" : "linear-gradient(to right, #151515, #303030)", border: globalTheme === "light" ? "2px solid rgb(163, 163, 163)" : "2px solid #7a7a7a" }} onClick={handleShowEditCategoryModal}>
        <div className='hover-effect'>
          {/* Tambahkan teks "Draft" di bagian atas tengah */}
          <div style={{
            display: category == "" ? "none" : "",
            position: "absolute",
            top: isMobile ? "10px" : "15px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor:
              dataProjectFromDB[0]?.[`${category}Azwad`] ? "green" :
                dataProjectFromDB[0]?.[`${category}Pakde`] ? "blue" :
                  "rgba(251, 0, 0, 0.8)", // Default merah untuk Draft
            color: "white",
            padding: "3px 8px",
            borderRadius: "5px",
            fontSize: isMobile ? "12px" : "20px",
            fontWeight: "bold",
            // zIndex: 1
          }}>
            {dataProjectFromDB[0]?.[`${category}Azwad`] ? "Acc Admin" :
              dataProjectFromDB[0]?.[`${category}Pakde`] ? "Acc I" : "Draft"}
          </div>
          {dataProjectFromDB.length > 0 && (
            <h6 className="fw-semibold" style={{ color: globalTheme == "light" ? "black" : "white" }}>Supplier : {dataProjectFromDB[0][`Supplier${category}`] ? dataProjectFromDB[0][`Supplier${category}`] : '-'}</h6>
          )}
          {dataProjectFromDB.length > 0 && (
            <small style={{ color: globalTheme == "light" ? "black" : "white" }}>
              <IoCalendarNumberOutline /> Tanggal Order :  {dataProjectFromDB[0][`OrderDate${category}`] ? new Date(dataProjectFromDB[0][`OrderDate${category}`]).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</small>
          )}
          <br />
          {dataProjectFromDB.length > 0 && (
            <small style={{ color: globalTheme == "light" ? "black" : "white" }}>
              <MdAccessTime /> Deadline :  {dataProjectFromDB[0][`DeadlineSupplier${category}`] ? new Date(dataProjectFromDB[0][`DeadlineSupplier${category}`]).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</small>
          )}

          <h6 className='mt-4' style={{ color: globalTheme == "light" ? "black" : "white" }}>Gambar Spesifik</h6>
          <div style={{ display: category == "" ? "none" : "block" }} className="me-3 no-active" onClick={(e) => { e.stopPropagation(); if (user.uid === "rYN2eFpFqVU5jSYRrwyioAi33xD3" || user.uid === "qd2gyCyknDVZYUfA6IkiQv3jGTI3") { console.log('anda tidak punya izin'); } else { setShowImageCategoryEdit(true); refreshImageEditInput(); } }}>




            {dataProjectFromDB.length > 0 ? (() => {
              const images = [];

              for (let i = 1; i <= 50; i++) {
                const key = `image${category}${i}`;
                const imageUrl = dataProjectFromDB[0][key];
                if (!imageUrl) continue;

                const isPDF = imageUrl.includes('.pdf');
                const isFirebasePDF = isPDF && imageUrl.includes('firebasestorage.googleapis.com');

                const pdfLink = isFirebasePDF ? imageUrl : `${baseUrl}${imageUrl}`;

                const isGLB = imageUrl.includes('.glb');

                const content = isPDF ? (
                  <a
                    key={key}
                    href={pdfLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => { e.stopPropagation(); }}
                  >
                    <img
                      src="https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3"
                      style={{ height: "11vh", marginRight: "1vh" }}
                      alt="PDF Logo"
                    />
                  </a>
                ) : isGLB ? (
                  <a
                    key={key}
                    href={`https://product.karyalogamfurniture.com/glbviewer?model=${encodeURIComponent(imageUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img
                      src={glbLogoImg}
                      style={{ height: "11vh", marginRight: "1vh" }}
                      alt="GLB Logo"
                    />
                  </a>
                ) : (
                  <span
                    key={key}
                    style={{ marginRight: "1vh" }}
                    onClick={(e) => { e.stopPropagation(); }}
                  >
                    <Image
                      width={'auto'}
                      height={'11vh'}
                      style={{ borderRadius: "10px" }}
                      src={getImageUrl(imageUrl)}
                      alt={`image-${i}`}
                    />
                  </span>
                );

                images.push(content);
              }

              return images;
            })() : null}



            {/* {dataProjectFromDB.length > 0 && (
              Array.from({ length: 10 }, (_, i) => {
                const index = i + 1;
                const imageKey = `image${category}${index}`;
                const imageUrl = dataProjectFromDB[0][imageKey];

                return imageUrl ? (
                  <React.Fragment key={index}>
                    {renderFileLink(imageUrl, baseUrl)}
                  </React.Fragment>
                ) : null;
              })
            )} */}



            <img style={{ height: "11vh" }} src="https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fa-rectangle.png?alt=media&token=30748aa1-a831-4f62-9add-c88986428df1" />


          </div>

          {category === "BarangJadi" && (
            <>
              <h6 className='mt-4' style={{ color: globalTheme == "light" ? "black" : "white" }}>Gambar Render</h6>
              <div style={{ display: category == "" ? "none" : "block" }} className="me-3 no-active" onClick={(e) => { e.stopPropagation(); if (user.uid === "rYN2eFpFqVU5jSYRrwyioAi33xD3" || user.uid === "qd2gyCyknDVZYUfA6IkiQv3jGTI3") { console.log('anda tidak punya izin'); } else { setShowImageRenderEdit(true); refreshImageEditInput(); } }}>




                {dataProjectFromDB.length > 0 ? (() => {
                  const images = [];

                  for (let i = 1; i <= 50; i++) {
                    const key = `imageRender${i}`;
                    const imageUrl = dataProjectFromDB[0][key];
                    if (!imageUrl) continue;

                    const isPDF = imageUrl.includes('.pdf');
                    const isFirebasePDF = isPDF && imageUrl.includes('firebasestorage.googleapis.com');
                    const pdfLink = isFirebasePDF ? imageUrl : `${baseUrl}${imageUrl}`;



                    const content = isPDF ? (
                      <a
                        key={key}
                        href={pdfLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => { e.stopPropagation(); }}
                      >
                        <img
                          src="https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3"
                          style={{ height: "11vh", marginRight: "1vh" }}
                          alt="PDF Logo"
                        />
                      </a>
                    ) : isGLB ? (
                      <a
                        key={key}
                        href={`https://product.karyalogamfurniture.com/glbviewer?model=${encodeURIComponent(imageUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <img
                          src={glbLogoImg}
                          style={{ height: "11vh", marginRight: "1vh" }}
                          alt="GLB Logo"
                        />
                      </a>
                    ) : (
                      <span
                        key={key}
                        style={{ marginRight: "1vh" }}
                        onClick={(e) => { e.stopPropagation(); }}
                      >
                        <Image
                          width={'auto'}
                          height={'11vh'}
                          style={{ borderRadius: "10px" }}
                          src={getImageUrl(imageUrl)}
                          alt={`image-${i}`}
                        />
                      </span>
                    );

                    images.push(content);
                  }

                  return images.length > 0 ? images : (
                    <img
                      src={noImageAvailable}
                      alt="No Image Available"
                      style={{ height: "11vh", borderRadius: "10px" }}
                    />
                  );
                })() : null}


                {/* {dataProjectFromDB.length > 0 && (
              Array.from({ length: 10 }, (_, i) => {
                const index = i + 1;
                const imageKey = `image${category}${index}`;
                const imageUrl = dataProjectFromDB[0][imageKey];

                return imageUrl ? (
                  <React.Fragment key={index}>
                    {renderFileLink(imageUrl, baseUrl)}
                  </React.Fragment>
                ) : null;
              })
            )} */}



                <img style={{ height: "11vh" }} src="https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fa-rectangle.png?alt=media&token=30748aa1-a831-4f62-9add-c88986428df1" />


              </div>
            </>
          )}

          <div className='mt-4 d-flex align-items-center' style={{ gap: '8px' }}>
            <h6 className='mb-0' style={{ color: globalTheme == "light" ? "black" : "white" }}>Deskripsi Spesifik</h6>
            {category && (
              <span
                onClick={(e) => { e.stopPropagation(); openHistory(dataProjectFromDB[0]?.[`Description${category}History`], `Riwayat Deskripsi Spesifik (${category})`); }}
                title="Lihat riwayat perubahan"
                style={{ cursor: 'pointer', fontSize: '11px', padding: '1px 8px', borderRadius: '12px', border: `1px solid ${globalTheme == "light" ? "#ced4da" : "#6c757d"}`, color: globalTheme == "light" ? "#495057" : "#dee2e6", whiteSpace: 'nowrap' }}
              >
                🕘 Riwayat ({dataProjectFromDB[0]?.[`Description${category}History`]?.length || 0})
              </span>
            )}
          </div>
          {dataProjectFromDB.length > 0 ? (
            <div>
              <p className='mt-2'
                style={{
                  whiteSpace: 'pre-line', color: globalTheme == "light" ? "black" : "white", display:
                    dataProjectFromDB[0]?.[`${category}Pakde`] ||
                      dataProjectFromDB[0]?.Status === "Completed" ||
                      ["w4M5JJjgGQeHFbS2nkyoCfUBE532", "4WGPaHicKWYr0Ny84IUh8xb9Bo62", "fYpdHwXRDLhj5XGxM5FZIAvxp9E2"].includes(user.uid)
                      ? ""
                      : "none",
                }}>
                {dataProjectFromDB[0][`Description${category}`] ? dataProjectFromDB[0][`Description${category}`] : '-'}
              </p>

            </div>
          ) : ''}

          <h6 className='mt-4' style={{ color: globalTheme == "light" ? "black" : "white" }}>Konfirmasi</h6>

          <div style={{ display: category === "" ? "none" : "" }} className='no-active'>
            {/* Pakde */}
            <input
              type="checkbox"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => handleChangeCheckbox(e.target.checked, `${category}Pakde`)}
              checked={dataProjectFromDB[0]?.[`${category}Pakde`] === true}
              disabled={
                !["4WGPaHicKWYr0Ny84IUh8xb9Bo62", "w4M5JJjgGQeHFbS2nkyoCfUBE532"].includes(user.uid)
              } // Hanya bisa diubah oleh user tertentu
            />
            <small style={{ marginLeft: "5px", color: globalTheme == "light" ? "black" : "white" }}>
              Pakde
            </small>
            <br />

            {/* Azwad */}
            <input
              type="checkbox"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => handleChangeCheckbox(e.target.checked, `${category}Azwad`)}
              checked={dataProjectFromDB[0]?.[`${category}Azwad`] === true}
              disabled={
                !dataProjectFromDB[0]?.[`${category}Pakde`] || // Harus Pakde aktif dulu
                !["6D4XVa5BSSOl1ugUlkDlTea2COX2", "w4M5JJjgGQeHFbS2nkyoCfUBE532"].includes(user.uid)
              } // Hanya bisa diubah oleh user tertentu
            />
            <small style={{ marginLeft: "5px", color: globalTheme == "light" ? "black" : "white" }}>
              Azwad
            </small>
            <br />

          </div>



          {category === "Besi" && (
            <>
              <h6 className='mt-4' style={{ color: globalTheme == "light" ? "black" : "white" }}>Alur Kerja</h6>
              <div className='no-active'>
                {renderAlurItem('alurBesi1', 'Cek Dimensi')}
                {renderAlurItem('alurBesi2', 'Cek Kontruksi')}
                {renderAlurItem('alurBesi3', 'Cek Kerapian')}
                {renderAlurItem('alurBesi4', 'Cek flat')}
              </div>
            </>
          )}

          {category === "Kayu" && (
            <>
              <h6 className='mt-4' style={{ color: globalTheme == "light" ? "black" : "white" }}>Alur Kerja</h6>
              <div className='no-active'>
                {renderAlurItem('alurKayu1', 'Cek Dimensi')}
                {renderAlurItem('alurKayu2', 'Cek Kontruksi')}
                {renderAlurItem('alurKayu3', 'Cek Kerapian')}
                {renderAlurItem('alurKayu4', 'Cek flat')}
              </div>
            </>
          )}

          {category === "Jok" && (
            <>
              <h6 className='mt-4' style={{ color: globalTheme == "light" ? "black" : "white" }}>Alur Kerja</h6>
              <div className='no-active'>
                {renderAlurItem('alurJok1', 'Cek Kerapian')}
              </div>
            </>
          )}

          {category === "Marmer" && (
            <>
              <h6 className='mt-4' style={{ color: globalTheme == "light" ? "black" : "white" }}>Alur Kerja</h6>
              <div className='no-active'>
                {renderAlurItem('alurMarmer1', 'Cek Dimensi')}
                {renderAlurItem('alurMarmer2', 'Cek Kontruksi')}
                {renderAlurItem('alurMarmer3', 'Cek Kerapian')}
              </div>
            </>
          )}

          {category === "Finishing" && (
            <>
              <h6 className='mt-4' style={{ color: globalTheme == "light" ? "black" : "white" }}>Alur Kerja</h6>
              <div className='no-active'>
                {renderAlurItem('alurFinishing1', 'Cek Kerapian')}
                {renderAlurItem('alurFinishing2', 'Cek flat')}
              </div>
            </>
          )}

          <div onClick={handleShowToDoListModal}>
            <h6 className='mt-4' style={{ color: globalTheme === "light" ? "black" : "white" }}>
              To Do List
            </h6>

            {dataProjectFromDB.length > 0 ? (
              <div>
                {dataProjectFromDB[0][`Todo${category}`] && Array.isArray(dataProjectFromDB[0][`Todo${category}`]) ? (
                  <ul className="list-unstyled mt-2">
                    {dataProjectFromDB[0][`Todo${category}`].map((t, index) => (
                      <li key={index} className="d-flex align-items-center mb-1">
                        {/* Tanda checklist / bullet */}
                        <span
                          className="d-inline-flex justify-content-center align-items-center me-2"
                          style={{
                            width: '20px',
                            height: '20px',
                            flexShrink: 0,
                            color: t.done ? 'green' : 'black',
                            fontWeight: 'bold',
                          }}
                        >
                          {t.done ? '✔' : '•'}
                        </span>
                        {/* Teks To-Do */}
                        <span style={{ flex: 1 }}>{t.text}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className='mt-2' style={{ color: globalTheme === "light" ? "black" : "white" }}>-</p>
                )}
              </div>
            ) : null}
          </div>


          <div className="position-absolute top-0 end-0 p-3" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            {dataProjectFromDB.length > 0 && (
              <>
                {dataProjectFromDB[0][`CategoryStatus${category}`] === "Belum Proses" && (
                  <div className='text-center text-light' style={{ backgroundColor: "rgba(255, 0, 0, 0.6)", width: "150px", height: "20px", borderRadius: "20px" }}>Belum Proses</div>
                )}
                {dataProjectFromDB[0][`CategoryStatus${category}`] === "Proses" && (
                  <div className="text-center text-dark" style={{ backgroundColor: "rgba(255, 255, 0, 0.6)", width: "100px", height: "20px", borderRadius: "20px" }}>Proses</div>
                )}
                {dataProjectFromDB[0][`CategoryStatus${category}`] === "QC Pass" && (
                  <>
                    <div className='text-center text-light' style={{ backgroundColor: "rgba(0, 255, 0, 0.6)", width: "100px", height: "20px", borderRadius: "20px" }}>Selesai</div>
                    <div className='text-center text-light' style={{ backgroundColor: "rgba(0, 0, 255, 0.6)", width: "100px", height: "20px", borderRadius: "20px" }}>QC Pass</div>
                  </>
                )}
                {dataProjectFromDB[0][`CategoryStatus${category}`] === "Servis" && (
                  <div className="text-center text-light" style={{ backgroundColor: "rgba(255, 165, 0, 0.6)", width: "100px", height: "20px", borderRadius: "20px" }}>Servis</div>
                )}
                {dataProjectFromDB[0][`CategoryStatus${category}`] === "Selesai" && (
                  <div className='text-center text-light' style={{ backgroundColor: "rgba(0, 255, 0, 0.6)", width: "100px", height: "20px", borderRadius: "20px" }}>Selesai</div>
                )}
                {dataProjectFromDB[0][`CategoryStatus${category}`] === "Ready Stock" && (
                  <div className="text-center text-light" style={{ backgroundColor: "rgba(128, 128, 128, 0.6)", width: "150px", height: "20px", borderRadius: "20px" }}>Ready Stock</div>
                )}
              </>
            )}
            {category && dataProjectFromDB.length > 0 && (
              <button
                title="Buat SPK"
                onClick={(e) => { e.stopPropagation(); setShowSpkPrecheck(true); }}
                className="no-active"
                style={{
                  background: globalTheme === 'light' ? '#fff' : '#333',
                  border: '1.5px solid #888', borderRadius: '6px',
                  padding: '5px 12px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  color: globalTheme === 'light' ? '#333' : '#ddd',
                  fontSize: '13px', fontWeight: '600',
                }}
              >
                <AiOutlinePrinter style={{ fontSize: '16px' }} /> Buat SPK
              </button>
            )}
            {showSpkPrice && (
              <small
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: usingSpkValue
                    ? (globalTheme === 'light' ? '#0d6efd' : '#9ec5fe')
                    : (globalTheme === 'light' ? '#6c757d' : '#adb5bd'),
                  whiteSpace: 'nowrap',
                }}
              >
                {categoryCostLabel} Rp {categoryCostValue.toLocaleString('id-ID')}
              </small>
            )}
          </div>





        </div>
      </div>

      {/* Modal */}
      <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showEditCategoryModal} onHide={handleCloseEditCategoryModal}>
        <Modal.Header closeButton>
          <Modal.Title>Category ({category.split(/(?=[A-Z])/).join(' ')})</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Your comment form here */}
          <label className='mt-2'>Supplier :</label><MdAssignment className="mt-2" style={{ float: "right", width: "25px", height: "auto" }} onClick={handleShowSupplierModal} /><br />
          {/* <input className="form-control" type='text' value={supplier} onChange={(e) => setSupplier(e.target.value)}></input> */}

          <select className="form-control" value={supplier || ""} onChange={(e) => setSupplier(e.target.value)} required>
            <option style={{ color: "#aaa" }} value="" disabled>Select Supplier</option>
            {dataSupplierFromDB.map((supplier, index) => {
              if (supplier.category == category) {
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
          <select className="form-control" value={categoryStatus || ""} onChange={(e) => setCategoryStatus(e.target.value || null)}>
            <option value="">— Tidak ada status —</option>
            <option value="Belum Proses">Belum Proses</option>
            <option value="Proses">Proses</option>
            <option value="QC Pass">QC Pass</option>
            <option value="Servis">Servis</option>
            <option value="Selesai">Selesai</option>
            <option value="Ready Stock">Ready Stock</option>
          </select>

          <label className='mt-2'>SPK Code :</label><br />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Select
              showSearch
              placeholder="Select SPK Code"
              value={selectedSPKCode}
              onChange={(value, option) => {
                console.log("onChange value:", value);
                console.log("onChange option:", option);
                // option sekarang bertipe DefaultOptionType
                if (!Array.isArray(option) && option && 'id' in option) {
                  console.log("onChange id:", option.id);
                  setSelectedSPKId(option.id); // pakai id yang kita custom
                }
                setSelectedSPKCode(value);
              }}
              onSearch={(value) => {
                if (value !== '') {
                  setSearchSPK(value); // simpan hanya jika tidak kosong
                }
              }}
              optionFilterProp="label"
              style={{ width: '100%' }}
              getPopupContainer={(triggerNode) => triggerNode.parentNode}
              allowClear
            >
              {dataSPKFromDB.filter(spk => spk.pengrajin === supplier).map((spk) => (
                <Option key={spk.id} value={spk.code} label={spk.code} id={spk.id}>
                  {spk.code}
                </Option>
              ))}
            </Select>
            <Popconfirm
              title="Create SPK"
              description={
                <div style={{ lineHeight: '1.5' }}>
                  <div>SPK Code : {searchSPK || '-'}</div>
                  <div>Supplier : {supplier || '-'}</div>
                  <div>Tanggal Cetak : {orderDate || '-'}</div>
                </div>
              }
              onConfirm={() => handleCreateSPK({ searchSPK, supplier, orderDate })}
              okText="Yes"
              cancelText="No"
            >
              <button
                type="button"
                style={{
                  padding: '4px 12px',   // tambahkan padding vertikal
                  borderRadius: '4px',
                  border: '1px solid #d9d9d9',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  lineHeight: '20px',    // cukup untuk font 14px
                  whiteSpace: 'nowrap',  // agar teks tidak wrap
                }}
              >
                Create SPK
              </button>
            </Popconfirm>
          </div>


          {/* <label className='mt-2'>Link Product :</label><br />
          <input className="form-control" type='text' value={linkProduct} onChange={(e) => setLinkProduct(e.target.value)}></input> */}
        </Modal.Body>
        <Modal.Footer style={{ justifyContent: 'space-between' }}>
          <Popconfirm
            title={`Reset kategori ${category}?`}
            description="Semua data kategori ini (supplier, status, deskripsi, deadline) akan dihapus permanen."
            onConfirm={handleResetCategory}
            okText="Ya, Reset"
            cancelText="Batal"
            okButtonProps={{ danger: true }}
          >
            <Button variant="outline-danger" size="sm">Hapus / Reset Kategori</Button>
          </Popconfirm>
          <Button variant="primary" onClick={() => setShowConfirmCategoryModal(true)}>Submit</Button>
        </Modal.Footer>
      </Modal>
      {/* End Modal */}

      {/* Confirm Category Modal */}
      <Modal
        className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`}
        show={showConfirmCategoryModal}
        onHide={() => setShowConfirmCategoryModal(false)}
        size="xl"
      >
        <Modal.Header closeButton>
          <Modal.Title>Konfirmasi Data — Category ({category.split(/(?=[A-Z])/).join(' ')})</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex gap-3">
            {/* Kiri: deskripsi category yang mau disimpan */}
            <div style={{ flex: 1, border: '2px solid #0d6efd', borderRadius: '8px', padding: '12px', minHeight: '200px' }}>
              <h6 style={{ color: '#0d6efd', marginBottom: '8px' }}>Deskripsi Spesifik ({category})</h6>
              <p style={{ whiteSpace: 'pre-line', color: globalTheme === 'light' ? 'black' : 'white', fontSize: '14px' }}>
                {description || '-'}
              </p>
            </div>
            {/* Kanan: deskripsi produk dari invoice */}
            <div style={{ flex: 1, border: '2px solid #6c757d', borderRadius: '8px', padding: '12px', minHeight: '200px' }}>
              <h6 style={{ color: '#6c757d', marginBottom: '8px' }}>Deskripsi Produk (Invoice)</h6>
              <p style={{ whiteSpace: 'pre-line', color: globalTheme === 'light' ? 'black' : 'white', fontSize: '14px' }}>
                {dataProjectFromDB[0]?.Spesifikasi || '-'}
                {dataProjectFromDB[0]?.Qty ? `\nQty : ${dataProjectFromDB[0].Qty}` : ''}
              </p>
            </div>
          </div>
          <div className="mt-3 p-3 text-center" style={{ backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
            <strong style={{ color: '#856404' }}>Apakah data sudah benar? Harap dibaca kembali sebelum menyimpan.</strong>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmCategoryModal(false)}>Batal</Button>
          <Button variant="primary" onClick={() => { setShowConfirmCategoryModal(false); handleSubmit(); }}>Simpan</Button>
        </Modal.Footer>
      </Modal>
      {/* End Confirm Category Modal */}

      {/* SPK Layout Modal (pilih cover + atur layout halaman gambar) */}
      <SPKLayoutModal
        show={showSPKImagePicker}
        images={spkImages}
        namaBarang={dataProjectFromDB[0]?.NamaBarang || ''}
        globalTheme={globalTheme}
        onClose={() => setShowSPKImagePicker(false)}
        onConfirm={handleConfirmPrintSPK}
      />

      {/* Alur Kerja QC Modal */}
      <Modal
        className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`}
        show={alurKerjaModalOpen}
        onHide={() => setAlurKerjaModalOpen(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Alur Kerja — {alurKerjaLabel}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {alurKerjaStep === 'choose' && (
            <div className="d-flex flex-column gap-2 mt-2">
              <div className="d-flex gap-3">
                <Button variant="success" style={{ flex: 1, padding: '14px', fontSize: '15px' }}
                  onClick={() => setAlurKerjaStep('confirm-ok')}>
                  ✓ Sudah Ok
                </Button>
                <Button variant="warning" style={{ flex: 1, padding: '14px', fontSize: '15px' }}
                  onClick={() => setAlurKerjaStep('servis-input')}>
                  ⚠ Servis / Cek
                </Button>
              </div>
              {(alurKerjaCurrentVal === 'ok' || alurKerjaCurrentVal === 'servis') && (
                <Button
                  variant="outline-secondary"
                  style={{ width: '100%', padding: '10px', fontSize: '13px' }}
                  onClick={() => setAlurKerjaStep('confirm-reset')}
                >
                  ↩ Reset ke Belum Dicek
                </Button>
              )}
            </div>
          )}
          {alurKerjaStep === 'confirm-ok' && (
            <>
              <p style={{ color: globalTheme === 'light' ? 'black' : 'white' }}>
                Konfirmasi: <b>{user?.displayName || 'Anda'}</b> sudah cek <b>{category}</b> — <b>{alurKerjaLabel}</b> dan sudah ok?
              </p>
              <label style={{ color: globalTheme === 'light' ? 'black' : 'white' }}>Keterangan (opsional):</label>
              <textarea
                className="form-control mt-1"
                rows={2}
                value={alurKerjaKeterangan}
                onChange={(e) => setAlurKerjaKeterangan(e.target.value)}
                placeholder="Tambahkan catatan jika ada..."
              />
            </>
          )}
          {alurKerjaStep === 'servis-input' && (
            <>
              <label style={{ color: globalTheme === 'light' ? 'black' : 'white' }}>Keterangan masalah:</label>
              <textarea
                className="form-control mt-1"
                rows={3}
                value={alurKerjaKeterangan}
                onChange={(e) => setAlurKerjaKeterangan(e.target.value)}
                placeholder="Tuliskan keterangan..."
              />
            </>
          )}
          {alurKerjaStep === 'confirm-servis' && (
            <div style={{ color: globalTheme === 'light' ? 'black' : 'white' }}>
              <p>Konfirmasi: <b>{user?.displayName || 'Anda'}</b> tandai <b>{category}</b> — <b>{alurKerjaLabel}</b> perlu servis/cek.</p>
              <p>Keterangan: <b>{alurKerjaKeterangan}</b></p>
            </div>
          )}
          {alurKerjaStep === 'confirm-reset' && (
            <p style={{ color: globalTheme === 'light' ? 'black' : 'white' }}>
              Reset status <b>{alurKerjaLabel}</b> kembali ke <b>belum dicek</b>?
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          {alurKerjaStep === 'choose' && (
            <Button variant="secondary" onClick={() => setAlurKerjaModalOpen(false)}>Batal</Button>
          )}
          {alurKerjaStep === 'confirm-ok' && (
            <>
              <Button variant="secondary" onClick={() => setAlurKerjaStep('choose')}>Kembali</Button>
              <Button variant="success" onClick={() => handleAlurKerjaSubmit('ok', alurKerjaKeterangan)}>Simpan</Button>
            </>
          )}
          {alurKerjaStep === 'servis-input' && (
            <>
              <Button variant="secondary" onClick={() => setAlurKerjaStep('choose')}>Kembali</Button>
              <Button variant="warning" onClick={() => setAlurKerjaStep('confirm-servis')}>Lanjut</Button>
            </>
          )}
          {alurKerjaStep === 'confirm-servis' && (
            <>
              <Button variant="secondary" onClick={() => setAlurKerjaStep('servis-input')}>Kembali</Button>
              <Button variant="warning" onClick={() => handleAlurKerjaSubmit('servis', alurKerjaKeterangan)}>Simpan</Button>
            </>
          )}
          {alurKerjaStep === 'confirm-reset' && (
            <>
              <Button variant="secondary" onClick={() => setAlurKerjaStep('choose')}>Kembali</Button>
              <Button variant="outline-secondary" onClick={() => handleAlurKerjaSubmit('reset', '')}>Ya, Reset</Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
      {/* End Alur Kerja QC Modal */}

      {/* Modal */}
      <Modal
        className={`${globalTheme === "light" ? "modalKLFlight" : "modalKLF"}`}
        show={showToDoListModal}
        onHide={() => setShowToDoListModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>To Do List - {category.split(/(?=[A-Z])/).join(" ")}</Modal.Title>
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


      {/* Modal */}
      <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showSupplier} onHide={handleCloseSupplierModal}>
        <Modal.Header closeButton>
          <Modal.Title>Supplier</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Your comment form here */}

          <div className="d-flex justify-content-between align-items-center">
            <p>Supplier Stainless :</p><MdAddCircleOutline style={{ width: "25px", height: "auto", marginTop: "-15px" }} onClick={() => handleAddSupplierModal('Stainless')} />
          </div>
          <ul>
            {dataSupplierFromDB.map((supplier, index) => {
              if (supplier.category == 'Stainless') {
                return (
                  <div className="d-flex justify-content-between align-items-center">
                    <li key={index}>{supplier.supplierName}</li><HiOutlineMinusCircle style={{ width: "20px", height: "auto" }} onClick={() => handleDeleteSupplierClick(supplier.id)} />
                  </div>
                )
              }

            })}
          </ul>

          <div className="d-flex justify-content-between align-items-center">
            <p>Supplier Besi :</p><MdAddCircleOutline style={{ width: "25px", height: "auto", marginTop: "-15px" }} onClick={() => handleAddSupplierModal('Besi')} />
          </div>
          <ul>
            {dataSupplierFromDB.map((supplier, index) => {
              if (supplier.category == 'Besi') {
                return (
                  <div className="d-flex justify-content-between align-items-center">
                    <li key={index}>{supplier.supplierName}</li><HiOutlineMinusCircle style={{ width: "20px", height: "auto" }} onClick={() => handleDeleteSupplierClick(supplier.id)} />
                  </div>
                )
              }

            })}
          </ul>

          <div className="d-flex justify-content-between align-items-center">
            <p>Supplier Kayu :</p><MdAddCircleOutline style={{ width: "25px", height: "auto", marginTop: "-15px" }} onClick={() => handleAddSupplierModal('Kayu')} />
          </div>
          <ul>
            {dataSupplierFromDB.map((supplier, index) => {
              if (supplier.category == 'Kayu') {
                return (
                  <div className="d-flex justify-content-between align-items-center">
                    <li key={index}>{supplier.supplierName}</li><HiOutlineMinusCircle style={{ width: "20px", height: "auto" }} onClick={() => handleDeleteSupplierClick(supplier.id)} />
                  </div>
                )
              }

            })}
          </ul>

          <div className="d-flex justify-content-between align-items-center">
            <p>Supplier Jok :</p><MdAddCircleOutline style={{ width: "25px", height: "auto", marginTop: "-15px" }} onClick={() => handleAddSupplierModal('Jok')} />
          </div>
          <ul>
            {dataSupplierFromDB.map((supplier, index) => {
              if (supplier.category == 'Jok') {
                return (
                  <div className="d-flex justify-content-between align-items-center">
                    <li key={index}>{supplier.supplierName}</li><HiOutlineMinusCircle style={{ width: "20px", height: "auto" }} onClick={() => handleDeleteSupplierClick(supplier.id)} />
                  </div>
                )
              }

            })}
          </ul>

          <div className="d-flex justify-content-between align-items-center">
            <p>Supplier Rotan :</p><MdAddCircleOutline style={{ width: "25px", height: "auto", marginTop: "-15px" }} onClick={() => handleAddSupplierModal('Rotan')} />
          </div>
          <ul>
            {dataSupplierFromDB.map((supplier, index) => {
              if (supplier.category == 'Rotan') {
                return (
                  <div className="d-flex justify-content-between align-items-center">
                    <li key={index}>{supplier.supplierName}</li><HiOutlineMinusCircle style={{ width: "20px", height: "auto" }} onClick={() => handleDeleteSupplierClick(supplier.id)} />
                  </div>
                )
              }

            })}
          </ul>

          <div className="d-flex justify-content-between align-items-center">
            <p>Supplier Marmer :</p><MdAddCircleOutline style={{ width: "25px", height: "auto", marginTop: "-15px" }} onClick={() => handleAddSupplierModal('Marmer')} />
          </div>
          <ul>
            {dataSupplierFromDB.map((supplier, index) => {
              if (supplier.category == 'Marmer') {
                return (
                  <div className="d-flex justify-content-between align-items-center">
                    <li key={index}>{supplier.supplierName}</li><HiOutlineMinusCircle style={{ width: "20px", height: "auto" }} onClick={() => handleDeleteSupplierClick(supplier.id)} />
                  </div>
                )
              }

            })}
          </ul>

          <div className="d-flex justify-content-between align-items-center">
            <p>Supplier Kaca :</p><MdAddCircleOutline style={{ width: "25px", height: "auto", marginTop: "-15px" }} onClick={() => handleAddSupplierModal('Kaca')} />
          </div>
          <ul>
            {dataSupplierFromDB.map((supplier, index) => {
              if (supplier.category == 'Kaca') {
                return (
                  <div className="d-flex justify-content-between align-items-center">
                    <li key={index}>{supplier.supplierName}</li><HiOutlineMinusCircle style={{ width: "20px", height: "auto" }} onClick={() => handleDeleteSupplierClick(supplier.id)} />
                  </div>
                )
              }

            })}
          </ul>

          <div className="d-flex justify-content-between align-items-center">
            <p>Supplier Kain :</p><MdAddCircleOutline style={{ width: "25px", height: "auto", marginTop: "-15px" }} onClick={() => handleAddSupplierModal('Kain')} />
          </div>
          <ul>
            {dataSupplierFromDB.map((supplier, index) => {
              if (supplier.category == 'Kain') {
                return (
                  <div className="d-flex justify-content-between align-items-center">
                    <li key={index}>{supplier.supplierName}</li><HiOutlineMinusCircle style={{ width: "20px", height: "auto" }} onClick={() => handleDeleteSupplierClick(supplier.id)} />
                  </div>
                )
              }

            })}
          </ul>

          <div className="d-flex justify-content-between align-items-center">
            <p>Supplier Fiber :</p><MdAddCircleOutline style={{ width: "25px", height: "auto", marginTop: "-15px" }} onClick={() => handleAddSupplierModal('Fiber')} />
          </div>
          <ul>
            {dataSupplierFromDB.map((supplier, index) => {
              if (supplier.category == 'Fiber') {
                return (
                  <div className="d-flex justify-content-between align-items-center">
                    <li key={index}>{supplier.supplierName}</li><HiOutlineMinusCircle style={{ width: "20px", height: "auto" }} onClick={() => handleDeleteSupplierClick(supplier.id)} />
                  </div>
                )
              }

            })}
          </ul>

          <div className="d-flex justify-content-between align-items-center">
            <p>Supplier Veneer :</p><MdAddCircleOutline style={{ width: "25px", height: "auto", marginTop: "-15px" }} onClick={() => handleAddSupplierModal('Veneer')} />
          </div>
          <ul>
            {dataSupplierFromDB.map((supplier, index) => {
              if (supplier.category == 'Veneer') {
                return (
                  <div className="d-flex justify-content-between align-items-center">
                    <li key={index}>{supplier.supplierName}</li><HiOutlineMinusCircle style={{ width: "20px", height: "auto" }} onClick={() => handleDeleteSupplierClick(supplier.id)} />
                  </div>
                )
              }

            })}
          </ul>

          <div className="d-flex justify-content-between align-items-center">
            <p>Supplier Finishing :</p><MdAddCircleOutline style={{ width: "25px", height: "auto", marginTop: "-15px" }} onClick={() => handleAddSupplierModal('Finishing')} />
          </div>
          <ul>
            {dataSupplierFromDB.map((supplier, index) => {
              if (supplier.category == 'Finishing') {
                return (
                  <div className="d-flex justify-content-between align-items-center">
                    <li key={index}>{supplier.supplierName}</li><HiOutlineMinusCircle style={{ width: "20px", height: "auto" }} onClick={() => handleDeleteSupplierClick(supplier.id)} />
                  </div>
                )
              }

            })}
          </ul>

          <div className="d-flex justify-content-between align-items-center">
            <p>Supplier Hardware :</p><MdAddCircleOutline style={{ width: "25px", height: "auto", marginTop: "-15px" }} onClick={() => handleAddSupplierModal('Hardware')} />
          </div>
          <ul>
            {dataSupplierFromDB.map((supplier, index) => {
              if (supplier.category == 'Hardware') {
                return (
                  <div className="d-flex justify-content-between align-items-center">
                    <li key={index}>{supplier.supplierName}</li><HiOutlineMinusCircle style={{ width: "20px", height: "auto" }} onClick={() => handleDeleteSupplierClick(supplier.id)} />
                  </div>
                )
              }

            })}
          </ul>

          <div className="d-flex justify-content-between align-items-center">
            <p>Supplier Barang Jadi :</p><MdAddCircleOutline style={{ width: "25px", height: "auto", marginTop: "-15px" }} onClick={() => handleAddSupplierModal('BarangJadi')} />
          </div>
          <ul>
            {dataSupplierFromDB.map((supplier, index) => {
              if (supplier.category == 'BarangJadi') {
                return (
                  <div className="d-flex justify-content-between align-items-center">
                    <li key={index}>{supplier.supplierName}</li><HiOutlineMinusCircle style={{ width: "20px", height: "auto" }} onClick={() => handleDeleteSupplierClick(supplier.id)} />
                  </div>
                )
              }

            })}
          </ul>

        </Modal.Body>
      </Modal>
      {/* End Modal */}

      {/* Modal */}
      <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showAddSupplier} onHide={handleCloseAddSupplierModal}>
        <Modal.Header closeButton>
          <Modal.Title>Add Supplier {supplierCategory}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Your comment form here */}
          <label className='mt-2'>Supplier Name:</label><br />
          <input className="form-control" type='text' onChange={(e) => setSupplierName(e.target.value)}></input>

        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleSubmitAddSupplier}>Submit</Button>
        </Modal.Footer>
      </Modal>
      {/* End Modal */}




      <div className="mt-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: "sticky", ...(isMobile ? { top: 0 } : { top: 3 }), zIndex: 1 }}>
        <h4
          ref={targetElementRefComment}
          onClick={handleShowCategoryModal}
          style={{
            color: globalTheme == "light" ? "black" : "white",
            margin: "5px 0px 0px 15px",
            backgroundColor: isElementVisibleComment ? (globalTheme === "light" ? "#f3f3f3" : "#151515") : "transparent",
            padding: "3px",
            borderRadius: "30px",
            transition: "background-color 0.3s ease",
            cursor: "pointer"
          }}>
          Comments ({category ? category.split(/(?=[A-Z])/).join(' ') : 'Select Category'})
        </h4>
        <button className="btnKomentar button-effect2" onClick={handleShowModal} style={{ marginRight: isMobile ? '2vw' : "1vw", marginTop: "0.3vh" }}><FaRegCommentDots style={{ fontSize: '15px' }} /> Comment</button>
      </div>
      {/* Modal */}
      <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Add Comment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Your comment form here */}
          <label>Image :</label><br />


          <div className='py-2'>
            <ImageUploadZone
              images={commentImages}
              onChange={setCommentImages}
              max={10}
              theme={globalTheme}
            />
          </div>

          <br />
          <label className='mt-2 mb-2'>Text :</label>
          {/* <textarea className="form-control" rows="3" type='text' value={textComment} onChange={(e) => setTextComment(e.target.value)}></textarea> */}

          <Mentions
            rows={5}
            defaultValue={textComment}
            onChange={(value) => {
              setTextComment(value);
            }}
            placeholder="Text"
            options={[
              { value: 'Alfen', label: 'Alfen' },
              { value: 'Azwad', label: 'Azwad' },
              { value: 'Lina', label: 'Lina' },
              { value: 'Mad', label: 'Mad' },
              { value: 'P. Dhe', label: 'P. Dhe' },
              { value: 'Rakev', label: 'Rakev' },
              { value: 'Resti', label: 'Resti' },
              { value: 'Udin', label: 'Udin' },
              { value: 'Xena', label: 'Xena' },
            ]}
          />


        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleSubmitComment} disabled={submittingComment}>
            {submittingComment ? 'Mengirim…' : 'Submit'}
          </Button>
        </Modal.Footer>
      </Modal>
      {/* End Modal */}

      <div>
        {dataCommentsFromDB.map((comment, index) => {
          // console.log(comment);
          const commentUserName = dataUserFromDB.find(user => user.uid === comment.user)?.name || 'Unknown';
          const UserProfilePicture = dataUserFromDB.find(user => user.uid === comment.user)?.profilePicture || 'Unknown';
          let isMe = false;
          if (comment.user === user.uid) {
            isMe = true;
          }

          return (
            <div className={`deskripsiPekerjaan p-3 position-relative mt-4 shadow ${index === dataCommentsFromDB.length - 1 ? newCommentClass : ''}`} style={{ backgroundImage: globalTheme === "light" ? "linear-gradient(to right, #ffffff, #e7e7e7)" : "linear-gradient(to right, #151515, #303030)", border: globalTheme === "light" ? "2px solid rgb(163, 163, 163)" : "2px solid #7a7a7a" }} key={index} id={comment.id}>

              <div style={{ cursor: isMe ? "pointer" : "" }} onClick={isMe ? () => handleEditComment(comment.id, comment.text, 'Comment', comment) : undefined}>

                <div className="d-flex align-items-center mb-2">
                  <img src={getImageUrl(UserProfilePicture)} alt="" style={{ width: "4vh", height: "4vh", borderRadius: "100%", marginRight: "1vh" }} />


                  <h6 className="fw-semibold" style={{ color: globalTheme == "light" ? "black" : "white" }}>{commentUserName}</h6>
                </div>

                <div className="me-3 mt-2 p-2">
                  {Array.from({ length: 10 }, (_, i) => {
                    const imageKey = `image${i + 1}`;
                    const imageUrl = comment[imageKey];
                    if (!imageUrl) return null;

                    const isPDF = imageUrl.toLowerCase().includes(".pdf");
                    const pdfLink = `${baseUrl}${imageUrl}`;

                    return isPDF ? (
                      <a
                        key={imageKey}
                        href={pdfLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <img
                          src="https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3"
                          style={{ height: "11vh", marginRight: "1vh", borderRadius: "10px" }}
                          alt="PDF Logo"
                        />
                      </a>
                    ) : (
                      <span
                        key={imageKey}
                        style={{ marginRight: "1vh" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Image
                          width="auto"
                          height="11vh"
                          style={{ borderRadius: "10px" }}
                          src={getImageUrl(imageUrl)}
                        />
                      </span>
                    );
                  })}

                  {Array.from({ length: 10 }, (_, i) => {
                    const videoKey = `video${i + 1}`;
                    const videoUrl = comment[videoKey];
                    if (!videoUrl) return null;

                    const fullUrl = `${baseUrl}/video/${videoUrl.split("/").pop()}`;
                    // ambil filename dari path, sesuai endpoint backend

                    return (
                      <video
                        key={videoKey}
                        style={{
                          height: "20vh",
                          marginRight: "1vh",
                          borderRadius: "10px"
                        }}
                        controls
                        onClick={(e) => e.stopPropagation()}
                      >
                        <source src={fullUrl} type="video/webm" />
                        Browser ini tidak mendukung video tag.
                      </video>
                    );
                  })}



                  <HighlightMentions text={comment.text} />

                </div>

                <small className="position-absolute top-0 end-0 p-3" style={{ color: globalTheme == "light" ? "black" : "white" }}>{format(new Date(comment.date.value._seconds * 1000), 'd MMMM yyyy, HH.mm', { locale: id })}</small>
              </div>

              <div className="mt-3 d-flex justify-content-end">
                <button className="btnKomentar button-effect2" onClick={() => { handleCommentIdChange(comment.id, index); }}><BsReply style={{ fontSize: '15px' }} /> Reply</button>
              </div>



              <div style={{ position: 'relative' }}>
                <hr style={{ borderColor: globalTheme == "light" ? "black" : "white", borderWidth: '1px', width: '100%' }} />

                <p style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', backgroundColor: globalTheme == "light" ? "#e3e3e3" : '#353535', color: globalTheme == "light" ? "black" : "white", padding: '0 10px', borderRadius: "20px", border: "1px solid #5b5b5b" }}>Replies</p>
              </div>


              {dataRepliesFromDB.map((replies, replyIndex) => {

                if (replies.commentId == comment.id) {
                  const replyUserName = dataUserFromDB.find(user => user.uid === replies.user)?.name || 'Unknown';
                  const UserProfilePictureReply = dataUserFromDB.find(user => user.uid === replies.user)?.profilePicture || 'Unknown';

                  let isMeReply = false;
                  if (replies.user === user.uid) {
                    isMeReply = true;
                  }

                  return (
                    <div className={`deskripsiPekerjaan p-3 position-relative mt-2 ${replyIndex === dataRepliesFromDB.length - 1 ? newReplyClass : ''}`} style={{ cursor: isMeReply ? "pointer" : "", background: globalTheme == "light" ? "#f5f5f5" : "#151515", border: globalTheme == "light" ? "2px solid #cdcdcd" : "2px solid #7a7a7a" }} key={replyIndex} id={replies.id} onClick={isMeReply ? () => { handleEditComment(replies.id, replies.text, 'Reply', replies); setCommentId(comment.id) } : undefined}>
                      <div className="d-flex align-items-center mb-2">
                        <img src={getImageUrl(UserProfilePictureReply)} alt="" style={{ width: "4vh", height: "4vh", borderRadius: "100%", marginRight: "1vh" }} />
                        <h6 className="fw-semibold" style={{ color: globalTheme == "light" ? "black" : "white" }}>{replyUserName}</h6>
                      </div>
                      {Array.from({ length: 10 }, (_, i) => {
                        const imageKey = `image${i + 1}`;
                        const imageUrl = replies[imageKey];
                        if (!imageUrl) return null;

                        const isPDF = imageUrl.toLowerCase().includes(".pdf");
                        const pdfLink = `${baseUrl}${imageUrl}`;

                        return isPDF ? (
                          <a
                            key={imageKey}
                            href={pdfLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <img
                              src="https://firebasestorage.googleapis.com/v0/b/klf-project-f1833.appspot.com/o/pdf%2Fpdf-logo.png?alt=media&token=65ce49ad-52aa-4382-b3c4-120e46f84dd3"
                              style={{ height: "11vh", marginRight: "1vh", borderRadius: "10px" }}
                              alt="PDF Logo"
                            />
                          </a>
                        ) : (
                          <span
                            key={imageKey}
                            style={{ marginRight: "1vh" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Image
                              width="auto"
                              height="11vh"
                              style={{ borderRadius: "10px" }}
                              src={getImageUrl(imageUrl)}
                            />
                          </span>
                        );
                      })}


                      <HighlightMentions text={replies.text} />
                      <small className="position-absolute top-0 end-0 p-3" style={{ color: globalTheme == "light" ? "black" : "white" }}>{format(new Date(replies.date.value._seconds * 1000), 'd MMMM yyyy, HH.mm', { locale: id })}</small>
                    </div>
                  )
                }

              })}

              <div ref={el => refs.current[index] = el}></div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showReplyModal} onHide={handleCloseReplyModal}>
        <Modal.Header closeButton>
          <Modal.Title>Reply</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Your comment form here */}
          <label>Image :</label><br />
          <div className='py-2'>
            <ImageUploadZone
              images={replyImages}
              onChange={setReplyImages}
              max={10}
              theme={globalTheme}
            />
          </div>

          <br />
          <label className='mt-2'>Text :</label>
          {/* <textarea className="form-control" rows="3" type='text' value={textReply} onChange={(e) => setTextReply(e.target.value)}></textarea> */}

          <Mentions
            rows={5}
            defaultValue={textReply}
            onChange={(value) => {
              setTextReply(value);
            }}
            placeholder="Text"
            options={[
              { value: 'Alfen', label: 'Alfen' },
              { value: 'Azwad', label: 'Azwad' },
              { value: 'Lina', label: 'Lina' },
              { value: 'Mad', label: 'Mad' },
              { value: 'P. Dhe', label: 'P. Dhe' },
              { value: 'Rakev', label: 'Rakev' },
              { value: 'Resti', label: 'Resti' },
              { value: 'Udin', label: 'Udin' },
              { value: 'Xena', label: 'Xena' },
            ]}
          />

        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleSubmitReply}>Submit</Button>
        </Modal.Footer>
      </Modal>
      {/* End Modal */}


      <div
        style={{
          position: 'fixed',
          padding: '0.5rem',
          zIndex: '3',
          ...(isMobile ? { top: 130, left: '50%', transform: 'translateX(-50%)' } : { bottom: 30, right: 30 }),
        }}
      >
        <Toast show={showToast} onClose={() => setShowToast(false)}>
          <Toast.Header style={{ backgroundColor: "#151515" }}>
            <img src={klftoast} className="rounded me-2" alt="..." style={{ width: "20px", height: "auto" }} />
            <strong className="me-auto text-light">KLF App</strong>
            <small>Just now...</small>
          </Toast.Header>
          <Toast.Body style={{ backgroundColor: "#151515", color: "white" }}>Please select a category first</Toast.Body>
        </Toast>
      </div>

      <div
        style={{
          position: 'fixed',
          padding: '0.5rem',
          zIndex: '3',
          ...(isMobile ? { top: 130, left: '50%', transform: 'translateX(-50%)' } : { bottom: 30, right: 30 }),
        }}
      >
        <Toast show={showToast2} onClose={() => setShowToast(false)}>
          <Toast.Header style={{ backgroundColor: "#151515" }}>
            <img src={klftoast} className="rounded me-2" alt="..." style={{ width: "20px", height: "auto" }} />
            <strong className="me-auto text-light">KLF App</strong>
            <small>Just now...</small>
          </Toast.Header>
          <Toast.Body style={{ backgroundColor: "#151515", color: "white" }}>Data is not available because it has been deleted</Toast.Body>
        </Toast>
      </div>

      {selectedImage && (
        <div className="modal fade show" tabIndex="-1" role="dialog" style={{ display: 'block' }}>
          <div className="modal-dialog modal-dialog-centered" role="document" style={{ transform: 'scale(1.5)' }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" style={{ transform: 'scale(0.7)' }}>Image</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={closeModalImg} style={{ transform: 'scale(0.7)' }}></button>
              </div>
              <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img src={getImageUrl(selectedImage)} alt="" style={{ maxHeight: '55vh', maxWidth: '100%', height: 'auto' }} />
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Modal Riwayat Perubahan Deskripsi (read-only) */}
      <Modal size="lg" className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showHistoryModal} onHide={() => setShowHistoryModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1rem' }}>{historyTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {historyData.length === 0 ? (
            <p className="text-center text-muted mb-0">Belum ada riwayat perubahan.</p>
          ) : (
            historyData.map((entry, idx) => {
              const isLatest = idx === 0;
              const versionNum = entry.versionNum;
              return (
                <div
                  key={idx}
                  style={{
                    border: `1px solid ${globalTheme == "light" ? "#e0e0e0" : "#444"}`,
                    borderLeft: `4px solid ${isLatest ? '#dc3545' : (globalTheme == "light" ? "#ced4da" : "#6c757d")}`,
                    borderRadius: '8px',
                    padding: '10px 12px',
                    marginBottom: '10px',
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center flex-wrap" style={{ gap: '6px', marginBottom: '6px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: globalTheme == "light" ? "#212529" : "#f1f1f1" }}>
                      {entry.source === 'baseline'
                        ? 'Data awal'
                        : (entry.username || dataUserFromDB.find(u => u.uid === entry.uid)?.name || 'Tidak diketahui')}
                    </div>
                    <div style={{ fontSize: '11px', color: globalTheme == "light" ? "#6c757d" : "#adb5bd", display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {formatHistoryDate(entry.ts)}
                      <span style={{ fontWeight: 700, fontSize: '12px', color: '#dc3545' }}>V{versionNum}</span>
                    </div>
                  </div>
                  <div className="d-flex" style={{ gap: '10px' }}>
                    {entry.image ? (
                      <img
                        src={getImageUrl(entry.image)}
                        alt=""
                        onClick={() => openModalImg(entry.image)}
                        style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', flexShrink: 0 }}
                      />
                    ) : null}
                    <p style={{ whiteSpace: 'pre-line', fontSize: '13px', margin: 0, color: globalTheme == "light" ? "#212529" : "#e9ecef" }}>
                      {entry.text || <span className="text-muted">(kosong)</span>}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </Modal.Body>
        <Modal.Footer>
          <small className="text-muted me-auto">Riwayat hanya untuk dilihat. Untuk memakai versi lama, salin teksnya lalu simpan ulang.</small>
          <button className="btn btn-sm btn-secondary" onClick={() => setShowHistoryModal(false)}>Tutup</button>
        </Modal.Footer>
      </Modal>


      {/* Modal */}
      <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showModalEditComment} onHide={handleCloseEditComment}>
        <Modal.Header closeButton>
          <Modal.Title>Edit {editCommentType}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Your comment form here */}
          {editExistingImages.length > 0 && (
            <>
              <label className='mb-2'>Gambar saat ini :</label>
              <div className='d-flex flex-wrap py-1' style={{ gap: '8px' }}>
                {editExistingImages.map((img) => (
                  <div
                    key={img.key}
                    style={{
                      position: 'relative', width: '70px', height: '70px',
                      borderRadius: '6px', overflow: 'hidden',
                      border: globalTheme === 'light' ? '1px solid #ddd' : '1px solid #444',
                    }}
                  >
                    <img
                      src={getImageUrl(img.url)}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemoveExistingEditImage(img.key); }}
                      title="Hapus gambar ini"
                      style={{
                        position: 'absolute', top: '2px', right: '2px',
                        width: '18px', height: '18px', borderRadius: '50%',
                        border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', padding: 0, fontSize: '10px', lineHeight: 1,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          <label className='mt-2 mb-2'>Tambah gambar baru :</label>
          <ImageUploadZone
            images={editNewImages}
            onChange={setEditNewImages}
            max={Math.max(0, 10 - editExistingImages.length)}
            theme={globalTheme}
          />

          <label className='mt-2 mb-2'>Text :</label>
          {/* <textarea className="form-control" rows="3" type='text' value={editCommentText} onChange={(e) => setEditCommentText(e.target.value)}></textarea> */}

          <Mentions
            rows={5}
            defaultValue={editCommentText}
            onChange={(value) => {
              setEditCommentText(value);
            }}
            placeholder="Text"
            options={[
              { value: 'Alfen', label: 'Alfen' },
              { value: 'Azwad', label: 'Azwad' },
              { value: 'Lina', label: 'Lina' },
              { value: 'Mad', label: 'Mad' },
              { value: 'P. Dhe', label: 'P. Dhe' },
              { value: 'Rakev', label: 'Rakev' },
              { value: 'Resti', label: 'Resti' },
              { value: 'Udin', label: 'Udin' },
              { value: 'Xena', label: 'Xena' },
            ]}
          />

        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={handleDeleteClick}>Delete</Button>

          <Button variant="primary" onClick={handleSubmitEditComment}>Submit</Button>
        </Modal.Footer>
      </Modal>
      {/* End Modal */}

      <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showConfirm} onHide={handleDeleteCancel}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this {editCommentType.toLowerCase()}?</Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>


      {/* <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showConfirmInformationDelete} onHide={handleDeleteInformationCancel}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this project?</Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={handleDeleteInformationConfirm}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal> */}

      <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showConfirmDeleteSupplier} onHide={handleDeleteSupplierCancel}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this supplier?</Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={handleDeleteSupplierConfirm}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>


      <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showImageEdit} onHide={() => setShowImageEdit(false)}>
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
            const dataImage = dataProjectFromDB.length > 0 ? dataProjectFromDB[0][imageKey] : null;

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
                          src={getImageUrl(
                            dataImage.includes('.pdf') ? pdfLogoImg :
                              dataImage.includes('.glb') ? glbLogoImg :
                                dataImage
                          )}
                        />
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: "1vh" }}>
                        <button
                          className='btn btn-danger mb-1'
                          onClick={() => {
                            setShowConfirmDeleteImage(true);
                            setShowImageEdit(false);
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
                            accept=".png,.jpg,.jpeg,.gif,.bmp,.webp,.tiff,.tif,.svg,.heic,.pdf,.glb"
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
                        accept=".png,.jpg,.jpeg,.gif,.bmp,.webp,.tiff,.tif,.svg,.heic,.pdf,.glb"
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

      <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showImageRenderEdit} onHide={() => setShowImageRenderEdit(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2">
            Edit Image Render
            <InputNumber
              min={1}
              value={jumlahImageRenderEdit}
              onChange={(val) => {
                // Validasi input agar tidak lebih dari 50
                const parsedValue = Number(val);
                if (!isNaN(parsedValue)) {
                  const boundedValue = Math.max(1, Math.min(50, parsedValue));
                  setJumlahImageRenderEdit(boundedValue);
                }
              }}
              placeholder="Jumlah"
              style={{ width: 80 }}
            />


          </Modal.Title>
        </Modal.Header>

        <Modal.Body>



          {[...Array(jumlahImageRenderEdit)].map((_, i) => {
            const index = i + 1;
            const imageKey = `imageRender${index}`;
            const dataImage = dataProjectFromDB.length > 0 ? dataProjectFromDB[0][imageKey] : null;

            return (
              <div key={index} className='mb-3'>
                <p className='mb-1 fw-semibold'>Image Render {index}</p>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {dataImage ? (
                    <>
                      <span style={{ marginRight: "1vh" }} onClick={(e) => e.stopPropagation()}>
                        <img
                          width='auto'
                          height='100vh'
                          style={{ borderRadius: "10px" }}
                          src={getImageUrl(
                            dataImage.includes('.pdf') ? pdfLogoImg :
                              dataImage.includes('.glb') ? glbLogoImg :
                                dataImage
                          )}
                        />
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: "1vh" }}>
                        <button
                          className='btn btn-danger mb-1'
                          onClick={() => {
                            setShowConfirmDeleteImage(true);
                            setShowImageRenderEdit(false);
                            setImageDeleteNumber(imageKey);
                          }}
                        >
                          <MdDelete />
                        </button>
                        <div className='d-flex'>
                          <input
                            className="form-control"
                            type="file"
                            data-id={`editImageRender${index}`}
                            style={{ height: '30px', fontSize: '14px' }}
                            accept=".png,.jpg,.jpeg,.gif,.bmp,.webp,.tiff,.tif,.svg,.heic,.pdf,.glb"
                            onChange={(e) => {
                              handleFileRenderChange(index, e.target.files[0]);
                            }}
                          />
                          <Button
                            variant="secondary"
                            className='antd-btn-custom'
                            style={{ marginLeft: "20px", height: "30px", fontSize: '14px' }}
                            onClick={() => pasteImage(`editImageRender${index}`)}
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
                        data-id={`editImageRender${index}`}
                        style={{ height: '30px', fontSize: '14px' }}
                        accept=".png,.jpg,.jpeg,.gif,.bmp,.webp,.tiff,.tif,.svg,.heic,.pdf,.glb"
                        onChange={(e) => {
                          handleFileRenderChange(index, e.target.files[0]);
                        }}
                      />
                      <Button
                        variant="secondary"
                        className='antd-btn-custom'
                        style={{ marginLeft: "20px", height: "30px", fontSize: '14px' }}
                        onClick={() => pasteImage(`editImageRender${index}`)}
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
          <Button variant="primary" onClick={handleSubmitImageRenderEdit}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>


      <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showConfirmDeleteImage} onHide={() => { setShowConfirmDeleteImage(false); setShowImageEdit(true); }}>
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


      <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showImageCategoryEdit} onHide={() => setShowImageCategoryEdit(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2">
            Edit Image {category}
            <InputNumber
              min={1}
              value={jumlahImageCategory}
              onChange={(val) => {
                // Validasi input agar tidak lebih dari 50
                const parsedValue = Number(val);
                if (!isNaN(parsedValue)) {
                  const boundedValue = Math.max(1, Math.min(50, parsedValue));
                  setJumlahImageCategory(boundedValue);
                }
              }}
              placeholder="Jumlah"
              style={{ width: 80 }}
            />


          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {[...Array(jumlahImageCategory)].map((_, i) => {
            const index = i + 1;
            const imageKey = `image${category}${index}`;
            const inputId = `editImageCategory${index}`;
            const dataImage = dataProjectFromDB.length > 0 ? dataProjectFromDB[0][imageKey] : null;

            return (
              <div key={index} className='mb-3'>
                <p className='mb-1 fw-semibold'>Image {category} {index}</p>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {dataImage ? (
                    <>
                      <span style={{ marginRight: "1vh" }} onClick={(e) => e.stopPropagation()}>
                        <img
                          width='auto'
                          height='100vh'
                          style={{ borderRadius: "10px" }}
                          src={getImageUrl(
                            dataImage.includes('.pdf') ? pdfLogoImg :
                              dataImage.includes('.glb') ? glbLogoImg :
                                dataImage
                          )}
                        />
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: "1vh" }}>
                        <button
                          className='btn btn-danger mb-1'
                          onClick={() => {
                            setShowConfirmDeleteImage(true);
                            setShowImageCategoryEdit(false);
                            setImageDeleteNumber(imageKey);
                          }}
                        >
                          <MdDelete />
                        </button>
                        <div className='d-flex'>
                          <input
                            className="form-control"
                            type="file"
                            data-id={inputId}
                            style={{ height: '30px', fontSize: '14px' }}
                            accept=".png,.jpg,.jpeg,.gif,.bmp,.webp,.tiff,.tif,.svg,.heic,.pdf,.glb"
                            onChange={(e) => handleFileChangeCategoryEdit(index, e.target.files[0])}
                          />
                          <Button
                            variant="secondary"
                            className='antd-btn-custom'
                            style={{ marginLeft: "20px", height: "30px", fontSize: '14px' }}
                            onClick={() => pasteImage(inputId)}
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
                        data-id={inputId}
                        style={{ height: '30px', fontSize: '14px' }}
                        accept=".png,.jpg,.jpeg,.gif,.bmp,.webp,.tiff,.tif,.svg,.heic,.pdf,.glb"
                        onChange={(e) => handleFileChangeCategoryEdit(index, e.target.files[0])}
                      />
                      <Button
                        variant="secondary"
                        className='antd-btn-custom'
                        style={{ marginLeft: "20px", height: "30px", fontSize: '14px' }}
                        onClick={() => pasteImage(inputId)}
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
          <Button variant="primary" onClick={handleSubmitImageCategoryEdit}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>



      {/* Modal */}
      <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showEvaluationModal} onHide={() => setShowEvaluationModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Evaluation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Your comment form here */}
          <p style={{ whiteSpace: 'pre-line' }}>{evaluation}</p>

        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => { setShowEvaluationEditModal(true); setShowEvaluationModal(false) }}>Edit</Button>
        </Modal.Footer>
      </Modal>
      {/* End Modal */}

      {/* Modal */}
      <Modal className={`${globalTheme === 'light' ? 'modalKLFlight' : 'modalKLF'}`} show={showEvaluationEditModal} onHide={() => { setShowEvaluationEditModal(false); setShowEvaluationModal(true) }}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Evaluation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Your comment form here */}
          <textarea className="form-control" type='text' rows="5" value={evaluation} onChange={(e) => setEvaluation(e.target.value)} required></textarea>

        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleSubmitEvaluation}>Submit</Button>
        </Modal.Footer>
      </Modal>
      {/* End Modal */}

      <div ref={bottomRef}></div>
    </Col>
  );
};

export default DetailPekerjaan;
