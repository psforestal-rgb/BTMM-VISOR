# BTMM VISOR

Visor de mapas web progresivo (PWA) con soporte offline, construido con React + Vite + OpenLayers.

## Características

- **Mapas base** — OpenStreetMap, Satélite ESRI, OpenTopoMap
- **Capas vectoriales** — arrastra y suelta archivos GeoJSON y KML
- **Servicios OGC** — WMS (tiled e image) y WFS (carga por bbox)
- **Datos en tiempo real** — WebSocket o HTTP polling (GeoJSON)
- **Offline** — tiles de OSM y ESRI cacheados con Workbox/Service Worker

## Inicio rápido

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

## Producción

```bash
npm run build
npm run preview   # verifica el Service Worker en modo offline
```

El build genera `dist/` listo para deployar en cualquier hosting estático.

## Agregar capas de iconos PWA

Coloca `icon-192.png` y `icon-512.png` en `public/icons/` para que la app sea instalable.
