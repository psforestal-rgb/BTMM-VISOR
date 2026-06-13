import { useEffect, useRef } from 'react';
import OLMap from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat } from 'ol/proj';
import { isEmpty } from 'ol/extent';
import type Feature from 'ol/Feature';
import type Geometry from 'ol/geom/Geometry';
import type BaseLayer from 'ol/layer/Base';
import { selectLabelsConfig, useLayerStore } from '../store/layerStore';
import { buildOLStyle, createOLLayer, VIEW_PROJ } from '../utils/olLayerFactory';
import type { VectorLayerConfig } from '../types/layer';

type RealtimeHandle = WebSocket | ReturnType<typeof setInterval>;

export function useLayerSync(mapRef: React.RefObject<OLMap | null>) {
  const {
    baseMaps, overlays,
    pendingView, clearPendingView,
    pendingFit, clearPendingFit,
  } = useLayerStore();
  const labelsConfig = useLayerStore(selectLabelsConfig);
  const olLayers = useRef(new globalThis.Map<string, BaseLayer>());
  const rtHandles = useRef(new globalThis.Map<string, RealtimeHandle>());

  // ── Sync layers ────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const allConfigs = [...baseMaps, ...overlays, labelsConfig];
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
        // Update vector style when layerStyle changes
        if (
          (config.type === 'geojson' || config.type === 'kml' || config.type === 'realtime') &&
          existing instanceof VectorLayer
        ) {
          const vc = config as VectorLayerConfig;
          if (config.type === 'kml' && !vc.layerStyle) {
            // Keep embedded KML styles
          } else {
            (existing as VectorLayer<Feature<Geometry>>).setStyle(buildOLStyle(vc.layerStyle));
          }
        }
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

    // Update overlay z-indices based on array order (so drag-reorder is reflected)
    overlays.forEach((config, idx) => {
      const layer = olLayers.current.get(config.id);
      if (layer) layer.setZIndex(10 + idx);
    });
  });

  // ── flyTo ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pendingView || !mapRef.current) return;
    mapRef.current.getView().animate({
      center: fromLonLat(pendingView.center, VIEW_PROJ),
      zoom: pendingView.zoom,
      duration: 800,
    });
    clearPendingView();
  }, [pendingView, mapRef, clearPendingView]);

  // ── Zoom to layer extent ───────────────────────────────────────────────────
  useEffect(() => {
    if (!pendingFit || !mapRef.current) return;
    const olLayer = olLayers.current.get(pendingFit);
    if (olLayer instanceof VectorLayer) {
      const source = (olLayer as VectorLayer<Feature<Geometry>>).getSource();
      const extent = source?.getExtent();
      if (extent && !isEmpty(extent)) {
        mapRef.current.getView().fit(extent, {
          padding: [60, 60, 60, 60],
          maxZoom: 18,
          duration: 700,
        });
      }
    }
    clearPendingFit();
  }, [pendingFit, mapRef, clearPendingFit]);

  // ── Cleanup realtime handles on unmount ────────────────────────────────────
  useEffect(() => {
    const handles = rtHandles.current;
    return () => {
      handles.forEach((handle) => {
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
  const format = new GeoJSON({ featureProjection: VIEW_PROJ });

  const update = (json: unknown) => {
    try {
      source.clear();
      source.addFeatures(format.readFeatures(json) as Feature<Geometry>[]);
    } catch { /* ignore malformed frames */ }
  };

  if (protocol === 'ws') {
    const ws = new WebSocket(url);
    ws.onmessage = (evt) => {
      try { update(JSON.parse(evt.data as string)); } catch { /* ignore */ }
    };
    return ws;
  }

  const id = setInterval(async () => {
    try {
      const res = await fetch(url);
      update(await res.json());
    } catch { /* ignore network errors */ }
  }, intervalMs);
  return id;
}
