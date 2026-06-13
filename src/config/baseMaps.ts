import type { XYZLayerConfig } from '../types/layer';

// Google tile URLs (informal — no API key required for tile access,
// but subject to Google's Terms of Service)
const G = (lyrs: string): string =>
  `https://mt1.google.com/vt/lyrs=${lyrs}&x={x}&y={y}&z={z}`;

export const BASE_MAPS: XYZLayerConfig[] = [
  {
    id: 'google-satellite',
    title: 'Google Satélite',
    type: 'xyz',
    url: G('s'),
    attributions: '© <a href="https://www.google.com/maps">Google</a>',
    maxZoom: 20,
    visible: true,
    opacity: 1,
    zIndex: 0,
  },
  {
    id: 'google-hybrid',
    title: 'Google Híbrido',
    type: 'xyz',
    url: G('y'),
    attributions: '© <a href="https://www.google.com/maps">Google</a>',
    maxZoom: 20,
    visible: false,
    opacity: 1,
    zIndex: 0,
  },
  {
    id: 'google-maps',
    title: 'Google Maps',
    type: 'xyz',
    url: G('m'),
    attributions: '© <a href="https://www.google.com/maps">Google</a>',
    maxZoom: 20,
    visible: false,
    opacity: 1,
    zIndex: 0,
  },
];
