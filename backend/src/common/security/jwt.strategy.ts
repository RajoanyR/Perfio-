import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface AuthenticatedUser {
  id_utilisateur: bigint;
  email: string;
  id_role: bigint;
  id_equipe: bigint;
  role: {
    id_role: bigint;
    nom_role: string;
  };
  permissions: string[];
  id_session: bigint;
}

/** Durée d'inactivité serveur par défaut (le frontend avertit à 6 min, déconnecte à 7 min). */
const DEFAULT_INACTIVITY_MINUTES = 10;
/** Délai minimal entre deux écritures de session.derniere_activite. */
const TOUCH_INTERVAL_MS = 30_000;

@Injectable()
export class JwtStrategy {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async validateToken(token: string): Promise<AuthenticatedUser> {
    const secret = this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new UnauthorizedException('JWT_SECRET n’est pas configuré.');
    }

    let payload: {
      sub?: number | string;
      email?: string;
      id_role?: number | string;
      id_equipe?: number | string;
    };

    try {
      payload = await this.jwtService.verifyAsync(token, { secret });
    } catch (error: any) {
      if (error?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expiré. Veuillez vous reconnecter.');
      }
      throw new UnauthorizedException('Token JWT invalide.');
    }

    if (!payload.sub) {
      throw new UnauthorizedException('Token JWT invalide.');
    }

    let idUtilisateur: bigint;
    try {
      idUtilisateur = BigInt(payload.sub);
    } catch {
      throw new UnauthorizedException('Token JWT invalide.');
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');

    const session = await this.prisma.session.findUnique({
      where: { token_hash: tokenHash },
    });

    if (!session || session.statut !== 'ACTIVE' || session.date_deconnexion) {
      throw new UnauthorizedException('Session inactive ou expirée.');
    }

    if (session.id_utilisateur !== idUtilisateur) {
      throw new UnauthorizedException('Session invalide.');
    }

    // Inactivité côté serveur : une session sans activité trop longtemps est
    // fermée (colonnes existantes de la table session, aucune modification de schéma).
    const minutes = Number(
      this.configService.get<string>('SESSION_INACTIVITY_MINUTES') ??
        DEFAULT_INACTIVITY_MINUTES,
    );
    const maxInactiviteMs =
      (Number.isFinite(minutes) && minutes > 0
        ? minutes
        : DEFAULT_INACTIVITY_MINUTES) * 60_000;

    if (Date.now() - session.derniere_activite.getTime() > maxInactiviteMs) {
      await this.prisma.session.updateMany({
        where: { id_session: session.id_session, statut: 'ACTIVE' },
        data: { statut: 'FERMEE', date_deconnexion: new Date() },
      });
      throw new UnauthorizedException(
        "Session expirée pour cause d'inactivité. Veuillez vous reconnecter.",
      );
    }

    const user = await this.prisma.utilisateur.findUnique({
      where: { id_utilisateur: idUtilisateur },
      include: {
        role: {
          include: {
            role_permission: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user || user.statut !== 'ACTIF') {
      throw new UnauthorizedException('Utilisateur non autorisé.');
    }

    // Écriture limitée dans le temps (évite un UPDATE par requête).
    if (Date.now() - session.derniere_activite.getTime() > TOUCH_INTERVAL_MS) {
      await this.prisma.session.update({
        where: { id_session: session.id_session },
        data: { derniere_activite: new Date() },
      });
    }

    return {
      id_utilisateur: user.id_utilisateur,
      email: user.email,
      id_role: user.id_role,
      id_equipe: user.id_equipe,
      role: {
        id_role: user.role.id_role,
        nom_role: user.role.nom_role,
      },
      permissions: user.role.role_permission.map(
        ({ permission }) => permission.code_permission,
      ),
      id_session: session.id_session,
    };
  }
}
