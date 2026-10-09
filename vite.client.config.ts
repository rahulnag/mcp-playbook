import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path  from 'path'

export default defineConfig({
  plugins: [react()],

  root:      path.resolve(__dirname),   // index.html at project root
  base:      './',                      // relative asset URLs so static builds work under any sub-path
  publicDir: 'public',

  build: {
    outDir:     path.resolve(__dirname, 'dist/client'),
    emptyOutDir: true,
  },

  server: {
    port: 5173,
    // Dev proxy — forwards API calls to the Express server
    proxy: {
      '/api': { target: 'http://localhost:4242', changeOrigin: true },
      '/ws':  { target: 'ws://localhost:4242',   ws: true           },
    }
  }
})
