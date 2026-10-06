import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Pemecahan file JS diserahkan ke Rollup (halaman di-lazy-load di App.jsx).
// Jangan pakai manualChunks untuk vendor: Rollup ikut memindahkan React ke chunk
// itu, sehingga library besar (mis. Quill) malah terunduh di halaman login, atau
// urutan eksekusi kacau ("Cannot read properties of undefined (reading 'createContext')").

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Semua file halaman ikut di-precache service worker (di belakang layar),
        // jadi pindah menu terasa instan & tetap bisa dibuka saat sinyal jelek.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
    }),
  ],
})
