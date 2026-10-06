import { lazy } from 'react';

// React.lazy + pemulihan "chunk hilang". Setelah deploy baru, tab ERP yang masih
// memegang versi lama bisa meminta file halaman yang sudah tidak ada di Vercel
// ("Failed to fetch dynamically imported module"). Kalau itu terjadi, muat ulang
// halaman SEKALI supaya browser mengambil versi terbaru, bukan layar error.
const KUNCI = 'klf-chunk-reload';

export default function lazyPage(importer) {
  return lazy(() =>
    importer()
      .then((mod) => {
        sessionStorage.removeItem(KUNCI);
        return mod;
      })
      .catch((err) => {
        if (!sessionStorage.getItem(KUNCI)) {
          sessionStorage.setItem(KUNCI, '1');
          window.location.reload();
          return new Promise(() => {}); // tunggu reload, jangan render error
        }
        throw err;
      })
  );
}
