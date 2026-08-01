import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const appVersion = process.env.VITE_APP_VERSION ?? process.env.GITHUB_SHA ?? `local-${Date.now()}`;

export default defineConfig({
  // Served from https://psforestal-rgb.github.io/BTMM-VISOR/ on GitHub Pages.
  // The base must match the repository name (case-sensitive) so assets resolve.
  base: '/BTMM-VISOR/',
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  optimizeDeps: {
    // sql.js ships its own WASM — keep it out of Vite's pre-bundle step
    exclude: ['sql.js'],
  },
  plugins: [
    react(),
    {
      name: 'btmm-version-manifest',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({ version: appVersion }),
        });
      },
    },
    VitePWA({
      injectRegister: false,
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'BTMM VISOR',
        short_name: 'VISOR',
        lang: 'es',
        description: 'Visor de mapas BTMM — offline, capas vectoriales y servicios OGC',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // OSM tiles — offline cache
            urlPattern: /^https:\/\/(?:[abc]\.)?tile\.openstreetmap\.org\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 1000, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // CARTO labels — offline cache
            urlPattern: /^https:\/\/[a-d]\.basemaps\.cartocdn\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'carto-labels',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // ESRI satellite tiles — offline cache
            urlPattern: /^https:\/\/server\.arcgisonline\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'esri-tiles',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 14 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // sql.js WASM — required to open GeoPackage files while offline
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/sql\.js@1\.14\.1\/dist\/sql-wasm\.wasm$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'sqljs-wasm',
              expiration: { maxEntries: 2, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // WMS images — network first, fall back to cache
            urlPattern: /\/wms(\?|\/)/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'wms-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
