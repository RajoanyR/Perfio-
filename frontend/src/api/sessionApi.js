import { get, patch } from './client.js';

export const sessionsUtilisateur = (idUtilisateur) => get(`/sessions/utilisateur/${idUtilisateur}`);
export const fermerSession = (idSession) => patch(`/sessions/${idSession}/fermer`);
