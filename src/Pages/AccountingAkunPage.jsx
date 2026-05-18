import NavigationBar from '../Components/Navbar/NavigationBar';
import Akun from '../Components/Accounting/Akun';
import { Helmet } from 'react-helmet-async';

const AccountingAkunPage = () => {
  return (
    <>
      <Helmet>
        <title>Akun - KLF Apps</title>
      </Helmet>
      <NavigationBar />
      <Akun />
    </>
  );
};

export default AccountingAkunPage;
