import React, { useRef, useEffect, useState } from 'react';
import { Col, Row, Modal, Button, Container, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useNavigate } from 'react-router-dom';
import { FaPaste } from 'react-icons/fa';
import { DatePicker, Input } from 'antd';
import moment from "moment";
import '../Accounting/Accounting.css';

const { Search } = Input;

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


  const [dataJurnal, setDataJurnal] = useState([]);
  const [dataAkun, setDataAkun] = useState([]);
  const [selectedKodeAkun, setSelectedKodeAkun] = useState(null);
  const [selectedNamaAkun, setSelectedNamaAkun] = useState(null);
  const [selectedSaldoAwal, setSelectedSaldoAwal] = useState(null);
  const [filterDate, setFilterDate] = useState(null);



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


  const fetchDataJurnal = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/jurnal/get`);
      const data = await res.json();
      setDataJurnal(data);
    } catch (err) {
      console.error('Gagal fetch data jurnal:', err);
    }
  };

  const fetchDataAkun = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/akun/get`);
      const data = await res.json();
      setDataAkun(data);
    } catch (err) {
      console.error('Gagal fetch data akun:', err);
    }
  };

  useEffect(() => {
    fetchDataJurnal();
    fetchDataAkun();
  }, []);




  const [selectedItem, setSelectedItem] = useState(null);
  const [tanggalSaldoAwal, setTanggalSaldoAwal] = useState(null);

  // Fungsi untuk mencari tanggal paling awal dari saldoAwalDebit atau saldoAwalKredit
  const getEarliestDate = (item) => {
    if (!item) return null;

    const debitDates = item.saldoAwalDebit ? Object.keys(item.saldoAwalDebit) : [];
    const kreditDates = item.saldoAwalKredit ? Object.keys(item.saldoAwalKredit) : [];

    const allDates = [...debitDates, ...kreditDates]
      .filter(date => /^\d{4}-\d{2}$/.test(date)) // Pastikan formatnya "YYYY-MM"
      .sort((a, b) => a.localeCompare(b)); // Urutkan dari yang paling lama ke terbaru

    return allDates.length > 0 ? allDates[0] : null; // Ambil tanggal paling awal jika ada
  };

  // Fungsi untuk menghitung saldo awal
  const calculateSaldoAwal = (item, date) => {
    if (!item) return 0;

    // Jika filterDate null, cari tanggal paling awal yang tersedia
    const selectedDate = date || getEarliestDate(item);

    return selectedDate && item.saldoAwalDebit?.[selectedDate]
      ? item.saldoAwalDebit[selectedDate]
      : selectedDate && item.saldoAwalKredit?.[selectedDate]
        ? -Math.abs(item.saldoAwalKredit[selectedDate])
        : 0;
  };

  // useEffect untuk mengupdate data saat selectedItem atau filterDate berubah
  useEffect(() => {
    if (selectedItem) {
      const earliestDate = filterDate || getEarliestDate(selectedItem);
      setSelectedKodeAkun(selectedItem.kodeAkun);
      setSelectedNamaAkun(selectedItem.namaAkun);
      setSelectedSaldoAwal(calculateSaldoAwal(selectedItem, earliestDate));

      // Format tanggal ke "Februari 2025"
      if (earliestDate) {
        const formattedDate = moment(earliestDate, "YYYY-MM").format("MMMM YYYY");
        setTanggalSaldoAwal(formattedDate);
      } else {
        setTanggalSaldoAwal(null);
      }
    }
  }, [selectedItem, filterDate]);



  // Menghitung saldo akhir
  const saldoAkhir = dataJurnal
    .filter(
      (item) =>
        (item.kodeAkunDebet === selectedKodeAkun || item.kodeAkunKredit === selectedKodeAkun) &&
        (!filterDate || item.tanggal.startsWith(filterDate)) // Tambahkan filter tanggal jika filterDate ada
    )
    .reduce((saldo, item) => {
      const adjustedNominalDebet =
        item.kodeAkunKredit === selectedKodeAkun ? 0 : Number(item.nominalDebet || 0);
      const adjustedNominalKredit =
        item.kodeAkunDebet === selectedKodeAkun ? 0 : Number(item.nominalKredit || 0);
      return saldo + adjustedNominalDebet - adjustedNominalKredit;
    }, Number(selectedSaldoAwal)); // Memulai dengan saldo awal

  const [searchQuery, setSearchQuery] = useState("");

  // Filter data berdasarkan pencarian (nama akun)
  const filteredDataAkun = dataAkun.filter((item) =>
    item.namaAkun.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.kodeAkun.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Container>
        <div className='mt-4 px-4'>
          <div className='row'>
            <div className="col d-flex justify-content-between align-items-center">
              <Dropdown>
                <Dropdown.Toggle variant="light" id="dropdown-basic" className="text-sm px-2 py-1" style={{ border: "1px solid blue", borderRadius: "5px", color: "blue" }}>
                  Buku Besar
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
                  <Dropdown.Item as={Link} to="/accounting/buku-besar" className="dropdown-link" style={{ color: "blue" }}>
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


              <DatePicker picker="month" style={{ borderColor: 'blue', color: 'blue' }} onChange={(date) => setFilterDate(date ? date.format("YYYY-MM") : null)} />


            </div>


          </div>

          <div className='row mt-2'>
            <div className="col d-flex justify-content-between align-items-center">
              <Dropdown>
                <Dropdown.Toggle variant="light" id="dropdown-akun" className="text-sm px-2 py-1" style={{ border: "1px solid blue", borderRadius: "5px", color: "blue" }}>
                  {selectedKodeAkun && selectedNamaAkun
                    ? `${selectedKodeAkun} - ${selectedNamaAkun}`
                    : "Select"}
                </Dropdown.Toggle>

                <Dropdown.Menu
                  style={{
                    maxHeight: "70vh", // Membatasi tinggi dropdown
                    overflowY: "auto", // Menambahkan scroll jika konten melebihi maxHeight
                  }}
                >

                  {/* Kolom input pencarian */}
                  <div style={{ paddingLeft: "10px", paddingRight: "10px", marginTop: "5px", marginBottom: "5px" }}>
                    <Search
                      placeholder="Nama Akun"
                      value={searchQuery}
                      onSearch={(value) => setSearchQuery(value)} // Mengatur query pencarian
                      onChange={(e) => setSearchQuery(e.target.value)} // Update nilai pencarian saat input berubah
                      style={{ width: "100%" }}
                    />
                  </div>

                  {filteredDataAkun.map((item) => (
                    <Dropdown.Item
                      key={item.id}
                      as={Link}
                      to={item.link}
                      className="dropdown-link"
                      style={{ color: selectedKodeAkun == item.kodeAkun ? "blue" : "black" }}
                      onClick={() => setSelectedItem(item)}
                    // onClick={() => {
                    //   setSelectedKodeAkun(item.kodeAkun);
                    //   setSelectedNamaAkun(item.namaAkun);

                    //   // Logika saldoAwal
                    //   const saldoAwal =
                    //     item.saldoAwalDebit?.[filterDate] && item.saldoAwalDebit?.[filterDate] !== "0"
                    //       ? item.saldoAwalDebit?.[filterDate]
                    //       : item.saldoAwalKredit?.[filterDate] && item.saldoAwalKredit?.[filterDate] !== "0"
                    //         ? -Math.abs(item.saldoAwalKredit?.[filterDate])
                    //         : 0; // Jika kosong, undefined, atau nol, tetap 0

                    //   setSelectedSaldoAwal(saldoAwal);
                    // }}
                    >
                      {item.kodeAkun} - {item.namaAkun}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>

              <p className='fw-semibold small m-0 p-0'>
                Saldo Awal : Rp. {filterDate === null ? "0" : Number(selectedSaldoAwal).toLocaleString('id-ID')} <br />
                Saldo Akhir : Rp. {filterDate === null ? "0" : Number(saldoAkhir).toLocaleString('id-ID')}
              </p>


            </div>

          </div>

        </div>

        <div style={{ ...tableContainerStyle, maxHeight: '70vh', overflowY: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>No</th>
                <th style={thStyle}>Tanggal</th>
                <th style={thStyle}>Keterangan</th>
                <th style={thStyle}>Debet</th>
                <th style={thStyle}>Kredit</th>
                <th style={thStyle}>Saldo</th>
              </tr>
            </thead>
            <tbody>
              <tr
                style={{
                  ...tbodyTrOddStyle,
                  display: filterDate === null ? "none" : ""
                }}
              >
                <td style={thTdStyle} className="text-center">0</td>
                <td style={thTdStyle}>{tanggalSaldoAwal ? `1 ${tanggalSaldoAwal}` : ""}</td>
                <td style={thTdStyle}>Saldo Awal</td>
                <td style={thTdStyle}>{Number(selectedSaldoAwal || 0) > 0 ? `Rp. ${Number(selectedSaldoAwal).toLocaleString('id-ID')}` : 'Rp. 0'}</td>
                <td style={thTdStyle}>{Number(selectedSaldoAwal || 0) < 0 ? `Rp. ${Math.abs(Number(selectedSaldoAwal)).toLocaleString('id-ID')}` : 'Rp. 0'}</td>
                <td style={thTdStyle}>Rp. {Number(selectedSaldoAwal || 0).toLocaleString('id-ID')}</td>
              </tr>
              {(() => {
                // Variabel lokal untuk melacak saldo
                let currentSaldo = Number(selectedSaldoAwal); // Pastikan saldo awal adalah angka

                return dataJurnal
                  .filter(
                    (item) =>
                      (item.kodeAkunDebet === selectedKodeAkun || item.kodeAkunKredit === selectedKodeAkun) &&
                      (!filterDate || item.tanggal.startsWith(filterDate)) // Tambahkan filter tanggal jika filterDate ada
                  )
                  .map((item, index) => {
                    const adjustedNominalDebet =
                      item.kodeAkunKredit === selectedKodeAkun ? 0 : Number(item.nominalDebet || 0);
                    const adjustedNominalKredit =
                      item.kodeAkunDebet === selectedKodeAkun ? 0 : Number(item.nominalKredit || 0);

                    // Perbarui saldo
                    currentSaldo += adjustedNominalDebet - adjustedNominalKredit;

                    return (
                      <tr
                        key={index}
                        style={{
                          ...((index % 2 === 0 ? tbodyTrEvenStyle : tbodyTrOddStyle)),
                          display: filterDate === null ? "none" : ""
                        }}
                        className='tr-hover-effect2'
                        onClick={() => handleEditData(item)}
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
                        <td style={thTdStyle}>{item.keterangan}</td>
                        <td style={thTdStyle}>Rp. {adjustedNominalDebet.toLocaleString('id-ID')}</td>
                        <td style={thTdStyle}>Rp. {adjustedNominalKredit.toLocaleString('id-ID')}</td>
                        <td style={thTdStyle}>Rp. {currentSaldo.toLocaleString('id-ID')}</td>
                      </tr>
                    );
                  });
              })()}
            </tbody>
          </table>


        </div>
      </Container>
    </>
  );
};

export default Jurnal;
