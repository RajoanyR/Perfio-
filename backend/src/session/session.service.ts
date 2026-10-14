import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedUser } from '../common/security/jwt.strategy.js';
import { ROLE_ADMIN, aRole } from '../common/security/role-utils.js';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUtilisateur(idUtilisateur: bigint) {
    return this.prisma.session.findMany({
      where: { id_utilisateur: idUtilisateur },
      select: {
        id_session: true,
        id_utilisateur: true,
        date_connexion: true,
        derniere_activite: true,
        date_deconnexion: true,
        statut: true,
      },
      orderBy: { date_connexion: 'desc' },
    });
  }

  async fermer(id: bigint, user: AuthenticatedUser) {
    const s = await this.prisma.session.findUnique({ where: { id_session: id } });
    if (!s) throw new NotFoundException(`Session ${id} introuvable`);

    if (s.id_utilisateur !== user.id_utilisateur && !aRole(user, ROLE_ADMIN)) {
      throw new ForbiddenException('Vous ne pouvez fermer que vos propres sessions.');
    }

    return this.prisma.session.update({
      where: { id_session: id },
      data: { statut: 'FERMEE', date_deconnexion: new Date() },
    });
  }
}
