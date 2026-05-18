import NavigationBar from '../Components/Navbar/NavigationBar';
import Category from '../Components/Category/Category';
import { Helmet } from 'react-helmet-async';

const CategoryPage = () => {

  return (
    <>
      <Helmet>
        <title>Category - KLF Apps</title>
      </Helmet>

      <NavigationBar />
      <Category />
    </>
  );
};

export default CategoryPage;
