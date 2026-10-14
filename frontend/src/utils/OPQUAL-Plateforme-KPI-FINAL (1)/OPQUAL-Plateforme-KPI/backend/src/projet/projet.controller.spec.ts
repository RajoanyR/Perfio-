import { ProjetController } from './projet.controller.js';

describe('ProjetController', () => {
  it('should be defined', () => {
    expect(new ProjetController({} as any)).toBeDefined();
  });
});
