import { resolve } from 'path'
import { defineConfig } from 'vite'
import { readFileSync, existsSync } from 'fs'
import { siteConfig } from './config/site.config.js'
import { injectSiteMeta } from './src/utils/injectSiteMeta.js'
import { buildHeaders } from './src/utils/buildHeaders.js'

// Sostituisce i placeholder {{SITE_*}} negli HTML a build time (e in dev),
// così titolo e Open Graph sono nell'HTML statico visibile ai crawler social.
const siteMetaPlugin = () => ({
  name: 'site-meta',
  transformIndexHtml: {
    order: 'pre',
    handler: html => injectSiteMeta(html, siteConfig),
  },
})

// Genera dist/_headers dalle origini R2 di wrangler.json, invece di tenere
// il file statico allineato a mano (audit di luglio, punto 2).
const headersPlugin = () => ({
  name: 'generate-headers',
  apply: 'build',
  generateBundle() {
    if (!existsSync('wrangler.json')) {
      this.error('wrangler.json non trovato. Crealo con `cp wrangler.example.json wrangler.json` e compilalo, oppure genera tutto con `npm run infra:sync`.')
    }
    this.emitFile({
      type: 'asset',
      fileName: '_headers',
      source: buildHeaders(JSON.parse(readFileSync('wrangler.json', 'utf8'))),
    })
  },
})

export default defineConfig({
  plugins: [siteMetaPlugin(), headersPlugin()],
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
