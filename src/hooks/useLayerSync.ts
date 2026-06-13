import { useEffect, useRef } from 'react';
import type Map from 'ol/Map';
import type VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import type BaseLayer from 'ol/layer/Base';
import { useLayerStore } from '../store/layerStore';
import { createOLLayer } from '../utils/olLayerFactory';

type RealtimeHandle = WebSocket | ReturnType<typeof setInterval>;

export function useLayerSync(mapRef: React.RefObject<Map | null>) {
  const { baseMaps, overlays } = useLayerStore();
  const olLayers = useRef(new Map<string, BaseLayer>());
  const rtHandles = useRef(new Map<string, RealtimeHandle>());

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const allConfigs = [...baseMaps, ...overlays];
    const desired = new Set(allConfigs.map((c) => c.id));

    // Remove stale layers
    olLayers.current.forEach((layer, id) => {
      if (!desired.has(id)) {
        map.removeLayer(layer);
        olLayers.current.delete(id);
        const handle = rtHandles.current.get(id);
        if (handle instanceof WebSocket) handle.close();
        else if (handle !== undefined) clearInterval(handle);
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
            layer as VectorLayer<VectorSource>,
            config.url,
            config.protocol,
            config.intervalMs ?? 30000
          );
          rtHandles.current.set(config.id, handle);
        }
      }
    });
  });

  // Cleanup all realtime handles on unmount
  useEffect(() => {
    return () => {
      rtHandles.current.forEach((handle) => {
        if (handle instanceof WebSocket) handle.close();
        else clearInterval(handle);
      });
    };
  }, []);
}

function startRealtimeFeed(
  layer: VectorLayer<VectorSource>,
  url: string,
  protocol: 'ws' | 'http',
  intervalMs: number
): RealtimeHandle {
  const source = layer.getSource()!;
  const format = new GeoJSON();

  const update = (json: unknown) => {
    try {
      source.clear();
      source.addFeatures(
        format.readFeatures(json, { featureProjection: 'EPSG:3857' })
      );
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
        // ignore parse error
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
