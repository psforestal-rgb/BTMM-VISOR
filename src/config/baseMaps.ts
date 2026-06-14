import type { XYZLayerConfig } from '../types/layer';

export const BASE_MAPS: XYZLayerConfig[] = [
  {
    id: 'esri-satellite',
    title: 'Satélite (ESRI)',
    type: 'xyz',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attributions:
      'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 20,
    visible: true,
    opacity: 1,
    zIndex: 0,
  },
  {
    id: 'osm',
    title: 'OSM Mapas',
    type: 'xyz',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attributions:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    visible: false,
    opacity: 1,
    zIndex: 0,
  },
];

export const LABELS_OVERLAY: XYZLayerConfig = {
  id: 'carto-labels',
  title: 'Etiquetas',
  type: 'xyz',
  url: 'https://{a-d}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}@2x.png',
  attributions:
    '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
  maxZoom: 19,
  visible: false,
  opacity: 1,
  zIndex: 50,
};
