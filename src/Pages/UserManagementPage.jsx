import NavigationBar from '../Components/Navbar/NavigationBar';
import UserManagement from '../Components/UserManagement/UserManagement';
import LoadingMessage from '../Components/LoadingMessage/loading';
import { Helmet } from 'react-helmet-async';

const UserManagementPage = () => {
  return (
    <>
      <Helmet>
        <title>User Management - KLF Apps</title>
      </Helmet>
      <LoadingMessage />
      <NavigationBar />
      <UserManagement />
      {/* <ButtonChat /> */}
    </>
  );
};

export default UserManagementPage;
