import NavigationBar from '../Components/Navbar/NavigationBar';
import CekFinishingJok from '../Components/Accounting/CekFinishingJok';
import { Helmet } from 'react-helmet-async';

const AccountingCekFinishingJokPage = () => {
  return (
    <>
      <Helmet>
        <title>Cek Finishing & Jok - KLF Apps</title>
      </Helmet>
      <NavigationBar />
      <CekFinishingJok />
    </>
  );
};

export default AccountingCekFinishingJokPage;
