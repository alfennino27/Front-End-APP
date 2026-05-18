
// Fungsi untuk mendapatkan base URL berdasarkan developerMode
export const getApiBaseUrl = () => {
    const developerMode = localStorage.getItem('developerMode');
    return developerMode === 'on' ? 'http://localhost:3001' : 'https://api.karyalogamfurniture.com';
  };
  