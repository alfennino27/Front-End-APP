import NavigationBar from '../Components/Navbar/NavigationBar';
import Supplier from '../Components/Accounting/Supplier';
import { Helmet } from 'react-helmet-async';

const AccountingSupplierPage = () => {
  return (
    <>
      <Helmet>
        <title>Supplier - KLF Apps</title>
      </Helmet>
      <NavigationBar />
      <Supplier />
    </>
  );
};

export default AccountingSupplierPage;
