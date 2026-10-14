import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateHistoriqueTacheDto } from './dto/create-historique-tache.dto.js';

@Injectable()
export class HistoriqueTacheService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTache(idTache: bigint) {
    const tache = await this.prisma.tache.findUnique({ where: { id_tache: idTache } });
    if (!tache) throw new NotFoundException(`Tâche ${idTache} introuvable`);

    return this.prisma.historique_tache.findMany({
      where: { id_tache: idTache },
      orderBy: { date_action: 'desc' },
    });
  }

  async create(idTache: bigint, dto: CreateHistoriqueTacheDto & { id_utilisateur: number }) {
    const tache = await this.prisma.tache.findUnique({ where: { id_tache: idTache } });
    if (!tache) throw new NotFoundException(`Tâche ${idTache} introuvable`);

    try {
      return await this.prisma.historique_tache.create({
        data: {
          id_tache: idTache,
          id_utilisateur: BigInt(dto.id_utilisateur),
          action: dto.action,
          description: dto.description,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException('L’utilisateur indiqué n’existe pas.');
      }
      throw error;
    }
  }
}
