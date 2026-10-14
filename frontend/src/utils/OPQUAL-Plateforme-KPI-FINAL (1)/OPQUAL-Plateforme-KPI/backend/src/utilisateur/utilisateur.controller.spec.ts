import { UtilisateurController } from './utilisateur.controller.js';

describe('UtilisateurController', () => {
  it('should be defined', () => {
    expect(new UtilisateurController({} as any)).toBeDefined();
  });
});
