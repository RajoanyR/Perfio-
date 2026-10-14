import { useId, useState } from 'react';

// Graphiques SVG simples (sans bibliothèque) : anneau, barres, courbe.
export const COULEURS = ['#1d4ed8', '#12a67a', '#e8a317', '#e5484d', '#6b5bd6', '#0ea5c6', '#8a94b2'];

export function Anneau({ donnees, centre, sousCentre, taille = 170 }) {
  // donnees : [{ label, valeur, couleur }]
  const total = donnees.reduce((s, d) => s + d.valeur, 0);
  const r = 62;
  const c = 2 * Math.PI * r;
  let cumul = 0;
  return (
    <div className="anneau">
      <svg width={taille} height={taille} viewBox="0 0 160 160" role="img" aria-label="Répartition">
        <circle cx="80" cy="80" r={r} fill="none" stroke="var(--border)" strokeWidth="16" />
        {total > 0 &&
          donnees.map((d, i) => {
            const longueur = (d.valeur / total) * c;
            const el = (
              <circle
                key={d.label}
                cx="80"
                cy="80"
                r={r}
                fill="none"
                stroke={d.couleur || COULEURS[i % COULEURS.length]}
                strokeWidth="16"
                strokeDasharray={`${longueur} ${c - longueur}`}
                strokeDashoffset={-cumul}
                transform="rotate(-90 80 80)"
              />
            );
            cumul += longueur;
            return el;
          })}
        <text x="80" y="78" textAnchor="middle" className="anneau-valeur">
          {centre}
        </text>
        <text x="80" y="98" textAnchor="middle" className="anneau-label">
          {sousCentre}
        </text>
      </svg>
      <ul className="legende">
        {donnees.map((d, i) => (
          <li key={d.label}>
            <span className="puce" style={{ background: d.couleur || COULEURS[i % COULEURS.length] }} />
            <span className="legende-label">{d.label}</span>
            <span className="legende-valeur">
              {d.valeur}
              {total > 0 && <small> ({Math.round((d.valeur / total) * 100)} %)</small>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Barres({ donnees, hauteur = 190, unite = '', max }) {
  // donnees : [{ label, valeur, secondaire? }]
  const plafond = max || Math.max(1, ...donnees.map((d) => Math.max(d.valeur, d.secondaire || 0)));
  const L = 520;
  const H = hauteur;
  const bas = H - 28;
  const pas = L / Math.max(1, donnees.length);
  const largeur = Math.min(34, pas * 0.5);
  return (
    <svg viewBox={`0 0 ${L} ${H}`} className="graph" role="img" aria-label="Histogramme" preserveAspectRatio="xMidYMid meet">
      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <line x1="0" x2={L} y1={bas - t * (bas - 14)} y2={bas - t * (bas - 14)} stroke="var(--border)" strokeDasharray="3 4" />
          <text x="0" y={bas - t * (bas - 14) - 3} className="graph-axe">
            {Math.round(plafond * t * 10) / 10}
            {unite}
          </text>
        </g>
      ))}
      {donnees.map((d, i) => {
        const x = i * pas + pas / 2;
        const h = (d.valeur / plafond) * (bas - 14);
        return (
          <g key={d.label}>
            {d.secondaire !== undefined && (
              <rect x={x - largeur / 2} y={bas - (d.secondaire / plafond) * (bas - 14)} width={largeur} height={(d.secondaire / plafond) * (bas - 14)} rx="5" fill="var(--blue-100)" />
            )}
            <rect x={x - largeur / 2 + (d.secondaire !== undefined ? 0 : 0)} y={bas - h} width={largeur} height={Math.max(h, 0)} rx="5" fill="var(--blue-600)" fillOpacity={d.secondaire !== undefined ? 0.95 : 1}>
              <title>{`${d.label} : ${d.valeur}${unite}`}</title>
            </rect>
            <text x={x} y={H - 8} textAnchor="middle" className="graph-axe">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function Courbe({ points, hauteur = 260 }) {
  // points : [{ label, valeur (0..100) | null, detail? }]
  const [survol, setSurvol] = useState(null);
  const idGrad = `grad-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  const L = 640;
  const H = hauteur;
  const gauche = 42;
  const droite = 14;
  const haut = 26;
  const bas = H - 30;
  const valeurs = points.map((p) => p.valeur).filter((v) => v !== null && v !== undefined);
  const maxVal = valeurs.length ? Math.max(...valeurs) : 0;
  // Axe adapté aux valeurs (graduations entières) pour que les faibles taux restent lisibles.
  const plafond = maxVal <= 20 ? 20 : maxVal <= 40 ? 40 : maxVal <= 60 ? 60 : 100;
  const graduations = [0, 1, 2, 3, 4].map((k) => (plafond / 4) * k);

  const pas = (L - gauche - droite) / Math.max(1, points.length);
  const yDe = (v) => bas - (v / plafond) * (bas - haut);
  const xy = points.map((p, i) => ({
    ...p,
    i,
    x: gauche + i * pas + pas / 2,
    y: p.valeur === null || p.valeur === undefined ? null : yDe(p.valeur),
  }));
  const valides = xy.filter((p) => p.y !== null);
  const trace = valides.map((p, k) => `${k ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
  const aire = valides.length ? `${trace} L${valides[valides.length - 1].x},${bas} L${valides[0].x},${bas} Z` : '';
  const dernier = valides[valides.length - 1];
  const actif = survol !== null ? xy[survol] : null;

  if (!valides.length) {
    return <p className="muted" style={{ padding: '40px 0', textAlign: 'center' }}>Pas encore de données de réalisation pour cette année.</p>;
  }

  return (
    <svg viewBox={`0 0 ${L} ${H}`} className="graph" role="img" aria-label="Évolution du taux de réalisation par mois" onMouseLeave={() => setSurvol(null)}>
      <defs>
        <linearGradient id={idGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--blue-600)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--blue-600)" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {graduations.map((t) => (
        <g key={t}>
          <line x1={gauche} x2={L - droite} y1={yDe(t)} y2={yDe(t)} stroke="var(--border)" strokeDasharray={t === 0 ? '0' : '3 5'} />
          <text x={gauche - 8} y={yDe(t) + 4} textAnchor="end" className="graph-axe">
            {Math.round(t)} %
          </text>
        </g>
      ))}

      {aire && <path d={aire} fill={`url(#${idGrad})`} />}
      {trace && <path d={trace} fill="none" stroke="var(--blue-600)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />}

      {actif && (
        <line x1={actif.x} x2={actif.x} y1={haut - 6} y2={bas} stroke="var(--blue-500)" strokeOpacity="0.45" strokeDasharray="4 4" />
      )}

      {valides.map((p) => {
        const estDernier = dernier && p.i === dernier.i;
        const estSurvol = actif && actif.i === p.i;
        return (
          <g key={p.label}>
            <circle cx={p.x} cy={p.y} r={estDernier || estSurvol ? 6 : 4} fill={estDernier ? 'var(--blue-600)' : 'var(--surface)'} stroke="var(--blue-600)" strokeWidth="2.5" />
            {!estSurvol && (
              <text x={p.x} y={p.y - 11} textAnchor="middle" className={`graph-valeur ${estDernier ? 'graph-valeur-forte' : ''}`}>
                {Math.round(p.valeur)} %
              </text>
            )}
          </g>
        );
      })}

      {xy.map((p) => (
        <text key={p.label} x={p.x} y={H - 9} textAnchor="middle" className={`graph-axe ${p.y === null ? 'graph-axe-vide' : ''}`}>
          {p.label}
        </text>
      ))}

      {/* zones de survol (une par mois) */}
      {xy.map((p) => (
        <rect key={`z-${p.label}`} x={p.x - pas / 2} y={0} width={pas} height={H} fill="transparent" onMouseEnter={() => setSurvol(p.y === null ? null : p.i)} onClick={() => setSurvol(p.y === null ? null : p.i)} />
      ))}

      {actif && (() => {
        const w = 150;
        const tx = Math.min(Math.max(actif.x - w / 2, gauche), L - droite - w);
        const ty = actif.y - 62 < 2 ? actif.y + 14 : actif.y - 62;
        return (
          <g pointerEvents="none">
            <rect x={tx} y={ty} width={w} height="48" rx="8" fill="var(--navy-900)" opacity="0.96" />
            <text x={tx + 12} y={ty + 19} className="graph-tip-titre">{actif.label} : {Math.round(actif.valeur)} %</text>
            <text x={tx + 12} y={ty + 36} className="graph-tip-detail">{actif.detail || 'Taux de réalisation'}</text>
          </g>
        );
      })()}
    </svg>
  );
}

export function BarresHorizontales({ donnees, unite = '' }) {
  // donnees : [{ label, valeur (0..100) , detail }]
  return (
    <ul className="hbars">
      {donnees.map((d) => (
        <li key={d.label}>
          <div className="hbars-tete">
            <span>{d.label}</span>
            <span className="muted">{d.detail ?? `${Math.round(d.valeur)}${unite}`}</span>
          </div>
          <div className="progress">
            <div className="progress-bar" style={{ width: `${Math.min(100, d.valeur)}%`, ...(d.couleur ? { background: d.couleur } : {}) }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
