import { useId } from 'react';
import { DEVISE, NOM_ENTREPRISE } from '../config/app.js';

// Logo GROUPE OPQUAL redessiné en vectoriel : net à toutes les tailles (l'ancienne image faisait 108 px de large).
// couleur : 'blanc' (sur fond foncé) ou 'bleu' (sur fond clair). devise : affiche « ŒUVRONS POUR LA QUALITÉ » dessous.
const POLICE = "'Montserrat', 'Poppins', 'Segoe UI', 'Arial Black', Arial, sans-serif";

export default function LogoGroupe({ couleur = 'blanc', largeur = '8em', devise = false, className = '' }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const blanc = couleur === 'blanc';
  const [h1, h2, h3] = blanc ? ['#ffffff', '#eef3ff', '#b4c4ee'] : ['#16398f', '#0e2a75', '#081c5c'];
  const arc = blanc ? '#ffffff' : '#1346c9';
  const vif = blanc ? '#3b8dff' : '#1f6bff'; // pixels « bleu vif »
  const clair = blanc ? '#ffffff' : '#0e2a75'; // pixels « blanc » (ou marine sur fond clair)

  return (
    <span className={`logo-groupe ${className}`} style={{ width: largeur }}>
      <svg viewBox="0 0 648 790" role="img" aria-label={NOM_ENTREPRISE} focusable="false">
        <defs>
          <linearGradient id={`t${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={h1} />
            <stop offset="0.55" stopColor={h2} />
            <stop offset="1" stopColor={h3} />
          </linearGradient>
          <linearGradient id={`a${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={arc} stopOpacity="1" />
            <stop offset="1" stopColor={arc} stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {/* Anneau : trois croissants (arc extérieur gauche, arc extérieur droit, arc intérieur) */}
        <g fill={`url(#a${id})`}>
          <path d="M320.6 92.1 A154 154 0 0 0 178 288.4 A205 205 0 0 1 320.6 92.1 Z" />
          <path d="M469.8 190.8 A154 154 0 0 1 391.1 385.6 A210 210 0 0 0 469.8 190.8 Z" />
          <path d="M230.1 250.2 A100 100 0 0 0 349.1 343.2 A140 140 0 0 1 230.1 250.2 Z" opacity="0.9" />
        </g>

        {/* Pixels */}
        <g>
          <rect x="358" y="66" width="24" height="24" fill={clair} opacity="0.95" />
          <rect x="395" y="83" width="38" height="38" fill={vif} />
          <rect x="342" y="108" width="36" height="34" fill={vif} opacity="0.5" />
          <rect x="388" y="138" width="40" height="40" fill={clair} />
          <rect x="420" y="42" width="26" height="24" fill={vif} opacity="0.7" />
          <rect x="453" y="63" width="30" height="30" fill={vif} />
          <rect x="470" y="25" width="18" height="17" fill={clair} opacity="0.9" />
          <rect x="438" y="138" width="24" height="22" fill={vif} opacity="0.55" />
        </g>

        {/* Nom */}
        <g fill={`url(#t${id})`} fontFamily={POLICE} fontWeight="800">
          <text x="38" y="588" fontSize="136" textLength="577" lengthAdjust="spacingAndGlyphs">GROUPE</text>
          <text x="38" y="745" fontSize="136" textLength="577" lengthAdjust="spacingAndGlyphs">OPQUAL</text>
        </g>
      </svg>
      {devise && <span className={`logo-devise logo-devise-${couleur}`}>{DEVISE}</span>}
    </span>
  );
}
