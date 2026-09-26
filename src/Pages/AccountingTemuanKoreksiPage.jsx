import NavigationBar from '../Components/Navbar/NavigationBar';
import TemuanKoreksi from '../Components/Accounting/TemuanKoreksi';
import { Helmet } from 'react-helmet-async';

const AccountingTemuanKoreksiPage = () => {
  return (
    <>
      <Helmet>
        <title>Temuan Koreksi - KLF Apps</title>
      </Helmet>
      <NavigationBar />
      <TemuanKoreksi />
    </>
  );
};

export default AccountingTemuanKoreksiPage;
