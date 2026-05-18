import NavigationBar from '../Components/Navbar/NavigationBar';
import Stock from '../Components/Stock/Stock';
import LoadingMessage from '../Components/LoadingMessage/loading';
import { Helmet } from 'react-helmet-async';

const StockPage = () => {
  return (
    <>
      <Helmet>
        <title>Stock - KLF Apps</title>
      </Helmet>
      <LoadingMessage />
      <NavigationBar />
      <Stock />
      {/* <ButtonChat /> */}
    </>
  );
};

export default StockPage;
