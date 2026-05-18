import NavigationBar from '../Components/Navbar/NavigationBar';
import BukuBesar from '../Components/Accounting/BukuBesar';
import { Helmet } from 'react-helmet-async';

const AccountingBukuBesarPage = () => {
  return (
    <>
      <Helmet>
        <title>Buku Besar - KLF Apps</title>
      </Helmet>
      <NavigationBar />
      <BukuBesar />
    </>
  );
};

export default AccountingBukuBesarPage;
