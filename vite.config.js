import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // Development only: send /api requests to the FastAPI backend (run it on port 8000).
    proxy: {
      '/api': 'http://127.0.0.1:8000'
    }
  }
})
