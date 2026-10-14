import { get, post, patch } from './client.js';

export const listerTaches = () => get('/taches');
export const lireTache = (id) => get(`/taches/${id}`);
export const creerTache = (dto) => post('/taches', dto);
export const modifierTache = (id, dto) => patch(`/taches/${id}`, dto);
export const changerEtatTache = (id, etat) => patch(`/taches/${id}/etat`, { etat });
export const terminerTache = (id) => patch(`/taches/${id}/terminer`);
export const transfererTache = (id, dto) => post(`/taches/${id}/transfert`, dto);
export const transfertsTache = (id) => get(`/taches/${id}/transferts`);

// Commentaires
export const commentairesTache = (id) => get(`/taches/${id}/commentaires`);
export const ajouterCommentaire = (id, dto) => post(`/taches/${id}/commentaires`, dto);
export const modifierCommentaire = (idCommentaire, dto) => patch(`/taches/commentaires/${idCommentaire}`, dto);

// Activités (temps passé)
export const activitesTache = (id) => get(`/taches/${id}/activites`);
export const ajouterActivite = (id, dto) => post(`/taches/${id}/activites`, dto);

// Historique (écrit automatiquement par le serveur : lecture seule côté frontend)
export const historiqueTache = (id) => get(`/taches/${id}/historique`);

// Pièces jointes (le backend enregistre uniquement les métadonnées : nom, chemin, type, taille)
export const piecesJointesTache = (id) => get(`/taches/${id}/pieces-jointes`);
export const ajouterPieceJointe = (id, dto) => post(`/taches/${id}/pieces-jointes`, dto);
