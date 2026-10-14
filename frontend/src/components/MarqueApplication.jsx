import { NOM_APPLICATION } from '../config/app.js';

// Mot de marque : tout en blanc sauf les deux dernières lettres (ex. PERF + IO), précédé de trois barres.
// La taille se règle avec font-size sur le parent (tout est en « em »).
const coupeNom = (nom) => (nom.length > 3 ? [nom.slice(0, -2), nom.slice(-2)] : ['', nom]);

export default function MarqueApplication({ className = '' }) {
  const [debut, fin] = coupeNom(NOM_APPLICATION);
  return (
    <span className={`marque ${className}`}>
      <span className="marque-barres" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="marque-nom">
        {debut}
        <em>{fin}</em>
      </span>
    </span>
  );
}
