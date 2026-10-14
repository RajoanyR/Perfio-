import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePieceJointeDto } from './dto/create-piece-jointe.dto.js';

@Injectable()
export class PieceJointeService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTache(idTache: bigint) {
    const tache = await this.prisma.tache.findUnique({ where: { id_tache: idTache } });
    if (!tache) throw new NotFoundException(`Tâche ${idTache} introuvable`);

    return this.prisma.piece_jointe.findMany({
      where: { id_tache: idTache },
      orderBy: { date_ajout: 'desc' },
    });
  }

  async create(idTache: bigint, dto: CreatePieceJointeDto & { id_utilisateur: number }) {
    const tache = await this.prisma.tache.findUnique({ where: { id_tache: idTache } });
    if (!tache) throw new NotFoundException(`Tâche ${idTache} introuvable`);

    try {
      return await this.prisma.piece_jointe.create({
        data: {
          id_tache: idTache,
          id_commentaire: dto.id_commentaire !== undefined ? BigInt(dto.id_commentaire) : undefined,
          id_utilisateur: BigInt(dto.id_utilisateur),
          nom_fichier: dto.nom_fichier,
          chemin_fichier: dto.chemin_fichier,
          type_fichier: dto.type_fichier,
          taille: dto.taille !== undefined ? BigInt(dto.taille) : undefined,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException(
          'La tâche, le commentaire ou l’utilisateur indiqué n’existe pas.',
        );
      }
      throw error;
    }
  }

  async findByCommentaire(idCommentaire: bigint) {
    const commentaire = await this.prisma.commentaire.findUnique({
      where: { id_commentaire: idCommentaire },
    });
    if (!commentaire) throw new NotFoundException(`Commentaire ${idCommentaire} introuvable`);

    return this.prisma.piece_jointe.findMany({
      where: { id_commentaire: idCommentaire },
      orderBy: { date_ajout: 'desc' },
    });
  }
}
