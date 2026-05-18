import NavigationBar from '../Components/Navbar/NavigationBar';
import Spk from '../Components/Pekerjaan/Spk';
import ButtonChat from '../Components/Chat/ButtonChat';
import LoadingMessage from '../Components/LoadingMessage/loading';
import { Helmet } from 'react-helmet-async';

const SpkPage = () => {
  return (
    <>
      <Helmet>
        <title>SPK - KLF Apps</title>
      </Helmet>
      {/* <LoadingMessage /> */}
      <NavigationBar />
      <Spk />
      {/* <ButtonChat /> */}
    </>
  );
};

export default SpkPage;
