import type { PopupInfo } from '../../hooks/useFeaturePopup';
import './FeaturePopup.css';

interface Props {
  info: PopupInfo;
  onClose: () => void;
}

export function FeaturePopup({ info, onClose }: Props) {
  const entries = Object.entries(info.properties).filter(
    ([, v]) => v !== null && v !== undefined && v !== ''
  );

  const style: React.CSSProperties = {
    left: `${info.pixel[0] + 12}px`,
    top: `${info.pixel[1] - 12}px`,
  };

  return (
    <div className="feature-popup" style={style}>
      <div className="feature-popup__header">
        <span className="feature-popup__title">{info.layerTitle}</span>
        <button className="feature-popup__close" onClick={onClose} title="Cerrar">✕</button>
      </div>
      <div className="feature-popup__body">
        {entries.length === 0 ? (
          <span className="feature-popup__empty">Sin atributos</span>
        ) : (
          <table className="feature-popup__table">
            <tbody>
              {entries.map(([k, v]) => (
                <tr key={k}>
                  <th>{k}</th>
                  <td>{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
