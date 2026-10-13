import { useEffect, useState } from 'react';

// true kalau lebar layar ≤ `maks` px. Ikut berubah saat layar diputar / jendela
// di-resize (beda dengan `window.innerWidth <= 768` sekali hitung saat render).
export default function useIsMobile(maks = 768) {
  const query = `(max-width: ${maks}px)`;
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return mobile;
}
