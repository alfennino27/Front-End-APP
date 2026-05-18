import React, { useRef, useEffect, useState } from 'react';
import { Col, Row, Modal, Button, Container, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useNavigate } from 'react-router-dom';

const Supplier = () => {
  const baseUrl = getApiBaseUrl();
  // const [dataSupplier, setDataSupplier] = useState([]);
  // const [dataSPK, setDataSPK] = useState([]);
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


  const [dataSupplier, setDataSupplier] = useState([]);
  const [spkMap, setSpkMap] = useState({});
  const [spkProductMap, setSpkProductMap] = useState({});
  const [spkPaymentMap, setSpkPaymentMap] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [
        supplierRes,
        spkRes,
        spkProductRes,
        spkPaymentRes
      ] = await Promise.all([
        fetch(`${baseUrl}/accounting/supplier/get`),
        fetch(`${baseUrl}/accounting/spk/get`),
        fetch(`${baseUrl}/accounting/spkProduct/get`),
        fetch(`${baseUrl}/accounting/spkPayment/get`)
      ]);

      if (!supplierRes.ok || !spkRes.ok || !spkProductRes.ok || !spkPaymentRes.ok) {
        throw new Error("Salah satu API gagal di-fetch");
      }

      const [suppliers, spkList, spkProducts, spkPayments] = await Promise.all([
        supplierRes.json(),
        spkRes.json(),
        spkProductRes.json(),
        spkPaymentRes.json()
      ]);

      // Set Supplier
      setDataSupplier(suppliers);

      // Map SPK berdasarkan Supplier
      const spkMapTemp = {};
      spkList.forEach(spk => {
        const supplierName = spk.pengrajin;
        if (supplierName) {
          spkMapTemp[supplierName] = spkMapTemp[supplierName] || [];
          spkMapTemp[supplierName].push(spk._id || spk.id); // tergantung API
        }
      });

      // Map Total Harga SPKproduct
      const spkProductMapTemp = {};
      spkProducts.forEach(p => {
        const idSPK = p.idSPK;
        const harga = Number(p.harga) || 0;
        const qty = Number(p.qty) || 0;
        const totalHarga = harga * qty;
        spkProductMapTemp[idSPK] = (spkProductMapTemp[idSPK] || 0) + totalHarga;
      });

      // Map Total Pembayaran SPKpayment
      const spkPaymentMapTemp = {};
      spkPayments.forEach(pay => {
        const idSPK = pay.idSPK;
        const jumlah = Number(pay.jumlah) || 0;
        spkPaymentMapTemp[idSPK] = (spkPaymentMapTemp[idSPK] || 0) + jumlah;
      });

      setSpkMap(spkMapTemp);
      setSpkProductMap(spkProductMapTemp);
      setSpkPaymentMap(spkPaymentMapTemp);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };


  // Fungsi untuk menghitung sisa hutang per supplier
  const calculateSaldo = (supplierName) => {
    const spkIds = spkMap[supplierName] || [];

    let totalHargaSPK = 0;
    let totalPaymentSPK = 0;

    spkIds.forEach(idSPK => {
      totalHargaSPK += spkProductMap[idSPK] || 0;
      totalPaymentSPK += spkPaymentMap[idSPK] || 0;
    });

    return totalHargaSPK - totalPaymentSPK;
  };

  // Hitung total saldo seluruh supplier
  const totalSaldo = dataSupplier.reduce((acc, item) => acc + calculateSaldo(item.supplierName), 0);


  return (
    <>
      <Container>
        <div className='mt-4 px-4'>
          <div className='row'>
            <div className='col d-flex justify-content-between'>
              <Dropdown>
                <Dropdown.Toggle variant="light" id="dropdown-basic" className="text-sm px-2 py-1" style={{ border: "1px solid blue", borderRadius: "5px", color: "blue" }}>
                  Supplier
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/accounting/akun" className="dropdown-link">
                    Akun & Saldo Awal
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/customer" className="dropdown-link">
                    Customer
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/accounting/supplier" className="dropdown-link" style={{ color: "blue" }}>
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


            </div>
          </div>
        </div>

        <div style={{ ...tableContainerStyle, maxHeight: '75vh', overflowY: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>No</th>
                <th style={thStyle}>Kategori</th>
                <th style={thStyle}>Nama Supplier</th>
                <th style={thStyle}>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {dataSupplier.map((item, index) => {
                const saldo = calculateSaldo(item.supplierName);
                return (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#F4F4F4' : '#ffffff' }}>
                    <td style={{ border: '1px solid #c2c2c2', textAlign: 'center', padding: '8px', fontSize: '12px' }}>{index + 1}</td>
                    <td style={{ border: '1px solid #c2c2c2', padding: '8px', fontSize: '12px' }}>{item.category}</td>
                    <td style={{ border: '1px solid #c2c2c2', padding: '8px', fontSize: '12px' }}>{item.supplierName}</td>
                    <td style={{ border: '1px solid #c2c2c2', padding: '8px', fontSize: '12px' }}>Rp. {Number(saldo).toLocaleString('id-ID')}</td>
                  </tr>
                );
              })}
              <tr style={{ backgroundColor: '#E7E7E8' }} className='fw-semibold'>
                <td style={thTdStyle} colSpan={3}>Total :</td>
                <td style={thTdStyle}>Rp. {Number(totalSaldo).toLocaleString('id-ID')}</td>
              </tr>

            </tbody>
          </table>
        </div>

      </Container>
    </>
  );
};

export default Supplier;
