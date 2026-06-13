import { useRef, useState } from 'react';
import { useLayerStore } from '../../store/layerStore';
import { useUIStore } from '../../store/uiStore';
import { loadLayerFile } from '../../utils/fileLoaders';
import { PRESET_VIEWS } from '../../config/presetViews';
import { GotoDialog } from './GotoDialog';
import { WMSDialog } from './WMSDialog';
import { WFSDialog } from './WFSDialog';
import './Toolbar.css';

const ACCEPT = '.geojson,.json,.kml,.gpx,.zip,.gpkg';
const FILE_HINT = 'Cargar capa vectorial — GeoJSON, KML, GPX, Shapefile (.zip) o GeoPackage (.gpkg)';

interface Props {
  panelOpen: boolean;
  onTogglePanel: () => void;
}

export function Toolbar({ panelOpen, onTogglePanel }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addOverlay = useLayerStore((s) => s.addOverlay);
  const flyTo = useLayerStore((s) => s.flyTo);

  const { measureMode, setMeasureMode, geolocating, setGeolocating, triggerExport } = useUIStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState('');
  const [showGoto, setShowGoto] = useState(false);
  const [showWMS, setShowWMS] = useState(false);
  const [showWFS, setShowWFS] = useState(false);

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

  const handleViewChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedView('');
    const view = PRESET_VIEWS.find((v) => v.id === id);
    if (view) flyTo(view.center, view.zoom);
  };

  const toggleMeasure = (mode: 'distance' | 'area') => {
    setMeasureMode(measureMode === mode ? 'off' : mode);
  };

  return (
    <>
      <header className="toolbar">
        {/* Panel toggle */}
        <button
          className={`tb-btn tb-btn--icon${panelOpen ? ' tb-btn--active' : ''}`}
          onClick={onTogglePanel}
          title={panelOpen ? 'Ocultar panel de capas' : 'Mostrar panel de capas'}
          aria-label="Panel de capas"
        >☰</button>

        <span className="toolbar-brand">BTMM VISOR</span>
        <div className="toolbar-divider" />

        {/* Preset views */}
        <label className="toolbar-label" htmlFor="view-select">Vista</label>
        <select
          id="view-select"
          className="view-select"
          value={selectedView}
          onChange={handleViewChange}
        >
          <option value="" disabled>— Ir a… —</option>
          {PRESET_VIEWS.map((v) => (
            <option key={v.id} value={v.id}>{v.title}</option>
          ))}
        </select>

        <div className="toolbar-divider" />

        {/* Go to coordinates */}
        <button
          className="tb-btn tb-btn--icon"
          onClick={() => setShowGoto(true)}
          title="Ir a coordenadas"
        >🎯</button>

        {/* Geolocation */}
        <button
          className={`tb-btn tb-btn--icon${geolocating ? ' tb-btn--active' : ''}`}
          onClick={() => setGeolocating(!geolocating)}
          title={geolocating ? 'Desactivar GPS' : 'Activar GPS'}
        >📍</button>

        <div className="toolbar-divider" />

        {/* Measurement tools */}
        <button
          className={`tb-btn tb-btn--sm${measureMode === 'distance' ? ' tb-btn--active' : ''}`}
          onClick={() => toggleMeasure('distance')}
          title="Medir distancia"
        >📏 Dist.</button>
        <button
          className={`tb-btn tb-btn--sm${measureMode === 'area' ? ' tb-btn--active' : ''}`}
          onClick={() => toggleMeasure('area')}
          title="Medir área"
        >⬡ Área</button>

        <div className="toolbar-divider" />

        {/* Load vector layer */}
        <button
          className="tb-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          title={FILE_HINT}
        >
          {loading ? '⏳ Cargando…' : '+ Vector'}
        </button>

        {/* WMS */}
        <button className="tb-btn" onClick={() => setShowWMS(true)} title="Agregar capa WMS">
          + WMS
        </button>

        {/* WFS */}
        <button className="tb-btn" onClick={() => setShowWFS(true)} title="Agregar capa WFS">
          + WFS
        </button>

        <div className="toolbar-divider" />

        {/* Export PNG */}
        <button
          className="tb-btn tb-btn--icon"
          onClick={triggerExport}
          title="Exportar vista como PNG"
        >🖼️</button>

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

      {/* Loading overlay on map */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <span>Cargando archivo…</span>
        </div>
      )}

      {showGoto && <GotoDialog onClose={() => setShowGoto(false)} />}
      {showWMS && <WMSDialog onClose={() => setShowWMS(false)} />}
      {showWFS && <WFSDialog onClose={() => setShowWFS(false)} />}
    </>
  );
}
