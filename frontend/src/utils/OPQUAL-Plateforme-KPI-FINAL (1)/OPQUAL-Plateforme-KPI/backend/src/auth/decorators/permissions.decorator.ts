import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Exige que le rôle de l'utilisateur possède TOUTES les permissions indiquées
 * (permission.code_permission liée au rôle via role_permission).
 * Exemple : @Permissions('PROJET_CREER')
 */
export const Permissions = (...codes: string[]) =>
  SetMetadata(PERMISSIONS_KEY, codes);
