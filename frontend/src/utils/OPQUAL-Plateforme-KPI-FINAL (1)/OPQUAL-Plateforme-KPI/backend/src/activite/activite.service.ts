import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateActiviteDto } from './dto/create-activite.dto.js';

@Injectable()
export class ActiviteService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTache(idTache: bigint) {
    const tache = await this.prisma.tache.findUnique({ where: { id_tache: idTache } });
    if (!tache) throw new NotFoundException(`Tâche ${idTache} introuvable`);

    return this.prisma.activite.findMany({
      where: { id_tache: idTache },
      orderBy: { date_activite: 'desc' },
    });
  }

  async create(idTache: bigint, dto: CreateActiviteDto & { id_utilisateur: number }) {
    const tache = await this.prisma.tache.findUnique({ where: { id_tache: idTache } });
    if (!tache) throw new NotFoundException(`Tâche ${idTache} introuvable`);

    try {
      return await this.prisma.activite.create({
        data: {
          id_tache: idTache,
          id_utilisateur: BigInt(dto.id_utilisateur),
          description: dto.description,
          temps_passe: dto.temps_passe,
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
