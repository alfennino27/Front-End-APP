import { useEffect } from 'react';

/**
 * Sebagian ekstensi browser (ad blocker / popup blocker) memakai filter kosmetik
 * yang menyembunyikan elemen ber-class "modal" dengan `display: none !important`.
 * Dialog KLF ikut kena: form yang sedang diisi mendadak lenyap padahal React
 * masih menganggap modal-nya terbuka (class "show" tetap menempel).
 *
 * Guard ini mengembalikan tampilannya. Sengaja HANYA melawan penulisan yang
 * pakai priority "important" — React-Bootstrap tidak pernah memakai important,
 * jadi proses tutup-modal yang normal tidak terganggu.
 */
const ModalGuard = () => {
  useEffect(() => {
    const pulihkan = (el) => {
      if (!el.classList || !el.classList.contains('modal') || !el.classList.contains('show')) return;
      if (el.style.display === 'none' && el.style.getPropertyPriority('display') === 'important') {
        el.style.setProperty('display', 'block', 'important');
      }
    };

    const obs = new MutationObserver((muts) => {
      muts.forEach((m) => { if (m.type === 'attributes') pulihkan(m.target); });
    });

    obs.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ['style', 'class'],
    });

    return () => obs.disconnect();
  }, []);

  return null;
};

export default ModalGuard;
