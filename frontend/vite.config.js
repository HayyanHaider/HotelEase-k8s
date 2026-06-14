import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

const devApiTarget = process.env.VITE_DEV_API_TARGET || 'http://localhost:5000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    https: true,
    open: 'https://localhost:5173',
    proxy: {
      '/api': {
        target: devApiTarget,
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: devApiTarget,
        changeOrigin: true,
        secure: false,
      },
      '/invoices': {
        target: devApiTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
