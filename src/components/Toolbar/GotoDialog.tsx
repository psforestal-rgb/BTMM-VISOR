import { useState } from 'react';
import { transform } from 'ol/proj';
import { useLayerStore } from '../../store/layerStore';

interface Props { onClose: () => void; }

type ProjMode = 'crtm05' | 'wgs84';

export function GotoDialog({ onClose }: Props) {
  const flyTo = useLayerStore((s) => s.flyTo);
  const [mode, setMode] = useState<ProjMode>('crtm05');
  const [a, setA] = useState('');  // Easting or Longitude
  const [b, setB] = useState('');  // Northing or Latitude
  const [err, setErr] = useState('');

  const handleGo = () => {
    setErr('');
    const av = parseFloat(a.replace(',', '.').trim());
    const bv = parseFloat(b.replace(',', '.').trim());
    if (isNaN(av) || isNaN(bv)) { setErr('Ingrese coordenadas numéricas válidas.'); return; }

    if (mode === 'crtm05') {
      // Validate CRTM05 approximate bounds
      if (av < 271000 || av > 699000 || bv < 887000 || bv > 1272000) {
        setErr('Coordenadas fuera del rango CRTM05 de Costa Rica.');
        return;
      }
      const [lon, lat] = transform([av, bv], 'EPSG:5367', 'EPSG:4326');
      flyTo([lon, lat], 15);
    } else {
      if (bv < -12 || bv > 12 || av < -88 || av > -82) {
        setErr('Coordenadas fuera del rango de Costa Rica (WGS84).');
        return;
      }
      flyTo([av, bv], 15);
    }
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog">
        <h3>Ir a coordenadas</h3>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <label className="radio-row" style={{ fontSize: '0.8rem', cursor: 'pointer' }}>
            <input type="radio" checked={mode === 'crtm05'} onChange={() => setMode('crtm05')} />
            CRTM05 (metros)
          </label>
          <label className="radio-row" style={{ fontSize: '0.8rem', cursor: 'pointer' }}>
            <input type="radio" checked={mode === 'wgs84'} onChange={() => setMode('wgs84')} />
            WGS84 (grados)
          </label>
        </div>

        {mode === 'crtm05' ? (
          <>
            <label>
              Este (X) — metros
              <input type="text" value={a} onChange={(e) => setA(e.target.value)} placeholder="ej. 541 000" />
            </label>
            <label>
              Norte (Y) — metros
              <input type="text" value={b} onChange={(e) => setB(e.target.value)} placeholder="ej. 1 083 000" />
            </label>
          </>
        ) : (
          <>
            <label>
              Longitud (X)
              <input type="text" value={a} onChange={(e) => setA(e.target.value)} placeholder="ej. -83.775" />
            </label>
            <label>
              Latitud (Y)
              <input type="text" value={b} onChange={(e) => setB(e.target.value)} placeholder="ej. 9.601" />
            </label>
          </>
        )}

        {err && <span style={{ color: '#ff8888', fontSize: '0.75rem' }}>{err}</span>}

        <div className="dialog-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleGo}>Ir</button>
        </div>
      </div>
    </div>
  );
}
