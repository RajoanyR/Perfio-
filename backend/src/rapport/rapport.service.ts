import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/security/jwt.strategy.js';
import { ROLES_GESTION, aRole } from '../common/security/role-utils.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateRapportDto } from './dto/create-rapport.dto.js';

@Injectable()
export class RapportService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.rapport.findMany({
      orderBy: { date_generation: 'desc' },
    });
  }

  async findByUtilisateur(idUtilisateur: bigint) {
    return this.prisma.rapport.findMany({
      where: { id_utilisateur: idUtilisateur },
      orderBy: { date_generation: 'desc' },
    });
  }

  async create(dto: CreateRapportDto & { id_utilisateur: number }) {
    try {
      return await this.prisma.rapport.create({
        data: {
          id_utilisateur: BigInt(dto.id_utilisateur),
          type: dto.type,
          format: dto.format,
          periode_debut: dto.periode_debut ? new Date(dto.periode_debut) : undefined,
          periode_fin: dto.periode_fin ? new Date(dto.periode_fin) : undefined,
          chemin_fichier: dto.chemin_fichier,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException('L’utilisateur indiqué n’existe pas.');
      }
      throw error;
    }
  }

  async findOne(id: bigint, user: AuthenticatedUser) {
    const rapport = await this.prisma.rapport.findUnique({
      where: { id_rapport: id },
    });
    if (!rapport) throw new NotFoundException(`Rapport ${id} introuvable`);
    if (rapport.id_utilisateur !== user.id_utilisateur && !aRole(user, ...ROLES_GESTION)) {
      throw new ForbiddenException('Ce rapport ne vous appartient pas.');
    }
    return rapport;
  }
}
