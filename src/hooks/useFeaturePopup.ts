import { useEffect, useRef, useState } from 'react';
import type OLMap from 'ol/Map';
import type { MapBrowserEvent } from 'ol';
import type Feature from 'ol/Feature';
import type Geometry from 'ol/geom/Geometry';
import { useUIStore } from '../store/uiStore';
import { useLayerStore } from '../store/layerStore';

export interface PopupInfo {
  pixel: [number, number];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties: Record<string, any>;
  layerTitle: string;
}

export function useFeaturePopup(mapRef: React.RefObject<OLMap | null>) {
  const measureMode = useUIStore((s) => s.measureMode);
  const overlays = useLayerStore((s) => s.overlays);
  const [popup, setPopup] = useState<PopupInfo | null>(null);

  // Keep latest values in refs so the stable event handler can read them
  const measureModeRef = useRef(measureMode);
  measureModeRef.current = measureMode;
  const overlaysRef = useRef(overlays);
  overlaysRef.current = overlays;

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (evt: MapBrowserEvent<MouseEvent>) => {
      if (measureModeRef.current !== 'off') return;

      let found = false;
      map.forEachFeatureAtPixel(
        evt.pixel,
        (feature, layer) => {
          const f = feature as Feature<Geometry>;
          const props = { ...(f.getProperties() as Record<string, unknown>) };
          delete props['geometry'];
          delete props['style'];  // KML internal style object

          const layerId = layer?.get('id') as string | undefined;
          const layerCfg = overlaysRef.current.find((l) => l.id === layerId);
          const layerTitle = layerCfg?.title ?? layerId ?? 'Feature';

          setPopup({
            pixel: [evt.pixel[0], evt.pixel[1]],
            properties: props as Record<string, unknown>,
            layerTitle,
          });
          found = true;
          return true; // stop at first feature
        },
        { hitTolerance: 8 }
      );

      if (!found) setPopup(null);
    };

    const handleMoveStart = () => setPopup(null);

    map.on('click', handleClick as (e: MapBrowserEvent<UIEvent>) => void);
    map.on('movestart', handleMoveStart);

    return () => {
      map.un('click', handleClick as (e: MapBrowserEvent<UIEvent>) => void);
      map.un('movestart', handleMoveStart);
    };
  }); // no deps — re-runs every render so handler is attached when map becomes ready

  return { popup, closePopup: () => setPopup(null) };
}
