import { useEffect } from 'react';

/**
 * Sebagian ekstensi browser (ad blocker / popup blocker) memakai filter kosmetik
 * yang menyembunyikan elemen overlay dengan `display: none !important` —
 * dialog react-bootstrap (.modal) maupun viewer gambar antd
 * (.ant-image-preview-wrap) ikut kena. Akibatnya:
 *   - form yang sedang diisi mendadak lenyap padahal React masih membukanya;
 *   - viewer gambar tinggal mask gelap tanpa gambar, dan karena elemennya
 *     dipakai ulang, sekali kena ia tetap tersembunyi sampai halaman di-reload.
 *
 * Cara kerjanya: kembalikan atribut style ke NILAI SEBELUM ditimpa (oldValue),
 * bukan memaksa nilai baru. Ini penting — versi yang memaksa
 * `display: block !important` justru mengunci overlay: React/antd menutup dengan
 * `display: none` biasa dan tidak akan pernah menang, layar tinggal gelap.
 *
 * Rollback ke oldValue otomatis benar di kedua arah:
 *   - overlay ditimpa saat sedang tampil → balik jadi tampil;
 *   - overlay ditimpa setelah ditutup normal → oldValue-nya memang sudah
 *     tersembunyi, jadi tetap tersembunyi.
 */

// Overlay yang kita jaga. Sengaja dibatasi ke elemen milik library dialog/preview
// supaya tidak ikut campur ke elemen lain.
const OVERLAY = [
  '.modal', '.modal-backdrop',
  '.ant-image-preview-root', '.ant-image-preview-wrap', '.ant-image-preview-mask',
  '.ant-modal-root', '.ant-modal-wrap', '.ant-modal-mask',
  '.ant-drawer',
].join(',');

// Kalau ekstensinya ikut memantau dan menulis ulang terus, berhenti melawan
// setelah sekian kali supaya tidak jadi loop yang membekukan tab.
const BATAS_ROLLBACK = 30;

const ModalGuard = () => {
  useEffect(() => {
    const hitung = new WeakMap();

    const obs = new MutationObserver((muts) => {
      muts.forEach((m) => {
        if (m.type !== 'attributes' || m.attributeName !== 'style') return;

        const el = m.target;
        if (!el.matches || !el.matches(OVERLAY)) return;

        // Hanya lawan penulisan ber-priority "important". React-Bootstrap dan
        // antd tidak pernah memakainya, jadi alur buka/tutup normal tidak diusik.
        if (el.style.display !== 'none') return;
        if (el.style.getPropertyPriority('display') !== 'important') return;

        const n = (hitung.get(el) || 0) + 1;
        hitung.set(el, n);
        if (n > BATAS_ROLLBACK) return;

        if (m.oldValue == null) el.removeAttribute('style');
        else el.setAttribute('style', m.oldValue);
      });
    });

    obs.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeOldValue: true,
      attributeFilter: ['style'],
    });

    return () => obs.disconnect();
  }, []);

  return null;
};

export default ModalGuard;
