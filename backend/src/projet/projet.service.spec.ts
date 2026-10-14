import { ProjetService } from './projet.service.js';

describe('ProjetService', () => {
  it('should be defined', () => {
    expect(new ProjetService({} as any)).toBeDefined();
  });
});
