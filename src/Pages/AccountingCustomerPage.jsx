import NavigationBar from '../Components/Navbar/NavigationBar';
import Customer from '../Components/Accounting/Customer';
import { Helmet } from 'react-helmet-async';

const AccountingCustomerPage = () => {
  return (
    <>
      <Helmet>
        <title>Customer - KLF Apps</title>
      </Helmet>
      <NavigationBar />
      <Customer />
    </>
  );
};

export default AccountingCustomerPage;
