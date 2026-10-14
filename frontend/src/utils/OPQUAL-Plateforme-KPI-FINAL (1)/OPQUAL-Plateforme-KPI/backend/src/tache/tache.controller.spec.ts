import { TacheController } from './tache.controller.js';

// Construction directe (sans injection Nest) : vitest/esbuild n'émet pas les
// métadonnées de décorateurs nécessaires à Test.createTestingModule.
describe('TacheController', () => {
  it('should be defined', () => {
    expect(new TacheController({} as any)).toBeDefined();
  });
});
