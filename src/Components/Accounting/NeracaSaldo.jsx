import React, { useRef, useEffect, useState } from 'react';
import { Col, Row, Modal, Button, Container, Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useNavigate } from 'react-router-dom';
import { MdFormatListBulletedAdd } from "react-icons/md";
import { DatePicker, Input, message } from 'antd';
import { LuWorkflow } from "react-icons/lu";
import moment from "moment";

const Jurnal = () => {
  const baseUrl = getApiBaseUrl();
  const [messageApi, contextHolder] = message.useMessage();

  const [showTambahDataModal, setShowTambahDataModal] = useState(false);
  const [showEditDataModal, setShowEditDataModal] = useState(false);
  const [kodeAkun, setKodeAkun] = useState('');
  const [namaAkun, setNamaAkun] = useState('');
  const [jenisAkun, setJenisAkun] = useState('');
  const [saldoAwalDebit, setSaldoAwalDebit] = useState('');
  const [saldoAwalKredit, setSaldoAwalKredit] = useState('');
  const [idDataEdit, setIdDataEdit] = useState('');
  const [dataAkun, setDataAkun] = useState([]);
  const [dataJurnal, setDataJurnal] = useState([]);
  const [filterDate, setFilterDate] = useState(null);
  const [showGenerateSaldoAwalModal, setShowGenerateSaldoAwalModal] = useState(false);

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
        window.location.replace('/accounting');
      }
    };

    cekLogin();
  }, []);

  const tableContainerStyle = {
    marginLeft: '20px',
    marginRight: '20px',
    marginTop: '10px',
    overflow: 'hidden',
    borderRadius: '10px',
    border: '1px solid #dddddd',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0',
  };

  const thTdStyle = {
    border: '1px solid #c2c2c2',
    textAlign: 'left',
    padding: '8px',
    fontSize: '12px',
  };

  const thStyle = {
    ...thTdStyle,
    backgroundColor: 'blue',
    textAlign: 'center',
    color: 'white',
    position: 'sticky',
    top: 0,
    zIndex: 1
  };

  const tbodyTrOddStyle = {
    backgroundColor: '#ffffff',
  };

  const tbodyTrEvenStyle = {
    backgroundColor: '#F4F4F4',
  };

  const tbodyTrLastChildTdFirstChildStyle = {
    borderBottomLeftRadius: '10px',
  };

  const tbodyTrLastChildTdLastChildStyle = {
    borderBottomRightRadius: '10px',
  };



  const fetchDataAkun = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/akun/get`);
      const data = await res.json();
      setDataAkun(data);
    } catch (err) {
      console.error('Gagal mengambil data Akun:', err);
    }
  };

  const fetchDataJurnal = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/jurnal/get`);
      const data = await res.json();
      setDataJurnal(data);
    } catch (err) {
      console.error('Gagal mengambil data Jurnal:', err);
    }
  };

  useEffect(() => {
    fetchDataAkun();
    fetchDataJurnal();
  }, []);


  const [isSaldoAkhir, setIsSaldoAkhir] = useState(true);
  const [animasiSaldoAwal, setAnimasiSaldoAwal] = useState(true); // untuk status animasi
  const [animasiDebitKredit, setAnimasiDebitKredit] = useState(false); // untuk status animasi

  useEffect(() => {
    const interval = setInterval(() => {
      if (isSaldoAkhir) {
        setAnimasiSaldoAwal(false);

        setTimeout(() => {
          setIsSaldoAkhir(false);
        }, 500);

        setTimeout(() => {
          setAnimasiDebitKredit(true);
        }, 550);
      } else {
        setAnimasiDebitKredit(false);

        setTimeout(() => {
          setIsSaldoAkhir(true);
        }, 500);

        setTimeout(() => {
          setAnimasiSaldoAwal(true);
        }, 550);
      }
    }, 3000); // Ubah setiap 3 detik (3000ms)

    return () => clearInterval(interval); // Membersihkan interval saat komponen dibersihkan
  }, [isSaldoAkhir]);

  // const totalSaldoDebit = dataAkun.reduce((total, item) => {
  //   const saldoAkhirAkun = dataJurnal
  //     .filter(
  //       (jurnal) =>
  //         jurnal.kodeAkunDebet === item.kodeAkun || jurnal.kodeAkunKredit === item.kodeAkun
  //     )
  //     .reduce((saldo, jurnal) => {
  //       const adjustedNominalDebet =
  //         jurnal.kodeAkunKredit === item.kodeAkun ? 0 : Number(jurnal.nominalDebet || 0);
  //       const adjustedNominalKredit =
  //         jurnal.kodeAkunDebet === item.kodeAkun ? 0 : Number(jurnal.nominalKredit || 0);
  //       return saldo + adjustedNominalDebet - adjustedNominalKredit;
  //     }, Number(item.saldoAwal || 0));

  //   return total + (item.saldoAwalDebit?.[filterDate] == 0 ? 0 : Number(saldoAkhirAkun) + Number(item.saldoAwalDebit?.[filterDate]));
  // }, 0);

  // const totalSaldoKredit = dataAkun.reduce((total, item) => {
  //   const saldoAkhirAkun = dataJurnal
  //     .filter(
  //       (jurnal) =>
  //         jurnal.kodeAkunDebet === item.kodeAkun || jurnal.kodeAkunKredit === item.kodeAkun
  //     )
  //     .reduce((saldo, jurnal) => {
  //       const adjustedNominalDebet =
  //         jurnal.kodeAkunKredit === item.kodeAkun ? 0 : Number(jurnal.nominalDebet || 0);
  //       const adjustedNominalKredit =
  //         jurnal.kodeAkunDebet === item.kodeAkun ? 0 : Number(jurnal.nominalKredit || 0);
  //       return saldo + adjustedNominalDebet - adjustedNominalKredit;
  //     }, Number(item.saldoAwal || 0));

  //   return total + (item.saldoAwalKredit?.[filterDate] == 0 ? 0 : Math.abs(Number(saldoAkhirAkun) - Number(item.saldoAwalKredit?.[filterDate])));
  // }, 0);

  const totalSaldoDebit = dataAkun.reduce((total, item) => {
    const saldoAkhirAkun = dataJurnal
      .filter(
        (jurnal) =>
          (jurnal.kodeAkunDebet === item.kodeAkun || jurnal.kodeAkunKredit === item.kodeAkun)
          && (!filterDate || jurnal.tanggal.startsWith(filterDate))
      )
      .reduce((saldo, jurnal) => {
        const adjustedNominalDebet =
          jurnal.kodeAkunKredit === item.kodeAkun ? 0 : Number(jurnal.nominalDebet || 0);
        const adjustedNominalKredit =
          jurnal.kodeAkunDebet === item.kodeAkun ? 0 : Number(jurnal.nominalKredit || 0);
        return saldo + adjustedNominalDebet - adjustedNominalKredit;
      }, Number(item.saldoAwal || 0));

    const saldoDebit = (!item.saldoAwalDebit?.[filterDate] && !item.saldoAwalKredit?.[filterDate])
      ? saldoAkhirAkun >= 0 ? saldoAkhirAkun : 0
      : (!item.saldoAwalDebit?.[filterDate] ? 0 : (saldoAkhirAkun + Number(item.saldoAwalDebit?.[filterDate])));

    return total + saldoDebit;
  }, 0);

  const totalSaldoKredit = dataAkun.reduce((total, item) => {
    const saldoAkhirAkun = dataJurnal
      .filter(
        (jurnal) =>
          (jurnal.kodeAkunDebet === item.kodeAkun || jurnal.kodeAkunKredit === item.kodeAkun)
          && (!filterDate || jurnal.tanggal.startsWith(filterDate))
      )
      .reduce((saldo, jurnal) => {
        const adjustedNominalDebet =
          jurnal.kodeAkunKredit === item.kodeAkun ? 0 : Number(jurnal.nominalDebet || 0);
        const adjustedNominalKredit =
          jurnal.kodeAkunDebet === item.kodeAkun ? 0 : Number(jurnal.nominalKredit || 0);
        return saldo + adjustedNominalDebet - adjustedNominalKredit;
      }, Number(item.saldoAwal || 0));

    const saldoKredit = (!item.saldoAwalDebit?.[filterDate] && !item.saldoAwalKredit?.[filterDate])
      ? saldoAkhirAkun < 0 ? saldoAkhirAkun * -1 : 0
      : (!item.saldoAwalKredit?.[filterDate] ? 0 : ((saldoAkhirAkun - Number(item.saldoAwalKredit?.[filterDate])) * -1));

    return total + saldoKredit;
  }, 0);

  // const updateSaldoAwal = async () => {
  //   for (const item of dataAkun) {
  //     // Menghitung saldoAkhirAkun untuk setiap item berdasarkan jurnal
  //     const saldoAkhirAkun = dataJurnal
  //       .filter(
  //         (jurnal) =>
  //           (jurnal.kodeAkunDebet === item.kodeAkun || jurnal.kodeAkunKredit === item.kodeAkun) &&
  //           (!filterDate || jurnal.tanggal.startsWith(filterDate)) // Filter berdasarkan tanggal
  //       )
  //       .reduce((saldo, jurnal) => {
  //         const adjustedNominalDebet =
  //           jurnal.kodeAkunKredit === item.kodeAkun ? 0 : Number(jurnal.nominalDebet || 0);
  //         const adjustedNominalKredit =
  //           jurnal.kodeAkunDebet === item.kodeAkun ? 0 : Number(jurnal.nominalKredit || 0);
  //         return saldo + adjustedNominalDebet - adjustedNominalKredit;
  //       }, Number(item.saldoAwal || 0)); // saldoAwal

  //     // Menghitung saldo baru untuk bulan berikutnya
  //     const saldoDebitNextMonth = !item.saldoAwalDebit?.[filterDate]
  //       ? saldoAkhirAkun
  //       : Number(saldoAkhirAkun) + Number(item.saldoAwalDebit?.[filterDate]);
  //     const saldoKreditNextMonth = !item.saldoAwalKredit?.[filterDate]
  //       ? saldoAkhirAkun * -1
  //       : (Number(saldoAkhirAkun) - Number(item.saldoAwalKredit?.[filterDate])) * -1;

  //     // Update saldoAwalDebit["2025-03"] dan saldoAwalKredit["2025-03"] di koleksi Akun
  //     try {
  //       await updateDoc(doc(db, 'Akun', item.id), {
  //         [`saldoAwalDebit.${moment(filterDate, 'YYYY-MM').add(1, 'months').format('YYYY-MM')}`]: saldoDebitNextMonth,
  //         [`saldoAwalKredit.${moment(filterDate, 'YYYY-MM').add(1, 'months').format('YYYY-MM')}`]: saldoKreditNextMonth,
  //       });
  //     } catch (error) {
  //       console.error('Error updating saldo:', error);
  //     }
  //   }
  // };

  // const updateSaldoAwal = async () => {
  //   const nextMonth = moment(filterDate, "YYYY-MM").add(1, "months").format("YYYY-MM"); // Bulan berikutnya

  //   for (const item of dataAkun) {
  //     // Menghitung saldoAkhirAkun berdasarkan jurnal yang terkait dengan akun
  //     const saldoAkhirAkun = dataJurnal
  //       .filter(
  //         (jurnal) =>
  //           (jurnal.kodeAkunDebet === item.kodeAkun || jurnal.kodeAkunKredit === item.kodeAkun) &&
  //           (!filterDate || jurnal.tanggal.startsWith(filterDate))
  //       )
  //       .reduce((saldo, jurnal) => {
  //         const adjustedNominalDebet =
  //           jurnal.kodeAkunKredit === item.kodeAkun ? 0 : Number(jurnal.nominalDebet || 0);
  //         const adjustedNominalKredit =
  //           jurnal.kodeAkunDebet === item.kodeAkun ? 0 : Number(jurnal.nominalKredit || 0);
  //         return saldo + adjustedNominalDebet - adjustedNominalKredit;
  //       }, Number(item.saldoAwal || 0)); // Gunakan saldoAwal sebagai saldo awal perhitungan

  //     // Menghitung saldoAwalDebit dan saldoAwalKredit untuk bulan berikutnya
  //     const saldoAwalDebitNext =
  //       !item.saldoAwalDebit?.[filterDate] && !item.saldoAwalKredit?.[filterDate]
  //         ? saldoAkhirAkun >= 0
  //           ? saldoAkhirAkun
  //           : 0
  //         : Number(saldoAkhirAkun) + Number(item.saldoAwalDebit?.[filterDate] || 0);

  //     const saldoAwalKreditNext =
  //       !item.saldoAwalDebit?.[filterDate] && !item.saldoAwalKredit?.[filterDate]
  //         ? saldoAkhirAkun < 0
  //           ? saldoAkhirAkun * -1
  //           : 0
  //         : (Number(saldoAkhirAkun) - Number(item.saldoAwalKredit?.[filterDate] || 0)) * -1;

  //     // Update Firestore
  //     try {
  //       await updateDoc(doc(db, "Akun", item.id), {
  //         [`saldoAwalDebit.${nextMonth}`]: saldoAwalDebitNext,
  //         [`saldoAwalKredit.${nextMonth}`]: saldoAwalKreditNext,
  //       });
  //       console.log(`Saldo awal akun ${item.kodeAkun} berhasil diperbarui.`);
  //     } catch (error) {
  //       console.error(`Gagal memperbarui saldo awal akun ${item.kodeAkun}:`, error);
  //     }
  //   }
  // };

  // const updateSaldoAwal = async () => {
  //   const nextMonth = moment(filterDate, "YYYY-MM").add(1, "months").format("YYYY-MM");

  //   for (const item of dataAkun) {
  //     // Menghitung saldoAkhirAkun berdasarkan jurnal
  //     const saldoAkhirAkun = dataJurnal
  //       .filter(
  //         (jurnal) =>
  //           (jurnal.kodeAkunDebet === item.kodeAkun || jurnal.kodeAkunKredit === item.kodeAkun) &&
  //           (!filterDate || jurnal.tanggal.startsWith(filterDate))
  //       )
  //       .reduce((saldo, jurnal) => {
  //         const adjustedNominalDebet =
  //           jurnal.kodeAkunKredit === item.kodeAkun ? 0 : Number(jurnal.nominalDebet || 0);
  //         const adjustedNominalKredit =
  //           jurnal.kodeAkunDebet === item.kodeAkun ? 0 : Number(jurnal.nominalKredit || 0);
  //         return saldo + adjustedNominalDebet - adjustedNominalKredit;
  //       }, Number(item.saldoAwal || 0));

  //     // Mengecek apakah saldoAwalDebit dan saldoAwalKredit bulan ini ada
  //     const hasSaldoAwal = item.saldoAwalDebit?.[filterDate] || item.saldoAwalKredit?.[filterDate];

  //     // Menentukan saldoAwalDebit bulan berikutnya
  //     const saldoAwalDebitNext = !hasSaldoAwal
  //       ? saldoAkhirAkun >= 0
  //         ? saldoAkhirAkun
  //         : 0
  //       : (Number(saldoAkhirAkun) + Number(item.saldoAwalDebit?.[filterDate] || 0));

  //     // Menentukan saldoAwalKredit bulan berikutnya
  //     const saldoAwalKreditNext = !hasSaldoAwal
  //       ? saldoAkhirAkun < 0
  //         ? saldoAkhirAkun * -1
  //         : 0
  //       : (Number(saldoAkhirAkun) - Number(item.saldoAwalKredit?.[filterDate] || 0)) * -1;

  //     // Update Firestore
  //     try {
  //       await updateDoc(doc(db, "Akun", item.id), {
  //         [`saldoAwalDebit.${nextMonth}`]: saldoAwalDebitNext,
  //         [`saldoAwalKredit.${nextMonth}`]: saldoAwalKreditNext,
  //       });
  //       console.log(`Saldo awal akun ${item.kodeAkun} berhasil diperbarui untuk ${nextMonth}`);
  //     } catch (error) {
  //       console.error(`Gagal memperbarui saldo awal akun ${item.kodeAkun}:`, error);
  //     }
  //   }
  // };



  // const updateSaldoAwal = async () => {
  //   const nextMonth = moment(filterDate, "YYYY-MM").add(1, "months").format("YYYY-MM");

  //   for (const item of dataAkun) {
  //     // Hitung saldoAkhirAkun berdasarkan transaksi jurnal
  //     const saldoAkhirAkun = dataJurnal
  //       .filter(
  //         (jurnal) =>
  //           (jurnal.kodeAkunDebet === item.kodeAkun || jurnal.kodeAkunKredit === item.kodeAkun) &&
  //           (!filterDate || jurnal.tanggal.startsWith(filterDate))
  //       )
  //       .reduce((saldo, jurnal) => {
  //         const adjustedNominalDebet =
  //           jurnal.kodeAkunKredit === item.kodeAkun ? 0 : Number(jurnal.nominalDebet || 0);
  //         const adjustedNominalKredit =
  //           jurnal.kodeAkunDebet === item.kodeAkun ? 0 : Number(jurnal.nominalKredit || 0);
  //         return saldo + adjustedNominalDebet - adjustedNominalKredit;
  //       }, Number(item.saldoAwal || 0));

  //     // Hitung saldo awal bulan berikutnya
  //     let saldoAwalDebitNext = 0;
  //     let saldoAwalKreditNext = 0;

  //     if (saldoAkhirAkun >= 0) {
  //       saldoAwalDebitNext = saldoAkhirAkun; // Hanya isi debit jika positif
  //       saldoAwalKreditNext = 0;
  //     } else {
  //       saldoAwalDebitNext = 0;
  //       saldoAwalKreditNext = Math.abs(saldoAkhirAkun); // Hanya isi kredit jika negatif
  //     }

  //     // Update Firestore
  //     try {
  //       await updateDoc(doc(db, "Akun", item.id), {
  //         [`saldoAwalDebit.${nextMonth}`]: saldoAwalDebitNext,
  //         [`saldoAwalKredit.${nextMonth}`]: saldoAwalKreditNext,
  //       });
  //       console.log(`Saldo awal akun ${item.kodeAkun} berhasil diperbarui untuk ${nextMonth}`);
  //     } catch (error) {
  //       console.error(`Gagal memperbarui saldo awal akun ${item.kodeAkun}:`, error);
  //     }
  //   }
  // };


  // const updateSaldoAwal = async () => {
  //   const nextMonth = moment(filterDate, "YYYY-MM").add(1, "months").format("YYYY-MM");

  //   for (const item of dataAkun) {
  //     // Ambil saldo awal dari bulan sebelumnya (filterDate)
  //     const saldoAwalDebit = Number(item.saldoAwalDebit?.[filterDate] || 0);
  //     const saldoAwalKredit = Number(item.saldoAwalKredit?.[filterDate] || 0);

  //     // Hitung saldoAkhirAkun berdasarkan transaksi jurnal
  //     const saldoAkhirAkun = dataJurnal
  //       .filter(
  //         (jurnal) =>
  //           (jurnal.kodeAkunDebet === item.kodeAkun || jurnal.kodeAkunKredit === item.kodeAkun) &&
  //           (!filterDate || jurnal.tanggal.startsWith(filterDate))
  //       )
  //       .reduce((saldo, jurnal) => {
  //         const adjustedNominalDebet =
  //           jurnal.kodeAkunKredit === item.kodeAkun ? 0 : Number(jurnal.nominalDebet || 0);
  //         const adjustedNominalKredit =
  //           jurnal.kodeAkunDebet === item.kodeAkun ? 0 : Number(jurnal.nominalKredit || 0);
  //         return saldo + adjustedNominalDebet - adjustedNominalKredit;
  //       }, saldoAwalDebit - saldoAwalKredit);

  //     // Perhitungan sesuai tabel:
  //     let saldoAwalDebitNext = saldoAkhirAkun >= 0
  //       ? saldoAkhirAkun + saldoAwalDebit
  //       : 0;

  //     let saldoAwalKreditNext = saldoAkhirAkun < 0
  //       ? Math.abs(saldoAkhirAkun - saldoAwalKredit)
  //       : 0;

  //     // Update Firestore
  //     try {
  //       await updateDoc(doc(db, "Akun", item.id), {
  //         [`saldoAwalDebit.${nextMonth}`]: saldoAwalDebitNext,
  //         [`saldoAwalKredit.${nextMonth}`]: saldoAwalKreditNext,
  //       });
  //       console.log(`Saldo awal akun ${item.kodeAkun} berhasil diperbarui untuk ${nextMonth}`);
  //     } catch (error) {
  //       console.error(`Gagal memperbarui saldo awal akun ${item.kodeAkun}:`, error);
  //     }
  //   }
  // };


  // const updateSaldoAwal = async () => {
  //   if (!filterDate) return;

  //   const nextMonth = moment(filterDate, "YYYY-MM").add(1, "months").format("YYYY-MM");

  //   try {
  //     for (const item of dataAkun) {
  //       // Hitung saldoAkhirAkun dengan cara yang SAMA PERSIS seperti tabel
  //       const saldoAkhirAkun = dataJurnal
  //         .filter(
  //           (jurnal) =>
  //             (jurnal.kodeAkunDebet === item.kodeAkun || jurnal.kodeAkunKredit === item.kodeAkun) &&
  //             jurnal.tanggal.startsWith(filterDate)
  //         )
  //         .reduce((saldo, jurnal) => {
  //           const adjustedNominalDebet =
  //             jurnal.kodeAkunKredit === item.kodeAkun ? 0 : Number(jurnal.nominalDebet || 0);
  //           const adjustedNominalKredit =
  //             jurnal.kodeAkunDebet === item.kodeAkun ? 0 : Number(jurnal.nominalKredit || 0);
  //           return saldo + adjustedNominalDebet - adjustedNominalKredit;
  //         }, Number(item.saldoAwal || 0));

  //       // **Pastikan hanya 1 yang terisi (debit/kredit)**
  //       let saldoBaruDebit = 0;
  //       let saldoBaruKredit = 0;

  //       if (!item.saldoAwalDebit?.[filterDate] && !item.saldoAwalKredit?.[filterDate]) {
  //         if (saldoAkhirAkun >= 0) {
  //           saldoBaruDebit = saldoAkhirAkun;
  //         } else {
  //           saldoBaruKredit = saldoAkhirAkun * -1;
  //         }
  //       } else {
  //         saldoBaruDebit = item.saldoAwalDebit?.[filterDate]
  //           ? saldoAkhirAkun + Number(item.saldoAwalDebit?.[filterDate])
  //           : 0;
  //         saldoBaruKredit = item.saldoAwalKredit?.[filterDate]
  //           ? (saldoAkhirAkun - Number(item.saldoAwalKredit?.[filterDate])) * -1
  //           : 0;
  //       }

  //       // **Update Firestore dengan format yang SAMA seperti tabel**
  //       const akunRef = doc(db, "Akun", item.id);
  //       await updateDoc(akunRef, {
  //         [`saldoAwalDebit.${nextMonth}`]: saldoBaruDebit || 0,
  //         [`saldoAwalKredit.${nextMonth}`]: saldoBaruKredit || 0,
  //       });
  //       console.log(`Saldo awal akun ${item.kodeAkun} berhasil diperbarui untuk ${nextMonth}`);
  //     }

  //     alert("Saldo awal berhasil diperbarui!");
  //   } catch (error) {
  //     console.error("Error updating saldo awal:", error);
  //     alert("Terjadi kesalahan saat update saldo awal.");
  //   }
  // };

  const updateSaldoAwal = async () => {
    if (!filterDate) return;

    messageApi.open({
      type: 'loading',
      content: 'Sedang mengupdate saldo awal...',
      duration: 0,
      key: 'saldoAwalUpdate',
    });

    try {
      const response = await fetch(`${baseUrl}/akun/updateSaldoAwal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filterDate }), // hanya kirim filterDate
      });

      const result = await response.json();

      if (response.ok) {
        messageApi.success({
          content: result.message,
          key: 'saldoAwalUpdate',
        });
      } else {
        messageApi.error({
          content: result.message || 'Gagal update saldo awal',
          key: 'saldoAwalUpdate',
        });
      }
    } catch (error) {
      console.error(error);
      messageApi.error({
        content: 'Terjadi kesalahan saat update saldo awal.',
        key: 'saldoAwalUpdate',
      });
    }
  };




  return (
    <>
      {contextHolder}
      <Container>
        <div className='mt-4 px-4'>
          <div className='row'>
            <div className='col d-flex justify-content-between'>
              <Dropdown>
                <Dropdown.Toggle variant="light" id="dropdown-basic" className="text-sm px-2 py-1" style={{ border: "1px solid blue", borderRadius: "5px", color: "blue" }}>
                  Neraca Saldo
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/accounting/akun" className="dropdown-link">
                    Akun & Saldo Awal
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/customer" className="dropdown-link">
                    Customer
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/supplier" className="dropdown-link">
                    Supplier
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/aset" className="dropdown-link">
                    Aset
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/buku-besar" className="dropdown-link">
                    Buku Besar
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/neraca-saldo" className="dropdown-link" style={{ color: "blue" }}>
                    Neraca Saldo
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/laba-rugi-penjualan" className="dropdown-link">
                    Laba - Rugi Penjualan
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/laba-rugi-cash" className="dropdown-link">
                    Laba - Rugi Cash
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/laba-rugi-profit" className="dropdown-link">
                    Laba - Rugi Profit
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/jurnal" className="dropdown-link">
                    Jurnal
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/balance-sheet" className="dropdown-link">
                    Balance Sheet
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/jurnal-penyesuaian" className="dropdown-link">
                    Jurnal Penyesuaian
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/cash-flow" className="dropdown-link">
                    Cash Flow
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/piutang" className="dropdown-link">
                    Piutang
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/hutang" className="dropdown-link">
                    Hutang
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>

              <div>
                <DatePicker picker="month" style={{ borderColor: 'blue', color: 'blue' }}
                  onChange={(date) => setFilterDate(date ? date.format("YYYY-MM") : null)}
                />
                <button className="btn btn-primary btn-sm rounded-pill" style={{ marginLeft: "5px" }}
                  onClick={() => {
                    if (!filterDate) {
                      // alert("Silakan pilih bulan terlebih dahulu")
                      messageApi.error(`Silakan pilih bulan terlebih dahulu`);
                    } else {
                      setShowGenerateSaldoAwalModal(true);
                    }
                  }}>
                  <LuWorkflow size={17} />
                </button>

              </div>
              {/* <MdFormatListBulletedAdd size={25} onClick={() => { setShowTambahDataModal(true); refreshData(); }} /> */}
            </div>
          </div>
        </div>


        <div style={{ ...tableContainerStyle, maxHeight: '75vh', overflowY: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>No</th>
                <th style={thStyle}>Kode Akun</th>
                <th style={thStyle}>Nama Akun</th>
                <th style={thStyle}>Jenis Akun</th>
                <th style={thStyle}>JP</th>

                {/* Kolom Saldo Awal */}
                {isSaldoAkhir && (
                  <th colSpan={2} style={thStyle}>
                    <div
                      style={{
                        opacity: animasiSaldoAwal ? 1 : 0, // Fade-in animasi
                        visibility: animasiSaldoAwal ? 'visible' : 'hidden',
                        transition: 'opacity 0.5s ease, visibility 0.5s ease',
                      }}>
                      Saldo Akhir
                    </div>
                  </th>
                )}

                {/* Kolom Debit dan Kredit */}
                {!isSaldoAkhir && (
                  <>
                    <th style={thStyle}>
                      <div
                        style={{
                          opacity: animasiDebitKredit ? 1 : 0, // Fade-in animasi
                          visibility: animasiDebitKredit ? 'visible' : 'hidden',
                          transition: 'opacity 0.5s ease, visibility 0.5s ease',
                        }}>
                        Debit
                      </div>
                    </th>
                    <th style={thStyle}>
                      <div
                        style={{
                          opacity: animasiDebitKredit ? 1 : 0, // Fade-in animasi
                          visibility: animasiDebitKredit ? 'visible' : 'hidden',
                          transition: 'opacity 0.5s ease, visibility 0.5s ease',
                        }}>
                        Kredit
                      </div>
                    </th>
                  </>
                )}
              </tr>

            </thead>
            <tbody style={{ display: filterDate ? "none" : "" }}>
              <tr style={{ backgroundColor: '#ffffff' }} className='fw-semibold'>
                <td style={thTdStyle} colSpan={5}>Total : </td>
                <td style={thTdStyle}>Rp. {(0).toLocaleString('id-ID')}{'\u00a0\u00a0\u00a0\u00a0'}</td>
                <td style={thTdStyle}>Rp. {(0).toLocaleString('id-ID')}{'\u00a0\u00a0\u00a0\u00a0'}</td>
              </tr>
            </tbody>

            <tbody style={{ display: filterDate ? "" : "none" }}>
              {dataAkun.map((item, index) => {
                const saldoAkhirAkun = dataJurnal
                  .filter(
                    (jurnal) =>
                      (jurnal.kodeAkunDebet === item.kodeAkun || jurnal.kodeAkunKredit === item.kodeAkun)
                      && (!filterDate || jurnal.tanggal.startsWith(filterDate)) // Tambahkan filter tanggal jika filterDate ada
                  )
                  .reduce((saldo, jurnal) => {
                    const adjustedNominalDebet =
                      jurnal.kodeAkunKredit === item.kodeAkun ? 0 : Number(jurnal.nominalDebet || 0);
                    const adjustedNominalKredit =
                      jurnal.kodeAkunDebet === item.kodeAkun ? 0 : Number(jurnal.nominalKredit || 0);
                    return saldo + adjustedNominalDebet - adjustedNominalKredit;
                  }, Number(item.saldoAwal || 0)); // Pastikan setiap akun punya saldoAwal

                return (
                  <tr key={index} style={index % 2 === 0 ? tbodyTrEvenStyle : tbodyTrOddStyle}>
                    <td style={thTdStyle} className='text-center'>{index + 1}</td>
                    <td style={thTdStyle}>{item.kodeAkun}</td>
                    <td style={thTdStyle}>{item.namaAkun}</td>
                    <td style={thTdStyle}>{item.jenisAkun}</td>
                    <td style={thTdStyle} className="text-center">{item.jurnalPenutup}</td>
                    {/* <td style={thTdStyle}>
                      Rp. {item.saldoAwalDebit?.[filterDate] == 0 ? '0' : (Number(saldoAkhirAkun) + Number(item.saldoAwalDebit?.[filterDate])).toLocaleString('id-ID')}
                    </td>
                    <td style={thTdStyle}>
                      Rp. {item.saldoAwalKredit?.[filterDate] == 0 ? '0' : ((Number(saldoAkhirAkun) - Number(item.saldoAwalKredit?.[filterDate]))*-1).toLocaleString('id-ID')}
                    </td> */}
                    <td style={thTdStyle}>
                      {(!item.saldoAwalDebit?.[filterDate] && !item.saldoAwalKredit?.[filterDate]) ? (
                        saldoAkhirAkun >= 0 ? `Rp. ${Number(saldoAkhirAkun).toLocaleString('id-ID')}` : 'Rp. 0'
                      ) : (
                        `Rp. ${(!item.saldoAwalDebit?.[filterDate] ? '0' : (Number(saldoAkhirAkun) + Number(item.saldoAwalDebit?.[filterDate]))).toLocaleString('id-ID')}`
                      )}
                    </td>
                    <td style={thTdStyle}>
                      {(!item.saldoAwalDebit?.[filterDate] && !item.saldoAwalKredit?.[filterDate]) ? (
                        saldoAkhirAkun < 0 ? `Rp. ${(Number(saldoAkhirAkun) * -1).toLocaleString('id-ID')}` : 'Rp. 0'
                      ) : (
                        `Rp. ${(!item.saldoAwalKredit?.[filterDate] ? '0' : ((Number(saldoAkhirAkun) - Number(item.saldoAwalKredit?.[filterDate])) * -1)).toLocaleString('id-ID')}`
                      )}
                    </td>


                    {/* <td style={thTdStyle}>
                      Rp. {(Number(saldoAkhirAkun) + Number(item.saldoAwalDebit?.[filterDate])).toLocaleString('id-ID')}
                    </td>
                    <td style={thTdStyle}>
                      Rp. {(Number(saldoAkhirAkun) + Number(item.saldoAwalKredit?.[filterDate])).toLocaleString('id-ID')}
                    </td> */}
                  </tr>
                );
              })}

              <tr style={{ backgroundColor: '#E7E7E8' }} className='fw-semibold'>
                <td style={thTdStyle} colSpan={5}>Total : </td>
                <td style={thTdStyle}>Rp. {totalSaldoDebit.toLocaleString('id-ID')}</td>
                <td style={thTdStyle}>Rp. {totalSaldoKredit.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Modal */}
        <Modal show={showGenerateSaldoAwalModal} onHide={() => setShowGenerateSaldoAwalModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Generate Saldo Awal</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              Apakah Anda yakin ingin menggenerate saldo awal untuk bulan{" "}
              <strong>{moment(filterDate, "YYYY-MM").add(1, "months").format("MMMM YYYY")}</strong>?
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="primary"
              // disabled={user.uid !== "fYpdHwXRDLhj5XGxM5FZIAvxp9E2"}
              onClick={() => {
                setShowGenerateSaldoAwalModal(false);

                const allowedUIDs = [
                  "fYpdHwXRDLhj5XGxM5FZIAvxp9E2",
                  "w4M5JJjgGQeHFbS2nkyoCfUBE532",
                ];

                if (!allowedUIDs.includes(user.uid)) {
                  messageApi.error(`Anda tidak memiliki hak untuk menggenerate saldo awal`);
                } else {
                  updateSaldoAwal();
                }
              }}

            >
              Generate
            </Button>
          </Modal.Footer>
        </Modal>


        {/* End Modal */}

      </Container>
    </>
  );
};

export default Jurnal;
