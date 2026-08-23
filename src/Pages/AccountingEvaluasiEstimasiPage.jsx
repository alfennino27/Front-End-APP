import NavigationBar from '../Components/Navbar/NavigationBar';
import EvaluasiEstimasi from '../Components/Accounting/EvaluasiEstimasi';
import { Helmet } from 'react-helmet-async';

const AccountingEvaluasiEstimasiPage = () => {
  return (
    <>
      <Helmet>
        <title>Evaluasi Estimasi - KLF Apps</title>
      </Helmet>
      <NavigationBar />
      <EvaluasiEstimasi />
    </>
  );
};

export default AccountingEvaluasiEstimasiPage;
