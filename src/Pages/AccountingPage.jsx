import NavigationBar from '../Components/Navbar/NavigationBar';
import Accounting from '../Components/Accounting/Accounting';
import { Helmet } from 'react-helmet-async';

const AccountingPage = () => {
  return (
    <>
      <Helmet>
        <title>Accounting - KLF Apps</title>
      </Helmet>
      <NavigationBar />
      <Accounting />
    </>
  );
};

export default AccountingPage;
