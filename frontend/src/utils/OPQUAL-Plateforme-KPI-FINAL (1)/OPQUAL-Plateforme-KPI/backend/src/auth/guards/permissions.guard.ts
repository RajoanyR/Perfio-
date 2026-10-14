import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthUser } from '../auth-user.interface.js';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator.js';

/**
 * Guard global (après JwtAuthGuard). Sans @Permissions, il ne fait rien.
 * Utilise les tables existantes role_permission / permission.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const user: AuthUser | undefined = context.switchToHttp().getRequest().user;
    if (!user) return true;

    const rows = await this.prisma.role_permission.findMany({
      where: { id_role: user.id_role },
      select: { permission: { select: { code_permission: true } } },
    });
    const owned = new Set(rows.map((r) => r.permission.code_permission));

    if (required.every((code) => owned.has(code))) return true;

    throw new ForbiddenException(
      'Accès refusé : permission insuffisante pour cette action.',
    );
  }
}
