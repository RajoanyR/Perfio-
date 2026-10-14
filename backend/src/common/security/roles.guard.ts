import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALLOW_SELF_KEY, ROLES_KEY } from './roles.decorator.js';
import type { AuthenticatedUser } from './jwt.strategy.js';
import { normalizeRole } from './role-utils.js';

/**
 * Guard global (exécuté après JwtAuthGuard). Sans @Roles, il ne fait rien.
 * Avec @Roles : le rôle de l'utilisateur doit figurer dans la liste ;
 * avec @AllowSelf('id') en plus, l'utilisateur ciblé par :id est aussi accepté.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      params?: Record<string, string>;
    }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié.');
    }

    const allowed = requiredRoles.map(normalizeRole);
    if (allowed.includes(normalizeRole(user.role.nom_role))) {
      return true;
    }

    const selfParam = this.reflector.getAllAndOverride<string>(ALLOW_SELF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (
      selfParam &&
      String(request.params?.[selfParam]) === String(user.id_utilisateur)
    ) {
      return true;
    }

    throw new ForbiddenException('Rôle insuffisant pour cette ressource.');
  }
}
