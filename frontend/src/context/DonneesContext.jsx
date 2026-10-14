import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { listerProjets } from '../api/projetApi.js';
import { listerTaches } from '../api/tacheApi.js';
import { listerUtilisateurs } from '../api/utilisateurApi.js';
import { listerEquipes } from '../api/equipeApi.js';
import { listerRoles } from '../api/roleApi.js';

/**
 * Données de référence partagées par toutes les pages (projets, tâches, utilisateurs,
 * équipes, rôles). Le backend n'a pas d'endpoint de statistiques : les indicateurs sont
 * calculés dans le navigateur à partir de ces listes réelles.
 */
const DonneesContext = createContext(null);
export const useDonnees = () => useContext(DonneesContext);

export function DonneesProvider({ children }) {
  const { etat } = useAuth();
  const [d, setD] = useState({ projets: [], taches: [], utilisateurs: [], equipes: [], roles: [] });
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur('');
    try {
      const [projets, taches, utilisateurs, equipes, roles] = await Promise.all([
        listerProjets(),
        listerTaches(),
        listerUtilisateurs(),
        listerEquipes(),
        listerRoles().catch(() => []),
      ]);
      setD({ projets, taches, utilisateurs, equipes, roles });
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    if (etat === 'connecte') charger();
  }, [etat, charger]);

  const valeur = useMemo(() => {
    const parId = (liste, cle) => new Map(liste.map((x) => [x[cle], x]));
    return {
      ...d,
      chargement,
      erreur,
      recharger: charger,
      utilisateurParId: parId(d.utilisateurs, 'id_utilisateur'),
      equipeParId: parId(d.equipes, 'id_equipe'),
      projetParId: parId(d.projets, 'id_projet'),
      roleParId: parId(d.roles, 'id_role'),
    };
  }, [d, chargement, erreur, charger]);

  return <DonneesContext.Provider value={valeur}>{children}</DonneesContext.Provider>;
}
