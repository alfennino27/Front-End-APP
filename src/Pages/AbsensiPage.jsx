import NavigationBar from '../Components/Navbar/NavigationBar';
import Absensi from '../Components/Absensi/Absensi';
import LoadingMessage from '../Components/LoadingMessage/loading';
import { Helmet } from 'react-helmet-async';

const AbsensiPage = () => {
  return (
    <>
      <Helmet>
        <title>Absensi - KLF Apps</title>
      </Helmet>
      <LoadingMessage />
      <NavigationBar />
      <Absensi />
    </>
  );
};

export default AbsensiPage;
