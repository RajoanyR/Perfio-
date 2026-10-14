import { get, post, patch } from './client.js';

export const listerEquipes = () => get('/equipes');
export const lireEquipe = (id) => get(`/equipes/${id}`);
export const membresEquipe = (id) => get(`/equipes/${id}/utilisateurs`);
export const creerEquipe = (dto) => post('/equipes', dto);
export const modifierEquipe = (id, dto) => patch(`/equipes/${id}`, dto);
