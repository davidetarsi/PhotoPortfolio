import { resolve } from 'path'
import { defineConfig } from 'vite'
import { siteConfig } from './config/site.config.js'
import { injectSiteMeta } from './src/utils/injectSiteMeta.js'

// Sostituisce i placeholder {{SITE_*}} negli HTML a build time (e in dev),
// così titolo e Open Graph sono nell'HTML statico visibile ai crawler social.
const siteMetaPlugin = () => ({
  name: 'site-meta',
  transformIndexHtml: {
    order: 'pre',
    handler: html => injectSiteMeta(html, siteConfig),
  },
})

export default defineConfig({
  plugins: [siteMetaPlugin()],
  test: {
    environment: 'jsdom',
  },
  build: {
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        album: resolve(__dirname, 'album.html'),
        contatti: resolve(__dirname, 'contatti.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
})
