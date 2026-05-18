//bukan ini yang dipake tapi di config/APIurl/index.js

const apiUrl =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://klf-app-api.vercel.app';

export default apiUrl;
