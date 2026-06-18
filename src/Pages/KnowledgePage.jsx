import NavigationBar from '../Components/Navbar/NavigationBar';
import KnowledgeBase from '../Components/AI/KnowledgeBase';
import { Helmet } from 'react-helmet-async';

const KnowledgePage = () => {
  return (
    <>
      <Helmet>
        <title>Knowledge Base - KLF Apps</title>
      </Helmet>
      <NavigationBar />
      <KnowledgeBase />
    </>
  );
};

export default KnowledgePage;
