import type { XYZLayerConfig } from '../types/layer';

export const BASE_MAPS: XYZLayerConfig[] = [
  {
    id: 'osm',
    title: 'OpenStreetMap',
    type: 'xyz',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attributions:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    visible: true,
    opacity: 1,
    zIndex: 0,
  },
  {
    id: 'satellite',
    title: 'Satélite (ESRI)',
    type: 'xyz',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attributions:
      'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19,
    visible: false,
    opacity: 1,
    zIndex: 0,
  },
  {
    id: 'topo',
    title: 'OpenTopoMap',
    type: 'xyz',
    url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
    attributions:
      'Map data: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map display: © <a href="http://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
    visible: false,
    opacity: 1,
    zIndex: 0,
  },
];
