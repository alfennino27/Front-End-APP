import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Col, Row, Modal, Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useNavigate } from 'react-router-dom';
import '../Pekerjaan/pekerjaan.css';
import { MdFormatListBulletedAdd } from 'react-icons/md';
import { debounce } from 'lodash';
import { FaFileInvoice, FaPaste, FaSearch } from 'react-icons/fa';
import { CiEdit } from 'react-icons/ci';
import { Image, Select } from 'antd';
import { useTheme } from '../../ThemeContext';
import { getImageUrl } from '../../Utils/image';

const Stock = () => {
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



  //mulai:
  const [dataStorageFolder, setDataStorageFolder] = useState([]);
  const [selectedStorageFolder, setSelectedStorageFolder] = useState(null);
  const [dataProjects, setDataProjects] = useState([]);
  const [dataSPKproduct, setDataSPKproduct] = useState([]);

  const fetchDataStorageFolder = async () => {
    try {
      const res = await fetch(`${baseUrl}/storagefolder/get`);
      const data = await res.json();
      setDataStorageFolder(data);
    } catch (err) {
      console.error('Error fetching StockKeluar:', err);
    }
  };

  const fetchDataProjects = async () => {
    try {
      const res = await fetch(`${baseUrl}/projects/get`);
      const data = await res.json();
      setDataProjects(data);
    } catch (err) {
      console.error('Error fetching StockKeluar:', err);
    }
  };

  const fetchDataSPKproducts = async () => {
    try {
      const res = await fetch(`${baseUrl}/spkproduct/all/get`);
      const data = await res.json();
      setDataSPKproduct(data);
    } catch (err) {
      console.error('Gagal mengambil data SPKproduct:', err);
    }
  };

  useEffect(() => {
    fetchDataStorageFolder();
    fetchDataProjects();
    fetchDataSPKproducts();
  }, []);

  return (
    <>
      <Container>
        <Col md={12} className='lowonganPekerjaan overflow-auto pekerjaan px-2'>


          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            ...(isMobile ? { top: -1 } : { top: 0 }),
            zIndex: 1,
            padding: '10px',
            backgroundColor: "transparent",
            color: globalTheme === "light" ? "black" : 'white',
            transition: "background-color 1s ease",
          }}>
            <h4 style={{ margin: 0 }}>Price List</h4>

            <div>

              <Select
                showSearch
                placeholder="Select Category"
                optionFilterProp="label"
                style={{ marginRight: "10px" }}
                onChange={(value) => setSelectedStorageFolder(value)}
                options={dataStorageFolder.map(folder => ({
                  value: folder._id,
                  label: folder.name,
                }))}
              />



            </div>
          </div>


          <div style={{ backgroundColor: "white", borderRadius: '15px', paddingTop: "6px", paddingLeft: "6px", boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)', border: '1px solid #ddd' }}>
            <div
              style={{
                maxHeight: '77vh',
                overflow: 'auto', // SCROLL VERTIKAL & HORIZONTAL
                borderRadius: '12px',
                backgroundColor: 'white',
              }}
            >
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
                      'No', 'Gambar', 'Nama', 'Invoice', 'Deskripsi',
                      'Stainless', 'Besi', 'Kayu', 'Jok', 'Rotan', 'Finishing',
                      'Marmer', 'Fiber', 'Veneer', 'HPP', 'Jual', 'Qty', 'GP', '%'
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
                  {Array.isArray(dataProjects) && dataProjects.length > 0 ? (
                    selectedStorageFolder ? (
                      dataProjects.filter((item) => item.StorageFolder === selectedStorageFolder).map((item, index) => {

                        const getCorrectIdProduct = (spkproduct) => spkproduct.idProduct || spkproduct.idProductBackUp;

                        const stainlessItems = dataSPKproduct.filter(spkproduct => getCorrectIdProduct(spkproduct) === item.id && spkproduct.category === "Stainless");
                        const besiItems = dataSPKproduct.filter(spkproduct => getCorrectIdProduct(spkproduct) === item.id && spkproduct.category === "Besi");
                        const kayuItems = dataSPKproduct.filter(spkproduct => getCorrectIdProduct(spkproduct) === item.id && spkproduct.category === "Kayu");
                        const jokItems = dataSPKproduct.filter(spkproduct => getCorrectIdProduct(spkproduct) === item.id && spkproduct.category === "Jok");
                        const rotanItems = dataSPKproduct.filter(spkproduct => getCorrectIdProduct(spkproduct) === item.id && spkproduct.category === "Rotan");
                        const finishingItems = dataSPKproduct.filter(spkproduct => getCorrectIdProduct(spkproduct) === item.id && spkproduct.category === "Finishing");
                        const marmerItems = dataSPKproduct.filter(spkproduct => getCorrectIdProduct(spkproduct) === item.id && spkproduct.category === "Marmer");
                        const fiberItems = dataSPKproduct.filter(spkproduct => getCorrectIdProduct(spkproduct) === item.id && spkproduct.category === "Fiber");
                        const veneerItems = dataSPKproduct.filter(spkproduct => getCorrectIdProduct(spkproduct) === item.id && spkproduct.category === "Veneer");


                        // Calculate total prices for each category
                        const totalStainlessPrice = stainlessItems.reduce((sum, spkproduct) => sum + Number(spkproduct.harga), 0);
                        const totalBesiPrice = besiItems.reduce((sum, spkproduct) => sum + Number(spkproduct.harga), 0);
                        const totalKayuPrice = kayuItems.reduce((sum, spkproduct) => sum + Number(spkproduct.harga), 0);
                        const totalJokPrice = jokItems.reduce((sum, spkproduct) => sum + Number(spkproduct.harga), 0);
                        const totalRotanPrice = rotanItems.reduce((sum, spkproduct) => sum + Number(spkproduct.harga), 0);
                        const totalFinishingPrice = finishingItems.reduce((sum, spkproduct) => sum + Number(spkproduct.harga), 0);
                        const totalMarmerPrice = marmerItems.reduce((sum, spkproduct) => sum + Number(spkproduct.harga), 0);
                        const totalFiberPrice = fiberItems.reduce((sum, spkproduct) => sum + Number(spkproduct.harga), 0);
                        const totalVeneerPrice = veneerItems.reduce((sum, spkproduct) => sum + Number(spkproduct.harga), 0);

                        const hpp =
                          totalStainlessPrice +
                          totalBesiPrice +
                          totalKayuPrice +
                          totalJokPrice +
                          totalRotanPrice +
                          totalFinishingPrice +
                          totalMarmerPrice +
                          totalFiberPrice +
                          totalVeneerPrice;

                        return (
                          <tr
                            key={index}
                            style={{
                              borderBottom: '1px solid #eee',
                              transition: 'background 0.2s',
                              cursor: 'pointer',
                            }}
                          >
                            <td style={{ padding: '8px' }}>{index + 1}</td>
                            <td style={{ padding: '8px' }}>
                              {item.image1 && (
                                <Image
                                  width={100}
                                  height={100}
                                  src={getImageUrl(item.image1)}
                                  style={{ borderRadius: '8px', objectFit: 'cover' }}
                                  alt="gambar"
                                />
                              )}
                            </td>
                            <td style={{ padding: '8px' }}>{item.NamaBarang}</td>
                            <td style={{ padding: '8px' }}>{item.KodeInvoice}</td>
                            <td style={{ padding: '8px', whiteSpace: 'pre-line' }}>{item.Spesifikasi}</td>
                            <td style={{ padding: '8px' }}>{totalStainlessPrice ? `Rp. ${totalStainlessPrice.toLocaleString('id-ID')}` : ''}</td>
                            <td style={{ padding: '8px' }}>{totalBesiPrice ? `Rp. ${totalBesiPrice.toLocaleString('id-ID')}` : ''}</td>
                            <td style={{ padding: '8px' }}>{totalKayuPrice ? `Rp. ${totalKayuPrice.toLocaleString('id-ID')}` : ''}</td>
                            <td style={{ padding: '8px' }}>{totalJokPrice ? `Rp. ${totalJokPrice.toLocaleString('id-ID')}` : ''}</td>
                            <td style={{ padding: '8px' }}>{totalRotanPrice ? `Rp. ${totalRotanPrice.toLocaleString('id-ID')}` : ''}</td>
                            <td style={{ padding: '8px' }}>{totalFinishingPrice ? `Rp. ${totalFinishingPrice.toLocaleString('id-ID')}` : ''}</td>
                            <td style={{ padding: '8px' }}>{totalMarmerPrice ? `Rp. ${totalMarmerPrice.toLocaleString('id-ID')}` : ''}</td>
                            <td style={{ padding: '8px' }}>{totalFiberPrice ? `Rp. ${totalFiberPrice.toLocaleString('id-ID')}` : ''}</td>
                            <td style={{ padding: '8px' }}>{totalVeneerPrice ? `Rp. ${totalVeneerPrice.toLocaleString('id-ID')}` : ''}</td>
                            <td style={{ padding: '8px' }}>Rp. {hpp.toLocaleString('id-ID')}</td>
                            <td style={{ padding: '8px' }}>Rp. {Number(item.Harga).toLocaleString('id-ID')}</td>
                            <td style={{ padding: '8px' }}>{item.Qty}</td>
                            <td style={{ padding: '8px' }}>Rp. {(Number(item.Harga) - hpp).toLocaleString('id-ID')}</td>
                            <td style={{ padding: '8px' }}>{((Number(item.Harga) - hpp) / Number(item.Harga)).toLocaleString('id-ID')}%</td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan="19" style={{ padding: '12px', textAlign: 'center' }}>
                          Please select a category first
                        </td>
                      </tr>
                    )
                  ) : (
                    <tr>
                      <td colSpan="16" style={{ padding: '12px', textAlign: 'center' }}>
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>







        </Col>
      </Container>

    </>
  );
};



export default Stock;
