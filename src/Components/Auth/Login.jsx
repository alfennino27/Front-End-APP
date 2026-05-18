import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { getApiBaseUrl } from '../../Config/APIurl';

const Login = () => {
  const baseUrl = getApiBaseUrl();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);




  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;

  useEffect(() => {
    localStorage.removeItem('lastSlug');
    localStorage.removeItem('searchSupplierLocalStorage');
    localStorage.removeItem('searchSupplierCategoryLocalStorage');
    const cekLogin = () => {
      if (user !== null) {
        window.location.replace('/project');
      }
    };

    cekLogin();
  }, []);

  const handleLogin = async () => {
    try {
      const response = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        // ✅ Simpan uid ke localStorage
        localStorage.setItem('user', JSON.stringify({ uid: data.user.uid }));

        // ✅ Redirect ke halaman project
        window.location.replace('/project');
      } else if (data.status === 'setPassword') {
        // Tampilkan form set password kalau belum ada password
        setShowSetPassword(true);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan saat login.');
    }
  };

  const handleSetPassword = async () => {
    setError(null);
    if (newPassword !== confirmPassword) {
      return setError('Password dan konfirmasi tidak sama');
    }

    try {
      const res = await fetch(`${baseUrl}/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('Password berhasil dibuat. Silakan login ulang.');
        window.location.reload(); // reset form
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Gagal menyimpan password');
    }
  };

  return (
    <Container fluid className="d-flex justify-content-center align-items-center vh-100">
      <div className="w-100" style={{ maxWidth: "400px" }}>
        <h2 className="text-center mb-4 fw-bold text-primary">KLF APP</h2>

        <div className="border shadow p-4 rounded-4 bg-white">
          <h4 className="mb-4 text-center fw-bold">Login</h4>

          {error && <div className="alert alert-danger">{error}</div>}
          {successMsg && <div className="alert alert-success">{successMsg}</div>}

          <div className="mb-3">
            <label className="form-label">Email address</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {!showSetPassword && (
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}

          {!showSetPassword ? (
            <button
              className="btn btn-primary w-100 mt-2"
              onClick={handleLogin}
            >
              Sign In
            </button>
          ) : (
            <>
              <div className="mb-3">
                <label className="form-label">Password Baru</label>
                <input
                  type="password"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Konfirmasi Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <button className="btn btn-success w-100" onClick={handleSetPassword}>
                Simpan Password
              </button>
            </>
          )}
        </div>
      </div>
    </Container>
  );
};

export default Login;
