import { ForbiddenException } from '@nestjs/common';
import { UtilisateurService } from './utilisateur.service.js';

const user = (nom_role: string, id = 1n) =>
  ({ id_utilisateur: id, role: { nom_role } }) as any;

function fabrique() {
  const prisma = {
    utilisateur: {
      findUnique: vi.fn().mockResolvedValue({
        id_utilisateur: 2n,
        role: { nom_role: 'COLLABORATEUR' },
      }),
      update: vi.fn().mockResolvedValue({}),
    },
    role: { findUnique: vi.fn().mockResolvedValue({ nom_role: 'ADMIN' }) },
  };
  return { service: new UtilisateurService(prisma as any), prisma };
}

describe('UtilisateurService', () => {
  it('should be defined', () => {
    expect(fabrique().service).toBeDefined();
  });

  it("un collaborateur ne peut pas changer son propre rôle (escalade de privilèges)", async () => {
    const { service } = fabrique();
    await expect(
      service.update(2n, { id_role: 1 } as any, user('COLLABORATEUR', 2n)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('un collaborateur ne peut pas modifier un autre utilisateur', async () => {
    const { service } = fabrique();
    await expect(
      service.update(2n, { telephone: '0' } as any, user('COLLABORATEUR', 3n)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('un collaborateur peut modifier son thème', async () => {
    const { service } = fabrique();
    await expect(
      service.update(2n, { theme: 'sombre' } as any, user('COLLABORATEUR', 2n)),
    ).resolves.toBeDefined();
  });

  it("un manager ne peut pas attribuer le rôle administrateur", async () => {
    const { service } = fabrique();
    await expect(
      service.update(2n, { id_role: 1 } as any, user('MANAGER', 5n)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
