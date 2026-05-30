import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,

    // ✅ Cloudflare Tunnel Host Allow
    allowedHosts: true,

    proxy: {
      '/api': {
        // ✅ Updated Backend Tunnel URL
        target:  'https://steal-wayne-gained-vol.trycloudflare.com',
        changeOrigin: true,
        secure: true,
      }
    }
  }
})
