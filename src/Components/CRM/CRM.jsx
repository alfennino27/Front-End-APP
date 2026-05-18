import React, { useRef, useEffect, useState } from 'react';
import { Col, Row, Modal, Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import '../Pekerjaan/pekerjaan.css';
import Box from '@mui/material/Box';
import Backdrop from '@mui/material/Backdrop';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import { FaPlus } from "react-icons/fa";

const CRM = () => {

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

  const isMobile = window.innerWidth <= 768;

  const actions =
    [
      { icon: <FaPlus />, name: 'Add Data', onClick: () => { } },
    ]



  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <Container>
        <Col md={12} className='lowonganPekerjaan overflow-auto pekerjaan p-2'>


          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            ...(isMobile ? { top: -1 } : { top: 0 }),
            backgroundColor: 'white',
            zIndex: 1,
            padding: '10px',
          }}>
            <h4 style={{ margin: 0 }}>Customer Relationship Management</h4>

            <div>
              <select style={{
                fontSize: '16px',
                padding: '0px 12px',
                borderRadius: '10px',
                border: '1px solid #ccc',
                outline: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                backgroundColor: '#fff',
                marginRight: '5px'
              }}>
                <option value="All">All</option>
                <option value="September">September</option>
                <option value="Oktober">Oktober</option>
              </select>

              <select style={{
                fontSize: '16px',
                padding: '0px 12px',
                borderRadius: '10px',
                border: '1px solid #ccc',
                outline: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                backgroundColor: '#fff',
              }}>
                <option value="All">All</option>
                <option value="Status 1">Status 1</option>
                <option value="Status 2">Status 2</option>
                <option value="Status 3">Status 3</option>
                <option value="Status 4">Status 4</option>
                <option value="Status 5">Status 5</option>
              </select>
            </div>
          </div>


          <div className='SPK mt-1 shadow'>
            <div className='p-2'>
              <table>
                <thead>
                  <tr>
                    <th className='tableStyle text-center'>No</th>
                    <th className='tableStyle text-center'>Tanggal</th>
                    <th className='tableStyle text-center'>Nama</th>
                    <th className='tableStyle text-center'>Status</th>
                  </tr>
                </thead>
                <tbody>

                  {/* {dataPengeluaranFromDB.map((pengeluaran, index) => (
                  <tr key={index} onClick={() => handleEditPengeluaran(pengeluaran.id, pengeluaran.tanggalPengeluaran, pengeluaran.kategoriPengeluaran, pengeluaran.keteranganPengeluaran, pengeluaran.nominalPengeluaran)}>
                    <td className='tableStyle text-center'>{index + 1}</td>
                    <td className='tableStyle text-center'>{new Date(pengeluaran.tanggalPengeluaran).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                    <td className='tableStyle text-center'>{pengeluaran.kategoriPengeluaran}</td>
                    <td className='tableStyle text-center'>{pengeluaran.keteranganPengeluaran}</td>
                    <td className='tableStyle text-center'>Rp. {Number(pengeluaran.nominalPengeluaran).toLocaleString('id-ID')}</td>
                  </tr>
                ))} */}


                  <tr >
                    <td className='tableStyle text-center'>1</td>
                    <td className='tableStyle text-center'>25 September 2024</td>
                    <td className='tableStyle text-center'>Joe Biden</td>
                    <td className='tableStyle text-center'><span className='bg-success text-white border border-secondary rounded p-1'>Status 5</span></td>
                  </tr>
                  <tr >
                    <td className='tableStyle text-center'>2</td>
                    <td className='tableStyle text-center'>25 September 2024</td>
                    <td className='tableStyle text-center'>Vladimir Putin</td>
                    <td className='tableStyle text-center'><span className='bg-primary text-white border border-secondary rounded p-1'>Status 3</span></td>
                  </tr>
                  <tr >
                    <td className='tableStyle text-center'>3</td>
                    <td className='tableStyle text-center'>26 September 2024</td>
                    <td className='tableStyle text-center'>Erdogan</td>
                    <td className='tableStyle text-center'><span className='bg-warning text-white border border-secondary rounded p-1'>Status 2</span></td>
                  </tr>
                  <tr >
                    <td className='tableStyle text-center'>4</td>
                    <td className='tableStyle text-center'>27 September 2024</td>
                    <td className='tableStyle text-center'>Prabowo Subianto</td>
                    <td className='tableStyle text-center'><span className='bg-primary text-white border border-secondary rounded p-1'>Status 3</span></td>
                  </tr>
                  <tr >
                    <td className='tableStyle text-center'>5</td>
                    <td className='tableStyle text-center'>28 September 2024</td>
                    <td className='tableStyle text-center'>Xi Jinping</td>
                    <td className='tableStyle text-center'><span className='bg-danger text-white border border-secondary rounded p-1'>Status 1</span></td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>





        </Col>
      </Container>



      <Box sx={{ height: 150, transform: 'translateZ(0px)', flexGrow: 1, position: 'fixed', bottom: 16, right: 16 }}>
        <SpeedDial
          ariaLabel="SpeedDial tooltip example"
          icon={<SpeedDialIcon />}
          onClose={handleClose}
          onOpen={handleOpen}
          open={open}
        >
          {actions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.onClick}
              tooltipOpen
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                '& .MuiSpeedDialAction-staticTooltipLabel': {
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  minWidth: '160px', // Adjust this to ensure enough space for text
                  whiteSpace: 'nowrap',
                },
              }}
            />
          ))}
        </SpeedDial>
      </Box>
    </>
  );
};



export default CRM;
