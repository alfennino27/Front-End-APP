import NavigationBar from '../Components/Navbar/NavigationBar';
import HasilProduksi from '../Components/Katalog/HasilProduksi';
import { Helmet } from 'react-helmet-async';

const HasilProduksiPage = () => (
  <>
    <Helmet><title>Hasil Produksi - KLF Apps</title></Helmet>
    <NavigationBar />
    <HasilProduksi />
  </>
);

export default HasilProduksiPage;
