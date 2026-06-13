import { useRef, useState } from 'react';
import { useLayerStore } from '../../store/layerStore';
import { loadLayerFile } from '../../utils/fileLoaders';
import { PRESET_VIEWS } from '../../config/presetViews';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState('');

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

  return (
    <>
      <header className="toolbar">
        {/* Panel toggle */}
        <button
          className={`tb-btn tb-btn--icon${panelOpen ? ' tb-btn--active' : ''}`}
          onClick={onTogglePanel}
          title={panelOpen ? 'Ocultar panel de capas' : 'Mostrar panel de capas'}
          aria-label="Panel de capas"
        >
          ☰
        </button>

        <span className="toolbar-brand">BTMM VISOR</span>

        <div className="toolbar-divider" />

        {/* Preset views — compact select */}
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

        {/* Load vector layer */}
        <button
          className="tb-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          title={FILE_HINT}
        >
          {loading ? 'Cargando…' : '+ Capa vectorial'}
        </button>

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
