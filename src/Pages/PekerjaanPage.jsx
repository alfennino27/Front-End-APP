import NavigationBar from '../Components/Navbar/NavigationBar';
import Pekerjaan from '../Components/Pekerjaan/Pekerjaan';
import ButtonChat from '../Components/Chat/ButtonChat';
import { Helmet } from 'react-helmet-async';

const PekerjaanPage = () => {
  return (
    <>
      <Helmet>
        <title>Projects - KLF Apps</title>
      </Helmet>
      <NavigationBar />
      <Pekerjaan />
      {/* <ButtonChat /> */}
    </>
  );
};

export default PekerjaanPage;
