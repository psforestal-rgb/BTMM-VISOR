import { useRef, useState } from 'react';
import { useLayerStore } from '../../store/layerStore';
import { useUIStore } from '../../store/uiStore';
import { DEFAULT_LAYER_STYLE } from '../../types/layer';
import type { LayerConfig, VectorLayerConfig } from '../../types/layer';
import './LayerPanel.css';

function isVector(l: LayerConfig): l is VectorLayerConfig {
  return l.type === 'geojson' || l.type === 'kml' || l.type === 'realtime';
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function LayerPanel({ open, onClose }: Props) {
  const {
    baseMapId, baseMaps, labelsVisible,
    overlays, setBaseMap, toggleLabels,
    toggleOverlay, removeOverlay, setOpacity,
    updateLayerStyle, zoomToLayer, reorderOverlays,
  } = useLayerStore();

  const { tableLayerId, setTableLayerId } = useUIStore();

  const [styleOpen, setStyleOpen] = useState<string | null>(null);

  const toggleStyle = (id: string) =>
    setStyleOpen((prev) => (prev === id ? null : id));

  // Drag-and-drop state (operates on display indices)
  const dragIndexRef = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  // Display order is reversed (newest on top)
  const displayOverlays = [...overlays].reverse();
  const n = overlays.length;

  const handleDragStart = (di: number) => { dragIndexRef.current = di; };
  const handleDragEnd = () => { dragIndexRef.current = null; setDragOver(null); };
  const handleDragOver = (e: React.DragEvent, di: number) => {
    e.preventDefault();
    setDragOver(di);
  };
  const handleDrop = (di: number) => {
    const from = dragIndexRef.current;
    if (from === null || from === di) { handleDragEnd(); return; }
    // Convert display indices to store indices
    const storeFrom = n - 1 - from;
    const storeTo = n - 1 - di;
    reorderOverlays(storeFrom, storeTo);
    handleDragEnd();
  };

  return (
    <aside className={`layer-panel${open ? '' : ' layer-panel--closed'}`}>
      <h2 className="panel-title">
        Capas
        <button className="panel-close-btn" onClick={onClose} title="Ocultar panel">✕</button>
      </h2>

      {/* ── Base maps ─────────────────────────────────────── */}
      <section className="panel-section">
        <h3 className="section-heading">Mapa base</h3>
        {baseMaps.map((bm) => (
          <label key={bm.id} className="radio-row">
            <input
              type="radio"
              name="baseMap"
              value={bm.id}
              checked={baseMapId === bm.id}
              onChange={() => setBaseMap(bm.id)}
            />
            {bm.title}
          </label>
        ))}
      </section>

      {/* ── Labels overlay ────────────────────────────────── */}
      <section className="panel-section">
        <h3 className="section-heading">Superposición</h3>
        <label className="checkbox-row">
          <input type="checkbox" checked={labelsVisible} onChange={toggleLabels} />
          Etiquetas
        </label>
      </section>

      {/* ── User overlays ─────────────────────────────────── */}
      {displayOverlays.length > 0 && (
        <section className="panel-section">
          <h3 className="section-heading">Capas cargadas</h3>
          {displayOverlays.map((layer, di) => {
            const vec = isVector(layer) ? (layer as VectorLayerConfig) : null;
            const style = { ...DEFAULT_LAYER_STYLE, ...(vec?.layerStyle ?? {}) };
            const styleIsOpen = styleOpen === layer.id;
            const isTable = tableLayerId === layer.id;
            const isGeoJSON = layer.type === 'geojson';

            return (
              <div
                key={layer.id}
                className={`overlay-item${dragOver === di ? ' overlay-item--drag-over' : ''}`}
                draggable
                onDragStart={() => handleDragStart(di)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, di)}
                onDrop={() => handleDrop(di)}
              >
                {/* Row 1: drag handle + visibility + title + actions */}
                <div className="overlay-row">
                  <span className="drag-handle" title="Arrastrar para reordenar">⠿</span>
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={layer.visible}
                      onChange={() => toggleOverlay(layer.id)}
                    />
                    <span className="layer-title" title={layer.title}>
                      {layer.title}
                    </span>
                  </label>
                  <div className="overlay-actions">
                    <button
                      className="icon-btn"
                      title="Zoom a la capa"
                      onClick={() => zoomToLayer(layer.id)}
                    >⊕</button>
                    {isGeoJSON && (
                      <button
                        className={`icon-btn${isTable ? ' icon-btn--active' : ''}`}
                        title="Tabla de atributos"
                        onClick={() => setTableLayerId(isTable ? null : layer.id)}
                      >≡</button>
                    )}
                    {vec && (
                      <button
                        className={`icon-btn${styleIsOpen ? ' icon-btn--active' : ''}`}
                        title="Simbología"
                        onClick={() => toggleStyle(layer.id)}
                      >🎨</button>
                    )}
                    <button
                      className="icon-btn icon-btn--danger"
                      title="Eliminar capa"
                      onClick={() => {
                        removeOverlay(layer.id);
                        if (styleIsOpen) setStyleOpen(null);
                        if (isTable) setTableLayerId(null);
                      }}
                    >✕</button>
                  </div>
                </div>

                {/* Row 2: opacity */}
                <div className="opacity-row">
                  <span className="opacity-label">Opacidad</span>
                  <input
                    type="range" min={0} max={1} step={0.05}
                    value={layer.opacity}
                    onChange={(e) => setOpacity(layer.id, Number(e.target.value))}
                    className="opacity-slider"
                  />
                </div>

                {/* Row 3: symbology panel */}
                {vec && styleIsOpen && (
                  <div className="style-panel">
                    <div className="style-row">
                      <label className="style-label">Relleno</label>
                      <input
                        type="color" value={style.fillColor}
                        onChange={(e) => updateLayerStyle(layer.id, { fillColor: e.target.value })}
                        className="color-input"
                        title="Color de relleno"
                      />
                      <input
                        type="range" min={0} max={1} step={0.05}
                        value={style.fillOpacity}
                        onChange={(e) => updateLayerStyle(layer.id, { fillOpacity: Number(e.target.value) })}
                        className="mini-slider"
                        title="Opacidad del relleno"
                      />
                    </div>
                    <div className="style-row">
                      <label className="style-label">Borde</label>
                      <input
                        type="color" value={style.strokeColor}
                        onChange={(e) => updateLayerStyle(layer.id, { strokeColor: e.target.value })}
                        className="color-input"
                        title="Color de borde"
                      />
                      <input
                        type="number" min={0.5} max={10} step={0.5}
                        value={style.strokeWidth}
                        onChange={(e) => updateLayerStyle(layer.id, { strokeWidth: Number(e.target.value) })}
                        className="num-input"
                        title="Ancho de borde (px)"
                      />
                      <span className="style-unit">px</span>
                    </div>
                    <div className="style-row">
                      <label className="style-label">Punto</label>
                      <input
                        type="number" min={1} max={20} step={1}
                        value={style.pointRadius}
                        onChange={(e) => updateLayerStyle(layer.id, { pointRadius: Number(e.target.value) })}
                        className="num-input"
                        title="Radio del punto (px)"
                      />
                      <span className="style-unit">px</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}
    </aside>
  );
}
