import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/security/jwt.strategy.js';
import { ROLE_ADMIN, aRole } from '../common/security/role-utils.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCommentaireDto } from './dto/create-commentaire.dto.js';
import { UpdateCommentaireDto } from './dto/update-commentaire.dto.js';

@Injectable()
export class CommentaireService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTache(idTache: bigint) {
    const tache = await this.prisma.tache.findUnique({ where: { id_tache: idTache } });
    if (!tache) throw new NotFoundException(`Tâche ${idTache} introuvable`);

    return this.prisma.commentaire.findMany({
      where: { id_tache: idTache },
      orderBy: { date_creation: 'desc' },
    });
  }

  async create(idTache: bigint, dto: CreateCommentaireDto & { id_utilisateur: number }) {
    const tache = await this.prisma.tache.findUnique({ where: { id_tache: idTache } });
    if (!tache) throw new NotFoundException(`Tâche ${idTache} introuvable`);

    try {
      return await this.prisma.commentaire.create({
        data: {
          id_tache: idTache,
          id_utilisateur: BigInt(dto.id_utilisateur),
          contenu: dto.contenu,
          statut: dto.statut ?? 'ACTIF',
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException('L’utilisateur indiqué n’existe pas.');
      }
      throw error;
    }
  }

  async update(id: bigint, dto: UpdateCommentaireDto, user: AuthenticatedUser) {
    const commentaire = await this.prisma.commentaire.findUnique({
      where: { id_commentaire: id },
    });
    if (!commentaire) throw new NotFoundException(`Commentaire ${id} introuvable`);
    if (commentaire.id_utilisateur !== user.id_utilisateur && !aRole(user, ROLE_ADMIN)) {
      throw new ForbiddenException('Seul l’auteur du commentaire peut le modifier.');
    }

    return this.prisma.commentaire.update({
      where: { id_commentaire: id },
      data: {
        ...(dto.contenu !== undefined && { contenu: dto.contenu }),
        ...(dto.statut !== undefined && { statut: dto.statut }),
        date_modification: new Date(),
      },
    });
  }
}
