import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProjetDto } from './dto/create-projet.dto.js';
import { UpdateProjetDto } from './dto/update-projet.dto.js';

@Injectable()
export class ProjetService {
  constructor(private readonly prisma: PrismaService) {}

  // Créer un projet
  async create(dto: CreateProjetDto) {
    try {
      return await this.prisma.projet.create({
        data: {
          id_equipe: BigInt(dto.id_equipe),
          id_chef_projet: BigInt(dto.id_chef_projet),
          nom_projet: dto.nom_projet,
          code_projet: dto.code_projet,
          description: dto.description,
          priorite: dto.priorite,
          etat: dto.etat,
          date_debut: new Date(dto.date_debut),
          date_fin_prevue: new Date(dto.date_fin_prevue),
          date_fin_reelle: dto.date_fin_reelle
            ? new Date(dto.date_fin_reelle)
            : undefined,
          statut: dto.statut,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException(
          'Le code du projet existe déjà',
        );
      }

      if (error?.code === 'P2003') {
        throw new BadRequestException(
          "L'équipe ou le chef de projet indiqué n'existe pas",
        );
      }

      throw error;
    }
  }
  //Modifier les projets par ID
  async update(id: bigint, dto: UpdateProjetDto) {
  const projet = await this.prisma.projet.findUnique({
    where: {
      id_projet: id,
    },
  });

  if (!projet) {
    throw new NotFoundException(
      `Projet avec l'identifiant ${id} introuvable`,
    );
  }

  try {
    return await this.prisma.projet.update({
      where: {
        id_projet: id,
      },
      data: {
        ...(dto.id_equipe !== undefined && {
          id_equipe: BigInt(dto.id_equipe),
        }),

        ...(dto.id_chef_projet !== undefined && {
          id_chef_projet: BigInt(dto.id_chef_projet),
        }),

        ...(dto.nom_projet !== undefined && {
          nom_projet: dto.nom_projet,
        }),

        ...(dto.code_projet !== undefined && {
          code_projet: dto.code_projet,
        }),

        ...(dto.description !== undefined && {
          description: dto.description,
        }),

        ...(dto.priorite !== undefined && {
          priorite: dto.priorite,
        }),

        ...(dto.etat !== undefined && {
          etat: dto.etat,
        }),

        ...(dto.date_debut !== undefined && {
          date_debut: new Date(dto.date_debut),
        }),

        ...(dto.date_fin_prevue !== undefined && {
          date_fin_prevue: new Date(dto.date_fin_prevue),
        }),

        ...(dto.date_fin_reelle !== undefined && {
          date_fin_reelle: new Date(dto.date_fin_reelle),
        }),

        ...(dto.statut !== undefined && {
          statut: dto.statut,
        }),
      },
    });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      throw new ConflictException(
        'Le code du projet existe déjà',
      );
    }

    if (error?.code === 'P2003') {
      throw new BadRequestException(
        "L'équipe ou le chef de projet indiqué n'existe pas",
      );
    }

    throw error;
  }
}

  // Voir tous les projets
  async findAll() {
    return this.prisma.projet.findMany({
      orderBy: {
        date_creation: 'desc',
      },
    });
  }

  // Voir un projet par ID
  async findOne(id: bigint) {
    const projet = await this.prisma.projet.findUnique({
      where: {
        id_projet: id,
      },
    });

    if (!projet) {
      throw new NotFoundException(
        `Projet avec l'identifiant ${id} introuvable`,
      );
    }

    return projet;
  }
}