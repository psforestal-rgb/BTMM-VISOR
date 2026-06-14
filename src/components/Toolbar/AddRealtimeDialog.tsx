import { useState } from 'react';
import type { RealtimeLayerConfig } from '../../types/layer';

interface Props {
  onAdd: (cfg: RealtimeLayerConfig) => void;
  onClose: () => void;
}

export function AddRealtimeDialog({ onAdd, onClose }: Props) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [protocol, setProtocol] = useState<'ws' | 'http'>('http');
  const [intervalMs, setIntervalMs] = useState(30000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    onAdd({
      id: crypto.randomUUID(),
      title: title || 'Capa tiempo real',
      type: 'realtime',
      url,
      protocol,
      intervalMs,
      visible: true,
      opacity: 1,
      zIndex: 20,
    });
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <form className="dialog" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3>Agregar capa en tiempo real</h3>
        <label>
          URL *
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="wss://... o https://..." required />
        </label>
        <label>
          Título
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Capa en vivo" />
        </label>
        <label>
          Protocolo
          <select value={protocol} onChange={(e) => setProtocol(e.target.value as 'ws' | 'http')}>
            <option value="http">HTTP (polling)</option>
            <option value="ws">WebSocket</option>
          </select>
        </label>
        {protocol === 'http' && (
          <label>
            Intervalo de actualización (ms)
            <input type="number" value={intervalMs} min={1000} step={1000} onChange={(e) => setIntervalMs(Number(e.target.value))} />
          </label>
        )}
        <div className="dialog-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary">Agregar</button>
        </div>
      </form>
    </div>
  );
}
