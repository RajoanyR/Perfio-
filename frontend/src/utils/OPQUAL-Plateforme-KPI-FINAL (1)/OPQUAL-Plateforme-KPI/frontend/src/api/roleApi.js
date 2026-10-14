import { get, post, patch, supprimer } from './client.js';

export const listerRoles = () => get('/roles');
export const lireRole = (id) => get(`/roles/${id}`);
export const creerRole = (dto) => post('/roles', dto);
export const modifierRole = (id, dto) => patch(`/roles/${id}`, dto);

export const listerPermissions = () => get('/permissions');
export const creerPermission = (dto) => post('/permissions', dto);
export const modifierPermission = (id, dto) => patch(`/permissions/${id}`, dto);

// Liaison rôle ↔ permission
export const permissionsDuRole = (idRole) => get(`/roles/${idRole}/permissions`);
export const ajouterPermissionAuRole = (idRole, id_permission) => post(`/roles/${idRole}/permissions`, { id_permission });
export const retirerPermissionDuRole = (idRole, idPermission) => supprimer(`/roles/${idRole}/permissions/${idPermission}`);
