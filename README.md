# BTMM VISOR

Visor de mapas web progresivo (PWA) con soporte offline para las áreas
protegidas del Bloque (PN Tapantí, RF Río Macho, PN Los Quetzales,
RB Cerro Vueltas). Construido con React + Vite + OpenLayers.

La proyección de vista es **CR05 / CRTM05 (EPSG:5367)**, el sistema oficial
de coordenadas de Costa Rica.

## Características

- **Mapas base** — Satélite ESRI y OpenStreetMap, con capa de etiquetas
  (CartoDB) superponible y activable de forma independiente.
- **Capas vectoriales** — carga por botón o arrastrar-y-soltar de
  GeoJSON, KML, GPX, Shapefile (`.zip`) y GeoPackage (`.gpkg`).
- **Servicios OGC** — diálogos para agregar capas WMS (tiled e image) y
  WFS (carga por bbox).
- **Vistas predefinidas** — salto rápido al Área Bloque y a cada una de las
  cuatro áreas protegidas.
- **Simbología por capa** — color/opacidad de relleno, color/ancho de borde
  y radio de punto.
- **Información de features** — clic sobre una geometría muestra sus atributos.
- **Tabla de atributos** — panel inferior filtrable y ordenable por capa.
- **Medición** — distancia (m/km) y área (m²/ha) con cálculo geodésico.
- **Geolocalización (GPS)** — marcador de posición en vivo.
- **Ir a coordenadas** — navegación por CRTM05 (E/N en metros) o WGS84.
- **Reordenar capas** — arrastrar y soltar en el panel.
- **Exportar PNG** — captura de la vista actual del mapa.
- **Persistencia** — mapa base, etiquetas y capas cargadas se guardan en
  `localStorage` entre sesiones.
- **Offline** — tiles de OSM y ESRI cacheados con Workbox/Service Worker.

## Inicio rápido

```bash
npm install
npm run dev
```

Abre `http://localhost:5173/BTMM-VISOR/`.

## Producción

```bash
npm run build
npm run preview   # verifica el Service Worker en modo offline
```

El build genera `dist/`. La app se sirve bajo el subpath `/BTMM-VISOR/`
(ver `base` en `vite.config.ts`).

## Despliegue (GitHub Pages)

El workflow `.github/workflows/deploy.yml` construye y publica la app en
GitHub Pages en cada push a `main`. Para activarlo la primera vez:

1. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Hacer merge a `main`.

El sitio queda en `https://psforestal-rgb.github.io/BTMM-VISOR/`.

## Iconos PWA

`public/icons/` incluye `icon.svg` (favicon), `icon-192.png` e
`icon-512.png` (manifest). Reemplázalos para personalizar la marca.
