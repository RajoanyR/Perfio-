import { get, patch } from './client.js';

export const notificationsUtilisateur = (idUtilisateur) => get(`/notifications/utilisateur/${idUtilisateur}`);
export const marquerLue = (id) => patch(`/notifications/${id}/lire`);
export const marquerNonLue = (id) => patch(`/notifications/${id}/non-lire`);
