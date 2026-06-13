import { useRef } from 'react';
import { useMap } from '../../hooks/useMap';
import { useLayerSync } from '../../hooks/useLayerSync';
import 'ol/ol.css';
import './MapViewer.css';

export function MapViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useMap(containerRef);
  useLayerSync(mapRef);

  return <div ref={containerRef} className="map-viewer" />;
}
