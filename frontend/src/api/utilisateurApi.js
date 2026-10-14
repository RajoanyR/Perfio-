import { get, post, patch } from './client.js';

export const listerUtilisateurs = () => get('/utilisateurs');
export const lireUtilisateur = (id) => get(`/utilisateurs/${id}`);
export const creerUtilisateur = (dto) => post('/utilisateurs', dto);
export const modifierUtilisateur = (id, dto) => patch(`/utilisateurs/${id}`, dto);
export const desactiverUtilisateur = (id) => patch(`/utilisateurs/${id}/desactiver`);
export const activerUtilisateur = (id) => patch(`/utilisateurs/${id}/activer`);
