import NavigationBar from '../Components/Navbar/NavigationBar';
import LoadingMessage from '../Components/LoadingMessage/loading';
import Calendar from '../Components/Calendar/Calendar';
import { Helmet } from 'react-helmet-async';

const NotesPage = () => {
  return (
    <>
      <Helmet>
        <title>Calendar - KLF Apps</title>
      </Helmet>
      <LoadingMessage />
      <NavigationBar />
      <Calendar />
    </>
  );
};

export default NotesPage;
