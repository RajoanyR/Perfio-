// Une couleur distincte par état et par priorité (badges, graphiques).
export const COULEUR_ETAT = {
  A_FAIRE: '#64748b', // gris ardoise
  EN_COURS: '#2563eb', // bleu
  TERMINE: '#16a34a', // vert
  PLANIFIE: '#7c3aed', // violet
  SUSPENDU: '#ca8a04', // jaune moutarde
  BLOQUE: '#dc2626', // rouge
  ANNULE: '#be185d', // rose foncé
};

export const COULEUR_PRIORITE = {
  BASSE: '#0891b2', // turquoise
  NORMALE: '#4f46e5', // indigo
  HAUTE: '#ea580c', // orange
  URGENTE: '#dc2626', // rouge
};

/** Couleur d'une valeur d'état ou de priorité, ou null si la valeur n'en a pas. */
export const couleurValeur = (v) => COULEUR_ETAT[v] || COULEUR_PRIORITE[v] || null;
