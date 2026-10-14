import { get, post } from './client.js';

// Le backend enregistre une ligne « rapport » (type, format, période, chemin) ;
// il ne génère pas de fichier PDF/CSV.
export const listerRapports = () => get('/rapports');
export const rapportsUtilisateur = (idUtilisateur) => get(`/rapports/utilisateur/${idUtilisateur}`);
export const enregistrerRapport = (dto) => post('/rapports', dto);
