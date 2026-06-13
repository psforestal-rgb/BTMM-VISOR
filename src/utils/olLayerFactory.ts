import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import ImageLayer from 'ol/layer/Image';
import XYZ from 'ol/source/XYZ';
import TileWMS from 'ol/source/TileWMS';
import ImageWMS from 'ol/source/ImageWMS';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import KML from 'ol/format/KML';
import { bbox as bboxStrategy } from 'ol/loadingstrategy';
import type { LayerConfig } from '../types/layer';
import type BaseLayer from 'ol/layer/Base';

export function createOLLayer(config: LayerConfig): BaseLayer {
  switch (config.type) {
    case 'xyz':
      return new TileLayer({
        source: new XYZ({
          url: config.url,
          attributions: config.attributions,
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

    case 'wfs':
      return new VectorLayer({
        source: new VectorSource({
          format: new GeoJSON(),
          url: (extent) => {
            const u = new URL(config.url);
            u.searchParams.set('service', 'WFS');
            u.searchParams.set('version', '2.0.0');
            u.searchParams.set('request', 'GetFeature');
            u.searchParams.set('typenames', config.typeName);
            u.searchParams.set('outputFormat', 'application/json');
            u.searchParams.set('srsName', config.srsName ?? 'EPSG:3857');
            u.searchParams.set('count', String(config.maxFeatures ?? 5000));
            u.searchParams.set('bbox', `${extent.join(',')},EPSG:3857`);
            return u.toString();
          },
          strategy: bboxStrategy,
        }),
        visible: config.visible,
        opacity: config.opacity,
        zIndex: config.zIndex ?? 10,
        properties: { id: config.id },
      });

    case 'geojson': {
      const geoSource = new VectorSource({ format: new GeoJSON() });
      if (config.url) {
        geoSource.setUrl(config.url);
      } else if (config.data) {
        geoSource.addFeatures(
          new GeoJSON().readFeatures(config.data, { featureProjection: 'EPSG:3857' })
        );
      }
      return new VectorLayer({
        source: geoSource,
        visible: config.visible,
        opacity: config.opacity,
        zIndex: config.zIndex ?? 10,
        properties: { id: config.id },
      });
    }

    case 'kml': {
      const kmlFormat = new KML({ extractStyles: true });
      const kmlSource = new VectorSource({ format: kmlFormat });
      if (config.url) {
        kmlSource.setUrl(config.url);
      } else if (config.data) {
        kmlSource.addFeatures(
          kmlFormat.readFeatures(config.data, { featureProjection: 'EPSG:3857' })
        );
      }
      return new VectorLayer({
        source: kmlSource,
        visible: config.visible,
        opacity: config.opacity,
        zIndex: config.zIndex ?? 10,
        properties: { id: config.id },
      });
    }

    case 'realtime':
      // Source starts empty; useLayerSync drives the data feed
      return new VectorLayer({
        source: new VectorSource(),
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
