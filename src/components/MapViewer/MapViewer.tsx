import { useRef } from 'react';
import { useMap } from '../../hooks/useMap';
import { useLayerSync } from '../../hooks/useLayerSync';
import { useFeaturePopup } from '../../hooks/useFeaturePopup';
import { useMeasureTool } from '../../hooks/useMeasureTool';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useExportPng } from '../../hooks/useExportPng';
import { FeaturePopup } from '../FeaturePopup/FeaturePopup';
import { useUIStore } from '../../store/uiStore';
import 'ol/ol.css';
import './MapViewer.css';

export function MapViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useMap(containerRef);

  useLayerSync(mapRef);
  useGeolocation(mapRef);
  useExportPng(mapRef);

  const { popup, closePopup } = useFeaturePopup(mapRef);
  const { measurement } = useMeasureTool(mapRef);
  const measureMode = useUIStore((s) => s.measureMode);

  return (
    <div className="map-wrapper">
      <div ref={containerRef} className="map-viewer" />

      {/* Feature attribute popup */}
      {popup && <FeaturePopup info={popup} onClose={closePopup} />}

      {/* Measurement result badge */}
      {measureMode !== 'off' && (
        <div className="measure-badge">
          <span className="measure-badge__mode">
            {measureMode === 'distance' ? '📏 Distancia' : '⬡ Área'}
          </span>
          {measurement && <span className="measure-badge__value">{measurement}</span>}
          {!measurement && <span className="measure-badge__hint">Haga clic para medir</span>}
        </div>
      )}
    </div>
  );
}
