import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
  test: {
    environment: 'jsdom',
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        album: resolve(__dirname, 'album.html'),
        contatti: resolve(__dirname, 'contatti.html'),
      },
    },
  },
})
