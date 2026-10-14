import Icon from './Icon.jsx';
import { PERIODES } from '../utils/stats.js';
import { formatDate } from '../utils/format.js';

export default function PeriodeBarre({ periode }) {
  const { type, setType, decaler, plage, perso, setPerso } = periode;
  return (
    <div className="ligne">
      {type !== 'perso' && (
        <div className="ligne" style={{ gap: 2 }}>
          <button type="button" className="icon-btn" onClick={() => decaler(-1)} aria-label="Période précédente">
            <Icon name="chevron-left" size={18} />
          </button>
          <button type="button" className="icon-btn" onClick={() => decaler(1)} aria-label="Période suivante">
            <Icon name="chevron-right" size={18} />
          </button>
        </div>
      )}
      <div className="segments" role="tablist" aria-label="Période">
        {PERIODES.map((p) => (
          <button key={p.id} type="button" role="tab" aria-selected={type === p.id} className={`segment ${type === p.id ? 'actif' : ''}`} onClick={() => setType(p.id)}>
            {p.label}
          </button>
        ))}
      </div>
      {type === 'perso' ? (
        <div className="ligne" style={{ gap: 6 }}>
          <input type="date" aria-label="Date de début" value={perso.debut} onChange={(e) => setPerso({ ...perso, debut: e.target.value })} style={{ width: 150 }} />
          <span className="muted">au</span>
          <input type="date" aria-label="Date de fin" value={perso.fin} onChange={(e) => setPerso({ ...perso, fin: e.target.value })} style={{ width: 150 }} />
        </div>
      ) : (
        <span className="muted" style={{ fontSize: 13 }}>
          <Icon name="calendar" size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
          {plage.debut.toLocaleDateString('fr-FR')} – {plage.fin.toLocaleDateString('fr-FR')}
        </span>
      )}
    </div>
  );
}
