import { Col, Container, Row, Form } from 'react-bootstrap';
import '../Pekerjaan/pekerjaan.css';
import ListPekerjaan from './ListPekerjaan';
import DetailPekerjaan from './DetailPekerjaan';
import LoadingMessage from '../LoadingMessage/loading';
import { useParams } from 'react-router-dom';

const Pekerjaan = () => {
  const { slug } = useParams();
  const isMobile = window.innerWidth <= 768;
  const isSlug = Boolean(slug);

  return (
    <Container>

      <Row className="mt-2 pekerjaan">

        {isMobile ? (
          <>
            {!isSlug && <ListPekerjaan />}
            {isSlug && <DetailPekerjaan />}
          </>
        ) : (
          <>
            <LoadingMessage />
            <ListPekerjaan />
            <DetailPekerjaan />
          </>
        )}
      </Row>
    </Container>
  );
};

export default Pekerjaan;
