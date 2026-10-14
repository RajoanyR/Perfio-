import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  CLE_SESSION,
  definirGestionnaire401,
  ecrireSession,
  effacerSession,
  lireSession,
} from '../api/client.js';
import { login as apiLogin, logout as apiLogout } from '../api/authApi.js';
import { lireUtilisateur } from '../api/utilisateurApi.js';
import { lireRole, permissionsDuRole } from '../api/roleApi.js';
import { droits } from '../utils/access.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Charge l'utilisateur, son rôle et ses permissions à partir de l'id renvoyé par le login.
async function chargerProfil(idUtilisateur, idRole) {
  const utilisateur = await lireUtilisateur(idUtilisateur);
  const [role, liens] = await Promise.all([
    lireRole(idRole ?? utilisateur.id_role).catch(() => null),
    permissionsDuRole(idRole ?? utilisateur.id_role).catch(() => []),
  ]);
  // GET /roles/:id/permissions : on garde les codes si la réponse les contient
  const permissions = (liens || [])
    .map((l) => l?.permission?.code_permission ?? l?.code_permission)
    .filter(Boolean);
  return { utilisateur, role, permissions };
}

export function AuthProvider({ children }) {
  const [etat, setEtat] = useState('chargement'); // chargement | connecte | deconnecte
  const [utilisateur, setUtilisateur] = useState(null);
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [messageSession, setMessageSession] = useState('');

  const vider = useCallback((message = '') => {
    effacerSession();
    setUtilisateur(null);
    setRole(null);
    setPermissions([]);
    setMessageSession(message);
    setEtat('deconnecte');
  }, []);

  // 401 reçu depuis n'importe quel appel API → session expirée
  useEffect(() => {
    definirGestionnaire401(() => vider('Votre session a expiré. Veuillez vous reconnecter.'));
  }, [vider]);

  // Restauration de la session au chargement de la page
  useEffect(() => {
    const session = lireSession();
    if (!session?.token) {
      setEtat('deconnecte');
      return;
    }
    chargerProfil(session.id_utilisateur, session.id_role)
      .then((p) => {
        setUtilisateur(p.utilisateur);
        setRole(p.role);
        setPermissions(p.permissions);
        setEtat('connecte');
      })
      .catch(() => vider('')); // un 401 a déjà appelé vider() avec le bon message
  }, [vider]);

  // Déconnexion dans un autre onglet : la session est effacée du localStorage → on se déconnecte ici aussi.
  useEffect(() => {
    const surStockage = (e) => {
      if (e.key === CLE_SESSION && !e.newValue) vider('');
    };
    window.addEventListener('storage', surStockage);
    return () => window.removeEventListener('storage', surStockage);
  }, [vider]);

  const connecter = useCallback(async (email, motDePasse) => {
    const rep = await apiLogin(email, motDePasse);
    const token = rep.access_token || rep.token;
    ecrireSession({
      token,
      id_session: rep.id_session,
      id_utilisateur: rep.id_utilisateur,
      id_role: rep.id_role,
    });
    try {
      const p = await chargerProfil(rep.id_utilisateur, rep.id_role);
      setUtilisateur(p.utilisateur);
      setRole(p.role);
      setPermissions(p.permissions);
      setMessageSession('');
      setEtat('connecte');
    } catch (e) {
      effacerSession();
      throw e;
    }
  }, []);

  const deconnecter = useCallback(
    async (message = '') => {
      const session = lireSession();
      let avertissement = message;
      try {
        if (session?.token) await apiLogout();
      } catch (e) {
        // 401 = session déjà fermée côté serveur (OK). Autre erreur (réseau, 5xx) :
        // on nettoie quand même l'écran, mais on prévient que le serveur n'a pas confirmé.
        if (e?.status !== 401) {
          avertissement =
            "Vous avez été déconnecté de cet appareil, mais le serveur n'a pas confirmé la fermeture de la session.";
        }
      }
      vider(avertissement);
    },
    [vider],
  );

  const rafraichirUtilisateur = useCallback(async () => {
    const session = lireSession();
    if (!session) return;
    setUtilisateur(await lireUtilisateur(session.id_utilisateur));
  }, []);

  const valeur = useMemo(
    () => ({
      etat,
      utilisateur,
      role,
      permissions,
      droits: droits(role),
      messageSession,
      connecter,
      deconnecter,
      rafraichirUtilisateur,
      idSession: lireSession()?.id_session,
    }),
    [etat, utilisateur, role, permissions, messageSession, connecter, deconnecter, rafraichirUtilisateur],
  );

  return <AuthContext.Provider value={valeur}>{children}</AuthContext.Provider>;
}
