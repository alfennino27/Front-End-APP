import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import DashboardPage from './Pages/DashboardPage';
import DashboardFinancePage from './Pages/DashboardFinancePage';
import InvoicePage from './Pages/InvoicePage';
import PekerjaanPage from './Pages/PekerjaanPage';
import CalendarPage from './Pages/CalendarPage';
import CetakLabelPage from './Pages/CetakLabelPage';
import CetakLabelQCPage from './Pages/CetakLabelQCPage';
import AccountingPage from './Pages/AccountingPage';
import AccountingJurnalPage from './Pages/AccountingJurnalPage';
import AccountingAkunPage from './Pages/AccountingAkunPage';
import AccountingCustomerPage from './Pages/AccountingCustomerPage';
import AccountingSupplierPage from './Pages/AccountingSupplierPage';
import AccountingPiutangPage from './Pages/AccountingPiutangPage';
import AccountingHutangPage from './Pages/AccountingHutangPage';
import AccountingBukuBesarPage from './Pages/AccountingBukuBesarPage';
import AccountingNeracaSaldoPage from './Pages/AccountingNeracaSaldoPage';
import AccountingLabaRugiPenjualanPage from './Pages/AccountingLabaRugiPenjualanPage';
import AccountingLabaRugiCashPage from './Pages/AccountingLabaRugiCashPage';
import AccountingLabaRugiProfitPage from './Pages/AccountingLabaRugiProfitPage';
import AccountingCashFlowPage from './Pages/AccountingCashFlowPage';
import AccountingBalanceSheetPage from './Pages/AccountingBalanceSheetPage';
import BooksPage from './Pages/BooksPage';
import NotesPage from './Pages/NotesPage';
import StoragePage from './Pages/StoragePage';
import CrmPage from './Pages/CrmPage';
import StockPage from './Pages/StockPage';
import AssetsPage from './Pages/AssetsPage';
import UserManagementPage from './Pages/UserManagementPage';
import SpkPage from './Pages/SpkPage';
import DetailPekerjaan from './Components/Pekerjaan/DetailPekerjaan';
import Login from './Components/Auth/Login';
import Logout from './Components/Auth/Logout';
import DirectLogin from './Components/Auth/DirectLogin';
import Register from './Components/Auth/Register';
import AppraisalPage from './Pages/AppraisalPage';
import PriceListPage from './Pages/PriceListPage';
import ProductsPage from './Pages/ProductsPage';
import CategoryPage from './Pages/CategoryPage';
import TodoPage from './Pages/TodoPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        {/* <Route path="/" element={<PekerjaanPage />} /> */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/finance" element={<DashboardFinancePage />} />
        <Route path="/home" element={<PekerjaanPage />} />
        <Route path="/invoice" element={<InvoicePage />} />
        <Route path="/invoice/:slug" element={<InvoicePage />} />
        <Route path="/project" element={<PekerjaanPage />} />
        <Route path="/project/:slug" element={<PekerjaanPage />} />
        <Route path="/project/:slug/:categorySearch" element={<PekerjaanPage />} />
        <Route path="/project/:slug/:categorySearch/:idSearch" element={<PekerjaanPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/cetakLabel" element={<CetakLabelPage />} />
        <Route path="/cetakLabelQC" element={<CetakLabelQCPage />} />
        <Route path="/accounting" element={<AccountingPage />} />
        <Route path="/accounting/jurnal" element={<AccountingJurnalPage />} />
        <Route path="/accounting/akun" element={<AccountingAkunPage />} />
        <Route path="/accounting/customer" element={<AccountingCustomerPage />} />
        <Route path="/accounting/supplier" element={<AccountingSupplierPage />} />
        <Route path="/accounting/piutang" element={<AccountingPiutangPage />} />
        <Route path="/accounting/hutang" element={<AccountingHutangPage />} />
        <Route path="/accounting/buku-besar" element={<AccountingBukuBesarPage />} />
        <Route path="/accounting/neraca-saldo" element={<AccountingNeracaSaldoPage />} />
        <Route path="/accounting/laba-rugi-penjualan" element={<AccountingLabaRugiPenjualanPage />} />
        <Route path="/accounting/laba-rugi-cash" element={<AccountingLabaRugiCashPage />} />
        <Route path="/accounting/laba-rugi-profit" element={<AccountingLabaRugiProfitPage />} />
        <Route path="/accounting/cash-flow" element={<AccountingCashFlowPage />} />
        <Route path="/accounting/balance-sheet" element={<AccountingBalanceSheetPage />} />
        <Route path="/spk" element={<SpkPage />} />
        <Route path="/spk/:slug" element={<SpkPage />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/catalog" element={<StoragePage />} />
        <Route path="/catalog/:slug" element={<StoragePage />} />
        <Route path="/catalog/:slug/:projectSlug" element={<StoragePage />} />
        <Route path="/user-management" element={<UserManagementPage />} />
        <Route path="/crm" element={<CrmPage />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/appraisal" element={<AppraisalPage />} />
        <Route path="/pricelist" element={<PriceListPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/direct-login/:slug" element={<DirectLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/category" element={<CategoryPage />} />
        <Route path="/todo" element={<TodoPage />} />
      </Routes>
    </Router>
  );
}

export default App;
