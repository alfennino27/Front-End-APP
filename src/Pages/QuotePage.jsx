import NavigationBar from '../Components/Navbar/NavigationBar';
import Quote from '../Components/Quote/Quote';
import LoadingMessage from '../Components/LoadingMessage/loading';
import { Helmet } from 'react-helmet-async';

const QuotePage = () => {
  return (
    <>
      <Helmet>
        <title>Quote - KLF Apps</title>
      </Helmet>
      <LoadingMessage />
      <NavigationBar />
      <Quote />
    </>
  );
};

export default QuotePage;
