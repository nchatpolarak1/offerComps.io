import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // requests to /api go to the Express server, so the browser sees one origin
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
})
