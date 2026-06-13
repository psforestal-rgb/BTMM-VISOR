import { useRef, useState } from 'react';
import { useLayerStore } from '../../store/layerStore';
import { loadLayerFile } from '../../utils/fileLoaders';
import { AddWMSDialog } from './AddWMSDialog';
import { AddWFSDialog } from './AddWFSDialog';
import { AddRealtimeDialog } from './AddRealtimeDialog';
import './Toolbar.css';

export function Toolbar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addOverlay = useLayerStore((s) => s.addOverlay);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<'wms' | 'wfs' | 'realtime' | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    setError(null);
    for (const file of Array.from(files)) {
      try {
        const config = await loadLayerFile(file);
        addOverlay(config);
      } catch (e) {
        setError((e as Error).message);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <header className="toolbar">
        <span className="toolbar-brand">BTMM VISOR</span>
        <div className="toolbar-actions">
          <button className="tb-btn" onClick={() => fileInputRef.current?.click()} title="Cargar GeoJSON o KML">
            + Archivo
          </button>
          <button className="tb-btn" onClick={() => setDialog('wms')} title="Agregar servicio WMS">
            + WMS
          </button>
          <button className="tb-btn" onClick={() => setDialog('wfs')} title="Agregar servicio WFS">
            + WFS
          </button>
          <button className="tb-btn" onClick={() => setDialog('realtime')} title="Agregar capa en tiempo real">
            + Tiempo real
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".geojson,.json,.kml"
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
      {dialog === 'wms' && (
        <AddWMSDialog
          onAdd={(cfg) => { addOverlay(cfg); setDialog(null); }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'wfs' && (
        <AddWFSDialog
          onAdd={(cfg) => { addOverlay(cfg); setDialog(null); }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'realtime' && (
        <AddRealtimeDialog
          onAdd={(cfg) => { addOverlay(cfg); setDialog(null); }}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}
