import { useEffect, useState } from 'react';
import { MapViewer } from './components/MapViewer/MapViewer';
import { LayerPanel } from './components/LayerPanel/LayerPanel';
import { Toolbar } from './components/Toolbar/Toolbar';
import { FileDropzone } from './components/FileDropzone/FileDropzone';
import { registerSW } from 'virtual:pwa-register';
import './App.css';

export default function App() {
  const [panelOpen, setPanelOpen] = useState(true);
  const [updateReady, setUpdateReady] = useState(false);
  const [updateSW, setUpdateSW] = useState<(() => void) | null>(null);

  useEffect(() => {
    const update = registerSW({
      onNeedRefresh() {
        setUpdateReady(true);
        setUpdateSW(() => update);
      },
    });
  }, []);

  return (
    <FileDropzone>
      <div className="app-shell">
        <Toolbar onTogglePanel={() => setPanelOpen((p) => !p)} panelOpen={panelOpen} />
        <div className="app-body">
          <LayerPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
          <div className="map-container">
            <MapViewer />
          </div>
        </div>
      </div>
      {updateReady && (
        <div className="update-banner">
          Nueva versión disponible.{' '}
          <button onClick={() => updateSW?.()}>Actualizar</button>
        </div>
      )}
    </FileDropzone>
  );
}
