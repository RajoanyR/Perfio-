import { useEffect, useRef, useState } from 'react';
import { INACTIVITE_AVERTISSEMENT_MS, INACTIVITE_DELAI_SUPPLEMENTAIRE_MS } from '../config/valeurs.js';

const EVENEMENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

// Intervalle minimal entre deux « battements » vers le serveur tant que l'utilisateur est actif.
const BATTEMENT_MS = 2 * 60 * 1000;

/**
 * Après 6 min sans activité : avertissement. Une minute plus tard : déconnexion
 * (POST /auth/logout, qui ferme la session côté serveur).
 *
 * Le serveur applique aussi sa propre limite d'inactivité (SESSION_INACTIVITY_MINUTES,
 * 10 min par défaut) à partir de `session.derniere_activite`. Comme lire une page ou
 * bouger la souris n'appelle pas l'API, `battement` (une requête authentifiée légère)
 * est envoyé au plus toutes les 2 min d'activité pour que le serveur sache que la
 * personne travaille toujours.
 */
export function useInactivite(actif, surExpiration, battement) {
  const [avertissement, setAvertissement] = useState(false);
  const [secondes, setSecondes] = useState(Math.round(INACTIVITE_DELAI_SUPPLEMENTAIRE_MS / 1000));
  const minuteur = useRef(null);
  const avertiRef = useRef(false);
  const expirationRef = useRef(surExpiration);
  expirationRef.current = surExpiration;
  const battementRef = useRef(battement);
  battementRef.current = battement;
  const dernierBattement = useRef(Date.now());

  useEffect(() => {
    if (!actif) return undefined;
    let compte = null;

    const arreterCompte = () => {
      if (compte) clearInterval(compte);
      compte = null;
    };
    const battre = () => {
      if (Date.now() - dernierBattement.current < BATTEMENT_MS) return;
      dernierBattement.current = Date.now();
      Promise.resolve(battementRef.current?.()).catch(() => {}); // un 401 déclenche la déconnexion via le client HTTP
    };
    const reinitialiser = () => {
      if (avertiRef.current) return; // pendant l'avertissement, seul le bouton « Rester connecté » relance
      battre();
      clearTimeout(minuteur.current);
      minuteur.current = setTimeout(declencher, INACTIVITE_AVERTISSEMENT_MS);
    };
    function declencher() {
      avertiRef.current = true;
      setAvertissement(true);
      let restant = Math.round(INACTIVITE_DELAI_SUPPLEMENTAIRE_MS / 1000);
      setSecondes(restant);
      compte = setInterval(() => {
        restant -= 1;
        setSecondes(restant);
        if (restant <= 0) {
          arreterCompte();
          avertiRef.current = false;
          setAvertissement(false);
          expirationRef.current?.();
        }
      }, 1000);
    }

    EVENEMENTS.forEach((e) => window.addEventListener(e, reinitialiser, { passive: true }));
    minuteur.current = setTimeout(declencher, INACTIVITE_AVERTISSEMENT_MS);

    // Expose la relance manuelle
    window.__opqualResterConnecte = () => {
      arreterCompte();
      avertiRef.current = false;
      setAvertissement(false);
      dernierBattement.current = 0; // « Rester connecté » prévient toujours le serveur
      reinitialiser();
    };

    return () => {
      EVENEMENTS.forEach((e) => window.removeEventListener(e, reinitialiser));
      clearTimeout(minuteur.current);
      arreterCompte();
      avertiRef.current = false;
      setAvertissement(false);
      delete window.__opqualResterConnecte;
    };
  }, [actif]);

  return { avertissement, secondes, resterConnecte: () => window.__opqualResterConnecte?.() };
}
