import NavigationBar from '../Components/Navbar/NavigationBar';
import BalanceSheet from '../Components/Accounting/BalanceSheet';
import ButtonChat from '../Components/Chat/ButtonChat';
import LoadingMessage from '../Components/LoadingMessage/loading';
import { Helmet } from 'react-helmet-async';

const BalanceSheetPage = () => {
  return (
    <>
      <Helmet>
        <title>Balance Sheet - KLF Apps</title>
      </Helmet>
      <LoadingMessage />
      <NavigationBar />
      <BalanceSheet />
      {/* <ButtonChat /> */}
    </>
  );
};

export default BalanceSheetPage;
