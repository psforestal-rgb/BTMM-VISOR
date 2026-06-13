export type LayerType = 'xyz' | 'wms' | 'wfs' | 'geojson' | 'kml' | 'realtime';

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
}

export interface KMLLayerConfig extends BaseLayerConfig {
  type: 'kml';
  url?: string;
  data?: string;
}

export interface RealtimeLayerConfig extends BaseLayerConfig {
  type: 'realtime';
  url: string;
  protocol: 'ws' | 'http';
  intervalMs?: number;
}

export type LayerConfig =
  | XYZLayerConfig
  | WMSLayerConfig
  | WFSLayerConfig
  | GeoJSONLayerConfig
  | KMLLayerConfig
  | RealtimeLayerConfig;
