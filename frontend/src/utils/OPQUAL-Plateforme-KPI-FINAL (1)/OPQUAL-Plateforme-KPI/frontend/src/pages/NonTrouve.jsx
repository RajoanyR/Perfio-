import { Link } from 'react-router-dom';
import { EtatVide } from '../components/ui.jsx';

export default function NonTrouve() {
  return <EtatVide titre="Page introuvable" texte="Cette page n'existe pas." action={<Link to="/dashboard" className="btn btn-primary">Retour au tableau de bord</Link>} />;
}
