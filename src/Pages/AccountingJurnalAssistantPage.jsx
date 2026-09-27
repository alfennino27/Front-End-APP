import NavigationBar from '../Components/Navbar/NavigationBar';
import JurnalAssistant from '../Components/Accounting/JurnalAssistant';
import { Helmet } from 'react-helmet-async';

const AccountingJurnalAssistantPage = () => {
  return (
    <>
      <Helmet>
        <title>Jurnal Assistant - KLF Apps</title>
      </Helmet>
      <NavigationBar />
      <JurnalAssistant />
    </>
  );
};

export default AccountingJurnalAssistantPage;
