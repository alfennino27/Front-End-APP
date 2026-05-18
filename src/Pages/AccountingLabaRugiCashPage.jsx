import NavigationBar from '../Components/Navbar/NavigationBar';
import LabaRugiCash from '../Components/Accounting/LabaRugiCash';
import { Helmet } from 'react-helmet-async';

const AccountingLabaRugiCashPage = () => {
  return (
    <>
      <Helmet>
        <title>L/R Cash - KLF Apps</title>
      </Helmet>
      <NavigationBar />
      <LabaRugiCash />
    </>
  );
};

export default AccountingLabaRugiCashPage;
