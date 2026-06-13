import { useLayerStore } from '../../store/layerStore';
import './LayerPanel.css';

export function LayerPanel() {
  const { baseMapId, baseMaps, overlays, setBaseMap, toggleOverlay, removeOverlay, setOpacity } =
    useLayerStore();

  return (
    <aside className="layer-panel">
      <h2 className="panel-title">Capas</h2>

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

      {overlays.length > 0 && (
        <section className="panel-section">
          <h3 className="section-heading">Capas adicionales</h3>
          {[...overlays].reverse().map((layer) => (
            <div key={layer.id} className="overlay-row">
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
              <div className="overlay-controls">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={layer.opacity}
                  title="Opacidad"
                  onChange={(e) => setOpacity(layer.id, Number(e.target.value))}
                  className="opacity-slider"
                />
                <button
                  className="remove-btn"
                  title="Eliminar capa"
                  onClick={() => removeOverlay(layer.id)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </section>
      )}
    </aside>
  );
}
