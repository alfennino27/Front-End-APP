import React, { useEffect, useState } from 'react';
import { Container, Card, Row, Col } from 'react-bootstrap';
import './banner.css';
import bannerImage from '../../assets/images/Banner.png';
import kursiKategori from '../../assets/images/kursiKategori.png';
import mejaKategori from '../../assets/images/mejaKategori.png';
import lemariKategori from '../../assets/images/lemariKategori.png';
import kasurKategori from '../../assets/images/kasurKategori.png';
import { FaCircleArrowRight } from 'react-icons/fa6';
import dataBarang from '../../databarang.json';
import { Link } from 'react-router-dom';
import Product from '../Product';
import db from '../../Config/Firebase';
import { collection, getDocs } from 'firebase/firestore';

const Banner = () => {
  const [barangFromDB, setBarangFromDB] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, 'dataBarang'));
      const barangData = querySnapshot.docs.map(doc => doc.data());
      setBarangFromDB(barangData);
    };
    fetchData();
  }, []);

  const filteredBarang = barangFromDB.filter(
    (item) =>
      item.namabarang.toLowerCase().includes(searchKeyword.toLowerCase())
  );
  
  return (
    <section>
      <Container fluid>
        <div className="banner text-center">
          <img src={bannerImage} alt="" className="img-fluid rounded-3" />
        </div>
        <div className="d-flex justify-content-center">
        <input
  type="text"
  name="cari"
  placeholder="Cari"
  className="inputText px-3 rounded-3"
  value={searchKeyword}
  onChange={(e) => setSearchKeyword(e.target.value)}
/>

        </div>
        <div className="mt-4 kategori">
          <h5>Pilih Kategori</h5>
          <div className="d-flex justify-content-evenly mt-4">
          <Link to={`/search/kursi`} className="list-group-item ">
            <div className="kategoriItem shadow d-flex justify-content-center align-items-center flex-column">
              <img src={kursiKategori} alt="" className="img-fluid" />
              <h6>Kursi</h6>
            </div>
            </Link>
            <Link to={`/search/meja`} className="list-group-item ">
            <div className="kategoriItem shadow d-flex justify-content-center align-items-center flex-column">
              <img src={mejaKategori} alt="" className="img-fluid" />
              <h6>Meja</h6>
            </div>
            </Link>
            <Link to={`/search/lemari`} className="list-group-item ">
            <div className="kategoriItem shadow d-flex justify-content-center align-items-center flex-column">
              <img src={lemariKategori} alt="" className="img-fluid" />
              <h6>Lemari</h6>
            </div>
            </Link>
            <Link to={`/search/kasur`} className="list-group-item ">
            <div className="kategoriItem shadow d-flex justify-content-center align-items-center flex-column">
              <img src={kasurKategori} alt="" className="img-fluid" />
              <h6>Kasur</h6>
            </div>
            </Link>
            <Link to={`/search`} className="list-group-item ">
            <div className="kategoriItem shadow d-flex justify-content-center align-items-center flex-column">
              <FaCircleArrowRight className="icon mb-3" />
              <h6>Lainnya</h6>
            </div>
            </Link>
          </div>
        </div>
        <div className="kategori mt-5">
          <h5>Untuk Anda</h5>
          {/* <Row className="mt-4">
            {dataBarang.map((item, index) => (
              <Product item={item} key={index} />
            ))}
          </Row> */}
         {/* <Row className="mt-4">
            {barangFromDB.map((item, index) => (
              <Product item={item} key={index} />
            ))}
          </Row> */}
          <Row>
  {filteredBarang.map((item, index) => (
    <Product item={item} key={index} />
  ))}
</Row>

        </div>
      </Container>
    </section>
  );
};

export default Banner;
