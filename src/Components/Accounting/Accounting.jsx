import React, { useRef, useEffect, useState } from 'react';
import { Col, Row, Modal, Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../ThemeContext';
import '../Accounting/Accounting.css';
import { ACCOUNTING_MENU } from './AccountingMenu';

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

  // Daftar menu dari AccountingMenu.jsx (satu sumber dengan dropdown).
  const buttons = ACCOUNTING_MENU;


  return (
    <>
      <h1 className="text-center mb-4 mt-4 fw-semibold" style={{ color: globalTheme === "light" ? "blue" : 'white' }}>Accounting</h1>
      <div className="container">
        <div className="accounting-menu-grid">
          {buttons.map((button, index) => (
            <div key={index}>
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
