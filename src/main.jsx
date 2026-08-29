import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './ThemeContext';
import ErrorBoundary from './Components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </ThemeProvider>,
    </HelmetProvider>
  </React.StrictMode>
);

// PWA: paksa cek update service worker berkala + reload sekali saat versi baru
// aktif. Tanpa ini user bisa nyangkut di bundle lama berhari-hari (menu/fitur
// baru "tidak muncul" walau sudah dideploy) sampai hard refresh manual.
if ('serviceWorker' in navigator) {
  // Sudah dikontrol SW lama → kalau nanti ganti controller berarti ada versi baru.
  const punyaControllerAwal = !!navigator.serviceWorker.controller;
  let sudahReload = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!punyaControllerAwal || sudahReload) return;
    sudahReload = true;
    window.location.reload();
  });

  const cekUpdate = () => {
    navigator.serviceWorker.getRegistration()
      .then((reg) => reg && reg.update())
      .catch(() => { /* offline, abaikan */ });
  };

  window.addEventListener('load', cekUpdate);
  window.addEventListener('focus', cekUpdate);
  setInterval(cekUpdate, 30 * 60 * 1000);
}
