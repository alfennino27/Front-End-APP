// Token sesi ERP (JWT dari POST /login). Disisipkan otomatis ke SEMUA request ke API KLF lewat
// pembungkus fetch global + interceptor axios — pemanggil tidak perlu menambah header sendiri.
// Server (middlewares/authGate.js) membalas 401 + header X-KLF-Auth: required kalau sesi habis.
const KUNCI = 'erpToken';
const API_BASE = ['https://api.karyalogamfurniture.com', 'http://localhost:3001'];

export const getToken = () => { try { return localStorage.getItem(KUNCI); } catch { return null; } };
export const setToken = (t) => { try { if (t) localStorage.setItem(KUNCI, t); } catch { /* storage diblok */ } };
export const clearToken = () => { try { localStorage.removeItem(KUNCI); } catch { /* storage diblok */ } };

const keApi = (url) => typeof url === 'string' && API_BASE.some((b) => url.startsWith(b));

let sedangKeluar = false;
function sesiBerakhir() {
  if (sedangKeluar || window.location.pathname.startsWith('/login')) return;
  sedangKeluar = true;
  clearToken();
  localStorage.removeItem('user');
  window.location.replace('/login?expired=1');
}

export function pasangFetch() {
  if (window.__klfFetchAuth) return;
  window.__klfFetchAuth = true;
  const asli = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input?.url;
    const token = getToken();
    if (keApi(url) && token) {
      const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
        init = { ...(init || {}), headers };
      }
    }
    const res = await asli(input, init);
    if (res.status === 401 && keApi(url) && res.headers.get('X-KLF-Auth') === 'required') sesiBerakhir();
    return res;
  };
}

// Dipanggil dari file yang memakai axios (supaya axios tidak masuk bundle utama).
export function pasangAxios(axios) {
  if (axios.__klfAuth) return;
  axios.__klfAuth = true;
  axios.interceptors.request.use((config) => {
    const token = getToken();
    const url = config.baseURL ? config.baseURL + (config.url || '') : config.url;
    if (keApi(url) && token && !config.headers?.Authorization) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  axios.interceptors.response.use(undefined, (err) => {
    if (err?.response?.status === 401 && err.response.headers?.['x-klf-auth'] === 'required') sesiBerakhir();
    return Promise.reject(err);
  });
}
