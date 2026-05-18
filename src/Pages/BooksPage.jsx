import NavigationBar from '../Components/Navbar/NavigationBar';
import Books from '../Components/Pekerjaan/Books';
import ButtonChat from '../Components/Chat/ButtonChat';
import LoadingMessage from '../Components/LoadingMessage/loading';
import { Helmet } from 'react-helmet-async';

const BooksPage = () => {
  return (
    <>
      <Helmet>
        <title>Books - KLF Apps</title>
      </Helmet>
      <LoadingMessage />
      <NavigationBar />
      <Books />
      {/* <ButtonChat /> */}
    </>
  );
};

export default BooksPage;
