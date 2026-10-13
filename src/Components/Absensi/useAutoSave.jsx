import React, { useState, useEffect, useRef, useCallback } from 'react';

// Auto-save absensi: tiap perubahan (`tandai()`) menjadwalkan simpan ke server
// setelah `delay` ms. Juga menyimpan paksa saat tab disembunyikan / ditutup /
// reload (fetch keepalive) dan saat komponen unmount, supaya isian tidak hilang
// kalau tidak sengaja reload. Panggil `flush()` (await) sebelum ganti periode
// atau karyawan agar data periode lama tersimpan ke periode yang benar.
//
// saveFn({ keepalive }) → Promise; WAJIB throw kalau gagal.
export default function useAutoSave(saveFn, delay = 1500) {
  const [rev, setRev] = useState(0);
  const [savedRev, setSavedRev] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef({});
  ref.current = { saveFn, rev, savedRev };
  const timer = useRef(null);
  const inflight = useRef(null);
  const dirty = rev !== savedRev;

  const simpan = useCallback(async ({ keepalive = false } = {}) => {
    clearTimeout(timer.current);
    if (inflight.current) await inflight.current;
    const { saveFn: fn, rev: r, savedRev: s } = ref.current;
    if (r === s) return true;
    setSaving(true);
    const p = (async () => {
      try {
        await fn({ keepalive });
        setSavedRev(r);
        ref.current.savedRev = r;
        setError('');
        return true;
      } catch (e) {
        console.error(e);
        setError(e.message || 'Gagal menyimpan');
        return false;
      } finally {
        setSaving(false);
      }
    })();
    inflight.current = p;
    const ok = await p;
    inflight.current = null;
    return ok;
  }, []);

  // Jadwalkan simpan tiap ada perubahan baru
  useEffect(() => {
    if (!rev || rev === savedRev) return undefined;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => simpan(), delay);
    return undefined;
  }, [rev]); // eslint-disable-line react-hooks/exhaustive-deps

  // Simpan paksa saat halaman disembunyikan / ditutup / komponen unmount
  useEffect(() => {
    const paksa = () => {
      const { rev: r, savedRev: s } = ref.current;
      if (r !== s) simpan({ keepalive: true });
    };
    const onVis = () => { if (document.visibilityState === 'hidden') paksa(); };
    const onBeforeUnload = (e) => {
      const { rev: r, savedRev: s } = ref.current;
      if (r !== s) { paksa(); e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('pagehide', paksa);
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('pagehide', paksa);
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', onVis);
      clearTimeout(timer.current);
      paksa();
    };
  }, [simpan]);

  const tandai = useCallback(() => setRev((r) => r + 1), []);
  // Dipanggil setelah data periode baru dimuat dari server
  const reset = useCallback(() => {
    clearTimeout(timer.current);
    setRev(0); setSavedRev(0); setError('');
    ref.current.rev = 0; ref.current.savedRev = 0;
  }, []);
  const flush = useCallback(() => simpan(), [simpan]);

  return { dirty, saving, error, tandai, reset, flush, simpan };
}

// Label status simpan (dipakai di toolbar ketiga tampilan absensi)
export function StatusSimpan({ auto, muted }) {
  const { saving, dirty, error } = auto;
  if (saving) return <span style={{ fontSize: 12, color: muted, fontWeight: 600 }}>⏳ Menyimpan…</span>;
  if (error) return <span style={{ fontSize: 12, color: '#c62828', fontWeight: 600 }}>⚠️ Gagal simpan otomatis: {error}</span>;
  if (dirty) return <span style={{ fontSize: 12, color: '#c2410c', fontWeight: 600 }}>✏️ Ada perubahan, menyimpan otomatis…</span>;
  return <span style={{ fontSize: 12, color: '#15803d', fontWeight: 600 }}>✓ Tersimpan otomatis</span>;
}

// Input jam + tombol × untuk mengosongkan. Input time bawaan HP (iOS/Android)
// tidak punya tombol hapus, jadi jam yang sudah terisi tidak bisa dikosongkan.
export function JamInput({ value, onChange, style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 92 }}>
      <input type="time" value={value || ''} style={{ ...style, minWidth: 0, flex: 1 }}
        onChange={(e) => onChange(e.target.value)} />
      {value ? (
        <button type="button" aria-label="Hapus jam" title="Hapus jam" onClick={() => onChange('')}
          style={{
            flex: '0 0 26px', width: 26, height: 26, border: 'none', borderRadius: 13,
            background: 'rgba(198,40,40,0.12)', color: '#c62828', fontSize: 15, fontWeight: 700,
            lineHeight: '26px', padding: 0, cursor: 'pointer',
          }}>×</button>
      ) : <span style={{ flex: '0 0 26px' }} />}
    </div>
  );
}
