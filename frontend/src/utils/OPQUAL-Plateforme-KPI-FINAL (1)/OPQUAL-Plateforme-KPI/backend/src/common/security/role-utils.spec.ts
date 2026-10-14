import { ForbiddenException } from '@nestjs/common';
import { actorId, aRole, normalizeRole } from './role-utils.js';
import type { AuthenticatedUser } from './jwt.strategy.js';

const user = (nom_role: string): AuthenticatedUser => ({
  id_utilisateur: 5n,
  email: 'a@b.c',
  id_role: 1n,
  id_equipe: 1n,
  role: { id_role: 1n, nom_role },
  permissions: [],
  id_session: 9n,
});

describe('role-utils', () => {
  it('normalise les noms de rôles (casse, accents, séparateurs, alias)', () => {
    expect(normalizeRole('ADMIN')).toBe('administrateur');
    expect(normalizeRole('Administrateur')).toBe('administrateur');
    expect(normalizeRole('Chef de projet')).toBe('chefdeprojet');
    expect(normalizeRole('CHEF_PROJET')).toBe('chefdeprojet');
    expect(normalizeRole('Chef-de-Projet')).toBe('chefdeprojet');
  });

  it('aRole compare après normalisation', () => {
    expect(aRole(user('CHEF_PROJET'), 'chef de projet')).toBe(true);
    expect(aRole(user('COLLABORATEUR'), 'administrateur', 'manager')).toBe(false);
  });

  it("actorId renvoie l'id du JWT et refuse un id différent", () => {
    expect(actorId(user('MANAGER'))).toBe(5);
    expect(actorId(user('MANAGER'), 5)).toBe(5);
    expect(() => actorId(user('MANAGER'), 6)).toThrow(ForbiddenException);
  });
});
