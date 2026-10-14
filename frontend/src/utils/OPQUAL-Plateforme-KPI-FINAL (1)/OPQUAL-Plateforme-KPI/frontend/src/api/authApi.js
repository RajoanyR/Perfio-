import { requete } from './client.js';

// POST /auth/login  { email, mot_de_passe }
// → { message, access_token, token, id_session, id_utilisateur, id_role, id_equipe }
export const login = (email, mot_de_passe) =>
  requete('POST', '/auth/login', { corps: { email, mot_de_passe }, public: true });

// POST /auth/logout (aucun corps) : le serveur ferme la session du token envoyé.
// ignore401 : un 401 ici signifie « session déjà fermée », pas une erreur à afficher.
export const logout = () => requete('POST', '/auth/logout', { ignore401: true });
