import { ForbiddenException } from '@nestjs/common';
import type { AuthenticatedUser } from './jwt.strategy.js';

/**
 * "Chef de projet" / "chef_de_projet" / "CHEF-PROJET" -> forme comparable.
 * Insensible à la casse, aux accents, aux espaces et aux séparateurs.
 */
export function normalizeRole(value: string): string {
  const base = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  const aliases: Record<string, string> = {
    admin: 'administrateur',
    administrator: 'administrateur',
    chefprojet: 'chefdeprojet',
  };

  return aliases[base] ?? base;
}

// Noms de rôles fonctionnels (comparés après normalisation).
export const ROLE_ADMIN = 'administrateur';
export const ROLE_MANAGER = 'manager';
export const ROLE_CHEF_PROJET = 'chef de projet';

/** Rôles autorisés à gérer projets, tâches, équipes et transferts. */
export const ROLES_GESTION = [ROLE_ADMIN, ROLE_MANAGER, ROLE_CHEF_PROJET];
/** Rôles autorisés à gérer les comptes utilisateurs. */
export const ROLES_UTILISATEURS = [ROLE_ADMIN, ROLE_MANAGER];

export function aRole(user: AuthenticatedUser, ...roles: string[]): boolean {
  const current = normalizeRole(user.role.nom_role);
  return roles.map(normalizeRole).includes(current);
}

/**
 * L'identité de l'acteur vient TOUJOURS du JWT. Si le client envoie un
 * id_utilisateur dans le corps, il doit correspondre à l'utilisateur connecté.
 */
export function actorId(user: AuthenticatedUser, claimed?: number): number {
  if (claimed !== undefined && BigInt(claimed) !== user.id_utilisateur) {
    throw new ForbiddenException(
      "id_utilisateur ne correspond pas à l'utilisateur connecté.",
    );
  }
  return Number(user.id_utilisateur);
}
