import { useMemo, useState } from 'react';
import { useLayerStore } from '../../store/layerStore';
import { useUIStore } from '../../store/uiStore';
import type { FeatureCollection } from 'geojson';
import './AttributeTable.css';

export function AttributeTable() {
  const tableLayerId = useUIStore((s) => s.tableLayerId);
  const setTableLayerId = useUIStore((s) => s.setTableLayerId);
  const overlays = useLayerStore((s) => s.overlays);

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [filter, setFilter] = useState('');

  const layer = overlays.find((l) => l.id === tableLayerId);

  const { columns, rows } = useMemo(() => {
    if (!layer || layer.type !== 'geojson' || !layer.data) {
      return { columns: [], rows: [] };
    }
    const fc = layer.data as FeatureCollection;
    const features = fc.features ?? [];
    const colSet = new globalThis.Set<string>();
    features.forEach((f) => {
      Object.keys(f.properties ?? {}).forEach((k) => colSet.add(k));
    });
    const columns = [...colSet];
    const rows = features.map((f) => f.properties ?? {});
    return { columns, rows };
  }, [layer]);

  const filteredRows = useMemo(() => {
    const q = filter.toLowerCase();
    let r = q
      ? rows.filter((row) =>
          Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(q))
        )
      : rows;
    if (sortKey) {
      r = [...r].sort((a, b) => {
        const av = String(a[sortKey] ?? '');
        const bv = String(b[sortKey] ?? '');
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return r;
  }, [rows, filter, sortKey, sortAsc]);

  if (!tableLayerId) return null;

  const handleSort = (col: string) => {
    if (sortKey === col) {
      setSortAsc((a) => !a);
    } else {
      setSortKey(col);
      setSortAsc(true);
    }
  };

  const isUnsupported = !layer || layer.type !== 'geojson' || !layer.data;

  return (
    <div className="attr-table-panel">
      <div className="attr-table-header">
        <span className="attr-table-title">
          {layer?.title ?? 'Tabla de atributos'}
          {!isUnsupported && <span className="attr-table-count"> ({filteredRows.length}/{rows.length})</span>}
        </span>
        <div className="attr-table-actions">
          {!isUnsupported && (
            <input
              className="attr-table-filter"
              placeholder="Filtrar…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          )}
          <button className="attr-table-close" onClick={() => setTableLayerId(null)} title="Cerrar tabla">✕</button>
        </div>
      </div>

      {isUnsupported ? (
        <div className="attr-table-msg">
          Tabla no disponible para este tipo de capa
          {layer?.type === 'kml' ? ' (KML)' : ''}.
        </div>
      ) : columns.length === 0 ? (
        <div className="attr-table-msg">La capa no tiene atributos.</div>
      ) : (
        <div className="attr-table-scroll">
          <table className="attr-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className={sortKey === col ? 'attr-th--sorted' : ''}
                    title={col}
                  >
                    {col}
                    {sortKey === col && <span>{sortAsc ? ' ▲' : ' ▼'}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col} title={String(row[col] ?? '')}>
                      {String(row[col] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
