import type { BingLayerConfig } from '../types/layer';

// Key is read from VITE_BING_KEY in .env.local (never commit the key)
const KEY = import.meta.env.VITE_BING_KEY as string ?? '';

export const BASE_MAPS: BingLayerConfig[] = [
  {
    id: 'bing-aerial',
    title: 'Bing Satélite',
    type: 'bing',
    imagerySet: 'Aerial',
    apiKey: KEY,
    maxZoom: 19,
    visible: true,
    opacity: 1,
    zIndex: 0,
  },
  {
    id: 'bing-hybrid',
    title: 'Bing Híbrido',
    type: 'bing',
    imagerySet: 'AerialWithLabelsOnDemand',
    apiKey: KEY,
    maxZoom: 19,
    visible: false,
    opacity: 1,
    zIndex: 0,
  },
  {
    id: 'bing-road',
    title: 'Bing Maps',
    type: 'bing',
    imagerySet: 'RoadOnDemand',
    apiKey: KEY,
    maxZoom: 19,
    visible: false,
    opacity: 1,
    zIndex: 0,
  },
];
