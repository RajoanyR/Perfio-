/**
 * Droits d'affichage côté frontend.
 *
 * Le backend applique réellement les rôles (@Roles + RolesGuard, contrôles de propriété
 * dans les services). Ces droits ne servent qu'à adapter ce qui est AFFICHÉ, d'après le
 * nom du rôle renvoyé par GET /roles/:id ; le backend reste l'autorité finale.
 *
 * Si vos rôles s'appellent autrement, ajustez uniquement les motifs ci-dessous.
 */
const normaliser = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export function droits(role) {
  const nom = normaliser(role?.nom_role);
  const admin = nom.includes('admin');
  const manager = nom.includes('manager');
  const chef = nom.includes('chef');
  return {
    estAdmin: admin,
    estManager: manager,
    estChefProjet: chef,
    // Créer/modifier projets, tâches, équipes ; transférer une tâche
    peutGerer: admin || manager || chef,
    // Créer/modifier/désactiver des utilisateurs
    peutGererUtilisateurs: admin || manager,
    // Rôles, permissions, entreprise
    peutAdministrer: admin,
  };
}
