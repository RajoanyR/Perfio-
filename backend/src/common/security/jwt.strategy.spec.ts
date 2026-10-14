import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy.js';
import { createHash } from 'node:crypto';

function fabrique(session: any, maxMinutes?: string) {
  const prisma = {
    session: {
      findUnique: vi.fn().mockResolvedValue(session),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    utilisateur: {
      findUnique: vi.fn().mockResolvedValue({
        id_utilisateur: 1n,
        email: 'a@b.c',
        id_role: 1n,
        id_equipe: 1n,
        statut: 'ACTIF',
        role: { id_role: 1n, nom_role: 'MANAGER', role_permission: [] },
      }),
    },
  };
  const jwt = { verifyAsync: vi.fn().mockResolvedValue({ sub: 1 }) };
  const config = {
    get: (k: string) =>
      k === 'JWT_SECRET' ? 'secret' : k === 'SESSION_INACTIVITY_MINUTES' ? maxMinutes : undefined,
  };
  return { strategy: new JwtStrategy(jwt as any, config as any, prisma as any), prisma };
}

const session = (over: object) => ({
  id_session: 10n,
  id_utilisateur: 1n,
  token_hash: createHash('sha256').update('tok').digest('hex'),
  statut: 'ACTIVE',
  date_deconnexion: null,
  derniere_activite: new Date(),
  ...over,
});

describe('JwtStrategy.validateToken', () => {
  it('accepte une session ACTIVE récente', async () => {
    const { strategy } = fabrique(session({}));
    await expect(strategy.validateToken('tok')).resolves.toMatchObject({ id_session: 10n });
  });

  it('refuse un token dont la session est FERMEE (ancien JWT après logout)', async () => {
    const { strategy } = fabrique(session({ statut: 'FERMEE', date_deconnexion: new Date() }));
    await expect(strategy.validateToken('tok')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refuse un token sans session', async () => {
    const { strategy } = fabrique(null);
    await expect(strategy.validateToken('tok')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("ferme et refuse une session inactive depuis plus de la limite", async () => {
    const vieille = new Date(Date.now() - 11 * 60_000);
    const { strategy, prisma } = fabrique(session({ derniere_activite: vieille }));
    await expect(strategy.validateToken('tok')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.session.updateMany).toHaveBeenCalled();
  });

  it('respecte SESSION_INACTIVITY_MINUTES', async () => {
    const quasi = new Date(Date.now() - 4 * 60_000);
    const { strategy } = fabrique(session({ derniere_activite: quasi }), '3');
    await expect(strategy.validateToken('tok')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
