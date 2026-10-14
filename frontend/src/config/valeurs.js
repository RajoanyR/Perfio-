/**
 * Valeurs métier utilisées par les listes déroulantes et les filtres.
 *
 * IMPORTANT : le backend ne déclare pas ces valeurs dans le code (colonnes VarChar
 * avec contraintes CHECK dans PostgreSQL). Seules les valeurs marquées [confirmé]
 * apparaissent dans le code ou la documentation du backend. Les autres sont des
 * propositions : vérifiez-les avec les contraintes CHECK de votre base
 * (ex. dans psql : \d construct.tache) et corrigez ce fichier si besoin.
 * Si une valeur est refusée par la base, le backend répond « 500 erreur serveur ».
 *
 * Les valeurs réellement présentes dans les données sont de toute façon ajoutées
 * automatiquement aux filtres et aux formulaires (voir utils/format.js → optionsAvec).
 */

// Tâche
export const TACHE_ETATS = ['A_FAIRE', 'EN_COURS', 'TERMINE']; // A_FAIRE [confirmé: défaut], EN_COURS [confirmé: guide Postman], TERMINE [confirmé: logique métier]
export const ETAT_TERMINE = 'TERMINE';
export const PRIORITES = ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE']; // NORMALE [confirmé: défaut] — les autres sont à vérifier

// Projet
export const PROJET_ETATS = ['PLANIFIE', 'EN_COURS', 'TERMINE']; // PLANIFIE [confirmé: défaut] — les autres sont à vérifier
export const PROJET_STATUTS = ['ACTIF', 'INACTIF']; // ACTIF [confirmé: défaut]

// Équipe — confirmé par le DTO (@IsIn)
export const EQUIPE_STATUTS = ['ACTIVE', 'INACTIVE', 'ARCHIVEE'];

// Utilisateur — ACTIF [confirmé: défaut et contrôle au login], INACTIF [confirmé: route /desactiver]
export const UTILISATEUR_STATUTS = ['ACTIF', 'INACTIF'];

// Participation projet
export const PARTICIPATION_STATUTS = ['ACTIF', 'RETIRE']; // confirmé par la contrainte ck_participation_projet_1

// Thème enregistré dans utilisateur.theme — 'clair' [confirmé: défaut], 'sombre' à vérifier
export const THEME_CLAIR = 'clair';
export const THEME_SOMBRE = 'sombre';

// Comportement du frontend
export const INACTIVITE_AVERTISSEMENT_MS = 6 * 60 * 1000; // 6 minutes
export const INACTIVITE_DELAI_SUPPLEMENTAIRE_MS = 60 * 1000; // +1 minute
// L'historique (création, changement d'état, transfert…) est écrit par le backend.
