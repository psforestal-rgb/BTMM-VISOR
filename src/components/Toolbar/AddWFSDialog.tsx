import { useState } from 'react';
import type { WFSLayerConfig } from '../../types/layer';

interface Props {
  onAdd: (cfg: WFSLayerConfig) => void;
  onClose: () => void;
}

export function AddWFSDialog({ onAdd, onClose }: Props) {
  const [url, setUrl] = useState('');
  const [typeName, setTypeName] = useState('');
  const [title, setTitle] = useState('');
  const [maxFeatures, setMaxFeatures] = useState(5000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !typeName) return;
    onAdd({
      id: crypto.randomUUID(),
      title: title || typeName,
      type: 'wfs',
      url,
      typeName,
      maxFeatures,
      visible: true,
      opacity: 1,
      zIndex: 10,
    });
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <form className="dialog" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3>Agregar capa WFS</h3>
        <label>
          URL del servicio *
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." required />
        </label>
        <label>
          TypeName *
          <input type="text" value={typeName} onChange={(e) => setTypeName(e.target.value)} placeholder="namespace:typename" required />
        </label>
        <label>
          Título (opcional)
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mi capa WFS" />
        </label>
        <label>
          Máximo de features
          <input type="number" value={maxFeatures} min={1} max={50000} onChange={(e) => setMaxFeatures(Number(e.target.value))} />
        </label>
        <div className="dialog-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary">Agregar</button>
        </div>
      </form>
    </div>
  );
}
