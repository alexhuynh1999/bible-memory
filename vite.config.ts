import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import pkg from './package.json' with { type: 'json' }

// GitHub Pages deploys to /<repo-name>/. Set BASE_PATH env var in CI.
// Defaults to '/' for local dev.
const base = process.env.BASE_PATH || '/'

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Bible Memory',
        short_name: 'BibleMem',
        description: 'Memorize Bible verses with spaced repetition',
        theme_color: '#78593a',
        background_color: '#fdf6ec',
        display: 'standalone',
        scope: base,
        start_url: base,
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
