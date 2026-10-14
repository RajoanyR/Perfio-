import { ForbiddenException } from '@nestjs/common';
import { TacheService } from './tache.service.js';

const gestionnaire = (nom_role: string, id = 1n) =>
  ({ id_utilisateur: id, role: { nom_role } }) as any;

function fabrique(tache: any) {
  const tx = {
    tache: { update: vi.fn().mockResolvedValue({ ...tache, etat: 'EN_COURS' }) },
    historique_tache: {
      create: vi.fn().mockResolvedValue({}),
      findFirst: vi.fn().mockResolvedValue({ id_historique: 10n }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      count: vi.fn().mockResolvedValue(0),
    },
    transfert_tache: { create: vi.fn().mockResolvedValue({ id_transfert: 1n }) },
    utilisateur: {
      findMany: vi.fn().mockResolvedValue([
        { id_utilisateur: 7n, nom: 'RAKOTO', prenom: 'Jean' },
        { id_utilisateur: 9n, nom: 'RABE', prenom: 'Andry' },
      ]),
    },
    equipe: { findMany: vi.fn().mockResolvedValue([{ id_equipe: 2n, nom_equipe: 'Equipe A' }]) },
  };
  const prisma = {
    tache: { findUnique: vi.fn().mockResolvedValue(tache) },
    $transaction: vi.fn(async (fn: any) => fn(tx)),
  };
  return { service: new TacheService(prisma as any), tx };
}

const tache = { id_tache: 1n, id_responsable: 7n, id_equipe: 2n, etat: 'A_FAIRE', titre: 'T' };

describe('TacheService', () => {
  it("changerEtat n'écrit pas de doublon : il attribue l'auteur à la ligne du trigger", async () => {
    const { service, tx } = fabrique(tache);
    await service.changerEtat(1n, 'EN_COURS', gestionnaire('MANAGER', 3n));

    expect(tx.historique_tache.create).not.toHaveBeenCalled();
    expect(tx.historique_tache.updateMany).toHaveBeenCalledTimes(1);
    const arg = tx.historique_tache.updateMany.mock.calls[0][0];
    expect(arg.where).toEqual({ id_tache: 1n, id_historique: { gt: 10n }, id_utilisateur: null });
    expect(arg.data).toEqual({ id_utilisateur: 3n });
  });

  it("autorise le responsable de la tâche à changer l'état", async () => {
    const { service } = fabrique(tache);
    await expect(
      service.changerEtat(1n, 'EN_COURS', gestionnaire('COLLABORATEUR', 7n)),
    ).resolves.toBeDefined();
  });

  it("refuse un collaborateur qui n'est pas responsable", async () => {
    const { service } = fabrique(tache);
    await expect(
      service.changerEtat(1n, 'EN_COURS', gestionnaire('COLLABORATEUR', 8n)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("transfert : l'auteur vient du JWT et l'historique contient les noms", async () => {
    const { service, tx } = fabrique(tache);
    await service.transfert(
      1n,
      { nouveau_responsable: 9, nouvelle_equipe: 2, motif: 'Surcharge' },
      gestionnaire('CHEF_PROJET', 4n),
    );
    expect(tx.transfert_tache.create.mock.calls[0][0].data.utilisateur_transfert).toBe(4n);
    const histo = tx.historique_tache.create.mock.calls[0][0].data;
    expect(histo.action).toBe('TACHE_TRANSFEREE');
    expect(histo.description).toContain('Jean RAKOTO');
    expect(histo.description).toContain('Andry RABE');
  });
});
