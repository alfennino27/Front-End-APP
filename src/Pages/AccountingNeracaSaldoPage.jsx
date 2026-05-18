import NavigationBar from '../Components/Navbar/NavigationBar';
import NeracaSaldo from '../Components/Accounting/NeracaSaldo';
import ButtonChat from '../Components/Chat/ButtonChat';
import LoadingMessage from '../Components/LoadingMessage/loading';
import { Helmet } from 'react-helmet-async';

const NeracaSaldoPage = () => {
  return (
    <>
      <Helmet>
        <title>Neraca Saldo - KLF Apps</title>
      </Helmet>
      <LoadingMessage />
      <NavigationBar />
      <NeracaSaldo />
      {/* <ButtonChat /> */}
    </>
  );
};

export default NeracaSaldoPage;
