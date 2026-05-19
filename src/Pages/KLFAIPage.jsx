import NavigationBar from '../Components/Navbar/NavigationBar';
import AI from '../Components/AI/AI';
import { Helmet } from 'react-helmet-async';

const KLFAIPage = () => {
  return (
    <>
      <Helmet>
        <title>KLF AI - KLF Apps</title>
      </Helmet>
      <NavigationBar />
      <AI />
    </>
  );
};

export default KLFAIPage;
