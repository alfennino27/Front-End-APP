import NavigationBar from '../Components/Navbar/NavigationBar';
import LabaRugiPenjualan from '../Components/Accounting/LabaRugiPenjualan';
import { Helmet } from 'react-helmet-async';

const AccountingLabaRugiPenjualanPage = () => {
  return (
    <>
      <Helmet>
        <title>L/R Penjualan - KLF Apps</title>
      </Helmet>
      <NavigationBar />
      <LabaRugiPenjualan />
    </>
  );
};

export default AccountingLabaRugiPenjualanPage;
