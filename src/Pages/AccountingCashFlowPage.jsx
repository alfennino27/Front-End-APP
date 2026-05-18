import NavigationBar from '../Components/Navbar/NavigationBar';
import CashFlow from '../Components/Accounting/CashFlow';
import ButtonChat from '../Components/Chat/ButtonChat';
import LoadingMessage from '../Components/LoadingMessage/loading';
import { Helmet } from 'react-helmet-async';

const CashFlowPage = () => {
  return (
    <>
      <Helmet>
        <title>Cash Flow - KLF Apps</title>
      </Helmet>
      <LoadingMessage />
      <NavigationBar />
      <CashFlow />
      {/* <ButtonChat /> */}
    </>
  );
};

export default CashFlowPage;
