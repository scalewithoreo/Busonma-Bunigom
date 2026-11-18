import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        reception: resolve(__dirname, 'reception.html'),
      },
    },
  },
  server: {
    port: 3010,
    host: true,
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
})
