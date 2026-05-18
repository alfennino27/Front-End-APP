import React, { useRef, useEffect, useState } from 'react';
import { Col, Row, Modal, Button, Container, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useNavigate } from 'react-router-dom';
import { FaPaste } from 'react-icons/fa';
import { DatePicker, Space } from 'antd';

const CashFlow = () => {
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
  const [dataInvoicePayment, setDataInvoicePayment] = useState([]);
  const [dataPiutangPayment, setDataPiutangPayment] = useState([]);
  const [dataPiutang, setDataPiutang] = useState([]);



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

  const tbodyTrLastChildTdFirstChildStyle = {
    borderBottomLeftRadius: '10px',
  };

  const tbodyTrLastChildTdLastChildStyle = {
    borderBottomRightRadius: '10px',
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

  const fetchDataAkun = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/akun/get`);
      const data = await res.json();
      setDataAkun(data);
    } catch (err) {
      console.error('Gagal mengambil data Akun:', err);
    }
  };

  const fetchDataInvoice = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/invoice/get`);
      const data = await res.json();
      setDataInvoice(data);
    } catch (err) {
      console.error('Gagal mengambil data Invoice:', err);
    }
  };

  const fetchDataInvoicePengeluaran = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/invoicePengeluaran/get`);
      const data = await res.json();
      setDataInvoicePengeluaran(data);
    } catch (err) {
      console.error('Gagal mengambil data InvoicePengeluaran:', err);
    }
  };

  const fetchDataProject = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/projects/get`);
      const data = await res.json();
      setDataProject(data);
    } catch (err) {
      console.error('Gagal mengambil data Project:', err);
    }
  };

  const fetchDataSPKProduct = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/spkproduct/get`);
      const data = await res.json();
      setDataSPKProduct(data);
    } catch (err) {
      console.error('Gagal mengambil data SPKProduct:', err);
    }
  };

  const fetchDataInvoicePayment = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/invoicePayment/cashFlow/get`);
      const data = await res.json();
      setDataInvoicePayment(data);
    } catch (err) {
      console.error('Gagal mengambil data InvoicePayment:', err);
    }
  };

  const fetchDataPiutang = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/piutang/get`);
      const data = await res.json();
      setDataPiutang(data);
    } catch (err) {
      console.error('Gagal mengambil data Piutang:', err);
    }
  };

  const fetchDataPiutangPayment = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/piutangPayment/get`);
      const data = await res.json();
      setDataPiutangPayment(data);
    } catch (err) {
      console.error('Gagal mengambil data PiutangPayment:', err);
    }
  };



  useEffect(() => {
    fetchDataJurnal();
    fetchDataAkun();
    fetchDataInvoice();
    fetchDataInvoicePengeluaran();
    fetchDataProject();
    fetchDataSPKProduct();
    fetchDataInvoicePayment();
    fetchDataPiutangPayment();
    fetchDataPiutang();
  }, []);

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

  const filteredPayments = dataInvoicePayment.filter(item => {
    if (item.status === "Hold") return false; // Skip jika status "Hold"
    if (!filterDate) return true; // Jika tidak ada filter, tampilkan semua
    const [year, month] = filterDate.split('-');
    const tanggal = item.status === "Withdraw" ? item.tanggalWD : item.tanggal;
    const itemYearMonth = tanggal.substring(0, 7); // Ambil "YYYY-MM"
    return itemYearMonth === `${year}-${month}`;
  });


  // Pre-processing: Buat map dari dataInvoice
  const invoiceMap = Object.fromEntries(
    dataInvoice.map((inv) => [inv.id, inv])
  );

  const totalPayments = filteredPayments.reduce((sum, item) => sum + Number(item.jumlah), 0);

  const filteredPiutangPayments = dataPiutangPayment.filter(item => {
    if (!filterDate) return true; // Jika tidak ada filter, tampilkan semua
    const [year, month] = filterDate.split('-');
    const itemYearMonth = item.tanggal.substring(0, 7); // Ambil "YYYY-MM"
    return itemYearMonth === `${year}-${month}`;
  });

  // Pre-processing: Buat map dari dataPiutang
  const piutangMap = Object.fromEntries(
    dataPiutang.map((piutang) => [piutang.id, piutang])
  );

  const totalPiutangPayments = filteredPiutangPayments.reduce((sum, item) => sum + Number(item.jumlah), 0);

  const arusKas =
    totalPayments + totalPiutangPayments
    - dataAkun
      .filter((item) => ["Operasional", "HPP", "Aset"].includes(item.jenisAkun))
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
      }, 0);

  return (
    <>
      <Container>
        <div className='mt-4 px-4'>
          <div className='row'>
            <div className="col d-flex justify-content-between align-items-center">
              <Dropdown>
                <Dropdown.Toggle variant="light" id="dropdown-basic" className="text-sm px-2 py-1" style={{ border: "1px solid blue", borderRadius: "5px", color: "blue" }}>
                  Cash Flow
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
                  <Dropdown.Item as={Link} to="/accounting/balance-sheet" className="dropdown-link">
                    Balance Sheet
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/jurnal-penyesuaian" className="dropdown-link">
                    Jurnal Penyesuaian
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/cash-flow" className="dropdown-link" style={{ color: "blue" }}>
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

              <DatePicker picker="month" style={{ borderColor: 'blue', color: 'blue' }} onChange={handleDateChange} />

            </div>


          </div>

        </div>
        <div className='mt-3' style={{ maxHeight: '77vh', overflowY: 'auto' }}>
          {/* <p className='fw-semibold px-4'>Pemasukan</p>
          <div style={{ ...tableContainerStyle, maxHeight: '60vh', overflowY: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>No</th>
                  <th style={thStyle}>Kode Akun</th>
                  <th style={thStyle}>Nama Akun</th>
                  <th style={thStyle}>Jenis Akun</th>
                  <th style={thStyle}>Nominal</th>
                </tr>
              </thead>
              <tbody>
                {dataAkun
                  .filter((item) => item.jenisAkun === "Pemasukan")
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
                      >
                        <td style={thTdStyle} className="text-center">
                          {index + 1}
                        </td>
                        <td style={thTdStyle}>{item.kodeAkun}</td>
                        <td style={thTdStyle}>{item.namaAkun}</td>
                        <td style={thTdStyle}>{item.jenisAkun}</td>
                        <td style={thTdStyle}>
                          Rp. {saldoAkhir.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    );
                  })}

                <tr style={{ backgroundColor: '#E7E7E8' }} className='fw-semibold'>
                  <td style={thTdStyle} colSpan={4}>Total : </td>
                  <td style={thTdStyle}>
                    Rp.{" "}
                    {!filterDate
                      ? "0"
                      : dataAkun
                        .filter((item) => item.jenisAkun === "Pemasukan")
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


          </div> */}


          <p className='fw-semibold px-4'>Payment Penjualan</p>
          <div style={{ ...tableContainerStyle, maxHeight: '60vh', overflowY: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>No</th>
                  <th style={thStyle}>Tanggal</th>
                  <th style={thStyle}>Kode Invoice</th>
                  <th style={thStyle}>Nominal</th>
                </tr>
              </thead>
              <tbody>
                {filterDate &&
                  filteredPayments.map((item, index) => {
                    // Ambil data invoice dari map
                    const invoice = invoiceMap[item.idInvoice];

                    return (
                      <tr
                        key={index}
                        style={index % 2 === 0 ? tbodyTrEvenStyle : tbodyTrOddStyle}
                      >
                        <td style={thTdStyle} className="text-center">
                          {index + 1}
                        </td>
                        <td style={thTdStyle}>
                          {new Date(item.status === "Withdraw" ? item.tanggalWD : item.tanggal).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </td>
                        {/* Tampilkan kodeInvoice atau pesan default */}
                        <td style={thTdStyle}>{invoice ? invoice.kodeInvoice : 'Invoice tidak ditemukan'}</td>
                        <td style={thTdStyle}>Rp. {Number(item.jumlah).toLocaleString('id-ID')}</td>
                      </tr>
                    );
                  })}
                <tr style={{ backgroundColor: '#E7E7E8' }} className='fw-semibold'>
                  <td style={thTdStyle} colSpan={3}>Total : </td>
                  <td style={thTdStyle}>Rp.{" "} {!filterDate ? "0" : filteredPayments.reduce((sum, item) => sum + Number(item.jumlah), 0).toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className='fw-semibold px-4 mt-4'>Payment Piutang</p>
          <div style={{ ...tableContainerStyle, maxHeight: '60vh', overflowY: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>No</th>
                  <th style={thStyle}>Tanggal</th>
                  <th style={thStyle}>Nama Piutang</th>
                  <th style={thStyle}>Detail</th>
                  <th style={thStyle}>Nominal</th>
                </tr>
              </thead>
              <tbody>
                {filterDate &&
                  filteredPiutangPayments.map((item, index) => {
                    // Ambil data piutang dari map
                    const piutang = piutangMap[item.idPiutang];

                    return (
                      <tr
                        key={index}
                        style={index % 2 === 0 ? tbodyTrEvenStyle : tbodyTrOddStyle}
                      >
                        <td style={thTdStyle} className="text-center">
                          {index + 1}
                        </td>
                        <td style={thTdStyle}>
                          {new Date(item.tanggal).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </td>
                        {/* Tampilkan nama piutang atau pesan default */}
                        <td style={thTdStyle}>{piutang ? piutang.nama : 'Piutang tidak ditemukan'}</td>
                        <td style={thTdStyle}>{item.detail}</td>
                        <td style={thTdStyle}>Rp. {Number(item.jumlah).toLocaleString('id-ID')}</td>
                      </tr>
                    );
                  })}
                <tr style={{ backgroundColor: '#E7E7E8' }} className='fw-semibold'>
                  <td style={thTdStyle} colSpan={4}>Total : </td>
                  <td style={thTdStyle}>Rp.{" "} {!filterDate ? "0" : filteredPiutangPayments.reduce((sum, item) => sum + Number(item.jumlah), 0).toLocaleString('id-ID')}</td>
                </tr>


              </tbody>
            </table>


          </div>

          <p className='fw-semibold px-4 mt-4'>Pengeluaran</p>
          <div style={{ ...tableContainerStyle, maxHeight: '60vh', overflowY: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>No</th>
                  <th style={thStyle}>Kode Akun</th>
                  <th style={thStyle}>Nama Akun</th>
                  <th style={thStyle}>Jenis Akun</th>
                  <th style={thStyle}>Nominal</th>
                </tr>
              </thead>
              <tbody>
                {dataAkun
                  .filter((item) => ["Operasional", "HPP", "Aset"].includes(item.jenisAkun))
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
                      >
                        <td style={thTdStyle} className="text-center">
                          {index + 1}
                        </td>
                        <td style={thTdStyle}>{item.kodeAkun}</td>
                        <td style={thTdStyle}>{item.namaAkun}</td>
                        <td style={thTdStyle}>{item.jenisAkun}</td>
                        <td style={thTdStyle}>
                          Rp. {saldoAkhir.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    );
                  })}

                <tr style={{ backgroundColor: '#E7E7E8' }} className='fw-semibold'>
                  <td style={thTdStyle} colSpan={4}>Total : </td>
                  <td style={thTdStyle}>
                    Rp.{" "}
                    {!filterDate
                      ? "0"
                      : dataAkun
                        .filter((item) => ["Operasional", "HPP", "Aset"].includes(item.jenisAkun))
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

          <p className='fw-semibold px-4 mt-3'>
            Arus Kas : Rp.{" "} {!filterDate ? "0" : arusKas.toLocaleString('id-ID')}
          </p>


        </div>

      </Container>
    </>
  );
};

export default CashFlow;
