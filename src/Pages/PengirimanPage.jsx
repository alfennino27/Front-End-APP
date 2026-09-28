import NavigationBar from '../Components/Navbar/NavigationBar';
import Pengiriman from '../Components/Pengiriman/Pengiriman';
import LoadingMessage from '../Components/LoadingMessage/loading';
import { Helmet } from 'react-helmet-async';

const PengirimanPage = () => {
  return (
    <>
      <Helmet>
        <title>Pengiriman - KLF Apps</title>
      </Helmet>
      <LoadingMessage />
      <NavigationBar />
      <Pengiriman />
    </>
  );
};

export default PengirimanPage;
