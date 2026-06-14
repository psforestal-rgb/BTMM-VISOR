import { useState } from 'react';
import { useLayerStore } from '../../store/layerStore';
import type { WFSLayerConfig } from '../../types/layer';

interface Props { onClose: () => void; }

export function WFSDialog({ onClose }: Props) {
  const addOverlay = useLayerStore((s) => s.addOverlay);
  const [url, setUrl] = useState('');
  const [typeName, setTypeName] = useState('');
  const [title, setTitle] = useState('');
  const [maxFeatures, setMaxFeatures] = useState('5000');
  const [err, setErr] = useState('');

  const handleAdd = () => {
    setErr('');
    if (!url.trim()) { setErr('Ingrese la URL del servicio WFS.'); return; }
    if (!typeName.trim()) { setErr('Ingrese el nombre del tipo (typeName).'); return; }
    try { new URL(url); } catch { setErr('URL no válida.'); return; }
    const max = parseInt(maxFeatures, 10);
    if (isNaN(max) || max < 1) { setErr('Máx. features debe ser un número positivo.'); return; }

    const config: WFSLayerConfig = {
      id: crypto.randomUUID(),
      title: title.trim() || typeName.trim(),
      type: 'wfs',
      url: url.trim(),
      typeName: typeName.trim(),
      maxFeatures: max,
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
        <h3>Agregar capa WFS</h3>
        <label>
          URL del servicio
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…/wfs" />
        </label>
        <label>
          TypeName
          <input type="text" value={typeName} onChange={(e) => setTypeName(e.target.value)} placeholder="namespace:nombre_capa" />
        </label>
        <label>
          Título (opcional)
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mi capa WFS" />
        </label>
        <label>
          Máx. features
          <input type="number" value={maxFeatures} min={1} max={50000} onChange={(e) => setMaxFeatures(e.target.value)} />
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
