import NavigationBar from '../Components/Navbar/NavigationBar';
import PapanOrder from '../Components/PapanOrder/PapanOrder';
import { Helmet } from 'react-helmet-async';

const PapanOrderPage = () => (
  <>
    <Helmet>
      <title>Papan Order - KLF Apps</title>
    </Helmet>

    <NavigationBar />
    <PapanOrder />
  </>
);

export default PapanOrderPage;
