import NavigationBar from '../Components/Navbar/NavigationBar';
import Invoice from '../Components/Pekerjaan/Invoice';
import ButtonChat from '../Components/Chat/ButtonChat';
import LoadingMessage from '../Components/LoadingMessage/loading';
import { Helmet } from 'react-helmet-async';

const InvoicePage = () => {
  return (
    <>
      <Helmet>
        <title>Invoice - KLF Apps</title>
      </Helmet>
      <LoadingMessage />
      <NavigationBar />
      <Invoice />
      {/* <ButtonChat /> */}
    </>
  );
};

export default InvoicePage;
