import NavigationBar from '../Components/Navbar/NavigationBar';
import Storage from '../Components/Storage/Storage';
import StorageDetail from '../Components/Storage/StorageDetail';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import LoadingMessage from '../Components/LoadingMessage/loading';

const StoragePage = () => {
  const { slug } = useParams();
  const isSlug = Boolean(slug);
  
  return (
    <>
      <Helmet>
        <title>Catalog - KLF Apps</title>
      </Helmet>

      <NavigationBar />
      {!isSlug && <> <LoadingMessage /><Storage /> </> }
      {isSlug && <> <LoadingMessage /><StorageDetail /> </>}
    </>
  );
};

export default StoragePage;
