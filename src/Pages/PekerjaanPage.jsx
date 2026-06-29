import NavigationBar from '../Components/Navbar/NavigationBar';
import Pekerjaan from '../Components/Pekerjaan/Pekerjaan';
import AIChatBubble from '../Components/AI/AIChatBubble';
import DailyBrief from '../Components/AI/DailyBrief';
import { Helmet } from 'react-helmet-async';

const PekerjaanPage = () => {
  return (
    <>
      <Helmet>
        <title>Projects - KLF Apps</title>
      </Helmet>
      <NavigationBar />
      <Pekerjaan />
      <DailyBrief />
      <AIChatBubble />
    </>
  );
};

export default PekerjaanPage;
