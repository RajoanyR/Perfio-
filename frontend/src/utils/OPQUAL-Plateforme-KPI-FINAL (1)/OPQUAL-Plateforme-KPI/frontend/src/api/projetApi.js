import { get, post, patch } from './client.js';

export const listerProjets = () => get('/projets');
export const lireProjet = (id) => get(`/projets/${id}`);
export const creerProjet = (dto) => post('/projets', dto);
export const modifierProjet = (id, dto) => patch(`/projets/${id}`, dto);
export const participantsProjet = (id) => get(`/projets/${id}/participants`);
export const ajouterParticipant = (id, dto) => post(`/projets/${id}/participants`, dto);
export const modifierParticipant = (id, idUtilisateur, dto) =>
  patch(`/projets/${id}/participants/${idUtilisateur}`, dto);
