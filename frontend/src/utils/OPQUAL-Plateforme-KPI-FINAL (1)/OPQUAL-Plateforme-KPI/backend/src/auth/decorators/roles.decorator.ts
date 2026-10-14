import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const ALLOW_SELF_KEY = 'allowSelfParam';

/**
 * Restreint une route aux rôles indiqués (comparaison sur role.nom_role,
 * insensible à la casse, aux accents, aux espaces et aux underscores).
 * Exemple : @Roles('administrateur', 'manager')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * À combiner avec @Roles : autorise aussi l'utilisateur dont l'id est égal
 * au paramètre de route indiqué (ex. @AllowSelf('id') sur /sessions/utilisateur/:id).
 */
export const AllowSelf = (param = 'id') => SetMetadata(ALLOW_SELF_KEY, param);
