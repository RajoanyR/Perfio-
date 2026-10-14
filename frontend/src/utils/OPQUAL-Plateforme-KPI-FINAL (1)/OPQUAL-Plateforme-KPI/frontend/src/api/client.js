import { API_URL } from '../config/api.js';

export const CLE_SESSION = 'opqual_session';

/** Session stockée dans le navigateur : { token, id_session, id_utilisateur } */
export function lireSession() {
  try {
    return JSON.parse(localStorage.getItem(CLE_SESSION)) || null;
  } catch {
    return null;
  }
}
export function ecrireSession(session) {
  localStorage.setItem(CLE_SESSION, JSON.stringify(session));
}
export function effacerSession() {
  localStorage.removeItem(CLE_SESSION);
}

// Fonction appelée quand le backend répond 401 (session expirée ou invalide).
let surNonAutorise = null;
export function definirGestionnaire401(fn) {
  surNonAutorise = fn;
}

/** Erreur lisible renvoyée par toutes les fonctions api/*.js */
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const MESSAGES_PAR_DEFAUT = {
  400: 'Les données envoyées sont invalides.',
  401: 'Votre session a expiré. Veuillez vous reconnecter.',
  403: "Vous n'avez pas l'autorisation d'effectuer cette action.",
  404: 'Élément introuvable.',
  409: 'Cet élément existe déjà.',
  422: 'Les données envoyées ne sont pas valides.',
  500: 'Une erreur serveur est survenue. Réessayez plus tard.',
};

function construireMessage(status, data) {
  // NestJS renvoie { statusCode, message, error } ; message peut être une liste (validation).
  const brut = data && data.message;
  if (Array.isArray(brut) && brut.length) return brut.join(' · ');
  if (typeof brut === 'string' && brut.trim()) return brut;
  return MESSAGES_PAR_DEFAUT[status] || 'Une erreur est survenue.';
}

/**
 * Point d'entrée unique vers l'API. Il :
 * 1. ajoute automatiquement « Authorization: Bearer <token> »
 * 2. convertit les erreurs HTTP en ApiError avec un message compréhensible
 * 3. détecte les 401 et déclenche la déconnexion (retour sur /login)
 */
export async function requete(
  methode,
  chemin,
  { corps, params, public: estPublic = false, ignore401 = false } = {},
) {
  const url = new URL(API_URL + chemin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
  }

  const entetes = { Accept: 'application/json' };
  if (corps !== undefined) entetes['Content-Type'] = 'application/json';
  const session = lireSession();
  if (!estPublic && session?.token) entetes.Authorization = `Bearer ${session.token}`;

  let reponse;
  try {
    reponse = await fetch(url, {
      method: methode,
      headers: entetes,
      body: corps !== undefined ? JSON.stringify(corps) : undefined,
    });
  } catch {
    throw new ApiError('Impossible de joindre le serveur. Vérifiez que le backend est lancé.', 0);
  }

  let donnees = null;
  const texte = await reponse.text();
  if (texte) {
    try {
      donnees = JSON.parse(texte);
    } catch {
      donnees = null;
    }
  }

  if (!reponse.ok) {
    if (reponse.status === 401 && !estPublic && !ignore401 && surNonAutorise) surNonAutorise();
    throw new ApiError(construireMessage(reponse.status, donnees), reponse.status, donnees);
  }
  return donnees;
}

export const get = (chemin, params) => requete('GET', chemin, { params });
export const post = (chemin, corps) => requete('POST', chemin, { corps });
export const patch = (chemin, corps) => requete('PATCH', chemin, { corps: corps ?? {} });
export const supprimer = (chemin) => requete('DELETE', chemin);
