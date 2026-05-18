import NavigationBar from '../Components/Navbar/NavigationBar';
import Todo from '../Components/Todo/Todo';
import { Helmet } from 'react-helmet-async';

const TodoPage = () => {

  return (
    <>
      <Helmet>
        <title>Todo - KLF Apps</title>
      </Helmet>

      <NavigationBar />
      <Todo />
    </>
  );
};

export default TodoPage;
