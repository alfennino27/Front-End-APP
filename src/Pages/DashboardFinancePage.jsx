import NavigationBar from '../Components/Navbar/NavigationBar';
import DashboardFinance from '../Components/Dashboard/Dashboard-Finance';
import { Helmet } from 'react-helmet-async';

const DashboardPage = () => {
  return (
    <>
      <Helmet>
        <title>Dashboard Finance - KLF Apps</title>
      </Helmet>
      <NavigationBar />
      <DashboardFinance />
    </>
  );
};

export default DashboardPage;
