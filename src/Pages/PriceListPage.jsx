import NavigationBar from '../Components/Navbar/NavigationBar';
import PriceList from '../Components/PriceList/PriceList';
import LoadingMessage from '../Components/LoadingMessage/loading';
import { Helmet } from 'react-helmet-async';

const PriceListPage = () => {
  return (
    <>
      <Helmet>
        <title>Price List - KLF Apps</title>
      </Helmet>
      <LoadingMessage />
      <NavigationBar />
      <PriceList />
      {/* <ButtonChat /> */}
    </>
  );
};

export default PriceListPage;
