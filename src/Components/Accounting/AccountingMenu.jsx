import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

// SATU sumber daftar menu Accounting — dipakai grid halaman /accounting DAN
// dropdown di tiap halaman accounting. Tambah menu baru cukup di sini.
// Urutan = per kolom di grid desktop (kolom 1 data master, kolom 2 laporan,
// kolom 3 jurnal) — grid memakai grid-auto-flow: column.
export const ACCOUNTING_MENU = [
  { label: 'Akun & Saldo Awal', to: '/accounting/akun' },
  { label: 'Customer', to: '/accounting/customer' },
  { label: 'Supplier', to: '/accounting/supplier' },
  { label: 'Aset', to: '/accounting/aset' },
  { label: 'Piutang', to: '/accounting/piutang' },
  { label: 'Evaluasi Estimasi', to: '/accounting/evaluasi-estimasi' },

  { label: 'Buku Besar', to: '/accounting/buku-besar' },
  { label: 'Neraca Saldo', to: '/accounting/neraca-saldo' },
  { label: 'Laba - Rugi Penjualan', to: '/accounting/laba-rugi-penjualan' },
  { label: 'Laba - Rugi Cash', to: '/accounting/laba-rugi-cash' },
  { label: 'Laba - Rugi Profit', to: '/accounting/laba-rugi-profit' },
  { label: 'Cek Finishing & Jok', to: '/accounting/cek-finishing-jok' },

  { label: 'Jurnal', to: '/accounting/jurnal' },
  { label: 'Balance Sheet', to: '/accounting/balance-sheet' },
  { label: 'Jurnal Penyesuaian', to: '/accounting/jurnal-penyesuaian' },
  { label: 'Cash Flow', to: '/accounting/cash-flow' },
  { label: 'Hutang', to: '/accounting/hutang' },
  { label: 'Temuan Koreksi', to: '/accounting/temuan-koreksi' },
];

// Dropdown navigasi antar halaman accounting. Label tombol = halaman aktif.
const AccountingMenu = () => {
  const { pathname } = useLocation();
  const aktif = ACCOUNTING_MENU.find((m) => pathname.startsWith(m.to));

  return (
    <Dropdown>
      <Dropdown.Toggle variant="light" id="dropdown-accounting" className="text-sm px-2 py-1" style={{ border: '1px solid blue', borderRadius: '5px', color: 'blue' }}>
        {aktif?.label.replace(' - ', ' ') || 'Accounting'}
      </Dropdown.Toggle>
      <Dropdown.Menu style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <Dropdown.Item as={Link} to="/accounting" className="dropdown-link" style={{ fontWeight: 600 }}>
          ← Semua menu Accounting
        </Dropdown.Item>
        <Dropdown.Divider />
        {ACCOUNTING_MENU.map((m) => (
          <Dropdown.Item
            key={m.to}
            as={Link}
            to={m.to}
            className="dropdown-link"
            style={m === aktif ? { color: 'blue' } : undefined}
          >
            {m.label}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default AccountingMenu;
