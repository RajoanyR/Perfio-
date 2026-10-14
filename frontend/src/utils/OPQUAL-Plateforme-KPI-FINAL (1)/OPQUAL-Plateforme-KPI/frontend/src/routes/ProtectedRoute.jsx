import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Chargement, EtatVide } from '../components/ui.jsx';

/**
 * Sans authentification → /login.
 * Avec la prop `admin` : réservé au rôle administrateur (confort d'affichage, voir utils/access.js).
 */
export default function ProtectedRoute({ admin = false }) {
  const { etat, droits } = useAuth();
  const lieu = useLocation();

  if (etat === 'chargement') {
    return (
      <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <Chargement texte="Ouverture de la session…" />
      </div>
    );
  }
  if (etat !== 'connecte') return <Navigate to="/login" replace state={{ depuis: lieu.pathname }} />;
  if (admin && !droits.peutAdministrer) {
    return <EtatVide titre="Accès réservé" texte="Cette page est réservée aux administrateurs." />;
  }
  return <Outlet />;
}
