# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # install deps (run once after cloning)
npm run dev          # dev server at http://localhost:5173
npm run build        # TypeScript check + Vite production build → dist/
npm run preview      # serve dist/ locally to test the PWA
npm run lint         # ESLint (max-warnings 0)
npm run typecheck    # tsc --noEmit without building
```

## Architecture

Single-page React + Vite PWA. The entire app is stateless except for the Zustand layer store; the OpenLayers `Map` instance lives outside React in refs.

### Layer data flow

```
useLayerStore (Zustand)
  └── baseMaps[]  +  overlays[]   (plain LayerConfig objects)
        │
        ▼
useLayerSync (hook, runs every render)
  └── diffs store state vs olLayers ref
        ├── createOLLayer(config)  → adds OL layer to Map
        ├── existing layer → setVisible / setOpacity
        └── removed → map.removeLayer + close WS / clearInterval
```

`LayerConfig` (src/types/layer.ts) is a discriminated union on `type`:
`'xyz' | 'wms' | 'wfs' | 'geojson' | 'kml' | 'realtime'`.
`createOLLayer` (src/utils/olLayerFactory.ts) maps each union variant to the correct OL class.

### Real-time layers

`RealtimeLayerConfig` layers start with an empty `VectorSource`. `useLayerSync` opens a WebSocket or polling interval and calls `source.clear()` + `source.addFeatures()` on each message. Handles are stored in a `ref` and closed on removal.

### PWA / Offline

`vite-plugin-pwa` (Workbox) pre-caches the app shell and adds runtime `CacheFirst` strategies for OSM and ESRI satellite tiles. WMS images use `NetworkFirst`. Tile caches: `osm-tiles` (1 000 entries, 30 days), `esri-tiles` (500, 14 days), `wms-cache` (200, 1 day).

The update prompt appears in `App.tsx` via `registerSW` from `virtual:pwa-register`.

### Key files

| Path | Purpose |
|---|---|
| `src/store/layerStore.ts` | Zustand store — source of truth for all layer configs |
| `src/hooks/useLayerSync.ts` | Syncs store → OL map; owns real-time connections |
| `src/hooks/useMap.ts` | Creates and tears down the OL `Map` instance |
| `src/utils/olLayerFactory.ts` | `LayerConfig` → OL layer factory |
| `src/utils/fileLoaders.ts` | Reads GeoJSON / KML files from disk and builds configs |
| `src/config/baseMaps.ts` | Default OSM, Satellite, and Topo base map definitions |
| `vite.config.ts` | Vite + PWA + Workbox tile-cache rules |

### Adding a new layer type

1. Add a new variant to the `LayerConfig` union in `src/types/layer.ts`.
2. Add a `case` to `createOLLayer` in `src/utils/olLayerFactory.ts`.
3. Add a dialog component under `src/components/Toolbar/` and wire it into `Toolbar.tsx`.

### Icons (required for PWA)

Place `icon-192.png` and `icon-512.png` under `public/icons/`. The manifest references these paths. Without them the build succeeds but the PWA install prompt won't show a proper icon.
