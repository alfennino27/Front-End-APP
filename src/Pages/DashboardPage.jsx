import NavigationBar from '../Components/Navbar/NavigationBar';
import Dashboard from '../Components/Dashboard/Dashboard';
import { Helmet } from 'react-helmet-async';

const DashboardPage = () => {
  return (
    <>
      <Helmet>
        <title>Dashboard - KLF Apps</title>
      </Helmet>
      <NavigationBar />
      <Dashboard />
    </>
  );
};

export default DashboardPage;
