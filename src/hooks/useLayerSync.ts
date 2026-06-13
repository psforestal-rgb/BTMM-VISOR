import { useEffect, useRef } from 'react';
import OLMap from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import type Feature from 'ol/Feature';
import type Geometry from 'ol/geom/Geometry';
import type BaseLayer from 'ol/layer/Base';
import { useLayerStore } from '../store/layerStore';
import { createOLLayer } from '../utils/olLayerFactory';

type RealtimeHandle = WebSocket | ReturnType<typeof setInterval>;

export function useLayerSync(mapRef: React.RefObject<OLMap | null>) {
  const { baseMaps, overlays } = useLayerStore();
  const olLayers = useRef(new globalThis.Map<string, BaseLayer>());
  const rtHandles = useRef(new globalThis.Map<string, RealtimeHandle>());

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const allConfigs = [...baseMaps, ...overlays];
    const desired = new globalThis.Set(allConfigs.map((c) => c.id));

    // Remove stale layers
    olLayers.current.forEach((layer, id) => {
      if (!desired.has(id)) {
        map.removeLayer(layer);
        olLayers.current.delete(id);
        const handle = rtHandles.current.get(id);
        if (handle instanceof WebSocket) handle.close();
        else if (handle !== undefined) clearInterval(handle as ReturnType<typeof setInterval>);
        rtHandles.current.delete(id);
      }
    });

    // Add new or sync existing
    allConfigs.forEach((config) => {
      const existing = olLayers.current.get(config.id);
      if (existing) {
        existing.setVisible(config.visible);
        existing.setOpacity(config.opacity);
      } else {
        const layer = createOLLayer(config);
        map.addLayer(layer);
        olLayers.current.set(config.id, layer);

        if (config.type === 'realtime') {
          const handle = startRealtimeFeed(
            layer as VectorLayer<Feature<Geometry>>,
            config.url,
            config.protocol,
            config.intervalMs ?? 30000
          );
          rtHandles.current.set(config.id, handle);
        }
      }
    });
  });

  // Clean up realtime handles on unmount
  useEffect(() => {
    return () => {
      rtHandles.current.forEach((handle) => {
        if (handle instanceof WebSocket) handle.close();
        else clearInterval(handle as ReturnType<typeof setInterval>);
      });
    };
  }, []);
}

function startRealtimeFeed(
  layer: VectorLayer<Feature<Geometry>>,
  url: string,
  protocol: 'ws' | 'http',
  intervalMs: number
): RealtimeHandle {
  const source = layer.getSource() as VectorSource<Feature<Geometry>>;
  const format = new GeoJSON();

  const update = (json: unknown) => {
    try {
      const features = format.readFeatures(json, {
        featureProjection: 'EPSG:3857',
      }) as Feature<Geometry>[];
      source.clear();
      source.addFeatures(features);
    } catch {
      // ignore malformed frames
    }
  };

  if (protocol === 'ws') {
    const ws = new WebSocket(url);
    ws.onmessage = (evt) => {
      try {
        update(JSON.parse(evt.data as string));
      } catch {
        // ignore parse errors
      }
    };
    return ws;
  }

  const id = setInterval(async () => {
    try {
      const res = await fetch(url);
      update(await res.json());
    } catch {
      // ignore network errors during polling
    }
  }, intervalMs);
  return id;
}
