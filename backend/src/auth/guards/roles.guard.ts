import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUser } from '../auth-user.interface.js';
import { ALLOW_SELF_KEY, ROLES_KEY } from '../decorators/roles.decorator.js';

/** "Chef de projet" / "chef_de_projet" / "Chef-Projet" -> forme comparable. */
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

/**
 * Guard global (exécuté après JwtAuthGuard). Sans @Roles, il ne fait rien.
 * Avec @Roles : le rôle de l'utilisateur doit figurer dans la liste ;
 * avec @AllowSelf('id') en plus, l'utilisateur ciblé par :id est aussi accepté.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user: AuthUser | undefined = request.user;
    if (!user) return true; // route publique : rien à contrôler

    const allowed = roles.map(normalizeRole);
    if (allowed.includes(normalizeRole(user.nom_role))) return true;

    const selfParam = this.reflector.getAllAndOverride<string>(ALLOW_SELF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (selfParam && String(request.params?.[selfParam]) === String(user.id_utilisateur)) {
      return true;
    }

    throw new ForbiddenException(
      "Accès refusé : votre rôle ne permet pas d'effectuer cette action.",
    );
  }
}
