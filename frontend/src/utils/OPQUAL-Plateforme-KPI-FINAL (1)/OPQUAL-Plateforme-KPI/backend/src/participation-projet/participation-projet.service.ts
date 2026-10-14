import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateParticipationProjetDto } from './dto/create-participation-projet.dto.js';
import { UpdateParticipationProjetDto } from './dto/update-participation-projet.dto.js';

@Injectable()
export class ParticipationProjetService {
  constructor(private readonly prisma: PrismaService) {}

  async findByProjet(idProjet: bigint) {
    return this.prisma.participation_projet.findMany({
      where: { id_projet: idProjet },
      orderBy: { date_participation: 'desc' },
    });
  }

  async create(idProjet: bigint, dto: CreateParticipationProjetDto) {
    try {
      return await this.prisma.participation_projet.create({
        data: {
          id_projet: idProjet,
          id_utilisateur: BigInt(dto.id_utilisateur),
          statut: dto.statut ?? 'ACTIF',
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new BadRequestException('Cet utilisateur participe déjà à ce projet.');
      }
      if (error?.code === 'P2003') {
        throw new BadRequestException('Le projet ou l’utilisateur indiqué n’existe pas.');
      }
      throw error;
    }
  }

  async update(idProjet: bigint, idUtilisateur: bigint, dto: UpdateParticipationProjetDto) {
    try {
      return await this.prisma.participation_projet.update({
        where: {
          id_projet_id_utilisateur: {
            id_projet: idProjet,
            id_utilisateur: idUtilisateur,
          },
        },
        data: {
          ...(dto.statut !== undefined && { statut: dto.statut }),
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException('Participation au projet introuvable.');
      }
      throw error;
    }
  }
}
