import NavigationBar from '../Components/Navbar/NavigationBar';
import Notes from '../Components/Notes/Notes';
import { Helmet } from 'react-helmet-async';

const NotesPage = () => {
  return (
    <>
      <Helmet>
        <title>Notes - KLF Apps</title>
      </Helmet>
      <NavigationBar />
      <Notes />
    </>
  );
};

export default NotesPage;
