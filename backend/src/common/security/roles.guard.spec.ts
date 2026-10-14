import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';
import { ALLOW_SELF_KEY, ROLES_KEY } from './roles.decorator.js';

function contexte(user: any, params: Record<string, string> = {}) {
  return {
    getHandler: () => 'handler',
    getClass: () => 'class',
    switchToHttp: () => ({ getRequest: () => ({ user, params }) }),
  } as any;
}

function guard(metadata: Record<string, unknown>) {
  const reflector = {
    getAllAndOverride: (cle: string) => metadata[cle],
  } as unknown as Reflector;
  return new RolesGuard(reflector);
}

const utilisateur = (nom_role: string, id = 1n) => ({
  id_utilisateur: id,
  role: { nom_role },
});

describe('RolesGuard', () => {
  it('laisse passer une route sans @Roles', () => {
    expect(guard({}).canActivate(contexte(utilisateur('COLLABORATEUR')))).toBe(true);
  });

  it('refuse un collaborateur sur une route réservée aux administrateurs', () => {
    const g = guard({ [ROLES_KEY]: ['administrateur'] });
    expect(() => g.canActivate(contexte(utilisateur('COLLABORATEUR')))).toThrow(
      ForbiddenException,
    );
  });

  it('accepte un rôle équivalent après normalisation (ADMIN = administrateur)', () => {
    const g = guard({ [ROLES_KEY]: ['administrateur'] });
    expect(g.canActivate(contexte(utilisateur('ADMIN')))).toBe(true);
  });

  it('@AllowSelf autorise l’utilisateur ciblé par le paramètre de route', () => {
    const g = guard({ [ROLES_KEY]: ['administrateur'], [ALLOW_SELF_KEY]: 'id' });
    expect(g.canActivate(contexte(utilisateur('COLLABORATEUR', 7n), { id: '7' }))).toBe(true);
    expect(() =>
      g.canActivate(contexte(utilisateur('COLLABORATEUR', 7n), { id: '8' })),
    ).toThrow(ForbiddenException);
  });
});
