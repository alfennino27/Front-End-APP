import NavigationBar from '../Components/Navbar/NavigationBar';
import Hutang from '../Components/Accounting/Hutang';
import ButtonChat from '../Components/Chat/ButtonChat';
import LoadingMessage from '../Components/LoadingMessage/loading';
import { Helmet } from 'react-helmet-async';

const HutangPage = () => {
  return (
    <>
      <Helmet>
        <title>Hutang - KLF Apps</title>
      </Helmet>
      <LoadingMessage />
      <NavigationBar />
      <Hutang />
      {/* <ButtonChat /> */}
    </>
  );
};

export default HutangPage;
