import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUtilisateurDto } from './dto/create-utilisateur.dto.js';
import { UpdateUtilisateurDto } from './dto/update-utilisateur.dto.js';
import * as bcrypt from 'bcrypt';
import type { AuthenticatedUser } from '../common/security/jwt.strategy.js';
import {
  ROLES_UTILISATEURS,
  ROLE_ADMIN,
  aRole,
  normalizeRole,
} from '../common/security/role-utils.js';

/** Champs qu'un utilisateur simple peut modifier sur SON propre profil. */
const CHAMPS_PROFIL = new Set([
  'nom',
  'prenom',
  'email',
  'mot_de_passe',
  'telephone',
  'poste',
  'theme',
]);

@Injectable()
export class UtilisateurService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.utilisateur.findMany({
      omit: { mot_de_passe: true },
    });
  }

  /**
   * Règles d'accès (appliquées côté serveur, pas seulement dans React) :
   *  - administrateur : tout ;
   *  - manager : tout, SAUF toucher à un compte administrateur ou attribuer ce rôle ;
   *  - autre utilisateur : uniquement son propre profil, champs limités
   *    (jamais rôle, équipe, entreprise, statut ni capacité).
   */
  private async verifierDroitsModification(
    cible: bigint,
    dto: UpdateUtilisateurDto | null,
    user: AuthenticatedUser,
  ) {
    const gestionnaire = aRole(user, ...ROLES_UTILISATEURS);

    if (!gestionnaire) {
      if (cible !== user.id_utilisateur) {
        throw new ForbiddenException('Vous ne pouvez modifier que votre propre profil.');
      }
      const interdits = Object.keys(dto ?? {}).filter((k) => !CHAMPS_PROFIL.has(k));
      if (interdits.length > 0) {
        throw new ForbiddenException(
          `Modification non autorisée pour votre rôle : ${interdits.join(', ')}.`,
        );
      }
      return;
    }

    if (aRole(user, ROLE_ADMIN)) return;

    // Manager : protection des comptes administrateurs
    const ciblee = await this.prisma.utilisateur.findUnique({
      where: { id_utilisateur: cible },
      select: { role: { select: { nom_role: true } } },
    });
    if (ciblee && normalizeRole(ciblee.role.nom_role) === ROLE_ADMIN) {
      throw new ForbiddenException('Seul un administrateur peut modifier un compte administrateur.');
    }
    if (dto?.id_role !== undefined) {
      const nouveau = await this.prisma.role.findUnique({
        where: { id_role: BigInt(dto.id_role) },
        select: { nom_role: true },
      });
      if (nouveau && normalizeRole(nouveau.nom_role) === ROLE_ADMIN) {
        throw new ForbiddenException('Seul un administrateur peut attribuer le rôle administrateur.');
      }
    }
  }

  async update(id: bigint, dto: UpdateUtilisateurDto, user: AuthenticatedUser) {
    await this.findOne(Number(id));
    await this.verifierDroitsModification(id, dto, user);

    if (dto.email) {
      const existing = await this.prisma.utilisateur.findFirst({
        where: {
          email: dto.email,
          NOT: { id_utilisateur: id },
        },
      });

      if (existing) {
        throw new ConflictException('Cet email est déjà utilisé.');
      }
    }

    const { mot_de_passe, id_entreprise, id_role, id_equipe, ...fields } = dto;

    try {
      return await this.prisma.utilisateur.update({
        where: {
          id_utilisateur: id,
        },
        data: {
          ...fields,
          ...(id_entreprise !== undefined && {
            id_entreprise: BigInt(id_entreprise),
          }),
          ...(id_role !== undefined && {
            id_role: BigInt(id_role),
          }),
          ...(id_equipe !== undefined && {
            id_equipe: BigInt(id_equipe),
          }),
          ...(mot_de_passe !== undefined && {
            mot_de_passe: await bcrypt.hash(mot_de_passe, 10),
          }),
          date_modification: new Date(),
        },
        omit: { mot_de_passe: true },
      });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException(
          'L’entreprise, le rôle ou l’équipe indiqué(e) n’existe pas.',
        );
      }

      throw error;
    }
  }

  async findOne(id: number) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id_utilisateur: BigInt(id) },
      omit: { mot_de_passe: true },
    });

    if (!utilisateur) {
      throw new NotFoundException(
        `Utilisateur avec l'identifiant ${id} introuvable`,
      );
    }

    return utilisateur;
  }

  async desactiver(id: bigint, user: AuthenticatedUser) {
    await this.verifierDroitsModification(id, null, user);
    return this.prisma.utilisateur.update({
      where: {
        id_utilisateur: id,
      },
      data: {
        statut: 'INACTIF',
        date_modification: new Date(),
      },
      omit: { mot_de_passe: true },
    });
  }

  async activer(id: bigint, user: AuthenticatedUser) {
    await this.verifierDroitsModification(id, null, user);
    return this.prisma.utilisateur.update({
      where: {
        id_utilisateur: id,
      },
      data: {
        statut: 'ACTIF',
        date_modification: new Date(),
      },
      omit: { mot_de_passe: true },
    });
  }

  async create(dto: CreateUtilisateurDto, user: AuthenticatedUser) {
    // Seul un administrateur peut créer un compte administrateur.
    if (dto.id_role !== undefined && !aRole(user, ROLE_ADMIN)) {
      const role = await this.prisma.role.findUnique({
        where: { id_role: BigInt(dto.id_role) },
        select: { nom_role: true },
      });
      if (role && normalizeRole(role.nom_role) === ROLE_ADMIN) {
        throw new ForbiddenException('Seul un administrateur peut créer un compte administrateur.');
      }
    }

    const existant = await this.prisma.utilisateur.findUnique({
      where: { email: dto.email },
    });

    if (existant) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    if (dto.id_equipe === undefined) {
      throw new BadRequestException(
        'id_equipe est obligatoire car la colonne correspondante est requise par la base de données.',
      );
    }

    const motDePasseHash = await bcrypt.hash(dto.mot_de_passe, 10);

    try {
      return await this.prisma.utilisateur.create({
        data: {
          id_entreprise: BigInt(dto.id_entreprise),
          id_role: BigInt(dto.id_role),
          id_equipe: BigInt(dto.id_equipe),
          nom: dto.nom,
          prenom: (dto.prenom ?? '').trim(),
          email: dto.email,
          mot_de_passe: motDePasseHash,
          telephone: dto.telephone ?? null,
          poste: dto.poste,
          theme: dto.theme ?? 'clair',
          statut: dto.statut ?? 'ACTIF',
          capacite_hebdomadaire_heures:
            dto.capacite_hebdomadaire_heures ?? 40,
        },
        omit: { mot_de_passe: true },
      });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException(
          'L’entreprise, le rôle ou l’équipe indiqué(e) n’existe pas.',
        );
      }

      throw error;
    }
  }
}
