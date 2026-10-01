import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // D: is a network share (\\Server-pc\dssa); native fs.watch crashes there
    watch: { usePolling: true, interval: 300 },
  },
  build: {
    // Three.js is ~850 kB on its own; it's lazy-loaded only on pages with a 3D scene
    chunkSizeWarningLimit: 1000,
  },
})
