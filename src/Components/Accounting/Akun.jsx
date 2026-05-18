import React, { useRef, useEffect, useState } from 'react';
import { Col, Row, Modal, Button, Container, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useNavigate } from 'react-router-dom';
import { MdFormatListBulletedAdd } from "react-icons/md";
import { DatePicker, Input } from 'antd';
import '../Accounting/Accounting.css';

const Jurnal = () => {
  const baseUrl = getApiBaseUrl();
  const [showTambahDataModal, setShowTambahDataModal] = useState(false);
  const [showEditDataModal, setShowEditDataModal] = useState(false);
  const [kodeAkun, setKodeAkun] = useState('');
  const [namaAkun, setNamaAkun] = useState('');
  const [jenisAkun, setJenisAkun] = useState('');
  const [saldoAwalDebit, setSaldoAwalDebit] = useState('');
  const [saldoAwalKredit, setSaldoAwalKredit] = useState('');
  const [idDataEdit, setIdDataEdit] = useState('');
  const [dataAkun, setDataAkun] = useState([]);
  const [filterDate, setFilterDate] = useState(null);
  const [jurnalPenutup, setJurnalPenutup] = useState(null);

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


  const handleSubmitTambahData = async () => {
    setShowTambahDataModal(false);
    try {
      const res = await fetch(`${baseUrl}/accounting/akun/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kodeAkun,
          namaAkun,
          jenisAkun,
          saldoAwalDebit,
          saldoAwalKredit,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Gagal tambah data');
      }

      console.log('Berhasil tambah:', result);
      fetchDataAkun();
    } catch (e) {
      console.error('Error menambahkan akun:', e);
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
    fetchDataAkun();
  }, []);

  const refreshData = () => {
    setKodeAkun('');
    setNamaAkun('');
    setSaldoAwalDebit('');
    setSaldoAwalKredit('');
    setIdDataEdit('');
  }

  const handleEditData = (item) => {
    refreshData();
    setIdDataEdit(item.id);
    setKodeAkun(item.kodeAkun || "");
    setNamaAkun(item.namaAkun || "");
    setJenisAkun(item.jenisAkun || "");
    setSaldoAwalDebit(item.saldoAwalDebit?.[filterDate] || 0);
    setSaldoAwalKredit(item.saldoAwalKredit?.[filterDate] || 0);
    setJurnalPenutup(item.jurnalPenutup || null)
    setShowEditDataModal(true);
  }

  // const handleSubmitEditData = async () => {
  //   setShowEditDataModal(false);
  //   try {
  //     await updateDoc(doc(db, 'Akun', idDataEdit), {
  //       kodeAkun: kodeAkun,
  //       namaAkun: namaAkun,
  //       jenisAkun: jenisAkun,
  //       // saldoAwalDebit: saldoAwalDebit,
  //       // saldoAwalKredit: saldoAwalKredit,
  //       saldoAwalDebit: {
  //         [filterDate]: Number(saldoAwalDebit) || 0, // Simpan sebagai Map
  //       },
  //       saldoAwalKredit: {
  //         [filterDate]: Number(saldoAwalKredit) || 0, // Simpan sebagai Map
  //       },
  //       submitDate: new Date(),
  //     });
  //   } catch (e) {
  //     console.error('Error updating document: ', e);
  //   }
  //   fetchDataAkun();
  // }

  const handleSubmitEditData = async () => {
    setShowEditDataModal(false);

    try {
      const response = await fetch(`${baseUrl}/accounting/akun/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: idDataEdit,
          kodeAkun,
          namaAkun,
          jenisAkun,
          jurnalPenutup,
          saldoAwalDebit,
          saldoAwalKredit,
          filterDate, // format YYYY-MM
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Berhasil update:', result);
      } else {
        console.error('Gagal update akun:', result.message);
      }
    } catch (e) {
      console.error('Error calling update API:', e);
    }

    fetchDataAkun(); // refresh data di frontend
  };



  const handleDeleteData = async () => {
    const confirmed = window.confirm('Are you sure you want to delete this data?');
    if (!confirmed) return;

    setShowEditDataModal(false);
    try {
      const res = await fetch(`${baseUrl}/accounting/akun/delete/${idDataEdit}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        console.log(data.message); // Data akun berhasil dihapus
      } else {
        console.error(data.message);
      }
    } catch (e) {
      console.error('Gagal menghapus akun:', e);
    }
    fetchDataAkun();
  };



  const [isSaldoAwal, setIsSaldoAwal] = useState(true);
  const [animasiSaldoAwal, setAnimasiSaldoAwal] = useState(true); // untuk status animasi
  const [animasiDebitKredit, setAnimasiDebitKredit] = useState(false); // untuk status animasi

  useEffect(() => {
    const interval = setInterval(() => {
      if (isSaldoAwal) {
        setAnimasiSaldoAwal(false);

        setTimeout(() => {
          setIsSaldoAwal(false);
        }, 500);

        setTimeout(() => {
          setAnimasiDebitKredit(true);
        }, 550);
      } else {
        setAnimasiDebitKredit(false);

        setTimeout(() => {
          setIsSaldoAwal(true);
        }, 500);

        setTimeout(() => {
          setAnimasiSaldoAwal(true);
        }, 550);
      }
    }, 3000); // Ubah setiap 3 detik (3000ms)

    return () => clearInterval(interval); // Membersihkan interval saat komponen dibersihkan
  }, [isSaldoAwal]);


  return (
    <>
      <Container>
        <div className='mt-4 px-4'>
          <div className='row'>
            <div className='col d-flex justify-content-between'>
              <Dropdown>
                <Dropdown.Toggle variant="light" id="dropdown-basic" className="text-sm px-2 py-1" style={{ border: "1px solid blue", borderRadius: "5px", color: "blue" }}>
                  Akun & Saldo Awal
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/accounting/akun" className="dropdown-link" style={{ color: "blue" }}>
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
                <DatePicker picker="month" style={{ borderColor: 'blue', color: 'blue' }} onChange={(date) => setFilterDate(date ? date.format("YYYY-MM") : null)} />
                <MdFormatListBulletedAdd style={{ marginLeft: "8px" }} size={25} onClick={() => { setShowTambahDataModal(true); refreshData(); }} />
              </div>
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
                {isSaldoAwal && (
                  <th colSpan={2} style={thStyle}>
                    <div
                      style={{
                        opacity: animasiSaldoAwal ? 1 : 0, // Fade-in animasi
                        visibility: animasiSaldoAwal ? 'visible' : 'hidden',
                        transition: 'opacity 0.5s ease, visibility 0.5s ease',
                      }}>
                      Saldo Awal
                    </div>
                  </th>
                )}

                {/* Kolom Debit dan Kredit */}
                {!isSaldoAwal && (
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
            <tbody>
              {dataAkun.map((item, index) => (
                <tr key={index} className='tr-hover-effect' style={index % 2 === 0 ? tbodyTrEvenStyle : tbodyTrOddStyle} onClick={() => handleEditData(item)}>
                  <td style={thTdStyle} className='text-center'>{index + 1}</td>
                  <td style={thTdStyle}>{item.kodeAkun}</td>
                  <td style={thTdStyle}>{item.namaAkun}</td>
                  <td style={thTdStyle}>{item.jenisAkun}</td>
                  <td style={thTdStyle} className="text-center">{item.jurnalPenutup}</td>
                  {/* <td style={thTdStyle}>Rp. {Number(item.saldoAwalDebit).toLocaleString('id-ID')}</td>
                  <td style={thTdStyle}>Rp. {Number(item.saldoAwalKredit).toLocaleString('id-ID')}</td> */}
                  <td style={thTdStyle}>
                    Rp. {Number(item.saldoAwalDebit?.[filterDate] || 0).toLocaleString('id-ID')}
                    {/* ga penting tapi jangan dihapus buat biar rapi tampilannya aja */}
                    {Number(item.saldoAwalDebit?.[filterDate] || 0) === 0 ? '\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0' : ''}
                  </td>
                  <td style={thTdStyle}>
                    Rp. {Number(item.saldoAwalKredit?.[filterDate] || 0).toLocaleString('id-ID')}
                    {Number(item.saldoAwalKredit?.[filterDate] || 0) === 0 ? '\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0' : ''}
                  </td>
                </tr>
              ))}
              <tr style={{ backgroundColor: '#E7E7E8' }} className='fw-semibold'>
                <td style={thTdStyle} colSpan={5}>Total : </td>
                <td style={thTdStyle}>Rp. {dataAkun.reduce((total, akun) => total + Number(akun.saldoAwalDebit?.[filterDate] || 0), 0).toLocaleString('id-ID')}</td>
                <td style={thTdStyle}>Rp. {dataAkun.reduce((total, akun) => total + Number(akun.saldoAwalKredit?.[filterDate] || 0), 0).toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Modal */}
        <Modal show={showTambahDataModal} onHide={() => setShowTambahDataModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Tambah Data</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Your comment form here */}
            <label className='mt-2'>Kode Akun :</label>
            <input className="form-control" type='text' defaultValue={kodeAkun} onChange={(e) => setKodeAkun(e.target.value)} required></input>
            <label className='mt-2'>Nama Akun :</label>
            <input className="form-control" type='text' defaultValue={namaAkun} onChange={(e) => setNamaAkun(e.target.value)} required></input>
            <label className='mt-2'>Jenis Akun :</label>
            <select
              className="form-control"
              onChange={(e) => setJenisAkun(e.target.value)}
              defaultValue={jenisAkun}
              required
            >
              <option value="-">-</option>
              <option value="Aset">Aset</option>
              <option value="Aset Lancar">Aset Lancar</option>
              <option value="Aset Tetap">Aset Tetap</option>
              <option value="Hutang Lancar">Hutang Lancar</option>
              <option value="Hutang Jangka Panjang">Hutang Jangka Panjang</option>
              <option value="HPP">HPP</option>
              <option value="Operasional">Operasional</option>
              <option value="Pemasukan">Pemasukan</option>
            </select>
            <label className='mt-2'>Saldo Awal (Debit) :</label>
            <input className="form-control" type='number' defaultValue={saldoAwalDebit} onChange={(e) => setSaldoAwalDebit(e.target.value)} required></input>
            <label className='mt-2'>Saldo Awal (Kredit) :</label>
            <input className="form-control" type='number' defaultValue={saldoAwalKredit} onChange={(e) => setSaldoAwalKredit(e.target.value)} required></input>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={handleSubmitTambahData} style={{ marginLeft: "290px" }}>Submit</Button>
          </Modal.Footer>
        </Modal>
        {/* End Modal */}

        {/* Modal */}
        <Modal show={showEditDataModal} onHide={() => setShowEditDataModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Data</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Your comment form here */}
            <label className='mt-2'>Kode Akun :</label>
            <input className="form-control" type='text' defaultValue={kodeAkun} onChange={(e) => setKodeAkun(e.target.value)} required></input>
            <label className='mt-2'>Nama Akun :</label>
            <input className="form-control" type='text' defaultValue={namaAkun} onChange={(e) => setNamaAkun(e.target.value)} required></input>
            <label className='mt-2'>Jenis Akun :</label>
            <select
              className="form-control"
              onChange={(e) => setJenisAkun(e.target.value)}
              defaultValue={jenisAkun}
              required
            >
              <option value="-">-</option>
              <option value="Aset">Aset</option>
              <option value="Aset Lancar">Aset Lancar</option>
              <option value="Aset Tetap">Aset Tetap</option>
              <option value="Hutang Lancar">Hutang Lancar</option>
              <option value="Hutang Jangka Panjang">Hutang Jangka Panjang</option>
              <option value="HPP">HPP</option>
              <option value="Operasional">Operasional</option>
              <option value="Pemasukan">Pemasukan</option>
            </select>
            <label className='mt-2'>Saldo Awal (Debit) :</label>
            <input className="form-control" type='number' defaultValue={saldoAwalDebit} onChange={(e) => setSaldoAwalDebit(e.target.value)} required></input>
            <label className='mt-2'>Saldo Awal (Kredit) :</label>
            <input className="form-control" type='number' defaultValue={saldoAwalKredit} onChange={(e) => setSaldoAwalKredit(e.target.value)} required></input>

            {/* Input Radio */}
            <label className='mt-2'>Jurnal Penutup :</label>
            <div className="d-flex gap-3 mt-2">
              <div>
                <input type="radio" id="aktif" name="jurnalPenutup" value="Yes" checked={jurnalPenutup === "Yes"} onChange={(e) => setJurnalPenutup(e.target.value)} />
                <label htmlFor="aktif" className="ms-2">Yes</label>
              </div>
              <div>
                <input type="radio" id="nonaktif" name="jurnalPenutup" value="No" checked={jurnalPenutup === "No"} onChange={(e) => setJurnalPenutup(e.target.value)} />
                <label htmlFor="nonaktif" className="ms-2">No</label>
              </div>
            </div>

          </Modal.Body>
          <Modal.Footer style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="danger" onClick={() => handleDeleteData()}>Delete</Button>
            <Button variant="primary" onClick={() => handleSubmitEditData()}>Submit</Button>
          </Modal.Footer>
        </Modal>
        {/* End Modal */}
      </Container>
    </>
  );
};

export default Jurnal;
