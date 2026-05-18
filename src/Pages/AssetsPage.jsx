import NavigationBar from '../Components/Navbar/NavigationBar';
import Assets from '../Components/Assets/Assets';
import LoadingMessage from '../Components/LoadingMessage/loading';
import { Helmet } from 'react-helmet-async';

const AssetsPage = () => {
  return (
    <>
      <Helmet>
        <title>Assets - KLF Apps</title>
      </Helmet>
      <LoadingMessage />
      <NavigationBar />
      <Assets />
      {/* <ButtonChat /> */}
    </>
  );
};

export default AssetsPage;
