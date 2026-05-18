import React, { useRef, useEffect, useState } from 'react';
import { Col, Row, Modal, Button, Container, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useNavigate } from 'react-router-dom';
import { FaPaste } from 'react-icons/fa';
import { DatePicker, Space } from 'antd';

const Jurnal = () => {
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



  useEffect(() => {
    fetchDataJurnal();
    fetchDataAkun();
    fetchDataInvoice();
    fetchDataInvoicePengeluaran();
    fetchDataProject();
    fetchDataSPKProduct();
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



  const [keuntunganPenjualan, setKeuntunganPenjualan] = useState(0);

  useEffect(() => {
    if (!filterDate) {
      setKeuntunganPenjualan(0);
      return;
    }

    const totalGrossProfit = filteredInvoices.reduce((sum, item) => sum + (item.totalGrossProfit || 0), 0);

    const totalPengeluaran = dataAkun
      .filter(item => item.jenisAkun === "Operasional")
      .reduce((total, item) => {
        const saldoAwal = Number(item.saldoAwalDebit?.[filterDate] || 0) || Number(item.saldoAwalKredit?.[filterDate] || 0);
        const saldoAkhir = dataJurnal
          .filter(jurnal => {
            const isKodeAkunMatched = jurnal.kodeAkunDebet === item.kodeAkun || jurnal.kodeAkunKredit === item.kodeAkun;
            if (filterDate) {
              const [filterYear, filterMonth] = filterDate.split('-');
              const jurnalYearMonth = jurnal.tanggal?.substring(0, 7) || ""; // Pastikan jurnal.tanggal tidak undefined
              return isKodeAkunMatched && jurnalYearMonth === `${filterYear}-${filterMonth}`;
            }
            return isKodeAkunMatched;
          })
          .reduce((saldo, jurnal) => {
            const adjustedNominalDebet = jurnal.kodeAkunKredit === item.kodeAkun ? 0 : Number(jurnal.nominalDebet || 0);
            const adjustedNominalKredit = jurnal.kodeAkunDebet === item.kodeAkun ? 0 : Number(jurnal.nominalKredit || 0);
            return saldo + adjustedNominalDebet - adjustedNominalKredit;
          }, saldoAwal);

        return total + saldoAkhir;
      }, 0);

    setKeuntunganPenjualan(totalGrossProfit - totalPengeluaran);
  }, [filteredInvoices, dataAkun, dataJurnal, filterDate]); // Perbarui saat data berubah



  return (
    <>
      <Container>
        <div className='mt-4 px-4'>
          <div className='row'>
            <div className="col d-flex justify-content-between align-items-center">
              <Dropdown>
                <Dropdown.Toggle variant="light" id="dropdown-basic" className="text-sm px-2 py-1" style={{ border: "1px solid blue", borderRadius: "5px", color: "blue" }}>
                  Laba Rugi Penjualan
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
                  <Dropdown.Item as={Link} to="/accounting/laba-rugi-penjualan" className="dropdown-link" style={{ color: "blue" }}>
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

              <DatePicker picker="month" style={{ borderColor: 'blue', color: 'blue' }} onChange={handleDateChange} />

            </div>


          </div>

        </div>
        <div className='mt-3' style={{ maxHeight: '77vh', overflowY: 'auto' }}>
          <p className='fw-semibold px-4'>Penjualan</p>
          <div style={{ ...tableContainerStyle, maxHeight: '60vh', overflowY: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>No</th>
                  <th style={thStyle}>Tanggal</th>
                  <th style={thStyle}>Kode Invoice</th>
                  <th style={thStyle}>Nominal</th>
                  <th style={thStyle}>Gross Profit</th>
                </tr>
              </thead>
              <tbody>
                {filterDate &&
                  filteredInvoices.map((item, index) => {
                    // Filter dataProject sesuai idInvoice
                    const relatedProjects = dataProject.filter(project => project.idInvoice === item.id);

                    // Ambil semua id dari relatedProjects
                    const relatedProjectIds = relatedProjects.map(project => project.id);

                    // Filter dataSPKProduct yang idProduct-nya ada di relatedProjectIds
                    const relatedSPKProducts = dataSPKProduct.filter(spk => relatedProjectIds.includes(spk.idProduct));

                    // Hitung total biaya dari dataSPKProduct
                    const totalSPKProductCost = relatedSPKProducts.reduce((sum, spk) => {
                      return sum + (Number(spk.harga) * Number(spk.qty));
                    }, 0);

                    // Hitung total harga dari dataProject
                    const totalHargaProject = relatedProjects.reduce((sum, project) => {
                      return sum + (Number(project.Harga) * Number(project.Qty));
                    }, 0);

                    // Filter dataInvoicePengeluaran sesuai idInvoice
                    const relatedPengeluaran = dataInvoicePengeluaran.filter(pengeluaran => pengeluaran.idInvoice === item.id);

                    // Hitung total pengeluaran
                    const totalPengeluaranLain = relatedPengeluaran.reduce((sum, pengeluaran) => {
                      return sum + Number(pengeluaran.nominalPengeluaran);
                    }, 0);

                    // Hitung total penjualan
                    const totalPenjualan = totalHargaProject + Number(item.ongkirCustInvoice) - Number(item.discountInvoice);

                    // Hitung total gross profit
                    const totalGrossProfit =
                      totalPenjualan -
                      totalPengeluaranLain -
                      Number(item.ongkirPackingInvoice) -
                      Number(item.adminInvoice) -
                      totalSPKProductCost;

                    item.totalPenjualan = totalPenjualan;
                    item.totalGrossProfit = totalGrossProfit;

                    return (
                      <tr
                        key={index}
                        style={index % 2 === 0 ? tbodyTrEvenStyle : tbodyTrOddStyle}
                      >
                        <td style={thTdStyle} className="text-center">
                          {index + 1}
                        </td>
                        <td style={thTdStyle}>
                          {new Date(item.tanggalMulaiInvoice).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </td>
                        <td style={thTdStyle}>{item.kodeInvoice}</td>
                        <td style={thTdStyle}>Rp. {totalPenjualan.toLocaleString('id-ID')}</td>
                        <td style={thTdStyle}>Rp. {totalGrossProfit.toLocaleString('id-ID')}</td>
                      </tr>
                    );
                  })}
                <tr style={{ backgroundColor: '#E7E7E8' }} className='fw-semibold'>
                  <td style={thTdStyle} colSpan={3}>Total : </td>
                  <td style={thTdStyle}>Rp.{" "} {!filterDate ? "0" : filteredInvoices.reduce((sum, item) => sum + item.totalPenjualan, 0).toLocaleString('id-ID')}</td>
                  <td style={thTdStyle}>Rp.{" "} {!filterDate ? "0" : filteredInvoices.reduce((sum, item) => sum + item.totalGrossProfit, 0).toLocaleString('id-ID')}</td>
                </tr>


              </tbody>
            </table>


          </div>

          <p className='fw-semibold px-4 mt-4'>Pengeluaran (Operasional)</p>
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
                {filterDate &&
                  dataAkun
                    .filter((item) => item.jenisAkun === "Operasional")
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
                          style={index % 2 === 0 ? tbodyTrEvenStyle : tbodyTrOddStyle}
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
                    Rp.{" "} {!filterDate ? "0" :
                      dataAkun
                        .filter((item) => item.jenisAkun === "Operasional")
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
            Keuntungan Penjualan : Rp. {" "} {!filterDate ? "0" : keuntunganPenjualan.toLocaleString('id-ID')}
          </p>


        </div>

      </Container>
    </>
  );
};

export default Jurnal;
