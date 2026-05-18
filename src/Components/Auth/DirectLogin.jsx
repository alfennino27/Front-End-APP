import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const DirectLogin = () => {
  const navigate = useNavigate();
  const { slug } = useParams();

  useEffect(() => {
    handleLogin();
  }, []);

  const handleLogin = () => {
    if (slug) {
      // Simpan UID ke localStorage
      localStorage.setItem('user', JSON.stringify({ uid: slug }));
      localStorage.setItem('theme', 'light');
      // Redirect ke halaman project
      navigate('/project');
    } else {
      // Jika slug tidak ada, kembali ke login
      navigate('/login');
    }
  };


};

export default DirectLogin;
