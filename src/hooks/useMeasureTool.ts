import { useEffect, useRef, useState } from 'react';
import type OLMap from 'ol/Map';
import Draw from 'ol/interaction/Draw';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import CircleStyle from 'ol/style/Circle';
import { getLength, getArea } from 'ol/sphere';
import type Feature from 'ol/Feature';
import type Geometry from 'ol/geom/Geometry';
import type { LineString, Polygon } from 'ol/geom';
import { useUIStore } from '../store/uiStore';
import { VIEW_PROJ } from '../utils/olLayerFactory';

function formatLength(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(3)} km` : `${Math.round(m).toLocaleString('es-CR')} m`;
}

function formatArea(m2: number): string {
  return m2 >= 10000 ? `${(m2 / 10000).toFixed(2)} ha` : `${Math.round(m2).toLocaleString('es-CR')} m²`;
}

const MEASURE_STYLE = new Style({
  fill: new Fill({ color: 'rgba(255, 204, 0, 0.15)' }),
  stroke: new Stroke({ color: '#ffcc00', width: 2.5, lineDash: [8, 5] }),
  image: new CircleStyle({
    radius: 5,
    fill: new Fill({ color: '#ffcc00' }),
    stroke: new Stroke({ color: '#fff', width: 1.5 }),
  }),
});

export function useMeasureTool(mapRef: React.RefObject<OLMap | null>) {
  const measureMode = useUIStore((s) => s.measureMode);
  const [measurement, setMeasurement] = useState<string | null>(null);

  const sourceRef = useRef(new VectorSource<Feature<Geometry>>());
  const layerRef = useRef<VectorLayer<Feature<Geometry>> | null>(null);
  const drawRef = useRef<Draw | null>(null);
  const measureModeRef = useRef(measureMode);
  measureModeRef.current = measureMode;

  // Add measure layer to map (idempotent)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || layerRef.current) return;

    const layer = new VectorLayer<Feature<Geometry>>({
      source: sourceRef.current,
      style: MEASURE_STYLE,
      zIndex: 100,
      properties: { id: '_measure_layer' },
    });
    map.addLayer(layer);
    layerRef.current = layer;
  });

  // Manage draw interaction when mode changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Tear down previous interaction
    if (drawRef.current) {
      map.removeInteraction(drawRef.current);
      drawRef.current = null;
    }
    sourceRef.current.clear();
    setMeasurement(null);

    if (measureMode === 'off') return;

    const draw = new Draw({
      source: sourceRef.current,
      type: measureMode === 'distance' ? 'LineString' : 'Polygon',
      style: MEASURE_STYLE,
    });

    draw.on('drawstart', (evt) => {
      sourceRef.current.clear();
      setMeasurement(null);
      evt.feature.getGeometry()?.on('change', (e) => {
        const geom = e.target as Geometry;
        if (measureModeRef.current === 'distance') {
          const len = getLength(geom as LineString, { projection: VIEW_PROJ });
          setMeasurement(formatLength(len));
        } else {
          const area = getArea(geom as Polygon, { projection: VIEW_PROJ });
          if (area > 0) setMeasurement(formatArea(area));
        }
      });
    });

    draw.on('drawend', (evt) => {
      const geom = evt.feature.getGeometry()!;
      if (measureModeRef.current === 'distance') {
        setMeasurement(formatLength(getLength(geom as LineString, { projection: VIEW_PROJ })));
      } else {
        setMeasurement(formatArea(getArea(geom as Polygon, { projection: VIEW_PROJ })));
      }
    });

    map.addInteraction(draw);
    drawRef.current = draw;

    return () => {
      if (drawRef.current) {
        map.removeInteraction(drawRef.current);
        drawRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measureMode]);

  // Remove layer on unmount (capture refs before cleanup fn)
  useEffect(() => {
    const map = mapRef.current;
    const getLayer = () => layerRef.current;
    return () => {
      const layer = getLayer();
      if (map && layer) map.removeLayer(layer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { measurement };
}
