import { useRef, useState } from 'react';
import { useLayerStore } from '../../store/layerStore';
import { loadLayerFile } from '../../utils/fileLoaders';
import { PRESET_VIEWS } from '../../config/presetViews';
import './Toolbar.css';

const ACCEPT = '.geojson,.json,.kml,.gpx,.zip,.gpkg';

export function Toolbar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addOverlay = useLayerStore((s) => s.addOverlay);
  const flyTo = useLayerStore((s) => s.flyTo);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    setLoading(true);
    for (const file of Array.from(files)) {
      try {
        const configs = await loadLayerFile(file);
        configs.forEach(addOverlay);
      } catch (e) {
        setError((e as Error).message);
      }
    }
    setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <header className="toolbar">
        <span className="toolbar-brand">BTMM VISOR</span>

        <div className="toolbar-group">
          <span className="toolbar-label">Vista</span>
          {PRESET_VIEWS.map((v) => (
            <button
              key={v.id}
              className={`tb-btn${v.id === 'bloque' ? ' tb-btn--primary' : ''}`}
              onClick={() => flyTo(v.center, v.zoom)}
              title={v.title}
            >
              {v.title}
            </button>
          ))}
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button
            className="tb-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            title="Cargar GeoJSON, KML, GPX, Shapefile (.zip) o GeoPackage (.gpkg)"
          >
            {loading ? 'Cargando…' : '+ Capa vectorial'}
          </button>
          <span className="tb-hint">GeoJSON · KML · GPX · SHP (zip) · GPKG</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </header>
      {error && (
        <div className="error-banner" onClick={() => setError(null)}>
          {error} <span className="error-close">✕</span>
        </div>
      )}
    </>
  );
}
