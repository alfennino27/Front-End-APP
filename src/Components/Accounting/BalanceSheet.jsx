import React, { useRef, useEffect, useState } from 'react';
import { Col, Row, Modal, Button, Container, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useNavigate } from 'react-router-dom';
import { FaPaste } from 'react-icons/fa';
import { DatePicker, Space } from 'antd';
import { format } from 'date-fns';
import '../Accounting/Accounting.css';


const BalanceSheet = () => {
  const baseUrl = getApiBaseUrl();
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


  const [showTambahDataModal, setShowTambahDataModal] = useState(false);
  const [showEditDataModal, setShowEditDataModal] = useState(false);


  const [dataInvoice, setDataInvoice] = useState([]);
  const [dataInvoicePengeluaran, setDataInvoicePengeluaran] = useState([]);
  const [dataProject, setDataProject] = useState([]);
  const [dataSPKProduct, setDataSPKProduct] = useState([]);
  const [dataJurnal, setDataJurnal] = useState([]);
  const [dataAkun, setDataAkun] = useState([]);
  const [dataPiutang, setDataPiutang] = useState([]);
  const [dataPiutangItem, setDataPiutangItem] = useState([]);
  const [dataPiutangPayment, setDataPiutangPayment] = useState([]);
  const [dataHutang, setDataHutang] = useState([]);
  const [dataHutangItem, setDataHutangItem] = useState([]);
  const [dataHutangPayment, setDataHutangPayment] = useState([]);

  const tableContainerStyle = {
    marginLeft: '20px',
    marginRight: '20px',
    marginTop: '-10px',
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

  const tbodyTrTotalStyle = {
    backgroundColor: '#E7E7E8',
  };

  const tbodyTrLastChildTdFirstChildStyle = {
    borderBottomLeftRadius: '10px',
  };

  const tbodyTrLastChildTdLastChildStyle = {
    borderBottomRightRadius: '10px',
  };


  const fetchDataJurnal = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/jurnal/get`);
      if (!res.ok) throw new Error("Gagal ambil data jurnal");
      const data = await res.json();
      setDataJurnal(data);
    } catch (err) {
      console.error("Error fetchDataJurnal:", err);
    }
  };
  
  const fetchDataAkun = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/akun/get`);
      if (!res.ok) throw new Error("Gagal ambil data akun");
      const data = await res.json();
      setDataAkun(data);
    } catch (err) {
      console.error("Error fetchDataAkun:", err);
    }
  };
  
  const fetchDataInvoice = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/invoice/get`);
      if (!res.ok) throw new Error("Gagal ambil data invoice");
      const data = await res.json();
      setDataInvoice(data);
    } catch (err) {
      console.error("Error fetchDataInvoice:", err);
    }
  };
  
  const fetchDataInvoicePengeluaran = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/invoicePengeluaran/get`);
      if (!res.ok) throw new Error("Gagal ambil data invoice pengeluaran");
      const data = await res.json();
      setDataInvoicePengeluaran(data);
    } catch (err) {
      console.error("Error fetchDataInvoicePengeluaran:", err);
    }
  };
  
  const fetchDataProject = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/project/get`);
      if (!res.ok) throw new Error("Gagal ambil data project");
      const data = await res.json();
      setDataProject(data);
    } catch (err) {
      console.error("Error fetchDataProject:", err);
    }
  };
  
  const fetchDataSPKProduct = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/spk/get`);
      if (!res.ok) throw new Error("Gagal ambil data SPK product");
      const data = await res.json();
      setDataSPKProduct(data);
    } catch (err) {
      console.error("Error fetchDataSPKProduct:", err);
    }
  };
  
  const fetchDataPiutang = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/piutang/get`);
      if (!res.ok) throw new Error("Gagal ambil data piutang");
      const data = await res.json();
      setDataPiutang(data);
    } catch (err) {
      console.error("Error fetchDataPiutang:", err);
    }
  };
  
  const fetchDataPiutangItem = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/piutangItem/get`);
      if (!res.ok) throw new Error("Gagal ambil data piutang item");
      const data = await res.json();
      setDataPiutangItem(data);
    } catch (err) {
      console.error("Error fetchDataPiutangItem:", err);
    }
  };
  
  const fetchDataPiutangPayment = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/piutangPayment/get`);
      if (!res.ok) throw new Error("Gagal ambil data piutang payment");
      const data = await res.json();
      setDataPiutangPayment(data);
    } catch (err) {
      console.error("Error fetchDataPiutangPayment:", err);
    }
  };
  
  const fetchDataHutang = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/hutang/get`);
      if (!res.ok) throw new Error("Gagal ambil data hutang");
      const data = await res.json();
      setDataHutang(data);
    } catch (err) {
      console.error("Error fetchDataHutang:", err);
    }
  };
  
  const fetchDataHutangItem = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/hutangItem/get`);
      if (!res.ok) throw new Error("Gagal ambil data hutang item");
      const data = await res.json();
      setDataHutangItem(data);
    } catch (err) {
      console.error("Error fetchDataHutangItem:", err);
    }
  };
  
  const fetchDataHutangPayment = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/hutangPayment/get`);
      if (!res.ok) throw new Error("Gagal ambil data hutang payment");
      const data = await res.json();
      setDataHutangPayment(data);
    } catch (err) {
      console.error("Error fetchDataHutangPayment:", err);
    }
  };
  

  useEffect(() => {
    fetchDataJurnal();
    fetchDataAkun();
    fetchDataInvoice();
    fetchDataInvoicePengeluaran();
    fetchDataProject();
    fetchDataSPKProduct();
    fetchDataPiutang();
    fetchDataPiutangItem();
    fetchDataPiutangPayment();
    fetchDataHutang();
    fetchDataHutangItem();
    fetchDataHutangPayment();
  }, []);

  let grandTotalPiutang = 0;
  let grandTotalSisaPiutang = 0;

  let grandTotalHutang = 0;
  let grandTotalSisaHutang = 0;

  const [filterDate, setFilterDate] = useState(null);

  const handleDateChange = (date, dateString) => {
    setFilterDate(dateString); // Format dateString: "YYYY-MM"
  };

  const filteredInvoices = dataInvoice.filter(item => {
    if (!filterDate) return true; // Jika tidak ada filter, tampilkan semua
    const [year, month] = filterDate.split('-');
    const itemYearMonth = item.tanggalMulaiInvoice.substring(0, 7); // Ambil "YYYY-MM"
    return itemYearMonth === `${year}-${month}`;
  });

  const totalAset =
    dataAkun
      .filter((item) => item.jenisAkun === "Aset Lancar")
      .reduce((total, item) => {
        const saldoAwal = Number(item.saldoAwalDebit?.[filterDate] || 0) || Number(item.saldoAwalKredit?.[filterDate] || 0);
        const saldoAkhir = dataJurnal
          .filter(jurnal => {
            const isKodeAkunMatched =
              jurnal.kodeAkunDebet === item.kodeAkun || jurnal.kodeAkunKredit === item.kodeAkun;

            if (filterDate) {
              const [filterYear, filterMonth] = filterDate.split('-');
              const jurnalYearMonth = jurnal.tanggal.substring(0, 7); // Ambil "YYYY-MM"
              return isKodeAkunMatched && jurnalYearMonth === `${filterYear}-${filterMonth}`;
            }

            return isKodeAkunMatched;
          })
          .reduce((saldo, jurnal) => {
            const adjustedNominalDebet =
              jurnal.kodeAkunKredit === item.kodeAkun ? 0 : Number(jurnal.nominalDebet || 0);
            const adjustedNominalKredit =
              jurnal.kodeAkunDebet === item.kodeAkun ? 0 : Number(jurnal.nominalKredit || 0);
            return saldo + adjustedNominalDebet - adjustedNominalKredit;
          }, saldoAwal);

        return total + saldoAkhir;
      }, 0)
    + dataAkun
      .filter((item) => item.jenisAkun === "Aset Tetap")
      .reduce((total, item) => {
        const saldoAwal = Number(item.saldoAwalDebit?.[filterDate] || 0) || Number(item.saldoAwalKredit?.[filterDate] || 0);
        const saldoAkhir = dataJurnal
          .filter(jurnal => {
            const isKodeAkunMatched =
              jurnal.kodeAkunDebet === item.kodeAkun || jurnal.kodeAkunKredit === item.kodeAkun;

            if (filterDate) {
              const [filterYear, filterMonth] = filterDate.split('-');
              const jurnalYearMonth = jurnal.tanggal.substring(0, 7); // Ambil "YYYY-MM"
              return isKodeAkunMatched && jurnalYearMonth === `${filterYear}-${filterMonth}`;
            }

            return isKodeAkunMatched;
          })
          .reduce((saldo, jurnal) => {
            const adjustedNominalDebet =
              jurnal.kodeAkunKredit === item.kodeAkun ? 0 : Number(jurnal.nominalDebet || 0);
            const adjustedNominalKredit =
              jurnal.kodeAkunDebet === item.kodeAkun ? 0 : Number(jurnal.nominalKredit || 0);
            return saldo + adjustedNominalDebet - adjustedNominalKredit;
          }, saldoAwal);

        return total + saldoAkhir;
      }, 0)
    // Hitung totalSisa dari dataPiutang
    + dataPiutang
      .filter(item => format(new Date(item.tanggal), 'yyyy-MM') === filterDate)
      .reduce((totalSisa, item) => {
        const totalPiutang = dataPiutangItem
          .filter(piutangItem => piutangItem.idPiutang === item.id)
          .reduce((sum, current) => sum + Number(current.nominal), 0);

        const totalPayment = dataPiutangPayment
          .filter(payment => payment.idPiutang === item.id)
          .reduce((sum, current) => sum + Number(current.jumlah), 0);

        return totalSisa + (totalPiutang - totalPayment);
      }, 0);

  const totalHutang =
    dataAkun
      .filter((item) => item.jenisAkun === "Hutang Lancar")
      .reduce((total, item) => {
        const saldoAwal = Number(item.saldoAwalDebit?.[filterDate] || 0) || Number(item.saldoAwalKredit?.[filterDate] || 0);
        const saldoAkhir = dataJurnal
          .filter(jurnal => {
            const isKodeAkunMatched =
              jurnal.kodeAkunDebet === item.kodeAkun || jurnal.kodeAkunKredit === item.kodeAkun;

            if (filterDate) {
              const [filterYear, filterMonth] = filterDate.split('-');
              const jurnalYearMonth = jurnal.tanggal.substring(0, 7); // Ambil "YYYY-MM"
              return isKodeAkunMatched && jurnalYearMonth === `${filterYear}-${filterMonth}`;
            }

            return isKodeAkunMatched;
          })
          .reduce((saldo, jurnal) => {
            const adjustedNominalDebet =
              jurnal.kodeAkunKredit === item.kodeAkun ? 0 : Number(jurnal.nominalDebet || 0);
            const adjustedNominalKredit =
              jurnal.kodeAkunDebet === item.kodeAkun ? 0 : Number(jurnal.nominalKredit || 0);
            return saldo + adjustedNominalDebet - adjustedNominalKredit;
          }, saldoAwal);

        return total + saldoAkhir;
      }, 0)
    + dataAkun
      .filter((item) => item.jenisAkun === "Hutang Jangka Panjang")
      .reduce((total, item) => {
        const saldoAwal = Number(item.saldoAwalDebit?.[filterDate] || 0) || Number(item.saldoAwalKredit?.[filterDate] || 0);
        const saldoAkhir = dataJurnal
          .filter(jurnal => {
            const isKodeAkunMatched =
              jurnal.kodeAkunDebet === item.kodeAkun || jurnal.kodeAkunKredit === item.kodeAkun;

            if (filterDate) {
              const [filterYear, filterMonth] = filterDate.split('-');
              const jurnalYearMonth = jurnal.tanggal.substring(0, 7); // Ambil "YYYY-MM"
              return isKodeAkunMatched && jurnalYearMonth === `${filterYear}-${filterMonth}`;
            }

            return isKodeAkunMatched;
          })
          .reduce((saldo, jurnal) => {
            const adjustedNominalDebet =
              jurnal.kodeAkunKredit === item.kodeAkun ? 0 : Number(jurnal.nominalDebet || 0);
            const adjustedNominalKredit =
              jurnal.kodeAkunDebet === item.kodeAkun ? 0 : Number(jurnal.nominalKredit || 0);
            return saldo + adjustedNominalDebet - adjustedNominalKredit;
          }, saldoAwal);

        return total + saldoAkhir;
      }, 0)
    // Hitung totalSisa dari dataHutang
    + dataHutang
      .filter(item => format(new Date(item.tanggal), 'yyyy-MM') === filterDate)
      .reduce((totalSisa, item) => {
        const totalHutang = dataHutangItem
          .filter(hutangItem => hutangItem.idHutang === item.id)
          .reduce((sum, current) => sum + Number(current.nominal), 0);

        const totalPayment = dataHutangPayment
          .filter(payment => payment.idHutang === item.id)
          .reduce((sum, current) => sum + Number(current.jumlah), 0);

        return totalSisa + (totalHutang - totalPayment);
      }, 0);


  return (
    <>
      <Container>
        <div className='mt-4 px-4'>
          <div className='row'>
            <div className="col d-flex justify-content-between align-items-center">
              <Dropdown>
                <Dropdown.Toggle variant="light" id="dropdown-basic" className="text-sm px-2 py-1" style={{ border: "1px solid blue", borderRadius: "5px", color: "blue" }}>
                  Balance Sheet
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
                  <Dropdown.Item as={Link} to="/accounting/neraca-saldo" className="dropdown-link">
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
                  <Dropdown.Item as={Link} to="/accounting/balance-sheet" className="dropdown-link" style={{ color: "blue" }}>
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

              {/* <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap:"10px" }}> */}
              <p className='fw-semibold m-0 p-0'>Ekuitas : Rp.{" "} {!filterDate ? "0" : Number(totalAset - totalHutang).toLocaleString('id-ID')}</p>
              <DatePicker picker="month" style={{ borderColor: 'blue', color: 'blue' }} onChange={handleDateChange} />
              {/* </div> */}


            </div>


          </div>

        </div>
        <div className='d-flex justify-content-between'>
          {/* Bagian Kiri */}
          <div style={{ width: '49%' }}>
            <div className='mt-3' style={{ maxHeight: '77vh', overflowY: 'auto' }}>
              <p
                className='fw-semibold px-4 text-center'
                style={{
                  backgroundColor: "blue",
                  color: "white",
                  borderRadius: "20px",
                  position: "sticky",
                  top: 0,
                  zIndex: 10 // Supaya tetap di atas elemen lain
                }}
              >
                Aktiva
              </p>

              <p className='fw-semibold px-4'>Aset Lancar</p>
              <div style={{ ...tableContainerStyle, maxHeight: '60vh', overflowY: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>No</th>
                      <th style={thStyle}>Kode Akun</th>
                      <th style={thStyle}>Nama Akun</th>
                      <th style={thStyle}>Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataAkun
                      .filter((item) => item.jenisAkun === "Aset Lancar")
                      .map((item, index) => {
                        // Fungsi untuk menghitung saldo awal
                        const getSaldoAwal = (saldoAwalDebit, saldoAwalKredit) => {
                          const debit = Number(saldoAwalDebit || 0);
                          const kredit = Number(saldoAwalKredit || 0);
                          return debit || kredit; // Menggunakan saldoAwalDebit jika ada, jika tidak gunakan saldoAwalKredit
                        };

                        // Fungsi untuk menghitung saldo akhir
                        const calculateSaldoAkhir = (kodeAkun, saldoAwal) => {
                          return dataJurnal
                            .filter((jurnal) => {
                              // Filter berdasarkan kodeAkun
                              const isKodeAkunMatched =
                                jurnal.kodeAkunDebet === kodeAkun || jurnal.kodeAkunKredit === kodeAkun;

                              // Filter berdasarkan tanggal jika filterDate ada
                              if (filterDate) {
                                const [filterYear, filterMonth] = filterDate.split('-');
                                const jurnalYearMonth = jurnal.tanggal.substring(0, 7); // Ambil "YYYY-MM"
                                return isKodeAkunMatched && jurnalYearMonth === `${filterYear}-${filterMonth}`;
                              }

                              // Jika filterDate tidak ada, hanya cek kodeAkun
                              return isKodeAkunMatched;
                            })
                            .reduce((saldo, jurnal) => {
                              const adjustedNominalDebet =
                                jurnal.kodeAkunKredit === kodeAkun ? 0 : Number(jurnal.nominalDebet || 0);
                              const adjustedNominalKredit =
                                jurnal.kodeAkunDebet === kodeAkun ? 0 : Number(jurnal.nominalKredit || 0);
                              return saldo + adjustedNominalDebet - adjustedNominalKredit;
                            }, saldoAwal); // Memulai dengan saldo awal yang dihitung
                        };

                        // Hitung saldo awal
                        const saldoAwal = getSaldoAwal(item.saldoAwalDebit?.[filterDate], item.saldoAwalKredit?.[filterDate]);

                        // Hitung saldo akhir untuk akun ini
                        const saldoAkhir = calculateSaldoAkhir(item.kodeAkun, saldoAwal);

                        return (
                          <tr
                            key={index}
                            className='tr-hover-effect2'
                            style={{
                              ...((index % 2 === 0 ? tbodyTrEvenStyle : tbodyTrOddStyle) || {}),
                              display: !filterDate ? "none" : "",
                            }}
                          >
                            <td style={thTdStyle} className="text-center">
                              {index + 1}
                            </td>
                            <td style={thTdStyle}>{item.kodeAkun}</td>
                            <td style={thTdStyle}>{item.namaAkun}</td>
                            <td style={thTdStyle}>
                              Rp. {saldoAkhir.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        );
                      })}

                    <tr style={{ backgroundColor: '#E7E7E8' }} className='fw-semibold'>
                      <td style={thTdStyle} colSpan={3}>Total : </td>
                      <td style={thTdStyle}>
                        Rp.{" "}
                        {!filterDate
                          ? "0"
                          : dataAkun
                            .filter((item) => item.jenisAkun === "Aset Lancar")
                            .reduce((total, item) => {
                              const saldoAwal = Number(item.saldoAwalDebit?.[filterDate] || 0) || Number(item.saldoAwalKredit?.[filterDate] || 0);
                              const saldoAkhir = dataJurnal
                                .filter((jurnal) => {
                                  const isKodeAkunMatched =
                                    jurnal.kodeAkunDebet === item.kodeAkun || jurnal.kodeAkunKredit === item.kodeAkun;

                                  if (filterDate) {
                                    const [filterYear, filterMonth] = filterDate.split('-');
                                    const jurnalYearMonth = jurnal.tanggal.substring(0, 7); // Ambil "YYYY-MM"
                                    return isKodeAkunMatched && jurnalYearMonth === `${filterYear}-${filterMonth}`;
                                  }

                                  return isKodeAkunMatched;
                                })
                                .reduce((saldo, jurnal) => {
                                  const adjustedNominalDebet =
                                    jurnal.kodeAkunKredit === item.kodeAkun ? 0 : Number(jurnal.nominalDebet || 0);
                                  const adjustedNominalKredit =
                                    jurnal.kodeAkunDebet === item.kodeAkun ? 0 : Number(jurnal.nominalKredit || 0);
                                  return saldo + adjustedNominalDebet - adjustedNominalKredit;
                                }, saldoAwal);

                              return total + saldoAkhir;
                            }, 0).toLocaleString('id-ID')}
                      </td>
                    </tr>


                  </tbody>
                </table>


              </div>

              <p className='fw-semibold px-4 mt-4'>Aset Tetap</p>
              <div style={{ ...tableContainerStyle, maxHeight: '60vh', overflowY: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>No</th>
                      <th style={thStyle}>Kode Akun</th>
                      <th style={thStyle}>Nama Akun</th>
                      <th style={thStyle}>Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataAkun
                      .filter((item) => item.jenisAkun === "Aset Tetap")
                      .map((item, index) => {
                        // Fungsi untuk menghitung saldo awal
                        const getSaldoAwal = (saldoAwalDebit, saldoAwalKredit) => {
                          const debit = Number(saldoAwalDebit || 0);
                          const kredit = Number(saldoAwalKredit || 0);
                          return debit || kredit; // Menggunakan saldoAwalDebit jika ada, jika tidak gunakan saldoAwalKredit
                        };

                        // Fungsi untuk menghitung saldo akhir
                        const calculateSaldoAkhir = (kodeAkun, saldoAwal) => {
                          return dataJurnal
                            .filter((jurnal) => {
                              // Filter berdasarkan kodeAkun
                              const isKodeAkunMatched =
                                jurnal.kodeAkunDebet === kodeAkun || jurnal.kodeAkunKredit === kodeAkun;

                              // Filter berdasarkan tanggal jika filterDate ada
                              if (filterDate) {
                                const [filterYear, filterMonth] = filterDate.split('-');
                                const jurnalYearMonth = jurnal.tanggal.substring(0, 7); // Ambil "YYYY-MM"
                                return isKodeAkunMatched && jurnalYearMonth === `${filterYear}-${filterMonth}`;
                              }

                              // Jika filterDate tidak ada, hanya cek kodeAkun
                              return isKodeAkunMatched;
                            })
                            .reduce((saldo, jurnal) => {
                              const adjustedNominalDebet =
                                jurnal.kodeAkunKredit === kodeAkun ? 0 : Number(jurnal.nominalDebet || 0);
                              const adjustedNominalKredit =
                                jurnal.kodeAkunDebet === kodeAkun ? 0 : Number(jurnal.nominalKredit || 0);
                              return saldo + adjustedNominalDebet - adjustedNominalKredit;
                            }, saldoAwal); // Memulai dengan saldo awal yang dihitung
                        };

                        // Hitung saldo awal
                        const saldoAwal = getSaldoAwal(item.saldoAwalDebit?.[filterDate], item.saldoAwalKredit?.[filterDate]);

                        // Hitung saldo akhir untuk akun ini
                        const saldoAkhir = calculateSaldoAkhir(item.kodeAkun, saldoAwal);

                        return (
                          <tr
                            key={index}
                            style={{
                              ...((index % 2 === 0 ? tbodyTrEvenStyle : tbodyTrOddStyle) || {}),
                              display: !filterDate ? "none" : "",
                            }}
                            className='tr-hover-effect2'
                          >
                            <td style={thTdStyle} className="text-center">
                              {index + 1}
                            </td>
                            <td style={thTdStyle}>{item.kodeAkun}</td>
                            <td style={thTdStyle}>{item.namaAkun}</td>
                            <td style={thTdStyle}>
                              Rp. {saldoAkhir.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        );
                      })}

                    <tr style={{ backgroundColor: '#E7E7E8' }} className='fw-semibold'>
                      <td style={thTdStyle} colSpan={3}>Total : </td>
                      <td style={thTdStyle}>
                        Rp.{" "}
                        {!filterDate
                          ? "0"
                          : dataAkun
                            .filter((item) => item.jenisAkun === "Aset Tetap")
                            .reduce((total, item) => {
                              const saldoAwal = Number(item.saldoAwalDebit?.[filterDate] || 0) || Number(item.saldoAwalKredit?.[filterDate] || 0);
                              const saldoAkhir = dataJurnal
                                .filter((jurnal) => {
                                  const isKodeAkunMatched =
                                    jurnal.kodeAkunDebet === item.kodeAkun || jurnal.kodeAkunKredit === item.kodeAkun;

                                  if (filterDate) {
                                    const [filterYear, filterMonth] = filterDate.split('-');
                                    const jurnalYearMonth = jurnal.tanggal.substring(0, 7); // Ambil "YYYY-MM"
                                    return isKodeAkunMatched && jurnalYearMonth === `${filterYear}-${filterMonth}`;
                                  }

                                  return isKodeAkunMatched;
                                })
                                .reduce((saldo, jurnal) => {
                                  const adjustedNominalDebet =
                                    jurnal.kodeAkunKredit === item.kodeAkun ? 0 : Number(jurnal.nominalDebet || 0);
                                  const adjustedNominalKredit =
                                    jurnal.kodeAkunDebet === item.kodeAkun ? 0 : Number(jurnal.nominalKredit || 0);
                                  return saldo + adjustedNominalDebet - adjustedNominalKredit;
                                }, saldoAwal);

                              return total + saldoAkhir;
                            }, 0).toLocaleString('id-ID')}
                      </td>
                    </tr>


                  </tbody>
                </table>


              </div>

              <p className='fw-semibold px-4 mt-4'>Piutang Lain</p>
              <div style={{ ...tableContainerStyle, maxHeight: '60vh', overflowY: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>No</th>
                      <th style={thStyle}>Tanggal</th>
                      <th style={thStyle}>Nama</th>
                      <th style={thStyle}>Piutang</th>
                      <th style={thStyle}>Sisa</th>
                    </tr>
                  </thead>
                  <tbody>
                  {dataPiutang
  .filter(item => {
    const piutangDate = format(new Date(item.tanggal), 'yyyy-MM');
    if (piutangDate > filterDate) return false;

    const totalPiutang = dataPiutangItem
      .filter(piutangItem => piutangItem.idPiutang === item.id)
      .reduce((sum, current) => sum + Number(current.nominal), 0);

    const payments = dataPiutangPayment
      .filter(payment => payment.idPiutang === item.id)
      .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

    let totalPaid = 0;
    let bulanLunas = null;

    for (const payment of payments) {
      totalPaid += Number(payment.jumlah);
      if (totalPaid >= totalPiutang) {
        bulanLunas = format(new Date(payment.tanggal), 'yyyy-MM');
        break;
      }
    }

    if (bulanLunas && filterDate > bulanLunas) return false;

    return true;
  })
  .map((item, index) => {
    const totalPiutang = dataPiutangItem
      .filter(piutangItem => piutangItem.idPiutang === item.id)
      .reduce((sum, current) => sum + Number(current.nominal), 0);

    const totalPayment = dataPiutangPayment
      .filter(payment => 
        payment.idPiutang === item.id &&
        format(new Date(payment.tanggal), 'yyyy-MM') <= filterDate
      )
      .reduce((sum, current) => sum + Number(current.jumlah), 0);

    const totalSisa = totalPiutang - totalPayment;

    grandTotalPiutang += totalPiutang;
    grandTotalSisaPiutang += totalSisa;

    return (
      <tr
        key={index}
        style={index % 2 === 0 ? tbodyTrEvenStyle : tbodyTrOddStyle}
        className='tr-hover-effect2'
      >
        <td style={thTdStyle} className="text-center">{index + 1}</td>
        <td style={thTdStyle}>
          {format(new Date(item.tanggal), 'dd-MM-yyyy')}
        </td>
        <td style={thTdStyle}>{item.nama}</td>
        <td style={thTdStyle}>Rp. {totalPiutang.toLocaleString('id-ID')}</td>
        <td style={thTdStyle}>Rp. {totalSisa.toLocaleString('id-ID')}</td>
      </tr>
    );
  })}

                    <tr style={tbodyTrTotalStyle} className='fw-semibold'>
                      <td style={thTdStyle} colSpan={3}>Total : </td>
                      <td style={thTdStyle}>Rp. {grandTotalPiutang.toLocaleString('id-ID')}</td>
                      <td style={thTdStyle}>Rp. {grandTotalSisaPiutang.toLocaleString('id-ID')}</td>
                    </tr>
                  </tbody>
                </table>


              </div>


              <p className='fw-semibold px-4 mt-3'>
                Total Aset : Rp.{" "} {!filterDate ? "0" : totalAset.toLocaleString('id-ID')}
              </p>


            </div>
          </div>

          {/* Bagian Kanan */}
          <div style={{ width: '49%' }}>
            <div className='mt-3' style={{ maxHeight: '77vh', overflowY: 'auto' }}>
              <p
                className='fw-semibold px-4 text-center'
                style={{
                  backgroundColor: "blue",
                  color: "white",
                  borderRadius: "20px",
                  position: "sticky",
                  top: 0,
                  zIndex: 10 // Supaya tetap di atas elemen lain
                }}
              >
                Pasiva
              </p>
              <p className='fw-semibold px-4'>Hutang Lancar</p>
              <div style={{ ...tableContainerStyle, maxHeight: '60vh', overflowY: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>No</th>
                      <th style={thStyle}>Kode Akun</th>
                      <th style={thStyle}>Nama Akun</th>
                      <th style={thStyle}>Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataAkun
                      .filter((item) => item.jenisAkun === "Hutang Lancar")
                      .map((item, index) => {
                        // Fungsi untuk menghitung saldo awal
                        const getSaldoAwal = (saldoAwalDebit, saldoAwalKredit) => {
                          const debit = Number(saldoAwalDebit || 0);
                          const kredit = Number(saldoAwalKredit || 0);
                          return debit || kredit; // Menggunakan saldoAwalDebit jika ada, jika tidak gunakan saldoAwalKredit
                        };

                        // Fungsi untuk menghitung saldo akhir
                        const calculateSaldoAkhir = (kodeAkun, saldoAwal) => {
                          return dataJurnal
                            .filter((jurnal) => {
                              // Filter berdasarkan kodeAkun
                              const isKodeAkunMatched =
                                jurnal.kodeAkunDebet === kodeAkun || jurnal.kodeAkunKredit === kodeAkun;

                              // Filter berdasarkan tanggal jika filterDate ada
                              if (filterDate) {
                                const [filterYear, filterMonth] = filterDate.split('-');
                                const jurnalYearMonth = jurnal.tanggal.substring(0, 7); // Ambil "YYYY-MM"
                                return isKodeAkunMatched && jurnalYearMonth === `${filterYear}-${filterMonth}`;
                              }

                              // Jika filterDate tidak ada, hanya cek kodeAkun
                              return isKodeAkunMatched;
                            })
                            .reduce((saldo, jurnal) => {
                              const adjustedNominalDebet =
                                jurnal.kodeAkunKredit === kodeAkun ? 0 : Number(jurnal.nominalDebet || 0);
                              const adjustedNominalKredit =
                                jurnal.kodeAkunDebet === kodeAkun ? 0 : Number(jurnal.nominalKredit || 0);
                              return saldo + adjustedNominalDebet - adjustedNominalKredit;
                            }, saldoAwal); // Memulai dengan saldo awal yang dihitung
                        };

                        // Hitung saldo awal
                        const saldoAwal = getSaldoAwal(item.saldoAwalDebit?.[filterDate], item.saldoAwalKredit?.[filterDate]);

                        // Hitung saldo akhir untuk akun ini
                        const saldoAkhir = calculateSaldoAkhir(item.kodeAkun, saldoAwal);

                        return (
                          <tr
                            key={index}
                            style={{
                              ...((index % 2 === 0 ? tbodyTrEvenStyle : tbodyTrOddStyle) || {}),
                              display: !filterDate ? "none" : "",
                            }}
                            className='tr-hover-effect2'
                          >
                            <td style={thTdStyle} className="text-center">
                              {index + 1}
                            </td>
                            <td style={thTdStyle}>{item.kodeAkun}</td>
                            <td style={thTdStyle}>{item.namaAkun}</td>
                            <td style={thTdStyle}>
                              Rp. {saldoAkhir.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        );
                      })}

                    <tr style={{ backgroundColor: '#E7E7E8' }} className='fw-semibold'>
                      <td style={thTdStyle} colSpan={3}>Total : </td>
                      <td style={thTdStyle}>
                        Rp.{" "}
                        {!filterDate
                          ? "0"
                          : dataAkun
                            .filter((item) => item.jenisAkun === "Hutang Lancar")
                            .reduce((total, item) => {
                              const saldoAwal = Number(item.saldoAwalDebit?.[filterDate] || 0) || Number(item.saldoAwalKredit?.[filterDate] || 0);
                              const saldoAkhir = dataJurnal
                                .filter((jurnal) => {
                                  const isKodeAkunMatched =
                                    jurnal.kodeAkunDebet === item.kodeAkun || jurnal.kodeAkunKredit === item.kodeAkun;

                                  if (filterDate) {
                                    const [filterYear, filterMonth] = filterDate.split('-');
                                    const jurnalYearMonth = jurnal.tanggal.substring(0, 7); // Ambil "YYYY-MM"
                                    return isKodeAkunMatched && jurnalYearMonth === `${filterYear}-${filterMonth}`;
                                  }

                                  return isKodeAkunMatched;
                                })
                                .reduce((saldo, jurnal) => {
                                  const adjustedNominalDebet =
                                    jurnal.kodeAkunKredit === item.kodeAkun ? 0 : Number(jurnal.nominalDebet || 0);
                                  const adjustedNominalKredit =
                                    jurnal.kodeAkunDebet === item.kodeAkun ? 0 : Number(jurnal.nominalKredit || 0);
                                  return saldo + adjustedNominalDebet - adjustedNominalKredit;
                                }, saldoAwal);

                              return total + saldoAkhir;
                            }, 0).toLocaleString('id-ID')}
                      </td>
                    </tr>


                  </tbody>
                </table>


              </div>

              <p className='fw-semibold px-4 mt-4'>Hutang Jangka Panjang</p>
              <div style={{ ...tableContainerStyle, maxHeight: '60vh', overflowY: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>No</th>
                      <th style={thStyle}>Kode Akun</th>
                      <th style={thStyle}>Nama Akun</th>
                      <th style={thStyle}>Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataAkun
                      .filter((item) => item.jenisAkun === "Hutang Jangka Panjang")
                      .map((item, index) => {
                        // Fungsi untuk menghitung saldo awal
                        const getSaldoAwal = (saldoAwalDebit, saldoAwalKredit) => {
                          const debit = Number(saldoAwalDebit || 0);
                          const kredit = Number(saldoAwalKredit || 0);
                          return debit || kredit; // Menggunakan saldoAwalDebit jika ada, jika tidak gunakan saldoAwalKredit
                        };

                        // Fungsi untuk menghitung saldo akhir
                        const calculateSaldoAkhir = (kodeAkun, saldoAwal) => {
                          return dataJurnal
                            .filter((jurnal) => {
                              // Filter berdasarkan kodeAkun
                              const isKodeAkunMatched =
                                jurnal.kodeAkunDebet === kodeAkun || jurnal.kodeAkunKredit === kodeAkun;

                              // Filter berdasarkan tanggal jika filterDate ada
                              if (filterDate) {
                                const [filterYear, filterMonth] = filterDate.split('-');
                                const jurnalYearMonth = jurnal.tanggal.substring(0, 7); // Ambil "YYYY-MM"
                                return isKodeAkunMatched && jurnalYearMonth === `${filterYear}-${filterMonth}`;
                              }

                              // Jika filterDate tidak ada, hanya cek kodeAkun
                              return isKodeAkunMatched;
                            })
                            .reduce((saldo, jurnal) => {
                              const adjustedNominalDebet =
                                jurnal.kodeAkunKredit === kodeAkun ? 0 : Number(jurnal.nominalDebet || 0);
                              const adjustedNominalKredit =
                                jurnal.kodeAkunDebet === kodeAkun ? 0 : Number(jurnal.nominalKredit || 0);
                              return saldo + adjustedNominalDebet - adjustedNominalKredit;
                            }, saldoAwal); // Memulai dengan saldo awal yang dihitung
                        };

                        // Hitung saldo awal
                        const saldoAwal = getSaldoAwal(item.saldoAwalDebit?.[filterDate], item.saldoAwalKredit?.[filterDate]);

                        // Hitung saldo akhir untuk akun ini
                        const saldoAkhir = calculateSaldoAkhir(item.kodeAkun, saldoAwal);

                        return (
                          <tr
                            key={index}
                            style={{
                              ...((index % 2 === 0 ? tbodyTrEvenStyle : tbodyTrOddStyle) || {}),
                              display: !filterDate ? "none" : "",
                            }}
                            className='tr-hover-effect2'
                          >
                            <td style={thTdStyle} className="text-center">
                              {index + 1}
                            </td>
                            <td style={thTdStyle}>{item.kodeAkun}</td>
                            <td style={thTdStyle}>{item.namaAkun}</td>
                            <td style={thTdStyle}>
                              Rp. {saldoAkhir.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        );
                      })}

                    <tr style={{ backgroundColor: '#E7E7E8' }} className='fw-semibold'>
                      <td style={thTdStyle} colSpan={3}>Total : </td>
                      <td style={thTdStyle}>
                        Rp.{" "}
                        {!filterDate
                          ? "0"
                          : dataAkun
                            .filter((item) => item.jenisAkun === "Hutang Jangka Panjang")
                            .reduce((total, item) => {
                              const saldoAwal = Number(item.saldoAwalDebit?.[filterDate] || 0) || Number(item.saldoAwalKredit?.[filterDate] || 0);
                              const saldoAkhir = dataJurnal
                                .filter((jurnal) => {
                                  const isKodeAkunMatched =
                                    jurnal.kodeAkunDebet === item.kodeAkun || jurnal.kodeAkunKredit === item.kodeAkun;

                                  if (filterDate) {
                                    const [filterYear, filterMonth] = filterDate.split('-');
                                    const jurnalYearMonth = jurnal.tanggal.substring(0, 7); // Ambil "YYYY-MM"
                                    return isKodeAkunMatched && jurnalYearMonth === `${filterYear}-${filterMonth}`;
                                  }

                                  return isKodeAkunMatched;
                                })
                                .reduce((saldo, jurnal) => {
                                  const adjustedNominalDebet =
                                    jurnal.kodeAkunKredit === item.kodeAkun ? 0 : Number(jurnal.nominalDebet || 0);
                                  const adjustedNominalKredit =
                                    jurnal.kodeAkunDebet === item.kodeAkun ? 0 : Number(jurnal.nominalKredit || 0);
                                  return saldo + adjustedNominalDebet - adjustedNominalKredit;
                                }, saldoAwal);

                              return total + saldoAkhir;
                            }, 0).toLocaleString('id-ID')}
                      </td>
                    </tr>


                  </tbody>
                </table>
              </div>

              <p className='fw-semibold px-4 mt-4'>Hutang Lain</p>
              <div style={{ ...tableContainerStyle, maxHeight: '60vh', overflowY: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>No</th>
                      <th style={thStyle}>Tanggal</th>
                      <th style={thStyle}>Nama</th>
                      <th style={thStyle}>Hutang</th>
                      <th style={thStyle}>Sisa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataHutang
                      .filter(item => {
                        // Konversi tanggal item ke format YYYY-MM
                        const itemDate = format(new Date(item.tanggal), 'yyyy-MM');
                        return itemDate === filterDate;
                      })
                      .map((item, index) => {
                        // Menghitung totalHutang
                        const totalHutang = dataHutangItem
                          .filter(hutangItem => hutangItem.idHutang === item.id)
                          .reduce((sum, current) => sum + Number(current.nominal), 0);

                        // Menghitung total pembayaran
                        const totalPayment = dataHutangPayment
                          .filter(payment => payment.idHutang === item.id)
                          .reduce((sum, current) => sum + Number(current.jumlah), 0);

                        // Menghitung totalSisa
                        const totalSisa = totalHutang - totalPayment;

                        // Menambahkan nilai ke total akumulasi
                        grandTotalHutang += totalHutang;
                        grandTotalSisaHutang += totalSisa;

                        return (
                          <tr
                            key={index}
                            style={index % 2 === 0 ? tbodyTrEvenStyle : tbodyTrOddStyle}
                            className='tr-hover-effect2'
                          >
                            <td style={thTdStyle} className="text-center">{index + 1}</td>
                            <td style={thTdStyle}>
                              {format(new Date(item.tanggal), 'dd-MM-yyyy')}
                            </td>
                            <td style={thTdStyle}>{item.nama}</td>
                            <td style={thTdStyle}>Rp. {totalHutang.toLocaleString('id-ID')}</td>
                            <td style={thTdStyle}>Rp. {totalSisa.toLocaleString('id-ID')}</td>
                          </tr>
                        );
                      })}
                    <tr style={tbodyTrTotalStyle} className='fw-semibold'>
                      <td style={thTdStyle} colSpan={3}>Total : </td>
                      <td style={thTdStyle}>Rp. {grandTotalHutang.toLocaleString('id-ID')}</td>
                      <td style={thTdStyle}>Rp. {grandTotalSisaHutang.toLocaleString('id-ID')}</td>
                    </tr>
                  </tbody>
                </table>


              </div>


              <p className='fw-semibold px-4 mt-3'>
                Total Hutang : Rp.{" "} {!filterDate ? "0" : totalHutang.toLocaleString('id-ID')}
              </p>


            </div>
          </div>
        </div>


      </Container>
    </>
  );
};

export default BalanceSheet;
