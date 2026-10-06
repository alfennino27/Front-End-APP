import { Suspense } from 'react';
import lazyPage from './Utils/lazyPage';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Login from './Components/Auth/Login';
import ModalGuard from './Components/ModalGuard';

// Tiap halaman dimuat saat dibuka (code splitting). Dulu ke-64 halaman ada di
// SATU file JS 4 MB yang harus diunduh & di-parse sebelum ERP tampil.
const DashboardPage = lazyPage(() => import('./Pages/DashboardPage'));
const DashboardFinancePage = lazyPage(() => import('./Pages/DashboardFinancePage'));
const InvoicePage = lazyPage(() => import('./Pages/InvoicePage'));
const PekerjaanPage = lazyPage(() => import('./Pages/PekerjaanPage'));
const CalendarPage = lazyPage(() => import('./Pages/CalendarPage'));
const CetakLabelPage = lazyPage(() => import('./Pages/CetakLabelPage'));
const CetakLabelQCPage = lazyPage(() => import('./Pages/CetakLabelQCPage'));
const CetakLabelSupplierPage = lazyPage(() => import('./Pages/CetakLabelSupplierPage'));
const CetakSPKPage = lazyPage(() => import('./Pages/CetakSPKPage'));
const CetakGambarKerjaPage = lazyPage(() => import('./Pages/CetakGambarKerjaPage'));
const TestimoniLamaPage = lazyPage(() => import('./Pages/TestimoniLamaPage'));
const KLFAIPage = lazyPage(() => import('./Pages/KLFAIPage'));
const AccountingPage = lazyPage(() => import('./Pages/AccountingPage'));
const AccountingJurnalPage = lazyPage(() => import('./Pages/AccountingJurnalPage'));
const AccountingAkunPage = lazyPage(() => import('./Pages/AccountingAkunPage'));
const AccountingCustomerPage = lazyPage(() => import('./Pages/AccountingCustomerPage'));
const AccountingSupplierPage = lazyPage(() => import('./Pages/AccountingSupplierPage'));
const AccountingPiutangPage = lazyPage(() => import('./Pages/AccountingPiutangPage'));
const AccountingHutangPage = lazyPage(() => import('./Pages/AccountingHutangPage'));
const AccountingBukuBesarPage = lazyPage(() => import('./Pages/AccountingBukuBesarPage'));
const AccountingNeracaSaldoPage = lazyPage(() => import('./Pages/AccountingNeracaSaldoPage'));
const AccountingLabaRugiPenjualanPage = lazyPage(() => import('./Pages/AccountingLabaRugiPenjualanPage'));
const AccountingLabaRugiCashPage = lazyPage(() => import('./Pages/AccountingLabaRugiCashPage'));
const AccountingLabaRugiProfitPage = lazyPage(() => import('./Pages/AccountingLabaRugiProfitPage'));
const AccountingEvaluasiEstimasiPage = lazyPage(() => import('./Pages/AccountingEvaluasiEstimasiPage'));
const AccountingCekFinishingJokPage = lazyPage(() => import('./Pages/AccountingCekFinishingJokPage'));
const AccountingTemuanKoreksiPage = lazyPage(() => import('./Pages/AccountingTemuanKoreksiPage'));
const AccountingJurnalAssistantPage = lazyPage(() => import('./Pages/AccountingJurnalAssistantPage'));
const AccountingCashFlowPage = lazyPage(() => import('./Pages/AccountingCashFlowPage'));
const AccountingBalanceSheetPage = lazyPage(() => import('./Pages/AccountingBalanceSheetPage'));
const BooksPage = lazyPage(() => import('./Pages/BooksPage'));
const NotesPage = lazyPage(() => import('./Pages/NotesPage'));
const StoragePage = lazyPage(() => import('./Pages/StoragePage'));
const CrmPage = lazyPage(() => import('./Pages/CrmPage'));
const QuotePage = lazyPage(() => import('./Pages/QuotePage'));
const PengirimanPage = lazyPage(() => import('./Pages/PengirimanPage'));
const AbsensiPage = lazyPage(() => import('./Pages/AbsensiPage'));
const KnowledgePage = lazyPage(() => import('./Pages/KnowledgePage'));
const StockPage = lazyPage(() => import('./Pages/StockPage'));
const AssetsPage = lazyPage(() => import('./Pages/AssetsPage'));
const UserManagementPage = lazyPage(() => import('./Pages/UserManagementPage'));
const SpkPage = lazyPage(() => import('./Pages/SpkPage'));
const DetailPekerjaan = lazyPage(() => import('./Components/Pekerjaan/DetailPekerjaan'));
const Logout = lazyPage(() => import('./Components/Auth/Logout'));
const DirectLogin = lazyPage(() => import('./Components/Auth/DirectLogin'));
const Register = lazyPage(() => import('./Components/Auth/Register'));
const AppraisalPage = lazyPage(() => import('./Pages/AppraisalPage'));
const PriceListPage = lazyPage(() => import('./Pages/PriceListPage'));
const ProductsPage = lazyPage(() => import('./Pages/ProductsPage'));
const ProductNewPage = lazyPage(() => import('./Pages/ProductNewPage'));
const DesainProdukPage = lazyPage(() => import('./Pages/DesainProdukPage'));
const CategoryPage = lazyPage(() => import('./Pages/CategoryPage'));
const TodoPage = lazyPage(() => import('./Pages/TodoPage'));

const PageLoading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <div className="spinner-border text-primary" role="status" aria-label="Memuat halaman" />
  </div>
);

function App() {
  return (
    <Router>
      <ModalGuard />
      <Suspense fallback={<PageLoading />}>
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
        <Route path="/cetakLabelSupplier" element={<CetakLabelSupplierPage />} />
        <Route path="/cetakSPK" element={<CetakSPKPage />} />
        <Route path="/cetakGambarKerja" element={<CetakGambarKerjaPage />} />
        <Route path="/testimoni-lama" element={<TestimoniLamaPage />} />
        <Route path="/klf-ai" element={<KLFAIPage />} />
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
        <Route path="/accounting/evaluasi-estimasi" element={<AccountingEvaluasiEstimasiPage />} />
        <Route path="/accounting/cek-finishing-jok" element={<AccountingCekFinishingJokPage />} />
        <Route path="/accounting/temuan-koreksi" element={<AccountingTemuanKoreksiPage />} />
        <Route path="/accounting/jurnal-assistant" element={<AccountingJurnalAssistantPage />} />
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
        <Route path="/quote" element={<QuotePage />} />
        <Route path="/pengiriman" element={<PengirimanPage />} />
        <Route path="/quote/:id" element={<QuotePage />} />
        <Route path="/absensi" element={<AbsensiPage />} />
        <Route path="/knowledge" element={<KnowledgePage />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/appraisal" element={<AppraisalPage />} />
        <Route path="/pricelist" element={<PriceListPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/new" element={<ProductNewPage />} />
        <Route path="/desain" element={<DesainProdukPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/direct-login/:slug" element={<DirectLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/category" element={<CategoryPage />} />
        <Route path="/todo" element={<TodoPage />} />
      </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
