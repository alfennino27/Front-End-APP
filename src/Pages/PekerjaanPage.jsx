import NavigationBar from '../Components/Navbar/NavigationBar';
import Pekerjaan from '../Components/Pekerjaan/Pekerjaan';
import AIChatBubble from '../Components/AI/AIChatBubble';
import { Helmet } from 'react-helmet-async';

const PekerjaanPage = () => {
  return (
    <>
      <Helmet>
        <title>Projects - KLF Apps</title>
      </Helmet>
      <NavigationBar />
      <Pekerjaan />
      <AIChatBubble />
    </>
  );
};

export default PekerjaanPage;
