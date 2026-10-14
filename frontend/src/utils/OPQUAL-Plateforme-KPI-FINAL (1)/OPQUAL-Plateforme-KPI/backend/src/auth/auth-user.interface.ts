/**
 * Utilisateur authentifié, attaché à `request.user` par JwtAuthGuard.
 * Les valeurs proviennent de la base (session + utilisateur + role),
 * pas uniquement du contenu du token : un changement de rôle ou une
 * désactivation de compte est donc pris en compte immédiatement.
 */
export interface AuthUser {
  id_utilisateur: bigint;
  id_session: bigint;
  email: string;
  id_role: bigint;
  id_equipe: bigint;
  nom_role: string;
}
