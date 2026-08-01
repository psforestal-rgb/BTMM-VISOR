import { useEffect, useState } from 'react';
import { MapViewer } from './components/MapViewer/MapViewer';
import { LayerPanel } from './components/LayerPanel/LayerPanel';
import { Toolbar } from './components/Toolbar/Toolbar';
import { FileDropzone } from './components/FileDropzone/FileDropzone';
import { AttributeTable } from './components/AttributeTable/AttributeTable';
import { useUIStore } from './store/uiStore';
import './App.css';

export default function App() {
  const [panelOpen, setPanelOpen] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const tableLayerId = useUIStore((s) => s.tableLayerId);

  useEffect(() => {
    if (import.meta.env.DEV || !('serviceWorker' in navigator)) return;

    let reloading = false;
    let reloadForUpdate = false;
    const reloadOnce = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    const handleControllerChange = () => {
      if (reloadForUpdate) reloadOnce();
    };
    const registerVersion = (version: string) =>
      navigator.serviceWorker.register(
        `${import.meta.env.BASE_URL}sw.js?v=${encodeURIComponent(version)}`,
        {
          scope: import.meta.env.BASE_URL,
          updateViaCache: 'none',
        }
      );

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    const checkVersion = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}version.json?t=${Date.now()}`,
          { cache: 'no-store' }
        );
        if (!response.ok) return;
        const payload = await response.json() as { version?: string };
        if (payload.version && payload.version !== __APP_VERSION__) {
          reloadForUpdate = true;
          setUpdating(true);
          const registration = await registerVersion(payload.version);
          await registration.update();
        }
      } catch {
        // Offline is expected for this PWA; retry when it becomes visible/online.
      }
    };

    const initialize = async () => {
      try {
        await registerVersion(__APP_VERSION__);
      } catch {
        // The app remains usable without offline support.
      }
      await checkVersion();
    };

    const intervalId = window.setInterval(checkVersion, 5 * 60 * 1000);
    const handleVisibility = () => { void checkVersion(); };
    const handleOnline = () => { void checkVersion(); };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', handleOnline);
    void initialize();

    return () => {
      window.clearInterval(intervalId);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  useEffect(() => {
    const handleStorageError = () => setStorageError(true);
    window.addEventListener('btmm-storage-error', handleStorageError);
    return () => window.removeEventListener('btmm-storage-error', handleStorageError);
  }, []);

  return (
    <FileDropzone>
      <div className="app-shell">
        <Toolbar onTogglePanel={() => setPanelOpen((p) => !p)} panelOpen={panelOpen} />
        <div className="app-body">
          <LayerPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
          <div className="map-column">
            <div className="map-container">
              <MapViewer />
            </div>
            {tableLayerId && <AttributeTable />}
          </div>
        </div>
      </div>
      {updating && (
        <div className="update-banner">
          Actualizando a la versión más reciente…
        </div>
      )}
      {storageError && (
        <div className="error-banner" onClick={() => setStorageError(false)}>
          No se pudo guardar una capa para la próxima sesión. Compruebe el espacio disponible.
          <span className="error-close">✕</span>
        </div>
      )}
    </FileDropzone>
  );
}
