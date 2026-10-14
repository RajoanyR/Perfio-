import { get, patch } from './client.js';

export const lireEntreprise = (id) => get(`/entreprises/${id}`);
export const modifierEntreprise = (id, dto) => patch(`/entreprises/${id}`, dto);
