import NavigationBar from '../Components/Navbar/NavigationBar';
import Jurnal from '../Components/Accounting/Jurnal';
import { Helmet } from 'react-helmet-async';

const AccountingJurnalPage = () => {
  return (
    <>
      <Helmet>
        <title>Jurnal - KLF Apps</title>
      </Helmet>
      <NavigationBar />
      <Jurnal />
    </>
  );
};

export default AccountingJurnalPage;
