import NavigationBar from '../Components/Navbar/NavigationBar';
import LabaRugiProfit from '../Components/Accounting/LabaRugiProfit';
import { Helmet } from 'react-helmet-async';

const AccountingLabaRugiProfitPage = () => {
  return (
    <>
      <Helmet>
        <title>L/R Profit - KLF Apps</title>
      </Helmet>
      <NavigationBar />
      <LabaRugiProfit />
    </>
  );
};

export default AccountingLabaRugiProfitPage;
