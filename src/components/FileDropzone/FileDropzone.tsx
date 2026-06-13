import { useState, useCallback } from 'react';
import type { DragEvent } from 'react';
import { useLayerStore } from '../../store/layerStore';
import { loadLayerFile } from '../../utils/fileLoaders';
import './FileDropzone.css';

export function FileDropzone({ children }: { children: React.ReactNode }) {
  const addOverlay = useLayerStore((s) => s.addOverlay);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        try {
          const cfg = await loadLayerFile(file);
          addOverlay(cfg);
        } catch {
          // Silently skip unsupported files dropped accidentally
        }
      }
    },
    [addOverlay]
  );

  return (
    <div
      className={`dropzone-host${dragging ? ' dropzone-active' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      {children}
      {dragging && (
        <div className="dropzone-overlay">
          <div className="dropzone-hint">Suelta tu archivo GeoJSON o KML aquí</div>
        </div>
      )}
    </div>
  );
}
