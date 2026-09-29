import NavigationBar from '../Components/Navbar/NavigationBar';
import DesainProduk from '../Components/Desain/DesainProduk';
import { Helmet } from 'react-helmet-async';

const DesainProdukPage = () => (
  <>
    <Helmet><title>Desain Produk - KLF Apps</title></Helmet>
    <NavigationBar />
    <DesainProduk />
  </>
);

export default DesainProdukPage;
