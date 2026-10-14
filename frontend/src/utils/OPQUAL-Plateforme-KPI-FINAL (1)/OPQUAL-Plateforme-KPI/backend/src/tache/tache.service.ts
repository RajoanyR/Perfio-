import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import type { Prisma } from '../generated/prisma/client.js';
import { CreateTacheDto } from './dto/create-tache.dto.js';
import { UpdateTacheDto } from './dto/update-tache.dto.js';
import { TransfertTacheDto } from './dto/transfert-tache.dto.js';
import { LIBELLES_ETAT } from './tache-etat.js';
import type { AuthenticatedUser } from '../common/security/jwt.strategy.js';
import { ROLES_GESTION, aRole } from '../common/security/role-utils.js';

const libelleEtat = (etat: string) => LIBELLES_ETAT[etat] ?? etat;

// Client de transaction Prisma (celui reçu par prisma.$transaction(async (tx) => …)).
type Tx = Prisma.TransactionClient;

/**
 * La base possède un trigger (trg_historiser_etat_tache) qui écrit déjà la ligne
 * d'historique d'un changement d'état, mais sans auteur. On ne crée donc PAS de seconde ligne :
 * on repère la dernière ligne d'historique avant la modification, puis on attribue à
 * l'utilisateur connecté les lignes automatiques apparues pendant la transaction.
 */
async function dernierIdHistorique(tx: Tx, idTache: bigint): Promise<bigint> {
  const derniere = await tx.historique_tache.findFirst({
    where: { id_tache: idTache },
    orderBy: { id_historique: 'desc' },
    select: { id_historique: true },
  });
  return derniere?.id_historique ?? 0n;
}

async function attribuerLignesAutomatiques(tx: Tx, idTache: bigint, apresId: bigint, user: AuthenticatedUser) {
  await tx.historique_tache.updateMany({
    where: { id_tache: idTache, id_historique: { gt: apresId }, id_utilisateur: null },
    data: { id_utilisateur: user.id_utilisateur },
  });
}

const nomDe = (u?: { prenom: string; nom: string }) => (u ? `${u.prenom} ${u.nom}`.trim() : null);

@Injectable()
export class TacheService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================
  // CREER UNE TACHE (+ historique dans la même transaction)
  // =========================================================

  async create(dto: CreateTacheDto, user: AuthenticatedUser) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const tache = await tx.tache.create({
          data: {
            id_projet: BigInt(dto.id_projet),
            id_responsable: BigInt(dto.id_responsable),
            id_equipe: BigInt(dto.id_equipe),
            titre: dto.titre,
            description: dto.description,
            priorite: dto.priorite ?? 'NORMALE',
            etat: dto.etat ?? 'A_FAIRE',
            temps_estime: dto.temps_estime ?? 0,
            date_debut: dto.date_debut ? new Date(dto.date_debut) : undefined,
            date_limite: dto.date_limite
              ? new Date(dto.date_limite)
              : undefined,
            date_terminaison: dto.date_terminaison
              ? new Date(dto.date_terminaison)
              : undefined,
          },
        });

        // Évite un doublon si la base écrit déjà une ligne de création.
        const dejaNotee = await tx.historique_tache.count({
          where: { id_tache: tache.id_tache, action: { contains: 'creation', mode: 'insensitive' } },
        });
        if (dejaNotee === 0) {
          await tx.historique_tache.create({
            data: {
              id_tache: tache.id_tache,
              id_utilisateur: user.id_utilisateur,
              action: 'Creation',
              description: `Tâche « ${tache.titre} » créée (état : ${libelleEtat(tache.etat)}).`,
            },
          });
        } else {
          await tx.historique_tache.updateMany({
            where: { id_tache: tache.id_tache, id_utilisateur: null },
            data: { id_utilisateur: user.id_utilisateur },
          });
        }

        return tache;
      });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException(
          'Un projet, responsable ou équipe indiqué n’existe pas.',
        );
      }

      throw error;
    }
  }

  // =========================================================
  // LISTE DES TACHES
  // =========================================================

  async findAll() {
    return this.prisma.tache.findMany({
      orderBy: {
        date_creation: 'desc',
      },
    });
  }

  // =========================================================
  // RECUPERER UNE TACHE
  // =========================================================

  async findOne(id: bigint) {
    const tache = await this.prisma.tache.findUnique({
      where: {
        id_tache: id,
      },
    });

    if (!tache) {
      throw new NotFoundException(`Tâche avec l'identifiant ${id} introuvable`);
    }

    return tache;
  }

  // =========================================================
  // MODIFIER UNE TACHE (+ historique)
  // =========================================================

  async update(id: bigint, dto: UpdateTacheDto, user: AuthenticatedUser) {
    const avant = await this.findOne(id);

    const data: Record<string, unknown> = {};
    const champsModifies: string[] = [];

    const copier = (cle: keyof UpdateTacheDto, valeur: unknown) => {
      data[cle] = valeur;
      champsModifies.push(cle);
    };

    if (dto.id_projet !== undefined) copier('id_projet', BigInt(dto.id_projet));
    if (dto.id_responsable !== undefined)
      copier('id_responsable', BigInt(dto.id_responsable));
    if (dto.id_equipe !== undefined) copier('id_equipe', BigInt(dto.id_equipe));
    if (dto.titre !== undefined) copier('titre', dto.titre);
    if (dto.description !== undefined) copier('description', dto.description);
    if (dto.priorite !== undefined) copier('priorite', dto.priorite);
    if (dto.temps_estime !== undefined)
      copier('temps_estime', dto.temps_estime);
    if (dto.date_debut !== undefined)
      copier('date_debut', new Date(dto.date_debut));
    if (dto.date_limite !== undefined)
      copier('date_limite', new Date(dto.date_limite));

    const etatChange = dto.etat !== undefined && dto.etat !== avant.etat;
    if (dto.etat !== undefined) data.etat = dto.etat;

    // Cohérence de date_terminaison avec l'état (même règle que changerEtat).
    if (dto.date_terminaison !== undefined) {
      data.date_terminaison = new Date(dto.date_terminaison);
    } else if (etatChange && dto.etat === 'TERMINE') {
      data.date_terminaison = new Date();
    } else if (etatChange && avant.etat === 'TERMINE') {
      data.date_terminaison = null;
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const apresId = await dernierIdHistorique(tx, id);
        const tache = await tx.tache.update({
          where: { id_tache: id },
          data,
        });

        // Le changement d'état est historisé par le trigger de la base : on y met l'auteur.
        if (etatChange) await attribuerLignesAutomatiques(tx, id, apresId, user);

        if (champsModifies.length > 0) {
          await tx.historique_tache.create({
            data: {
              id_tache: id,
              id_utilisateur: user.id_utilisateur,
              action: 'TACHE_MODIFIEE',
              description: `Champs modifiés : ${champsModifies.join(', ')}.`,
            },
          });
        }

        return tache;
      });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException(
          'Le projet, responsable ou équipe indiqué n’existe pas.',
        );
      }

      throw error;
    }
  }

  // =========================================================
  // CHANGER L'ETAT (+ historique)
  // =========================================================

  async changerEtat(id: bigint, etat: string, user: AuthenticatedUser) {
    const avant = await this.findOne(id);
    this.verifierDroitSurEtat(avant.id_responsable, user);

    if (avant.etat === etat) {
      return avant;
    }

    return this.prisma.$transaction(async (tx) => {
      const apresId = await dernierIdHistorique(tx, id);
      const tache = await tx.tache.update({
        where: { id_tache: id },
        data: {
          etat,
          // TERMINE : on date la terminaison ; on quitte TERMINE : on la retire.
          ...(etat === 'TERMINE'
            ? { date_terminaison: new Date() }
            : avant.etat === 'TERMINE'
              ? { date_terminaison: null }
              : {}),
        },
      });

      await attribuerLignesAutomatiques(tx, id, apresId, user);

      return tache;
    });
  }

  // =========================================================
  // TERMINER UNE TACHE (+ historique)
  // =========================================================

  async terminer(id: bigint, user: AuthenticatedUser) {
    const avant = await this.findOne(id);
    this.verifierDroitSurEtat(avant.id_responsable, user);

    return this.prisma.$transaction(async (tx) => {
      const apresId = await dernierIdHistorique(tx, id);
      const tache = await tx.tache.update({
        where: { id_tache: id },
        data: {
          etat: 'TERMINE',
          date_terminaison: new Date(),
        },
      });

      await attribuerLignesAutomatiques(tx, id, apresId, user);

      return tache;
    });
  }

  // =========================================================
  // TRANSFERER UNE TACHE (transfert + tâche + historique, une seule transaction)
  // =========================================================

  async transfert(id: bigint, dto: TransfertTacheDto, user: AuthenticatedUser) {
    const tache = await this.findOne(id);

    const nouveauResponsable = BigInt(dto.nouveau_responsable);
    const nouvelleEquipe = BigInt(dto.nouvelle_equipe);

    if (
      tache.id_responsable === nouveauResponsable &&
      tache.id_equipe === nouvelleEquipe
    ) {
      throw new BadRequestException(
        'La tâche possède déjà ce responsable et cette équipe.',
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        // A. Enregistrer le transfert (l'auteur vient du JWT)
        const transfert = await tx.transfert_tache.create({
          data: {
            id_tache: id,
            ancien_responsable: tache.id_responsable,
            nouveau_responsable: nouveauResponsable,
            ancienne_equipe: tache.id_equipe,
            nouvelle_equipe: nouvelleEquipe,
            utilisateur_transfert: user.id_utilisateur,
            motif: dto.motif,
          },
        });

        // B. Modifier la tâche
        const tacheModifiee = await tx.tache.update({
          where: { id_tache: id },
          data: {
            id_responsable: nouveauResponsable,
            id_equipe: nouvelleEquipe,
          },
        });

        // C. Historique métier (avec les noms, pas les identifiants)
        const [personnes, equipes] = await Promise.all([
          tx.utilisateur.findMany({
            where: { id_utilisateur: { in: [tache.id_responsable, nouveauResponsable] } },
            select: { id_utilisateur: true, nom: true, prenom: true },
          }),
          tx.equipe.findMany({
            where: { id_equipe: { in: [tache.id_equipe, nouvelleEquipe] } },
            select: { id_equipe: true, nom_equipe: true },
          }),
        ]);
        const personne = (idU: bigint) => nomDe(personnes.find((u) => u.id_utilisateur === idU)) ?? `#${idU}`;
        const equipe = (idE: bigint) => equipes.find((e) => e.id_equipe === idE)?.nom_equipe ?? `#${idE}`;

        await tx.historique_tache.create({
          data: {
            id_tache: id,
            id_utilisateur: user.id_utilisateur,
            action: 'TACHE_TRANSFEREE',
            description:
              `Responsable : ${personne(tache.id_responsable)} → ${personne(nouveauResponsable)} ; ` +
              `équipe : ${equipe(tache.id_equipe)} → ${equipe(nouvelleEquipe)}. Motif : ${dto.motif}`,
          },
        });

        return { transfert, tache: tacheModifiee };
      });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException(
          'Le nouveau responsable ou la nouvelle équipe n’existe pas.',
        );
      }

      if (error?.code === 'P2025') {
        throw new NotFoundException(`Tâche avec l'identifiant ${id} introuvable`);
      }

      throw error;
    }
  }

  // =========================================================
  // HISTORIQUE DES TRANSFERTS D'UNE TACHE
  // =========================================================

  async transferts(id: bigint) {
    await this.findOne(id);

    return this.prisma.transfert_tache.findMany({
      where: { id_tache: id },
      orderBy: { date_transfert: 'desc' },
    });
  }

  // =========================================================
  // Droit de changer l'état : rôles de gestion OU responsable de la tâche
  // =========================================================

  private verifierDroitSurEtat(
    idResponsable: bigint,
    user: AuthenticatedUser,
  ): void {
    if (aRole(user, ...ROLES_GESTION)) return;
    if (idResponsable === user.id_utilisateur) return;

    throw new ForbiddenException(
      "Seuls le responsable de la tâche et les rôles de gestion peuvent modifier son état.",
    );
  }
}
