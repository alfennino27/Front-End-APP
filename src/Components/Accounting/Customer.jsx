import React, { useRef, useEffect, useState } from 'react';
import { Col, Row, Modal, Button, Container, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useNavigate } from 'react-router-dom';
import { MdFormatListBulletedAdd } from "react-icons/md";
import { Checkbox, Divider } from 'antd';
const CheckboxGroup = Checkbox.Group;
const plainOptions = ['Direct', 'Hold', 'Withdraw'];
const defaultCheckedList = ['Direct', 'Hold', 'Withdraw'];

const Jurnal = () => {
  const baseUrl = getApiBaseUrl();
  const [checkedList, setCheckedList] = useState(defaultCheckedList);
  const [showTambahDataModal, setShowTambahDataModal] = useState(false);
  const [showEditDataModal, setShowEditDataModal] = useState(false);
  const [showConfirmDeleteData, setShowConfirmDeleteData] = useState(false);
  const [kodeCust, setKodeCust] = useState('');
  const [namaCust, setNamaCust] = useState('');
  const [noTelpCust, setNoTelpCust] = useState('');
  const [idDataEdit, setIdDataEdit] = useState('');
  const [dataCust, setDataCust] = useState([]);
  const [dataInvoice, setDataInvoice] = useState([]);
  const [dataProduct, setDataProduct] = useState([]);
  const [dataInvoicePayment, setDataInvoicePayment] = useState([]);

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
      const res = await fetch(`${baseUrl}/accounting/cust/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kodeCust,
          namaCust,
          noTelpCust,
        }),
      });

      const result = await res.json();
      console.log(result.message);
    } catch (e) {
      console.error('Error adding customer:', e);
    }

    fetchDataCust();
  };


  const fetchDataCust = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/cust/get`);
      const data = await res.json();
      setDataCust(data);
    } catch (err) {
      console.error('Gagal mengambil data cust:', err);
    }
  };

  const fetchDataInvoice = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/invoice/get`);
      const data = await res.json();
      setDataInvoice(data);
    } catch (err) {
      console.error('Gagal mengambil data invoice:', err);
    }
  };

  const fetchDataProduct = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/projects/get`);
      const data = await res.json();
      setDataProduct(data);
    } catch (err) {
      console.error('Gagal mengambil data product:', err);
    }
  };

  const fetchDataInvoicePayment = async () => {
    try {
      const res = await fetch(`${baseUrl}/accounting/invoicePayment/get`);
      const data = await res.json();
      setDataInvoicePayment(data);
    } catch (err) {
      console.error('Gagal mengambil data InvoicePayment:', err);
    }
  };


  useEffect(() => {
    fetchDataCust();
    fetchDataInvoice();
    fetchDataProduct();
    fetchDataInvoicePayment();
  }, []);

  const refreshData = () => {
    setKodeCust('');
    setNamaCust('');
    setIdDataEdit('');
    setNoTelpCust('');
  }

  const handleEditData = (item) => {
    refreshData();
    setIdDataEdit(item.id);
    setKodeCust(item.kodeCust || "");
    setNamaCust(item.namaCust || "");
    setNoTelpCust(item.noTelpCust || "");
    setShowEditDataModal(true);
  }

  const handleSubmitEditData = async () => {
    setShowEditDataModal(false);

    try {
      const response = await fetch(`${baseUrl}/accounting/cust/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: idDataEdit,
          kodeCust: kodeCust,
          namaCust: namaCust,
          noTelpCust: noTelpCust,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal update customer');
      }

      console.log('Customer berhasil diupdate:', result.message);
    } catch (error) {
      console.error('Error saat mengupdate customer:', error);
    }

    fetchDataCust();
  };


  const handleSubmitDeleteData = async () => {
    setShowConfirmDeleteData(false);

    try {
      const response = await fetch(`${baseUrl}/accounting/cust/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: idDataEdit,
          kodeCust: kodeCust,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menghapus data customer');
      }

      console.log('Berhasil menghapus data:', result.message);
    } catch (e) {
      console.error('Error handling data:', e);
    }

    // Refresh data customer
    fetchDataCust();
  };



  return (
    <>
      <Container>
        <div className='mt-4 px-4'>
          <div className='row'>
            <div className='col d-flex justify-content-between'>
              <Dropdown>
                <Dropdown.Toggle variant="light" id="dropdown-basic" className="text-sm px-2 py-1" style={{ border: "1px solid blue", borderRadius: "5px", color: "blue" }}>
                  Customer
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/accounting/akun" className="dropdown-link">
                    Akun & Saldo Awal
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/customer" className="dropdown-link" style={{ color: "blue" }}>
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
                <CheckboxGroup options={plainOptions} value={checkedList} onChange={(list) => { setCheckedList(list) }} />
                <MdFormatListBulletedAdd size={25} onClick={() => { setShowTambahDataModal(true); refreshData(); }} />
              </div>

            </div>
          </div>
        </div>

        <div style={{ ...tableContainerStyle, maxHeight: '75vh', overflowY: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>No</th>
                <th style={thStyle}>Kode Customer</th>
                <th style={thStyle}>Nama Customer</th>
                <th style={thStyle}>Saldo</th>
                <th style={thStyle}>No Telp</th>
              </tr>
            </thead>
            <tbody>
              {dataCust.sort((a, b) => {
                const extractNumber = (kode) => {
                  const match = kode.match(/\d+/);
                  return match ? parseInt(match[0], 10) : 0; // Default ke 0 jika tidak ada angka
                };

                const extractText = (kode) => {
                  const match = kode.match(/[A-Za-z]+/);
                  return match ? match[0] : ""; // Default ke string kosong jika tidak ada teks
                };


                const textA = extractText(a.kodeCust);
                const textB = extractText(b.kodeCust);

                if (textA === textB) {
                  return extractNumber(a.kodeCust) - extractNumber(b.kodeCust);
                }

                return textA.localeCompare(textB);
              }).map((item, index) => {
                // Find the invoice(s) that match the kodeCust
                const matchingInvoices = dataInvoice.filter(invoice => invoice.kodeCustomer === item.kodeCust);

                // Extract the ids from matching invoices
                const invoiceIds = matchingInvoices.map(invoice => invoice.id);

                // Calculate total ongkir and discount from matching invoices
                const totalOngkir = matchingInvoices.reduce((acc, invoice) => acc + (parseFloat(invoice.ongkirCustInvoice) || 0), 0);
                const totalDiscount = matchingInvoices.reduce((acc, invoice) => acc + (parseFloat(invoice.discountInvoice) || 0), 0);

                // Find products that match the invoiceIds
                const matchingProducts = dataProduct.filter(product => invoiceIds.includes(product.idInvoice));

                // Calculate total Harga from matching products, taking into account the Qty
                const totalHarga = matchingProducts.reduce((acc, product) => {
                  const harga = parseFloat(product.Harga) || 0;
                  const qty = parseFloat(product.Qty) || 0;
                  return acc + (harga * qty);
                }, 0);

                // Find payments that match the invoiceIds and have a status included in checkedList
                const matchingPayments = dataInvoicePayment.filter(payment => {
                  const status = payment.status || 'Direct'; // Anggap status kosong atau undefined sebagai 'Direct'
                  return invoiceIds.includes(payment.idInvoice) && checkedList.includes(status);
                });


                // Calculate total payment from matching payments
                const totalPayment = matchingPayments.reduce((acc, payment) => acc + (parseFloat(payment.jumlah) || 0), 0);

                // Calculate the final total
                const finalTotal = totalHarga + totalOngkir - totalDiscount - totalPayment;

                return (
                  <tr key={index} style={index % 2 === 0 ? tbodyTrEvenStyle : tbodyTrOddStyle} onClick={() => handleEditData(item)}>
                    <td style={thTdStyle} className='text-center'>{index + 1}</td>
                    <td style={thTdStyle}>{item.kodeCust}</td>
                    <td style={thTdStyle}>{item.namaCust}</td>
                    <td style={thTdStyle}>Rp. {finalTotal.toLocaleString('id-ID')}</td>
                    <td style={thTdStyle}>{item.noTelpCust}</td>
                  </tr>
                );
              })}
              <tr style={{ backgroundColor: '#E7E7E8' }} className='fw-semibold'>
                <td style={thTdStyle} colSpan={3}>Total : </td>
                <td style={thTdStyle}>
                  Rp. {dataCust.reduce((acc, item) => {
                    const matchingInvoices = dataInvoice.filter(invoice => invoice.kodeCustomer === item.kodeCust);
                    const invoiceIds = matchingInvoices.map(invoice => invoice.id);
                    const totalOngkir = matchingInvoices.reduce((acc, invoice) => acc + (parseFloat(invoice.ongkirCustInvoice) || 0), 0);
                    const totalDiscount = matchingInvoices.reduce((acc, invoice) => acc + (parseFloat(invoice.discountInvoice) || 0), 0);
                    const matchingProducts = dataProduct.filter(product => invoiceIds.includes(product.idInvoice));
                    const totalHarga = matchingProducts.reduce((acc, product) => {
                      const harga = parseFloat(product.Harga) || 0;
                      const qty = parseFloat(product.Qty) || 0;
                      return acc + (harga * qty);
                    }, 0);
                    const matchingPayments = dataInvoicePayment.filter(payment => {
                      const status = payment.status || 'Direct';
                      return invoiceIds.includes(payment.idInvoice) && checkedList.includes(status);
                    });
                    const totalPayment = matchingPayments.reduce((acc, payment) => acc + (parseFloat(payment.jumlah) || 0), 0);
                    const finalTotal = totalHarga + totalOngkir - totalDiscount - totalPayment;
                    return acc + finalTotal;
                  }, 0).toLocaleString('id-ID')}
                </td>
                <td style={thTdStyle}></td>
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
            <label className='mt-2'>Kode Cust :</label>
            <input className="form-control" type='text' defaultValue={kodeCust} onChange={(e) => setKodeCust(e.target.value)} required></input>
            <label className='mt-2'>Nama Cust :</label>
            <input className="form-control" type='text' defaultValue={namaCust} onChange={(e) => setNamaCust(e.target.value)} required></input>
            <label className='mt-2'>No Telp :</label>
            <input className="form-control" type='number' defaultValue={noTelpCust} onChange={(e) => setNoTelpCust(e.target.value)} required onWheel={(e) => e.target.blur()}></input>
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
            <label className='mt-2'>Kode Cust :</label>
            <input className="form-control" type='text' defaultValue={kodeCust} onChange={(e) => setKodeCust(e.target.value)} required disabled></input>
            <label className='mt-2'>Nama Cust :</label>
            <input className="form-control" type='text' defaultValue={namaCust} onChange={(e) => setNamaCust(e.target.value)} required></input>
            <label className='mt-2'>No Telp :</label>
            <input className="form-control" type='number' defaultValue={noTelpCust} onChange={(e) => setNoTelpCust(e.target.value)} required onWheel={(e) => e.target.blur()}></input>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="danger" onClick={() => { setShowConfirmDeleteData(true); setShowEditDataModal(false) }}>Delete</Button>
            <Button variant="primary" onClick={() => handleSubmitEditData()}>Submit</Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showConfirmDeleteData} onHide={() => setShowConfirmDeleteData(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>Are you sure you want to delete this data?</Modal.Body>
          <Modal.Footer>
            <Button variant="danger" onClick={handleSubmitDeleteData}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
        {/* End Modal */}
      </Container>
    </>
  );
};

export default Jurnal;
