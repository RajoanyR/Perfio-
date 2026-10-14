import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { AuthUser } from '../auth-user.interface.js';

/** Délai minimal entre deux mises à jour de session.derniere_activite. */
const TOUCH_INTERVAL_MS = 60_000;

/**
 * Guard global : toutes les routes exigent `Authorization: Bearer <token>`
 * sauf celles marquées @Public().
 *
 * Vérifications :
 *  1. présence du header Bearer ;
 *  2. signature + expiration du JWT (JWT_SECRET) ;
 *  3. session correspondante (hash SHA-256 du token) existante et ACTIVE
 *     -> un token dont la session est fermée (logout) est refusé ;
 *  4. compte utilisateur toujours ACTIF.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException(
        'Token manquant. Utilisez le header Authorization: Bearer <access_token>.',
      );
    }

    try {
      await this.jwtService.verifyAsync(token);
    } catch (error: any) {
      if (error?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expiré. Veuillez vous reconnecter.');
      }
      throw new UnauthorizedException('Token invalide.');
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');

    const session = await this.prisma.session.findUnique({
      where: { token_hash: tokenHash },
    });

    if (!session || session.statut !== 'ACTIVE') {
      throw new UnauthorizedException('Session fermée ou inexistante. Veuillez vous reconnecter.');
    }

    const user = await this.prisma.utilisateur.findUnique({
      where: { id_utilisateur: session.id_utilisateur },
      select: {
        id_utilisateur: true,
        email: true,
        id_role: true,
        id_equipe: true,
        statut: true,
        role: { select: { nom_role: true } },
      },
    });

    if (!user || user.statut !== 'ACTIF') {
      throw new UnauthorizedException('Compte inexistant ou non actif.');
    }

    request.user = {
      id_utilisateur: user.id_utilisateur,
      id_session: session.id_session,
      email: user.email,
      id_role: user.id_role,
      id_equipe: user.id_equipe,
      nom_role: user.role.nom_role,
    } satisfies AuthUser;

    // Mise à jour de la dernière activité (non bloquante, limitée dans le temps)
    if (Date.now() - session.derniere_activite.getTime() > TOUCH_INTERVAL_MS) {
      this.prisma.session
        .update({
          where: { id_session: session.id_session },
          data: { derniere_activite: new Date() },
        })
        .catch(() => undefined);
    }

    return true;
  }

  private extractToken(request: any): string | undefined {
    const header: unknown = request?.headers?.authorization;
    if (typeof header !== 'string') return undefined;
    const [type, value] = header.split(' ');
    return type?.toLowerCase() === 'bearer' && value ? value : undefined;
  }
}
