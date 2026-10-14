import { AuthService } from './auth.service.js';

describe('AuthService.logout', () => {
  it('ferme la session du token (statut FERMEE + date_deconnexion)', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const service = new AuthService({ session: { updateMany } } as any, {} as any);

    const res = await service.logout({
      id_utilisateur: 3n,
      id_session: 42n,
    } as any);

    expect(updateMany).toHaveBeenCalledTimes(1);
    const arg = updateMany.mock.calls[0][0];
    expect(arg.where).toEqual({
      id_session: 42n,
      id_utilisateur: 3n,
      statut: 'ACTIVE',
    });
    expect(arg.data.statut).toBe('FERMEE');
    expect(arg.data.date_deconnexion).toBeInstanceOf(Date);
    expect(res.session_fermee).toBe(true);
  });
});
