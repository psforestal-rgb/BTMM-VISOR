import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import ImageLayer from 'ol/layer/Image';
import XYZ from 'ol/source/XYZ';
import BingMaps from 'ol/source/BingMaps';
import TileWMS from 'ol/source/TileWMS';
import ImageWMS from 'ol/source/ImageWMS';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import KML from 'ol/format/KML';
import { bbox as bboxStrategy } from 'ol/loadingstrategy';
import { transformExtent } from 'ol/proj';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import CircleStyle from 'ol/style/Circle';
import type { LayerConfig, LayerStyle } from '../types/layer';
import { DEFAULT_LAYER_STYLE } from '../types/layer';
import type BaseLayer from 'ol/layer/Base';
import type Feature from 'ol/Feature';
import type Geometry from 'ol/geom/Geometry';

export const VIEW_PROJ = 'EPSG:5367';

// ── Style builder ────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function buildOLStyle(ls?: Partial<LayerStyle>): Style {
  const s = { ...DEFAULT_LAYER_STYLE, ...ls };
  const fill = new Fill({ color: hexToRgba(s.fillColor, s.fillOpacity) });
  const stroke = new Stroke({ color: s.strokeColor, width: s.strokeWidth });
  return new Style({
    fill,
    stroke,
    image: new CircleStyle({ radius: s.pointRadius, fill, stroke }),
  });
}

// ── Layer factory ────────────────────────────────────────────────────────────

export function createOLLayer(config: LayerConfig): BaseLayer {
  switch (config.type) {
    case 'xyz':
      return new TileLayer({
        source: new XYZ({
          url: config.url,
          crossOrigin: 'anonymous',
          attributions: config.attributions,
          maxZoom: config.maxZoom ?? 20,
        }),
        visible: config.visible,
        opacity: config.opacity,
        zIndex: config.zIndex ?? 0,
        properties: { id: config.id },
      });

    case 'bing':
      return new TileLayer({
        source: new BingMaps({
          key: config.apiKey,
          imagerySet: config.imagerySet,
          maxZoom: config.maxZoom ?? 19,
        }),
        visible: config.visible,
        opacity: config.opacity,
        zIndex: config.zIndex ?? 0,
        properties: { id: config.id },
      });

    case 'wms': {
      if (config.tiled) {
        return new TileLayer({
          source: new TileWMS({
            url: config.url,
            params: {
              LAYERS: config.layers,
              FORMAT: config.format ?? 'image/png',
              TRANSPARENT: 'true',
              ...config.params,
            },
          }),
          visible: config.visible,
          opacity: config.opacity,
          zIndex: config.zIndex ?? 10,
          properties: { id: config.id },
        });
      }
      return new ImageLayer({
        source: new ImageWMS({
          url: config.url,
          params: {
            LAYERS: config.layers,
            FORMAT: config.format ?? 'image/png',
            TRANSPARENT: 'true',
            ...config.params,
          },
        }),
        visible: config.visible,
        opacity: config.opacity,
        zIndex: config.zIndex ?? 10,
        properties: { id: config.id },
      });
    }

    case 'wfs': {
      const wfsSrsName = config.srsName ?? 'EPSG:4326';
      return new VectorLayer({
        source: new VectorSource({
          format: new GeoJSON(),
          url: (extent) => {
            // Transform extent from view CRS to WFS request CRS
            const ext4326 = transformExtent(extent, VIEW_PROJ, 'EPSG:4326');
            const u = new URL(config.url);
            u.searchParams.set('service', 'WFS');
            u.searchParams.set('version', '2.0.0');
            u.searchParams.set('request', 'GetFeature');
            u.searchParams.set('typenames', config.typeName);
            u.searchParams.set('outputFormat', 'application/json');
            u.searchParams.set('srsName', wfsSrsName);
            u.searchParams.set('count', String(config.maxFeatures ?? 5000));
            u.searchParams.set('bbox', `${ext4326.join(',')},EPSG:4326`);
            return u.toString();
          },
          strategy: bboxStrategy,
        }),
        style: buildOLStyle(),
        visible: config.visible,
        opacity: config.opacity,
        zIndex: config.zIndex ?? 10,
        properties: { id: config.id },
      });
    }

    case 'geojson': {
      const geoFormat = new GeoJSON({ featureProjection: VIEW_PROJ });
      const geoSource = new VectorSource({ format: geoFormat });
      if (config.url) {
        geoSource.setUrl(config.url);
      } else if (config.data) {
        geoSource.addFeatures(
          geoFormat.readFeatures(config.data) as Feature<Geometry>[]
        );
      }
      return new VectorLayer({
        source: geoSource,
        style: buildOLStyle(config.layerStyle),
        visible: config.visible,
        opacity: config.opacity,
        zIndex: config.zIndex ?? 10,
        properties: { id: config.id },
      });
    }

    case 'kml': {
      const kmlFmt = new KML({ extractStyles: !config.layerStyle });
      const kmlSource = new VectorSource({ format: kmlFmt });
      if (config.url) {
        kmlSource.setUrl(config.url);
      } else if (config.data) {
        kmlSource.addFeatures(
          kmlFmt.readFeatures(config.data, {
            dataProjection: 'EPSG:4326',
            featureProjection: VIEW_PROJ,
          }) as Feature<Geometry>[]
        );
      }
      return new VectorLayer({
        source: kmlSource,
        // Only override KML embedded styles when the user has set a custom style
        style: config.layerStyle ? buildOLStyle(config.layerStyle) : undefined,
        visible: config.visible,
        opacity: config.opacity,
        zIndex: config.zIndex ?? 10,
        properties: { id: config.id },
      });
    }

    case 'realtime':
      return new VectorLayer({
        source: new VectorSource(),
        style: buildOLStyle(config.layerStyle),
        visible: config.visible,
        opacity: config.opacity,
        zIndex: config.zIndex ?? 20,
        properties: {
          id: config.id,
          realtimeUrl: config.url,
          protocol: config.protocol,
          intervalMs: config.intervalMs ?? 30000,
        },
      });

    default:
      throw new Error(`Unsupported layer type: ${(config as LayerConfig).type}`);
  }
}
