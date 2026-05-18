import NavigationBar from '../Components/Navbar/NavigationBar';
import Piutang from '../Components/Accounting/Piutang';
import ButtonChat from '../Components/Chat/ButtonChat';
import LoadingMessage from '../Components/LoadingMessage/loading';
import { Helmet } from 'react-helmet-async';

const PiutangPage = () => {
  return (
    <>
      <Helmet>
        <title>Piutang - KLF Apps</title>
      </Helmet>
      <LoadingMessage />
      <NavigationBar />
      <Piutang />
      {/* <ButtonChat /> */}
    </>
  );
};

export default PiutangPage;
