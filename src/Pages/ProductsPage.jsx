import NavigationBar from '../Components/Navbar/NavigationBar';
import Products from '../Components/Products/Products';
import LoadingMessage from '../Components/LoadingMessage/loading';
import { Helmet } from 'react-helmet-async';

const ProductsPage = () => {
  return (
    <>
      <Helmet>
        <title>Products - KLF Apps</title>
      </Helmet>
      <LoadingMessage />
      <NavigationBar />
      <Products />
      {/* <ButtonChat /> */}
    </>
  );
};

export default ProductsPage;
