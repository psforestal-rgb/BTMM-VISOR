import { useState } from 'react';
import { useLayerStore } from '../../store/layerStore';
import type { WMSLayerConfig } from '../../types/layer';

interface Props { onClose: () => void; }

export function WMSDialog({ onClose }: Props) {
  const addOverlay = useLayerStore((s) => s.addOverlay);
  const [url, setUrl] = useState('');
  const [layers, setLayers] = useState('');
  const [title, setTitle] = useState('');
  const [tiled, setTiled] = useState(true);
  const [err, setErr] = useState('');

  const handleAdd = () => {
    setErr('');
    if (!url.trim()) { setErr('Ingrese la URL del servicio WMS.'); return; }
    if (!layers.trim()) { setErr('Ingrese el nombre de al menos una capa.'); return; }
    try { new URL(url); } catch { setErr('URL no válida.'); return; }

    const config: WMSLayerConfig = {
      id: crypto.randomUUID(),
      title: title.trim() || layers.trim(),
      type: 'wms',
      url: url.trim(),
      layers: layers.trim(),
      tiled,
      visible: true,
      opacity: 1,
      zIndex: 10,
    };
    addOverlay(config);
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog">
        <h3>Agregar capa WMS</h3>
        <label>
          URL del servicio
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…/wms" />
        </label>
        <label>
          Nombre(s) de capa (LAYERS)
          <input type="text" value={layers} onChange={(e) => setLayers(e.target.value)} placeholder="nombre_capa" />
        </label>
        <label>
          Título (opcional)
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mi capa WMS" />
        </label>
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={tiled} onChange={(e) => setTiled(e.target.checked)} />
          Teselado (TileWMS)
        </label>
        {err && <span style={{ color: '#ff8888', fontSize: '0.75rem' }}>{err}</span>}
        <div className="dialog-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleAdd}>Agregar</button>
        </div>
      </div>
    </div>
  );
}
