/** États de tâche utilisés par l'application (contrainte CHECK côté PostgreSQL). */
export const TACHE_ETATS = ['A_FAIRE', 'EN_COURS', 'TERMINE'] as const;
export type TacheEtat = (typeof TACHE_ETATS)[number];

export const LIBELLES_ETAT: Record<string, string> = {
  A_FAIRE: 'À faire',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
};
