import NavigationBar from '../Components/Navbar/NavigationBar';
import Appraisal from '../Components/Appraisal/Appraisal';
import LoadingMessage from '../Components/LoadingMessage/loading';
import { Helmet } from 'react-helmet-async';

const AppraisalPage = () => {
  return (
    <>
      <Helmet>
        <title>Appraisal - KLF Apps</title>
      </Helmet>
      <LoadingMessage />
      <NavigationBar />
      <Appraisal />
      {/* <ButtonChat /> */}
    </>
  );
};

export default AppraisalPage;
