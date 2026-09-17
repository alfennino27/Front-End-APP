import NavigationBar from '../Components/Navbar/NavigationBar';
import ProductNew from '../Components/Products/ProductNew';
import { Helmet } from 'react-helmet-async';

const ProductNewPage = () => (
  <>
    <Helmet><title>Tambah Produk - KLF Apps</title></Helmet>
    <NavigationBar />
    <ProductNew />
  </>
);

export default ProductNewPage;
