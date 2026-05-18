import NavigationBar from '../Components/Navbar/NavigationBar';
import CRM from '../Components/CRM/CRM';
import LoadingMessage from '../Components/LoadingMessage/loading';
import { Helmet } from 'react-helmet-async';

const CrmPage = () => {
  return (
    <>
      <Helmet>
        <title>CRM - KLF Apps</title>
      </Helmet>
      <LoadingMessage />
      <NavigationBar />
      <CRM />
      {/* <ButtonChat /> */}
    </>
  );
};

export default CrmPage;
