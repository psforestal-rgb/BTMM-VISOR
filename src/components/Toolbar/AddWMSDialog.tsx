import { useState } from 'react';
import type { WMSLayerConfig } from '../../types/layer';

interface Props {
  onAdd: (cfg: WMSLayerConfig) => void;
  onClose: () => void;
}

export function AddWMSDialog({ onAdd, onClose }: Props) {
  const [url, setUrl] = useState('');
  const [layers, setLayers] = useState('');
  const [title, setTitle] = useState('');
  const [tiled, setTiled] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !layers) return;
    onAdd({
      id: crypto.randomUUID(),
      title: title || layers,
      type: 'wms',
      url,
      layers,
      tiled,
      visible: true,
      opacity: 1,
      zIndex: 10,
    });
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <form className="dialog" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3>Agregar capa WMS</h3>
        <label>
          URL del servicio *
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." required />
        </label>
        <label>
          Nombre de la capa (LAYERS) *
          <input type="text" value={layers} onChange={(e) => setLayers(e.target.value)} placeholder="nombre:capa" required />
        </label>
        <label>
          Título (opcional)
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mi capa WMS" />
        </label>
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" checked={tiled} onChange={(e) => setTiled(e.target.checked)} style={{ width: 'auto' }} />
          Modo teselas (TileWMS)
        </label>
        <div className="dialog-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary">Agregar</button>
        </div>
      </form>
    </div>
  );
}
