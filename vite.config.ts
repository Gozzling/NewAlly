import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'background.html'),
        overlay:    resolve(__dirname, 'overlay.html'),
        desktop:    resolve(__dirname, 'desktop.html'),
        lobby:      resolve(__dirname, 'lobby.html'),
      },
    },
  },
})
