export type LayerType = 'xyz' | 'bing' | 'wms' | 'wfs' | 'geojson' | 'kml' | 'realtime';

export interface LayerStyle {
  fillColor: string;    // hex
  fillOpacity: number;  // 0–1
  strokeColor: string;  // hex
  strokeWidth: number;  // px
  pointRadius: number;  // px
}

export const DEFAULT_LAYER_STYLE: LayerStyle = {
  fillColor: '#0077cc',
  fillOpacity: 0.25,
  strokeColor: '#0077cc',
  strokeWidth: 2,
  pointRadius: 5,
};

export interface BaseLayerConfig {
  id: string;
  title: string;
  type: LayerType;
  visible: boolean;
  opacity: number;
  zIndex?: number;
}

export interface XYZLayerConfig extends BaseLayerConfig {
  type: 'xyz';
  url: string;
  attributions?: string;
  maxZoom?: number;
}

export interface BingLayerConfig extends BaseLayerConfig {
  type: 'bing';
  imagerySet: 'Aerial' | 'AerialWithLabels' | 'AerialWithLabelsOnDemand' | 'Road' | 'RoadOnDemand' | 'CanvasDark' | 'CanvasLight';
  apiKey: string;
  maxZoom?: number;
}

export interface WMSLayerConfig extends BaseLayerConfig {
  type: 'wms';
  url: string;
  layers: string;
  format?: string;
  tiled?: boolean;
  params?: Record<string, string>;
}

export interface WFSLayerConfig extends BaseLayerConfig {
  type: 'wfs';
  url: string;
  typeName: string;
  maxFeatures?: number;
  srsName?: string;
}

export interface GeoJSONLayerConfig extends BaseLayerConfig {
  type: 'geojson';
  url?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  layerStyle?: LayerStyle;
}

export interface KMLLayerConfig extends BaseLayerConfig {
  type: 'kml';
  url?: string;
  data?: string;
  layerStyle?: LayerStyle;
}

export interface RealtimeLayerConfig extends BaseLayerConfig {
  type: 'realtime';
  url: string;
  protocol: 'ws' | 'http';
  intervalMs?: number;
  layerStyle?: LayerStyle;
}

export type LayerConfig =
  | XYZLayerConfig
  | BingLayerConfig
  | WMSLayerConfig
  | WFSLayerConfig
  | GeoJSONLayerConfig
  | KMLLayerConfig
  | RealtimeLayerConfig;

export type VectorLayerConfig = GeoJSONLayerConfig | KMLLayerConfig | RealtimeLayerConfig;
