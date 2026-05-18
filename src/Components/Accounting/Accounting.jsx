import React, { useRef, useEffect, useState } from 'react';
import { Col, Row, Modal, Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../ThemeContext';
import '../Accounting/Accounting.css';

const Accounting = () => {
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

  const buttons = [
    { label: 'Akun & Saldo Awal', to: '/accounting/akun' },
    { label: 'Buku Besar', to: '/accounting/buku-besar' },
    { label: 'Jurnal', to: '/accounting/jurnal' },

    { label: 'Customer', to: '/accounting/customer' },
    { label: 'Neraca Saldo', to: '/accounting/neraca-saldo' },
    { label: 'Balance Sheet', to: '/accounting/balance-sheet' },

    { label: 'Supplier', to: '/accounting/supplier' },
    { label: 'Laba - Rugi Penjualan', to: '/accounting/laba-rugi-penjualan' },
    { label: 'Jurnal Penyesuaian', to: '/accounting/jurnal-penyesuaian' },

    { label: 'Aset', to: '/accounting/aset' },
    { label: 'Laba - Rugi Cash', to: '/accounting/laba-rugi-cash' },
    { label: 'Cash Flow', to: '/accounting/cash-flow' },

    { label: 'Piutang', to: '/accounting/piutang' },
    { label: 'Laba - Rugi Profit', to: '/accounting/laba-rugi-profit' },
    { label: 'Hutang', to: '/accounting/hutang' },
  ];


  return (
    <>
      <h1 className="text-center mb-4 mt-4 fw-semibold" style={{ color: globalTheme === "light" ? "blue" : 'white' }}>Accounting</h1>
      <div className="container">
        <div className="row row-cols-1 row-cols-md-3 g-4">
          {buttons.map((button, index) => (
            <div className="col" key={index}>
              <Link
                to={button.to}
                className="btn btn-light w-100 text-primary text-center border border-primary py-3"
              >
                {button.label}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};



export default Accounting;
