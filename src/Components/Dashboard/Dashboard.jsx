import React, { useRef, useEffect, useState } from 'react';
import { Col, Row, Modal, Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../ThemeContext';

const Dashboard = () => {
  const { globalTheme } = useTheme();
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;
  useEffect(() => {
    const cekLogin = () => {
      if (user == null) {
        window.location.replace('/login');
      }
      if (user.uid === 'fYpdHwXRDLhj5XGxM5FZIAvxp9E2' || user.uid === 'w4M5JJjgGQeHFbS2nkyoCfUBE532' || user.uid === 'gwsOqUgVXSPyWFMMHr4bJteBoYs1' || user.uid === 'ep15dsFMceTBAyZvpZDiAJ4kMME3') {
        console.log('success');
      } else {
        window.location.replace('/project');
      }
    };

    cekLogin();
  }, []);

  const buttons = [
    { label: 'Finance', to: '/dashboard/finance' },
    // { label: 'Buku Besar', to: '/dashboard/buku-besar' },
    // { label: 'Jurnal', to: '/dashboard/jurnal' },

    // { label: 'Customer', to: '/dashboard/customer' },
    // { label: 'Neraca Saldo', to: '/dashboard/neraca-saldo' },
    // { label: 'Balance Sheet', to: '/dashboard/balance-sheet' },

    // { label: 'Supplier', to: '/dashboard/supplier' },
    // { label: 'Laba - Rugi Penjualan', to: '/dashboard/laba-rugi-penjualan' },
    // { label: 'Jurnal Penyesuaian', to: '/dashboard/jurnal-penyesuaian' },

    // { label: 'Aset', to: '/dashboard/aset' },
    // { label: 'Laba - Rugi Cash', to: '/dashboard/laba-rugi-cash' },
    // { label: 'Cash Flow', to: '/dashboard/cash-flow' },

    // { label: 'Piutang', to: '/dashboard/piutang' },
    // { label: 'Laba - Rugi Profit', to: '/dashboard/laba-rugi-profit' },
    // { label: 'Hutang', to: '/dashboard/hutang' },
  ];


  return (
    <>
      <h1 className="text-center mb-4 mt-4 fw-semibold" style={{ color: globalTheme === "light" ? "blue" : 'white' }}>Dashboard</h1>
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



export default Dashboard;
